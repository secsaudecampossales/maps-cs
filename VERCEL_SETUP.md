# Configuração do Vercel para MAPS-CS

## Variáveis de Ambiente Obrigatórias

Configure as seguintes variáveis de ambiente no painel do Vercel:

### 1. Banco de Dados (Supabase)

```
DATABASE_URL="postgresql://postgres:[SENHA]@db.[PROJETO].supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[SENHA]@db.[PROJETO].supabase.co:5432/postgres"
```

**Importante:**
- `DATABASE_URL`: Usa a porta 6543 (connection pooling) para queries normais
- `DIRECT_URL`: Usa a porta 5432 (conexão direta) para migrations

### 2. NextAuth

```
NEXTAUTH_URL="https://maps-cs.vercel.app"
NEXTAUTH_SECRET="seu-secret-key-aqui-gerado-aleatoriamente"
```

**Como gerar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**Importante:**
- `NEXTAUTH_URL` deve ser exatamente a URL do seu deploy (com https://)
- Não use `http://localhost:3000` em produção
- O `NEXTAUTH_SECRET` deve ser o mesmo usado localmente OU gere um novo e atualize

## Passos para Configurar no Vercel

1. Acesse o painel do Vercel: https://vercel.com
2. Selecione seu projeto `maps-cs`
3. Vá em **Settings** → **Environment Variables**
4. Adicione todas as variáveis acima
5. Certifique-se de que estão marcadas para **Production**, **Preview** e **Development**
6. Faça um novo deploy após adicionar as variáveis

## Verificações Pós-Deploy

Após o deploy, verifique:

1. **Logs do Vercel**: Verifique se há erros relacionados a:
   - Conexão com o banco de dados
   - NEXTAUTH_SECRET não encontrado
   - NEXTAUTH_URL incorreto

2. **Console do Navegador**: Abra o DevTools (F12) e verifique:
   - Erros de rede na aba Network
   - Erros no Console relacionados a autenticação

3. **Teste de Login**:
   - Tente fazer login com credenciais válidas
   - Verifique se o botão muda para "Entrando..." e depois redireciona
   - Se ficar travado, verifique os logs do servidor no Vercel

## Problemas Comuns

### Login fica travado em "Entrando..."

**Causas possíveis:**
1. `NEXTAUTH_URL` não configurado ou incorreto
2. `NEXTAUTH_SECRET` não configurado
3. Problema de conexão com o banco de dados
4. Cookies bloqueados pelo navegador

**Solução:**
1. Verifique se todas as variáveis estão configuradas no Vercel
2. Verifique os logs do Vercel para erros específicos
3. Teste a conexão com o banco usando `npx prisma studio` localmente com as mesmas credenciais

### Erro 500 ao fazer login

**Causa:** Problema na conexão com o banco de dados

**Solução:**
1. Verifique se `DATABASE_URL` e `DIRECT_URL` estão corretos
2. Verifique se o Supabase permite conexões do Vercel (IP whitelist)
3. Teste a conexão localmente com as mesmas credenciais

### Cookies não funcionam

**Causa:** Configuração de cookies incorreta

**Solução:**
- A configuração de cookies já está ajustada no código para produção
- Certifique-se de que `NEXTAUTH_URL` usa `https://`

## Comandos Úteis

```bash
# Verificar variáveis de ambiente localmente
cat .env

# Testar conexão com o banco
npx prisma db pull

# Ver logs do Vercel
vercel logs
```

