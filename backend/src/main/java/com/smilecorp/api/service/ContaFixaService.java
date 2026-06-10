package com.smilecorp.api.service;

import com.smilecorp.api.dto.ContaFixaDTO;
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
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ContaFixaService {
    private static final Logger log = LoggerFactory.getLogger(ContaFixaService.class);

    private final ContaFixaRepository contaFixaRepository;
    private final TransacaoFinanceiraRepository transacaoFinanceiraRepository;

    public ContaFixaService(ContaFixaRepository contaFixaRepository, TransacaoFinanceiraRepository transacaoFinanceiraRepository) {
        this.contaFixaRepository = contaFixaRepository;
        this.transacaoFinanceiraRepository = transacaoFinanceiraRepository;
    }

    public List<ContaFixaDTO> listar(String tipo, String status) {
        String orgId = TenantContext.getOrganizationId();
        log.debug("Listing contas fixas for organization: {}", orgId);

        List<ContaFixa> contas;
        if (tipo != null) {
            contas = contaFixaRepository.findByOrganizacaoIdAndTipo(orgId, tipo);
        } else {
            contas = contaFixaRepository.findByOrganizacaoId(orgId);
        }

        if (status != null && !status.isEmpty() && !status.equals("todos")) {
            String finalStatus = status;
            contas = contas.stream()
                    .filter(c -> c.getStatus().equals(finalStatus))
                    .collect(Collectors.toList());
        }

        return contas.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ContaFixaDTO obterPorId(String id) {
        String orgId = TenantContext.getOrganizationId();
        ContaFixa contaFixa = contaFixaRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id))
                .orElseThrow(() -> new IllegalArgumentException("Conta fixa not found with ID: " + id));
        return toDTO(contaFixa);
    }

    public ContaFixaDTO criar(ContaFixaDTO dto) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Creating new conta fixa for organization: {}", orgId);

        ContaFixa contaFixa = new ContaFixa();
        contaFixa.setOrganizacaoId(orgId);
        contaFixa.setTipo(dto.getTipo());
        contaFixa.setDescricao(dto.getDescricao());
        contaFixa.setCategoria(dto.getCategoria());
        contaFixa.setValor(dto.getValor());
        contaFixa.setDiaVencimento(dto.getDiaVencimento());
        contaFixa.setDataInicio(dto.getDataInicio());
        contaFixa.setDataFim(dto.getDataFim());
        contaFixa.setStatus(dto.getStatus() != null ? dto.getStatus() : "ativa");
        contaFixa.setObservacao(dto.getObservacao());

        ContaFixa saved = contaFixaRepository.save(contaFixa);
        gerarTransacoes(saved);
        return toDTO(saved);
    }

    public ContaFixaDTO atualizar(String id, ContaFixaDTO dto) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Updating conta fixa {} for organization: {}", id, orgId);

        ContaFixa contaFixa = contaFixaRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id))
                .orElseThrow(() -> new IllegalArgumentException("Conta fixa not found with ID: " + id));

        if (dto.getTipo() != null) contaFixa.setTipo(dto.getTipo());
        if (dto.getDescricao() != null) contaFixa.setDescricao(dto.getDescricao());
        if (dto.getCategoria() != null) contaFixa.setCategoria(dto.getCategoria());
        if (dto.getValor() != null) contaFixa.setValor(dto.getValor());
        if (dto.getDiaVencimento() != null) contaFixa.setDiaVencimento(dto.getDiaVencimento());
        if (dto.getDataInicio() != null) contaFixa.setDataInicio(dto.getDataInicio());
        if (dto.getDataFim() != null) contaFixa.setDataFim(dto.getDataFim());
        if (dto.getStatus() != null) contaFixa.setStatus(dto.getStatus());
        if (dto.getObservacao() != null) contaFixa.setObservacao(dto.getObservacao());

        ContaFixa updated = contaFixaRepository.save(contaFixa);
        return toDTO(updated);
    }

    public void deletar(String id) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Deleting conta fixa {} for organization: {}", id, orgId);

        ContaFixa contaFixa = contaFixaRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id))
                .orElseThrow(() -> new IllegalArgumentException("Conta fixa not found with ID: " + id));

        List<TransacaoFinanceira> transacoes = transacaoFinanceiraRepository.findByOrganizacaoIdAndContaFixaId(orgId, contaFixa.getId());
        for (TransacaoFinanceira t : transacoes) {
            t.setContaFixa(null);
        }
        transacaoFinanceiraRepository.saveAll(transacoes);

        contaFixaRepository.delete(contaFixa);
    }

    private void gerarTransacoes(ContaFixa contaFixa) {
        String orgId = contaFixa.getOrganizacaoId();
        LocalDate inicio = contaFixa.getDataInicio();
        LocalDate fim = contaFixa.getDataFim();
        int dia = contaFixa.getDiaVencimento();
        YearMonth current = YearMonth.from(inicio);
        YearMonth end = fim != null ? YearMonth.from(fim) : YearMonth.now();

        List<TransacaoFinanceira> transacoes = new ArrayList<>();
        while (!current.isAfter(end)) {
            int ultimoDia = current.atEndOfMonth().lengthOfMonth();
            int diaEfetivo = Math.min(dia, ultimoDia);
            if (fim != null && current.equals(end) && dia > fim.getDayOfMonth()) break;

            TransacaoFinanceira t = new TransacaoFinanceira();
            t.setOrganizacaoId(orgId);
            t.setContaFixa(contaFixa);
            t.setTipo(contaFixa.getTipo());
            t.setDescricao(contaFixa.getDescricao());
            t.setCategoria(contaFixa.getCategoria());
            t.setValor(contaFixa.getValor());
            t.setData(current.atDay(diaEfetivo));
            t.setStatus("previsto");
            transacoes.add(t);

            current = current.plusMonths(1);
        }

        transacaoFinanceiraRepository.saveAll(transacoes);
        log.info("Generated {} transacoes for conta fixa {}", transacoes.size(), contaFixa.getId());
    }

    private ContaFixaDTO toDTO(ContaFixa contaFixa) {
        return new ContaFixaDTO(
                contaFixa.getId() != null ? contaFixa.getId().toString() : null,
                contaFixa.getTipo(),
                contaFixa.getDescricao(),
                contaFixa.getCategoria(),
                contaFixa.getValor(),
                contaFixa.getDiaVencimento(),
                contaFixa.getDataInicio(),
                contaFixa.getDataFim(),
                contaFixa.getStatus(),
                contaFixa.getObservacao(),
                contaFixa.getCriadoEm(),
                contaFixa.getAtualizadoEm()
        );
    }
}
