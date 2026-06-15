package com.smilecorp.api.repository;

import com.smilecorp.api.entity.ContaFixa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContaFixaRepository extends JpaRepository<ContaFixa, UUID> {
    List<ContaFixa> findByOrganizacaoId(String organizacaoId);

    List<ContaFixa> findByOrganizacaoIdAndStatus(String organizacaoId, String status);

    Optional<ContaFixa> findByOrganizacaoIdAndId(String organizacaoId, UUID id);

    List<ContaFixa> findByOrganizacaoIdAndTipo(String organizacaoId, String tipo);

    List<ContaFixa> findByOrganizacaoIdAndDescricaoContainingIgnoreCase(String organizacaoId, String descricao);
}
