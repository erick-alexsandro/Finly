package com.smilecorp.api.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "fornecedor", indexes = {
        @Index(name = "idx_fornecedor_org_id", columnList = "organizacao_id"),
        @Index(name = "idx_fornecedor_nome", columnList = "nome"),
        @Index(name = "idx_fornecedor_cnpj_cpf", columnList = "cnpj_cpf")
})
public class Fornecedor extends BaseEntity {

    @Column(name = "nome", nullable = false, length = 255)
    private String nome;

    @Column(name = "cnpj_cpf", nullable = false, length = 14, unique = true)
    private String cnpjCpf;

    @Column(name = "telefone", nullable = false, length = 20)
    private String telefone;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "endereco", length = 255)
    private String endereco;

    @Column(name = "rua", length = 255)
    private String rua;

    @Column(name = "numero", length = 20)
    private String numero;

    @Column(name = "bairro", length = 100)
    private String bairro;

    @Column(name = "cidade", length = 100)
    private String cidade;

    @Column(name = "status", nullable = false, length = 10)
    private String status;

    @Column(name = "ativo", nullable = false, columnDefinition = "boolean default true")
    private Boolean ativo;

    public Fornecedor() {
    }

    public Fornecedor(String organizacaoId, String nome, String cnpjCpf, String telefone,
                     String email, String rua, String numero, String bairro, String cidade) {
        super();
        this.organizacaoId = organizacaoId;
        this.nome = nome;
        this.cnpjCpf = cnpjCpf;
        this.telefone = telefone;
        this.email = email;
        this.rua = rua;
        this.numero = numero;
        this.bairro = bairro;
        this.cidade = cidade;
        this.endereco = construirEndereco(rua, numero, bairro, cidade);
        this.status = "ativo";
        this.ativo = true;
    }

    public Fornecedor(String organizacaoId, String nome, String cnpjCpf, String telefone,
                     String email, String rua, String numero, String bairro, String cidade, String status, Boolean ativo) {
        super();
        this.organizacaoId = organizacaoId;
        this.nome = nome;
        this.cnpjCpf = cnpjCpf;
        this.telefone = telefone;
        this.email = email;
        this.rua = rua;
        this.numero = numero;
        this.bairro = bairro;
        this.cidade = cidade;
        this.endereco = construirEndereco(rua, numero, bairro, cidade);
        this.status = status;
        this.ativo = ativo;
    }

    private String construirEndereco(String rua, String numero, String bairro, String cidade) {
        StringBuilder sb = new StringBuilder();
        if (rua != null && !rua.isBlank()) sb.append(rua);
        if (numero != null && !numero.isBlank()) sb.append(sb.length() > 0 ? ", " : "").append(numero);
        if (bairro != null && !bairro.isBlank()) sb.append(sb.length() > 0 ? ", " : "").append(bairro);
        if (cidade != null && !cidade.isBlank()) sb.append(sb.length() > 0 ? ", " : "").append(cidade);
        return sb.toString();
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getCnpjCpf() {
        return cnpjCpf;
    }

    public void setCnpjCpf(String cnpjCpf) {
        this.cnpjCpf = cnpjCpf;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getEndereco() {
        return endereco;
    }

    public void setEndereco(String endereco) {
        this.endereco = endereco;
    }

    public String getRua() {
        return rua;
    }

    public void setRua(String rua) {
        this.rua = rua;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public String getBairro() {
        return bairro;
    }

    public void setBairro(String bairro) {
        this.bairro = bairro;
    }

    public String getCidade() {
        return cidade;
    }

    public void setCidade(String cidade) {
        this.cidade = cidade;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }
}
