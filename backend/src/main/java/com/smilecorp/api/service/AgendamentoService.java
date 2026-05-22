package com.smilecorp.api.service;

import com.smilecorp.api.dto.AgendamentoDTO;
import com.smilecorp.api.entity.Agendamento;
import com.smilecorp.api.entity.Paciente;
import com.smilecorp.api.entity.Profissional;
import com.smilecorp.api.repository.AgendamentoRepository;
import com.smilecorp.api.repository.PacienteRepository;
import com.smilecorp.api.repository.ProfissionalRepository;
import com.smilecorp.api.util.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AgendamentoService {
    private static final Logger log = LoggerFactory.getLogger(AgendamentoService.class);

    private final AgendamentoRepository agendamentoRepository;
    private final PacienteRepository pacienteRepository;
    private final ProfissionalRepository profissionalRepository;

    public AgendamentoService(AgendamentoRepository agendamentoRepository, 
                             PacienteRepository pacienteRepository,
                             ProfissionalRepository profissionalRepository) {
        this.agendamentoRepository = agendamentoRepository;
        this.pacienteRepository = pacienteRepository;
        this.profissionalRepository = profissionalRepository;
    }

    public List<AgendamentoDTO> listar(String profissionalId, String pacienteId, LocalDateTime startDate, LocalDateTime endDate) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Organization ID from TenantContext: {}", orgId);
        log.debug("Listing agendamentos for organization: {} with filters - prof: {}, patient: {}, dates: {} to {}", 
                 orgId, profissionalId, pacienteId, startDate, endDate);

        List<Agendamento> agendamentos;

        if (startDate != null && endDate != null && profissionalId != null) {
            agendamentos = agendamentoRepository.findByOrganizacaoIdAndProfissionalIdAndDataBetween(orgId, profissionalId, startDate, endDate);
            log.info("Query result count (prof + dates): {}", agendamentos.size());
        } else if (pacienteId != null) {
            agendamentos = agendamentoRepository.findByOrganizacaoIdAndPacienteId(orgId, pacienteId);
            log.info("Query result count (paciente): {}", agendamentos.size());
        } else if (startDate != null && endDate != null) {
            agendamentos = agendamentoRepository.findByOrganizacaoIdAndDataBetween(orgId, startDate, endDate);
            log.info("Query result count (dates only): {}", agendamentos.size());
        } else {
            agendamentos = agendamentoRepository.findByOrganizacaoId(orgId);
            log.info("Query result count (all for org): {}", agendamentos.size());
        }

        return agendamentos.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public AgendamentoDTO obterPorId(String id) {
        String orgId = TenantContext.getOrganizationId();
        Agendamento agendamento = agendamentoRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id)) 
                .orElseThrow(() -> new IllegalArgumentException("Agendamento not found with ID: " + id));
        return toDTO(agendamento);
    }

    public AgendamentoDTO criar(AgendamentoDTO dto) {
    String orgId = TenantContext.getOrganizationId();
    log.info("Creating new agendamento for organization: {}", orgId);
    
    if (dto.getPacienteNome() == null || dto.getPacienteNome().trim().isEmpty()) {
        throw new IllegalArgumentException("Patient name is required");
    }

    Paciente paciente = null;
    
    if (dto.getPacienteId() != null && !dto.getPacienteId().isEmpty() && !dto.getPacienteId().equals("null")) {
        try { 
            UUID patientId = UUID.fromString(dto.getPacienteId());
            paciente = pacienteRepository.findByOrganizacaoIdAndId(orgId, patientId)
                    .orElse(null);
        } catch (NumberFormatException e) {
            log.warn("Invalid patient ID format: {}", dto.getPacienteId());
            paciente = null;
        }
    }
    
    if (paciente == null) {
        log.info("Auto-creating patient: {}", dto.getPacienteNome());
        paciente = new Paciente();
        paciente.setOrganizacaoId(orgId);
        paciente.setNome(dto.getPacienteNome().trim());
        if (dto.getEmail() != null && !dto.getEmail().isEmpty()) {
            paciente.setEmail(dto.getEmail().trim());
        }
        if (dto.getTelefone() != null && !dto.getTelefone().isEmpty()) {
            paciente.setTelefone(dto.getTelefone().trim());
        }
        paciente.setAtivo(true);
        paciente = pacienteRepository.save(paciente);
        log.info("Created new patient with ID: {}", paciente.getId());
    }

<<<<<<< Updated upstream
    Profissional profissional = profissionalRepository.findByOrganizacaoIdAndId(orgId, Long.parseLong(dto.getProfissionalId()))
=======
    Profissional profissional = profissionalRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(dto.getProfissionalId()))
