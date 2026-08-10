# Nosso Grande Dia — Vercel

Aplicação React + Vite + Express para planejamento de casamento. Esta versão foi preparada para múltiplos casais, com dados separados por conta.

## Como funciona

- Cada casal cria sua própria conta.
- Uma conta recebe um casamento novo e vazio.
- Convidados, tarefas, orçamento, fornecedores, documentos, diário, ideias e demais registros ficam vinculados ao casamento da conta.
- O frontend envia o identificador da sessão em `x-user-id` para as APIs.
- Em produção, os dados persistem no Upstash Redis.
- Arquivos enviados são armazenados no Vercel Blob.
- Em desenvolvimento local, sem Redis/Blob, o banco usa `data_db.json`.

## Variáveis no Vercel

Conecte pelo Marketplace: **Upstash Redis** e **Vercel Blob**.

As variáveis esperadas são:

```env
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
BLOB_READ_WRITE_TOKEN=...
NGD_REDIS_KEY=nosso-grande-dia:v2
```

## Deploy

1. Extraia este projeto.
2. Envie os arquivos extraídos para um repositório GitHub (não envie somente o `.zip`).
3. Importe o repositório no Vercel.
4. Conecte Upstash Redis e Vercel Blob ao projeto.
5. Faça um novo deploy.
6. Teste `/api/health`.

O build usa `npm run build` e o Vercel detecta o `server.ts` como servidor Node.
