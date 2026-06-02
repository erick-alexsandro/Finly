package com.smilecorp.api.service;

import com.smilecorp.api.dto.ProfissionalDTO;
import com.smilecorp.api.entity.Profissional;
import com.smilecorp.api.repository.ProfissionalRepository;
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
public class ProfissionalService {
    private static final Logger log = LoggerFactory.getLogger(ProfissionalService.class);

    private final ProfissionalRepository profissionalRepository;

    public ProfissionalService(ProfissionalRepository profissionalRepository) {
        this.profissionalRepository = profissionalRepository;
    }

    public List<ProfissionalDTO> listar(String nome) {
        String orgId = TenantContext.getOrganizationId();
        log.debug("Listing profissionais for organization: {}", orgId);

        List<Profissional> profissionais;
        if (nome != null && !nome.isEmpty()) {
            profissionais = profissionalRepository.findByOrganizacaoIdAndNomeContainingIgnoreCase(orgId, nome);
        } else {
            profissionais = profissionalRepository.findByOrganizacaoId(orgId);
        }

        return profissionais.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ProfissionalDTO obterPorId(String id) {
        String orgId = TenantContext.getOrganizationId();
        Profissional profissional = profissionalRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id)) 
                .orElseThrow(() -> new IllegalArgumentException("Profissional not found with ID: " + id));
        return toDTO(profissional);
    }

    public ProfissionalDTO criar(ProfissionalDTO dto) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Creating new profissional for organization: {}", orgId);

        Profissional profissional = new Profissional();
        profissional.setOrganizacaoId(orgId);
        profissional.setNome(dto.getNome());
        profissional.setEmail(dto.getEmail());
        profissional.setTelefone(dto.getTelefone());
        profissional.setCpf(dto.getCpf());
        profissional.setEspecialidade(dto.getEspecialidade());
        profissional.setNumeroRegistro(dto.getNumeroRegistro());
        profissional.setAtivo(true);

        Profissional saved = profissionalRepository.save(profissional);
        return toDTO(saved);
    }

    public ProfissionalDTO atualizar(String id, ProfissionalDTO dto) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Updating profissional {} for organization: {}", id, orgId);

        Profissional profissional = profissionalRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id))
                .orElseThrow(() -> new IllegalArgumentException("Profissional not found with ID: " + id));

        if (dto.getNome() != null) profissional.setNome(dto.getNome());
        if (dto.getEmail() != null) profissional.setEmail(dto.getEmail());
        if (dto.getTelefone() != null) profissional.setTelefone(dto.getTelefone());
        if (dto.getCpf() != null) profissional.setCpf(dto.getCpf());
        if (dto.getEspecialidade() != null) profissional.setEspecialidade(dto.getEspecialidade());
        if (dto.getNumeroRegistro() != null) profissional.setNumeroRegistro(dto.getNumeroRegistro());
        if (dto.getAtivo() != null) profissional.setAtivo(dto.getAtivo());

        Profissional updated = profissionalRepository.save(profissional);
        return toDTO(updated);
    }

    public void deletar(String id) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Deleting profissional {} for organization: {}", id, orgId);

        Profissional profissional = profissionalRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id)) 
                .orElseThrow(() -> new IllegalArgumentException("Profissional not found with ID: " + id));

        profissionalRepository.delete(profissional);
    }

    private ProfissionalDTO toDTO(Profissional profissional) {
        return new ProfissionalDTO(
                profissional.getId() != null ? profissional.getId().toString() : null, 
                profissional.getNome(),
                profissional.getEmail(),
                profissional.getTelefone(),
                profissional.getCpf(),
                profissional.getEspecialidade(),
                profissional.getNumeroRegistro(),
                profissional.getAtivo(),
                profissional.getCriadoEm(),
                profissional.getAtualizadoEm()
        );
    }
}
