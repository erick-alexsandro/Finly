package com.smilecorp.api.controller;

import com.smilecorp.api.dto.ProntuarioDTO;
import com.smilecorp.api.security.NeonAuthToken;
import com.smilecorp.api.service.ProntuarioService;
import com.smilecorp.api.util.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/prontuarios")
public class ProntuarioController {
    private static final Logger log = LoggerFactory.getLogger(ProntuarioController.class);

    private final ProntuarioService prontuarioService;

    public ProntuarioController(ProntuarioService prontuarioService) {
        this.prontuarioService = prontuarioService;
    }

    @GetMapping
    public ResponseEntity<?> listar(
            Authentication authentication,
            @RequestParam(required = false) String pacienteId,
            @RequestParam(required = false) String agendamentoId,
            @RequestParam(required = false, defaultValue = "false") boolean exists) {
        try {
            setupTenantContext(authentication);
            if (exists && agendamentoId != null) {
                boolean existe = prontuarioService.existePorAgendamento(UUID.fromString(agendamentoId));
                return ResponseEntity.ok(java.util.Map.of("exists", existe));
            }
            if (agendamentoId != null) {
                ProntuarioDTO prontuario = prontuarioService.obterPorAgendamento(UUID.fromString(agendamentoId));
                return ResponseEntity.ok(prontuario);
            }
            if (pacienteId != null) {
                List<ProntuarioDTO> prontuarios = prontuarioService.listarPorPaciente(UUID.fromString(pacienteId));
                return ResponseEntity.ok(prontuarios);
            }
            return ResponseEntity.badRequest().body("Missing pacienteId or agendamentoId parameter");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error listing prontuarios", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<ProntuarioDTO> criar(
            Authentication authentication,
            @RequestBody ProntuarioDTO dto) {
        try {
            setupTenantContext(authentication);
            ProntuarioDTO created = prontuarioService.criar(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Error creating prontuario", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProntuarioDTO> atualizar(
            Authentication authentication,
            @PathVariable String id,
            @RequestBody ProntuarioDTO dto) {
        try {
            setupTenantContext(authentication);
            ProntuarioDTO updated = prontuarioService.atualizar(UUID.fromString(id), dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error updating prontuario", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private void setupTenantContext(Authentication authentication) {
        if (authentication instanceof NeonAuthToken) {
            NeonAuthToken token = (NeonAuthToken) authentication;
            TenantContext.setOrganizationId(token.getDetails().toString());
        }
    }
}
