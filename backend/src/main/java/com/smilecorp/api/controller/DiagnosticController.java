package com.smilecorp.api.controller;

import com.smilecorp.api.repository.AgendamentoRepository;
import com.smilecorp.api.repository.PacienteRepository;
import com.smilecorp.api.repository.ProfissionalRepository;
import com.smilecorp.api.repository.ProcedimentoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/diagnostic")
public class DiagnosticController {
    private static final Logger log = LoggerFactory.getLogger(DiagnosticController.class);

    private final AgendamentoRepository agendamentoRepository;
    private final PacienteRepository pacienteRepository;
    private final ProfissionalRepository profissionalRepository;
    private final ProcedimentoRepository procedimentoRepository;

    public DiagnosticController(AgendamentoRepository agendamentoRepository,
                              PacienteRepository pacienteRepository,
                              ProfissionalRepository profissionalRepository,
                              ProcedimentoRepository procedimentoRepository) {
        this.agendamentoRepository = agendamentoRepository;
        this.pacienteRepository = pacienteRepository;
        this.profissionalRepository = profissionalRepository;
        this.procedimentoRepository = procedimentoRepository;
    }

    @GetMapping("/counts/{orgId}")
    public ResponseEntity<Map<String, Object>> getCounts(@PathVariable String orgId) {
        Map<String, Object> result = new HashMap<>();
        
        long agendamentos = agendamentoRepository.findByOrganizacaoId(orgId).size();
        long pacientes = pacienteRepository.findByOrganizacaoId(orgId).size();
        long profissionais = profissionalRepository.findByOrganizacaoId(orgId).size();
        long procedimentos = procedimentoRepository.findByOrganizacaoId(orgId).size();
        
        result.put("organizationId", orgId);
        result.put("agendamentos", agendamentos);
        result.put("pacientes", pacientes);
        result.put("profissionais", profissionais);
        result.put("procedimentos", procedimentos);
        
        log.info("Diagnostic check for org {}: agendamentos={}, pacientes={}, profissionais={}, procedimentos={}", 
                 orgId, agendamentos, pacientes, profissionais, procedimentos);
        
        return ResponseEntity.ok(result);
    }
}
