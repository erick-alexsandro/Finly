package com.smilecorp.api.controller;

import com.smilecorp.api.dto.AgendamentoDTO;
import com.smilecorp.api.security.NeonAuthToken;
import com.smilecorp.api.service.AgendamentoService;
import com.smilecorp.api.util.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/agendamentos")
public class AgendamentoController {
    private static final Logger log = LoggerFactory.getLogger(AgendamentoController.class);

    private final AgendamentoService agendamentoService;

    public AgendamentoController(AgendamentoService agendamentoService) {
        this.agendamentoService = agendamentoService;
    }

    @GetMapping
    public ResponseEntity<List<AgendamentoDTO>> listar(
            Authentication authentication,
            @RequestParam(required = false) String doctor,
            @RequestParam(required = false) String patient,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        try {
            setupTenantContext(authentication);
            List<AgendamentoDTO> agendamentos = agendamentoService.listar(doctor, patient, startDate, endDate);
            return ResponseEntity.ok(agendamentos);
        } catch (Exception e) {
            log.error("Error listing agendamentos", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<AgendamentoDTO> obterPorId(
            Authentication authentication,
            @PathVariable String id) {
        try {
            setupTenantContext(authentication);
            AgendamentoDTO agendamento = agendamentoService.obterPorId(id);
            return ResponseEntity.ok(agendamento);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error retrieving agendamento", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<AgendamentoDTO> criar(
            Authentication authentication,
            @RequestBody AgendamentoDTO dto) {
        try {
            log.info("[POST /api/agendamentos] Received DTO: pacienteId={}, profissionalId={}, data={}, horaInicio={}, horaFim={}", 
                    dto.getPacienteId(), dto.getProfissionalId(), dto.getData(), dto.getHoraInicio(), dto.getHoraFim());
            setupTenantContext(authentication);
            AgendamentoDTO created = agendamentoService.criar(dto);
            log.info("[POST /api/agendamentos] Successfully created agendamento with ID: {}", created.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid agendamento data: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            log.error("Error creating agendamento", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<AgendamentoDTO> atualizar(
            Authentication authentication,
            @PathVariable String id,
            @RequestBody AgendamentoDTO dto) {
        try {
            setupTenantContext(authentication);
            AgendamentoDTO updated = agendamentoService.atualizar(id, dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid agendamento data: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error updating agendamento", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            Authentication authentication,
            @PathVariable String id) {
        try {
            setupTenantContext(authentication);
            agendamentoService.deletar(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error deleting agendamento", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private void setupTenantContext(Authentication authentication) {
        if (authentication instanceof NeonAuthToken) {
            NeonAuthToken token = (NeonAuthToken) authentication;
            String orgId = token.getDetails().toString();
            log.info("[setupTenantContext] Setting organization ID: {} for user: {}", orgId, token.getUserId());
            TenantContext.setOrganizationId(orgId);
        } else {
            log.warn("[setupTenantContext] Authentication is not NeonAuthToken: {}", authentication.getClass().getName());
        }
    }
}
