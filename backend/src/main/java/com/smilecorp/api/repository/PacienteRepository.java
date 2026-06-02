package com.smilecorp.api.repository;

import com.smilecorp.api.entity.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PacienteRepository extends JpaRepository<Paciente, UUID> {
    
    List<Paciente> findByOrganizacaoId(String organizacaoId);
    
    @Query("SELECT p FROM Paciente p WHERE p.organizacaoId = :organizacaoId AND LOWER(p.nome) LIKE LOWER(CONCAT('%', :nome, '%'))") 
    List<Paciente> findByOrganizacaoIdAndNomeContainingIgnoreCase(@Param("organizacaoId") String organizacaoId, @Param("nome") String nome);
    
    Optional<Paciente> findByOrganizacaoIdAndId(String organizacaoId, UUID id);
    
    Optional<Paciente> findByOrganizacaoIdAndCpf(String organizacaoId, String cpf);
    
    List<Paciente> findByOrganizacaoIdAndAtivoTrue(String organizacaoId);
}
