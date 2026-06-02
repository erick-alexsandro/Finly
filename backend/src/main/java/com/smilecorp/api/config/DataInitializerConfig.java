package com.smilecorp.api.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smilecorp.api.entity.Paciente;
import com.smilecorp.api.entity.Profissional;
import com.smilecorp.api.entity.Procedimento;
import com.smilecorp.api.entity.Agendamento;
import com.smilecorp.api.repository.PacienteRepository;
import com.smilecorp.api.repository.ProfissionalRepository;
import com.smilecorp.api.repository.ProcedimentoRepository;
import com.smilecorp.api.repository.AgendamentoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

@Configuration
public class DataInitializerConfig {
    private static final Logger log = LoggerFactory.getLogger(DataInitializerConfig.class);

    @Bean
    public CommandLineRunner initializeH2Database(
            PacienteRepository pacienteRepository,
            ProfissionalRepository profissionalRepository,
            ProcedimentoRepository procedimentoRepository,
            AgendamentoRepository agendamentoRepository) {
        return args -> {
            try {
                // Only load data if using H2 (development)
                String dbUrl = System.getenv("DATABASE_URL");
                if (dbUrl == null) {
                    dbUrl = System.getProperty("spring.datasource.url", "jdbc:h2:mem:smilecorp");
                }

                // For Neon/prod databases, check if organization has data
                if (!dbUrl.contains("h2:mem") && !dbUrl.contains("h2:tcp")) {
                    log.info("[DataInitializer] Using production database (Neon)");
                    // Initialize test data for specific clinic if it's empty
                    initializeNeonTestData(pacienteRepository, profissionalRepository, 
                                          procedimentoRepository, agendamentoRepository);
                    return;
                }

                ObjectMapper mapper = new ObjectMapper();

                // Load Pacientes
                try {
                    InputStream pacientesStream = new ClassPathResource("data/paciente.json").getInputStream();
                    Paciente[] pacientes = mapper.readValue(pacientesStream, Paciente[].class);
                    pacienteRepository.saveAll(Arrays.asList(pacientes));
                    log.info("[DataInitializer] Loaded {} pacientes", pacientes.length);
                } catch (Exception e) {
                    log.warn("[DataInitializer] Could not load pacientes: {}", e.getMessage());
                }

                // Load Profissionais
                try {
                    InputStream profissionaisStream = new ClassPathResource("data/profissionais.json").getInputStream();
                    Profissional[] profissionais = mapper.readValue(profissionaisStream, Profissional[].class);
                    profissionalRepository.saveAll(Arrays.asList(profissionais));
                    log.info("[DataInitializer] Loaded {} profissionais", profissionais.length);
                } catch (Exception e) {
                    log.warn("[DataInitializer] Could not load profissionais: {}", e.getMessage());
                }

                // Load Procedimentos
                try {
                    InputStream procedimentosStream = new ClassPathResource("data/procedimento.json").getInputStream();
                    Procedimento[] procedimentos = mapper.readValue(procedimentosStream, Procedimento[].class);
                    procedimentoRepository.saveAll(Arrays.asList(procedimentos));
                    log.info("[DataInitializer] Loaded {} procedimentos", procedimentos.length);
                } catch (Exception e) {
                    log.warn("[DataInitializer] Could not load procedimentos: {}", e.getMessage());
                }

                // Load Agendamentos
                try {
                    InputStream agendamentosStream = new ClassPathResource("data/agendamento.json").getInputStream();
                    Agendamento[] agendamentos = mapper.readValue(agendamentosStream, Agendamento[].class);
                    agendamentoRepository.saveAll(Arrays.asList(agendamentos));
                    log.info("[DataInitializer] Loaded {} agendamentos", agendamentos.length);
                } catch (Exception e) {
                    log.warn("[DataInitializer] Could not load agendamentos: {}", e.getMessage());
                }

                log.info("[DataInitializer] Database initialization completed");

            } catch (Exception e) {
                log.error("[DataInitializer] Error initializing database", e);
            }
        };
    }

