-- V1__Initial_Schema.sql
-- Create base tables for SmileCorp multi-tenant architecture

-- Paciente (Patient) Table
CREATE TABLE IF NOT EXISTS paciente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    cpf VARCHAR(11) UNIQUE,
    data_nascimento DATE,
    endereco TEXT,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_paciente_org_id ON paciente(organizacao_id);
CREATE INDEX idx_paciente_nome ON paciente(nome);
CREATE INDEX idx_paciente_ativo ON paciente(ativo);

-- Profissionais (Professional/Staff) Table
CREATE TABLE IF NOT EXISTS profissionais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    cpf VARCHAR(11) UNIQUE,
    especialidade VARCHAR(255),
    numero_registro VARCHAR(100),
    ativo BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_profissionais_org_id ON profissionais(organizacao_id);
CREATE INDEX idx_profissionais_nome ON profissionais(nome);
CREATE INDEX idx_profissionais_ativo ON profissionais(ativo);

-- Procedimento (Procedure) Table
CREATE TABLE IF NOT EXISTS procedimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    duracao_minutos INTEGER NOT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    categoria VARCHAR(100),
    ativo BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_procedimento_org_id ON procedimento(organizacao_id);
CREATE INDEX idx_procedimento_nome ON procedimento(nome);
CREATE INDEX idx_procedimento_ativo ON procedimento(ativo);

-- Agendamento (Appointment) Table
CREATE TABLE IF NOT EXISTS agendamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL,
    data TIMESTAMP NOT NULL,
    hora_inicio VARCHAR(5) NOT NULL,
    hora_fim VARCHAR(5),
    paciente_id UUID NOT NULL,
    profissional_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'agendado' NOT NULL,
    procedimentos_ids JSONB DEFAULT '[]'::jsonb,
    observacoes TEXT,
    confirmado BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT fk_agendamento_paciente FOREIGN KEY (paciente_id) REFERENCES paciente(id) ON DELETE CASCADE,
    CONSTRAINT fk_agendamento_profissional FOREIGN KEY (profissional_id) REFERENCES profissionais(id) ON DELETE CASCADE
);

CREATE INDEX idx_agendamento_org_id ON agendamento(organizacao_id);
CREATE INDEX idx_agendamento_data ON agendamento(data);
CREATE INDEX idx_agendamento_paciente_id ON agendamento(paciente_id);
CREATE INDEX idx_agendamento_profissional_id ON agendamento(profissional_id);
CREATE INDEX idx_agendamento_status ON agendamento(status);

-- Add organization foreign keys (assuming Neon Auth tables exist)
-- These would reference the neon_auth.organization table
ALTER TABLE paciente ADD CONSTRAINT fk_paciente_org 
    FOREIGN KEY (organizacao_id) REFERENCES neon_auth.organization(id) ON DELETE CASCADE
    ON CONFLICT DO NOTHING;

ALTER TABLE profissionais ADD CONSTRAINT fk_profissionais_org 
    FOREIGN KEY (organizacao_id) REFERENCES neon_auth.organization(id) ON DELETE CASCADE
    ON CONFLICT DO NOTHING;

ALTER TABLE procedimento ADD CONSTRAINT fk_procedimento_org 
    FOREIGN KEY (organizacao_id) REFERENCES neon_auth.organization(id) ON DELETE CASCADE
    ON CONFLICT DO NOTHING;

ALTER TABLE agendamento ADD CONSTRAINT fk_agendamento_org 
    FOREIGN KEY (organizacao_id) REFERENCES neon_auth.organization(id) ON DELETE CASCADE
    ON CONFLICT DO NOTHING;
