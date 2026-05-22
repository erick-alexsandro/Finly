package com.smilecorp.api.service;

import com.smilecorp.api.dto.ProcedimentoDTO;
import com.smilecorp.api.entity.Procedimento;
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
class ProcedimentoServiceTest {

    private static final String ORG_ID = "org-123";
    private static final UUID PROCEDIMENTO_ID = UUID.randomUUID();

    @Mock
    private ProcedimentoRepository procedimentoRepository;

    @InjectMocks
    private ProcedimentoService procedimentoService;

    @Captor
    private ArgumentCaptor<Procedimento> procedimentoCaptor;

    @BeforeEach
    void setUp() {
        TenantContext.setOrganizationId(ORG_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private Procedimento createProcedimento() {
        Procedimento p = new Procedimento(ORG_ID, "Limpeza", "Limpeza completa",
                60, new BigDecimal("150.00"), "Preventivo", true);
        p.setId(PROCEDIMENTO_ID);
        p.setCriadoEm(LocalDateTime.now());
        p.setAtualizadoEm(LocalDateTime.now());
        return p;
    }

    @Test
    void listar_shouldReturnAllWhenNomeIsNull() {
        Procedimento procedimento = createProcedimento();
        when(procedimentoRepository.findByOrganizacaoId(ORG_ID)).thenReturn(List.of(procedimento));

        List<ProcedimentoDTO> result = procedimentoService.listar(null);

        assertEquals(1, result.size());
        assertEquals(PROCEDIMENTO_ID.toString(), result.get(0).getId());
        assertEquals("Limpeza", result.get(0).getNome());
        verify(procedimentoRepository).findByOrganizacaoId(ORG_ID);
    }

    @Test
    void listar_shouldFilterByNomeWhenProvided() {
        Procedimento procedimento = createProcedimento();
        when(procedimentoRepository.findByOrganizacaoIdAndNomeContainingIgnoreCase(ORG_ID, "Limpeza"))
                .thenReturn(List.of(procedimento));

        List<ProcedimentoDTO> result = procedimentoService.listar("Limpeza");

        assertEquals(1, result.size());
        assertEquals("Limpeza", result.get(0).getNome());
    }

    @Test
    void listar_shouldReturnEmptyWhenNoneFound() {
        when(procedimentoRepository.findByOrganizacaoId(ORG_ID)).thenReturn(List.of());

        List<ProcedimentoDTO> result = procedimentoService.listar(null);

        assertTrue(result.isEmpty());
    }

    @Test
    void obterPorId_shouldReturnProcedimentoWhenFound() {
        Procedimento procedimento = createProcedimento();
        when(procedimentoRepository.findByOrganizacaoIdAndId(ORG_ID, PROCEDIMENTO_ID))
                .thenReturn(Optional.of(procedimento));

        ProcedimentoDTO result = procedimentoService.obterPorId(PROCEDIMENTO_ID.toString());

        assertEquals("Limpeza", result.getNome());
        assertEquals(60, result.getDuracaoMinutos());
    }

    @Test
    void obterPorId_shouldThrowWhenNotFound() {
        when(procedimentoRepository.findByOrganizacaoIdAndId(ORG_ID, PROCEDIMENTO_ID))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> procedimentoService.obterPorId(PROCEDIMENTO_ID.toString()));
    }

    @Test
    void criar_shouldSaveAndReturnProcedimento() {
        ProcedimentoDTO dto = new ProcedimentoDTO();
        dto.setNome("Extração");
        dto.setDescricao("Extração de siso");
        dto.setDuracaoMinutos(90);
        dto.setPreco(new BigDecimal("500.00"));
        dto.setCategoria("Cirurgia");

        Procedimento saved = new Procedimento(ORG_ID, "Extração", "Extração de siso",
                90, new BigDecimal("500.00"), "Cirurgia", true);
        saved.setId(UUID.randomUUID());

        when(procedimentoRepository.save(any(Procedimento.class))).thenReturn(saved);

        ProcedimentoDTO result = procedimentoService.criar(dto);

        assertEquals("Extração", result.getNome());
        assertEquals(new BigDecimal("500.00"), result.getPreco());
        verify(procedimentoRepository).save(procedimentoCaptor.capture());
        assertEquals(ORG_ID, procedimentoCaptor.getValue().getOrganizacaoId());
        assertTrue(procedimentoCaptor.getValue().getAtivo());
    }

    @Test
    void atualizar_shouldUpdatePrecoAndDuracao() {
        Procedimento procedimento = createProcedimento();
        when(procedimentoRepository.findByOrganizacaoIdAndId(ORG_ID, PROCEDIMENTO_ID))
                .thenReturn(Optional.of(procedimento));

        ProcedimentoDTO dto = new ProcedimentoDTO();
        dto.setPreco(new BigDecimal("180.00"));
        dto.setDuracaoMinutos(45);

        Procedimento updated = createProcedimento();
        updated.setPreco(new BigDecimal("180.00"));
        updated.setDuracaoMinutos(45);
        when(procedimentoRepository.save(any(Procedimento.class))).thenReturn(updated);

        ProcedimentoDTO result = procedimentoService.atualizar(PROCEDIMENTO_ID.toString(), dto);

        assertEquals(new BigDecimal("180.00"), result.getPreco());
        assertEquals(45, result.getDuracaoMinutos());
        assertEquals("Limpeza", result.getNome());
    }

    @Test
    void atualizar_shouldUpdateAllFields() {
        Procedimento procedimento = createProcedimento();
        when(procedimentoRepository.findByOrganizacaoIdAndId(ORG_ID, PROCEDIMENTO_ID))
                .thenReturn(Optional.of(procedimento));

        ProcedimentoDTO dto = new ProcedimentoDTO();
        dto.setNome("Limpeza Avançada");
        dto.setDescricao("Limpeza completa com ultrassom");
        dto.setCategoria("Preventivo Avançado");
        dto.setAtivo(false);

        Procedimento updated = createProcedimento();
        updated.setNome("Limpeza Avançada");
        updated.setDescricao("Limpeza completa com ultrassom");
        updated.setCategoria("Preventivo Avançado");
        updated.setAtivo(false);
        when(procedimentoRepository.save(any(Procedimento.class))).thenReturn(updated);

        ProcedimentoDTO result = procedimentoService.atualizar(PROCEDIMENTO_ID.toString(), dto);

        assertEquals("Limpeza Avançada", result.getNome());
        assertEquals("Limpeza completa com ultrassom", result.getDescricao());
        assertEquals("Preventivo Avançado", result.getCategoria());
        assertFalse(result.getAtivo());
    }

    @Test
    void atualizar_shouldThrowWhenNotFound() {
        when(procedimentoRepository.findByOrganizacaoIdAndId(ORG_ID, PROCEDIMENTO_ID))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> procedimentoService.atualizar(PROCEDIMENTO_ID.toString(), new ProcedimentoDTO()));
    }

    @Test
    void deletar_shouldDeleteWhenFound() {
        Procedimento procedimento = createProcedimento();
        when(procedimentoRepository.findByOrganizacaoIdAndId(ORG_ID, PROCEDIMENTO_ID))
                .thenReturn(Optional.of(procedimento));

        procedimentoService.deletar(PROCEDIMENTO_ID.toString());

        verify(procedimentoRepository).delete(procedimento);
    }

    @Test
    void deletar_shouldThrowWhenNotFound() {
        when(procedimentoRepository.findByOrganizacaoIdAndId(ORG_ID, PROCEDIMENTO_ID))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> procedimentoService.deletar(PROCEDIMENTO_ID.toString()));
    }
}
