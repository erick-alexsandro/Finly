package com.smilecorp.api.repository;

import com.smilecorp.api.entity.ProcedimentoCusto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProcedimentoCustoRepository extends JpaRepository<ProcedimentoCusto, Long> {

    List<ProcedimentoCusto> findByProcedimentoId(UUID procedimentoId);

    Optional<ProcedimentoCusto> findByProcedimentoIdAndTipo(UUID procedimentoId, String tipo);

    void deleteByProcedimentoId(UUID procedimentoId);
}
