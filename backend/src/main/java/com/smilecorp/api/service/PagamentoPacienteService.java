package com.smilecorp.api.service;

import com.smilecorp.api.dto.PagamentoPacienteDTO;
import com.smilecorp.api.entity.PagamentoPaciente;
import com.smilecorp.api.repository.PagamentoPacienteRepository;
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
public class PagamentoPacienteService {
    private static final Logger log = LoggerFactory.getLogger(PagamentoPacienteService.class);

    private final PagamentoPacienteRepository pagamentoPacienteRepository;

    public PagamentoPacienteService(PagamentoPacienteRepository pagamentoPacienteRepository) {
        this.pagamentoPacienteRepository = pagamentoPacienteRepository;
    }

    public List<PagamentoPacienteDTO> listarPorPaciente(UUID pacienteId) {
        String orgId = TenantContext.getOrganizationId();
        return pagamentoPacienteRepository.findByOrganizacaoIdAndPacienteId(orgId, pacienteId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public PagamentoPacienteDTO criar(PagamentoPacienteDTO dto) {
        String orgId = TenantContext.getOrganizationId();
        PagamentoPaciente pagamentoPaciente = new PagamentoPaciente();
        pagamentoPaciente.setOrganizacaoId(orgId);
        pagamentoPaciente.setPacienteId(dto.getPacienteId());
        pagamentoPaciente.setAgendamentoId(dto.getAgendamentoId());
        pagamentoPaciente.setNome(dto.getNome());
        pagamentoPaciente.setData(dto.getData());
        pagamentoPaciente.setValorTotal(dto.getValorTotal());
        pagamentoPaciente.setFormaPagamento(dto.getFormaPagamento());
        pagamentoPaciente.setParcelas(dto.getParcelas());
        pagamentoPaciente.setStatus(dto.getStatus());
        PagamentoPaciente saved = pagamentoPacienteRepository.save(pagamentoPaciente);
        return toDTO(saved);
    }

    public PagamentoPacienteDTO atualizar(UUID id, PagamentoPacienteDTO dto) {
        String orgId = TenantContext.getOrganizationId();
        PagamentoPaciente pagamentoPaciente = pagamentoPacienteRepository.findByOrganizacaoIdAndId(orgId, id)
                .orElseThrow(() -> new IllegalArgumentException("Pagamento not found with ID: " + id));
        if (dto.getNome() != null) pagamentoPaciente.setNome(dto.getNome());
        if (dto.getData() != null) pagamentoPaciente.setData(dto.getData());
        if (dto.getValorTotal() != null) pagamentoPaciente.setValorTotal(dto.getValorTotal());
        if (dto.getFormaPagamento() != null) pagamentoPaciente.setFormaPagamento(dto.getFormaPagamento());
        if (dto.getParcelas() != null) pagamentoPaciente.setParcelas(dto.getParcelas());
        if (dto.getStatus() != null) pagamentoPaciente.setStatus(dto.getStatus());
        PagamentoPaciente updated = pagamentoPacienteRepository.save(pagamentoPaciente);
        return toDTO(updated);
    }

    public void deletar(UUID id) {
        String orgId = TenantContext.getOrganizationId();
        PagamentoPaciente pagamentoPaciente = pagamentoPacienteRepository.findByOrganizacaoIdAndId(orgId, id)
                .orElseThrow(() -> new IllegalArgumentException("Pagamento not found with ID: " + id));
        pagamentoPacienteRepository.delete(pagamentoPaciente);
    }

    private PagamentoPacienteDTO toDTO(PagamentoPaciente pagamentoPaciente) {
        return new PagamentoPacienteDTO(
                pagamentoPaciente.getId(), pagamentoPaciente.getPacienteId(), pagamentoPaciente.getAgendamentoId(),
                pagamentoPaciente.getNome(), pagamentoPaciente.getData(), pagamentoPaciente.getValorTotal(),
                pagamentoPaciente.getFormaPagamento(), pagamentoPaciente.getParcelas(), pagamentoPaciente.getStatus(),
                pagamentoPaciente.getCriadoEm(), pagamentoPaciente.getAtualizadoEm()
        );
    }
}
