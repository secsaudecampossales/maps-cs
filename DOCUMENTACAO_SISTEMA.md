# Documentacao Tecnica Completa - MAPS-CS

## 1) Visao geral do sistema

O **MAPS-CS** (Monitoramento da APS Campos Sales) e uma aplicacao web para acompanhamento de gestantes na Atencao Primaria a Saude.

Objetivos principais:

- centralizar cadastro e acompanhamento pre-natal;
- classificar risco gestacional e acompanhar exames/vacinas;
- oferecer visao operacional (dashboard) e relatorios para gestao;
- aplicar controle de acesso por perfil (admin vs profissional de UBS).

---

## 2) Stack tecnologica

- **Frontend e backend web:** Next.js 16 (App Router) + React 19 + TypeScript
- **Autenticacao:** NextAuth (Credentials + JWT session)
- **Banco e ORM:** PostgreSQL + Prisma
- **UI:** Tailwind CSS v4 + componentes baseados em Radix
- **Relatorios:** JSON para API, com exportacoes CSV/PDF no painel admin
- **Qualidade:** ESLint 9 com `eslint-config-next`

---

## 3) Arquitetura de alto nivel

O sistema segue arquitetura fullstack no proprio Next.js:

- **Camada de interface:** paginas em `src/app/**` e componentes em `src/components/**`
- **Camada de API:** endpoints REST em `src/app/api/**`
- **Camada de dominio:** regras de negocio em `src/lib/**`
- **Persistencia:** Prisma Client (`src/lib/prisma.ts`) e schema/migracoes em `prisma/**`
- **Seguranca de rotas:** `src/middleware.ts` + guards `requireAuth` e `requireAdmin`

Fluxo resumido:

1. Usuario autentica em `/login`.
2. NextAuth emite sessao JWT com metadados (`id`, `isAdmin`, `ubsId`).
3. Frontend chama endpoints de `src/app/api/**`.
4. Endpoints validam sessao/permissao e executam operacoes via Prisma.
5. Dashboard e relatorios exibem indicadores e listagens.

---

## 4) Estrutura do repositorio

### Raiz

- `README.md`: guia inicial de instalacao/uso
- `package.json`: scripts e dependencias
- `eslint.config.mjs`: configuracao de lint
- `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`: configuracoes de build/tooling
- `docker-compose.yml`: ambiente de PostgreSQL local
- `DOCUMENTACAO_SISTEMA.md`: este documento

### Backend e frontend de aplicacao

- `src/app/**`: paginas e rotas de API
- `src/components/**`: componentes de UI, layout e providers
- `src/lib/**`: autenticacao, acesso a dados e regras de negocio
- `src/types/**`: extensoes de tipos (ex.: NextAuth)
- `src/middleware.ts`: protecao de rotas no edge middleware

### Banco de dados

- `prisma/schema.prisma`: modelos e relacoes
- `prisma/migrations/**`: historico de migracoes SQL

### Operacao de banco

- `scripts/backup_db.sh`: backup com `pg_dump`
- `scripts/restore_db.sh`: restore com `pg_restore`
- `backups/**`: artefatos de backup e checksums

---

## 5) Modelo de dados (Prisma)

Definido em `prisma/schema.prisma`.

### Entidades principais

- `UBS`
  - unidade basica de saude
  - relaciona-se com `Enfermeiro[]` e `Gestante[]`

- `Enfermeiro`
  - credencial de acesso (email/senha hash)
  - campos de autorizacao: `isAdmin`, `ubsId`
  - relaciona-se com exclusoes auditadas em `GestanteExcluida[]`

- `Gestante`
  - cadastro ativo de acompanhamento
  - dados demograficos, obstetricos, risco, exames e vacinas
  - vinculada a uma UBS por `ubsId`

- `GestanteExcluida`
  - trilha de auditoria de exclusoes manuais/automaticas
  - armazena snapshot dos dados da gestante no momento da exclusao
  - registra `motivoExclusao` e `enfermeiroId` (quando manual)

---

## 6) Autenticacao e autorizacao

### Configuracao de auth

Arquivo: `src/lib/auth.ts`

- provider de credenciais (`email`, `senha`);
- validacao de senha com `bcryptjs`;
- sessao com estrategia JWT;
- callbacks incluem no token/sessao:
  - `user.id`
  - `user.isAdmin`
  - `user.ubsId`

### Guards reutilizaveis

Arquivo: `src/lib/auth-api.ts`

- `requireAuth(request)`: retorna 401 se nao autenticado
- `requireAdmin(request)`: retorna 403 para nao-admin
- `getAuthSession()`: wrapper de `getServerSession`

### Protecao global de rotas

Arquivo: `src/middleware.ts`

- protege todas as rotas, exceto:
  - `/login`
  - `/api/auth/*`
  - assets internos do Next

---

## 7) Modulos funcionais do sistema

## 7.1 Dashboard operacional

Arquivos-chave:

- `src/app/page.tsx`
- `src/app/api/gestantes/route.ts`
- `src/app/api/gestantes/stats/route.ts`

