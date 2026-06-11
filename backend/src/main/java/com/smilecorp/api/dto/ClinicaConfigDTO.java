package com.smilecorp.api.dto;

import jakarta.validation.constraints.NotBlank;

public class ClinicaConfigDTO {

    @NotBlank(message = "Chave é obrigatória")
    private String chave;

    @NotBlank(message = "Valor é obrigatório")
    private String valor;

    public ClinicaConfigDTO() {}

    public ClinicaConfigDTO(String chave, String valor) {
        this.chave = chave;
        this.valor = valor;
    }

    public String getChave() { return chave; }
    public void setChave(String chave) { this.chave = chave; }

    public String getValor() { return valor; }
    public void setValor(String valor) { this.valor = valor; }
}
