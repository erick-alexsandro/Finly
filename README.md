<div align="center">
<img src="resources\branding\product-logo.png" alt="Product Logo" width="100">

<h1>SmileCorp</h1>

<p>
  Uma plataforma de gerenciamento integrada para clínicas odontológicas, permitindo que dentistas e administradores foquem no atendimento ao paciente mantendo controle total dos recursos da clínica.
</p>
</div>

<br>

## Funcionalidades Principais

- **Gestão de Pacientes**: Cadastro e gerenciamento de dados dos pacientes
- **Agendamentos**: Sistema completo de agendamento com data, horário e profissional responsável
- **Procedimentos**: Gerenciamento de procedimentos odontológicos com duração e preço
- **Gerenciamento de Estoque:** Controle de materiais odontológicos com funcionalidades para adicionar, editar e remover itens.

- **Controle Financeiro:** Registro e acompanhamento de receitas e despesas, com categorização, forma de pagamento, e data de vencimento.

- **Dashboard de Indicadores:** Painel com métricas em tempo real (ou período selecionado), como número de atendimentos, taxa de faltas, faturamento, despesas, ticket médio e consumo de materiais.

- **Gestão de Fornecedores:** Cadastro e administração de fornecedores com dados de contato, produtos fornecidos, histórico de compras, condições comerciais e documentos relevantes.

## Stack de Tecnologias

### Backend
- **Framework**: Spring Boot 3.5.11 (Java 21)
- **Banco de Dados**: PostgreSQL ([Neon Serverless Postgres](https://neon.com/))
- **Build**: Maven

### Frontend
- **Framework**: Next.js 16.1.6
- **Linguagem**: TypeScript 5
- **UI**: React 19.2.3
- **Componentes**: shadcn/ui com Tailwind CSS
- **Build**: Tailwind CSS 4

### Testes
- **Unitários**: JUnit
- **BDD**: Cucumber 
- **E2E**: Playwright



## Estrutura de Pastas

```
backend/
  ├── src/
  │   ├── main/
  │   │   ├── java/com/smilecorp/SmileCorp/
  │   │   │   ├── config/            # Configurações
  │   │   │   ├── controller/        # Controladores REST
  │   │   │   ├── dto/               # DTOs (Data Transfer Objects)
  │   │   │   ├── entity/            # Entidades do banco de dados
  │   │   │   ├── repository/        # Repositórios de dados
  │   │   │   ├── security/          # Segurança
  │   │   │   ├── service/           # Serviços
  │   │   │   └── util/              # Utilidades
  │   │   └── resources/
  │   └── test/
  └── pom.xml
frontend/
  ├── src/
  │   ├── app/
  │   │   ├── api/                   # API de integração com o backend
  │   │   ├── auth/                  # Página de autenticação
  │   │   ├── dashboard/             # Página do dashboard
  │   │   ├── equipe/                # Página de equipe
  |   |   ├── financial/             # Página do financeiro
  |   |   ├── inventory/             # Página do estoque
  |   |   ├── server-rendered-page/  # Página renderizada no servidor
  |   |   └── treatment/             
  │   │       └── scheduling/        # Página de agendamento
  │   ├── components/                # Componentes 
  |   |   ├── layout/                # Layout
  |   |   ├── shadcn-big-calendar/   # Componente do Shadcn Big Calendar
  │   │   └── ui/                    # Componentes de UI
  │   └── lib/
  ├── tests/
  ├── package.json
  └── tsconfig.json
docs/
  ├── requisitos/
  │   ├── requisitos-funcionais.md
  │   └── requisitos-nao-funcionais.md
  └── testes/
      ├── plano-de-teste.md
      ├── roteiros-de-teste.md
      └── usabilidade.md
```

## Documentação Adicional

- [Requisitos Funcionais](docs/requisitos/requisitos-funcionais.md)
- [Requisitos Não-Funcionais](docs/requisitos/requisitos-nao-funcionais.md)
- [Plano de Testes](docs/testes/plano-de-teste.md)
- [Roteiros de Teste](docs/testes/roteiros-de-teste.md)
- [Testes de Usabilidade](docs/testes/usabilidade.md)

## Colaboradores

- **[Rafaela Moreira](https://github.com/rafapcmor)** - Orientadora
- **[Erick Alexsandro](https://github.com/erick-alexsandro)** - Desenvolvedor
- **[Samara Alves Gomes](https://github.com/samaraalvesgomes)** - Desenvolvedora
- **[Eduardo Vítor](https://github.com/EduardoVitor020)** - Desenvolvedor