Responsabilidades:

- listar gestantes (com filtros e paginacao no client);
- exibir indicadores:
  - total de gestantes;
  - alto risco;
  - risco intermediario;
  - partos no mes;
  - partos nos ultimos 3 meses.

## 7.2 Cadastro e manutencao de gestantes

Arquivos-chave:

- `src/app/gestantes/novo/page.tsx`
- `src/app/gestantes/[id]/page.tsx`
- `src/app/gestantes/[id]/visualizar/page.tsx`
- `src/app/api/gestantes/[id]/route.ts`

Responsabilidades:

- criacao (POST), atualizacao (PUT), consulta por ID (GET) e exclusao (DELETE);
- validacoes de negocio:
  - cartao SUS obrigatorio;
  - data de nascimento obrigatoria;
  - telefone com 10-11 digitos (DDD+numero);
  - semanas de inicio do pre-natal entre 1 e 45;
- calculo da DPP a partir da DUM (`+280 dias`).

## 7.3 Administracao e relatorios

Arquivos-chave:

- `src/app/admin/page.tsx`
- `src/app/admin/relatorios/page.tsx`
- `src/app/api/admin/relatorios/route.ts`
- `src/app/api/admin/relatorios/mensal/route.ts`
- `src/app/api/admin/ubs/route.ts`

Responsabilidades:

- filtros avancados de relatorios (risco, etnia, periodos, exames/vacinas etc.);
- consolidacao mensal com resumo por risco/etnia/UBS;
- listagem administrativa de UBS com enfermeiros vinculados.

## 7.4 Limpeza automatica de ex-gestantes

Arquivos-chave:

- `src/lib/gestantes.ts`
- `src/app/api/admin/gestantes/cleanup/route.ts`
- chamada implicita em:
  - `src/app/api/gestantes/route.ts`
  - `src/app/api/gestantes/stats/route.ts`

Regra:

- remove gestantes com DPP anterior a 3 meses;
- antes de remover, registra os dados em `GestanteExcluida` com `motivoExclusao = "automatica"`.

---

## 8) Inventario completo de endpoints API

### Autenticacao

- `GET/POST /api/auth/[...nextauth]`
  - endpoint interno do NextAuth para login/sessao/logout.

### Gestantes

- `GET /api/gestantes`
  - lista gestantes; admin ve todas, nao-admin somente da propria UBS.
- `POST /api/gestantes`
  - cria nova gestante.
- `GET /api/gestantes/[id]`
  - busca gestante por ID com validacao de escopo.
- `PUT /api/gestantes/[id]`
  - atualiza dados da gestante.
- `DELETE /api/gestantes/[id]`
  - exclui e audita em `GestanteExcluida`.
- `GET /api/gestantes/stats`
  - metricas do dashboard.

### UBS

- `GET /api/ubs`
  - lista UBS para formularios (usuarios autenticados).
- `GET /api/admin/ubs`
  - lista UBS com enfermeiros (somente admin).

### Admin / relatorios

- `GET /api/admin/relatorios`
  - relatorio customizavel com filtros avancados.
- `GET /api/admin/relatorios/mensal`
  - relatorio mensal consolidado (`mes`, `ano`).
- `POST /api/admin/gestantes/cleanup`
  - executa limpeza de ex-gestantes manualmente.

---

## 9) Frontend e componentes

### Layout e providers

- `src/app/layout.tsx`: layout raiz da aplicacao
- `src/components/layout/conditional-layout.tsx`: ajusta exibicao de layout por rota
- `src/components/layout/header.tsx`: cabecalho, logout e controle de sessao
- `src/components/layout/footer.tsx`: rodape institucional
- `src/components/providers/session-provider.tsx`: provider de sessao NextAuth
- `src/components/providers/theme-provider.tsx`: provider de tema

### Componentes UI base

Em `src/components/ui/**`:

- `button.tsx`
- `input.tsx`
- `label.tsx`
- `card.tsx`
- `checkbox.tsx`
- `select.tsx`

Sao wrappers reutilizaveis para padronizacao visual e ergonomia de formulario.

---

## 10) Regras de negocio centrais

- **Escopo por UBS**
  - usuarios nao-admin operam apenas dados de sua UBS.
- **Risco gestacional**
  - suporta risco baixo, intermediario e alto.
- **Auditoria de exclusao**
  - exclusoes manuais e automaticas preservam historico em tabela separada.
- **Indicadores operacionais**
  - dashboard e relatorios usam agregacoes por periodo, risco e cobertura de cuidados.

---

## 11) Configuracao de ambiente

Variaveis de ambiente esperadas:

- `DATABASE_URL`: conexao principal Prisma (PostgreSQL)
- `DIRECT_URL`: conexao direta para operacoes Prisma (migracoes/CLI)
- `NEXTAUTH_URL`: URL base da aplicacao
- `NEXTAUTH_SECRET`: segredo para assinatura de sessao JWT
- `RESTORE_TARGET_URL` (opcional): destino alternativo para restore

Observacao: o schema Prisma esta em PostgreSQL e usa `directUrl`, portanto o `.env` deve seguir esse modelo.

