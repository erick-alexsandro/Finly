package com.smilecorp.api.repository;

import com.smilecorp.api.entity.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    List<Produto> findByOrganizacaoId(String organizacaoId);

    @Query("SELECT p FROM Produto p WHERE p.organizacaoId = :organizacaoId AND LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Produto> findByOrganizacaoIdAndNameContainingIgnoreCase(@Param("organizacaoId") String organizacaoId, @Param("name") String name);

    Optional<Produto> findByOrganizacaoIdAndId(String organizacaoId, Long id);

    List<Produto> findByOrganizacaoIdAndAtivoTrue(String organizacaoId);
}
