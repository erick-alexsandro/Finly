package com.smilecorp.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ProdutosDTO {
    private Long id;
    private String name;
    private String unit;
    private BigDecimal price;
    private Integer quantity;
    private Integer minStock;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

    private Long produtoId;
    private String produtoNome;
    private String tipo;
    private Integer quantidade;
    private Integer quantidadeAnterior;
    private Integer quantidadeNova;
    private BigDecimal precoCompra;
    private String descricao;

    public ProdutosDTO() {
    }

    public ProdutosDTO(Long id, String name, String unit, BigDecimal price,
                       Integer quantity, Integer minStock,
                       LocalDateTime criadoEm, LocalDateTime atualizadoEm) {
        this.id = id;
        this.name = name;
        this.unit = unit;
        this.price = price;
        this.quantity = quantity;
        this.minStock = minStock;
        this.criadoEm = criadoEm;
        this.atualizadoEm = atualizadoEm;
    }

    public ProdutosDTO(Long id, Long produtoId, String produtoNome, String tipo,
                       Integer quantidade, Integer quantidadeAnterior,
                       Integer quantidadeNova, BigDecimal precoCompra,
                       String descricao, LocalDateTime criadoEm) {
        this.id = id;
        this.produtoId = produtoId;
        this.produtoNome = produtoNome;
        this.tipo = tipo;
        this.quantidade = quantidade;
        this.quantidadeAnterior = quantidadeAnterior;
        this.quantidadeNova = quantidadeNova;
        this.precoCompra = precoCompra;
        this.descricao = descricao;
        this.criadoEm = criadoEm;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Integer getMinStock() {
        return minStock;
    }

    public void setMinStock(Integer minStock) {
        this.minStock = minStock;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public void setCriadoEm(LocalDateTime criadoEm) {
        this.criadoEm = criadoEm;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }

    public void setAtualizadoEm(LocalDateTime atualizadoEm) {
        this.atualizadoEm = atualizadoEm;
    }

    public Long getProdutoId() {
        return produtoId;
    }

    public void setProdutoId(Long produtoId) {
        this.produtoId = produtoId;
    }

    public String getProdutoNome() {
        return produtoNome;
    }

    public void setProdutoNome(String produtoNome) {
        this.produtoNome = produtoNome;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public Integer getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(Integer quantidade) {
        this.quantidade = quantidade;
    }

    public Integer getQuantidadeAnterior() {
        return quantidadeAnterior;
    }

    public void setQuantidadeAnterior(Integer quantidadeAnterior) {
        this.quantidadeAnterior = quantidadeAnterior;
    }

    public Integer getQuantidadeNova() {
        return quantidadeNova;
    }

    public void setQuantidadeNova(Integer quantidadeNova) {
        this.quantidadeNova = quantidadeNova;
    }

    public BigDecimal getPrecoCompra() {
        return precoCompra;
    }

    public void setPrecoCompra(BigDecimal precoCompra) {
        this.precoCompra = precoCompra;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public static class ReporEstoqueRequest {
        private Integer quantidade;
        private BigDecimal precoCompra;

        public ReporEstoqueRequest() {
        }

        public Integer getQuantidade() {
            return quantidade;
        }

        public void setQuantidade(Integer quantidade) {
            this.quantidade = quantidade;
        }

        public BigDecimal getPrecoCompra() {
            return precoCompra;
        }

        public void setPrecoCompra(BigDecimal precoCompra) {
            this.precoCompra = precoCompra;
        }
    }
}
