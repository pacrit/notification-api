# API de Notificações

Sistema de notificações para usuários usando Node.js, MongoDB e Redis.

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

### Com Docker (Recomendado)

```bash
# Clonar o repositório
git clone <url-do-repo>
cd notification-api

# Copiar variáveis de ambiente
cp .env.example .env

# Subir os containers
docker-compose up -d

# Ver os logs
docker-compose logs -f
```

A API estará disponível em `http://localhost:3000`

### Sem Docker

```bash
# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
# Edite o .env com suas credenciais do MongoDB e Redis

# Rodar em desenvolvimento
npm run dev

# Ou em produção
npm start
```

## Executando os Testes

```bash
# Todos os testes
npm test

# Com cobertura
npm run test:coverage

# Modo watch
npm run test:watch
```

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

### Aplicação não inicia

```bash
# Verificar logs
docker-compose logs app

# Verificar status dos containers
docker-compose ps
```

### MongoDB não conecta

```bash
# Ver logs do MongoDB
docker-compose logs mongo

# Verificar se está rodando
docker-compose ps mongo
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