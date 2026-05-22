package com.smilecorp.api.service;

import com.smilecorp.api.dto.PacienteDTO;
import com.smilecorp.api.entity.Paciente;
import com.smilecorp.api.repository.PacienteRepository;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PacienteServiceTest {

    private static final String ORG_ID = "org-123";
    private static final UUID PACIENTE_ID = UUID.randomUUID();

    @Mock
    private PacienteRepository pacienteRepository;

    @InjectMocks
    private PacienteService pacienteService;

    @Captor
    private ArgumentCaptor<Paciente> pacienteCaptor;

    @BeforeEach
    void setUp() {
        TenantContext.setOrganizationId(ORG_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private Paciente createPaciente() {
        Paciente p = new Paciente(ORG_ID, "João Silva", "joao@email.com", "11999990000",
                "12345678900", "15/03/1990", "Rua A, 123", "Alérgico", true);
        p.setId(PACIENTE_ID);
        p.setCriadoEm(LocalDateTime.now());
        p.setAtualizadoEm(LocalDateTime.now());
        return p;
    }

    @Test
    void listar_shouldReturnAllWhenNomeIsNull() {
        Paciente paciente = createPaciente();
        when(pacienteRepository.findByOrganizacaoId(ORG_ID)).thenReturn(List.of(paciente));

        List<PacienteDTO> result = pacienteService.listar(null);

        assertEquals(1, result.size());
        assertEquals(PACIENTE_ID.toString(), result.get(0).getId());
        assertEquals("João Silva", result.get(0).getNome());
        verify(pacienteRepository).findByOrganizacaoId(ORG_ID);
        verifyNoMoreInteractions(pacienteRepository);
    }

    @Test
    void listar_shouldFilterByNomeWhenProvided() {
        Paciente paciente = createPaciente();
        when(pacienteRepository.findByOrganizacaoIdAndNomeContainingIgnoreCase(ORG_ID, "João"))
                .thenReturn(List.of(paciente));

        List<PacienteDTO> result = pacienteService.listar("João");

        assertEquals(1, result.size());
        assertEquals("João Silva", result.get(0).getNome());
        verify(pacienteRepository).findByOrganizacaoIdAndNomeContainingIgnoreCase(ORG_ID, "João");
    }

    @Test
    void listar_shouldReturnEmptyWhenNoneFound() {
        when(pacienteRepository.findByOrganizacaoId(ORG_ID)).thenReturn(List.of());

        List<PacienteDTO> result = pacienteService.listar(null);

        assertTrue(result.isEmpty());
    }

    @Test
    void obterPorId_shouldReturnPacienteWhenFound() {
        Paciente paciente = createPaciente();
        when(pacienteRepository.findByOrganizacaoIdAndId(ORG_ID, PACIENTE_ID))
                .thenReturn(Optional.of(paciente));

        PacienteDTO result = pacienteService.obterPorId(PACIENTE_ID.toString());

        assertEquals(PACIENTE_ID.toString(), result.getId());
        assertEquals("João Silva", result.getNome());
    }

    @Test
    void obterPorId_shouldThrowWhenNotFound() {
        when(pacienteRepository.findByOrganizacaoIdAndId(ORG_ID, PACIENTE_ID))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> pacienteService.obterPorId(PACIENTE_ID.toString()));
    }

    @Test
    void criar_shouldSaveAndReturnPaciente() {
        PacienteDTO dto = new PacienteDTO();
        dto.setNome("Maria Souza");
        dto.setEmail("maria@email.com");
        dto.setTelefone("11988887777");
        dto.setCpf("98765432100");
        dto.setDataNascimento("20/07/1985");
        dto.setEndereco("Rua B, 456");
        dto.setObservacoes("Nenhuma");

        Paciente saved = new Paciente(ORG_ID, "Maria Souza", "maria@email.com", "11988887777",
                "98765432100", "20/07/1985", "Rua B, 456", "Nenhuma", true);
        saved.setId(UUID.randomUUID());

        when(pacienteRepository.save(any(Paciente.class))).thenReturn(saved);

        PacienteDTO result = pacienteService.criar(dto);

        assertEquals("Maria Souza", result.getNome());
        verify(pacienteRepository).save(pacienteCaptor.capture());
        Paciente captured = pacienteCaptor.getValue();
        assertEquals(ORG_ID, captured.getOrganizacaoId());
        assertTrue(captured.getAtivo());
    }

    @Test
    void atualizar_shouldUpdateNameAndEmail() {
        Paciente paciente = createPaciente();
        when(pacienteRepository.findByOrganizacaoIdAndId(ORG_ID, PACIENTE_ID))
                .thenReturn(Optional.of(paciente));

        PacienteDTO dto = new PacienteDTO();
        dto.setNome("João Silva Atualizado");
        dto.setEmail("joao.novo@email.com");

        Paciente updated = createPaciente();
        updated.setNome("João Silva Atualizado");
        updated.setEmail("joao.novo@email.com");
        when(pacienteRepository.save(any(Paciente.class))).thenReturn(updated);

        PacienteDTO result = pacienteService.atualizar(PACIENTE_ID.toString(), dto);

        assertEquals("João Silva Atualizado", result.getNome());
        assertEquals("joao.novo@email.com", result.getEmail());
    }

    @Test
    void atualizar_shouldUpdateAllFields() {
        Paciente paciente = createPaciente();
        when(pacienteRepository.findByOrganizacaoIdAndId(ORG_ID, PACIENTE_ID))
                .thenReturn(Optional.of(paciente));

        PacienteDTO dto = new PacienteDTO();
        dto.setTelefone("11988887777");
        dto.setCpf("99988877766");
        dto.setDataNascimento("01/01/2000");
        dto.setEndereco("Rua Nova, 789");
        dto.setObservacoes("Sem alergias");
        dto.setAtivo(false);

        Paciente updated = createPaciente();
        updated.setTelefone("11988887777");
        updated.setCpf("99988877766");
        updated.setDataNascimento("01/01/2000");
        updated.setEndereco("Rua Nova, 789");
        updated.setObservacoes("Sem alergias");
        updated.setAtivo(false);
        when(pacienteRepository.save(any(Paciente.class))).thenReturn(updated);

        PacienteDTO result = pacienteService.atualizar(PACIENTE_ID.toString(), dto);

        assertEquals("11988887777", result.getTelefone());
        assertEquals("99988877766", result.getCpf());
        assertEquals("01/01/2000", result.getDataNascimento());
        assertEquals("Rua Nova, 789", result.getEndereco());
        assertEquals("Sem alergias", result.getObservacoes());
        assertFalse(result.getAtivo());
    }

    @Test
    void atualizar_shouldThrowWhenNotFound() {
        when(pacienteRepository.findByOrganizacaoIdAndId(ORG_ID, PACIENTE_ID))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> pacienteService.atualizar(PACIENTE_ID.toString(), new PacienteDTO()));
    }

    @Test
    void deletar_shouldDeleteWhenFound() {
        Paciente paciente = createPaciente();
        when(pacienteRepository.findByOrganizacaoIdAndId(ORG_ID, PACIENTE_ID))
                .thenReturn(Optional.of(paciente));

        pacienteService.deletar(PACIENTE_ID.toString());

        verify(pacienteRepository).delete(paciente);
    }

    @Test
    void deletar_shouldThrowWhenNotFound() {
        when(pacienteRepository.findByOrganizacaoIdAndId(ORG_ID, PACIENTE_ID))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> pacienteService.deletar(PACIENTE_ID.toString()));
    }
}
