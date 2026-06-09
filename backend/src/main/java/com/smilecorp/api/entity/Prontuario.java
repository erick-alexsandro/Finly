package com.smilecorp.api.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "prontuario", indexes = {
        @Index(name = "idx_prontuario_org_id", columnList = "organizacao_id"),
        @Index(name = "idx_prontuario_agendamento_id", columnList = "agendamento_id"),
        @Index(name = "idx_prontuario_paciente_id", columnList = "paciente_id")
})
public class Prontuario extends BaseEntity {

    @Column(name = "agendamento_id", nullable = false)
    private UUID agendamentoId;

    @Column(name = "paciente_id", nullable = false)
    private UUID pacienteId;

    @Column(name = "conteudo", columnDefinition = "TEXT")
    private String conteudo;

    @Column(name = "data")
    private LocalDate data;

    @Column(name = "profissional_id")
    private UUID profissionalId;

    @Column(name = "dente", length = 50)
    private String dente;

    @Column(name = "procedimentos_executados", columnDefinition = "TEXT")
    private String procedimentosExecutados;

    @Column(name = "secao", length = 100)
    private String secao;

    @Column(name = "detalhes_proxima_consulta", columnDefinition = "TEXT")
    private String detalhesProximaConsulta;

    @Column(name = "observacoes", columnDefinition = "TEXT")
    private String observacoes;

    public Prontuario() {
    }

    public UUID getAgendamentoId() { return agendamentoId; }
    public void setAgendamentoId(UUID agendamentoId) { this.agendamentoId = agendamentoId; }
    public UUID getPacienteId() { return pacienteId; }
    public void setPacienteId(UUID pacienteId) { this.pacienteId = pacienteId; }
    public String getConteudo() { return conteudo; }
    public void setConteudo(String conteudo) { this.conteudo = conteudo; }
    public LocalDate getData() { return data; }
    public void setData(LocalDate data) { this.data = data; }
    public UUID getProfissionalId() { return profissionalId; }
    public void setProfissionalId(UUID profissionalId) { this.profissionalId = profissionalId; }
    public String getDente() { return dente; }
    public void setDente(String dente) { this.dente = dente; }
    public String getProcedimentosExecutados() { return procedimentosExecutados; }
    public void setProcedimentosExecutados(String procedimentosExecutados) { this.procedimentosExecutados = procedimentosExecutados; }
    public String getSecao() { return secao; }
    public void setSecao(String secao) { this.secao = secao; }
    public String getDetalhesProximaConsulta() { return detalhesProximaConsulta; }
    public void setDetalhesProximaConsulta(String detalhesProximaConsulta) { this.detalhesProximaConsulta = detalhesProximaConsulta; }
    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
}
