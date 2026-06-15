package com.smilecorp.api.service;

import com.smilecorp.api.dto.TransacaoFinanceiraDTO;
import com.smilecorp.api.entity.ContaFixa;
import com.smilecorp.api.entity.TransacaoFinanceira;
import com.smilecorp.api.repository.ContaFixaRepository;
import com.smilecorp.api.repository.TransacaoFinanceiraRepository;
import com.smilecorp.api.util.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class TransacaoFinanceiraService {
    private static final Logger log = LoggerFactory.getLogger(TransacaoFinanceiraService.class);

    private final TransacaoFinanceiraRepository transacaoFinanceiraRepository;
    private final ContaFixaRepository contaFixaRepository;

    public TransacaoFinanceiraService(TransacaoFinanceiraRepository transacaoFinanceiraRepository, ContaFixaRepository contaFixaRepository) {
        this.transacaoFinanceiraRepository = transacaoFinanceiraRepository;
        this.contaFixaRepository = contaFixaRepository;
    }

    public List<TransacaoFinanceiraDTO> listar(String tipo, String status, LocalDate dataInicio, LocalDate dataFim) {
        String orgId = TenantContext.getOrganizationId();
        log.debug("Listing transacoes for organization: {}", orgId);

        List<TransacaoFinanceira> transacoes;
        if (tipo != null && dataInicio != null && dataFim != null) {
            transacoes = transacaoFinanceiraRepository.findByOrganizacaoIdAndTipoAndDataBetween(orgId, tipo, dataInicio, dataFim);
        } else if (dataInicio != null && dataFim != null) {
            transacoes = transacaoFinanceiraRepository.findByOrganizacaoIdAndDataBetween(orgId, dataInicio, dataFim);
        } else if (tipo != null) {
            transacoes = transacaoFinanceiraRepository.findByOrganizacaoIdAndTipo(orgId, tipo);
        } else {
            transacoes = transacaoFinanceiraRepository.findByOrganizacaoId(orgId);
        }

        if (status != null && !status.isEmpty()) {
            String finalStatus = status;
            transacoes = transacoes.stream()
                    .filter(t -> t.getStatus().equals(finalStatus))
                    .collect(Collectors.toList());
        }

        return transacoes.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public TransacaoFinanceiraDTO obterPorId(String id) {
        String orgId = TenantContext.getOrganizationId();
        TransacaoFinanceira transacao = transacaoFinanceiraRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id))
                .orElseThrow(() -> new IllegalArgumentException("Transação not found with ID: " + id));
        return toDTO(transacao);
    }

    public TransacaoFinanceiraDTO criar(TransacaoFinanceiraDTO dto) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Creating new transacao for organization: {}", orgId);

        TransacaoFinanceira transacao = new TransacaoFinanceira();
        transacao.setOrganizacaoId(orgId);
        transacao.setTipo(dto.getTipo());
        transacao.setDescricao(dto.getDescricao());
        transacao.setCategoria(dto.getCategoria());
        transacao.setValor(dto.getValor());
        transacao.setData(dto.getData());
        transacao.setStatus(dto.getStatus() != null ? dto.getStatus() : "previsto");
        transacao.setObservacao(dto.getObservacao());

        if (dto.getContaFixaId() != null) {
            ContaFixa contaFixa = contaFixaRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(dto.getContaFixaId()))
                    .orElseThrow(() -> new IllegalArgumentException("Conta fixa not found with ID: " + dto.getContaFixaId()));
            transacao.setContaFixa(contaFixa);
        }

        TransacaoFinanceira saved = transacaoFinanceiraRepository.save(transacao);
        return toDTO(saved);
    }

    public TransacaoFinanceiraDTO atualizar(String id, TransacaoFinanceiraDTO dto) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Updating transacao {} for organization: {}", id, orgId);

        TransacaoFinanceira transacao = transacaoFinanceiraRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id))
                .orElseThrow(() -> new IllegalArgumentException("Transação not found with ID: " + id));

        if (dto.getTipo() != null) transacao.setTipo(dto.getTipo());
        if (dto.getDescricao() != null) transacao.setDescricao(dto.getDescricao());
        if (dto.getCategoria() != null) transacao.setCategoria(dto.getCategoria());
        if (dto.getValor() != null) transacao.setValor(dto.getValor());
        if (dto.getData() != null) transacao.setData(dto.getData());
        if (dto.getStatus() != null) transacao.setStatus(dto.getStatus());
        if (dto.getObservacao() != null) transacao.setObservacao(dto.getObservacao());

        if (dto.getContaFixaId() != null) {
            ContaFixa contaFixa = contaFixaRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(dto.getContaFixaId()))
                    .orElseThrow(() -> new IllegalArgumentException("Conta fixa not found with ID: " + dto.getContaFixaId()));
            transacao.setContaFixa(contaFixa);
        } else {
            transacao.setContaFixa(null);
        }

        TransacaoFinanceira updated = transacaoFinanceiraRepository.save(transacao);
        return toDTO(updated);
    }

    public void deletar(String id) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Deleting transacao {} for organization: {}", id, orgId);

        TransacaoFinanceira transacao = transacaoFinanceiraRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id))
                .orElseThrow(() -> new IllegalArgumentException("Transação not found with ID: " + id));

        transacaoFinanceiraRepository.delete(transacao);
    }

    private TransacaoFinanceiraDTO toDTO(TransacaoFinanceira transacao) {
        return new TransacaoFinanceiraDTO(
                transacao.getId() != null ? transacao.getId().toString() : null,
                transacao.getTipo(),
                transacao.getDescricao(),
                transacao.getCategoria(),
                transacao.getValor(),
                transacao.getData(),
                transacao.getStatus(),
                transacao.getContaFixa() != null ? transacao.getContaFixa().getId().toString() : null,
                transacao.getContaFixa() != null ? transacao.getContaFixa().getDescricao() : null,
                transacao.getObservacao(),
                transacao.getCriadoEm(),
                transacao.getAtualizadoEm()
        );
    }
}
