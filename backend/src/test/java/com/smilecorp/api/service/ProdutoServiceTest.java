package com.smilecorp.api.service;

import com.smilecorp.api.dto.ProdutosDTO;
import com.smilecorp.api.entity.MovimentoEstoque;
import com.smilecorp.api.entity.Produto;
import com.smilecorp.api.repository.ProdutoRepository;
import com.smilecorp.api.util.TenantContext;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProdutoServiceTest {

    private static final String ORG_ID = "test-org-id";

    @Mock
    private ProdutoRepository produtoRepository;

    @Mock
    private EntityManager entityManager;

    private ProdutoService produtoService;

    @Captor
    private ArgumentCaptor<Produto> produtoCaptor;

    @BeforeEach
    void setUp() throws Exception {
        TenantContext.setOrganizationId(ORG_ID);
        produtoService = new ProdutoService(produtoRepository);
        var field = ProdutoService.class.getDeclaredField("entityManager");
        field.setAccessible(true);
        field.set(produtoService, entityManager);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private Produto createProduto(Long id, String name, String unit, BigDecimal price,
                                   int qty, int minStock) {
        Produto p = new Produto();
        p.setId(id);
        p.setOrganizacaoId(ORG_ID);
        p.setName(name);
        p.setUnit(unit);
        p.setPrice(price);
        p.setCurrentQuantity(qty);
        p.setMinStock(minStock);
        p.setAtivo(true);
        p.setCriadoEm(LocalDateTime.now());
        p.setAtualizadoEm(LocalDateTime.now());
        return p;
    }

    private ProdutosDTO createDTO(String name, String unit, BigDecimal price,
                                   Integer qty, Integer minStock) {
        ProdutosDTO dto = new ProdutosDTO();
        dto.setName(name);
        dto.setUnit(unit);
        dto.setPrice(price);
        dto.setQuantity(qty);
        dto.setMinStock(minStock);
        return dto;
    }

    // --- listar ---

    @Test
    void listar_shouldReturnAllWhenNameIsNull() {
        when(produtoRepository.findByOrganizacaoId(ORG_ID))
                .thenReturn(List.of(
                        createProduto(1L, "Resina", "Unidade", BigDecimal.valueOf(45), 10, 5),
                        createProduto(2L, "Cimento", "Kg", BigDecimal.valueOf(8), 50, 10)
                ));

        List<ProdutosDTO> result = produtoService.listar(null);

        assertEquals(2, result.size());
        assertEquals("Resina", result.get(0).getName());
        assertEquals("Cimento", result.get(1).getName());
        verify(produtoRepository).findByOrganizacaoId(ORG_ID);
    }

    @Test
    void listar_shouldFilterByNameWhenProvided() {
        when(produtoRepository.findByOrganizacaoIdAndNameContainingIgnoreCase(ORG_ID, "res"))
                .thenReturn(List.of(
                        createProduto(1L, "Resina", "Unidade", BigDecimal.valueOf(45), 10, 5)
                ));

        List<ProdutosDTO> result = produtoService.listar("res");

        assertEquals(1, result.size());
        assertEquals("Resina", result.get(0).getName());
        verify(produtoRepository).findByOrganizacaoIdAndNameContainingIgnoreCase(ORG_ID, "res");
    }

    // --- obterPorId ---

    @Test
    void obterPorId_shouldReturnWhenFound() {
        when(produtoRepository.findByOrganizacaoIdAndId(ORG_ID, 1L))
                .thenReturn(Optional.of(
                        createProduto(1L, "Resina", "Unidade", BigDecimal.valueOf(45), 10, 5)));

        ProdutosDTO result = produtoService.obterPorId(1L);

        assertEquals("Resina", result.getName());
        assertEquals(BigDecimal.valueOf(45), result.getPrice());
    }

    @Test
    void obterPorId_shouldThrowWhenNotFound() {
        when(produtoRepository.findByOrganizacaoIdAndId(ORG_ID, 1L))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> produtoService.obterPorId(1L));
    }

    // --- criar ---

    @Test
    void criar_shouldSaveAndReturnProduto() {
        ProdutosDTO dto = createDTO("Resina", "Unidade", BigDecimal.valueOf(45), 10, 5);
        Produto saved = createProduto(1L, "Resina", "Unidade", BigDecimal.valueOf(45), 10, 5);
        when(produtoRepository.save(any(Produto.class))).thenReturn(saved);

        ProdutosDTO result = produtoService.criar(dto);

        assertEquals("Resina", result.getName());
        assertEquals(10, result.getQuantity());
        verify(produtoRepository).save(produtoCaptor.capture());
        assertEquals(ORG_ID, produtoCaptor.getValue().getOrganizacaoId());
        assertTrue(produtoCaptor.getValue().getAtivo());
        verify(entityManager).persist(any(MovimentoEstoque.class));
    }

    @Test
    void criar_shouldNotRegisterMovementWhenQuantityZero() {
        ProdutosDTO dto = createDTO("Resina", "Unidade", BigDecimal.valueOf(45), 0, 5);
        Produto saved = createProduto(1L, "Resina", "Unidade", BigDecimal.valueOf(45), 0, 5);
        when(produtoRepository.save(any(Produto.class))).thenReturn(saved);

        produtoService.criar(dto);

        verify(entityManager, never()).persist(any());
    }

    // --- atualizar ---

    @Test
    void atualizar_shouldIncreaseQuantityAndRegisterEntry() {
        Produto existing = createProduto(1L, "Resina", "Unidade", BigDecimal.valueOf(45), 10, 5);
        when(produtoRepository.findByOrganizacaoIdAndId(ORG_ID, 1L))
                .thenReturn(Optional.of(existing));

        ProdutosDTO dto = new ProdutosDTO();
        dto.setQuantity(15);
        Produto updated = createProduto(1L, "Resina", "Unidade", BigDecimal.valueOf(45), 15, 5);
        when(produtoRepository.save(any(Produto.class))).thenReturn(updated);

        ProdutosDTO result = produtoService.atualizar(1L, dto);

        assertEquals(15, result.getQuantity());
        verify(entityManager).persist(argThat(mov ->
                mov instanceof MovimentoEstoque &&
                ((MovimentoEstoque) mov).getTipo().equals("ENTRY")));
    }

    @Test
    void atualizar_shouldDecreaseQuantityAndRegisterExit() {
        Produto existing = createProduto(1L, "Resina", "Unidade", BigDecimal.valueOf(45), 10, 5);
        when(produtoRepository.findByOrganizacaoIdAndId(ORG_ID, 1L))
                .thenReturn(Optional.of(existing));

        ProdutosDTO dto = new ProdutosDTO();
        dto.setQuantity(7);
        Produto updated = createProduto(1L, "Resina", "Unidade", BigDecimal.valueOf(45), 7, 5);
        when(produtoRepository.save(any(Produto.class))).thenReturn(updated);

        ProdutosDTO result = produtoService.atualizar(1L, dto);

        assertEquals(7, result.getQuantity());
        verify(entityManager).persist(argThat(mov ->
                mov instanceof MovimentoEstoque &&
                ((MovimentoEstoque) mov).getTipo().equals("EXIT")));
    }

    @Test
    void atualizar_shouldNotRegisterMovementWhenQuantityUnchanged() {
        Produto existing = createProduto(1L, "Resina", "Unidade", BigDecimal.valueOf(45), 10, 5);
        when(produtoRepository.findByOrganizacaoIdAndId(ORG_ID, 1L))
                .thenReturn(Optional.of(existing));

        ProdutosDTO dto = new ProdutosDTO();
        dto.setName("Resina Premium");
        Produto updated = createProduto(1L, "Resina Premium", "Unidade", BigDecimal.valueOf(45), 10, 5);
        when(produtoRepository.save(any(Produto.class))).thenReturn(updated);

        ProdutosDTO result = produtoService.atualizar(1L, dto);

        assertEquals("Resina Premium", result.getName());
        verify(entityManager, never()).persist(any());
    }

    @Test
    void atualizar_shouldThrowWhenNotFound() {
        when(produtoRepository.findByOrganizacaoIdAndId(ORG_ID, 1L))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> produtoService.atualizar(1L, new ProdutosDTO()));
    }

    // --- reporEstoque ---

    @Test
    void reporEstoque_shouldCalculateWeightedAverage() {
        Produto existing = createProduto(1L, "Resina", "Unidade", BigDecimal.valueOf(45.00), 10, 5);
        when(produtoRepository.findByOrganizacaoIdAndId(ORG_ID, 1L))
                .thenReturn(Optional.of(existing));

        Produto updated = createProduto(1L, "Resina", "Unidade", BigDecimal.valueOf(43.33), 15, 5);
        when(produtoRepository.save(any(Produto.class))).thenReturn(updated);

        ProdutosDTO result = produtoService.reporEstoque(1L, 5, BigDecimal.valueOf(40.00));

        assertEquals(15, result.getQuantity());
        assertEquals(0, BigDecimal.valueOf(43.33).compareTo(result.getPrice()));
        verify(entityManager).persist(argThat(mov ->
                ((MovimentoEstoque) mov).getPrecoCompra().compareTo(BigDecimal.valueOf(40.00)) == 0));
    }

    @Test
    void reporEstoque_shouldUsePurchasePriceWhenStockZero() {
        Produto existing = createProduto(1L, "Resina", "Unidade", BigDecimal.ZERO, 0, 5);
        when(produtoRepository.findByOrganizacaoIdAndId(ORG_ID, 1L))
                .thenReturn(Optional.of(existing));

        Produto updated = createProduto(1L, "Resina", "Unidade", BigDecimal.valueOf(40.00), 10, 5);
        when(produtoRepository.save(any(Produto.class))).thenReturn(updated);

        ProdutosDTO result = produtoService.reporEstoque(1L, 10, BigDecimal.valueOf(40.00));

        assertEquals(10, result.getQuantity());
        assertEquals(0, BigDecimal.valueOf(40.00).compareTo(result.getPrice()));
    }

    // --- deletar ---

    @Test
    void deletar_shouldDeleteWhenFound() {
        Produto existing = createProduto(1L, "Resina", "Unidade", BigDecimal.valueOf(45), 10, 5);
        when(produtoRepository.findByOrganizacaoIdAndId(ORG_ID, 1L))
                .thenReturn(Optional.of(existing));

        jakarta.persistence.Query deleteQuery = mock(jakarta.persistence.Query.class);
        when(entityManager.createQuery(anyString())).thenReturn(deleteQuery);
        when(deleteQuery.setParameter(anyString(), any())).thenReturn(deleteQuery);

        produtoService.deletar(1L);

        verify(entityManager).createQuery("DELETE FROM MovimentoEstoque m WHERE m.produtoId = :produtoId AND m.organizacaoId = :orgId");
        verify(deleteQuery).executeUpdate();
        verify(produtoRepository).delete(existing);
    }

    @Test
    void deletar_shouldThrowWhenNotFound() {
        when(produtoRepository.findByOrganizacaoIdAndId(ORG_ID, 1L))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> produtoService.deletar(1L));
    }

    // --- listarMovimentos ---

    @Test
    void listarMovimentos_shouldReturnWhenProdutoIdProvided() {
        TypedQuery<MovimentoEstoque> movimentoQuery = mock(TypedQuery.class);
        when(entityManager.createQuery(contains("MovimentoEstoque"), eq(MovimentoEstoque.class)))
                .thenReturn(movimentoQuery);
        when(movimentoQuery.setParameter(anyString(), any())).thenReturn(movimentoQuery);

        MovimentoEstoque mov = new MovimentoEstoque();
        mov.setId(1L);
        mov.setProdutoId(10L);
        mov.setTipo("ENTRY");
        mov.setQuantidade(5);
        mov.setQuantidadeAnterior(10);
        mov.setQuantidadeNova(15);
        mov.setDescricao("Reposição");
        mov.setOrganizacaoId(ORG_ID);
        mov.setCriadoEm(LocalDateTime.now());
        when(movimentoQuery.getResultList()).thenReturn(List.of(mov));

        TypedQuery<String> nameQuery = mock(TypedQuery.class);
        when(entityManager.createQuery(contains("Produto"), eq(String.class)))
                .thenReturn(nameQuery);
        when(nameQuery.setParameter(anyString(), any())).thenReturn(nameQuery);
        when(nameQuery.getResultStream()).thenReturn(Stream.of("Resina"));

        List<ProdutosDTO> result = produtoService.listarMovimentos(10L);

        assertEquals(1, result.size());
        assertEquals("ENTRY", result.get(0).getTipo());
        assertEquals("Resina", result.get(0).getProdutoNome());
    }

    @Test
    void listarMovimentos_shouldReturnEmptyWhenNone() {
        TypedQuery<MovimentoEstoque> query = mock(TypedQuery.class);
        when(entityManager.createQuery(anyString(), eq(MovimentoEstoque.class))).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.getResultList()).thenReturn(List.of());

        List<ProdutosDTO> result = produtoService.listarMovimentos(null);

        assertTrue(result.isEmpty());
    }
}
