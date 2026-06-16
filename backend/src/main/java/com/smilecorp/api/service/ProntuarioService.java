package com.smilecorp.api.service;

import com.smilecorp.api.dto.ProntuarioDTO;
import com.smilecorp.api.entity.Prontuario;
import com.smilecorp.api.repository.ProntuarioRepository;
import com.smilecorp.api.util.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProntuarioService {
    private static final Logger log = LoggerFactory.getLogger(ProntuarioService.class);

    private final ProntuarioRepository prontuarioRepository;

    public ProntuarioService(ProntuarioRepository prontuarioRepository) {
        this.prontuarioRepository = prontuarioRepository;
    }

    public List<ProntuarioDTO> listarPorPaciente(UUID pacienteId) {
        String orgId = TenantContext.getOrganizationId();
        return prontuarioRepository.findByOrganizacaoIdAndPacienteId(orgId, pacienteId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ProntuarioDTO obterPorAgendamento(UUID agendamentoId) {
        String orgId = TenantContext.getOrganizationId();
        Prontuario prontuario = prontuarioRepository
                .findByOrganizacaoIdAndAgendamentoId(orgId, agendamentoId)
                .orElseThrow(() -> new IllegalArgumentException("Prontuario not found for agendamento: " + agendamentoId));
        return toDTO(prontuario);
    }

    public boolean existePorAgendamento(UUID agendamentoId) {
        String orgId = TenantContext.getOrganizationId();
        return prontuarioRepository.existsByOrganizacaoIdAndAgendamentoId(orgId, agendamentoId);
    }

    public ProntuarioDTO criar(ProntuarioDTO dto) {
        String orgId = TenantContext.getOrganizationId();
        Prontuario prontuario = new Prontuario();
        prontuario.setOrganizacaoId(orgId);
        prontuario.setAgendamentoId(dto.getAgendamentoId());
        prontuario.setPacienteId(dto.getPacienteId());
        prontuario.setConteudo(dto.getConteudo());
        prontuario.setData(dto.getData());
        prontuario.setProfissionalId(dto.getProfissionalId());
        prontuario.setDente(dto.getDente());
        if (dto.getProcedimentosExecutados() != null) prontuario.setProcedimentosExecutados(new ArrayList<>(dto.getProcedimentosExecutados()));
        prontuario.setSecao(dto.getSecao());
        prontuario.setDetalhesProximaConsulta(dto.getDetalhesProximaConsulta());
        prontuario.setObservacoes(dto.getObservacoes());
        Prontuario saved = prontuarioRepository.save(prontuario);
        return toDTO(saved);
    }

    public ProntuarioDTO atualizar(UUID id, ProntuarioDTO dto) {
        String orgId = TenantContext.getOrganizationId();
        Prontuario prontuario = prontuarioRepository.findByOrganizacaoIdAndId(orgId, id)
                .orElseThrow(() -> new IllegalArgumentException("Prontuario not found with ID: " + id));
        if (dto.getConteudo() != null) prontuario.setConteudo(dto.getConteudo());
        if (dto.getData() != null) prontuario.setData(dto.getData());
        if (dto.getProfissionalId() != null) prontuario.setProfissionalId(dto.getProfissionalId());
        if (dto.getDente() != null) prontuario.setDente(dto.getDente());
        if (dto.getProcedimentosExecutados() != null) prontuario.setProcedimentosExecutados(new ArrayList<>(dto.getProcedimentosExecutados()));
        if (dto.getSecao() != null) prontuario.setSecao(dto.getSecao());
        if (dto.getDetalhesProximaConsulta() != null) prontuario.setDetalhesProximaConsulta(dto.getDetalhesProximaConsulta());
        if (dto.getObservacoes() != null) prontuario.setObservacoes(dto.getObservacoes());
        Prontuario updated = prontuarioRepository.save(prontuario);
        return toDTO(updated);
    }

    private ProntuarioDTO toDTO(Prontuario prontuario) {
        return new ProntuarioDTO(
                prontuario.getId(), prontuario.getAgendamentoId(), prontuario.getPacienteId(),
                prontuario.getConteudo(), prontuario.getData(), prontuario.getProfissionalId(),
                prontuario.getDente(), prontuario.getProcedimentosExecutados(), prontuario.getSecao(),
                prontuario.getDetalhesProximaConsulta(), prontuario.getObservacoes(),
                prontuario.getCriadoEm(), prontuario.getAtualizadoEm()
        );
    }
}
