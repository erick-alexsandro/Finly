package com.smilecorp.api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Agendamento entity - represents a scheduled appointment.
 */
@Entity
@Table(name = "agendamento", indexes = {
        @Index(name = "idx_agendamento_org_id", columnList = "organizacao_id"),
        @Index(name = "idx_agendamento_data", columnList = "data"),
        @Index(name = "idx_agendamento_paciente_id", columnList = "paciente_id"),
        @Index(name = "idx_agendamento_profissional_id", columnList = "profissional_id")
})
public class Agendamento extends BaseEntity {

    @Column(name = "data", nullable = false)
    private LocalDateTime data;

    @Column(name = "hora_inicio", nullable = false)
    private String horaInicio;

    @Column(name = "hora_fim")
    private String horaFim;

    @Column(name = "paciente_id", nullable = false)
    private UUID pacienteId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id", insertable = false, updatable = false)
    private Paciente paciente;

    @Column(name = "profissional_id", nullable = false)
    private UUID profissionalId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profissional_id", insertable = false, updatable = false)
    private Profissional profissional;

    @Column(name = "status", length = 50, nullable = false, columnDefinition = "varchar(50) default 'agendado'")
    private String status;

    // Store procedure IDs as JSON array
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "procedimentos_ids", columnDefinition = "jsonb")
    private List<String> procedimentosIds = new ArrayList<>();

    // Direct materials with custom quantities
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "materiais", columnDefinition = "jsonb")
    private List<MaterialAgendamento> materiais = new ArrayList<>();

    @Column(name = "observacoes", columnDefinition = "TEXT")
    private String observacoes;

    @Column(name = "confirmado", nullable = false, columnDefinition = "boolean default false")
    private Boolean confirmado;

    public Agendamento() {
    }

    public Agendamento(String organizacaoId, LocalDateTime data, String horaInicio, String horaFim,
                       UUID pacienteId, Paciente paciente, UUID profissionalId, Profissional profissional,
                       String status, List<String> procedimentosIds, String observacoes, Boolean confirmado) {
        super();
        this.organizacaoId = organizacaoId;
        this.data = data;
        this.horaInicio = horaInicio;
        this.horaFim = horaFim;
        this.pacienteId = pacienteId;
        this.paciente = paciente;
        this.profissionalId = profissionalId;
        this.profissional = profissional;
        this.status = status;
        this.procedimentosIds = procedimentosIds;
        this.observacoes = observacoes;
        this.confirmado = confirmado;
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

    public UUID getPacienteId() {
        return pacienteId;
    }

    public void setPacienteId(UUID pacienteId) {
        this.pacienteId = pacienteId;
    }

    public Paciente getPaciente() {
        return paciente;
    }

    public void setPaciente(Paciente paciente) {
        this.paciente = paciente;
    }

    public UUID getProfissionalId() {
        return profissionalId;
    }

    public void setProfissionalId(UUID profissionalId) {
        this.profissionalId = profissionalId;
    }

    public Profissional getProfissional() {
        return profissional;
    }

    public void setProfissional(Profissional profissional) {
        this.profissional = profissional;
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

    // Convenience getters for API responses
    public String getPacienteNome() {
        return paciente != null ? paciente.getNome() : null;
    }

    public String getProfissionalNome() {
        return profissional != null ? profissional.getNome() : null;
    }
}
