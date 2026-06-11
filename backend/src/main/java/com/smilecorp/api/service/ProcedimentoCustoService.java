package com.smilecorp.api.service;

import com.smilecorp.api.dto.ProcedimentoCustoDTO;
import com.smilecorp.api.entity.Procedimento;
import com.smilecorp.api.entity.ProcedimentoCusto;
import com.smilecorp.api.repository.ClinicaConfigRepository;
import com.smilecorp.api.repository.ProcedimentoCustoRepository;
import com.smilecorp.api.repository.ProcedimentoRepository;
import com.smilecorp.api.util.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProcedimentoCustoService {
    private static final Logger log = LoggerFactory.getLogger(ProcedimentoCustoService.class);

    private final ProcedimentoCustoRepository custoRepository;
    private final ProcedimentoRepository procedimentoRepository;
    private final ClinicaConfigRepository configRepository;

    public ProcedimentoCustoService(ProcedimentoCustoRepository custoRepository,
                                    ProcedimentoRepository procedimentoRepository,
                                    ClinicaConfigRepository configRepository) {
        this.custoRepository = custoRepository;
        this.procedimentoRepository = procedimentoRepository;
        this.configRepository = configRepository;
    }

    public List<ProcedimentoCustoDTO> listarPorProcedimento(String procedimentoId) {
        String orgId = TenantContext.getOrganizationId();
        UUID procId = UUID.fromString(procedimentoId);
        Procedimento procedimento = procedimentoRepository.findByOrganizacaoIdAndId(orgId, procId)
                .orElseThrow(() -> new IllegalArgumentException("Procedimento not found: " + procedimentoId));

        List<ProcedimentoCustoDTO> custos = custoRepository.findByProcedimentoId(procId).stream()
                .map(this::toDTO)
                .collect(Collectors.toCollection(ArrayList::new));

        BigDecimal horaClinicaValor = configRepository.findByChave("hora_clinica_valor")
                .map(c -> { try { return new BigDecimal(c.getValor()); } catch (Exception e) { return BigDecimal.ZERO; } })
                .orElse(BigDecimal.ZERO);

        BigDecimal gastoClinica = BigDecimal.ZERO;
        if (procedimento.getDuracaoMinutos() != null && procedimento.getDuracaoMinutos() > 0) {
            BigDecimal horas = BigDecimal.valueOf(procedimento.getDuracaoMinutos())
                    .divide(BigDecimal.valueOf(60), 4, RoundingMode.HALF_UP);
            gastoClinica = horaClinicaValor.multiply(horas).setScale(2, RoundingMode.HALF_UP);
        }

        custos.add(new ProcedimentoCustoDTO(null, "GASTO_CLINICA", "FIXO", gastoClinica, "Calculado: " + (procedimento.getDuracaoMinutos() != null ? procedimento.getDuracaoMinutos() : 0) + "min x R$ " + horaClinicaValor + "/h"));

        return custos;
    }

    public List<ProcedimentoCustoDTO> salvar(String procedimentoId, List<ProcedimentoCustoDTO> custos) {
        String orgId = TenantContext.getOrganizationId();
        UUID procId = UUID.fromString(procedimentoId);
        procedimentoRepository.findByOrganizacaoIdAndId(orgId, procId)
                .orElseThrow(() -> new IllegalArgumentException("Procedimento not found: " + procedimentoId));

        custoRepository.deleteByProcedimentoId(procId);

        List<ProcedimentoCusto> entities = custos.stream()
                .filter(dto -> !"GASTO_CLINICA".equals(dto.getTipo()))
                .map(dto -> {
                    ProcedimentoCusto entity = new ProcedimentoCusto();
                    entity.setProcedimentoId(procId);
                    entity.setTipo(dto.getTipo());
                    entity.setTipoValor(dto.getTipoValor());
                    entity.setValor(dto.getValor());
                    entity.setDescricao(dto.getDescricao());
                    return entity;
                })
                .collect(Collectors.toList());

        List<ProcedimentoCusto> saved = custoRepository.saveAll(entities);
        log.info("Saved {} cost entries for procedimento {}", saved.size(), procedimentoId);
        return saved.stream().map(this::toDTO).collect(Collectors.toList());
    }

    private ProcedimentoCustoDTO toDTO(ProcedimentoCusto entity) {
        return new ProcedimentoCustoDTO(
                entity.getId(),
                entity.getTipo(),
                entity.getTipoValor(),
                entity.getValor(),
                entity.getDescricao()
        );
    }
}
