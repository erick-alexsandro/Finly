# language: pt
Funcionalidade: Agendamento de Consultas
  Como administrador da clínica
  Quero agendar consultas
  Para que os pacientes sejam atendidos pelos profissionais

  Contexto:
    Dado que o ID da organização é "org-cucumber-1"
    E um profissional existe com ID "550e8400-e29b-41d4-a716-446655440001" e nome "Dr. Carlos"
    E um paciente existe com ID "550e8400-e29b-41d4-a716-446655440002" e nome "João Silva"

  Cenário: Agendar uma consulta com sucesso
    Quando eu crio um agendamento para o paciente "João Silva" com o profissional "Dr. Carlos"
      E os detalhes do agendamento são:
        | campo      | valor      |
        | date       | 2026-06-15 |
        | horaInicio | 09:00      |
        | horaFim    | 10:00      |
        | status     | agendado   |
    Então o agendamento é criado com sucesso
      E o status do agendamento deve ser "agendado"
      E o paciente do agendamento deve ser "João Silva"
      E o profissional do agendamento deve ser "Dr. Carlos"

  Cenário: Falha ao agendar consulta sem nome do paciente
    Quando eu crio um agendamento com nome de paciente vazio
    Então o sistema deve rejeitar a operação com "Patient name is required"
