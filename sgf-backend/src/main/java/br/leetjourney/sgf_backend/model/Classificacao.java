package br.leetjourney.sgf_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "classificacao")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Classificacao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false, length = 1)
    private Character tipo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String criterio;
}
