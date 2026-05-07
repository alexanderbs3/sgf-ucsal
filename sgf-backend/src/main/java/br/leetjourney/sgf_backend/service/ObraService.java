package br.leetjourney.sgf_backend.service;

import br.leetjourney.sgf_backend.dto.request.AtualizarStatusObraDTO;
import br.leetjourney.sgf_backend.dto.request.ObraRequestDTO;
import br.leetjourney.sgf_backend.dto.response.DashboardObraDTO;
import br.leetjourney.sgf_backend.dto.response.ObraResponseDTO;
import br.leetjourney.sgf_backend.dto.response.VistoriaTimelineDTO;
import br.leetjourney.sgf_backend.exception.RegraDeNegocioException;
import br.leetjourney.sgf_backend.exception.RecursoJaExisteException;
import br.leetjourney.sgf_backend.exception.RecursoNaoEncontradoException;
import br.leetjourney.sgf_backend.model.Item;
import br.leetjourney.sgf_backend.model.Obra;
import br.leetjourney.sgf_backend.model.StatusItem;
import br.leetjourney.sgf_backend.model.StatusObra;
import br.leetjourney.sgf_backend.repository.ItemRepository;
import br.leetjourney.sgf_backend.repository.ObraRepository;
import br.leetjourney.sgf_backend.repository.UsuarioRepository;
import br.leetjourney.sgf_backend.repository.VistoriaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import br.leetjourney.sgf_backend.model.AuditLog;
import br.leetjourney.sgf_backend.service.AuditService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ObraService {

    private static final Logger log = LoggerFactory.getLogger(ObraService.class);

    /**
     * Transições de status permitidas.
     * Chave = status atual → Valor = set de próximos status válidos.
     */
    private static final Map<StatusObra, Set<StatusObra>> TRANSICOES_VALIDAS = Map.of(
            StatusObra.PLANEJADA,    EnumSet.of(StatusObra.EM_ANDAMENTO),
            StatusObra.EM_ANDAMENTO, EnumSet.of(StatusObra.PARALISADA, StatusObra.CONCLUIDA),
            StatusObra.PARALISADA,   EnumSet.of(StatusObra.EM_ANDAMENTO),
            StatusObra.CONCLUIDA,    Collections.emptySet()   // terminal — sem transições
    );

    private final ObraRepository     obraRepository;
    private final ItemRepository     itemRepository;
    private final VistoriaRepository vistoriaRepository;
    private final AuditService       auditService;
    private final UsuarioRepository  usuarioRepository;

    public ObraService(ObraRepository obraRepository,
                       ItemRepository itemRepository,
                       VistoriaRepository vistoriaRepository,
                       AuditService auditService,
                       UsuarioRepository usuarioRepository) {
        this.obraRepository     = obraRepository;
        this.itemRepository     = itemRepository;
        this.vistoriaRepository = vistoriaRepository;
        this.auditService       = auditService;
        this.usuarioRepository  = usuarioRepository;
    }

    // ── Listagem com filtros ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ObraResponseDTO> listarTodas() {
        return obraRepository.findAll()
                .stream()
                .map(ObraResponseDTO::from)
                .toList();
    }

    /**
     * Busca obras com filtros opcionais de texto e status.
     *
     * @param q      texto livre pesquisado em código e descrição (nullable)
     * @param status filtro de status (nullable)
     */
    @Transactional(readOnly = true)
    public List<ObraResponseDTO> buscarComFiltros(String q, StatusObra status) {
        return obraRepository.buscarComFiltros(
                        (q != null && q.isBlank()) ? null : q,
                        status
                )
                .stream()
                .map(ObraResponseDTO::from)
                .toList();
    }

    // ── Busca por ID ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ObraResponseDTO buscarPorId(UUID id) {
        return ObraResponseDTO.from(buscarEntidade(id));
    }

    // ── Atualização completa (PUT) ────────────────────────────────────────────

    /**
     * Atualiza código, descrição e datas de uma obra existente.
     * O status NÃO é alterado aqui — use {@link #atualizarStatus}.
     *
     * Regras de negócio preservadas:
     * - Código único (exceto o próprio registro)
     * - Data de conclusão não pode ser anterior ao início
     */
    @Transactional
    public ObraResponseDTO atualizar(UUID id, ObraRequestDTO dto) {
        Obra obra = buscarEntidade(id);

        // Verifica unicidade do código, ignorando o próprio registro
        if (!obra.getCodigo().equalsIgnoreCase(dto.codigo())
                && obraRepository.existsByCodigo(dto.codigo())) {
            throw new RecursoJaExisteException(
                    "Já existe outra obra com o código: " + dto.codigo());
        }

        if (dto.dataPrevisaoConclusao() != null
                && dto.dataPrevisaoConclusao().isBefore(dto.dataInicio())) {
            throw new RegraDeNegocioException(
                    "Data de previsão de conclusão não pode ser anterior à data de início.");
        }

        obra.setCodigo(dto.codigo());
        obra.setDescricao(dto.descricao());
        obra.setDataInicio(dto.dataInicio());
        obra.setDataPrevisaoConclusao(dto.dataPrevisaoConclusao());
        // status preservado — alteração de status tem endpoint próprio (PATCH)

        log.info("Obra {} atualizada: código={} descrição={}", id, dto.codigo(), dto.descricao());
        return ObraResponseDTO.from(obraRepository.save(obra));
    }

    // ── Criação ───────────────────────────────────────────────────────────────

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
    public ObraResponseDTO salvar(ObraRequestDTO dto) {
        if (obraRepository.existsByCodigo(dto.codigo())) {
            throw new RecursoJaExisteException("Já existe uma obra com o código: " + dto.codigo());
        }
        if (dto.dataPrevisaoConclusao() != null
                && dto.dataPrevisaoConclusao().isBefore(dto.dataInicio())) {
            throw new RegraDeNegocioException(
                    "Data de previsão de conclusão não pode ser anterior à data de início.");
        }
        Obra obra = new Obra();
        obra.setCodigo(dto.codigo());
        obra.setDescricao(dto.descricao());
        obra.setDataInicio(dto.dataInicio());
        obra.setDataPrevisaoConclusao(dto.dataPrevisaoConclusao());
        // CORREÇÃO: status inicial sempre PLANEJADA — nunca vem do DTO.
        // Antes, o cliente podia criar obras diretamente com status CONCLUIDA,
        // bypassando toda a máquina de estados.
        obra.setStatus(StatusObra.PLANEJADA);

        Obra salva = obraRepository.save(obra);
        log.info("Obra criada: {} ({})", salva.getCodigo(), salva.getId());

        UUID usuarioId = resolverUsuarioId();
        auditService.registrar(AuditLog.Acao.CREATE, "Obra", salva.getId(), usuarioId,
                "Obra criada: " + salva.getCodigo());

        return ObraResponseDTO.from(salva);
    }

    // ── Atualização de status (PATCH) ─────────────────────────────────────────

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN','GESTOR','FISCAL')")
    public ObraResponseDTO atualizarStatus(UUID id, AtualizarStatusObraDTO dto) {
        Obra obra = buscarEntidade(id);
        StatusObra atual = obra.getStatus();
        StatusObra novo  = dto.status();

        if (atual == novo) {
            return ObraResponseDTO.from(obra);
        }

        Set<StatusObra> permitidos = TRANSICOES_VALIDAS.getOrDefault(atual, Set.of());
        if (!permitidos.contains(novo)) {
            throw new RegraDeNegocioException(
                    "Transição de status inválida: " + atual + " → " + novo
                    + ". Transições permitidas a partir de " + atual + ": " + permitidos);
        }

        obra.setStatus(novo);
        Obra salva = obraRepository.save(obra);
        log.info("Status da obra {} atualizado: {} → {}", obra.getCodigo(), atual, novo);

        UUID usuarioId = resolverUsuarioId();
        auditService.registrar(AuditLog.Acao.PATCH, "Obra", salva.getId(), usuarioId,
                "Status alterado: " + atual + " → " + novo + " na obra " + salva.getCodigo());

        return ObraResponseDTO.from(salva);
    }

    // ── Exclusão ──────────────────────────────────────────────────────────────

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void deletar(UUID id) {
        Obra obra = buscarEntidade(id);
        if (obra.getStatus() == StatusObra.EM_ANDAMENTO) {
            throw new RegraDeNegocioException(
                    "Não é permitido excluir uma obra com status EM_ANDAMENTO.");
        }
        log.info("Deletando obra: {} ({})", obra.getCodigo(), id);
        UUID usuarioId = resolverUsuarioId();
        auditService.registrar(AuditLog.Acao.DELETE, "Obra", obra.getId(), usuarioId,
                "Obra deletada: " + obra.getCodigo());
        obraRepository.deleteById(id);
    }

    // ── Dashboard — contagens via SQL (não mais em memória) ───────────────────

    @Transactional(readOnly = true)
    public DashboardObraDTO gerarDashboard(UUID obraId) {
        Obra obra = buscarEntidade(obraId);

        // CORREÇÃO: contagens delegadas ao banco via countByObraIdAndStatus —
        // elimina o carregamento de todos os itens em memória apenas para contar.
        long totalItens   = itemRepository.countByObraId(obraId);
        long aprovados    = itemRepository.countByObraIdAndStatus(obraId, StatusItem.APROVADO);
        long reprovados   = itemRepository.countByObraIdAndStatus(obraId, StatusItem.REPROVADO);
        long emVistoria   = itemRepository.countByObraIdAndStatus(obraId, StatusItem.EM_VISTORIA);
        long pendentes    = itemRepository.countByObraIdAndStatus(obraId, StatusItem.PENDENTE);
        long itensClasseA = itemRepository.countByObraIdAndClassificacaoTipo(obraId, 'A');
        long itensClasseB = itemRepository.countByObraIdAndClassificacaoTipo(obraId, 'B');
        long itensClasseC = itemRepository.countByObraIdAndClassificacaoTipo(obraId, 'C');
        int  pctAprovacao = totalItens > 0 ? (int) Math.round((aprovados * 100.0) / totalItens) : 0;

        log.info("Dashboard gerado para obra: {} | total={} aprovados={} pct={}%",
                obra.getCodigo(), totalItens, aprovados, pctAprovacao);

        return new DashboardObraDTO(
                obra.getId(), obra.getCodigo(), obra.getDescricao(),
                obra.getStatus() != null ? obra.getStatus().name() : null,
                obra.getDataInicio(), obra.getDataPrevisaoConclusao(),
                totalItens, aprovados, reprovados, emVistoria, pendentes,
                itensClasseA, itensClasseB, itensClasseC, pctAprovacao
        );
    }

    // ── Timeline de vistorias ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<VistoriaTimelineDTO> timelineVistorias(UUID obraId) {
        buscarEntidade(obraId);
        return vistoriaRepository.contarPorDia(obraId)
                .stream()
                .map(row -> new VistoriaTimelineDTO(
                        (String) row[0],
                        ((Number) row[1]).longValue()
                ))
                .toList();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Extrai o UUID do usuário autenticado do SecurityContext via email. */
    private UUID resolverUsuarioId() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) return null;
            String email = (String) auth.getPrincipal();
            return usuarioRepository.findByEmail(email)
                    .map(u -> u.getId())
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private Obra buscarEntidade(UUID id) {
        return obraRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Obra não encontrada: " + id));
    }
}
