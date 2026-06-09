package com.smilecorp.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "pagamento_paciente", indexes = {
        @Index(name = "idx_pagamento_paciente_org_id", columnList = "organizacao_id"),
        @Index(name = "idx_pagamento_paciente_paciente_id", columnList = "paciente_id"),
        @Index(name = "idx_pagamento_paciente_agendamento_id", columnList = "agendamento_id")
})
public class PagamentoPaciente extends BaseEntity {

    @Column(name = "paciente_id", nullable = false)
    private UUID pacienteId;

    @Column(name = "agendamento_id")
    private UUID agendamentoId;

    @Column(name = "nome", nullable = false)
    private String nome;

    @Column(name = "data", nullable = false)
    private LocalDate data;

    @Column(name = "valor_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorTotal;

    @Column(name = "forma_pagamento", length = 50)
    private String formaPagamento;

    @Column(name = "parcelas")
    private Integer parcelas;

    @Column(name = "status", length = 20)
    private String status;

    public PagamentoPaciente() {}

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
}
