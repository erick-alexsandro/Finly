package com.smilecorp.api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "conta_fixa", indexes = {
        @Index(name = "idx_conta_fixa_org_id", columnList = "organizacao_id"),
        @Index(name = "idx_conta_fixa_status", columnList = "status")
})
public class ContaFixa extends BaseEntity {

    @Column(name = "tipo", nullable = false, length = 10)
    private String tipo;

    @Column(name = "descricao", nullable = false, length = 255)
    private String descricao;

    @Column(name = "categoria", nullable = false, length = 100)
    private String categoria;

    @Column(name = "valor", nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    @Column(name = "dia_vencimento", nullable = false)
    private Integer diaVencimento;

    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio;

    @Column(name = "data_fim")
    private LocalDate dataFim;

    @Column(name = "status", nullable = false, length = 10)
    private String status;

    @Column(name = "observacao", columnDefinition = "TEXT")
    private String observacao;

    @OneToMany(mappedBy = "contaFixa", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<TransacaoFinanceira> transacoes;

    public ContaFixa() {
    }

    public ContaFixa(String organizacaoId, String tipo, String descricao, String categoria,
                     BigDecimal valor, Integer diaVencimento, LocalDate dataInicio, String status) {
        super();
        this.organizacaoId = organizacaoId;
        this.tipo = tipo;
        this.descricao = descricao;
        this.categoria = categoria;
        this.valor = valor;
        this.diaVencimento = diaVencimento;
        this.dataInicio = dataInicio;
        this.status = status;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public void setValor(BigDecimal valor) {
        this.valor = valor;
    }

    public Integer getDiaVencimento() {
        return diaVencimento;
    }

    public void setDiaVencimento(Integer diaVencimento) {
        this.diaVencimento = diaVencimento;
    }

    public LocalDate getDataInicio() {
        return dataInicio;
    }

    public void setDataInicio(LocalDate dataInicio) {
        this.dataInicio = dataInicio;
    }

    public LocalDate getDataFim() {
        return dataFim;
    }

    public void setDataFim(LocalDate dataFim) {
        this.dataFim = dataFim;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getObservacao() {
        return observacao;
    }

    public void setObservacao(String observacao) {
        this.observacao = observacao;
    }

    public List<TransacaoFinanceira> getTransacoes() {
        return transacoes;
    }

    public void setTransacoes(List<TransacaoFinanceira> transacoes) {
        this.transacoes = transacoes;
    }
}
