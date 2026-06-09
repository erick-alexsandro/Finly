CREATE TABLE IF NOT EXISTS prontuario (
    id UUID PRIMARY KEY,
    organizacao_id VARCHAR(255) NOT NULL,
    agendamento_id UUID NOT NULL,
    paciente_id UUID NOT NULL,
    conteudo TEXT,
    data DATE,
    profissional_id UUID,
    dente VARCHAR(50),
    procedimentos_executados TEXT,
    secao VARCHAR(100),
    detalhes_proxima_consulta TEXT,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prontuario_org_id ON prontuario(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_prontuario_agendamento_id ON prontuario(agendamento_id);
CREATE INDEX IF NOT EXISTS idx_prontuario_paciente_id ON prontuario(paciente_id);

CREATE TABLE IF NOT EXISTS pagamento_paciente (
    id UUID PRIMARY KEY,
    organizacao_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paciente_id UUID NOT NULL,
    agendamento_id UUID,
    nome VARCHAR(255) NOT NULL,
    data DATE NOT NULL,
    valor_total DECIMAL(10, 2) NOT NULL,
    forma_pagamento VARCHAR(50),
    parcelas INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'pendente'
);

CREATE INDEX IF NOT EXISTS idx_pagamento_paciente_org_id ON pagamento_paciente(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_pagamento_paciente_paciente_id ON pagamento_paciente(paciente_id);
CREATE INDEX IF NOT EXISTS idx_pagamento_paciente_agendamento_id ON pagamento_paciente(agendamento_id);
