package com.smilecorp.api.bdd;

import com.smilecorp.api.dto.FornecedorDTO;
import com.smilecorp.api.entity.Fornecedor;
import com.smilecorp.api.repository.FornecedorRepository;
import com.smilecorp.api.service.FornecedorService;
import com.smilecorp.api.util.TenantContext;
import io.cucumber.java.After;
import io.cucumber.java.Before;
import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class SupplierSteps {

    private FornecedorService fornecedorService;
    private FornecedorRepository fornecedorRepository;

    private FornecedorDTO createdSupplier;
    private Exception thrownException;
    private ArgumentCaptor<Fornecedor> fornecedorCaptor;

    @Before
    public void setUp() {
        fornecedorRepository = mock(FornecedorRepository.class);
        fornecedorService = new FornecedorService(fornecedorRepository);
        fornecedorCaptor = ArgumentCaptor.forClass(Fornecedor.class);
    }

    @After
    public void tearDown() {
        TenantContext.clear();
    }

    @When("eu cadastro um fornecedor com os seguintes detalhes:")
    public void registerSupplier(Map<String, String> fields) {
        FornecedorDTO dto = new FornecedorDTO();
        dto.setNome(fields.get("nome"));
        dto.setCnpjCpf(fields.get("cnpjCpf"));
        dto.setTelefone(fields.get("telefone"));
        dto.setEmail(fields.get("email"));
        dto.setRua(fields.get("rua"));
        dto.setNumero(fields.get("numero"));
        dto.setBairro(fields.get("bairro"));
        dto.setCidade(fields.get("cidade"));
        if (fields.containsKey("endereco")) {
            dto.setEndereco(fields.get("endereco"));
        }

        Fornecedor saved = new Fornecedor(
                TenantContext.getOrganizationId(),
                fields.get("nome"),
                fields.get("cnpjCpf"),
                fields.get("telefone"),
                fields.get("email"),
                fields.get("rua"),
                fields.get("numero"),
                fields.get("bairro"),
                fields.get("cidade")
        );
        saved.setId(UUID.randomUUID());
        saved.setCriadoEm(LocalDateTime.now());
        saved.setAtualizadoEm(LocalDateTime.now());

        when(fornecedorRepository.save(any(Fornecedor.class))).thenReturn(saved);

        try {
            createdSupplier = fornecedorService.criar(dto);
            thrownException = null;
        } catch (Exception e) {
            thrownException = e;
        }
    }

    @Then("o fornecedor é criado com sucesso")
    public void supplierCreatedSuccessfully() {
        assertNull(thrownException, "Expected no exception but got: " + thrownException);
        assertNotNull(createdSupplier);
        assertNotNull(createdSupplier.getId());
        verify(fornecedorRepository).save(fornecedorCaptor.capture());

        Fornecedor saved = fornecedorCaptor.getValue();
        assertEquals(TenantContext.getOrganizationId(), saved.getOrganizacaoId());
        assertTrue(saved.getAtivo());
    }

    @And("o nome do fornecedor deve ser {string}")
    public void checkSupplierName(String name) {
        assertEquals(name, createdSupplier.getNome());
    }

    @And("o status do fornecedor deve ser {string}")
    public void checkSupplierStatus(String status) {
        assertEquals(status, createdSupplier.getStatus());
    }

    @And("o endereço do fornecedor deve ser {string}")
    public void checkSupplierAddress(String address) {
        assertEquals(address, createdSupplier.getEndereco());
    }
}
