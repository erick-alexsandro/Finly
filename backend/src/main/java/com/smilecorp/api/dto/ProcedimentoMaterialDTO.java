package com.smilecorp.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class ProcedimentoMaterialDTO {

    private Long id;

    @NotNull(message = "Material é obrigatório")
    private Long materialId;

    private String materialNome;

    private String materialUnidade;

    @NotNull(message = "Quantidade é obrigatória")
    @Positive(message = "Quantidade deve ser maior que zero")
    private Integer quantidade;

    public ProcedimentoMaterialDTO() {
    }

    public ProcedimentoMaterialDTO(Long materialId, Integer quantidade) {
        this.materialId = materialId;
        this.quantidade = quantidade;
    }

    public ProcedimentoMaterialDTO(Long id, Long materialId, String materialNome, String materialUnidade, Integer quantidade) {
        this.id = id;
        this.materialId = materialId;
        this.materialNome = materialNome;
        this.materialUnidade = materialUnidade;
        this.quantidade = quantidade;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getMaterialId() { return materialId; }
    public void setMaterialId(Long materialId) { this.materialId = materialId; }

    public String getMaterialNome() { return materialNome; }
    public void setMaterialNome(String materialNome) { this.materialNome = materialNome; }

    public String getMaterialUnidade() { return materialUnidade; }
    public void setMaterialUnidade(String materialUnidade) { this.materialUnidade = materialUnidade; }

    public Integer getQuantidade() { return quantidade; }
    public void setQuantidade(Integer quantidade) { this.quantidade = quantidade; }
}
