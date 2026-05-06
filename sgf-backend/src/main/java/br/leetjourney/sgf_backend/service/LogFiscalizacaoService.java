package br.leetjourney.sgf_backend.service;

import br.leetjourney.sgf_backend.dto.request.LogFiscalizacaoRequestDTO;
import br.leetjourney.sgf_backend.dto.response.LogFiscalizacaoResponseDTO;
import br.leetjourney.sgf_backend.exception.RecursoNaoEncontradoException;
import br.leetjourney.sgf_backend.model.Item;
import br.leetjourney.sgf_backend.model.LogFiscalizacao;
import br.leetjourney.sgf_backend.repository.ItemRepository;
import br.leetjourney.sgf_backend.repository.LogFiscalizacaoRepository;
import br.leetjourney.sgf_backend.repository.OrigemDadoRepository;
import br.leetjourney.sgf_backend.repository.VistoriaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class LogFiscalizacaoService {

    private static final Logger log = LoggerFactory.getLogger(LogFiscalizacaoService.class);

    private final LogFiscalizacaoRepository logRepository;
    private final VistoriaRepository        vistoriaRepository;
    private final ItemRepository            itemRepository;
    private final OrigemDadoRepository      origemDadoRepository;

    public LogFiscalizacaoService(LogFiscalizacaoRepository logRepository,
                                  VistoriaRepository vistoriaRepository,
                                  ItemRepository itemRepository,
                                  OrigemDadoRepository origemDadoRepository) {
        this.logRepository       = logRepository;
        this.vistoriaRepository  = vistoriaRepository;
        this.itemRepository      = itemRepository;
        this.origemDadoRepository = origemDadoRepository;
    }

    @Transactional(readOnly = true)
    public List<LogFiscalizacaoResponseDTO> listarPorVistoria(UUID vistoriaId) {
        return logRepository.findByVistoriaId(vistoriaId)
                .stream()
                .map(LogFiscalizacaoResponseDTO::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LogFiscalizacaoResponseDTO> listarPorItem(UUID itemId) {
        return logRepository.findByItemId(itemId)
                .stream()
                .map(LogFiscalizacaoResponseDTO::from)
                .toList();
    }

    /**
     * Registra um log de fiscalização e reflete o novo status no Item.
     *
     * Regra de negócio: o statusItem informado no log é propagado para o Item,
     * efetivando a transição de estado sem a necessidade de uma chamada PATCH
     * separada ao ItemController. O ItemService não é chamado aqui para evitar
     * ciclo de dependência — a atualização é feita diretamente no repositório
     * dentro da mesma transação.
     */
    @Transactional
    public LogFiscalizacaoResponseDTO salvar(LogFiscalizacaoRequestDTO dto) {
        LogFiscalizacao entrada = new LogFiscalizacao();

        entrada.setVistoria(vistoriaRepository.findById(dto.vistoriaId())
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Vistoria não encontrada: " + dto.vistoriaId())));

        Item item = itemRepository.findById(dto.itemId())
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Item não encontrado: " + dto.itemId()));

        entrada.setItem(item);
        entrada.setOrigemDado(origemDadoRepository.findById(dto.origemDadoId())
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Origem de dado não encontrada: " + dto.origemDadoId())));
        entrada.setResultado(dto.resultado());
        entrada.setStatusItem(dto.statusItem());

        // Propaga status para o Item na mesma transação
        item.setStatus(dto.statusItem());
        itemRepository.save(item);

        log.info("Log de fiscalização criado para vistoria={} item={} novoStatus={}",
                dto.vistoriaId(), dto.itemId(), dto.statusItem());

        return LogFiscalizacaoResponseDTO.from(logRepository.save(entrada));
    }
}
