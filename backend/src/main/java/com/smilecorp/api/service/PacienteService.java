package com.smilecorp.api.service;

import com.smilecorp.api.dto.PacienteDTO;
import com.smilecorp.api.entity.Paciente;
import com.smilecorp.api.repository.PacienteRepository;
import com.smilecorp.api.util.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class PacienteService {
    private static final Logger log = LoggerFactory.getLogger(PacienteService.class);

    private final PacienteRepository pacienteRepository;

    public PacienteService(PacienteRepository pacienteRepository) {
        this.pacienteRepository = pacienteRepository;
    }

    public List<PacienteDTO> listar(String nome) {
        String orgId = TenantContext.getOrganizationId();
        log.debug("Listing pacientes for organization: {}", orgId);

        List<Paciente> pacientes;
        if (nome != null && !nome.isEmpty()) {
            pacientes = pacienteRepository.findByOrganizacaoIdAndNomeContainingIgnoreCase(orgId, nome);
        } else {
            pacientes = pacienteRepository.findByOrganizacaoId(orgId);
        }

        return pacientes.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public PacienteDTO obterPorId(String id) {
        String orgId = TenantContext.getOrganizationId();
        Paciente paciente = pacienteRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id)) 
                .orElseThrow(() -> new IllegalArgumentException("Paciente not found with ID: " + id));
        return toDTO(paciente);
    }

    public PacienteDTO criar(PacienteDTO dto) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Creating new paciente for organization: {}", orgId);

        Paciente paciente = new Paciente();
        paciente.setOrganizacaoId(orgId);
        paciente.setNome(dto.getNome());
        paciente.setEmail(dto.getEmail());
        paciente.setTelefone(dto.getTelefone());
        paciente.setCpf(dto.getCpf());
        paciente.setDataNascimento(dto.getDataNascimento());
        paciente.setEndereco(dto.getEndereco());
        paciente.setObservacoes(dto.getObservacoes());
        paciente.setAtivo(true);

        Paciente saved = pacienteRepository.save(paciente);
        return toDTO(saved);
    }

    public PacienteDTO atualizar(String id, PacienteDTO dto) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Updating paciente {} for organization: {}", id, orgId);

        Paciente paciente = pacienteRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id)) 
                .orElseThrow(() -> new IllegalArgumentException("Paciente not found with ID: " + id));

        if (dto.getNome() != null) paciente.setNome(dto.getNome());
        if (dto.getEmail() != null) paciente.setEmail(dto.getEmail());
        if (dto.getTelefone() != null) paciente.setTelefone(dto.getTelefone());
        if (dto.getCpf() != null) paciente.setCpf(dto.getCpf());
        if (dto.getDataNascimento() != null) paciente.setDataNascimento(dto.getDataNascimento());
        if (dto.getEndereco() != null) paciente.setEndereco(dto.getEndereco());
        if (dto.getObservacoes() != null) paciente.setObservacoes(dto.getObservacoes());
        if (dto.getAtivo() != null) paciente.setAtivo(dto.getAtivo());

        Paciente updated = pacienteRepository.save(paciente);
        return toDTO(updated);
    }

    public void deletar(String id) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Deleting paciente {} for organization: {}", id, orgId);

        Paciente paciente = pacienteRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id)) 
                .orElseThrow(() -> new IllegalArgumentException("Paciente not found with ID: " + id));

        pacienteRepository.delete(paciente);
    }

    private PacienteDTO toDTO(Paciente paciente) {
        return new PacienteDTO(
                paciente.getId() != null ? paciente.getId().toString() : null, 
                paciente.getNome(),
                paciente.getEmail(),
                paciente.getTelefone(),
                paciente.getCpf(),
                paciente.getDataNascimento(),
                paciente.getEndereco(),
                paciente.getObservacoes(),
                paciente.getAtivo(),
                paciente.getCriadoEm(),
                paciente.getAtualizadoEm()
        );
    }
}
