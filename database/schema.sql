-- =============================================================
-- Gerenciador de Tarefas - Esquema do banco de dados (PostgreSQL)
-- =============================================================
-- Execute este arquivo uma vez no banco "task_manager":
--   psql -U postgres -d task_manager -f database/schema.sql
-- ou use o script do projeto:  npm run db:init
-- =============================================================

CREATE TABLE IF NOT EXISTS tasks (
    id            SERIAL        PRIMARY KEY,
    title         VARCHAR(120)  NOT NULL,
    description   TEXT          NOT NULL,
    priority      VARCHAR(10)   NOT NULL,
    status        VARCHAR(15)   NOT NULL DEFAULT 'pending',
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    due_date      DATE          NOT NULL,
    completed_at  TIMESTAMPTZ   NULL,

    -- Título e descrição não podem ser vazios (apenas espaços também é vazio)
    CONSTRAINT tasks_title_not_blank       CHECK (char_length(btrim(title)) > 0),
    CONSTRAINT tasks_description_not_blank CHECK (char_length(btrim(description)) > 0),

    -- Domínios permitidos (baixa/média/alta e pendente/em andamento/concluída)
    CONSTRAINT tasks_priority_valid CHECK (priority IN ('low', 'medium', 'high')),
    CONSTRAINT tasks_status_valid   CHECK (status IN ('pending', 'in_progress', 'completed')),

    -- A conclusão nunca é anterior à criação.
    -- (A regra "prazo não pode ser anterior à data de criação" depende do fuso
    --  horário da aplicação, por isso é validada no Service - camada Model.)
    CONSTRAINT tasks_completed_after_created CHECK (completed_at IS NULL OR completed_at >= created_at),

    -- completed_at só existe quando a tarefa está concluída
    CONSTRAINT tasks_completed_matches_status CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status <> 'completed' AND completed_at IS NULL)
    )
);

-- Índices para os filtros mais usados na listagem
CREATE INDEX IF NOT EXISTS idx_tasks_status   ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks (priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks (due_date);

-- Supabase: tabelas do schema "public" ficam expostas pela API automática
-- (chave "anon"). Ativar o RLS sem políticas bloqueia esse acesso público;
-- a aplicação continua funcionando porque conecta como dona da tabela.
-- (Em um PostgreSQL local o comando também funciona e não muda nada.)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
