package com.smilecorp.api.entity;

import jakarta.persistence.*;

/**
 * Paciente entity - represents a patient in the dental clinic.
 */
@Entity
@Table(name = "paciente", indexes = {
        @Index(name = "idx_paciente_org_id", columnList = "organizacao_id"),
        @Index(name = "idx_paciente_nome", columnList = "nome")
})
public class Paciente extends BaseEntity {

    @Column(name = "nome", nullable = false, length = 255)
    private String nome;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "telefone", length = 20)
    private String telefone;

    @Column(name = "cpf", length = 11, unique = true)
    private String cpf;

    @Column(name = "data_nascimento")
    private String dataNascimento;

    @Column(name = "endereco")
    private String endereco;

    @Column(name = "observacoes", columnDefinition = "TEXT")
    private String observacoes;

    @Column(name = "ativo", nullable = false, columnDefinition = "boolean default true")
    private Boolean ativo;

    public Paciente() {
    }

    public Paciente(String organizacaoId, String nome, String email, String telefone) {
        super();
        this.organizacaoId = organizacaoId;
        this.nome = nome;
        this.email = email;
        this.telefone = telefone;
        this.ativo = true;
    }

    public Paciente(String organizacaoId, String nome, String email, String telefone, String cpf, 
                    String dataNascimento, String endereco, String observacoes, Boolean ativo) {
        super();
        this.organizacaoId = organizacaoId;
        this.nome = nome;
        this.email = email;
        this.telefone = telefone;
        this.cpf = cpf;
        this.dataNascimento = dataNascimento;
        this.endereco = endereco;
        this.observacoes = observacoes;
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

    public String getDataNascimento() {
        return dataNascimento;
    }

    public void setDataNascimento(String dataNascimento) {
        this.dataNascimento = dataNascimento;
    }

    public String getEndereco() {
        return endereco;
    }

    public void setEndereco(String endereco) {
        this.endereco = endereco;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }
}
