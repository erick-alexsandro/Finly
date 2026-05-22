package com.smilecorp.api.service;

import com.smilecorp.api.dto.AgendamentoDTO;
import com.smilecorp.api.entity.Agendamento;
import com.smilecorp.api.entity.Paciente;
import com.smilecorp.api.entity.Profissional;
import com.smilecorp.api.repository.AgendamentoRepository;
import com.smilecorp.api.repository.PacienteRepository;
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
class AgendamentoServiceTest {

    private static final String ORG_ID = "org-123";
    private static final UUID AGENDAMENTO_ID = UUID.randomUUID();
    private static final UUID PACIENTE_ID = UUID.randomUUID();
    private static final UUID PROFISSIONAL_ID = UUID.randomUUID();

    @Mock
    private AgendamentoRepository agendamentoRepository;
    @Mock
    private PacienteRepository pacienteRepository;
    @Mock
    private ProfissionalRepository profissionalRepository;

    @InjectMocks
    private AgendamentoService agendamentoService;

    @Captor
    private ArgumentCaptor<Agendamento> agendamentoCaptor;

    private Paciente paciente;
    private Profissional profissional;

    @BeforeEach
    void setUp() {
        TenantContext.setOrganizationId(ORG_ID);

        paciente = new Paciente(ORG_ID, "João Silva", "joao@email.com", "11999990000");
        paciente.setId(PACIENTE_ID);
        paciente.setCriadoEm(LocalDateTime.now());
        paciente.setAtualizadoEm(LocalDateTime.now());

        profissional = new Profissional(ORG_ID, "Dr. Carlos");
        profissional.setId(PROFISSIONAL_ID);
        profissional.setCriadoEm(LocalDateTime.now());
        profissional.setAtualizadoEm(LocalDateTime.now());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private Agendamento createAgendamento() {
        Agendamento a = new Agendamento(ORG_ID, LocalDateTime.now(), "09:00", "10:00",
                PACIENTE_ID, paciente, PROFISSIONAL_ID, profissional,
                "agendado", List.of(), "", false);
        a.setId(AGENDAMENTO_ID);
        a.setCriadoEm(LocalDateTime.now());
        a.setAtualizadoEm(LocalDateTime.now());
        return a;
    }

    @Test
    void listar_shouldReturnAllWhenNoFilters() {
        Agendamento agendamento = createAgendamento();
        when(agendamentoRepository.findByOrganizacaoId(ORG_ID)).thenReturn(List.of(agendamento));

        List<AgendamentoDTO> result = agendamentoService.listar(null, null, null, null);

        assertEquals(1, result.size());
        verify(agendamentoRepository).findByOrganizacaoId(ORG_ID);
    }

    @Test
    void listar_shouldFilterByPacienteId() {
        Agendamento agendamento = createAgendamento();
        when(agendamentoRepository.findByOrganizacaoIdAndPacienteId(ORG_ID, PACIENTE_ID))
                .thenReturn(List.of(agendamento));

        List<AgendamentoDTO> result = agendamentoService.listar(null, PACIENTE_ID.toString(), null, null);

        assertEquals(1, result.size());
    }

    @Test
    void listar_shouldFilterByDateRange() {
        Agendamento agendamento = createAgendamento();
        LocalDateTime start = LocalDateTime.now().minusDays(1);
        LocalDateTime end = LocalDateTime.now().plusDays(1);
        when(agendamentoRepository.findByOrganizacaoIdAndDataBetween(ORG_ID, start, end))
                .thenReturn(List.of(agendamento));

        List<AgendamentoDTO> result = agendamentoService.listar(null, null, start, end);

        assertEquals(1, result.size());
    }

    @Test
    void listar_shouldFilterByProfissionalAndDateRange() {
        Agendamento agendamento = createAgendamento();
        LocalDateTime start = LocalDateTime.now().minusDays(1);
        LocalDateTime end = LocalDateTime.now().plusDays(1);
        when(agendamentoRepository.findByOrganizacaoIdAndProfissionalIdAndDataBetween(
                ORG_ID, PROFISSIONAL_ID, start, end))
                .thenReturn(List.of(agendamento));

        List<AgendamentoDTO> result = agendamentoService.listar(PROFISSIONAL_ID.toString(), null, start, end);

        assertEquals(1, result.size());
    }

    @Test
    void obterPorId_shouldReturnAgendamentoWhenFound() {
        Agendamento agendamento = createAgendamento();
        when(agendamentoRepository.findByOrganizacaoIdAndId(ORG_ID, AGENDAMENTO_ID))
                .thenReturn(Optional.of(agendamento));

        AgendamentoDTO result = agendamentoService.obterPorId(AGENDAMENTO_ID.toString());

        assertEquals("agendado", result.getStatus());
    }

    @Test
    void obterPorId_shouldThrowWhenNotFound() {
        when(agendamentoRepository.findByOrganizacaoIdAndId(ORG_ID, AGENDAMENTO_ID))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> agendamentoService.obterPorId(AGENDAMENTO_ID.toString()));
    }

