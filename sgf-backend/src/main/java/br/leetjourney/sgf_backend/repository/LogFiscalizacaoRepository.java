package br.leetjourney.sgf_backend.repository;

import br.leetjourney.sgf_backend.model.LogFiscalizacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LogFiscalizacaoRepository extends JpaRepository<LogFiscalizacao, UUID> {

    @Query("""
        SELECT l FROM LogFiscalizacao l
        JOIN FETCH l.item
        JOIN FETCH l.origemDado
        WHERE l.vistoria.id = :vistoriaId
        ORDER BY l.criadoEm DESC
    """)
    List<LogFiscalizacao> findByVistoriaId(@Param("vistoriaId") UUID vistoriaId);

    @Query("""
        SELECT l FROM LogFiscalizacao l
        JOIN FETCH l.vistoria
        JOIN FETCH l.origemDado
        WHERE l.item.id = :itemId
        ORDER BY l.criadoEm DESC
    """)
    List<LogFiscalizacao> findByItemId(@Param("itemId") UUID itemId);
}
