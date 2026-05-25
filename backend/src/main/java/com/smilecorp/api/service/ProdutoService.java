package com.smilecorp.api.service;

import com.smilecorp.api.dto.ProdutosDTO;
import com.smilecorp.api.entity.MovimentoEstoque;
import com.smilecorp.api.entity.Produto;
import com.smilecorp.api.repository.ProdutoRepository;
import com.smilecorp.api.util.TenantContext;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProdutoService {
    private static final Logger log = LoggerFactory.getLogger(ProdutoService.class);

    private final ProdutoRepository produtoRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public ProdutoService(ProdutoRepository produtoRepository) {
        this.produtoRepository = produtoRepository;
    }

    public List<ProdutosDTO> listar(String name) {
        String orgId = TenantContext.getOrganizationId();
        log.debug("Listing produtos for organization: {}", orgId);

        List<Produto> items;
        if (name != null && !name.isEmpty()) {
            items = produtoRepository.findByOrganizacaoIdAndNameContainingIgnoreCase(orgId, name);
        } else {
            items = produtoRepository.findByOrganizacaoId(orgId);
        }

        return items.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ProdutosDTO obterPorId(Long id) {
        String orgId = TenantContext.getOrganizationId();
        Produto item = produtoRepository.findByOrganizacaoIdAndId(orgId, id)
                .orElseThrow(() -> new IllegalArgumentException("Produto not found with ID: " + id));
        return toDTO(item);
    }

    public ProdutosDTO criar(ProdutosDTO dto) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Creating new produto for organization: {}", orgId);

        Produto item = new Produto();
        item.setOrganizacaoId(orgId);
        item.setName(dto.getName());
        item.setUnit(dto.getUnit());
        item.setPrice(dto.getPrice());
        item.setMinStock(dto.getMinStock());
        item.setCurrentQuantity(dto.getQuantity());
        item.setAtivo(true);

        Produto saved = produtoRepository.save(item);

        Integer qtd = dto.getQuantity();
        if (qtd != null && qtd > 0) {
            registrarEntrada(saved.getId(), qtd, 0, "Estoque inicial");
        }

        return toDTO(saved);
    }

    public ProdutosDTO atualizar(Long id, ProdutosDTO dto) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Updating produto {} for organization: {}", id, orgId);

        Produto item = produtoRepository.findByOrganizacaoIdAndId(orgId, id)
                .orElseThrow(() -> new IllegalArgumentException("Produto not found with ID: " + id));

        Integer oldQty = item.getCurrentQuantity();

        if (dto.getName() != null) item.setName(dto.getName());
        if (dto.getUnit() != null) item.setUnit(dto.getUnit());
        if (dto.getPrice() != null) item.setPrice(dto.getPrice());
        if (dto.getMinStock() != null) item.setMinStock(dto.getMinStock());
        if (dto.getQuantity() != null) item.setCurrentQuantity(dto.getQuantity());

        Produto updated = produtoRepository.save(item);

        Integer newQty = dto.getQuantity();
        if (newQty != null && !newQty.equals(oldQty)) {
            int diff = newQty - oldQty;
            if (diff > 0) {
                registrarEntrada(id, diff, oldQty, "Renovação de estoque");
            } else {
                registrarSaida(id, -diff, oldQty, "Utilização de material");
            }
        }

        return toDTO(updated);
    }

    public ProdutosDTO reporEstoque(Long id, Integer quantidadeAdicional, BigDecimal precoCompra) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Restocking produto {} (org: {}): +{} units at R${}/unit",
                id, orgId, quantidadeAdicional, precoCompra);

        Produto item = produtoRepository.findByOrganizacaoIdAndId(orgId, id)
                .orElseThrow(() -> new IllegalArgumentException("Produto not found with ID: " + id));

        int currentQty = item.getCurrentQuantity();
        BigDecimal currentPrice = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
        int newQty = currentQty + quantidadeAdicional;

        BigDecimal weightedAvg = currentPrice.multiply(BigDecimal.valueOf(currentQty))
                .add(precoCompra.multiply(BigDecimal.valueOf(quantidadeAdicional)))
                .divide(BigDecimal.valueOf(newQty), 2, RoundingMode.HALF_UP);

        item.setCurrentQuantity(newQty);
        item.setPrice(weightedAvg);

        Produto updated = produtoRepository.save(item);

        registrarEntrada(id, quantidadeAdicional, currentQty, "Reposição de estoque", precoCompra);

        return toDTO(updated);
    }

    public void deletar(Long id) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Deleting produto {} for organization: {}", id, orgId);

        Produto item = produtoRepository.findByOrganizacaoIdAndId(orgId, id)
                .orElseThrow(() -> new IllegalArgumentException("Produto not found with ID: " + id));

        produtoRepository.delete(item);
    }

    public List<ProdutosDTO> listarMovimentos(Long produtoId) {
        String orgId = TenantContext.getOrganizationId();

        String jpql = "SELECT m FROM MovimentoEstoque m WHERE m.organizacaoId = :orgId";
        if (produtoId != null) {
            jpql += " AND m.produtoId = :produtoId";
        }
        jpql += " ORDER BY m.criadoEm DESC";

        TypedQuery<MovimentoEstoque> query = entityManager.createQuery(jpql, MovimentoEstoque.class);
        query.setParameter("orgId", orgId);
        if (produtoId != null) {
            query.setParameter("produtoId", produtoId);
        }

        return query.getResultList().stream()
                .map(this::toMovimentoDTO)
                .collect(Collectors.toList());
    }

    public void registrarEntrada(Long produtoId, Integer quantidade, Integer quantidadeAnterior,
                                  String descricao) {
        registrarMovimento(produtoId, "ENTRY", quantidade, quantidadeAnterior, descricao, null);
    }

    public void registrarEntrada(Long produtoId, Integer quantidade, Integer quantidadeAnterior,
                                  String descricao, BigDecimal precoCompra) {
        registrarMovimento(produtoId, "ENTRY", quantidade, quantidadeAnterior, descricao, precoCompra);
    }

    public void registrarSaida(Long produtoId, Integer quantidade, Integer quantidadeAnterior, String descricao) {
        registrarMovimento(produtoId, "EXIT", quantidade, quantidadeAnterior, descricao, null);
    }

    private void registrarMovimento(Long produtoId, String tipo, Integer quantidade,
                                    Integer quantidadeAnterior, String descricao,
                                    BigDecimal precoCompra) {
        String orgId = TenantContext.getOrganizationId();
        log.info("Recording {} movement for produto {} (org: {}): qty {}",
                tipo, produtoId, orgId, quantidade);

        MovimentoEstoque mov = new MovimentoEstoque();
        mov.setProdutoId(produtoId);
        mov.setTipo(tipo);
        mov.setQuantidade(quantidade);
        mov.setQuantidadeAnterior(quantidadeAnterior);
        mov.setQuantidadeNova(quantidadeAnterior + (tipo.equals("ENTRY") ? quantidade : -quantidade));
        mov.setPrecoCompra(precoCompra);
        mov.setDescricao(descricao);
        mov.setOrganizacaoId(orgId);

        entityManager.persist(mov);
    }

    private ProdutosDTO toDTO(Produto item) {
        return new ProdutosDTO(
                item.getId(),
                item.getName(),
                item.getUnit(),
                item.getPrice(),
                item.getCurrentQuantity(),
                item.getMinStock(),
                item.getCriadoEm(),
                item.getAtualizadoEm()
        );
    }

    private ProdutosDTO toMovimentoDTO(MovimentoEstoque mov) {
        String produtoNome = entityManager.createQuery(
                "SELECT p.name FROM Produto p WHERE p.id = :id", String.class)
                .setParameter("id", mov.getProdutoId())
                .getResultStream()
                .findFirst()
                .orElse(null);

        return new ProdutosDTO(
                mov.getId(),
                mov.getProdutoId(),
                produtoNome,
                mov.getTipo(),
                mov.getQuantidade(),
                mov.getQuantidadeAnterior(),
                mov.getQuantidadeNova(),
                mov.getPrecoCompra(),
                mov.getDescricao(),
                mov.getCriadoEm()
        );
    }
}
