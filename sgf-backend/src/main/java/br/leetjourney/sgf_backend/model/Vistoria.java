package br.leetjourney.sgf_backend.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "vistoria")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Vistoria {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "obra_id", nullable = false)
    private Obra obra;

    /**
     * Referência ao usuário (fiscal) que realizou a vistoria.
     *
     * nullable = true — permite que o campo seja definido como NULL quando um
     * usuário é removido em modo forçado (forcar=true no UsuarioService).
     * O histórico da vistoria é preservado; apenas o vínculo com o usuário
     * é desfeito. Alinhado com a migration V4 que alterou a coluna para
     * aceitar NULL e recriou a FK com ON DELETE SET NULL.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = true)
    private Usuario usuario;

    @Column(name = "data_hora", nullable = false)
    private LocalDateTime dataHora;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;
}
