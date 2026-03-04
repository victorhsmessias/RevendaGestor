# Plano: Integração Asaas no VendaMax

## Resumo
- **Plano único**: R$34,90/mês
- **Checkout**: Link de pagamento Asaas (redirect)
- **Pagamento**: PIX + Cartão de crédito
- **Trial**: 14 dias (já existe)

## Fluxo do Usuário
```
1. Cadastro → Trial 14 dias (já funciona)
2. Trial expirando → Banner no topo do sistema "Seu teste expira em X dias"
3. Clique em "Assinar agora" → Backend cria customer Asaas + assinatura → Retorna link de pagamento
4. Usuária paga no Asaas (PIX ou Cartão) → Asaas envia webhook → planStatus = ACTIVE
5. Todo mês: cobrança automática pelo Asaas → webhook confirma
6. Pagamento falha → webhook → planStatus = PAUSED → tela de bloqueio
7. Aba "Assinatura" em Configurações mostra status e permite assinar/cancelar
```

## Arquivos a criar/modificar (em ordem)

### 1. Schema Prisma — `backend/prisma/schema.prisma`
Adicionar campos ao Tenant:
```prisma
model Tenant {
  // ... existentes
  asaasCustomerId      String?   @unique
  asaasSubscriptionId  String?
}
```
Rodar migration.

### 2. Asaas Client — `backend/src/lib/asaas.ts` (NOVO)
Client HTTP para API do Asaas:
- `createCustomer(name, email, cpfCnpj)` → POST /customers
- `createSubscription(customerId, billingType)` → POST /subscriptions (R$34,90, MONTHLY)
- `getSubscription(subscriptionId)` → GET /subscriptions/{id}
- `cancelSubscription(subscriptionId)` → DELETE /subscriptions/{id}
- Usa `ASAAS_API_KEY` e `ASAAS_BASE_URL` (sandbox/prod) do env

### 3. Validators — `backend/src/lib/validators.ts`
Adicionar:
- `createAssinaturaSchema` → z.object({ billingType: z.enum(['PIX', 'CREDIT_CARD', 'UNDEFINED']) })

### 4. Rota Assinatura — `backend/src/routes/assinatura.ts` (NOVO)
Rota protegida (dentro do bloco protegido do server.ts):
- `POST /api/assinatura` → Cria customer Asaas (se não existe) + cria subscription → retorna { paymentUrl }
- `GET /api/assinatura` → Retorna status da assinatura do tenant
- `DELETE /api/assinatura` → Cancela assinatura no Asaas + planStatus = CANCELLED

### 5. Webhook Asaas — `backend/src/routes/webhook-asaas.ts` (NOVO)
Rota PÚBLICA (sem JWT, sem tenant middleware):
- `POST /api/webhooks/asaas`
- Valida token do webhook (header `asaas-access-token`)
- Eventos tratados:
  - `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED` → planStatus = ACTIVE
  - `PAYMENT_OVERDUE` → planStatus = PAUSED
  - `PAYMENT_DELETED` / `PAYMENT_REFUNDED` → planStatus = PAUSED
  - `SUBSCRIPTION_DELETED` → planStatus = CANCELLED
- Busca tenant pelo `asaasSubscriptionId` na tabela

### 6. Atualizar server.ts — `backend/src/server.ts`
- Importar e registrar `assinaturaRoutes` nas rotas protegidas
- Importar e registrar `webhookAsaasRoutes` nas rotas PÚBLICAS (antes do bloco protegido)
- Ajustar tenant middleware: se `planStatus === 'PAUSED'`, permitir apenas rotas de assinatura (para que o user possa pagar)

### 7. Hook Frontend — `frontend/src/hooks/useAssinatura.ts` (NOVO)
- `useAssinatura()` → GET /assinatura (status)
- `useCreateAssinatura()` → POST /assinatura (retorna paymentUrl, redireciona)
- `useCancelAssinatura()` → DELETE /assinatura

### 8. Aba Assinatura — `frontend/src/app/(dashboard)/configuracoes/page.tsx`
Adicionar 4ª tab "Assinatura" com:
- Status atual (Trial/Ativo/Pausado)
- Se Trial: botão "Assinar agora — R$34,90/mês" (abre link Asaas)
- Se Ativo: info da assinatura + botão "Cancelar assinatura"
- Se Pausado: botão "Regularizar pagamento"

### 9. Banner Trial — `frontend/src/components/layout/Header.tsx`
- Se `planStatus === 'TRIAL'` e faltam ≤ 5 dias: mostrar banner amarelo
- Se `planStatus === 'PAUSED'`: mostrar banner vermelho
- Botão no banner leva para `/configuracoes?tab=assinatura`

### 10. Variáveis de ambiente
Backend `.env`:
```
ASAAS_API_KEY=seu_token_aqui
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
ASAAS_WEBHOOK_TOKEN=token_secreto_para_validar_webhooks
```

## Ordem de implementação
1. Schema Prisma + migration
2. Asaas client (lib)
3. Validators
4. Rota assinatura (backend)
5. Webhook Asaas (backend)
6. Registrar rotas no server.ts
7. Hook useAssinatura (frontend)
8. Aba Assinatura na página de configurações
9. Banner de trial/pagamento no Header
10. Variáveis de ambiente (.env.example)
