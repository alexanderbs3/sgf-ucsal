package br.leetjourney.sgf_backend.repository;

import br.leetjourney.sgf_backend.model.Obra;
import br.leetjourney.sgf_backend.model.StatusObra;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ObraRepository extends JpaRepository<Obra, UUID> {

    /** Lista paginada com filtro opcional por status. */
    Page<Obra> findByStatus(StatusObra status, Pageable pageable);

    /**
     * Busca full-text simples: filtra por código ou descrição contendo o termo
     * e, opcionalmente, por status. Usa LOWER para case-insensitive no PostgreSQL.
     */
    @Query("""
        SELECT o FROM Obra o
        WHERE (:q IS NULL OR LOWER(o.codigo) LIKE LOWER(CONCAT('%', :q, '%'))
                          OR LOWER(o.descricao) LIKE LOWER(CONCAT('%', :q, '%')))
          AND (:status IS NULL OR o.status = :status)
        ORDER BY o.codigo ASC
    """)
    List<Obra> buscarComFiltros(
            @Param("q")      String q,
            @Param("status") StatusObra status
    );

    boolean existsByCodigo(String codigo);
}
