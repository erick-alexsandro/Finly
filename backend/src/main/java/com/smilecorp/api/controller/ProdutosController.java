package com.smilecorp.api.controller;

import com.smilecorp.api.dto.ProdutosDTO;
import com.smilecorp.api.dto.ProdutosDTO.ReporEstoqueRequest;
import com.smilecorp.api.security.NeonAuthToken;
import com.smilecorp.api.service.ProdutoService;
import com.smilecorp.api.util.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ProdutosController {
    private static final Logger log = LoggerFactory.getLogger(ProdutosController.class);

    private final ProdutoService produtoService;

    public ProdutosController(ProdutoService produtoService) {
        this.produtoService = produtoService;
    }

    @GetMapping("/produtos")
    public ResponseEntity<List<ProdutosDTO>> listar(
            Authentication authentication,
            @RequestParam(required = false) String name) {
        try {
            setupTenantContext(authentication);
            List<ProdutosDTO> items = produtoService.listar(name);
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            log.error("Error listing produtos", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/produtos/{id}")
    public ResponseEntity<ProdutosDTO> obterPorId(
            Authentication authentication,
            @PathVariable Long id) {
        try {
            setupTenantContext(authentication);
            ProdutosDTO item = produtoService.obterPorId(id);
            return ResponseEntity.ok(item);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error retrieving produto", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/produtos/{id}/repor-estoque")
    public ResponseEntity<ProdutosDTO> reporEstoque(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody ReporEstoqueRequest request) {
        try {
            setupTenantContext(authentication);
            ProdutosDTO updated = produtoService.reporEstoque(id, request.getQuantidade(), request.getPrecoCompra());
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error restocking produto", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/produtos")
    public ResponseEntity<ProdutosDTO> criar(
            Authentication authentication,
            @RequestBody ProdutosDTO dto) {
        try {
            setupTenantContext(authentication);
            ProdutosDTO created = produtoService.criar(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Error creating produto", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/produtos/{id}")
    public ResponseEntity<ProdutosDTO> atualizar(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody ProdutosDTO dto) {
        try {
            setupTenantContext(authentication);
            ProdutosDTO updated = produtoService.atualizar(id, dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error updating produto", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/produtos/{id}")
    public ResponseEntity<Void> deletar(
            Authentication authentication,
            @PathVariable Long id) {
        try {
            setupTenantContext(authentication);
            produtoService.deletar(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error deleting produto", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/movimentos")
    public ResponseEntity<List<ProdutosDTO>> listarMovimentos(
            Authentication authentication,
            @RequestParam(required = false) Long produtoId) {
        try {
            setupTenantContext(authentication);
            List<ProdutosDTO> items = produtoService.listarMovimentos(produtoId);
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            log.error("Error listing movimentos", e);
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
