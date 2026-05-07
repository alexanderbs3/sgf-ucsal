package br.leetjourney.sgf_backend.repository;

import br.leetjourney.sgf_backend.model.Item;
import br.leetjourney.sgf_backend.model.StatusItem;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ItemRepository extends JpaRepository<Item, UUID> {

    /** Todos os itens de uma obra, com classificação e obra já carregadas (evita N+1). */
    @Query("""
        SELECT i FROM Item i
        JOIN FETCH i.classificacao
        JOIN FETCH i.obra
        WHERE i.obra.id = :obraId
    """)
    List<Item> findByObraId(@Param("obraId") UUID obraId);

    /** Filtro por obra + classe ABC. */
    @Query("""
        SELECT i FROM Item i
        JOIN FETCH i.classificacao
        JOIN FETCH i.obra
        WHERE i.obra.id = :obraId
          AND i.classificacao.tipo = :tipo
    """)
    List<Item> findByObraIdAndClassificacaoTipo(
            @Param("obraId") UUID obraId,
            @Param("tipo")   Character tipo
    );

    /** Filtro composto: obra + classificação + status + busca por descrição, com Sort dinâmico. */
    @Query("""
        SELECT i FROM Item i
        JOIN FETCH i.classificacao
        JOIN FETCH i.obra
        WHERE i.obra.id = :obraId
          AND (:tipo   IS NULL OR i.classificacao.tipo = :tipo)
          AND (:status IS NULL OR i.status = :status)
          AND (:q      IS NULL OR LOWER(i.descricao) LIKE LOWER(CONCAT('%', :q, '%')))
    """)
    List<Item> buscarComFiltros(
            @Param("obraId") UUID obraId,
            @Param("tipo")   Character tipo,
            @Param("status") StatusItem status,
            @Param("q")      String q,
            Sort sort
    );

    /** Versão com FETCH JOIN + classificacao ordenado — usada pelo dashboard. */
    @Query("""
        SELECT i FROM Item i
        JOIN FETCH i.classificacao
        WHERE i.obra.id = :obraId
        ORDER BY i.classificacao.tipo
    """)
    List<Item> findByObraIdComClassificacao(@Param("obraId") UUID obraId);

    /** Contagem de itens por status para uma obra (projeção leve). */
    long countByObraIdAndStatus(UUID obraId, StatusItem status);

    /** Contagem total de itens de uma obra. */
    long countByObraId(UUID obraId);

    /**
     * Contagem de itens por classe (A, B, C) para uma obra.
     * CORREÇÃO: substitui o stream em memória do dashboard por uma query SQL direta.
     */
    @Query("SELECT COUNT(i) FROM Item i WHERE i.obra.id = :obraId AND i.classificacao.tipo = :tipo")
    long countByObraIdAndClassificacaoTipo(@Param("obraId") UUID obraId, @Param("tipo") char tipo);
}
