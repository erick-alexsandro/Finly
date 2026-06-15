package com.smilecorp.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "transacao_financeira", indexes = {
        @Index(name = "idx_transacao_org_id", columnList = "organizacao_id"),
        @Index(name = "idx_transacao_data", columnList = "data"),
        @Index(name = "idx_transacao_tipo", columnList = "tipo"),
        @Index(name = "idx_transacao_status", columnList = "status")
})
public class TransacaoFinanceira extends BaseEntity {

    @Column(name = "tipo", nullable = false, length = 10)
    private String tipo;

    @Column(name = "descricao", nullable = false, length = 255)
    private String descricao;

    @Column(name = "categoria", nullable = false, length = 100)
    private String categoria;

    @Column(name = "valor", nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    @Column(name = "data", nullable = false)
    private LocalDate data;

    @Column(name = "status", nullable = false, length = 10)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conta_fixa_id")
    private ContaFixa contaFixa;

    @Column(name = "observacao", columnDefinition = "TEXT")
    private String observacao;

    public TransacaoFinanceira() {
    }

    public TransacaoFinanceira(String organizacaoId, String tipo, String descricao, String categoria,
                               BigDecimal valor, LocalDate data, String status) {
        super();
        this.organizacaoId = organizacaoId;
        this.tipo = tipo;
        this.descricao = descricao;
        this.categoria = categoria;
        this.valor = valor;
        this.data = data;
        this.status = status;
    }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public BigDecimal getValor() { return valor; }
    public void setValor(BigDecimal valor) { this.valor = valor; }

    public LocalDate getData() { return data; }
    public void setData(LocalDate data) { this.data = data; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public ContaFixa getContaFixa() { return contaFixa; }
    public void setContaFixa(ContaFixa contaFixa) { this.contaFixa = contaFixa; }

    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }
}
