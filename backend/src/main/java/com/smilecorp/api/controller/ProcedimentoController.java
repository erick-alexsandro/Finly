package com.smilecorp.api.controller;

import com.smilecorp.api.dto.ErrorResponse;
import com.smilecorp.api.dto.ProcedimentoDTO;
import com.smilecorp.api.security.NeonAuthToken;
import com.smilecorp.api.service.ProcedimentoService;
import com.smilecorp.api.util.TenantContext;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String especialidade,
            @RequestParam(required = false) Boolean ativo) {
        setupTenantContext(authentication);
        List<ProcedimentoDTO> procedimentos = procedimentoService.listar(nome, categoria, especialidade, ativo);
        return ResponseEntity.ok(procedimentos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProcedimentoDTO> obterPorId(
            Authentication authentication,
            @PathVariable String id) {
        setupTenantContext(authentication);
        ProcedimentoDTO procedimento = procedimentoService.obterPorId(id);
        return ResponseEntity.ok(procedimento);
    }

    @PostMapping
    public ResponseEntity<ProcedimentoDTO> criar(
            Authentication authentication,
            @Valid @RequestBody ProcedimentoDTO dto) {
        setupTenantContext(authentication);
        ProcedimentoDTO created = procedimentoService.criar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProcedimentoDTO> atualizar(
            Authentication authentication,
            @PathVariable String id,
            @Valid @RequestBody ProcedimentoDTO dto) {
        setupTenantContext(authentication);
        ProcedimentoDTO updated = procedimentoService.atualizar(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            Authentication authentication,
            @PathVariable String id) {
        setupTenantContext(authentication);
        procedimentoService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    private void setupTenantContext(Authentication authentication) {
        if (authentication instanceof NeonAuthToken) {
            NeonAuthToken token = (NeonAuthToken) authentication;
            TenantContext.setOrganizationId(token.getDetails().toString());
        }
    }
}
