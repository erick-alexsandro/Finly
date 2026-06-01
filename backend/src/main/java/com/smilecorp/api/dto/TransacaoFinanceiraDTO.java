package com.smilecorp.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class TransacaoFinanceiraDTO {
    private String id;
    private String tipo;
    private String descricao;
    private String categoria;
    private BigDecimal valor;
    private LocalDate data;
    private String status;
    private String contaFixaId;
    private String contaFixaDescricao;
    private String observacao;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

    public TransacaoFinanceiraDTO() {
    }

    public TransacaoFinanceiraDTO(String id, String tipo, String descricao, String categoria,
                                   BigDecimal valor, LocalDate data, String status,
                                   String contaFixaId, String contaFixaDescricao, String observacao,
                                   LocalDateTime criadoEm, LocalDateTime atualizadoEm) {
        this.id = id;
        this.tipo = tipo;
        this.descricao = descricao;
        this.categoria = categoria;
        this.valor = valor;
        this.data = data;
        this.status = status;
        this.contaFixaId = contaFixaId;
        this.contaFixaDescricao = contaFixaDescricao;
        this.observacao = observacao;
        this.criadoEm = criadoEm;
        this.atualizadoEm = atualizadoEm;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

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

    public String getContaFixaId() { return contaFixaId; }
    public void setContaFixaId(String contaFixaId) { this.contaFixaId = contaFixaId; }

    public String getContaFixaDescricao() { return contaFixaDescricao; }
    public void setContaFixaDescricao(String contaFixaDescricao) { this.contaFixaDescricao = contaFixaDescricao; }

    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }

    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(LocalDateTime criadoEm) { this.criadoEm = criadoEm; }

    public LocalDateTime getAtualizadoEm() { return atualizadoEm; }
    public void setAtualizadoEm(LocalDateTime atualizadoEm) { this.atualizadoEm = atualizadoEm; }
}
