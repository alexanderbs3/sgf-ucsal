package br.leetjourney.sgf_backend.repository;

import br.leetjourney.sgf_backend.model.Vistoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface VistoriaRepository extends JpaRepository<Vistoria, UUID> {

    /**
     * LEFT JOIN FETCH no usuario — necessário desde a migration V4, onde
     * usuario_id passou a ser nullable (remoção forçada de fiscal).
     * Um INNER JOIN excluiria vistorias cujo fiscal foi removido do sistema.
     */
    @Query("""
        SELECT v FROM Vistoria v
        JOIN FETCH v.obra
        LEFT JOIN FETCH v.usuario
        WHERE v.obra.id = :obraId
        ORDER BY v.dataHora DESC
    """)
    List<Vistoria> findByObraId(@Param("obraId") UUID obraId);

    @Query(value = """
        SELECT TO_CHAR(v.data_hora, 'YYYY-MM-DD') AS data,
               COUNT(v.id)                         AS total
        FROM   vistoria v
        WHERE  v.obra_id = :obraId
        GROUP  BY TO_CHAR(v.data_hora, 'YYYY-MM-DD')
        ORDER  BY 1 ASC
    """, nativeQuery = true)
    List<Object[]> contarPorDia(@Param("obraId") UUID obraId);

    long countByObraId(UUID obraId);

    /** Verifica se o usuário possui vistorias vinculadas — usado antes de deletar. */
    long countByUsuarioId(UUID usuarioId);

    /** Define usuario = null em todas as vistorias do usuário informado. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("UPDATE Vistoria v SET v.usuario = null WHERE v.usuario.id = :usuarioId")
    void desvincularUsuario(@Param("usuarioId") UUID usuarioId);
}