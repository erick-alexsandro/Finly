package com.smilecorp.api.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "clinica_config")
public class ClinicaConfig {

    @Id
    @Column(name = "chave", length = 100, nullable = false)
    private String chave;

    @Column(name = "valor", nullable = false, length = 255)
    private String valor;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime criadoEm;

    @Column(name = "updated_at")
    private LocalDateTime atualizadoEm;

    public ClinicaConfig() {}

    @PrePersist
    protected void onCreate() {
        if (this.criadoEm == null) this.criadoEm = LocalDateTime.now();
        if (this.atualizadoEm == null) this.atualizadoEm = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.atualizadoEm = LocalDateTime.now();
    }

    public String getChave() { return chave; }
    public void setChave(String chave) { this.chave = chave; }

    public String getValor() { return valor; }
    public void setValor(String valor) { this.valor = valor; }

    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(LocalDateTime criadoEm) { this.criadoEm = criadoEm; }

    public LocalDateTime getAtualizadoEm() { return atualizadoEm; }
    public void setAtualizadoEm(LocalDateTime atualizadoEm) { this.atualizadoEm = atualizadoEm; }
}
