package com.smilecorp.api.repository;

import com.smilecorp.api.entity.Prontuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProntuarioRepository extends JpaRepository<Prontuario, UUID> {

    List<Prontuario> findByOrganizacaoId(String organizacaoId);

    Optional<Prontuario> findByOrganizacaoIdAndId(String organizacaoId, UUID id);

    Optional<Prontuario> findByOrganizacaoIdAndAgendamentoId(String organizacaoId, UUID agendamentoId);

    List<Prontuario> findByOrganizacaoIdAndPacienteId(String organizacaoId, UUID pacienteId);

    boolean existsByOrganizacaoIdAndAgendamentoId(String organizacaoId, UUID agendamentoId);
}