    @Test
    void criar_shouldThrowWhenPatientNameIsNull() {
        AgendamentoDTO dto = new AgendamentoDTO();
        dto.setPacienteNome(null);

        assertThrows(IllegalArgumentException.class, () -> agendamentoService.criar(dto));
    }

    @Test
    void criar_shouldThrowWhenPatientNameIsEmpty() {
        AgendamentoDTO dto = new AgendamentoDTO();
        dto.setPacienteNome("");

        assertThrows(IllegalArgumentException.class, () -> agendamentoService.criar(dto));
    }

    @Test
    void criar_shouldThrowWhenProfissionalNotFound() {
        AgendamentoDTO dto = new AgendamentoDTO();
        dto.setPacienteNome("João Silva");
        dto.setProfissionalId(PROFISSIONAL_ID.toString());

        when(pacienteRepository.save(any(Paciente.class))).thenReturn(paciente);
        when(profissionalRepository.findByOrganizacaoIdAndId(ORG_ID, PROFISSIONAL_ID))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> agendamentoService.criar(dto));
    }

    @Test
    void criar_shouldAutoCreatePatientWhenIdIsNull() {
        AgendamentoDTO dto = new AgendamentoDTO();
        dto.setPacienteNome("Novo Paciente");
        dto.setEmail("novo@email.com");
        dto.setTelefone("11988887777");
        dto.setProfissionalId(PROFISSIONAL_ID.toString());
        dto.setData(LocalDateTime.now());
        dto.setHoraInicio("09:00");
        dto.setHoraFim("10:00");

        Paciente newPaciente = new Paciente(ORG_ID, "Novo Paciente", "novo@email.com", "11988887777");
        newPaciente.setId(UUID.randomUUID());

        when(profissionalRepository.findByOrganizacaoIdAndId(ORG_ID, PROFISSIONAL_ID))
                .thenReturn(Optional.of(profissional));
        when(pacienteRepository.save(any(Paciente.class))).thenReturn(newPaciente);

        Agendamento saved = createAgendamento();
        saved.setPaciente(newPaciente);
        saved.setPacienteId(newPaciente.getId());
        when(agendamentoRepository.save(any(Agendamento.class))).thenReturn(saved);

        AgendamentoDTO result = agendamentoService.criar(dto);

        assertNotNull(result);
        verify(pacienteRepository).save(any(Paciente.class));
    }

    @Test
    void criar_shouldAutoCreatePatientWhenPacienteIdIsNullString() {
        AgendamentoDTO dto = new AgendamentoDTO();
        dto.setPacienteId("null");
        dto.setPacienteNome("Paciente from null string");
        dto.setProfissionalId(PROFISSIONAL_ID.toString());
        dto.setData(LocalDateTime.now());
        dto.setHoraInicio("09:00");
        dto.setHoraFim("10:00");

        Paciente newPaciente = new Paciente(ORG_ID, "Paciente from null string", null, null);
        newPaciente.setId(UUID.randomUUID());

        when(profissionalRepository.findByOrganizacaoIdAndId(ORG_ID, PROFISSIONAL_ID))
                .thenReturn(Optional.of(profissional));
        when(pacienteRepository.save(any(Paciente.class))).thenReturn(newPaciente);

        Agendamento saved = createAgendamento();
        saved.setPaciente(newPaciente);
        saved.setPacienteId(newPaciente.getId());
        when(agendamentoRepository.save(any(Agendamento.class))).thenReturn(saved);

        AgendamentoDTO result = agendamentoService.criar(dto);

        assertNotNull(result);
        verify(pacienteRepository).save(any(Paciente.class));
    }

    @Test
    void criar_shouldAutoCreatePatientWhenPacienteIdIsInvalidUUID() {
        AgendamentoDTO dto = new AgendamentoDTO();
        dto.setPacienteId("not-a-uuid");
        dto.setPacienteNome("Paciente from invalid id");
        dto.setEmail("paciente@email.com");
        dto.setTelefone("11999990000");
        dto.setProfissionalId(PROFISSIONAL_ID.toString());
        dto.setData(LocalDateTime.now());
        dto.setHoraInicio("09:00");
        dto.setHoraFim("10:00");

        Paciente newPaciente = new Paciente(ORG_ID, "Paciente from invalid id", "paciente@email.com", "11999990000");
        newPaciente.setId(UUID.randomUUID());

        when(profissionalRepository.findByOrganizacaoIdAndId(ORG_ID, PROFISSIONAL_ID))
                .thenReturn(Optional.of(profissional));
        when(pacienteRepository.save(any(Paciente.class))).thenReturn(newPaciente);

        Agendamento saved = createAgendamento();
        saved.setPaciente(newPaciente);
        saved.setPacienteId(newPaciente.getId());
        when(agendamentoRepository.save(any(Agendamento.class))).thenReturn(saved);

        AgendamentoDTO result = agendamentoService.criar(dto);

        assertNotNull(result);
        verify(pacienteRepository).save(any(Paciente.class));
    }

    @Test
    void criar_shouldIncludeProcedimentosIds() {
        AgendamentoDTO dto = new AgendamentoDTO();
        dto.setPacienteNome("João Silva");
        dto.setProfissionalId(PROFISSIONAL_ID.toString());
        dto.setData(LocalDateTime.now());
        dto.setHoraInicio("09:00");
        dto.setHoraFim("10:00");
        dto.setProcedimentosIds(List.of("proc-1", "proc-2"));

        when(pacienteRepository.save(any(Paciente.class))).thenReturn(paciente);
        when(profissionalRepository.findByOrganizacaoIdAndId(ORG_ID, PROFISSIONAL_ID))
                .thenReturn(Optional.of(profissional));

        Agendamento saved = createAgendamento();
        saved.setProcedimentosIds(List.of("proc-1", "proc-2"));
        when(agendamentoRepository.save(any(Agendamento.class))).thenReturn(saved);

        AgendamentoDTO result = agendamentoService.criar(dto);

        assertNotNull(result);
        assertEquals(List.of("proc-1", "proc-2"), result.getProcedimentosIds());
    }

    @Test
    void criar_shouldUseExistingPatientWhenIdProvided() {
        AgendamentoDTO dto = new AgendamentoDTO();
        dto.setPacienteId(PACIENTE_ID.toString());
        dto.setPacienteNome("João Silva");
        dto.setProfissionalId(PROFISSIONAL_ID.toString());
        dto.setData(LocalDateTime.now());
        dto.setHoraInicio("09:00");
        dto.setHoraFim("10:00");

        when(pacienteRepository.findByOrganizacaoIdAndId(ORG_ID, PACIENTE_ID))
                .thenReturn(Optional.of(paciente));
        when(profissionalRepository.findByOrganizacaoIdAndId(ORG_ID, PROFISSIONAL_ID))
                .thenReturn(Optional.of(profissional));

        Agendamento saved = createAgendamento();
        when(agendamentoRepository.save(any(Agendamento.class))).thenReturn(saved);

        AgendamentoDTO result = agendamentoService.criar(dto);

        assertNotNull(result);
        verify(pacienteRepository, never()).save(any(Paciente.class));
    }

    @Test
    void atualizar_shouldUpdateStatusAndObservacoes() {
        Agendamento agendamento = createAgendamento();
        when(agendamentoRepository.findByOrganizacaoIdAndId(ORG_ID, AGENDAMENTO_ID))
                .thenReturn(Optional.of(agendamento));

        AgendamentoDTO dto = new AgendamentoDTO();
        dto.setStatus("confirmado");
        dto.setConfirmado(true);
        dto.setObservacoes("Paciente confirmou");

        Agendamento updated = createAgendamento();
        updated.setStatus("confirmado");
        updated.setConfirmado(true);
        updated.setObservacoes("Paciente confirmou");
        when(agendamentoRepository.save(any(Agendamento.class))).thenReturn(updated);

        AgendamentoDTO result = agendamentoService.atualizar(AGENDAMENTO_ID.toString(), dto);

        assertEquals("confirmado", result.getStatus());
        assertTrue(result.getConfirmado());
    }

    @Test
    void atualizar_shouldUpdateAllBasicFields() {
        Agendamento agendamento = createAgendamento();
        when(agendamentoRepository.findByOrganizacaoIdAndId(ORG_ID, AGENDAMENTO_ID))
                .thenReturn(Optional.of(agendamento));

        LocalDateTime newData = LocalDateTime.now().plusDays(5);
        AgendamentoDTO dto = new AgendamentoDTO();
        dto.setData(newData);
        dto.setHoraInicio("14:00");
        dto.setHoraFim("15:30");
        dto.setProcedimentosIds(List.of("proc-3"));
        dto.setConfirmado(false);

        Agendamento updated = createAgendamento();
        updated.setData(newData);
        updated.setHoraInicio("14:00");
        updated.setHoraFim("15:30");
        updated.setProcedimentosIds(List.of("proc-3"));
        updated.setConfirmado(false);
        when(agendamentoRepository.save(any(Agendamento.class))).thenReturn(updated);

        AgendamentoDTO result = agendamentoService.atualizar(AGENDAMENTO_ID.toString(), dto);

        assertEquals(newData, result.getData());
        assertEquals("14:00", result.getHoraInicio());
        assertEquals("15:30", result.getHoraFim());
        assertEquals(List.of("proc-3"), result.getProcedimentosIds());
        assertFalse(result.getConfirmado());
    }

    @Test
    void atualizar_shouldChangePacienteId() {
        Agendamento agendamento = createAgendamento();
        when(agendamentoRepository.findByOrganizacaoIdAndId(ORG_ID, AGENDAMENTO_ID))
                .thenReturn(Optional.of(agendamento));

        UUID newPacienteId = UUID.randomUUID();
        Paciente newPaciente = new Paciente(ORG_ID, "Novo Paciente", null, null);
        newPaciente.setId(newPacienteId);

        AgendamentoDTO dto = new AgendamentoDTO();
        dto.setPacienteId(newPacienteId.toString());

        when(pacienteRepository.findByOrganizacaoIdAndId(ORG_ID, newPacienteId))
                .thenReturn(Optional.of(newPaciente));

        Agendamento updated = createAgendamento();
        updated.setPacienteId(newPacienteId);
        updated.setPaciente(newPaciente);
        when(agendamentoRepository.save(any(Agendamento.class))).thenReturn(updated);

        AgendamentoDTO result = agendamentoService.atualizar(AGENDAMENTO_ID.toString(), dto);

        assertEquals(newPacienteId.toString(), result.getPacienteId());
    }

    @Test
    void atualizar_shouldThrowWhenPacienteIdIsInvalidUUID() {
        Agendamento agendamento = createAgendamento();
        when(agendamentoRepository.findByOrganizacaoIdAndId(ORG_ID, AGENDAMENTO_ID))
                .thenReturn(Optional.of(agendamento));

        AgendamentoDTO dto = new AgendamentoDTO();
        dto.setPacienteId("invalid-uuid-format");

        assertThrows(IllegalArgumentException.class,
                () -> agendamentoService.atualizar(AGENDAMENTO_ID.toString(), dto));
    }

    @Test
    void atualizar_shouldThrowWhenPacienteIdNotFound() {
        Agendamento agendamento = createAgendamento();
        when(agendamentoRepository.findByOrganizacaoIdAndId(ORG_ID, AGENDAMENTO_ID))
                .thenReturn(Optional.of(agendamento));

        UUID newPacienteId = UUID.randomUUID();
        AgendamentoDTO dto = new AgendamentoDTO();
        dto.setPacienteId(newPacienteId.toString());

        when(pacienteRepository.findByOrganizacaoIdAndId(ORG_ID, newPacienteId))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> agendamentoService.atualizar(AGENDAMENTO_ID.toString(), dto));
    }

    @Test
    void atualizar_shouldChangeProfissionalId() {
        Agendamento agendamento = createAgendamento();
        when(agendamentoRepository.findByOrganizacaoIdAndId(ORG_ID, AGENDAMENTO_ID))
                .thenReturn(Optional.of(agendamento));

        UUID newProfissionalId = UUID.randomUUID();
        Profissional newProf = new Profissional(ORG_ID, "Dr. Novo");
        newProf.setId(newProfissionalId);

        AgendamentoDTO dto = new AgendamentoDTO();
        dto.setProfissionalId(newProfissionalId.toString());

        when(profissionalRepository.findByOrganizacaoIdAndId(ORG_ID, newProfissionalId))
                .thenReturn(Optional.of(newProf));

        Agendamento updated = createAgendamento();
        updated.setProfissionalId(newProfissionalId);
        updated.setProfissional(newProf);
        when(agendamentoRepository.save(any(Agendamento.class))).thenReturn(updated);

        AgendamentoDTO result = agendamentoService.atualizar(AGENDAMENTO_ID.toString(), dto);

        assertEquals(newProfissionalId.toString(), result.getProfissionalId());
    }

    @Test
    void atualizar_shouldThrowWhenProfissionalIdIsInvalidUUID() {
        Agendamento agendamento = createAgendamento();
        when(agendamentoRepository.findByOrganizacaoIdAndId(ORG_ID, AGENDAMENTO_ID))
                .thenReturn(Optional.of(agendamento));

        AgendamentoDTO dto = new AgendamentoDTO();
        dto.setProfissionalId("bad-uuid");

        assertThrows(IllegalArgumentException.class,
                () -> agendamentoService.atualizar(AGENDAMENTO_ID.toString(), dto));
    }

    @Test
    void atualizar_shouldThrowWhenProfissionalIdNotFound() {
        Agendamento agendamento = createAgendamento();
        when(agendamentoRepository.findByOrganizacaoIdAndId(ORG_ID, AGENDAMENTO_ID))
                .thenReturn(Optional.of(agendamento));

        UUID newProfissionalId = UUID.randomUUID();
        AgendamentoDTO dto = new AgendamentoDTO();
        dto.setProfissionalId(newProfissionalId.toString());

        when(profissionalRepository.findByOrganizacaoIdAndId(ORG_ID, newProfissionalId))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> agendamentoService.atualizar(AGENDAMENTO_ID.toString(), dto));
    }

    @Test
    void atualizar_shouldThrowWhenNotFound() {
        when(agendamentoRepository.findByOrganizacaoIdAndId(ORG_ID, AGENDAMENTO_ID))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> agendamentoService.atualizar(AGENDAMENTO_ID.toString(), new AgendamentoDTO()));
    }

    @Test
    void deletar_shouldDeleteWhenFound() {
        Agendamento agendamento = createAgendamento();
        when(agendamentoRepository.findByOrganizacaoIdAndId(ORG_ID, AGENDAMENTO_ID))
                .thenReturn(Optional.of(agendamento));

        agendamentoService.deletar(AGENDAMENTO_ID.toString());

        verify(agendamentoRepository).delete(agendamento);
    }

    @Test
    void deletar_shouldThrowWhenNotFound() {
        when(agendamentoRepository.findByOrganizacaoIdAndId(ORG_ID, AGENDAMENTO_ID))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> agendamentoService.deletar(AGENDAMENTO_ID.toString()));
    }
}
