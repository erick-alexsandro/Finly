package com.smilecorp.api.service;

import com.smilecorp.api.dto.ClinicaConfigDTO;
import com.smilecorp.api.entity.ClinicaConfig;
import com.smilecorp.api.repository.ClinicaConfigRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClinicaConfigServiceTest {

    @Mock
    private ClinicaConfigRepository configRepository;

    @InjectMocks
    private ClinicaConfigService configService;

    @Captor
    private ArgumentCaptor<ClinicaConfig> configCaptor;

    private ClinicaConfig createConfig(String chave, String valor) {
        ClinicaConfig c = new ClinicaConfig();
        c.setChave(chave);
        c.setValor(valor);
        return c;
    }

    @Test
    void listarTodas_shouldReturnAllConfigs() {
        when(configRepository.findAll()).thenReturn(List.of(
                createConfig("hora_clinica_valor", "150.00"),
                createConfig("desconto_dinheiro", "10.00")
        ));

        List<ClinicaConfigDTO> result = configService.listarTodas();

        assertEquals(2, result.size());
        assertEquals("hora_clinica_valor", result.get(0).getChave());
        assertEquals("150.00", result.get(0).getValor());
        assertEquals("desconto_dinheiro", result.get(1).getChave());
    }

    @Test
    void listarTodas_shouldReturnEmptyListWhenNone() {
        when(configRepository.findAll()).thenReturn(List.of());

        List<ClinicaConfigDTO> result = configService.listarTodas();

        assertTrue(result.isEmpty());
    }

    @Test
    void obter_shouldReturnConfigWhenFound() {
        when(configRepository.findByChave("hora_clinica_valor"))
                .thenReturn(Optional.of(createConfig("hora_clinica_valor", "150.00")));

        ClinicaConfigDTO result = configService.obter("hora_clinica_valor");

        assertEquals("hora_clinica_valor", result.getChave());
        assertEquals("150.00", result.getValor());
    }

    @Test
    void obter_shouldThrowWhenNotFound() {
        when(configRepository.findByChave("nao_existe")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> configService.obter("nao_existe"));
    }

    @Test
    void getHoraClinicaValor_shouldReturnValueWhenConfigExists() {
        when(configRepository.findByChave("hora_clinica_valor"))
                .thenReturn(Optional.of(createConfig("hora_clinica_valor", "200.00")));

        BigDecimal result = configService.getHoraClinicaValor();

        assertEquals(0, new BigDecimal("200.00").compareTo(result));
    }

    @Test
    void getHoraClinicaValor_shouldReturnDefaultWhenConfigNotFound() {
        when(configRepository.findByChave("hora_clinica_valor")).thenReturn(Optional.empty());

        BigDecimal result = configService.getHoraClinicaValor();

        assertEquals(0, BigDecimal.valueOf(100).compareTo(result));
    }

    @Test
    void getHoraClinicaValor_shouldReturnDefaultWhenInvalidValue() {
        when(configRepository.findByChave("hora_clinica_valor"))
                .thenReturn(Optional.of(createConfig("hora_clinica_valor", "invalido")));

        BigDecimal result = configService.getHoraClinicaValor();

        assertEquals(0, BigDecimal.valueOf(100).compareTo(result));
    }

    @Test
    void salvar_shouldCreateNewConfig() {
        when(configRepository.findByChave("nova_chave")).thenReturn(Optional.empty());

        ClinicaConfig saved = createConfig("nova_chave", "500.00");
        when(configRepository.save(any(ClinicaConfig.class))).thenReturn(saved);

        ClinicaConfigDTO dto = new ClinicaConfigDTO("nova_chave", "500.00");
        ClinicaConfigDTO result = configService.salvar(dto);

        assertEquals("nova_chave", result.getChave());
        assertEquals("500.00", result.getValor());

        verify(configRepository).save(configCaptor.capture());
        ClinicaConfig captured = configCaptor.getValue();
        assertEquals("nova_chave", captured.getChave());
        assertEquals("500.00", captured.getValor());
    }

    @Test
    void salvar_shouldUpdateExistingConfig() {
        ClinicaConfig existing = createConfig("hora_clinica_valor", "100.00");
        when(configRepository.findByChave("hora_clinica_valor"))
                .thenReturn(Optional.of(existing));

        ClinicaConfig updated = createConfig("hora_clinica_valor", "250.00");
        when(configRepository.save(any(ClinicaConfig.class))).thenReturn(updated);

        ClinicaConfigDTO dto = new ClinicaConfigDTO("hora_clinica_valor", "250.00");
        ClinicaConfigDTO result = configService.salvar(dto);

        assertEquals("hora_clinica_valor", result.getChave());
        assertEquals("250.00", result.getValor());

        verify(configRepository).save(configCaptor.capture());
        assertEquals("250.00", configCaptor.getValue().getValor());
    }
}
