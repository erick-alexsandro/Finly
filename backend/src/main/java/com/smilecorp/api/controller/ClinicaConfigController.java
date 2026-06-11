package com.smilecorp.api.controller;

import com.smilecorp.api.dto.ClinicaConfigDTO;
import com.smilecorp.api.security.NeonAuthToken;
import com.smilecorp.api.service.ClinicaConfigService;
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
@RequestMapping("/api/config")
public class ClinicaConfigController {
    private static final Logger log = LoggerFactory.getLogger(ClinicaConfigController.class);

    private final ClinicaConfigService configService;

    public ClinicaConfigController(ClinicaConfigService configService) {
        this.configService = configService;
    }

    @GetMapping
    public ResponseEntity<List<ClinicaConfigDTO>> listar(Authentication authentication) {
        try {
            setupTenantContext(authentication);
            return ResponseEntity.ok(configService.listarTodas());
        } catch (Exception e) {
            log.error("Error listing config", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{chave}")
    public ResponseEntity<ClinicaConfigDTO> obter(Authentication authentication, @PathVariable String chave) {
        try {
            setupTenantContext(authentication);
            return ResponseEntity.ok(configService.obter(chave));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error getting config {}", chave, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{chave}")
    public ResponseEntity<ClinicaConfigDTO> salvar(
            Authentication authentication,
            @PathVariable String chave,
            @Valid @RequestBody ClinicaConfigDTO dto) {
        try {
            setupTenantContext(authentication);
            dto.setChave(chave);
            return ResponseEntity.ok(configService.salvar(dto));
        } catch (Exception e) {
            log.error("Error saving config {}", chave, e);
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

