package com.smilecorp.api.controller;

import com.smilecorp.api.dto.FornecedorDTO;
import com.smilecorp.api.security.NeonAuthToken;
import com.smilecorp.api.service.FornecedorService;
import com.smilecorp.api.util.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
public class FornecedorController {
    private static final Logger log = LoggerFactory.getLogger(FornecedorController.class);

    private final FornecedorService fornecedorService;

    public FornecedorController(FornecedorService fornecedorService) {
        this.fornecedorService = fornecedorService;
    }

    @GetMapping
    public ResponseEntity<List<FornecedorDTO>> listar(
            Authentication authentication,
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String status) {
        try {
            setupTenantContext(authentication);
            List<FornecedorDTO> fornecedores = fornecedorService.listar(nome, status);
            return ResponseEntity.ok(fornecedores);
        } catch (Exception e) {
            log.error("Error listing fornecedores", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<FornecedorDTO> obterPorId(
            Authentication authentication,
            @PathVariable String id) {
        try {
            setupTenantContext(authentication);
            FornecedorDTO fornecedor = fornecedorService.obterPorId(id);
            return ResponseEntity.ok(fornecedor);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error retrieving fornecedor", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<FornecedorDTO> criar(
            Authentication authentication,
            @RequestBody FornecedorDTO dto) {
        try {
            setupTenantContext(authentication);
            FornecedorDTO created = fornecedorService.criar(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Error creating fornecedor", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<FornecedorDTO> atualizar(
            Authentication authentication,
            @PathVariable String id,
            @RequestBody FornecedorDTO dto) {
        try {
            setupTenantContext(authentication);
            FornecedorDTO updated = fornecedorService.atualizar(id, dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error updating fornecedor", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            Authentication authentication,
            @PathVariable String id) {
        try {
            setupTenantContext(authentication);
            fornecedorService.deletar(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error deleting fornecedor", e);
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
