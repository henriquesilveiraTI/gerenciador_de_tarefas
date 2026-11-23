import 'dotenv/config';

/** Lê e valida as variáveis de ambiente uma única vez, na inicialização. */
function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Variável de ambiente ${name} não definida. Copie .env.example para .env e preencha os valores.`);
  }
  return value.trim();
}

function validTimeZone(value: string): string {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return value;
  } catch {
    throw new Error(`APP_TIMEZONE inválido: "${value}". Exemplo de valor válido: America/Sao_Paulo.`);
  }
}

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`PORT inválida: "${process.env.PORT}".`);
}

/** DATABASE_SSL=true|false força o uso de SSL; vazio = automático (remoto usa SSL). */
function optionalBoolean(name: string): boolean | undefined {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${name} inválido: "${value}". Use true ou false.`);
}

/**
 * URL do banco. Usa DATABASE_URL (local / .env) e, se ela não existir,
 * POSTGRES_URL — a variável criada pela integração Supabase da Vercel
 * (Transaction pooler, porta 6543, ideal para funções serverless).
 */
function databaseUrl(): string {
  for (const name of ['DATABASE_URL', 'POSTGRES_URL']) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return required('DATABASE_URL');
}

export const env = {
  port,
  databaseUrl: databaseUrl(),
  databaseSsl: optionalBoolean('DATABASE_SSL'),
  timeZone: validTimeZone(process.env.APP_TIMEZONE?.trim() || 'America/Sao_Paulo'),
} as const;
