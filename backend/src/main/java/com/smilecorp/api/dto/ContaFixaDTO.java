package com.smilecorp.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ContaFixaDTO {
    private String id;
    private String tipo;
    private String descricao;
    private String categoria;
    private BigDecimal valor;
    private Integer diaVencimento;
    private LocalDate dataInicio;
    private LocalDate dataFim;
    private String status;
    private String observacao;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

    public ContaFixaDTO() {
    }

    public ContaFixaDTO(String id, String tipo, String descricao, String categoria,
                        BigDecimal valor, Integer diaVencimento, LocalDate dataInicio,
                        LocalDate dataFim, String status, String observacao,
                        LocalDateTime criadoEm, LocalDateTime atualizadoEm) {
        this.id = id;
        this.tipo = tipo;
        this.descricao = descricao;
        this.categoria = categoria;
        this.valor = valor;
        this.diaVencimento = diaVencimento;
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
        this.status = status;
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

    public Integer getDiaVencimento() { return diaVencimento; }
    public void setDiaVencimento(Integer diaVencimento) { this.diaVencimento = diaVencimento; }

    public LocalDate getDataInicio() { return dataInicio; }
    public void setDataInicio(LocalDate dataInicio) { this.dataInicio = dataInicio; }

    public LocalDate getDataFim() { return dataFim; }
    public void setDataFim(LocalDate dataFim) { this.dataFim = dataFim; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }

    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(LocalDateTime criadoEm) { this.criadoEm = criadoEm; }

    public LocalDateTime getAtualizadoEm() { return atualizadoEm; }
    public void setAtualizadoEm(LocalDateTime atualizadoEm) { this.atualizadoEm = atualizadoEm; }
}
