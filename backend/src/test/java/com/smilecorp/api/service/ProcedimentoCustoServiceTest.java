package com.smilecorp.api.service;

import com.smilecorp.api.dto.ProcedimentoCustoDTO;
import com.smilecorp.api.entity.ClinicaConfig;
import com.smilecorp.api.entity.Procedimento;
import com.smilecorp.api.entity.ProcedimentoCusto;
import com.smilecorp.api.repository.ClinicaConfigRepository;
import com.smilecorp.api.repository.ProcedimentoCustoRepository;
import com.smilecorp.api.repository.ProcedimentoRepository;
import com.smilecorp.api.util.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProcedimentoCustoServiceTest {

    private static final String ORG_ID = "org-123";
    private static final UUID PROCEDIMENTO_ID = UUID.randomUUID();
    private static final String PROCEDIMENTO_ID_STR = PROCEDIMENTO_ID.toString();

    @Mock
    private ProcedimentoCustoRepository custoRepository;

    @Mock
    private ProcedimentoRepository procedimentoRepository;

    @Mock
    private ClinicaConfigRepository configRepository;

    @InjectMocks
    private ProcedimentoCustoService custoService;

    @Captor
    private ArgumentCaptor<List<ProcedimentoCusto>> custoListCaptor;

    @BeforeEach
    void setUp() {
        TenantContext.setOrganizationId(ORG_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private Procedimento createProcedimento(Integer duracaoMinutos) {
        Procedimento p = new Procedimento(ORG_ID, "Limpeza", "Limpeza completa",
                duracaoMinutos, new BigDecimal("150.00"), "Preventivo", true);
        p.setId(PROCEDIMENTO_ID);
        p.setCriadoEm(LocalDateTime.now());
        p.setAtualizadoEm(LocalDateTime.now());
        return p;
    }

    private ProcedimentoCusto createCustoEntity(String tipo, String tipoValor, BigDecimal valor, String descricao) {
        ProcedimentoCusto c = new ProcedimentoCusto();
        c.setId(1L);
        c.setProcedimentoId(PROCEDIMENTO_ID);
        c.setTipo(tipo);
        c.setTipoValor(tipoValor);
        c.setValor(valor);
        c.setDescricao(descricao);
        return c;
    }

    @Test
    void listarPorProcedimento_shouldReturnCustosWithGastoClinicaWhenProcedimentoFound() {
        Procedimento procedimento = createProcedimento(60);
        when(procedimentoRepository.findByOrganizacaoIdAndId(ORG_ID, PROCEDIMENTO_ID))
                .thenReturn(Optional.of(procedimento));

        ProcedimentoCusto lab = createCustoEntity("LABORATORIO", "PERCENTUAL", new BigDecimal("15.00"), "Laboratório");
        when(custoRepository.findByProcedimentoId(PROCEDIMENTO_ID)).thenReturn(List.of(lab));

        List<ProcedimentoCustoDTO> result = custoService.listarPorProcedimento(PROCEDIMENTO_ID_STR);

        assertEquals(2, result.size());
        ProcedimentoCustoDTO primeiro = result.get(0);
        assertEquals("LABORATORIO", primeiro.getTipo());
        assertEquals("PERCENTUAL", primeiro.getTipoValor());
        assertEquals(0, new BigDecimal("15.00").compareTo(primeiro.getValor()));

        ProcedimentoCustoDTO gasto = result.get(1);
        assertEquals("GASTO_CLINICA", gasto.getTipo());
        assertEquals("FIXO", gasto.getTipoValor());
        assertEquals(0, BigDecimal.ZERO.compareTo(gasto.getValor()));
        assertTrue(gasto.getDescricao().contains("60min"));

        verify(procedimentoRepository).findByOrganizacaoIdAndId(ORG_ID, PROCEDIMENTO_ID);
        verify(custoRepository).findByProcedimentoId(PROCEDIMENTO_ID);
    }

    @Test
    void listarPorProcedimento_shouldCalculateGastoClinicaWithHoraClinicaConfig() {
        Procedimento procedimento = createProcedimento(120);
        when(procedimentoRepository.findByOrganizacaoIdAndId(ORG_ID, PROCEDIMENTO_ID))
                .thenReturn(Optional.of(procedimento));

        when(custoRepository.findByProcedimentoId(PROCEDIMENTO_ID)).thenReturn(List.of());

        ClinicaConfig config = new ClinicaConfig();
        config.setChave("hora_clinica_valor");
        config.setValor("200.00");
        when(configRepository.findByChave("hora_clinica_valor")).thenReturn(Optional.of(config));

        List<ProcedimentoCustoDTO> result = custoService.listarPorProcedimento(PROCEDIMENTO_ID_STR);

        assertEquals(1, result.size());
        ProcedimentoCustoDTO gasto = result.get(0);
        assertEquals("GASTO_CLINICA", gasto.getTipo());
        assertEquals(0, new BigDecimal("400.00").compareTo(gasto.getValor()));
    }

    @Test
    void listarPorProcedimento_shouldReturnGastoClinicaZeroWhenDuracaoIsNull() {
        Procedimento procedimento = createProcedimento(null);
        when(procedimentoRepository.findByOrganizacaoIdAndId(ORG_ID, PROCEDIMENTO_ID))
                .thenReturn(Optional.of(procedimento));

        when(custoRepository.findByProcedimentoId(PROCEDIMENTO_ID)).thenReturn(List.of());

        List<ProcedimentoCustoDTO> result = custoService.listarPorProcedimento(PROCEDIMENTO_ID_STR);

        assertEquals(1, result.size());
        assertEquals(0, BigDecimal.ZERO.compareTo(result.get(0).getValor()));
    }

    @Test
    void listarPorProcedimento_shouldThrowWhenProcedimentoNotFound() {
        when(procedimentoRepository.findByOrganizacaoIdAndId(ORG_ID, PROCEDIMENTO_ID))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> custoService.listarPorProcedimento(PROCEDIMENTO_ID_STR));
    }

    @Test
    void salvar_shouldSaveAndReturnCustos() {
        Procedimento procedimento = createProcedimento(60);
        when(procedimentoRepository.findByOrganizacaoIdAndId(ORG_ID, PROCEDIMENTO_ID))
                .thenReturn(Optional.of(procedimento));

        ProcedimentoCustoDTO dto = new ProcedimentoCustoDTO(null, "LABORATORIO", "PERCENTUAL", new BigDecimal("15.00"), "Lab");
        ProcedimentoCusto savedEntity = createCustoEntity("LABORATORIO", "PERCENTUAL", new BigDecimal("15.00"), "Lab");
        when(custoRepository.saveAll(anyList())).thenReturn(List.of(savedEntity));

        List<ProcedimentoCustoDTO> result = custoService.salvar(PROCEDIMENTO_ID_STR, List.of(dto));

        assertEquals(1, result.size());
        assertEquals("LABORATORIO", result.get(0).getTipo());
        assertEquals(0, new BigDecimal("15.00").compareTo(result.get(0).getValor()));

        verify(custoRepository).deleteByProcedimentoId(PROCEDIMENTO_ID);
        verify(custoRepository).saveAll(custoListCaptor.capture());
        List<ProcedimentoCusto> captured = custoListCaptor.getValue();
        assertEquals(1, captured.size());
        assertEquals("LABORATORIO", captured.get(0).getTipo());
    }

    @Test
    void salvar_shouldFilterOutGastoClinica() {
        Procedimento procedimento = createProcedimento(60);
        when(procedimentoRepository.findByOrganizacaoIdAndId(ORG_ID, PROCEDIMENTO_ID))
                .thenReturn(Optional.of(procedimento));

        ProcedimentoCustoDTO lab = new ProcedimentoCustoDTO(null, "LABORATORIO", "PERCENTUAL", new BigDecimal("15.00"), "Lab");
        ProcedimentoCustoDTO gasto = new ProcedimentoCustoDTO(null, "GASTO_CLINICA", "FIXO", new BigDecimal("100.00"), "Gasto");

        ProcedimentoCusto savedLab = createCustoEntity("LABORATORIO", "PERCENTUAL", new BigDecimal("15.00"), "Lab");
        when(custoRepository.saveAll(anyList())).thenReturn(List.of(savedLab));

        List<ProcedimentoCustoDTO> result = custoService.salvar(PROCEDIMENTO_ID_STR, List.of(lab, gasto));

        assertEquals(1, result.size());
        assertEquals("LABORATORIO", result.get(0).getTipo());

        verify(custoRepository).saveAll(custoListCaptor.capture());
        assertEquals(1, custoListCaptor.getValue().size());
        assertEquals("LABORATORIO", custoListCaptor.getValue().get(0).getTipo());
    }

    @Test
    void salvar_shouldThrowWhenProcedimentoNotFound() {
        when(procedimentoRepository.findByOrganizacaoIdAndId(ORG_ID, PROCEDIMENTO_ID))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> custoService.salvar(PROCEDIMENTO_ID_STR, List.of()));
    }

    @Test
    void salvar_shouldHandleEmptyList() {
        Procedimento procedimento = createProcedimento(60);
        when(procedimentoRepository.findByOrganizacaoIdAndId(ORG_ID, PROCEDIMENTO_ID))
                .thenReturn(Optional.of(procedimento));

        when(custoRepository.saveAll(anyList())).thenReturn(List.of());

        List<ProcedimentoCustoDTO> result = custoService.salvar(PROCEDIMENTO_ID_STR, List.of());

        assertTrue(result.isEmpty());
        verify(custoRepository).deleteByProcedimentoId(PROCEDIMENTO_ID);
        verify(custoRepository).saveAll(anyList());
    }
}
