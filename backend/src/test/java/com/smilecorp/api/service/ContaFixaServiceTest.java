package com.smilecorp.api.service;

import com.smilecorp.api.dto.ContaFixaDTO;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContaFixaServiceTest {

    private static final String ORG_ID = "org-123";
    private static final UUID CONTA_FIXA_ID = UUID.randomUUID();

    @Mock
    private ContaFixaRepository contaFixaRepository;

    @Mock
    private TransacaoFinanceiraRepository transacaoFinanceiraRepository;

    @InjectMocks
    private ContaFixaService contaFixaService;

    @Captor
    private ArgumentCaptor<ContaFixa> contaFixaCaptor;

    private ContaFixa contaFixa;

    @BeforeEach
    void setUp() {
        TenantContext.setOrganizationId(ORG_ID);
        contaFixa = createContaFixa();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private ContaFixa createContaFixa() {
        ContaFixa cf = new ContaFixa(ORG_ID, "despesa", "Aluguel", "Aluguel",
                new BigDecimal("1500.00"), 15, LocalDate.of(2026, 6, 1), "ativa");
        cf.setId(CONTA_FIXA_ID);
        cf.setCriadoEm(LocalDateTime.now());
        cf.setAtualizadoEm(LocalDateTime.now());
        return cf;
    }

    @Test
    void listar_shouldReturnAllWhenNoFilters() {
        when(contaFixaRepository.findByOrganizacaoId(ORG_ID)).thenReturn(List.of(contaFixa));

        List<ContaFixaDTO> result = contaFixaService.listar(null, null);

        assertEquals(1, result.size());
        assertEquals("Aluguel", result.get(0).getDescricao());
        verify(contaFixaRepository).findByOrganizacaoId(ORG_ID);
    }

    @Test
    void listar_shouldFilterByTipo() {
        when(contaFixaRepository.findByOrganizacaoIdAndTipo(ORG_ID, "receita")).thenReturn(List.of());

        List<ContaFixaDTO> result = contaFixaService.listar("receita", null);

        assertTrue(result.isEmpty());
        verify(contaFixaRepository).findByOrganizacaoIdAndTipo(ORG_ID, "receita");
    }

    @Test
    void listar_shouldFilterByStatus() {
        ContaFixa inativa = createContaFixa();
        inativa.setStatus("inativa");
        when(contaFixaRepository.findByOrganizacaoId(ORG_ID)).thenReturn(List.of(contaFixa, inativa));

        List<ContaFixaDTO> result = contaFixaService.listar(null, "inativa");

        assertEquals(1, result.size());
        assertEquals("inativa", result.get(0).getStatus());
    }

    @Test
    void listar_shouldIgnoreStatusTodos() {
        when(contaFixaRepository.findByOrganizacaoId(ORG_ID)).thenReturn(List.of(contaFixa));

        List<ContaFixaDTO> result = contaFixaService.listar(null, "todos");

        assertEquals(1, result.size());
    }

    @Test
    void obterPorId_shouldReturnWhenFound() {
        when(contaFixaRepository.findByOrganizacaoIdAndId(ORG_ID, CONTA_FIXA_ID))
                .thenReturn(Optional.of(contaFixa));

        ContaFixaDTO result = contaFixaService.obterPorId(CONTA_FIXA_ID.toString());

        assertEquals("Aluguel", result.getDescricao());
    }

    @Test
    void obterPorId_shouldThrowWhenNotFound() {
        when(contaFixaRepository.findByOrganizacaoIdAndId(ORG_ID, CONTA_FIXA_ID))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> contaFixaService.obterPorId(CONTA_FIXA_ID.toString()));
    }

    @Test
    void criar_shouldSaveAndGenerateTransacoes() {
        ContaFixaDTO dto = new ContaFixaDTO();
        dto.setTipo("despesa");
        dto.setDescricao("Internet");
        dto.setCategoria("Internet");
        dto.setValor(new BigDecimal("200.00"));
        dto.setDiaVencimento(10);
        dto.setDataInicio(LocalDate.of(2026, 6, 1));
        dto.setStatus("ativa");

        ContaFixa saved = new ContaFixa(ORG_ID, "despesa", "Internet", "Internet",
                new BigDecimal("200.00"), 10, LocalDate.of(2026, 6, 1), "ativa");
        saved.setId(UUID.randomUUID());

        when(contaFixaRepository.save(any(ContaFixa.class))).thenReturn(saved);

        ContaFixaDTO result = contaFixaService.criar(dto);

        assertNotNull(result);
        assertEquals("Internet", result.getDescricao());
        verify(contaFixaRepository).save(any(ContaFixa.class));
        verify(transacaoFinanceiraRepository).saveAll(anyList());
    }

    @Test
    void criar_shouldDefaultStatusToAtiva() {
        ContaFixaDTO dto = new ContaFixaDTO();
        dto.setTipo("despesa");
        dto.setDescricao("Internet");
        dto.setCategoria("Internet");
        dto.setValor(new BigDecimal("200.00"));
        dto.setDiaVencimento(10);
        dto.setDataInicio(LocalDate.of(2026, 6, 1));

        ContaFixa saved = new ContaFixa(ORG_ID, "despesa", "Internet", "Internet",
                new BigDecimal("200.00"), 10, LocalDate.of(2026, 6, 1), "ativa");
        saved.setId(UUID.randomUUID());

        when(contaFixaRepository.save(contaFixaCaptor.capture())).thenReturn(saved);

        contaFixaService.criar(dto);

        assertEquals("ativa", contaFixaCaptor.getValue().getStatus());
    }

    @Test
    void criar_shouldGenerateTransacoesForEachMonth() {
        ContaFixaDTO dto = new ContaFixaDTO();
        dto.setTipo("despesa");
        dto.setDescricao("Aluguel");
        dto.setCategoria("Aluguel");
        dto.setValor(new BigDecimal("1500.00"));
        dto.setDiaVencimento(15);
        dto.setDataInicio(LocalDate.of(2026, 1, 1));
        dto.setStatus("ativa");

        ContaFixa saved = new ContaFixa(ORG_ID, "despesa", "Aluguel", "Aluguel",
                new BigDecimal("1500.00"), 15, LocalDate.of(2026, 1, 1), "ativa");
        saved.setId(UUID.randomUUID());

        when(contaFixaRepository.save(any(ContaFixa.class))).thenReturn(saved);

        contaFixaService.criar(dto);

        verify(transacaoFinanceiraRepository).saveAll(anyList());
    }

    @Test
    void atualizar_shouldUpdateFields() {
        when(contaFixaRepository.findByOrganizacaoIdAndId(ORG_ID, CONTA_FIXA_ID))
                .thenReturn(Optional.of(contaFixa));

        ContaFixaDTO dto = new ContaFixaDTO();
        dto.setDescricao("Aluguel atualizado");
        dto.setValor(new BigDecimal("1800.00"));

        ContaFixa updated = createContaFixa();
        updated.setDescricao("Aluguel atualizado");
        updated.setValor(new BigDecimal("1800.00"));
        when(contaFixaRepository.save(any(ContaFixa.class))).thenReturn(updated);

        ContaFixaDTO result = contaFixaService.atualizar(CONTA_FIXA_ID.toString(), dto);

        assertEquals("Aluguel atualizado", result.getDescricao());
        assertEquals(new BigDecimal("1800.00"), result.getValor());
    }

    @Test
    void atualizar_shouldThrowWhenNotFound() {
        when(contaFixaRepository.findByOrganizacaoIdAndId(ORG_ID, CONTA_FIXA_ID))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> contaFixaService.atualizar(CONTA_FIXA_ID.toString(), new ContaFixaDTO()));
    }

    @Test
    void deletar_shouldNullifyTransacoesAndDelete() {
        TransacaoFinanceira t1 = new TransacaoFinanceira();
        t1.setId(UUID.randomUUID());
        TransacaoFinanceira t2 = new TransacaoFinanceira();
        t2.setId(UUID.randomUUID());

        when(contaFixaRepository.findByOrganizacaoIdAndId(ORG_ID, CONTA_FIXA_ID))
                .thenReturn(Optional.of(contaFixa));
        when(transacaoFinanceiraRepository.findByOrganizacaoIdAndContaFixaId(ORG_ID, CONTA_FIXA_ID))
                .thenReturn(List.of(t1, t2));

        contaFixaService.deletar(CONTA_FIXA_ID.toString());

        assertNull(t1.getContaFixa());
        assertNull(t2.getContaFixa());
        verify(transacaoFinanceiraRepository).saveAll(List.of(t1, t2));
        verify(contaFixaRepository).delete(contaFixa);
    }

    @Test
    void deletar_shouldThrowWhenNotFound() {
        when(contaFixaRepository.findByOrganizacaoIdAndId(ORG_ID, CONTA_FIXA_ID))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> contaFixaService.deletar(CONTA_FIXA_ID.toString()));
    }
}
