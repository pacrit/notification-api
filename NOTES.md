# NOTES.md

Este arquivo documenta as decisões técnicas, trade-offs e o que não foi implementado por limitações de tempo.

## Decisões Técnicas

### Por que Express ao invés de Meteor.js?

**Decisão:** Usei Express mesmo o Meteor sendo listado como diferencial.

**Motivo:** Meteor é uma framework full-stack focada em real-time e aplicações isomórficas. Para uma API REST pura, o Express é mais adequado porque:

- É mais leve e performático para APIs REST
- Tem documentação e comunidade maiores para este caso de uso
- Oferece mais controle sobre o que incluir
- Integração mais direta com MongoDB via Mongoose
- Evita overhead do DDP (protocolo do Meteor)

Se o projeto evoluir para incluir WebSockets e notificações em tempo real, aí faria sentido considerar Meteor ou Socket.io.

### Arquitetura em Camadas

**Decisão:** Separar em Controllers → Services → Repositories → Models

**Por quê:**
- **Testabilidade**: Cada camada pode ser testada isoladamente
- **Manutenibilidade**: Mudanças em uma camada não afetam as outras
- **Reusabilidade**: Services podem ser chamados de diferentes controllers
- **Clareza**: Cada camada tem responsabilidade única e bem definida

**Trade-off:** Mais arquivos e código inicial, mas muito mais fácil de manter conforme o projeto cresce.

### Soft Delete

**Decisão:** Notificações deletadas são marcadas com `deletedAt` ao invés de serem removidas do banco.

**Vantagens:**
- Preserva histórico completo
- Permite recuperação se necessário
- Facilita auditoria
- Útil para analytics

**Desvantagens:**
- Queries ficam mais complexas (sempre filtrar `deletedAt: null`)
- Banco cresce mais rápido
- Precisa de estratégia de arquivamento no futuro

**Alternativa futura:** Implementar job que arquiva notificações deletadas há mais de 6 meses em outra collection ou storage mais barato.

### Cache com Redis

**Decisão:** Cachear apenas o contador de notificações não lidas

**Por quê cachear só isso:**
- É a operação mais frequente (aparece em headers, badges, etc)
- Dados mudam com frequência conhecida (criar/ler notificação)
- Invalidação é simples

**Por quê NÃO cachear lista de notificações:**
- Muda muito frequentemente
- Invalidação seria complexa (nova notificação, marcação como lida, delete)
- Risco de inconsistência seria maior
- Paginação complica ainda mais

**Trade-off:** Preferimos consistência sobre performance para listas. O contador tem TTL de 5 minutos, que é aceitável.

**Como funciona:**
- Ao buscar contador, tenta Redis primeiro
- Se não tiver no cache, busca no MongoDB
- Salva no Redis com TTL de 5 minutos
- Invalida cache ao criar, ler ou deletar notificação

### Autenticação JWT

**Implementação atual:** JWT simples, sem refresh tokens

**Limitações conhecidas:**
- Tokens não podem ser revogados (se vazar, é válido até expirar)
- Sem suporte a múltiplos dispositivos
- Sem refresh tokens (usuário precisa fazer login novamente após 7 dias)

**Por quê dessa decisão:**
- Simplicidade para MVP
- Stateless (facilita escalar horizontalmente)
- Suficiente para teste técnico

**Próximos passos:**
1. Implementar refresh tokens
2. Adicionar blacklist de tokens no Redis
3. Sistema de sessões por dispositivo
4. Logout que invalida tokens

### Validação em Múltiplas Camadas

**Decisão:** Validar em 3 lugares diferentes

1. **Joi (Middlewares)**: Valida formato e tipos dos dados de entrada
2. **Mongoose (Models)**: Valida integridade antes de salvar no banco
3. **Business rules (Services)**: Valida regras de negócio

**Exemplo prático:**
- Joi verifica se email tem formato válido
- Mongoose garante que é string e não é nulo
- Service verifica se email já não está cadastrado

**Trade-off:** Parece redundante, mas cada camada tem propósito diferente e captura erros em momentos diferentes.

### Tratamento de Erros

**Decisão:** Middleware centralizado para todos os erros

**Como funciona:**
- Classe `ApiError` customizada para erros operacionais
- Middleware `errorHandler` captura tudo no final
- Converte erros do Mongoose para formato consistente
- Em dev: mostra stack trace; em prod: oculta detalhes internos

**Vantagem:** Respostas de erro sempre têm o mesmo formato, facilitando frontend.

### Índices do MongoDB

**Implementados:**
- `userId` (queries sempre filtram por usuário)
- `isRead` (filtros comuns)
- `{ userId, isRead, deletedAt }` (composto para queries comuns)
- `{ userId, createdAt }` (para ordenação)

**Não implementados (ainda):**
- Índices para `type` (esperar uso real para decidir)
- Text index para busca por título/mensagem

**Por quê esperar:** Índices têm custo (escrita fica mais lenta, mais espaço). Melhor adicionar conforme necessidade real.

### Logs

**Decisão:** Winston com logs estruturados em JSON

**Por quê:**
- Fácil de integrar com ferramentas de monitoramento
- JSON facilita parsing e análise
- Diferentes níveis (info, warn, error)

**Não implementado:**
- Request IDs para rastrear requisições
- Logs em arquivo (só no console)
- Integração com serviços externos (Datadog, New Relic)

Suficiente para desenvolvimento e teste técnico.

## Trade-offs Importantes

### 1. Paginação Offset-based

**Implementação atual:** `?page=1&limit=20`

**Problema:** Se dados mudarem enquanto usuário navega, pode ver itens duplicados ou pular alguns.

