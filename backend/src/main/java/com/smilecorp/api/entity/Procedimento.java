package com.smilecorp.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Procedimento entity - represents a dental procedure available in the clinic.
 */
@Entity
@Table(name = "procedimento", indexes = {
        @Index(name = "idx_procedimento_org_id", columnList = "organizacao_id"),
        @Index(name = "idx_procedimento_nome", columnList = "nome")
})
public class Procedimento extends BaseEntity {

    @Column(name = "nome", nullable = false, length = 255)
    private String nome;

    @Column(name = "descricao", columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "duracao_minutos", nullable = false)
    private Integer duracaoMinutos;

    @Column(name = "preco", nullable = false, precision = 10, scale = 2)
    private BigDecimal preco;

    @Column(name = "categoria", length = 100)
    private String categoria;

    @Column(name = "especialidade", length = 255)
    private String especialidade;

    @Column(name = "ativo", nullable = false, columnDefinition = "boolean default true")
    private Boolean ativo;

    @OneToMany(mappedBy = "procedimento", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProcedimentoMaterial> materiais = new ArrayList<>();

    public Procedimento() {
    }

    public Procedimento(String organizacaoId, String nome) {
        super();
        this.organizacaoId = organizacaoId;
        this.nome = nome;
        this.ativo = true;
    }

    public Procedimento(String organizacaoId, String nome, String descricao, 
                       Integer duracaoMinutos, BigDecimal preco, String categoria, Boolean ativo) {
        super();
        this.organizacaoId = organizacaoId;
        this.nome = nome;
        this.descricao = descricao;
        this.duracaoMinutos = duracaoMinutos;
        this.preco = preco;
        this.categoria = categoria;
        this.ativo = ativo;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public Integer getDuracaoMinutos() {
        return duracaoMinutos;
    }

    public void setDuracaoMinutos(Integer duracaoMinutos) {
        this.duracaoMinutos = duracaoMinutos;
    }

    public BigDecimal getPreco() {
        return preco;
    }

    public void setPreco(BigDecimal preco) {
        this.preco = preco;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public String getEspecialidade() {
        return especialidade;
    }

    public void setEspecialidade(String especialidade) {
        this.especialidade = especialidade;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }

    public List<ProcedimentoMaterial> getMateriais() {
        return materiais;
    }

    public void setMateriais(List<ProcedimentoMaterial> materiais) {
        this.materiais = materiais;
    }
}
