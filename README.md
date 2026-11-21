# Gerenciador de Tarefas — Arquitetura MVC

Sistema web para cadastrar, visualizar, editar, excluir e organizar tarefas, desenvolvido como atividade acadêmica de **Arquitetura de Software** para demonstrar na prática a arquitetura **MVC (Model-View-Controller)**.

**Tecnologias:** Node.js · TypeScript · Express 5 · PostgreSQL · HTML5 · CSS3 · JavaScript (frontend)

---

## 1. Funcionalidades

- Cadastro de tarefas com título, descrição, prioridade (baixa, média, alta) e prazo. Toda tarefa nasce **Pendente** e recebe a data de criação automaticamente.
- Listagem em cards com título, descrição, prioridade, prazo e status, além de uma tela de detalhes.
- Edição de título, descrição, prioridade, prazo e status.
- Exclusão com confirmação.
- Alteração rápida de status no próprio card: Pendente, Em andamento ou Concluída.
- Filtros por status, prioridade e prazo (atrasadas, vencem hoje, próximos 7 dias).
- Dashboard com o total de tarefas e a quantidade por status.
- Mensagens de sucesso e erro, além de erros de validação exibidos em cada campo.
- Layout responsivo para computador, tablet e celular.

---

## 2. Como executar

### 2.1 Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior (recomendado: 22 LTS)
- [PostgreSQL](https://www.postgresql.org/download/) 13 ou superior

### 2.2 Instalação

```bash
# 1. Instale as dependências
npm install

# 2. Crie o arquivo de configuração
cp .env.example .env          # no Windows (PowerShell): copy .env.example .env
```

Abra o `.env` e ajuste usuário, senha e porta do seu PostgreSQL:

```env
PORT=3000
DATABASE_URL=postgres://postgres:SUA_SENHA@localhost:5432/task_manager
APP_TIMEZONE=America/Sao_Paulo
```

### 2.3 Configuração do banco de dados

**Passo 1. Criar o banco** (escolha uma opção):

```bash
# Pelo terminal
psql -U postgres -c "CREATE DATABASE task_manager;"
```

Pelo **pgAdmin**, clique com o botão direito em *Databases*, escolha *Create > Database…* e informe o nome `task_manager`.

**Passo 2. Criar a tabela** (escolha uma opção):

```bash
# Pelo script do projeto (usa a DATABASE_URL do .env)
npm run db:init

# ou diretamente pelo psql
psql -U postgres -d task_manager -f database/schema.sql
```

O script pode ser executado mais de uma vez sem apagar dados (`CREATE TABLE IF NOT EXISTS`).

### 2.4 Executar

```bash
# Desenvolvimento (reinicia ao salvar arquivos)
npm run dev

# Produção
npm run build
npm start
```

Acesse **http://localhost:3000**.

### 2.5 Problemas comuns

| Mensagem | Solução |
| --- | --- |
| `Variável de ambiente DATABASE_URL não definida` | O arquivo `.env` não existe. Copie o `.env.example`. |
| `Não foi possível conectar ao PostgreSQL` | Confira se o PostgreSQL está em execução e se usuário, senha, porta e nome do banco estão corretos no `.env`. |
| `database "task_manager" does not exist` | Faça o passo 1 da seção 2.3. |
| `relation "tasks" does not exist` | Faça o passo 2 da seção 2.3. |
| Senha com caracteres especiais (`@`, `#`, `/`) | Codifique-os na URL, por exemplo `@` vira `%40`. |

### 2.6 Publicar online (Supabase + Vercel)

**Banco no Supabase**

1. Crie um projeto em [supabase.com](https://supabase.com) (anote a senha do banco).
2. Abra **SQL Editor**, cole o conteúdo de `database/schema.sql` e clique em **Run**.
3. Clique em **Connect** (topo da página) e copie a connection string do **Transaction pooler** (porta `6543`). Troque `[YOUR-PASSWORD]` pela senha.
   - Use o *pooler*, não a conexão direta: a Vercel roda em funções serverless, que abrem muitas conexões curtas.
   - Não precisa adicionar `?sslmode=...`; o projeto ativa SSL sozinho para bancos remotos.

**Site na Vercel**

1. Envie o projeto para um repositório no GitHub.
2. Em [vercel.com](https://vercel.com), clique em **Add New > Project** e importe o repositório. Se o repositório tiver outras pastas, defina **Root Directory** = `gerenciador-tarefas`.
3. Em **Environment Variables**, cadastre:
   - `DATABASE_URL` = a connection string do Supabase
   - `APP_TIMEZONE` = `America/Sao_Paulo`
4. Clique em **Deploy**. As configurações de build já estão em `vercel.json`.

Como funciona na Vercel: a interface (`src/views/public`) é servida como site estático, e as rotas `/tasks...` são redirecionadas para a função `api/index.ts`, que usa a mesma aplicação Express do ambiente local.

Para testar localmente usando o banco do Supabase, basta colocar a mesma `DATABASE_URL` no `.env` e rodar `npm run dev`.

---

## 3. Arquitetura MVC aplicada

```text
Navegador (VIEW: HTML/CSS/JS)
        │  requisição HTTP (JSON)
        ▼
Rotas Express ──► CONTROLLER ──► SERVICE ──► REPOSITORY ──► PostgreSQL
                      │          └───────── MODEL ─────────┘
                      ▼
            VIEW da API (task.view.ts) ──► resposta JSON ──► Navegador
```

| Camada | Arquivos | Responsabilidade |
| --- | --- | --- |
| **Model** | `models/task.model.ts` | Entidade `Task`, conversão das linhas do banco e limites dos campos |
|  | `services/task.service.ts` | **Regras de negócio**: validações, status inicial, regra do prazo, controle de `completed_at`, tradução dos filtros |
|  | `repositories/task.repository.ts` | **Acesso a dados**: único lugar com SQL, sempre com consultas parametrizadas |
| **View** | `views/public/` (HTML, CSS, JS) | Interface: dashboard, cards, formulários, modais, mensagens |
|  | `views/task.view.ts` | Representação JSON da tarefa devolvida pela API |
| **Controller** | `controllers/task.controller.ts` | Recebe a requisição, chama o Service e responde com o código HTTP e a View |

### Por que a View está dividida em duas partes

Esta é uma **API REST**. O backend não gera páginas HTML: ele devolve **JSON**. Por isso a View aparece de duas formas:

1. **No backend**, a View é a **representação do recurso** (`task.view.ts`). Ela define quais campos saem e em que formato.
2. **No navegador**, a View é a **interface** (`views/public`). Ela consome a API por HTTP (`js/api.js`) e não acessa o Controller, o Model ou o banco diretamente.

O Express apenas entrega os arquivos estáticos da interface. Em outra situação, essa mesma interface poderia ser substituída por um app React ou mobile sem mudar nada no Model ou no Controller.

### Regras de dependência

- As **rotas** só apontam para métodos do Controller.
- O **Controller** não contém SQL nem regra de negócio. Cada método segue a sequência ler requisição, chamar Service e responder.
- O **Service** não conhece `req`/`res` nem SQL.
- O **Repository** não contém regras. Ele apenas lê e grava o que o Service pede.
- As dependências são passadas pelo construtor (`Repository → Service → Controller`) em `app.ts`, o que facilita os testes.

### Exemplo de fluxo: cadastro de uma tarefa

1. O usuário preenche o formulário e o navegador envia `POST /tasks` com JSON.
2. O `express.json()` converte o corpo e a rota encaminha para `TaskController.create`.
3. O Controller chama `TaskService.create(req.body)`.
4. O Service valida título, descrição, prioridade e prazo. Se algo estiver errado, lança `ValidationError` (400).
5. O Service chama `PgTaskRepository.create`, que executa `INSERT ... VALUES ($1, $2, $3, $4) RETURNING ...`.
6. O PostgreSQL aplica as restrições (`CHECK`, `NOT NULL`), grava a tarefa com status `pending` e devolve a linha.
7. O Controller converte o resultado com `toTaskResponse` e responde `201 Created` com o cabeçalho `Location: /tasks/{id}`.
8. O frontend mostra a mensagem de sucesso e recarrega a lista e o resumo.

---

## 4. Estrutura de pastas

```text
gerenciador-tarefas/
├── api/
│   └── index.ts                   # entrada da função serverless na Vercel
├── database/
│   └── schema.sql                 # tabela tasks, restrições e índices
├── src/
│   ├── config/
│   │   ├── env.ts                 # leitura e validação do .env
│   │   ├── database.ts            # pool de conexões do PostgreSQL
│   │   └── init-db.ts             # script "npm run db:init"
│   ├── types/
│   │   └── task.types.ts          # tipos, valores permitidos e DTOs
│   ├── models/
│   │   └── task.model.ts          # MODEL: entidade Task
│   ├── services/
│   │   └── task.service.ts        # MODEL: regras de negócio
│   ├── repositories/
│   │   └── task.repository.ts     # MODEL: acesso ao banco (SQL)
│   ├── controllers/
│   │   └── task.controller.ts     # CONTROLLER
│   ├── routes/
│   │   └── task.routes.ts         # URL + método HTTP → Controller
│   ├── middlewares/
│   │   └── error.middleware.ts    # tratamento centralizado de erros e 404
│   ├── errors/
│   │   └── app-error.ts           # AppError, ValidationError, NotFoundError
│   ├── utils/
│   │   └── date.ts                # funções de data e fuso horário
│   ├── views/
│   │   ├── task.view.ts           # VIEW: formato JSON da API
│   │   └── public/                # VIEW: interface
│   │       ├── index.html
│   │       ├── css/styles.css
│   │       └── js/
│   │           ├── api.js         # chamadas HTTP à API
│   │           ├── ui.js          # montagem dos cards, modais e mensagens
│   │           └── main.js        # eventos da página
│   ├── app.ts                     # monta o Express e conecta as camadas
│   └── server.ts                  # ponto de entrada (conecta ao banco e sobe o servidor)
├── .env.example
├── vercel.json                    # configuração do deploy na Vercel
├── package.json
├── tsconfig.json
└── README.md
```

---

## 5. API REST

| Método | Rota | Descrição | Sucesso | Erros |
| --- | --- | --- | --- | --- |
| `POST` | `/tasks` | Cadastrar tarefa | `201` | `400` |
| `GET` | `/tasks` | Listar tarefas (com filtros) | `200` | `400` |
| `GET` | `/tasks/:id` | Consultar uma tarefa | `200` | `400`, `404` |
| `PUT` | `/tasks/:id` | Atualizar tarefa | `200` | `400`, `404` |
| `PATCH` | `/tasks/:id/status` | Atualizar somente o status | `200` | `400`, `404` |
| `DELETE` | `/tasks/:id` | Excluir tarefa | `204` | `400`, `404` |

Qualquer falha inesperada retorna `500` com mensagem genérica. O detalhe do erro fica apenas no log do servidor.

### Valores aceitos

| Campo | Valores na API | Exibição |
| --- | --- | --- |
| `priority` | `low`, `medium`, `high` | Baixa, Média, Alta |
| `status` | `pending`, `in_progress`, `completed` | Pendente, Em andamento, Concluída |
| `dueDate` | `AAAA-MM-DD` | DD/MM/AAAA |

### Filtros de `GET /tasks`

| Parâmetro | Valores | Exemplo |
| --- | --- | --- |
| `status` | `pending`, `in_progress`, `completed` | `/tasks?status=pending` |
| `priority` | `low`, `medium`, `high` | `/tasks?priority=high` |
| `due` | `overdue` (atrasadas e não concluídas), `today`, `next7` (hoje até +7 dias) | `/tasks?due=overdue` |

Os filtros podem ser combinados: `/tasks?status=pending&priority=high`.

### Exemplos

```http
POST /tasks
Content-Type: application/json

{ "title": "Preparar apresentação", "description": "Slides sobre MVC", "priority": "high", "dueDate": "2026-11-25" }
```

```http
HTTP/1.1 201 Created
Location: /tasks/1

{ "id": 1, "title": "Preparar apresentação", "description": "Slides sobre MVC", "priority": "high",
  "status": "pending", "createdAt": "2026-11-17T23:05:53.603Z", "dueDate": "2026-11-25", "completedAt": null }
```

```http
PUT /tasks/1
Content-Type: application/json

{ "title": "Preparar apresentação", "description": "Slides sobre MVC", "priority": "medium", "dueDate": "2026-11-26", "status": "in_progress" }
```

```http
PATCH /tasks/1/status
Content-Type: application/json

{ "status": "completed" }
```

Exemplo de erro de validação (`400`):

```json
{
  "error": "Dados inválidos.",
  "details": {
    "title": "O título é obrigatório.",
    "dueDate": "O prazo não pode ser anterior à data de criação."
  }
}
```

---

## 6. Regras de negócio

| Regra | Onde é garantida |
| --- | --- |
| Título obrigatório (até 120 caracteres) | Service e banco (`CHECK`) |
| Descrição obrigatória (até 2000 caracteres) | Service e banco (`CHECK`) |
| Prioridade apenas baixa, média ou alta | Service e banco (`CHECK`) |
| Status apenas pendente, em andamento ou concluída | Service e banco (`CHECK`) |
| Status inicial "pendente" | Banco (`DEFAULT 'pending'`) |
| Prazo não anterior à data de criação | Service (considera o fuso de `APP_TIMEZONE`) |
| `completed_at` preenchido ao concluir e limpo ao reabrir | Service e banco (`CHECK`) |
| Dados validados antes de persistir | Service, antes de chamar o Repository |
| Tarefa excluída não aparece na listagem | Exclusão física (`DELETE`) |

O navegador também faz uma checagem rápida para dar retorno imediato ao usuário. Quem decide, porém, é sempre o backend.

---

## 7. Qualidade e segurança

- **Consultas parametrizadas** (`$1`, `$2`…) em todo o SQL, o que protege contra injeção de SQL.
- **Validação** de todos os dados recebidos (corpo, parâmetros de rota e filtros).
- **Tratamento centralizado de erros** (`error.middleware.ts`): JSON malformado vira `400`, recurso inexistente vira `404` e erros internos viram `500` com mensagem genérica, sem stack trace nem mensagem do banco.
- **Escape de HTML** de todo texto exibido no frontend, o que protege contra XSS.
- Limite de tamanho do corpo JSON (100 KB) e cabeçalho `X-Powered-By` desativado.
- Restrições no banco como segunda barreira de integridade.