>>>>>>> Stashed changes
            .orElseThrow(() -> new IllegalArgumentException("Profissional not found: " + dto.getProfissionalId()));

    Agendamento agendamento = new Agendamento();
    agendamento.setOrganizacaoId(orgId);
    agendamento.setData(dto.getData());
    agendamento.setHoraInicio(dto.getHoraInicio());
    agendamento.setHoraFim(dto.getHoraFim());
    agendamento.setPacienteId(paciente.getId());
    agendamento.setProfissionalId(Long.parseLong(dto.getProfissionalId()));
    agendamento.setStatus(dto.getStatus() != null ? dto.getStatus() : "agendado");
    agendamento.setProcedimentosIds(dto.getProcedimentosIds());
    agendamento.setObservacoes(dto.getObservacoes());
    agendamento.setConfirmado(dto.getConfirmado() != null ? dto.getConfirmado() : false);
    agendamento.setPaciente(paciente);
    agendamento.setProfissional(profissional);

    Agendamento saved = agendamentoRepository.save(agendamento);
    log.info("Created appointment with ID: {}", saved.getId());
    return toDTO(saved);
}

    public AgendamentoDTO atualizar(String id, AgendamentoDTO dto) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Updating agendamento {} for organization: {}", id, orgId);

<<<<<<< Updated upstream
        Agendamento agendamento = agendamentoRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id))
=======
        Agendamento agendamento = agendamentoRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id)) 
>>>>>>> Stashed changes
                .orElseThrow(() -> new IllegalArgumentException("Agendamento not found with ID: " + id));

        if (dto.getData() != null) agendamento.setData(dto.getData());
        if (dto.getHoraInicio() != null) agendamento.setHoraInicio(dto.getHoraInicio());
        if (dto.getHoraFim() != null) agendamento.setHoraFim(dto.getHoraFim());
        if (dto.getStatus() != null) agendamento.setStatus(dto.getStatus());
        if (dto.getProcedimentosIds() != null) agendamento.setProcedimentosIds(dto.getProcedimentosIds());
        if (dto.getObservacoes() != null) agendamento.setObservacoes(dto.getObservacoes());
        if (dto.getConfirmado() != null) agendamento.setConfirmado(dto.getConfirmado());

        if (dto.getPacienteId() != null && !dto.getPacienteId().equals(agendamento.getPacienteId().toString())) {
            UUID newPacienteId;
            try {
                newPacienteId = UUID.fromString(dto.getPacienteId());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid Patient ID format: " + dto.getPacienteId(), e);
            }
<<<<<<< Updated upstream
            Paciente paciente = pacienteRepository.findByOrganizacaoIdAndId(orgId, newPacienteId)
=======
            Paciente paciente = pacienteRepository.findByOrganizacaoIdAndId(orgId, newPacienteId) 
>>>>>>> Stashed changes
                    .orElseThrow(() -> new IllegalArgumentException("Paciente not found with ID: " + dto.getPacienteId()));
            agendamento.setPacienteId(newPacienteId); 
            agendamento.setPaciente(paciente);
        }

<<<<<<< Updated upstream
        if (dto.getProfissionalId() != null && !dto.getProfissionalId().equals(agendamento.getProfissionalId().toString())) {
=======
        if (dto.getProfissionalId() != null && !dto.getProfissionalId().equals(agendamento.getProfissionalId().toString())) { 
>>>>>>> Stashed changes
            UUID newProfissionalId;
            try { newProfissionalId = UUID.fromString(dto.getProfissionalId()); } catch (IllegalArgumentException e) { throw new IllegalArgumentException("Invalid Professional ID format: " + dto.getProfissionalId(), e); }
            Profissional profissional = profissionalRepository.findByOrganizacaoIdAndId(orgId, newProfissionalId) 
                    .orElseThrow(() -> new IllegalArgumentException("Profissional not found: " + dto.getProfissionalId()));
<<<<<<< Updated upstream
            agendamento.setProfissionalId(newProfissionalId); 
=======
            agendamento.setProfissionalId(newProfissionalId);
>>>>>>> Stashed changes
            agendamento.setProfissional(profissional);
        }

        Agendamento updated = agendamentoRepository.save(agendamento);
        return toDTO(updated);
    }

    public void deletar(String id) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Deleting agendamento {} for organization: {}", id, orgId);

<<<<<<< Updated upstream
        Agendamento agendamento = agendamentoRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id))
=======
        Agendamento agendamento = agendamentoRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id)) 
>>>>>>> Stashed changes
                .orElseThrow(() -> new IllegalArgumentException("Agendamento not found with ID: " + id));

        agendamentoRepository.delete(agendamento);
    }

    private AgendamentoDTO toDTO(Agendamento agendamento) {
        return new AgendamentoDTO(
<<<<<<< Updated upstream
                agendamento.getId() != null ? agendamento.getId().toString() : null, 
=======
                agendamento.getId() != null ? agendamento.getId().toString() : null,
>>>>>>> Stashed changes
                agendamento.getData(),
                agendamento.getHoraInicio(),
                agendamento.getHoraFim(),
                agendamento.getPacienteId() != null ? agendamento.getPacienteId().toString() : null, 
                agendamento.getPaciente() != null ? agendamento.getPaciente().getNome() : null,
<<<<<<< Updated upstream
                agendamento.getProfissionalId() != null ? agendamento.getProfissionalId().toString() : null,
=======
                agendamento.getProfissionalId() != null ? agendamento.getProfissionalId().toString() : null, 
>>>>>>> Stashed changes
                agendamento.getProfissional() != null ? agendamento.getProfissional().getNome() : null,
                agendamento.getStatus(),
                agendamento.getProcedimentosIds(),
                agendamento.getObservacoes(),
                agendamento.getConfirmado(),
                agendamento.getCriadoEm(),
                agendamento.getAtualizadoEm()
        );
    }
}