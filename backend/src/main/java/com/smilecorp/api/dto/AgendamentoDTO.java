package com.smilecorp.api.dto;

import com.smilecorp.api.entity.MaterialAgendamento;
import java.time.LocalDateTime;
import java.util.List;

public class AgendamentoDTO { 
    private String id;
    private LocalDateTime data;
    private String horaInicio;
    private String horaFim;
    private String pacienteId;
    private String pacienteNome;
    private String email;
    private String telefone;
    private String profissionalId;
    private String profissionalNome;
    private String status;
    private List<String> procedimentosIds;
    private List<MaterialAgendamento> materiais;
    private String observacoes;
    private Boolean confirmado;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

    public AgendamentoDTO() {
    }

    public AgendamentoDTO(String id, LocalDateTime data, String horaInicio, String horaFim,
                         String pacienteId, String pacienteNome, String profissionalId,
                         String profissionalNome, String status, List<String> procedimentosIds,
                         List<MaterialAgendamento> materiais, String observacoes, Boolean confirmado,
                         LocalDateTime criadoEm, LocalDateTime atualizadoEm) {
        this.id = id;
        this.data = data;
        this.horaInicio = horaInicio;
        this.horaFim = horaFim;
        this.pacienteId = pacienteId;
        this.pacienteNome = pacienteNome;
        this.profissionalId = profissionalId;
        this.profissionalNome = profissionalNome;
        this.status = status;
        this.procedimentosIds = procedimentosIds;
        this.materiais = materiais;
        this.observacoes = observacoes;
        this.confirmado = confirmado;
        this.criadoEm = criadoEm;
        this.atualizadoEm = atualizadoEm;
    }

    // GETTERS AND SETTERS
    public String getId() { 
        return id;
    }

    public void setId(String id) { 
        this.id = id;
    }

    public LocalDateTime getData() {
        return data;
    }

    public void setData(LocalDateTime data) {
        this.data = data;
    }

    public String getHoraInicio() {
        return horaInicio;
    }

    public void setHoraInicio(String horaInicio) {
        this.horaInicio = horaInicio;
    }

    public String getHoraFim() {
        return horaFim;
    }

    public void setHoraFim(String horaFim) {
        this.horaFim = horaFim;
    }

    public String getPacienteId() {
        return pacienteId;
    }

    public void setPacienteId(String pacienteId) {
        this.pacienteId = pacienteId;
    }

    public String getPacienteNome() {
        return pacienteNome;
    }

    public void setPacienteNome(String pacienteNome) {
        this.pacienteNome = pacienteNome;
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

    public String getProfissionalId() {
        return profissionalId;
    }

    public void setProfissionalId(String profissionalId) {
        this.profissionalId = profissionalId;
    }

    public String getProfissionalNome() {
        return profissionalNome;
    }

    public void setProfissionalNome(String profissionalNome) {
        this.profissionalNome = profissionalNome;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<String> getProcedimentosIds() {
        return procedimentosIds;
    }

    public void setProcedimentosIds(List<String> procedimentosIds) {
        this.procedimentosIds = procedimentosIds;
    }

    public List<MaterialAgendamento> getMateriais() {
        return materiais;
    }

    public void setMateriais(List<MaterialAgendamento> materiais) {
        this.materiais = materiais;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }

    public Boolean getConfirmado() {
        return confirmado;
    }

    public void setConfirmado(Boolean confirmado) {
        this.confirmado = confirmado;
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
}