package com.smilecorp.api.service;

import com.smilecorp.api.dto.ProcedimentoDTO;
import com.smilecorp.api.entity.Procedimento;
import com.smilecorp.api.repository.ProcedimentoRepository;
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
public class ProcedimentoService {
    private static final Logger log = LoggerFactory.getLogger(ProcedimentoService.class);

    private final ProcedimentoRepository procedimentoRepository;

    public ProcedimentoService(ProcedimentoRepository procedimentoRepository) {
        this.procedimentoRepository = procedimentoRepository;
    }

    public List<ProcedimentoDTO> listar(String nome) {
        String orgId = TenantContext.getOrganizationId();
        log.debug("Listing procedimentos for organization: {}", orgId);

        List<Procedimento> procedimentos;
        if (nome != null && !nome.isEmpty()) {
            procedimentos = procedimentoRepository.findByOrganizacaoIdAndNomeContainingIgnoreCase(orgId, nome);
        } else {
            procedimentos = procedimentoRepository.findByOrganizacaoId(orgId);
        }

        return procedimentos.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ProcedimentoDTO obterPorId(String id) {
        String orgId = TenantContext.getOrganizationId();
        Procedimento procedimento = procedimentoRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id))
                .orElseThrow(() -> new IllegalArgumentException("Procedimento not found with ID: " + id));
        return toDTO(procedimento);
    }

    public ProcedimentoDTO criar(ProcedimentoDTO dto) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Creating new procedimento for organization: {}", orgId);

        Procedimento procedimento = new Procedimento();
        procedimento.setOrganizacaoId(orgId);
        procedimento.setNome(dto.getNome());
        procedimento.setDescricao(dto.getDescricao());
        procedimento.setDuracaoMinutos(dto.getDuracaoMinutos());
        procedimento.setPreco(dto.getPreco());
        procedimento.setCategoria(dto.getCategoria());
        procedimento.setAtivo(true);

        Procedimento saved = procedimentoRepository.save(procedimento);
        return toDTO(saved);
    }

    public ProcedimentoDTO atualizar(String id, ProcedimentoDTO dto) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Updating procedimento {} for organization: {}", id, orgId);

        Procedimento procedimento = procedimentoRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id)) 
                .orElseThrow(() -> new IllegalArgumentException("Procedimento not found with ID: " + id));

        if (dto.getNome() != null) procedimento.setNome(dto.getNome());
        if (dto.getDescricao() != null) procedimento.setDescricao(dto.getDescricao());
        if (dto.getDuracaoMinutos() != null) procedimento.setDuracaoMinutos(dto.getDuracaoMinutos());
        if (dto.getPreco() != null) procedimento.setPreco(dto.getPreco());
        if (dto.getCategoria() != null) procedimento.setCategoria(dto.getCategoria());
        if (dto.getAtivo() != null) procedimento.setAtivo(dto.getAtivo());

        Procedimento updated = procedimentoRepository.save(procedimento);
        return toDTO(updated);
    }

    public void deletar(String id) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Deleting procedimento {} for organization: {}", id, orgId);

        Procedimento procedimento = procedimentoRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id)) 
                .orElseThrow(() -> new IllegalArgumentException("Procedimento not found with ID: " + id));

        procedimentoRepository.delete(procedimento);
    }

    private ProcedimentoDTO toDTO(Procedimento procedimento) {
        return new ProcedimentoDTO(
                procedimento.getId() != null ? procedimento.getId().toString() : null, 
                procedimento.getNome(),
                procedimento.getDescricao(),
                procedimento.getDuracaoMinutos(),
                procedimento.getPreco(),
                procedimento.getCategoria(),
                procedimento.getAtivo(),
                procedimento.getCriadoEm(),
                procedimento.getAtualizadoEm()
        );
    }
}
