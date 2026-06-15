package com.smilecorp.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "procedimento_custo", uniqueConstraints = {
        @UniqueConstraint(name = "uq_procedimento_custo_tipo", columnNames = {"procedimento_id", "tipo"})
})
public class ProcedimentoCusto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "procedimento_id", nullable = false)
    private UUID procedimentoId;

    @Column(name = "tipo", nullable = false, length = 50)
    private String tipo;

    @Column(name = "tipo_valor", nullable = false, length = 20)
    private String tipoValor = "PERCENTUAL";

    @Column(name = "valor", nullable = false, precision = 10, scale = 2)
    private BigDecimal valor = BigDecimal.ZERO;

    @Column(name = "descricao", length = 255)
    private String descricao;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime criadoEm;

    @Column(name = "updated_at")
    private LocalDateTime atualizadoEm;

    public ProcedimentoCusto() {}

    @PrePersist
    protected void onCreate() {
        if (this.criadoEm == null) this.criadoEm = LocalDateTime.now();
        if (this.atualizadoEm == null) this.atualizadoEm = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.atualizadoEm = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UUID getProcedimentoId() { return procedimentoId; }
    public void setProcedimentoId(UUID procedimentoId) { this.procedimentoId = procedimentoId; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getTipoValor() { return tipoValor; }
    public void setTipoValor(String tipoValor) { this.tipoValor = tipoValor; }

    public BigDecimal getValor() { return valor; }
    public void setValor(BigDecimal valor) { this.valor = valor; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(LocalDateTime criadoEm) { this.criadoEm = criadoEm; }

    public LocalDateTime getAtualizadoEm() { return atualizadoEm; }
    public void setAtualizadoEm(LocalDateTime atualizadoEm) { this.atualizadoEm = atualizadoEm; }
}
