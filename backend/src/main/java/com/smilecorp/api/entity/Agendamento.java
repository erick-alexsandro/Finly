package com.smilecorp.api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// Agendamento entity - represents a scheduled appointment.
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
    private Long pacienteId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id", insertable = false, updatable = false)
    private Paciente paciente;

    @Column(name = "profissional_id", nullable = false)
    private Long profissionalId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profissional_id", insertable = false, updatable = false)
    private Profissional profissional;

    @Column(name = "status", length = 50, nullable = false, columnDefinition = "varchar(50) default 'agendado'")
    private String status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "procedimentos_ids", columnDefinition = "jsonb")
    private List<String> procedimentosIds = new ArrayList<>();

    @Column(name = "observacoes", columnDefinition = "TEXT")
    private String observacoes;

    @Column(name = "confirmado", nullable = false, columnDefinition = "boolean default false")
    private Boolean confirmado;

    public Agendamento() {
    }

    public Agendamento(String organizacaoId, LocalDateTime data, String horaInicio, String horaFim,
                       Long pacienteId, Paciente paciente, Long profissionalId, Profissional profissional,
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

    public Long getPacienteId() {
        return pacienteId;
    }

    public void setPacienteId(Long pacienteId) {
        this.pacienteId = pacienteId;
    }

    public Paciente getPaciente() {
        return paciente;
    }

    public void setPaciente(Paciente paciente) {
        this.paciente = paciente;
    }

    public Long getProfissionalId() {
        return profissionalId;
    }

    public void setProfissionalId(Long profissionalId) {
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

    public String getPacienteNome() {
        return paciente != null ? paciente.getNome() : null;
    }

    public String getProfissionalNome() {
        return profissional != null ? profissional.getNome() : null;
    }
}
