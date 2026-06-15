package com.smilecorp.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class ProcedimentoCustoDTO {

    private Long id;

    @NotBlank(message = "Tipo é obrigatório")
    private String tipo;

    @NotBlank(message = "Tipo de valor é obrigatório")
    private String tipoValor;

    @NotNull(message = "Valor é obrigatório")
    private BigDecimal valor;

    private String descricao;

    public ProcedimentoCustoDTO() {}

    public ProcedimentoCustoDTO(Long id, String tipo, String tipoValor, BigDecimal valor, String descricao) {
        this.id = id;
        this.tipo = tipo;
        this.tipoValor = tipoValor;
        this.valor = valor;
        this.descricao = descricao;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getTipoValor() { return tipoValor; }
    public void setTipoValor(String tipoValor) { this.tipoValor = tipoValor; }

    public BigDecimal getValor() { return valor; }
    public void setValor(BigDecimal valor) { this.valor = valor; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
}
