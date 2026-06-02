package com.smilecorp.api.controller;

import com.smilecorp.api.dto.ProcedimentoDTO;
import com.smilecorp.api.security.NeonAuthToken;
import com.smilecorp.api.service.ProcedimentoService;
import com.smilecorp.api.util.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/procedimentos")
public class ProcedimentoController {
    private static final Logger log = LoggerFactory.getLogger(ProcedimentoController.class);

    private final ProcedimentoService procedimentoService;

    public ProcedimentoController(ProcedimentoService procedimentoService) {
        this.procedimentoService = procedimentoService;
    }

    @GetMapping
    public ResponseEntity<List<ProcedimentoDTO>> listar(
            Authentication authentication,
            @RequestParam(required = false) String nome) {
        try {
            setupTenantContext(authentication);
            List<ProcedimentoDTO> procedimentos = procedimentoService.listar(nome);
            return ResponseEntity.ok(procedimentos);
        } catch (Exception e) {
            log.error("Error listing procedimentos", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProcedimentoDTO> obterPorId(
            Authentication authentication,
            @PathVariable String id) {
        try {
            setupTenantContext(authentication);
            ProcedimentoDTO procedimento = procedimentoService.obterPorId(id);
            return ResponseEntity.ok(procedimento);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error retrieving procedimento", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<ProcedimentoDTO> criar(
            Authentication authentication,
            @RequestBody ProcedimentoDTO dto) {
        try {
            setupTenantContext(authentication);
            ProcedimentoDTO created = procedimentoService.criar(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Error creating procedimento", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProcedimentoDTO> atualizar(
            Authentication authentication,
            @PathVariable String id,
            @RequestBody ProcedimentoDTO dto) {
        try {
            setupTenantContext(authentication);
            ProcedimentoDTO updated = procedimentoService.atualizar(id, dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error updating procedimento", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            Authentication authentication,
            @PathVariable String id) {
        try {
            setupTenantContext(authentication);
            procedimentoService.deletar(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error deleting procedimento", e);
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
