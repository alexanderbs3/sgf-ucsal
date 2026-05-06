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
@Table(name = "log_fiscalizacao")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LogFiscalizacao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vistoria_id", nullable = false)
    private Vistoria vistoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "origem_dado_id", nullable = false)
    private OrigemDado origemDado;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String resultado;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_item", nullable = false, length = 30)
    private StatusItem statusItem;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;
}