---

## 12) Scripts e operacao

Scripts de `package.json`:

- `npm run dev`: ambiente de desenvolvimento
- `npm run build`: gera client Prisma, aplica migracoes e builda Next
- `npm run start`: inicia app em modo producao
- `npm run lint`: analise estatica
- `npm run db:backup`: executa `scripts/backup_db.sh`
- `npm run db:restore`: executa `scripts/restore_db.sh`
- `npm run seed`: executa `tsx prisma/seed.ts` (se existir no ambiente)

---

## 13) Banco: migracoes e evolucao

A pasta `prisma/migrations/**` registra evolucoes de schema, incluindo:

- criacao inicial de entidades;
- inclusao de UBS e vinculacao em enfermeiro/gestante;
- campo `isAdmin`;
- campos de vacinas e telefone;
- data de nascimento;
- semanas de inicio de pre-natal;
- tabela de auditoria `GestanteExcluida`.

---

## 14) Testes e validacao tecnica

No estado atual do repositorio:

- nao existe suite automatizada de testes versionada;
- validacao principal ocorre por:
  - `npm run lint`
  - `npm run build`
  - testes manuais via interface e chamadas de API.

Recomendacoes:

- criar testes de API para fluxos criticos (`gestantes`, `auth`, `admin`);
- criar smoke tests E2E para login, CRUD e relatorios;
- documentar plano de testes para deploy.

---

## 15) Pontos de atencao operacionais

- `README.md` atual mostra exemplo de `DATABASE_URL` em SQLite, mas o projeto usa PostgreSQL no Prisma.
- O script `npm run seed` depende de `prisma/seed.ts`; se o arquivo nao estiver presente, o comando falhara.
- A limpeza automatica de ex-gestantes ocorre tambem em rotas de leitura de dados, devendo ser observada em termos de auditoria e governanca.

---

## 16) Guia rapido para novos mantenedores

1. Configurar `.env` para PostgreSQL (`DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_*`).
2. Rodar `npm install`.
3. Rodar `npx prisma migrate deploy`.
4. (Opcional) Rodar seed se `prisma/seed.ts` existir.
5. Subir sistema com `npm run dev`.
6. Validar endpoints principais:
   - login;
   - CRUD de gestantes;
   - dashboard;
   - relatorios admin.

---

## 17) Mapa de arquivos por responsabilidade

### Aplicacao (paginas)

- `src/app/layout.tsx`: estrutura global da aplicacao
- `src/app/login/page.tsx`: autenticacao de usuario
- `src/app/page.tsx`: dashboard principal
- `src/app/gestantes/novo/page.tsx`: cadastro de gestante
- `src/app/gestantes/[id]/page.tsx`: edicao de gestante
- `src/app/gestantes/[id]/visualizar/page.tsx`: visualizacao detalhada
- `src/app/admin/page.tsx`: painel administrativo
- `src/app/admin/relatorios/page.tsx`: interface de relatorios

### API (servidor)

- `src/app/api/auth/[...nextauth]/route.ts`: endpoints NextAuth
- `src/app/api/gestantes/route.ts`: listagem e criacao
- `src/app/api/gestantes/[id]/route.ts`: consulta/edicao/exclusao por ID
- `src/app/api/gestantes/stats/route.ts`: metricas do dashboard
- `src/app/api/ubs/route.ts`: listagem de UBS para uso geral
- `src/app/api/admin/ubs/route.ts`: listagem admin de UBS com enfermeiros
- `src/app/api/admin/relatorios/route.ts`: relatorios customizados
- `src/app/api/admin/relatorios/mensal/route.ts`: relatorio mensal
- `src/app/api/admin/gestantes/cleanup/route.ts`: limpeza manual de ex-gestantes

### Biblioteca e dominio

- `src/lib/prisma.ts`: singleton do Prisma Client
- `src/lib/auth.ts`: configuracao NextAuth
- `src/lib/auth-api.ts`: funcoes de autorizacao para APIs
- `src/lib/gestantes.ts`: limpeza automatica e auditoria de exclusao
- `src/lib/utils.ts`: utilitarios gerais

### Componentes reutilizaveis

- `src/components/layout/*`: cabecalho, rodape, condicional de layout
- `src/components/providers/*`: providers globais (sessao/tema)
- `src/components/ui/*`: blocos de interface reutilizaveis

### Tipos

- `src/types/next-auth.d.ts`: extensao de tipos de sessao/token

### Banco e scripts

- `prisma/schema.prisma`: modelagem de dados
- `prisma/migrations/**`: historico de alteracoes de schema
- `scripts/backup_db.sh`: backup
- `scripts/restore_db.sh`: restore

---

## 18) Conclusao

O MAPS-CS possui uma base consistente para operacao de monitoramento pre-natal, com separacao clara entre interface, API e dominio, controle de acesso por perfil, auditoria de exclusao e relatorios gerenciais. Esta documentacao serve como referencia unica para entendimento tecnico, onboarding e manutencao evolutiva do sistema.
