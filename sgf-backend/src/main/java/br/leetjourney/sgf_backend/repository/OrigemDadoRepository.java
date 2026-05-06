package br.leetjourney.sgf_backend.repository;

import br.leetjourney.sgf_backend.model.OrigemDado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OrigemDadoRepository extends JpaRepository<OrigemDado, UUID> {
}
