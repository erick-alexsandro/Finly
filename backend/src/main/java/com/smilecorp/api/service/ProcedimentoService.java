package com.smilecorp.api.service;

import com.smilecorp.api.dto.ProcedimentoDTO;
import com.smilecorp.api.dto.ProcedimentoMaterialDTO;
import com.smilecorp.api.entity.Procedimento;
import com.smilecorp.api.entity.ProcedimentoMaterial;
import com.smilecorp.api.entity.Produto;
import com.smilecorp.api.repository.ProcedimentoMaterialRepository;
import com.smilecorp.api.repository.ProcedimentoRepository;
import com.smilecorp.api.repository.ProdutoRepository;
import com.smilecorp.api.util.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Transactional
public class ProcedimentoService {
    private static final Logger log = LoggerFactory.getLogger(ProcedimentoService.class);

    private final ProcedimentoRepository procedimentoRepository;
    private final ProcedimentoMaterialRepository procedimentoMaterialRepository;
    private final ProdutoRepository produtoRepository;

    public ProcedimentoService(ProcedimentoRepository procedimentoRepository,
                               ProcedimentoMaterialRepository procedimentoMaterialRepository,
                               ProdutoRepository produtoRepository) {
        this.procedimentoRepository = procedimentoRepository;
        this.procedimentoMaterialRepository = procedimentoMaterialRepository;
        this.produtoRepository = produtoRepository;
    }

    public List<ProcedimentoDTO> listar(String nome, String categoria, String especialidade, Boolean ativo) {
        String orgId = TenantContext.getOrganizationId();
        log.debug("Listing procedimentos for organization: {}, filters - nome: {}, categoria: {}, especialidade: {}, ativo: {}",
                orgId, nome, categoria, especialidade, ativo);

        Stream<Procedimento> stream = procedimentoRepository.findByOrganizacaoId(orgId).stream();

        if (nome != null && !nome.isEmpty()) {
            stream = stream.filter(p -> p.getNome().toLowerCase().contains(nome.toLowerCase()));
        }
        if (categoria != null && !categoria.isEmpty()) {
            stream = stream.filter(p -> categoria.equals(p.getCategoria()));
        }
        if (especialidade != null && !especialidade.isEmpty()) {
            stream = stream.filter(p -> especialidade.equals(p.getEspecialidade()));
        }
        if (ativo != null) {
            stream = stream.filter(p -> ativo.equals(p.getAtivo()));
        }

        return stream.map(this::toDTO).collect(Collectors.toList());
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
        procedimento.setEspecialidade(dto.getEspecialidade());
        procedimento.setAtivo(true);

        if (dto.getMateriais() != null && !dto.getMateriais().isEmpty()) {
            List<ProcedimentoMaterial> materiais = dto.getMateriais().stream()
                    .map(mDTO -> {
                        Produto material = produtoRepository.findByOrganizacaoIdAndId(orgId, mDTO.getMaterialId())
                                .orElseThrow(() -> new IllegalArgumentException("Material not found with ID: " + mDTO.getMaterialId()));
                        return new ProcedimentoMaterial(procedimento, material, mDTO.getQuantidade());
                    })
                    .collect(Collectors.toList());
            procedimento.setMateriais(materiais);
        }

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
        if (dto.getEspecialidade() != null) procedimento.setEspecialidade(dto.getEspecialidade());
        if (dto.getAtivo() != null) procedimento.setAtivo(dto.getAtivo());

        procedimento.getMateriais().clear();
        procedimentoRepository.flush();
        if (dto.getMateriais() != null && !dto.getMateriais().isEmpty()) {
            List<ProcedimentoMaterial> materiais = dto.getMateriais().stream()
                    .map(mDTO -> {
                        Produto material = produtoRepository.findByOrganizacaoIdAndId(orgId, mDTO.getMaterialId())
                                .orElseThrow(() -> new IllegalArgumentException("Material not found with ID: " + mDTO.getMaterialId()));
                        return new ProcedimentoMaterial(procedimento, material, mDTO.getQuantidade());
                    })
                    .collect(Collectors.toList());
            procedimento.getMateriais().addAll(materiais);
        }

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
        List<ProcedimentoMaterialDTO> materiaisDTO = Collections.emptyList();
        if (procedimento.getMateriais() != null && !procedimento.getMateriais().isEmpty()) {
            materiaisDTO = procedimento.getMateriais().stream()
                    .map(pm -> new ProcedimentoMaterialDTO(
                            pm.getId(),
                            pm.getMaterial().getId(),
                            pm.getMaterial().getName(),
                            pm.getMaterial().getUnit(),
                            pm.getQuantidade()
                    ))
                    .collect(Collectors.toList());
        }

        return new ProcedimentoDTO(
                procedimento.getId() != null ? procedimento.getId().toString() : null,
                procedimento.getNome(),
                procedimento.getDescricao(),
                procedimento.getDuracaoMinutos(),
                procedimento.getPreco(),
                procedimento.getCategoria(),
                procedimento.getEspecialidade(),
                procedimento.getAtivo(),
                materiaisDTO,
                procedimento.getCriadoEm(),
                procedimento.getAtualizadoEm()
        );
    }
}
