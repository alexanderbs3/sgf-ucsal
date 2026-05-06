package br.leetjourney.sgf_backend.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "origem_dado")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrigemDado {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false,updatable = false)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String descricao;

    @Column(nullable = false, length = 50)
    private String tipo;
}