**Exemplo:**
- Usuário está na página 2
- Alguém cria nova notificação
- Usuário vai pra página 3
- Pode ver um item que já viu na página 2

**Alternativa:** Cursor-based pagination

```javascript
// Ao invés de page/limit, usar:
?cursor=ULTIMO_ID_VISTO&limit=20
```

**Por quê não implementei:** Mais complexo, e offset-based é suficiente para MVP. Problema só aparece em escala.

### 2. Concorrência

**Cenário:** Usuário marca 5 notificações como lidas ao mesmo tempo.

**Problema potencial:** Race conditions no cache do Redis.

**Impacto real:** Baixo. No pior caso, o contador fica desatualizado até próxima atualização ou TTL expirar.

**Por quê não resolvi:** Operações são idempotentes. Rodar 2x não muda o resultado final. Adicionar locks seria overengineering para este caso.

### 3. Redis Opcional

**Decisão:** Se Redis falhar, aplicação continua funcionando

**Por quê:**
- Redis é só cache, não é critical
- Degrada performance mas não funcionalidade
- Logs avisam quando Redis está indisponível

**Código relevante:**
```javascript
if (redis) {
  try {
    // usa cache
  } catch (error) {
    logger.warn('Redis indisponível, usando DB');
  }
}
// sempre busca do DB se Redis falhou
```

### 4. Tokens JWT sem Revogação

**Problema:** Se um token vazar, não tem como invalidar antes de expirar.

**Mitigações implementadas:**
- Expiração curta (7 dias)
- HTTPS obrigatório (em produção)
- Token só no header (não em query string)

**Solução futura:** Blacklist no Redis com TTL igual ao do token.

## Não Implementado por Tempo

### 1. Documentação Swagger/OpenAPI

**Por quê não fiz:** Priorizei funcionalidade e testes

**Esforço estimado:** 2-3 horas

**Como implementaria:**
```bash
npm install swagger-jsdoc swagger-ui-express
```

Adicionar JSDoc nos controllers:
```javascript
/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Cria uma notificação
 *     tags: [Notifications]
 *     ...
 */
```

**Valor:** Médio. Os exemplos de cURL no README cobrem bem, mas Swagger é mais interativo.

### 2. Rate Limiting

**Por quê não fiz:** Não era requisito obrigatório

**Esforço estimado:** 30 minutos

**Como implementaria:**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests
  message: 'Muitas requisições, tente novamente mais tarde'
});

app.use('/api/', limiter);
```

**Valor:** Alto para produção, essencial para prevenir abuso.

### 3. WebSockets / Real-time

**Por quê não fiz:** Não era requisito obrigatório

**Esforço estimado:** 4-6 horas

**Como implementaria:**
- Socket.io no servidor
- Sala por usuário (`socket.join(userId)`)
- Emit em `NotificationService.createNotification()`

```javascript
io.to(userId).emit('new-notification', notification);
```

**Valor:** Alto para produção. Notificações em tempo real melhoram muito UX.

### 4. Testes E2E

**Por quê não fiz:** Testes de integração já cobrem maioria dos fluxos

**Esforço estimado:** 4-5 horas

**Como implementaria:** Playwright ou Cypress

**Valor:** Médio. Testes atuais (unit + integration) são suficientes para backend puro.

### 5. CI/CD Pipeline

**Por quê não fiz:** Foco em funcionalidade

**Esforço estimado:** 1 dia completo

**Como implementaria:** GitHub Actions

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

**Valor:** Essencial para time, mas não para teste técnico.

### 6. Monitoramento e Métricas

**Por quê não fez:** Logs básicos são suficientes para desenvolvimento

**Esforço estimado:** 1-2 dias

**O que incluiria:**
- Prometheus para métricas
- Grafana para dashboards
- Alertas para erros críticos
- APM (Application Performance Monitoring)

**Valor:** Crítico para produção.

## Problemas Conhecidos

### 1. Validação de ObjectId

**Status:** ✅ Resolvido

O middleware `errorHandler` já converte `CastError` (ObjectId inválido) para status 400 com mensagem clara.

### 2. Logs muito verbosos em desenvolvimento

**Status:** ⚠️ Aceitável

Winston loga muita coisa. Poderia reduzir nível para `warn` em dev, mas é útil para debug.

### 3. Falta de índices otimizados

**Status:** ⏳ Requer dados reais

Índices atuais são baseados em suposições. Em produção, seria necessário:
- Analisar queries reais com explain()
- Adicionar índices baseado em uso
- Monitorar slow queries

## Melhorias Futuras (Roadmap)

### Curto Prazo (1-2 semanas)

- [ ] Documentação Swagger
- [ ] Rate limiting
- [ ] Refresh tokens
- [ ] Testes E2E básicos

### Médio Prazo (1 mês)

- [ ] WebSockets para notificações em tempo real
- [ ] Preferências de notificação por usuário
- [ ] Templates de notificações
- [ ] Cursor-based pagination
- [ ] Sistema de arquivamento de notificações antigas

### Longo Prazo (3+ meses)

- [ ] Monitoramento completo (Prometheus + Grafana)
- [ ] Suporte a múltiplos idiomas
- [ ] Notificações agrupadas
- [ ] Rich content (markdown, anexos)
- [ ] Sistema de prioridades
- [ ] Notificações push (Firebase/OneSignal)
- [ ] Analytics de engajamento

## Métricas de Qualidade

### Cobertura de Testes

**Atual:** ~75%

**Áreas cobertas:**
- ✅ Services (100%)
- ✅ Repositories (100%)
- ✅ Endpoints principais (100%)

**Não coberto:**
- Error handlers edge cases
- Alguns validadores
- Configurações

**Objetivo:** >80% para código crítico

Até segunda tento adicionar mais melhorias...