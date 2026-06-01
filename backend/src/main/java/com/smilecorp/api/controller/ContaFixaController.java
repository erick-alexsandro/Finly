package com.smilecorp.api.controller;

import com.smilecorp.api.dto.ContaFixaDTO;
import com.smilecorp.api.security.NeonAuthToken;
import com.smilecorp.api.service.ContaFixaService;
import com.smilecorp.api.util.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budget/contas-fixas")
public class ContaFixaController {
    private static final Logger log = LoggerFactory.getLogger(ContaFixaController.class);

    private final ContaFixaService contaFixaService;

    public ContaFixaController(ContaFixaService contaFixaService) {
        this.contaFixaService = contaFixaService;
    }

    @GetMapping
    public ResponseEntity<List<ContaFixaDTO>> listar(
            Authentication authentication,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String status) {
        try {
            setupTenantContext(authentication);
            List<ContaFixaDTO> contas = contaFixaService.listar(tipo, status);
            return ResponseEntity.ok(contas);
        } catch (Exception e) {
            log.error("Error listing contas fixas", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContaFixaDTO> obterPorId(
            Authentication authentication,
            @PathVariable String id) {
        try {
            setupTenantContext(authentication);
            ContaFixaDTO conta = contaFixaService.obterPorId(id);
            return ResponseEntity.ok(conta);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error retrieving conta fixa", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<ContaFixaDTO> criar(
            Authentication authentication,
            @RequestBody ContaFixaDTO dto) {
        try {
            setupTenantContext(authentication);
            ContaFixaDTO created = contaFixaService.criar(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error creating conta fixa", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContaFixaDTO> atualizar(
            Authentication authentication,
            @PathVariable String id,
            @RequestBody ContaFixaDTO dto) {
        try {
            setupTenantContext(authentication);
            ContaFixaDTO updated = contaFixaService.atualizar(id, dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error updating conta fixa", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            Authentication authentication,
            @PathVariable String id) {
        try {
            setupTenantContext(authentication);
            contaFixaService.deletar(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error deleting conta fixa", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private void setupTenantContext(Authentication authentication) {
        if (authentication instanceof NeonAuthToken) {
            NeonAuthToken token = (NeonAuthToken) authentication;
            TenantContext.setOrganizationId(token.getOrganizationId());
        }
    }
}
