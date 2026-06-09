package com.smilecorp.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class PagamentoPacienteDTO {
    private UUID id;
    private UUID pacienteId;
    private UUID agendamentoId;
    private String nome;
    private LocalDate data;
    private BigDecimal valorTotal;
    private String formaPagamento;
    private Integer parcelas;
    private String status;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

    public PagamentoPacienteDTO() {}

    public PagamentoPacienteDTO(UUID id, UUID pacienteId, UUID agendamentoId, String nome,
                                LocalDate data, BigDecimal valorTotal, String formaPagamento,
                                Integer parcelas, String status,
                                LocalDateTime criadoEm, LocalDateTime atualizadoEm) {
        this.id = id;
        this.pacienteId = pacienteId;
        this.agendamentoId = agendamentoId;
        this.nome = nome;
        this.data = data;
        this.valorTotal = valorTotal;
        this.formaPagamento = formaPagamento;
        this.parcelas = parcelas;
        this.status = status;
        this.criadoEm = criadoEm;
        this.atualizadoEm = atualizadoEm;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getPacienteId() { return pacienteId; }
    public void setPacienteId(UUID pacienteId) { this.pacienteId = pacienteId; }
    public UUID getAgendamentoId() { return agendamentoId; }
    public void setAgendamentoId(UUID agendamentoId) { this.agendamentoId = agendamentoId; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public LocalDate getData() { return data; }
    public void setData(LocalDate data) { this.data = data; }
    public BigDecimal getValorTotal() { return valorTotal; }
    public void setValorTotal(BigDecimal valorTotal) { this.valorTotal = valorTotal; }
    public String getFormaPagamento() { return formaPagamento; }
    public void setFormaPagamento(String formaPagamento) { this.formaPagamento = formaPagamento; }
    public Integer getParcelas() { return parcelas; }
    public void setParcelas(Integer parcelas) { this.parcelas = parcelas; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(LocalDateTime criadoEm) { this.criadoEm = criadoEm; }
    public LocalDateTime getAtualizadoEm() { return atualizadoEm; }
    public void setAtualizadoEm(LocalDateTime atualizadoEm) { this.atualizadoEm = atualizadoEm; }
}
