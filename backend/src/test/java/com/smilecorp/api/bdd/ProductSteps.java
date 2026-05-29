package com.smilecorp.api.bdd;

import com.smilecorp.api.dto.ProdutosDTO;
import com.smilecorp.api.entity.MovimentoEstoque;
import com.smilecorp.api.entity.Produto;
import com.smilecorp.api.repository.ProdutoRepository;
import com.smilecorp.api.service.ProdutoService;
import com.smilecorp.api.util.TenantContext;
import io.cucumber.java.After;
import io.cucumber.java.Before;
import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

public class ProductSteps {

    private ProdutoService produtoService;
    private ProdutoRepository produtoRepository;
    private EntityManager entityManager;

    private ProdutosDTO createdProduct;
    private ProdutosDTO restockResult;
    private Exception thrownException;
    private ArgumentCaptor<Produto> produtoCaptor;

    @Before
    public void setUp() throws Exception {
        produtoRepository = mock(ProdutoRepository.class);
        entityManager = mock(EntityManager.class);
        produtoCaptor = ArgumentCaptor.forClass(Produto.class);

        produtoService = new ProdutoService(produtoRepository);
        java.lang.reflect.Field emField = ProdutoService.class.getDeclaredField("entityManager");
        emField.setAccessible(true);
        emField.set(produtoService, entityManager);
    }

    @After
    public void tearDown() {
        TenantContext.clear();
    }

    @When("eu crio um produto com nome {string} e unidade {string}")
    public void createProduct(String name, String unit) {
        ProdutosDTO dto = new ProdutosDTO();
        dto.setName(name);
        dto.setUnit(unit);

        Produto saved = new Produto();
        saved.setId(1L);
        saved.setOrganizacaoId(TenantContext.getOrganizationId());
        saved.setName(name);
        saved.setUnit(unit);
        saved.setAtivo(true);
        saved.setCriadoEm(LocalDateTime.now());
        saved.setAtualizadoEm(LocalDateTime.now());

        when(produtoRepository.save(any(Produto.class))).thenReturn(saved);

        createdProduct = dto;
    }

    @And("o preço do produto é {string}")
    public void setProductPrice(String price) {
        String numeric = price.replace("R$ ", "").replace(".", "").replace(",", ".");
        createdProduct.setPrice(new BigDecimal(numeric));

        when(produtoRepository.save(any(Produto.class))).thenAnswer(invocation -> {
            Produto p = invocation.getArgument(0);
            p.setId(1L);
            p.setCriadoEm(LocalDateTime.now());
            p.setAtualizadoEm(LocalDateTime.now());
            return p;
        });
    }

    @And("o estoque inicial é {int} unidades")
    public void setInitialStock(int quantity) {
        createdProduct.setQuantity(quantity);
        createdProduct.setMinStock(5);

        Query mockQuery = mock(Query.class);
        when(entityManager.createQuery(anyString())).thenReturn(mockQuery);
        when(mockQuery.setParameter(anyString(), any())).thenReturn(mockQuery);

        try {
            ProdutosDTO result = produtoService.criar(createdProduct);
            createdProduct = result;
            thrownException = null;
        } catch (Exception e) {
            thrownException = e;
        }
    }

    @Then("o produto é criado com sucesso")
    public void productCreatedSuccessfully() {
        assertNull(thrownException, "Expected no exception but got: " + thrownException);
        assertNotNull(createdProduct);
    }

    @And("o produto deve ter {int} unidades em estoque")
    public void checkProductStock(int expectedQty) {
        assertEquals(expectedQty, createdProduct.getQuantity());
    }

    @And("um movimento de entrada deve ser registrado")
    public void stockEntryRegistered() {
        verify(entityManager, atLeastOnce()).persist(any(MovimentoEstoque.class));
    }

    @Given("que um produto existe com nome {string}, preço {string} e estoque {int}")
    public void existingProduct(String name, String price, int stock) {
        String numeric = price.replace("R$ ", "").replace(".", "").replace(",", ".");
        Produto existing = new Produto();
        existing.setId(1L);
        existing.setOrganizacaoId(TenantContext.getOrganizationId());
        existing.setName(name);
        existing.setPrice(new BigDecimal(numeric));
        existing.setCurrentQuantity(stock);
        existing.setMinStock(5);
        existing.setAtivo(true);

        when(produtoRepository.findByOrganizacaoIdAndId(
                TenantContext.getOrganizationId(), 1L))
                .thenReturn(Optional.of(existing));

        Query mockQuery = mock(Query.class);
        when(entityManager.createQuery(anyString())).thenReturn(mockQuery);
        when(mockQuery.setParameter(anyString(), any())).thenReturn(mockQuery);
    }

    @When("eu reabasteço {int} unidades a {string} cada")
    public void restockProduct(int quantity, String price) {
        String numeric = price.replace("R$ ", "").replace(".", "").replace(",", ".");

        when(produtoRepository.save(any(Produto.class))).thenAnswer(invocation -> {
            Produto p = invocation.getArgument(0);
            p.setCriadoEm(LocalDateTime.now());
            p.setAtualizadoEm(LocalDateTime.now());
            return p;
        });

        try {
            restockResult = produtoService.reporEstoque(1L, quantity, new BigDecimal(numeric));
            thrownException = null;
        } catch (Exception e) {
            thrownException = e;
        }
    }

    @Then("o novo estoque deve ser {int} unidades")
    public void checkNewStock(int expectedQty) {
        assertNull(thrownException);
        assertEquals(expectedQty, restockResult.getQuantity());
    }

    @And("o preço médio ponderado deve ser {string}")
    public void checkWeightedAveragePrice(String expectedPrice) {
        String numeric = expectedPrice.replace("R$ ", "").replace(".", "").replace(",", ".");
        BigDecimal expected = new BigDecimal(numeric);
        assertEquals(0, expected.compareTo(restockResult.getPrice()),
                "Expected price " + expected + " but got " + restockResult.getPrice());
    }
}
