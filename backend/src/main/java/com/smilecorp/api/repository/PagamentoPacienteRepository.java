package com.smilecorp.api.repository;

import com.smilecorp.api.entity.PagamentoPaciente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PagamentoPacienteRepository extends JpaRepository<PagamentoPaciente, UUID> {

    List<PagamentoPaciente> findByOrganizacaoId(String organizacaoId);

    Optional<PagamentoPaciente> findByOrganizacaoIdAndId(String organizacaoId, UUID id);

    List<PagamentoPaciente> findByOrganizacaoIdAndPacienteId(String organizacaoId, UUID pacienteId);

    boolean existsByOrganizacaoIdAndAgendamentoId(String organizacaoId, UUID agendamentoId);
}
