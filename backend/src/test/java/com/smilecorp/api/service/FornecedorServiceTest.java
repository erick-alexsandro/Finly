package com.smilecorp.api.service;

import com.smilecorp.api.dto.FornecedorDTO;
import com.smilecorp.api.entity.Fornecedor;
import com.smilecorp.api.repository.FornecedorRepository;
import com.smilecorp.api.util.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FornecedorServiceTest {

    private static final String ORG_ID = "org-dev-test";
    private static final String FORNECEDOR_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

    @Mock
    private FornecedorRepository repository;

    @InjectMocks
    private FornecedorService service;

    @Captor
    private ArgumentCaptor<Fornecedor> fornecedorCaptor;

    @BeforeEach
    void setUp() {
        TenantContext.setOrganizationId(ORG_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private Fornecedor createMockEntity(String nome, String status) {
        Fornecedor f = new Fornecedor();
        f.setId(UUID.fromString(FORNECEDOR_ID));
        f.setOrganizacaoId(ORG_ID);
        f.setNome(nome);
        f.setCnpjCpf("93221608000127");
        f.setTelefone("31992414295");
        f.setEmail("teste@teste.com");
        f.setRua("Rua A");
        f.setNumero("100");
        f.setBairro("Centro");
        f.setCidade("BH");
        f.setEndereco("Rua A, 100, Centro, BH");
        f.setStatus(status);
        f.setAtivo(true);
        f.setCriadoEm(LocalDateTime.now());
        f.setAtualizadoEm(LocalDateTime.now());
        return f;
    }

    @Test
    void listar_deveRetornarTodos() {
        when(repository.findByOrganizacaoId(ORG_ID))
                .thenReturn(List.of(createMockEntity("Empresa A", "ativo")));

        List<FornecedorDTO> resultado = service.listar(null, null);

        assertEquals(1, resultado.size());
        assertEquals("Empresa A", resultado.get(0).getNome());
        verify(repository).findByOrganizacaoId(ORG_ID);
    }

    @Test
    void listar_deveFiltrarPorNome() {
        when(repository.findByOrganizacaoIdAndNomeContainingIgnoreCase(ORG_ID, "Teste"))
                .thenReturn(List.of(createMockEntity("Empresa Teste", "ativo")));

        List<FornecedorDTO> resultado = service.listar("Teste", null);

        assertEquals(1, resultado.size());
        verify(repository).findByOrganizacaoIdAndNomeContainingIgnoreCase(ORG_ID, "Teste");
    }

    @Test
    void listar_deveFiltrarPorStatus() {
        when(repository.findByOrganizacaoId(ORG_ID))
                .thenReturn(List.of(createMockEntity("Empresa A", "ativo")));

        List<FornecedorDTO> resultado = service.listar(null, "inativo");

        assertTrue(resultado.isEmpty());
    }

    @Test
    void listar_quandoStatusTodos_ignoraFiltro() {
        when(repository.findByOrganizacaoId(ORG_ID))
                .thenReturn(List.of(createMockEntity("Empresa A", "ativo")));

        List<FornecedorDTO> resultado = service.listar(null, "todos");

        assertEquals(1, resultado.size());
    }

    @Test
    void obterPorId_deveRetornarFornecedor() {
        when(repository.findByOrganizacaoIdAndId(ORG_ID, UUID.fromString(FORNECEDOR_ID)))
                .thenReturn(Optional.of(createMockEntity("Empresa A", "ativo")));

        FornecedorDTO resultado = service.obterPorId(FORNECEDOR_ID);

        assertEquals("Empresa A", resultado.getNome());
        assertEquals("Rua A, 100, Centro, BH", resultado.getEndereco());
    }

    @Test
    void obterPorId_quandoNaoExiste_lancaExcecao() {
        when(repository.findByOrganizacaoIdAndId(ORG_ID, UUID.fromString(FORNECEDOR_ID)))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> service.obterPorId(FORNECEDOR_ID));
    }

    @Test
    void criar_deveSalvarEConstruirEndereco() {
        FornecedorDTO dto = new FornecedorDTO();
        dto.setNome("Nova");
        dto.setCnpjCpf("11222333000181");
        dto.setTelefone("1199999999");
        dto.setEmail("n@n.com");
        dto.setRua("Av Paulista");
        dto.setNumero("1000");
        dto.setBairro("Bela Vista");
        dto.setCidade("SP");

        when(repository.save(any(Fornecedor.class))).thenAnswer(i -> i.getArgument(0));

        service.criar(dto);

        verify(repository).save(fornecedorCaptor.capture());
        Fornecedor saved = fornecedorCaptor.getValue();
        assertEquals("Av Paulista, 1000, Bela Vista, SP", saved.getEndereco());
        assertEquals("ativo", saved.getStatus());
        assertTrue(saved.getAtivo());
        assertEquals(ORG_ID, saved.getOrganizacaoId());
    }

    @Test
    void criar_quandoEnderecoNoDto_usarEnderecoDoDto() {
        FornecedorDTO dto = new FornecedorDTO();
        dto.setNome("Nova");
        dto.setCnpjCpf("11222333000181");
        dto.setTelefone("1199999999");
        dto.setEmail("n@n.com");
        dto.setEndereco("Custom");

        when(repository.save(any(Fornecedor.class))).thenAnswer(i -> i.getArgument(0));

        service.criar(dto);

        verify(repository).save(fornecedorCaptor.capture());
        assertEquals("Custom", fornecedorCaptor.getValue().getEndereco());
    }

    @Test
    void atualizar_deveAlterarApenasCamposFornecidos() {
        Fornecedor existente = createMockEntity("Original", "ativo");
        when(repository.findByOrganizacaoIdAndId(ORG_ID, UUID.fromString(FORNECEDOR_ID)))
                .thenReturn(Optional.of(existente));
        when(repository.save(any(Fornecedor.class))).thenAnswer(i -> i.getArgument(0));

        FornecedorDTO dto = new FornecedorDTO();
        dto.setNome("Atualizado");
        dto.setEmail("novo@email.com");

        service.atualizar(FORNECEDOR_ID, dto);

        verify(repository).save(fornecedorCaptor.capture());
        Fornecedor saved = fornecedorCaptor.getValue();
        assertEquals("Atualizado", saved.getNome());
        assertEquals("novo@email.com", saved.getEmail());
        assertEquals("93221608000127", saved.getCnpjCpf());
    }

    @Test
    void atualizar_quandoNaoExiste_lancaExcecao() {
        when(repository.findByOrganizacaoIdAndId(ORG_ID, UUID.fromString(FORNECEDOR_ID)))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> service.atualizar(FORNECEDOR_ID, new FornecedorDTO()));
    }

    @Test
    void deletar_deveRemoverFornecedor() {
        Fornecedor existente = createMockEntity("Empresa", "ativo");
        when(repository.findByOrganizacaoIdAndId(ORG_ID, UUID.fromString(FORNECEDOR_ID)))
                .thenReturn(Optional.of(existente));

        service.deletar(FORNECEDOR_ID);

        verify(repository).delete(existente);
    }

    @Test
    void deletar_quandoNaoExiste_lancaExcecao() {
        when(repository.findByOrganizacaoIdAndId(ORG_ID, UUID.fromString(FORNECEDOR_ID)))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> service.deletar(FORNECEDOR_ID));
    }
}
