package com.smilecorp.api.entity;

import jakarta.persistence.*;

/**
 * Profissional entity - represents a dental professional.
 */
@Entity
@Table(name = "profissionais", indexes = {
        @Index(name = "idx_profissionais_org_id", columnList = "organizacao_id"),
        @Index(name = "idx_profissionais_nome", columnList = "nome")
})
public class Profissional extends BaseEntity {

    @Column(name = "nome", nullable = false, length = 255)
    private String nome;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "telefone", length = 20)
    private String telefone;

    @Column(name = "cpf", length = 11, unique = true)
    private String cpf;

    @Column(name = "especialidade", length = 255)
    private String especialidade;

    @Column(name = "numero_registro", length = 100)
    private String numeroRegistro;

    @Column(name = "ativo", nullable = false, columnDefinition = "boolean default true")
    private Boolean ativo;

    public Profissional() {
    }

    public Profissional(String organizacaoId, String nome) {
        super();
        this.organizacaoId = organizacaoId;
        this.nome = nome;
        this.ativo = true;
    }

    public Profissional(String organizacaoId, String nome, String email, String telefone,
                       String cpf, String especialidade, String numeroRegistro, Boolean ativo) {
        super();
        this.organizacaoId = organizacaoId;
        this.nome = nome;
        this.email = email;
        this.telefone = telefone;
        this.cpf = cpf;
        this.especialidade = especialidade;
        this.numeroRegistro = numeroRegistro;
        this.ativo = ativo;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public String getEspecialidade() {
        return especialidade;
    }

    public void setEspecialidade(String especialidade) {
        this.especialidade = especialidade;
    }

    public String getNumeroRegistro() {
        return numeroRegistro;
    }

    public void setNumeroRegistro(String numeroRegistro) {
        this.numeroRegistro = numeroRegistro;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }
}
