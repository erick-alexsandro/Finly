package com.smilecorp.api.service;

import com.smilecorp.api.dto.ClinicaConfigDTO;
import com.smilecorp.api.entity.ClinicaConfig;
import com.smilecorp.api.repository.ClinicaConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ClinicaConfigService {
    private static final Logger log = LoggerFactory.getLogger(ClinicaConfigService.class);

    private final ClinicaConfigRepository configRepository;

    public ClinicaConfigService(ClinicaConfigRepository configRepository) {
        this.configRepository = configRepository;
    }

    public List<ClinicaConfigDTO> listarTodas() {
        return configRepository.findAll().stream()
                .map(c -> new ClinicaConfigDTO(c.getChave(), c.getValor()))
                .collect(Collectors.toList());
    }

    public ClinicaConfigDTO obter(String chave) {
        ClinicaConfig config = configRepository.findByChave(chave)
                .orElseThrow(() -> new IllegalArgumentException("Config not found: " + chave));
        return new ClinicaConfigDTO(config.getChave(), config.getValor());
    }

    public BigDecimal getHoraClinicaValor() {
        return configRepository.findByChave("hora_clinica_valor")
                .map(c -> {
                    try { return new BigDecimal(c.getValor()); }
                    catch (Exception e) { return BigDecimal.valueOf(100); }
                })
                .orElse(BigDecimal.valueOf(100));
    }

    public ClinicaConfigDTO salvar(ClinicaConfigDTO dto) {
        ClinicaConfig config = configRepository.findByChave(dto.getChave())
                .orElseGet(() -> {
                    ClinicaConfig c = new ClinicaConfig();
                    c.setChave(dto.getChave());
                    return c;
                });
        config.setValor(dto.getValor());
        ClinicaConfig saved = configRepository.save(config);
        log.info("Saved config {} = {}", saved.getChave(), saved.getValor());
        return new ClinicaConfigDTO(saved.getChave(), saved.getValor());
    }
}
