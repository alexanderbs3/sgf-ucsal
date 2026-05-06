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
import br.leetjourney.sgf_backend.repository.VistoriaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    public ObraService(ObraRepository obraRepository,
                       ItemRepository itemRepository,
                       VistoriaRepository vistoriaRepository) {
        this.obraRepository     = obraRepository;
        this.itemRepository     = itemRepository;
        this.vistoriaRepository = vistoriaRepository;
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
        obra.setStatus(dto.status());
        log.info("Criando obra: {}", dto.codigo());
        return ObraResponseDTO.from(obraRepository.save(obra));
    }

    // ── Atualização de status (PATCH) ─────────────────────────────────────────

    @Transactional
    public ObraResponseDTO atualizarStatus(UUID id, AtualizarStatusObraDTO dto) {
        Obra obra = buscarEntidade(id);
        StatusObra atual = obra.getStatus();
        StatusObra novo  = dto.status();

        if (atual == novo) {
            return ObraResponseDTO.from(obra); // idempotente — sem alteração
        }

        Set<StatusObra> permitidos = TRANSICOES_VALIDAS.getOrDefault(atual, Set.of());
        if (!permitidos.contains(novo)) {
            throw new RegraDeNegocioException(
                    "Transição de status inválida: " + atual + " → " + novo
                    + ". Transições permitidas a partir de " + atual + ": " + permitidos);
        }

        obra.setStatus(novo);
        log.info("Status da obra {} atualizado: {} → {}", obra.getCodigo(), atual, novo);
        return ObraResponseDTO.from(obraRepository.save(obra));
    }

    // ── Exclusão ──────────────────────────────────────────────────────────────

    @Transactional
    public void deletar(UUID id) {
        Obra obra = buscarEntidade(id);
        if (obra.getStatus() == StatusObra.EM_ANDAMENTO) {
            throw new RegraDeNegocioException(
                    "Não é permitido excluir uma obra com status EM_ANDAMENTO.");
        }
        log.info("Deletando obra: {} ({})", obra.getCodigo(), id);
        obraRepository.deleteById(id);
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DashboardObraDTO gerarDashboard(UUID obraId) {
        Obra obra = buscarEntidade(obraId);
        List<Item> itens = itemRepository.findByObraIdComClassificacao(obraId);

        long totalItens   = itens.size();
        long aprovados    = contarPorStatus(itens, StatusItem.APROVADO);
        long reprovados   = contarPorStatus(itens, StatusItem.REPROVADO);
        long emVistoria   = contarPorStatus(itens, StatusItem.EM_VISTORIA);
        long pendentes    = contarPorStatus(itens, StatusItem.PENDENTE);
        long itensClasseA = contarPorClasse(itens, 'A');
        long itensClasseB = contarPorClasse(itens, 'B');
        long itensClasseC = contarPorClasse(itens, 'C');
        int  pctAprovacao = totalItens > 0 ? (int) Math.round((aprovados * 100.0) / totalItens) : 0;

        log.info("Dashboard gerado para obra: {} | total={} aprovados={} pct={}%",
                obra.getCodigo(), totalItens, aprovados, pctAprovacao);

        return new DashboardObraDTO(
                obra.getId(),
                obra.getCodigo(),
                obra.getDescricao(),
                obra.getStatus() != null ? obra.getStatus().name() : null,
                obra.getDataInicio(),
                obra.getDataPrevisaoConclusao(),
                totalItens,
                aprovados,
                reprovados,
                emVistoria,
                pendentes,
                itensClasseA,
                itensClasseB,
                itensClasseC,
                pctAprovacao
        );
    }

    // ── Timeline de vistorias ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<VistoriaTimelineDTO> timelineVistorias(UUID obraId) {
        buscarEntidade(obraId); // garante que a obra existe
        return vistoriaRepository.contarPorDia(obraId)
                .stream()
                .map(row -> new VistoriaTimelineDTO(
                        (String) row[0],
                        ((Number) row[1]).longValue()
                ))
                .toList();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private long contarPorStatus(List<Item> itens, StatusItem status) {
        return itens.stream().filter(i -> status == i.getStatus()).count();
    }

    private long contarPorClasse(List<Item> itens, char tipo) {
        return itens.stream()
                .filter(i -> i.getClassificacao() != null
                             && tipo == i.getClassificacao().getTipo())
                .count();
    }

    private Obra buscarEntidade(UUID id) {
        return obraRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Obra não encontrada: " + id));
    }
}
