package com.smilecorp.api.service;

import com.smilecorp.api.dto.FornecedorDTO;
import com.smilecorp.api.entity.Fornecedor;
import com.smilecorp.api.repository.FornecedorRepository;
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
public class FornecedorService {
    private static final Logger log = LoggerFactory.getLogger(FornecedorService.class);

    private final FornecedorRepository fornecedorRepository;

    public FornecedorService(FornecedorRepository fornecedorRepository) {
        this.fornecedorRepository = fornecedorRepository;
    }

    public List<FornecedorDTO> listar(String nome, String status) {
        String orgId = TenantContext.getOrganizationId();
        log.debug("Listing fornecedores for organization: {}", orgId);

        List<Fornecedor> fornecedores;
        if (nome != null && !nome.isEmpty()) {
            fornecedores = fornecedorRepository.findByOrganizacaoIdAndNomeContainingIgnoreCase(orgId, nome);
        } else {
            fornecedores = fornecedorRepository.findByOrganizacaoId(orgId);
        }

        if (status != null && !status.isEmpty() && !status.equals("todos")) {
            fornecedores = fornecedores.stream()
                    .filter(f -> f.getStatus().equals(status))
                    .collect(Collectors.toList());
        }

        return fornecedores.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public FornecedorDTO obterPorId(String id) {
        String orgId = TenantContext.getOrganizationId();
        Fornecedor fornecedor = fornecedorRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id))
                .orElseThrow(() -> new IllegalArgumentException("Fornecedor not found with ID: " + id));
        return toDTO(fornecedor);
    }

    public FornecedorDTO criar(FornecedorDTO dto) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Creating new fornecedor for organization: {}", orgId);

        Fornecedor fornecedor = new Fornecedor();
        fornecedor.setOrganizacaoId(orgId);
        fornecedor.setNome(dto.getNome());
        fornecedor.setCnpjCpf(dto.getCnpjCpf());
        fornecedor.setTelefone(dto.getTelefone());
        fornecedor.setEmail(dto.getEmail());
        fornecedor.setRua(dto.getRua());
        fornecedor.setNumero(dto.getNumero());
        fornecedor.setBairro(dto.getBairro());
        fornecedor.setCidade(dto.getCidade());
        fornecedor.setEndereco(dto.getEndereco() != null ? dto.getEndereco() : construirEndereco(dto.getRua(), dto.getNumero(), dto.getBairro(), dto.getCidade()));
        fornecedor.setStatus(dto.getStatus() != null ? dto.getStatus() : "ativo");
        fornecedor.setAtivo(true);

        Fornecedor saved = fornecedorRepository.save(fornecedor);
        return toDTO(saved);
    }

    public FornecedorDTO atualizar(String id, FornecedorDTO dto) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Updating fornecedor {} for organization: {}", id, orgId);

        Fornecedor fornecedor = fornecedorRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id))
                .orElseThrow(() -> new IllegalArgumentException("Fornecedor not found with ID: " + id));

        if (dto.getNome() != null) fornecedor.setNome(dto.getNome());
        if (dto.getCnpjCpf() != null) fornecedor.setCnpjCpf(dto.getCnpjCpf());
        if (dto.getTelefone() != null) fornecedor.setTelefone(dto.getTelefone());
        if (dto.getEmail() != null) fornecedor.setEmail(dto.getEmail());
        if (dto.getRua() != null) fornecedor.setRua(dto.getRua());
        if (dto.getNumero() != null) fornecedor.setNumero(dto.getNumero());
        if (dto.getBairro() != null) fornecedor.setBairro(dto.getBairro());
        if (dto.getCidade() != null) fornecedor.setCidade(dto.getCidade());
        if (dto.getEndereco() != null) {
            fornecedor.setEndereco(dto.getEndereco());
        } else if (dto.getRua() != null || dto.getNumero() != null || dto.getBairro() != null || dto.getCidade() != null) {
            fornecedor.setEndereco(construirEndereco(
                dto.getRua() != null ? dto.getRua() : fornecedor.getRua(),
                dto.getNumero() != null ? dto.getNumero() : fornecedor.getNumero(),
                dto.getBairro() != null ? dto.getBairro() : fornecedor.getBairro(),
                dto.getCidade() != null ? dto.getCidade() : fornecedor.getCidade()
            ));
        }
        if (dto.getStatus() != null) fornecedor.setStatus(dto.getStatus());
        if (dto.getAtivo() != null) fornecedor.setAtivo(dto.getAtivo());

        Fornecedor updated = fornecedorRepository.save(fornecedor);
        return toDTO(updated);
    }

    public void deletar(String id) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Deleting fornecedor {} for organization: {}", id, orgId);

        Fornecedor fornecedor = fornecedorRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id))
                .orElseThrow(() -> new IllegalArgumentException("Fornecedor not found with ID: " + id));

        fornecedorRepository.delete(fornecedor);
    }

    private FornecedorDTO toDTO(Fornecedor fornecedor) {
        return new FornecedorDTO(
                fornecedor.getId() != null ? fornecedor.getId().toString() : null,
                fornecedor.getNome(),
                fornecedor.getCnpjCpf(),
                fornecedor.getTelefone(),
                fornecedor.getEmail(),
                fornecedor.getRua(),
                fornecedor.getNumero(),
                fornecedor.getBairro(),
                fornecedor.getCidade(),
                fornecedor.getEndereco(),
                fornecedor.getStatus(),
                fornecedor.getAtivo(),
                fornecedor.getCriadoEm(),
                fornecedor.getAtualizadoEm()
        );
    }

    private String construirEndereco(String rua, String numero, String bairro, String cidade) {
        StringBuilder sb = new StringBuilder();
        if (rua != null && !rua.isBlank()) sb.append(rua);
        if (numero != null && !numero.isBlank()) sb.append(sb.length() > 0 ? ", " : "").append(numero);
        if (bairro != null && !bairro.isBlank()) sb.append(sb.length() > 0 ? ", " : "").append(bairro);
        if (cidade != null && !cidade.isBlank()) sb.append(sb.length() > 0 ? ", " : "").append(cidade);
        return sb.toString();
    }
}
