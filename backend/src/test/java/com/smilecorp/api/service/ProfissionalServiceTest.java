package com.smilecorp.api.service;

import com.smilecorp.api.dto.ProfissionalDTO;
import com.smilecorp.api.entity.Profissional;
import com.smilecorp.api.repository.ProfissionalRepository;
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
class ProfissionalServiceTest {

    private static final String ORG_ID = "org-123";
    private static final UUID PROFISSIONAL_ID = UUID.randomUUID();

    @Mock
    private ProfissionalRepository profissionalRepository;

    @InjectMocks
    private ProfissionalService profissionalService;

    @Captor
    private ArgumentCaptor<Profissional> profissionalCaptor;

    @BeforeEach
    void setUp() {
        TenantContext.setOrganizationId(ORG_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private Profissional createProfissional() {
        Profissional p = new Profissional(ORG_ID, "Dr. Carlos", "carlos@email.com", "11977776666",
                "11122233344", "Ortodontia", "CRO-SP-12345", true);
        p.setId(PROFISSIONAL_ID);
        p.setCriadoEm(LocalDateTime.now());
        p.setAtualizadoEm(LocalDateTime.now());
        return p;
    }

    @Test
    void listar_shouldReturnAllWhenNomeIsNull() {
        Profissional profissional = createProfissional();
        when(profissionalRepository.findByOrganizacaoId(ORG_ID)).thenReturn(List.of(profissional));

        List<ProfissionalDTO> result = profissionalService.listar(null);

        assertEquals(1, result.size());
        assertEquals(PROFISSIONAL_ID.toString(), result.get(0).getId());
        assertEquals("Dr. Carlos", result.get(0).getNome());
        verify(profissionalRepository).findByOrganizacaoId(ORG_ID);
    }

    @Test
    void listar_shouldFilterByNomeWhenProvided() {
        Profissional profissional = createProfissional();
        when(profissionalRepository.findByOrganizacaoIdAndNomeContainingIgnoreCase(ORG_ID, "Carlos"))
                .thenReturn(List.of(profissional));

        List<ProfissionalDTO> result = profissionalService.listar("Carlos");

        assertEquals(1, result.size());
        assertEquals("Dr. Carlos", result.get(0).getNome());
    }

    @Test
    void listar_shouldReturnEmptyWhenNoneFound() {
        when(profissionalRepository.findByOrganizacaoId(ORG_ID)).thenReturn(List.of());

        List<ProfissionalDTO> result = profissionalService.listar(null);

        assertTrue(result.isEmpty());
    }

    @Test
    void obterPorId_shouldReturnProfissionalWhenFound() {
        Profissional profissional = createProfissional();
        when(profissionalRepository.findByOrganizacaoIdAndId(ORG_ID, PROFISSIONAL_ID))
                .thenReturn(Optional.of(profissional));

        ProfissionalDTO result = profissionalService.obterPorId(PROFISSIONAL_ID.toString());

        assertEquals("Dr. Carlos", result.getNome());
        assertEquals("Ortodontia", result.getEspecialidade());
    }

    @Test
    void obterPorId_shouldThrowWhenNotFound() {
        when(profissionalRepository.findByOrganizacaoIdAndId(ORG_ID, PROFISSIONAL_ID))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> profissionalService.obterPorId(PROFISSIONAL_ID.toString()));
    }

    @Test
    void criar_shouldSaveAndReturnProfissional() {
        ProfissionalDTO dto = new ProfissionalDTO();
        dto.setNome("Dra. Ana");
        dto.setEmail("ana@email.com");
        dto.setTelefone("11955554444");
        dto.setCpf("55566677788");
        dto.setEspecialidade("Endodontia");
        dto.setNumeroRegistro("CRO-SP-67890");

        Profissional saved = new Profissional(ORG_ID, "Dra. Ana", "ana@email.com", "11955554444",
                "55566677788", "Endodontia", "CRO-SP-67890", true);
        saved.setId(UUID.randomUUID());

        when(profissionalRepository.save(any(Profissional.class))).thenReturn(saved);

        ProfissionalDTO result = profissionalService.criar(dto);

        assertEquals("Dra. Ana", result.getNome());
        assertEquals("Endodontia", result.getEspecialidade());
        verify(profissionalRepository).save(profissionalCaptor.capture());
        assertEquals(ORG_ID, profissionalCaptor.getValue().getOrganizacaoId());
        assertTrue(profissionalCaptor.getValue().getAtivo());
    }

    @Test
    void atualizar_shouldUpdateEspecialidade() {
        Profissional profissional = createProfissional();
        when(profissionalRepository.findByOrganizacaoIdAndId(ORG_ID, PROFISSIONAL_ID))
                .thenReturn(Optional.of(profissional));

        ProfissionalDTO dto = new ProfissionalDTO();
        dto.setEspecialidade("Ortodontia Avançada");

        Profissional updated = createProfissional();
        updated.setEspecialidade("Ortodontia Avançada");
        when(profissionalRepository.save(any(Profissional.class))).thenReturn(updated);

        ProfissionalDTO result = profissionalService.atualizar(PROFISSIONAL_ID.toString(), dto);

        assertEquals("Ortodontia Avançada", result.getEspecialidade());
        assertEquals("Dr. Carlos", result.getNome());
    }

    @Test
    void atualizar_shouldUpdateAllFields() {
        Profissional profissional = createProfissional();
        when(profissionalRepository.findByOrganizacaoIdAndId(ORG_ID, PROFISSIONAL_ID))
                .thenReturn(Optional.of(profissional));

        ProfissionalDTO dto = new ProfissionalDTO();
        dto.setNome("Dr. Carlos Updated");
        dto.setEmail("carlos.novo@email.com");
        dto.setTelefone("11966665555");
        dto.setCpf("99988877766");
        dto.setNumeroRegistro("CRO-SP-99999");
        dto.setAtivo(false);

        Profissional updated = createProfissional();
        updated.setNome("Dr. Carlos Updated");
        updated.setEmail("carlos.novo@email.com");
        updated.setTelefone("11966665555");
        updated.setCpf("99988877766");
        updated.setNumeroRegistro("CRO-SP-99999");
        updated.setAtivo(false);
        when(profissionalRepository.save(any(Profissional.class))).thenReturn(updated);

        ProfissionalDTO result = profissionalService.atualizar(PROFISSIONAL_ID.toString(), dto);

        assertEquals("Dr. Carlos Updated", result.getNome());
        assertEquals("carlos.novo@email.com", result.getEmail());
        assertEquals("11966665555", result.getTelefone());
        assertEquals("99988877766", result.getCpf());
        assertEquals("CRO-SP-99999", result.getNumeroRegistro());
        assertFalse(result.getAtivo());
    }

    @Test
    void atualizar_shouldThrowWhenNotFound() {
        when(profissionalRepository.findByOrganizacaoIdAndId(ORG_ID, PROFISSIONAL_ID))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> profissionalService.atualizar(PROFISSIONAL_ID.toString(), new ProfissionalDTO()));
    }

    @Test
    void deletar_shouldDeleteWhenFound() {
        Profissional profissional = createProfissional();
        when(profissionalRepository.findByOrganizacaoIdAndId(ORG_ID, PROFISSIONAL_ID))
                .thenReturn(Optional.of(profissional));

        profissionalService.deletar(PROFISSIONAL_ID.toString());

        verify(profissionalRepository).delete(profissional);
    }

    @Test
    void deletar_shouldThrowWhenNotFound() {
        when(profissionalRepository.findByOrganizacaoIdAndId(ORG_ID, PROFISSIONAL_ID))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> profissionalService.deletar(PROFISSIONAL_ID.toString()));
    }
}
