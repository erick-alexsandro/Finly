package com.smilecorp.api.controller;

import com.smilecorp.api.dto.PagamentoPacienteDTO;
import com.smilecorp.api.security.NeonAuthToken;
import com.smilecorp.api.service.PagamentoPacienteService;
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
@RequestMapping("/api/pagamento-paciente")
public class PagamentoPacienteController {
    private static final Logger log = LoggerFactory.getLogger(PagamentoPacienteController.class);

    private final PagamentoPacienteService pagamentoPacienteService;

    public PagamentoPacienteController(PagamentoPacienteService pagamentoPacienteService) {
        this.pagamentoPacienteService = pagamentoPacienteService;
    }

    @GetMapping
    public ResponseEntity<?> listar(
            Authentication authentication,
            @RequestParam(required = false) String pacienteId) {
        try {
            setupTenantContext(authentication);
            if (pacienteId != null) {
                List<PagamentoPacienteDTO> pagamentos = pagamentoPacienteService.listarPorPaciente(UUID.fromString(pacienteId));
                return ResponseEntity.ok(pagamentos);
            }
            return ResponseEntity.badRequest().body("Missing pacienteId parameter");
        } catch (Exception e) {
            log.error("Error listing pagamentos", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<PagamentoPacienteDTO> criar(
            Authentication authentication,
            @RequestBody PagamentoPacienteDTO dto) {
        try {
            setupTenantContext(authentication);
            PagamentoPacienteDTO created = pagamentoPacienteService.criar(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Error creating pagamento", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<PagamentoPacienteDTO> atualizar(
            Authentication authentication,
            @PathVariable String id,
            @RequestBody PagamentoPacienteDTO dto) {
        try {
            setupTenantContext(authentication);
            PagamentoPacienteDTO updated = pagamentoPacienteService.atualizar(UUID.fromString(id), dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error updating pagamento", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            Authentication authentication,
            @PathVariable String id) {
        try {
            setupTenantContext(authentication);
            pagamentoPacienteService.deletar(UUID.fromString(id));
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error deleting pagamento", e);
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
