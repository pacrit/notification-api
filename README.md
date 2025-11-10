# API de Notificações

Sistema de notificações para usuários usando Node.js, MongoDB e Redis.

## 🚀 Quick Start

```bash
# 1. Clone e instale
git clone <url-do-repo>
cd notification-api
npm install

# 2. Configure ambiente
cp .env.example .env

# 3. Inicie Docker Desktop (Windows/Mac)

# 4. Suba MongoDB e Redis
docker-compose up -d mongo redis

# 5. Inicie a aplicação
npm start

# 6. Teste no navegador
# http://localhost:3000/api/health
```

Pronto! Agora pode testar no Postman/Insomnia 🎉

## Tecnologias

- Node.js + Express
- MongoDB (Mongoose)
- Redis (cache)
- JWT (autenticação)
- Jest (testes)
- Docker

## Requisitos

- Docker e Docker Compose
- Node.js 18+ (se rodar sem Docker)

## Instalação e Execução

### Opção 1: Desenvolvimento Local com Docker (Recomendado para testar com Postman/Insomnia)

Esta opção roda MongoDB e Redis no Docker, mas a aplicação localmente:

```bash
# 1. Clonar o repositório
git clone <url-do-repo>
cd notification-api

# 2. Instalar dependências
npm install

# 3. Copiar variáveis de ambiente
cp .env.example .env

# 4. Iniciar Docker Desktop (Windows/Mac)

# 5. Subir apenas MongoDB e Redis
docker-compose up -d mongo redis

# 6. Iniciar a aplicação
npm start
```

A API estará disponível em `http://localhost:3000`

**Vantagens:**
- Fácil de debugar e ver logs
- Hot reload com `npm run dev`
- Ideal para testar com Postman/Insomnia

### Opção 2: Tudo no Docker

Esta opção roda tudo containerizado (app + mongo + redis):

```bash
# Subir todos os containers
docker-compose up -d

# Ver os logs
docker-compose logs -f app
```

**Nota:** Com esta opção, você **não** pode rodar `npm start` localmente pois a porta 3000 já estará em uso pelo container.

### Opção 3: Sem Docker

Apenas se você já tiver MongoDB e Redis instalados localmente:

```bash
# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
# Edite o .env com suas credenciais do MongoDB e Redis

# Iniciar MongoDB (terminal separado)
mongod

# Iniciar Redis (terminal separado)
redis-server

# Rodar aplicação
npm start
```

## Testando com Postman/Insomnia

### Passo a passo rápido:

1. **Certifique-se que tudo está rodando:**
   ```bash
   # Verificar containers
   docker ps
   # Deve mostrar: notification-api-mongo-1 e notification-api-redis-1
   
   # Verificar se a API está respondendo
   curl http://localhost:3000/api/health
   ```

2. **Registrar um usuário:**
   - Método: `POST`
   - URL: `http://localhost:3000/api/auth/register`
   - Body (JSON):
     ```json
     {
       "name": "Seu Nome",
       "email": "seu@email.com",
       "password": "senha123"
     }
     ```
   - ✅ Copie o `token` da resposta

3. **Configurar autenticação:**
   - No Postman/Insomnia, adicione um header:
   - `Authorization: Bearer SEU_TOKEN_AQUI`

4. **Testar endpoints de notificações:**
   - Criar: `POST /api/notifications`
   - Listar: `GET /api/notifications`
   - Contar não lidas: `GET /api/notifications/unread-count`
   - Marcar como lida: `PATCH /api/notifications/{id}/read`

**Dica:** Todos os exemplos de curl abaixo podem ser copiados direto para o terminal ou importados no Postman/Insomnia.

## Executando os Testes

```bash
# Todos os testes
npm test

# Com cobertura
npm run test:coverage

# Modo watch
npm run test:watch
```

**Nota:** Os testes usam banco de dados em memória, não precisa do Docker rodando.

## Documentação da API

### Autenticação

Todas as rotas de notificações requerem autenticação via Bearer token.

#### Registrar usuário

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@email.com",
    "password": "senha123"
  }'
```

#### Fazer login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@email.com",
    "password": "senha123"
  }'
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "João Silva",
      "email": "joao@email.com"
    },
    "token": "eyJhbGci..."
  }
}
```

#### Ver perfil

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Notificações

#### Criar notificação

```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nova mensagem",
    "message": "Você recebeu uma nova mensagem",
    "type": "info",
    "metadata": {
      "senderId": "123"
    }
  }'
```

**Tipos disponíveis:** `info`, `warning`, `success`, `error`

#### Listar notificações

```bash
# Todas (paginado)
curl "http://localhost:3000/api/notifications?page=1&limit=20" \
  -H "Authorization: Bearer SEU_TOKEN"

# Filtrar por não lidas
curl "http://localhost:3000/api/notifications?isRead=false" \
  -H "Authorization: Bearer SEU_TOKEN"

# Filtrar por lidas
curl "http://localhost:3000/api/notifications?isRead=true" \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "userId": "...",
      "title": "Nova mensagem",
      "message": "Você recebeu uma nova mensagem",
      "type": "info",
      "isRead": false,
      "readAt": null,
      "metadata": {},
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

#### Marcar como lida

```bash
# Uma notificação
curl -X PATCH http://localhost:3000/api/notifications/ID_DA_NOTIFICACAO/read \
  -H "Authorization: Bearer SEU_TOKEN"

# Todas de uma vez
curl -X PATCH http://localhost:3000/api/notifications/read-all \
  -H "Authorization: Bearer SEU_TOKEN"
