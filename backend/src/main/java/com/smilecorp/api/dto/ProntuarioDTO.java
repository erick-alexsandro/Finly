package com.smilecorp.api.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class ProntuarioDTO {
    private UUID id;
    private UUID agendamentoId;
    private UUID pacienteId;
    private String conteudo;
    private LocalDate data;
    private UUID profissionalId;
    private String dente;
    private String procedimentosExecutados;
    private String secao;
    private String detalhesProximaConsulta;
    private String observacoes;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

    public ProntuarioDTO() {}

    public ProntuarioDTO(UUID id, UUID agendamentoId, UUID pacienteId, String conteudo,
                        LocalDate data, UUID profissionalId, String dente,
                        String procedimentosExecutados, String secao,
                        String detalhesProximaConsulta, String observacoes,
                        LocalDateTime criadoEm, LocalDateTime atualizadoEm) {
        this.id = id; this.agendamentoId = agendamentoId; this.pacienteId = pacienteId;
        this.conteudo = conteudo; this.data = data;
        this.profissionalId = profissionalId; this.dente = dente;
        this.procedimentosExecutados = procedimentosExecutados; this.secao = secao;
        this.detalhesProximaConsulta = detalhesProximaConsulta; this.observacoes = observacoes;
        this.criadoEm = criadoEm; this.atualizadoEm = atualizadoEm;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
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
    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(LocalDateTime criadoEm) { this.criadoEm = criadoEm; }
    public LocalDateTime getAtualizadoEm() { return atualizadoEm; }
    public void setAtualizadoEm(LocalDateTime atualizadoEm) { this.atualizadoEm = atualizadoEm; }
}
