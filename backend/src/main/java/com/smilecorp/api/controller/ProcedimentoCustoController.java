package com.smilecorp.api.controller;

import com.smilecorp.api.dto.ProcedimentoCustoDTO;
import com.smilecorp.api.security.NeonAuthToken;
import com.smilecorp.api.service.ProcedimentoCustoService;
import com.smilecorp.api.util.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/procedimentos/{procedimentoId}/custos")
public class ProcedimentoCustoController {
    private static final Logger log = LoggerFactory.getLogger(ProcedimentoCustoController.class);

    private final ProcedimentoCustoService custoService;

    public ProcedimentoCustoController(ProcedimentoCustoService custoService) {
        this.custoService = custoService;
    }

    @GetMapping
    public ResponseEntity<List<ProcedimentoCustoDTO>> listar(
            Authentication authentication,
            @PathVariable String procedimentoId) {
        try {
            setupTenantContext(authentication);
            List<ProcedimentoCustoDTO> custos = custoService.listarPorProcedimento(procedimentoId);
            return ResponseEntity.ok(custos);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error listing custos for procedimento {}", procedimentoId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping
    public ResponseEntity<List<ProcedimentoCustoDTO>> salvar(
            Authentication authentication,
            @PathVariable String procedimentoId,
            @Valid @RequestBody List<ProcedimentoCustoDTO> custos) {
        try {
            setupTenantContext(authentication);
            List<ProcedimentoCustoDTO> saved = custoService.salvar(procedimentoId, custos);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error saving custos for procedimento {}", procedimentoId, e);
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
