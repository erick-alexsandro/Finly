# language: pt
Funcionalidade: Gerenciamento de Produtos
  Como administrador da clínica
  Quero gerenciar produtos e estoque
  Para que eu possa controlar os níveis de inventário e custos

  Contexto:
    Dado que o ID da organização é "org-cucumber-2"

  Cenário: Criar um novo produto com estoque inicial
    Quando eu crio um produto com nome "Resina" e unidade "Unidade"
      E o preço do produto é "R$ 45,00"
      E o estoque inicial é 10 unidades
    Então o produto é criado com sucesso
      E o produto deve ter 10 unidades em estoque
      E um movimento de entrada deve ser registrado

  Cenário: Reabastecimento calcula preço médio ponderado
    Dado que um produto existe com nome "Resina", preço "R$ 45,00" e estoque 10
    Quando eu reabasteço 5 unidades a "R$ 40,00" cada
    Então o novo estoque deve ser 15 unidades
      E o preço médio ponderado deve ser "R$ 43,33"
