package com.smilecorp.api.repository;

import com.smilecorp.api.entity.Procedimento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProcedimentoRepository extends JpaRepository<Procedimento, UUID> {
    
    List<Procedimento> findByOrganizacaoId(String organizacaoId);
    
    @Query("SELECT p FROM Procedimento p WHERE p.organizacaoId = :organizacaoId AND LOWER(p.nome) LIKE LOWER(CONCAT('%', :nome, '%'))")  
    List<Procedimento> findByOrganizacaoIdAndNomeContainingIgnoreCase(@Param("organizacaoId") String organizacaoId, @Param("nome") String nome);
    
    Optional<Procedimento> findByOrganizacaoIdAndId(String organizacaoId, UUID id);
    
    List<Procedimento> findByOrganizacaoIdAndAtivoTrue(String organizacaoId);
}
