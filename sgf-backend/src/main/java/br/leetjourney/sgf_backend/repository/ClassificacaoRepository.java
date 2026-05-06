package br.leetjourney.sgf_backend.repository;

import br.leetjourney.sgf_backend.model.Classificacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClassificacaoRepository extends JpaRepository<Classificacao, UUID> {
    Optional<Classificacao> findByTipo(Character tipo);
}
