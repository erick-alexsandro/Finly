package com.smilecorp.api.repository;

import com.smilecorp.api.entity.Fornecedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FornecedorRepository extends JpaRepository<Fornecedor, UUID> {
    List<Fornecedor> findByOrganizacaoId(String organizacaoId);

    List<Fornecedor> findByOrganizacaoIdAndNomeContainingIgnoreCase(String organizacaoId, String nome);

    Optional<Fornecedor> findByOrganizacaoIdAndId(String organizacaoId, UUID id);

    List<Fornecedor> findByOrganizacaoIdAndStatus(String organizacaoId, String status);

    Optional<Fornecedor> findByOrganizacaoIdAndCnpjCpf(String organizacaoId, String cnpjCpf);
}