    private void initializeNeonTestData(
            PacienteRepository pacienteRepository,
            ProfissionalRepository profissionalRepository,
            ProcedimentoRepository procedimentoRepository,
            AgendamentoRepository agendamentoRepository) {
        
        String orgId = "6fd8b547-393d-4a2c-986b-31fbf998a4b9"; // The clinic from the user
        
        // Check if organization already has data
        if (!pacienteRepository.findByOrganizacaoId(orgId).isEmpty()) {
            log.info("[DataInitializer] Organization {} already has data, skipping initialization", orgId);
            return;
        }
        
        try {
            log.info("[DataInitializer] Initializing test data for organization: {}", orgId);
            
            java.time.LocalDate now = java.time.LocalDate.now();
            java.time.LocalTime time9am = java.time.LocalTime.of(9, 0);
            java.time.LocalTime time10am = java.time.LocalTime.of(10, 0);
            java.time.LocalTime time2pm = java.time.LocalTime.of(14, 0);
            java.time.LocalTime time3pm = java.time.LocalTime.of(15, 0);
            
            // Create patients
            Paciente paciente1 = new Paciente();
            paciente1.setOrganizacaoId(orgId);
            paciente1.setNome("João Silva");
            paciente1.setEmail("joao@example.com");
            paciente1.setTelefone("11987654321");
            paciente1.setDataNascimento("1990-05-15");
            paciente1.setAtivo(true);
            paciente1 = pacienteRepository.save(paciente1);
            
            Paciente paciente2 = new Paciente();
            paciente2.setOrganizacaoId(orgId);
            paciente2.setNome("Maria Santos");
            paciente2.setEmail("maria@example.com");
            paciente2.setTelefone("11912345678");
            paciente2.setDataNascimento("1985-03-20");
            paciente2.setAtivo(true);
            paciente2 = pacienteRepository.save(paciente2);
            log.info("[DataInitializer] Created 2 patients");
            
            // Create professionals
            Profissional prof1 = new Profissional();
            prof1.setOrganizacaoId(orgId);
            prof1.setNome("Dr. Carlos Oliveira");
            prof1.setEspecialidade("Dentista");
            prof1.setNumeroRegistro("CRO-123456");
            prof1.setTelefone("11988776655");
            prof1.setEmail("carlos@example.com");
            prof1.setAtivo(true);
            prof1 = profissionalRepository.save(prof1);
            
            Profissional prof2 = new Profissional();
            prof2.setOrganizacaoId(orgId);
            prof2.setNome("Dra. Beatriz Costa");
            prof2.setEspecialidade("Higienista");
            prof2.setNumeroRegistro("CRO-789012");
            prof2.setTelefone("11977665544");
            prof2.setEmail("beatriz@example.com");
            prof2.setAtivo(true);
            prof2 = profissionalRepository.save(prof2);
            log.info("[DataInitializer] Created 2 professionals");
            
            // Create procedures
            Procedimento proc1 = new Procedimento();
            proc1.setOrganizacaoId(orgId);
            proc1.setNome("Limpeza e Polimento");
            proc1.setDescricao("Limpeza profissional e polimento dentário");
            proc1.setDuracaoMinutos(30);
            proc1.setPreco(new BigDecimal("150.00"));
            proc1.setAtivo(true);
            proc1 = procedimentoRepository.save(proc1);
            
            Procedimento proc2 = new Procedimento();
            proc2.setOrganizacaoId(orgId);
            proc2.setNome("Restauração Simples");
            proc2.setDescricao("Restauração de cárie simples");
            proc2.setDuracaoMinutos(60);
            proc2.setPreco(new BigDecimal("300.00"));
            proc2.setAtivo(true);
            proc2 = procedimentoRepository.save(proc2);
            log.info("[DataInitializer] Created 2 procedures");
            
            // Create appointments
            Agendamento appt1 = new Agendamento();
            appt1.setOrganizacaoId(orgId);
            appt1.setData(now.plusDays(1).atTime(9, 0));
            appt1.setHoraInicio("09:00");
            appt1.setHoraFim("09:30");
            appt1.setPacienteId(paciente1.getId());
            appt1.setProfissionalId(prof1.getId());
            appt1.setStatus("agendado");
            appt1.setObservacoes("Revisão regular");
            appt1.setConfirmado(false);
            agendamentoRepository.save(appt1);
            
            Agendamento appt2 = new Agendamento();
            appt2.setOrganizacaoId(orgId);
            appt2.setData(now.plusDays(2).atTime(14, 0));
            appt2.setHoraInicio("14:00");
            appt2.setHoraFim("15:00");
            appt2.setPacienteId(paciente2.getId());
            appt2.setProfissionalId(prof1.getId());
            appt2.setStatus("agendado");
            appt2.setObservacoes("Restauração de dente");
            appt2.setConfirmado(false);
            agendamentoRepository.save(appt2);
            
            Agendamento appt3 = new Agendamento();
            appt3.setOrganizacaoId(orgId);
            appt3.setData(now.plusDays(3).atTime(10, 0));
            appt3.setHoraInicio("10:00");
            appt3.setHoraFim("11:00");
            appt3.setPacienteId(paciente1.getId());
            appt3.setProfissionalId(prof2.getId());
            appt3.setStatus("agendado");
            appt3.setObservacoes("Limpeza dental com higienista");
            appt3.setConfirmado(false);
            agendamentoRepository.save(appt3);
            log.info("[DataInitializer] Created 3 appointments");
            
            log.info("[DataInitializer] Test data initialization completed for organization: {}", orgId);
        } catch (Exception e) {
            log.error("[DataInitializer] Error initializing Neon test data", e);
        }
    }
}

