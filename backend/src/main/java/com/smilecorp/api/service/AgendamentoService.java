package com.smilecorp.api.service;

import com.smilecorp.api.dto.AgendamentoDTO;
import com.smilecorp.api.entity.Agendamento;
import com.smilecorp.api.entity.MaterialAgendamento;
import com.smilecorp.api.entity.MovimentoEstoque;
import com.smilecorp.api.entity.Paciente;
import com.smilecorp.api.entity.ProcedimentoMaterial;
import com.smilecorp.api.entity.Produto;
import com.smilecorp.api.entity.Profissional;
import com.smilecorp.api.repository.AgendamentoRepository;
import com.smilecorp.api.repository.PacienteRepository;
import com.smilecorp.api.repository.ProcedimentoMaterialRepository;
import com.smilecorp.api.repository.ProdutoRepository;
import com.smilecorp.api.repository.ProfissionalRepository;
import com.smilecorp.api.util.TenantContext;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class AgendamentoService {
    private static final Logger log = LoggerFactory.getLogger(AgendamentoService.class);

    private final AgendamentoRepository agendamentoRepository;
    private final PacienteRepository pacienteRepository;
    private final ProfissionalRepository profissionalRepository;
    private final ProcedimentoMaterialRepository procedimentoMaterialRepository;
    private final ProdutoRepository produtoRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public AgendamentoService(AgendamentoRepository agendamentoRepository, 
                             PacienteRepository pacienteRepository,
                             ProfissionalRepository profissionalRepository,
                             ProcedimentoMaterialRepository procedimentoMaterialRepository,
                             ProdutoRepository produtoRepository) {
        this.agendamentoRepository = agendamentoRepository;
        this.pacienteRepository = pacienteRepository;
        this.profissionalRepository = profissionalRepository;
        this.procedimentoMaterialRepository = procedimentoMaterialRepository;
        this.produtoRepository = produtoRepository;
    }

    public List<AgendamentoDTO> listar(String profissionalId, String pacienteId, LocalDateTime startDate, LocalDateTime endDate) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Organization ID from TenantContext: {}", orgId);
        log.debug("Listing agendamentos for organization: {} with filters - prof: {}, patient: {}, dates: {} to {}", 
                 orgId, profissionalId, pacienteId, startDate, endDate);

        List<Agendamento> agendamentos;

        if (startDate != null && endDate != null && profissionalId != null) {
            UUID profId = UUID.fromString(profissionalId);
            agendamentos = agendamentoRepository.findByOrganizacaoIdAndProfissionalIdAndDataBetween(orgId, profId, startDate, endDate);
            log.info("Query result count (prof + dates): {}", agendamentos.size());
        } else if (pacienteId != null) {
            UUID patId = UUID.fromString(pacienteId);
            agendamentos = agendamentoRepository.findByOrganizacaoIdAndPacienteId(orgId, patId);
            log.info("Query result count (paciente): {}", agendamentos.size());
        } else if (startDate != null && endDate != null) {
            agendamentos = agendamentoRepository.findByOrganizacaoIdAndDataBetween(orgId, startDate, endDate);
            log.info("Query result count (dates only): {}", agendamentos.size());
        } else {
            agendamentos = agendamentoRepository.findByOrganizacaoId(orgId);
            log.info("Query result count (all for org): {}", agendamentos.size());
        }

        return agendamentos.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public AgendamentoDTO obterPorId(String id) {
        String orgId = TenantContext.getOrganizationId();
        Agendamento agendamento = agendamentoRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id)) // Use UUID.fromString
                .orElseThrow(() -> new IllegalArgumentException("Agendamento not found with ID: " + id));
        return toDTO(agendamento);
    }

    /**
     * Creates a new appointment. If the patient doesn't exist, it will be auto-created.
     * 
     * @param dto The appointment DTO containing appointment and patient details
     * @return The created appointment DTO
     * @throws IllegalArgumentException if pacienteNome is empty or professional doesn't exist
     */
    public AgendamentoDTO criar(AgendamentoDTO dto) {
    String orgId = TenantContext.getOrganizationId();
    log.info("Creating new agendamento for organization: {}", orgId);
    
    if (dto.getPacienteNome() == null || dto.getPacienteNome().trim().isEmpty()) {
        throw new IllegalArgumentException("Patient name is required");
    }

    Paciente paciente = null;
    
    if (dto.getPacienteId() != null && !dto.getPacienteId().isEmpty() && !dto.getPacienteId().equals("null")) {
        try { 
            UUID patientId = UUID.fromString(dto.getPacienteId());
            paciente = pacienteRepository.findByOrganizacaoIdAndId(orgId, patientId)
                    .orElse(null);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid patient ID format: {}", dto.getPacienteId());
            paciente = null;
        }
    }
    
    if (paciente == null) {
        log.info("Auto-creating patient: {}", dto.getPacienteNome());
        paciente = new Paciente();
        paciente.setOrganizacaoId(orgId);
        paciente.setNome(dto.getPacienteNome().trim());
        if (dto.getEmail() != null && !dto.getEmail().isEmpty()) {
            paciente.setEmail(dto.getEmail().trim());
        }
        if (dto.getTelefone() != null && !dto.getTelefone().isEmpty()) {
            paciente.setTelefone(dto.getTelefone().trim());
        }
        paciente.setAtivo(true);
        paciente = pacienteRepository.save(paciente);
        log.info("Created new patient with ID: {}", paciente.getId());
    }

    Profissional profissional = profissionalRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(dto.getProfissionalId()))
            .orElseThrow(() -> new IllegalArgumentException("Profissional not found: " + dto.getProfissionalId()));

    Agendamento agendamento = new Agendamento();
    agendamento.setOrganizacaoId(orgId);
    agendamento.setData(dto.getData());
    agendamento.setHoraInicio(dto.getHoraInicio());
    agendamento.setHoraFim(dto.getHoraFim());
    agendamento.setPacienteId(paciente.getId());
    agendamento.setProfissionalId(UUID.fromString(dto.getProfissionalId()));
    agendamento.setStatus(dto.getStatus() != null ? dto.getStatus() : "agendado");
    agendamento.setProcedimentosIds(dto.getProcedimentosIds());
    agendamento.setMateriais(dto.getMateriais());
    agendamento.setObservacoes(dto.getObservacoes());
    agendamento.setConfirmado(dto.getConfirmado() != null ? dto.getConfirmado() : false);
    agendamento.setPaciente(paciente);
    agendamento.setProfissional(profissional);

    Agendamento saved = agendamentoRepository.save(agendamento);
    log.info("Created appointment with ID: {}", saved.getId());

    if (dto.getMateriais() != null && !dto.getMateriais().isEmpty()) {
        Map<Long, Integer> materiaisQuantidades = calcularMateriaisQuantidades(orgId, dto.getProcedimentosIds(), dto.getMateriais());
        aplicarDeducaoEstoque(orgId, materiaisQuantidades, false);
    } else if (dto.getProcedimentosIds() != null && !dto.getProcedimentosIds().isEmpty()) {
        // fallback: calculate from procedures if no custom materials provided
        Map<Long, Integer> materiaisQuantidades = calcularMateriaisQuantidades(orgId, dto.getProcedimentosIds(), null);
        aplicarDeducaoEstoque(orgId, materiaisQuantidades, false);
    }

    return toDTO(saved);
}

    public AgendamentoDTO atualizar(String id, AgendamentoDTO dto) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Updating agendamento {} for organization: {}", id, orgId);

        Agendamento agendamento = agendamentoRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id)) 
                .orElseThrow(() -> new IllegalArgumentException("Agendamento not found with ID: " + id));

        // Capture old state for stock recalculation
        List<String> oldProcIds = agendamento.getProcedimentosIds() != null ? agendamento.getProcedimentosIds() : new java.util.ArrayList<>();
        List<MaterialAgendamento> oldMats = agendamento.getMateriais() != null ? agendamento.getMateriais() : new java.util.ArrayList<>();

        if (dto.getData() != null) agendamento.setData(dto.getData());
        if (dto.getHoraInicio() != null) agendamento.setHoraInicio(dto.getHoraInicio());
        if (dto.getHoraFim() != null) agendamento.setHoraFim(dto.getHoraFim());
        if (dto.getStatus() != null) agendamento.setStatus(dto.getStatus());

        if (dto.getProcedimentosIds() != null) agendamento.setProcedimentosIds(dto.getProcedimentosIds());
        if (dto.getMateriais() != null) agendamento.setMateriais(dto.getMateriais());

        if (dto.getObservacoes() != null) agendamento.setObservacoes(dto.getObservacoes());
        if (dto.getConfirmado() != null) agendamento.setConfirmado(dto.getConfirmado());

        // If patient or professional ID changed, validate they exist
        if (dto.getPacienteId() != null && !dto.getPacienteId().equals(agendamento.getPacienteId().toString())) { 
            UUID newPacienteId;
            try {
                newPacienteId = UUID.fromString(dto.getPacienteId());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid Patient ID format: " + dto.getPacienteId(), e);
            }
            Paciente paciente = pacienteRepository.findByOrganizacaoIdAndId(orgId, newPacienteId)
                    .orElseThrow(() -> new IllegalArgumentException("Paciente not found with ID: " + dto.getPacienteId()));
            agendamento.setPacienteId(newPacienteId); 
            agendamento.setPaciente(paciente);
        }

        if (dto.getProfissionalId() != null && !dto.getProfissionalId().equals(agendamento.getProfissionalId().toString())) {
            UUID newProfissionalId;
            try { newProfissionalId = UUID.fromString(dto.getProfissionalId()); } catch (IllegalArgumentException e) { throw new IllegalArgumentException("Invalid Professional ID format: " + dto.getProfissionalId(), e); }
            Profissional profissional = profissionalRepository.findByOrganizacaoIdAndId(orgId, newProfissionalId)
                    .orElseThrow(() -> new IllegalArgumentException("Profissional not found: " + dto.getProfissionalId()));
            agendamento.setProfissionalId(newProfissionalId); 
            agendamento.setProfissional(profissional);
        }

        Agendamento updated = agendamentoRepository.save(agendamento);

        // Recalculate stock if procedures or materials changed
        List<String> newProcIds = updated.getProcedimentosIds() != null ? updated.getProcedimentosIds() : new java.util.ArrayList<>();
        List<MaterialAgendamento> newMats = updated.getMateriais() != null ? updated.getMateriais() : new java.util.ArrayList<>();
        boolean procChanged = !oldProcIds.equals(newProcIds);
        boolean matChanged = !oldMats.equals(newMats);
        if (procChanged || matChanged) {
            Map<Long, Integer> oldQuantidades = calcularMateriaisQuantidades(orgId, oldProcIds, oldMats);
            Map<Long, Integer> newQuantidades = calcularMateriaisQuantidades(orgId, newProcIds, newMats);

            // Revert old deduction, then apply new deduction
            aplicarDeducaoEstoque(orgId, oldQuantidades, true);
            aplicarDeducaoEstoque(orgId, newQuantidades, false);
        }

        return toDTO(updated);
    }

    public void deletar(String id) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Deleting agendamento {} for organization: {}", id, orgId);

        Agendamento agendamento = agendamentoRepository.findByOrganizacaoIdAndId(orgId, UUID.fromString(id))
                .orElseThrow(() -> new IllegalArgumentException("Agendamento not found with ID: " + id));

        // Revert stock before deleting
        List<String> procIds = agendamento.getProcedimentosIds();
        List<MaterialAgendamento> mats = agendamento.getMateriais();
        if ((mats != null && !mats.isEmpty()) || (procIds != null && !procIds.isEmpty())) {
            Map<Long, Integer> quantidades = calcularMateriaisQuantidades(orgId, procIds, mats);
            aplicarDeducaoEstoque(orgId, quantidades, true);
        }

        agendamentoRepository.delete(agendamento);
    }

    private Map<Long, Integer> calcularMateriaisQuantidades(String orgId, List<String> procedimentosIds, List<MaterialAgendamento> materiaisList) {
        Map<Long, Integer> materialQuantidades = new HashMap<>();

        if (materiaisList != null && !materiaisList.isEmpty()) {
            // Use custom quantities from the appointment's material list
            for (MaterialAgendamento m : materiaisList) {
                if (m.getQuantidade() != null && m.getQuantidade() > 0) {
                    materialQuantidades.merge(m.getProdutoId(), m.getQuantidade(), Integer::sum);
                }
            }
        } else if (procedimentosIds != null) {
            // fallback: calculate from procedure-default materials
            for (String procIdStr : procedimentosIds) {
                UUID procId;
                try {
                    procId = UUID.fromString(procIdStr);
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid procedure ID format: {}", procIdStr);
                    continue;
                }

                List<ProcedimentoMaterial> materiais = procedimentoMaterialRepository.findByProcedimentoId(procId);
                for (ProcedimentoMaterial pm : materiais) {
                    materialQuantidades.merge(pm.getMaterial().getId(), pm.getQuantidade(), Integer::sum);
                }
            }
        }

        return materialQuantidades;
    }

    private void aplicarDeducaoEstoque(String orgId, Map<Long, Integer> materiais, boolean reverter) {
        int multiplier = reverter ? 1 : -1;

        for (Map.Entry<Long, Integer> entry : materiais.entrySet()) {
            Long produtoId = entry.getKey();
            Integer quantidade = entry.getValue();

            Produto produto = produtoRepository.findByOrganizacaoIdAndId(orgId, produtoId).orElse(null);
            if (produto == null) {
                log.warn("Product {} not found for stock adjustment", produtoId);
                continue;
            }

            Integer currentQty = produto.getCurrentQuantity() != null ? produto.getCurrentQuantity() : 0;
            Integer newQty = currentQty + (quantidade * multiplier);
            produto.setCurrentQuantity(Math.max(newQty, 0));
            produtoRepository.save(produto);

            String tipo = reverter ? "ENTRY" : "EXIT";
            String descricao = reverter
                    ? "Devolução por exclusão/edição de agendamento"
                    : "Consumo por agendamento";

            registrarMovimento(produtoId, orgId, quantidade, currentQty, tipo, descricao);
        }

        log.info("Stock {} for {} materials", reverter ? "returned" : "deducted", materiais.size());
    }

    private void registrarMovimento(Long produtoId, String orgId, Integer quantidade,
                                     Integer quantidadeAnterior, String tipo, String descricao) {
        MovimentoEstoque mov = new MovimentoEstoque();
        mov.setProdutoId(produtoId);
        mov.setTipo(tipo);
        mov.setQuantidade(quantidade);
        mov.setQuantidadeAnterior(quantidadeAnterior);
        mov.setQuantidadeNova(tipo.equals("EXIT")
                ? Math.max(quantidadeAnterior - quantidade, 0)
                : quantidadeAnterior + quantidade);
        mov.setDescricao(descricao);
        mov.setOrganizacaoId(orgId);
        entityManager.persist(mov);
    }

    private AgendamentoDTO toDTO(Agendamento agendamento) {
        return new AgendamentoDTO(
                agendamento.getId() != null ? agendamento.getId().toString() : null,
                agendamento.getData(),
                agendamento.getHoraInicio(),
                agendamento.getHoraFim(),
                agendamento.getPacienteId() != null ? agendamento.getPacienteId().toString() : null, 
                agendamento.getPaciente() != null ? agendamento.getPaciente().getNome() : null,
                agendamento.getProfissionalId() != null ? agendamento.getProfissionalId().toString() : null, 
                agendamento.getProfissional() != null ? agendamento.getProfissional().getNome() : null,
                agendamento.getStatus(),
                agendamento.getProcedimentosIds(),
                agendamento.getMateriais(),
                agendamento.getObservacoes(),
                agendamento.getConfirmado(),
                agendamento.getCriadoEm(),
                agendamento.getAtualizadoEm()
        );
    }
}