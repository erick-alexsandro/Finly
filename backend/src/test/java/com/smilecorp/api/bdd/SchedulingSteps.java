package com.smilecorp.api.bdd;

import com.smilecorp.api.dto.AgendamentoDTO;
import com.smilecorp.api.entity.Agendamento;
import com.smilecorp.api.entity.Paciente;
import com.smilecorp.api.entity.Profissional;
import com.smilecorp.api.repository.AgendamentoRepository;
import com.smilecorp.api.repository.PacienteRepository;
import com.smilecorp.api.repository.ProfissionalRepository;
import com.smilecorp.api.service.AgendamentoService;
import com.smilecorp.api.util.TenantContext;
import io.cucumber.java.Before;
import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class SchedulingSteps {

    private AgendamentoService agendamentoService;
    private AgendamentoRepository agendamentoRepository;
    private PacienteRepository pacienteRepository;
    private ProfissionalRepository profissionalRepository;

    private AgendamentoDTO createdAppointment;
    private Exception thrownException;

    private UUID profissionalUuid;
    private UUID pacienteUuid;
    private Profissional profissional;
    private Paciente paciente;

    @Before
    public void setUp() {
        agendamentoRepository = mock(AgendamentoRepository.class);
        pacienteRepository = mock(PacienteRepository.class);
        profissionalRepository = mock(ProfissionalRepository.class);
        agendamentoService = new AgendamentoService(
                agendamentoRepository, pacienteRepository, profissionalRepository);
    }

    @Given("um profissional existe com ID {string} e nome {string}")
    public void aProfessionalExists(String id, String name) {
        profissionalUuid = UUID.fromString(id);
        profissional = new Profissional(TenantContext.getOrganizationId(), name);
        profissional.setId(profissionalUuid);
        when(profissionalRepository.findByOrganizacaoIdAndId(
                TenantContext.getOrganizationId(), profissionalUuid))
                .thenReturn(Optional.of(profissional));
    }

    @Given("um paciente existe com ID {string} e nome {string}")
    public void aPatientExists(String id, String name) {
        pacienteUuid = UUID.fromString(id);
        paciente = new Paciente(TenantContext.getOrganizationId(), name,
                "joao@email.com", "11999990000");
        paciente.setId(pacienteUuid);
        when(pacienteRepository.findByOrganizacaoIdAndId(
                TenantContext.getOrganizationId(), pacienteUuid))
                .thenReturn(Optional.of(paciente));
    }

    @When("eu crio um agendamento para o paciente {string} com o profissional {string}")
    public void createAppointment(String patientName, String profName) {
        AgendamentoDTO dto = new AgendamentoDTO();
        dto.setPacienteId(pacienteUuid.toString());
        dto.setPacienteNome(patientName);
        dto.setProfissionalId(profissionalUuid.toString());

        createdAppointment = dto;
    }

    @And("os detalhes do agendamento são:")
    public void setAppointmentDetails(Map<String, String> details) {
        LocalDate date = LocalDate.parse(details.get("date"));
        createdAppointment.setData(LocalDateTime.of(date, LocalTime.of(9, 0)));
        createdAppointment.setHoraInicio(details.get("horaInicio"));
        createdAppointment.setHoraFim(details.get("horaFim"));
        createdAppointment.setStatus(details.get("status"));

        AgendamentoDTO saved = new AgendamentoDTO(
                UUID.randomUUID().toString(),
                createdAppointment.getData(),
                createdAppointment.getHoraInicio(),
                createdAppointment.getHoraFim(),
                pacienteUuid.toString(),
                paciente.getNome(),
                profissionalUuid.toString(),
                profissional.getNome(),
                createdAppointment.getStatus(),
                null,
                null,
                false,
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        when(agendamentoRepository.save(any())).thenAnswer(invocation -> {
            Agendamento entity = invocation.getArgument(0);
            if (entity.getId() == null) {
                entity.setId(UUID.randomUUID());
            }
            return entity;
        });

        try {
            AgendamentoDTO result = agendamentoService.criar(createdAppointment);
            createdAppointment = result;
            thrownException = null;
        } catch (Exception e) {
            thrownException = e;
        }
    }

    @When("eu crio um agendamento com nome de paciente vazio")
    public void createAppointmentWithEmptyName() {
        AgendamentoDTO dto = new AgendamentoDTO();
        dto.setPacienteNome("");
        try {
            agendamentoService.criar(dto);
            thrownException = null;
        } catch (Exception e) {
            thrownException = e;
        }
    }

    @Then("o agendamento é criado com sucesso")
    public void appointmentCreatedSuccessfully() {
        assertNull(thrownException, "Expected no exception but got: " + thrownException);
        assertNotNull(createdAppointment);
        assertNotNull(createdAppointment.getId());
    }

    @And("o status do agendamento deve ser {string}")
    public void checkAppointmentStatus(String status) {
        assertEquals(status, createdAppointment.getStatus());
    }

    @And("o paciente do agendamento deve ser {string}")
    public void checkAppointmentPatient(String patientName) {
        assertEquals(patientName, createdAppointment.getPacienteNome());
    }

    @And("o profissional do agendamento deve ser {string}")
    public void checkAppointmentProfessional(String profName) {
        assertEquals(profName, createdAppointment.getProfissionalNome());
    }

    @Then("o sistema deve rejeitar a operação com {string}")
    public void shouldRejectOperation(String message) {
        assertNotNull(thrownException);
        assertTrue(thrownException.getMessage().contains(message),
                "Expected message containing: " + message + " but got: " + thrownException.getMessage());
    }
}
