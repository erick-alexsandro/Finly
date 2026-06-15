package com.smilecorp.api.service;

import com.smilecorp.api.dto.TransacaoFinanceiraDTO;
import com.smilecorp.api.entity.ContaFixa;
import com.smilecorp.api.entity.TransacaoFinanceira;
import com.smilecorp.api.repository.ContaFixaRepository;
import com.smilecorp.api.repository.TransacaoFinanceiraRepository;
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
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransacaoFinanceiraServiceTest {

    private static final String ORG_ID = "org-123";
    private static final UUID TRANSACAO_ID = UUID.randomUUID();
    private static final UUID CONTA_FIXA_ID = UUID.randomUUID();

    @Mock
    private TransacaoFinanceiraRepository transacaoFinanceiraRepository;

    @Mock
    private ContaFixaRepository contaFixaRepository;

    @InjectMocks
    private TransacaoFinanceiraService transacaoFinanceiraService;

    @Captor
    private ArgumentCaptor<TransacaoFinanceira> transacaoCaptor;

    private TransacaoFinanceira transacao;
    private ContaFixa contaFixa;

    @BeforeEach
    void setUp() {
        TenantContext.setOrganizationId(ORG_ID);
        transacao = createTransacao();
        contaFixa = createContaFixa();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private TransacaoFinanceira createTransacao() {
        TransacaoFinanceira t = new TransacaoFinanceira();
        t.setId(TRANSACAO_ID);
        t.setOrganizacaoId(ORG_ID);
        t.setTipo("despesa");
        t.setDescricao("Aluguel");
        t.setCategoria("Aluguel");
        t.setValor(new BigDecimal("1500.00"));
        t.setData(LocalDate.of(2026, 6, 15));
        t.setStatus("previsto");
        return t;
    }

    private ContaFixa createContaFixa() {
        ContaFixa cf = new ContaFixa(ORG_ID, "despesa", "Aluguel", "Aluguel",
                new BigDecimal("1500.00"), 15, LocalDate.of(2026, 6, 1), "ativa");
        cf.setId(CONTA_FIXA_ID);
        return cf;
    }

    @Test
    void listar_shouldReturnAllWhenNoFilters() {
        when(transacaoFinanceiraRepository.findByOrganizacaoId(ORG_ID)).thenReturn(List.of(transacao));

        List<TransacaoFinanceiraDTO> result = transacaoFinanceiraService.listar(null, null, null, null);

        assertEquals(1, result.size());
        assertEquals("Aluguel", result.get(0).getDescricao());
        verify(transacaoFinanceiraRepository).findByOrganizacaoId(ORG_ID);
    }

    @Test
    void listar_shouldFilterByTipo() {
        when(transacaoFinanceiraRepository.findByOrganizacaoIdAndTipo(ORG_ID, "receita")).thenReturn(List.of());

        List<TransacaoFinanceiraDTO> result = transacaoFinanceiraService.listar("receita", null, null, null);

        assertTrue(result.isEmpty());
        verify(transacaoFinanceiraRepository).findByOrganizacaoIdAndTipo(ORG_ID, "receita");
    }

    @Test
    void listar_shouldFilterByStatus() {
        when(transacaoFinanceiraRepository.findByOrganizacaoId(ORG_ID)).thenReturn(List.of(transacao));

        List<TransacaoFinanceiraDTO> result = transacaoFinanceiraService.listar(null, "pago", null, null);

        assertTrue(result.isEmpty());
    }

    @Test
    void listar_shouldFilterByDataRange() {
        LocalDate inicio = LocalDate.of(2026, 1, 1);
        LocalDate fim = LocalDate.of(2026, 12, 31);
        when(transacaoFinanceiraRepository.findByOrganizacaoIdAndDataBetween(ORG_ID, inicio, fim))
                .thenReturn(List.of(transacao));

        List<TransacaoFinanceiraDTO> result = transacaoFinanceiraService.listar(null, null, inicio, fim);

        assertEquals(1, result.size());
        verify(transacaoFinanceiraRepository).findByOrganizacaoIdAndDataBetween(ORG_ID, inicio, fim);
    }

    @Test
    void listar_shouldFilterByTipoAndDataRange() {
        LocalDate inicio = LocalDate.of(2026, 1, 1);
        LocalDate fim = LocalDate.of(2026, 12, 31);
        when(transacaoFinanceiraRepository.findByOrganizacaoIdAndTipoAndDataBetween(ORG_ID, "despesa", inicio, fim))
                .thenReturn(List.of(transacao));

        List<TransacaoFinanceiraDTO> result = transacaoFinanceiraService.listar("despesa", null, inicio, fim);

        assertEquals(1, result.size());
        verify(transacaoFinanceiraRepository).findByOrganizacaoIdAndTipoAndDataBetween(ORG_ID, "despesa", inicio, fim);
    }

    @Test
    void listar_shouldReturnEmptyWhenNoneFound() {
        when(transacaoFinanceiraRepository.findByOrganizacaoId(ORG_ID)).thenReturn(List.of());

        List<TransacaoFinanceiraDTO> result = transacaoFinanceiraService.listar(null, null, null, null);

        assertTrue(result.isEmpty());
    }

    @Test
    void obterPorId_shouldReturnWhenFound() {
        when(transacaoFinanceiraRepository.findByOrganizacaoIdAndId(ORG_ID, TRANSACAO_ID))
                .thenReturn(Optional.of(transacao));

        TransacaoFinanceiraDTO result = transacaoFinanceiraService.obterPorId(TRANSACAO_ID.toString());

        assertEquals("Aluguel", result.getDescricao());
    }

    @Test
    void obterPorId_shouldThrowWhenNotFound() {
        UUID otherId = UUID.randomUUID();
        when(transacaoFinanceiraRepository.findByOrganizacaoIdAndId(ORG_ID, otherId))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> transacaoFinanceiraService.obterPorId(otherId.toString()));
    }

    @Test
    void criar_shouldSaveTransacao() {
        TransacaoFinanceiraDTO dto = new TransacaoFinanceiraDTO();
        dto.setTipo("despesa");
        dto.setDescricao("Internet");
        dto.setCategoria("Internet");
        dto.setValor(new BigDecimal("200.00"));
        dto.setData(LocalDate.of(2026, 7, 10));
        dto.setStatus("previsto");

        TransacaoFinanceira saved = createTransacao();
        saved.setDescricao("Internet");
        saved.setValor(new BigDecimal("200.00"));

        when(transacaoFinanceiraRepository.save(any(TransacaoFinanceira.class))).thenReturn(saved);

        TransacaoFinanceiraDTO result = transacaoFinanceiraService.criar(dto);

        assertNotNull(result);
        assertEquals("Internet", result.getDescricao());
        verify(transacaoFinanceiraRepository).save(any(TransacaoFinanceira.class));
    }

    @Test
    void criar_shouldAssociateContaFixaWhenIdProvided() {
        TransacaoFinanceiraDTO dto = new TransacaoFinanceiraDTO();
        dto.setTipo("despesa");
        dto.setDescricao("Internet");
        dto.setCategoria("Internet");
        dto.setValor(new BigDecimal("200.00"));
        dto.setData(LocalDate.of(2026, 7, 10));
        dto.setStatus("previsto");
        dto.setContaFixaId(CONTA_FIXA_ID.toString());

        when(contaFixaRepository.findByOrganizacaoIdAndId(ORG_ID, CONTA_FIXA_ID))
                .thenReturn(Optional.of(contaFixa));
        when(transacaoFinanceiraRepository.save(any(TransacaoFinanceira.class))).thenReturn(transacao);

        transacaoFinanceiraService.criar(dto);

        verify(transacaoFinanceiraRepository).save(transacaoCaptor.capture());
        assertEquals(contaFixa, transacaoCaptor.getValue().getContaFixa());
    }

    @Test
    void criar_shouldThrowWhenContaFixaNotFound() {
        TransacaoFinanceiraDTO dto = new TransacaoFinanceiraDTO();
        dto.setContaFixaId(CONTA_FIXA_ID.toString());

        when(contaFixaRepository.findByOrganizacaoIdAndId(ORG_ID, CONTA_FIXA_ID))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> transacaoFinanceiraService.criar(dto));
    }

    @Test
    void criar_shouldDefaultToPrevisto() {
        TransacaoFinanceiraDTO dto = new TransacaoFinanceiraDTO();
        dto.setTipo("despesa");
        dto.setDescricao("Internet");
        dto.setCategoria("Internet");
        dto.setValor(new BigDecimal("200.00"));
        dto.setData(LocalDate.of(2026, 7, 10));

        when(transacaoFinanceiraRepository.save(transacaoCaptor.capture())).thenReturn(transacao);

        transacaoFinanceiraService.criar(dto);

        assertEquals("previsto", transacaoCaptor.getValue().getStatus());
    }

    @Test
    void atualizar_shouldUpdateFields() {
        when(transacaoFinanceiraRepository.findByOrganizacaoIdAndId(ORG_ID, TRANSACAO_ID))
                .thenReturn(Optional.of(transacao));

        TransacaoFinanceiraDTO dto = new TransacaoFinanceiraDTO();
        dto.setDescricao("Aluguel corrigido");
        dto.setValor(new BigDecimal("1600.00"));

        TransacaoFinanceira updated = createTransacao();
        updated.setDescricao("Aluguel corrigido");
        updated.setValor(new BigDecimal("1600.00"));
        when(transacaoFinanceiraRepository.save(any(TransacaoFinanceira.class))).thenReturn(updated);

        TransacaoFinanceiraDTO result = transacaoFinanceiraService.atualizar(TRANSACAO_ID.toString(), dto);

        assertEquals("Aluguel corrigido", result.getDescricao());
        assertEquals(new BigDecimal("1600.00"), result.getValor());
    }

    @Test
    void atualizar_shouldThrowWhenNotFound() {
        UUID otherId = UUID.randomUUID();
        when(transacaoFinanceiraRepository.findByOrganizacaoIdAndId(ORG_ID, otherId))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> transacaoFinanceiraService.atualizar(otherId.toString(), new TransacaoFinanceiraDTO()));
    }

    @Test
    void atualizar_shouldSetContaFixaToNullWhenNotProvided() {
        transacao.setContaFixa(contaFixa);
        when(transacaoFinanceiraRepository.findByOrganizacaoIdAndId(ORG_ID, TRANSACAO_ID))
                .thenReturn(Optional.of(transacao));

        when(transacaoFinanceiraRepository.save(transacaoCaptor.capture())).thenReturn(transacao);

        TransacaoFinanceiraDTO dto = new TransacaoFinanceiraDTO();
        dto.setDescricao("Aluguel");
        dto.setStatus("pago");

        transacaoFinanceiraService.atualizar(TRANSACAO_ID.toString(), dto);

        assertNull(transacaoCaptor.getValue().getContaFixa());
    }

    @Test
    void deletar_shouldDeleteWhenFound() {
        when(transacaoFinanceiraRepository.findByOrganizacaoIdAndId(ORG_ID, TRANSACAO_ID))
                .thenReturn(Optional.of(transacao));

        transacaoFinanceiraService.deletar(TRANSACAO_ID.toString());

        verify(transacaoFinanceiraRepository).delete(transacao);
    }

    @Test
    void deletar_shouldThrowWhenNotFound() {
        UUID otherId = UUID.randomUUID();
        when(transacaoFinanceiraRepository.findByOrganizacaoIdAndId(ORG_ID, otherId))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> transacaoFinanceiraService.deletar(otherId.toString()));
    }
}
