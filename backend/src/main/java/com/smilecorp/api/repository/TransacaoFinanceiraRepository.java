package com.smilecorp.api.repository;

import com.smilecorp.api.entity.TransacaoFinanceira;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransacaoFinanceiraRepository extends JpaRepository<TransacaoFinanceira, UUID> {
    List<TransacaoFinanceira> findByOrganizacaoId(String organizacaoId);

    List<TransacaoFinanceira> findByOrganizacaoIdAndDataBetween(String organizacaoId, LocalDate inicio, LocalDate fim);

    List<TransacaoFinanceira> findByOrganizacaoIdAndTipo(String organizacaoId, String tipo);

    List<TransacaoFinanceira> findByOrganizacaoIdAndTipoAndDataBetween(String organizacaoId, String tipo, LocalDate inicio, LocalDate fim);

    List<TransacaoFinanceira> findByOrganizacaoIdAndStatus(String organizacaoId, String status);

    Optional<TransacaoFinanceira> findByOrganizacaoIdAndId(String organizacaoId, UUID id);

    List<TransacaoFinanceira> findByOrganizacaoIdAndContaFixaId(String organizacaoId, UUID contaFixaId);

    List<TransacaoFinanceira> findByOrganizacaoIdAndDescricaoContainingIgnoreCase(String organizacaoId, String descricao);
}
