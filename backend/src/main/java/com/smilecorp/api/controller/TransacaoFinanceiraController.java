package com.smilecorp.api.controller;

import com.smilecorp.api.dto.TransacaoFinanceiraDTO;
import com.smilecorp.api.security.NeonAuthToken;
import com.smilecorp.api.service.TransacaoFinanceiraService;
import com.smilecorp.api.util.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/budget/transacoes")
public class TransacaoFinanceiraController {
    private static final Logger log = LoggerFactory.getLogger(TransacaoFinanceiraController.class);

    private final TransacaoFinanceiraService transacaoFinanceiraService;

    public TransacaoFinanceiraController(TransacaoFinanceiraService transacaoFinanceiraService) {
        this.transacaoFinanceiraService = transacaoFinanceiraService;
    }

    @GetMapping
    public ResponseEntity<List<TransacaoFinanceiraDTO>> listar(
            Authentication authentication,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        try {
            setupTenantContext(authentication);
            List<TransacaoFinanceiraDTO> transacoes = transacaoFinanceiraService.listar(tipo, status, dataInicio, dataFim);
            return ResponseEntity.ok(transacoes);
        } catch (Exception e) {
            log.error("Error listing transacoes", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransacaoFinanceiraDTO> obterPorId(
            Authentication authentication,
            @PathVariable String id) {
        try {
            setupTenantContext(authentication);
            TransacaoFinanceiraDTO transacao = transacaoFinanceiraService.obterPorId(id);
            return ResponseEntity.ok(transacao);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error retrieving transacao", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<TransacaoFinanceiraDTO> criar(
            Authentication authentication,
            @RequestBody TransacaoFinanceiraDTO dto) {
        try {
            setupTenantContext(authentication);
            TransacaoFinanceiraDTO created = transacaoFinanceiraService.criar(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error creating transacao", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransacaoFinanceiraDTO> atualizar(
            Authentication authentication,
            @PathVariable String id,
            @RequestBody TransacaoFinanceiraDTO dto) {
        try {
            setupTenantContext(authentication);
            TransacaoFinanceiraDTO updated = transacaoFinanceiraService.atualizar(id, dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error updating transacao", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            Authentication authentication,
            @PathVariable String id) {
        try {
            setupTenantContext(authentication);
            transacaoFinanceiraService.deletar(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error deleting transacao", e);
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
