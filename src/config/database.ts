import { Pool, PoolConfig, types } from 'pg';
import { env } from './env';

// Colunas DATE (OID 1082) chegam como texto "YYYY-MM-DD", sem conversão de fuso.
types.setTypeParser(1082, (value: string) => value);

/**
 * Monta a configuração do pool.
 * - Banco local (localhost): sem SSL.
 * - Banco remoto (ex.: Supabase): SSL obrigatório. O parâmetro "sslmode" da URL
 *   é removido porque, nas versões recentes do driver "pg", ele ativa a
 *   verificação completa do certificado e a conexão com o Supabase falha.
 * - Na Vercel (serverless) cada instância usa poucas conexões.
 */
function buildPoolConfig(): PoolConfig {
  const url = new URL(env.databaseUrl);
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  const useSsl = env.databaseSsl ?? !isLocal;
  url.searchParams.delete('sslmode');

  return {
    connectionString: url.toString(),
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    max: process.env.VERCEL ? 1 : 10,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  };
}

/** Pool de conexões compartilhado pela aplicação. */
export const pool = new Pool(buildPoolConfig());

/** Testa a conexão na inicialização do servidor. */
export async function checkDatabaseConnection(): Promise<void> {
  await pool.query('SELECT 1');
}