```

#### Contar não lidas

```bash
curl http://localhost:3000/api/notifications/unread-count \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "count": 12,
    "cached": true
  }
}
```

O campo `cached` indica se o valor veio do Redis (cache) ou do MongoDB.

#### Deletar notificação

```bash
curl -X DELETE http://localhost:3000/api/notifications/ID_DA_NOTIFICACAO \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Nota:** A notificação não é deletada fisicamente, apenas marcada como deletada (soft delete).

### Health Check

```bash
curl http://localhost:3000/api/health
```

## Estrutura do Projeto

```
notification-api/
├── src/
│   ├── config/          # Configurações (database, redis, env)
│   ├── models/          # Schemas do MongoDB
│   ├── repositories/    # Camada de acesso a dados
│   ├── services/        # Lógica de negócio
│   ├── controllers/     # Handlers das rotas
│   ├── middlewares/     # Autenticação, validação, erros
│   ├── routes/          # Definição de rotas
│   ├── validators/      # Schemas de validação
│   ├── utils/           # Funções auxiliares
│   └── app.js          # Setup da aplicação Express
├── tests/
│   ├── unit/           # Testes unitários
│   └── integration/    # Testes de integração
├── server.js           # Entry point do servidor
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## Arquitetura

A aplicação segue uma arquitetura em camadas:

```
Controllers → Services → Repositories → Models
```

- **Controllers**: Recebem requisições HTTP e retornam respostas
- **Services**: Contêm a lógica de negócio
- **Repositories**: Abstraem o acesso ao banco de dados
- **Models**: Definem os schemas do MongoDB

Esta separação facilita testes, manutenção e evolução do código.

## Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```env
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/notifications

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=seu_secret_super_seguro_aqui
JWT_EXPIRES_IN=7d

# Logs
LOG_LEVEL=info
```

**⚠️ IMPORTANTE:** Em produção, sempre use um `JWT_SECRET` forte e aleatório!

## Comandos Úteis

### Docker

```bash
# Iniciar
docker-compose up -d

# Parar
docker-compose down

# Rebuild
docker-compose up -d --build

# Ver logs
docker-compose logs -f
docker-compose logs -f app

# Entrar no container
docker-compose exec app sh
docker-compose exec mongo mongosh
docker-compose exec redis redis-cli

# Remover volumes
docker-compose down -v
```

### Desenvolvimento

```bash
# Instalar dependências
npm install

# Modo desenvolvimento (hot reload)
npm run dev

# Modo produção
npm start

# Testes
npm test
npm run test:coverage
npm run test:watch
```

### MongoDB

```bash
# Acessar MongoDB
docker-compose exec mongo mongosh notifications

# Comandos úteis:
show dbs
use notifications
show collections
db.notifications.find()
db.users.find()
db.notifications.countDocuments()
```

### Redis

```bash
# Acessar Redis
docker-compose exec redis redis-cli

# Comandos úteis:
KEYS *
GET unread_count:USER_ID
FLUSHALL  # Cuidado: limpa tudo!
```

## Troubleshooting

### Erro "Server returned nothing" no Postman/Insomnia

**Causa:** O servidor não está rodando.

**Solução:**
```bash
# 1. Verificar se há processo na porta 3000
# Windows PowerShell:
netstat -ano | findstr :3000

# 2. Se houver, matar o processo (substitua PID):
taskkill /PID <PID> /F

# 3. Iniciar o servidor
npm start
```

### Erro "EADDRINUSE: address already in use :::3000"

**Causa:** Já tem algo rodando na porta 3000 (provavelmente o container do Docker ou outro processo Node).

**Solução:**
```bash
# Se estiver usando Docker, pare o container da app:
docker-compose stop app

# Ou mate o processo manualmente (Windows):
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Depois inicie novamente:
npm start
```

### MongoDB não conecta (ECONNREFUSED 127.0.0.1:27017)

**Causa:** MongoDB não está rodando ou Docker Desktop não iniciou.

**Solução:**
```bash
# 1. Verificar se Docker Desktop está rodando (Windows/Mac)
#    Abra o Docker Desktop e aguarde inicializar

# 2. Verificar containers
docker ps

# 3. Se não aparecer mongo, subir containers:
docker-compose up -d mongo redis

# 4. Verificar logs
docker-compose logs mongo
```

### Aplicação não inicia

```bash
# Verificar logs
docker-compose logs app

# Verificar status dos containers
docker-compose ps
```

### Redis não conecta

```bash
# Ver logs do Redis
docker-compose logs redis

# Verificar se está rodando
docker-compose ps redis
```

**Nota:** Se o Redis estiver indisponível, a aplicação continua funcionando normalmente, apenas sem cache.

### Testes falhando

```bash
# Limpar cache do Jest
npm test -- --clearCache

# Rodar teste específico
npm test -- tests/unit/services/NotificationService.test.js

# Modo verbose
npm test -- --verbose
```

### Problemas com variáveis de ambiente no Windows

Se você está usando Windows e o comando `NODE_ENV=test` não funciona:

```bash
# Instalar cross-env
npm install -D cross-env

# Os scripts do package.json já usam cross-env
npm test
```

## Segurança

- Senhas hasheadas com bcrypt (salt rounds: 10)
- Autenticação JWT com expiração configurável
- Validação de entrada com Joi
- Headers de segurança com Helmet
- CORS habilitado
- Proteção contra MongoDB injection

## Próximos Passos

Para melhorias futuras e decisões técnicas detalhadas, veja o arquivo [NOTES.md](./NOTES.md).

## Licença

MIT