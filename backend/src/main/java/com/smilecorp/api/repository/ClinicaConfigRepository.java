package com.smilecorp.api.repository;

import com.smilecorp.api.entity.ClinicaConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClinicaConfigRepository extends JpaRepository<ClinicaConfig, String> {
    Optional<ClinicaConfig> findByChave(String chave);
}
