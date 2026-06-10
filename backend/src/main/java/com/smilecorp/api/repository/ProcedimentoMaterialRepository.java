package com.smilecorp.api.repository;

import com.smilecorp.api.entity.ProcedimentoMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProcedimentoMaterialRepository extends JpaRepository<ProcedimentoMaterial, Long> {

    List<ProcedimentoMaterial> findByProcedimentoId(UUID procedimentoId);

    void deleteByProcedimentoId(UUID procedimentoId);
}
