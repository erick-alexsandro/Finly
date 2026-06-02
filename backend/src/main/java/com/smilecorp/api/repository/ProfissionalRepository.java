package com.smilecorp.api.repository;

import com.smilecorp.api.entity.Profissional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfissionalRepository extends JpaRepository<Profissional, Long> {
    
    List<Profissional> findByOrganizacaoId(String organizacaoId);
    
    @Query("SELECT p FROM Profissional p WHERE p.organizacaoId = :organizacaoId AND LOWER(p.nome) LIKE LOWER(CONCAT('%', :nome, '%'))")
    List<Profissional> findByOrganizacaoIdAndNomeContainingIgnoreCase(@Param("organizacaoId") String organizacaoId, @Param("nome") String nome);
    
    Optional<Profissional> findByOrganizacaoIdAndId(String organizacaoId, UUID id);
    
    List<Profissional> findByOrganizacaoIdAndAtivoTrue(String organizacaoId);
}
