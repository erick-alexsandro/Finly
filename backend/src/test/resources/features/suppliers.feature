# language: pt
Funcionalidade: Gerenciamento de Fornecedores
  Como administrador da clínica
  Quero cadastrar fornecedores
  Para que eu possa gerenciar compras de materiais

  Contexto:
    Dado que o ID da organização é "org-cucumber-3"

  Cenário: Cadastrar um novo fornecedor
    Quando eu cadastro um fornecedor com os seguintes detalhes:
      | campo    | valor                  |
      | nome     | Dental Plus Ltda       |
      | cnpjCpf  | 11222333000155         |
      | telefone | 11988887777            |
      | email    | contato@dentalplus.com |
      | rua      | Rua Augusta            |
      | numero   | 1500                   |
      | bairro   | Consolação             |
      | cidade   | São Paulo              |
    Então o fornecedor é criado com sucesso
      E o nome do fornecedor deve ser "Dental Plus Ltda"
      E o status do fornecedor deve ser "ativo"
      E o endereço do fornecedor deve ser "Rua Augusta, 1500, Consolação, São Paulo"
