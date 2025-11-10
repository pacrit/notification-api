# NOTES

## Por que express e não meteor?
meteor é overkill pra API REST simples. só precisava de endpoints
meteor faz sentido se for adicionar websockets depois, mas por hora express resolve

## TODO
- [ ] rate limiting (talvez express-rate-limit?)
- [ ] refresh tokens - IMPORTANTE
- [ ] websockets quando tiver tempo

## Soft delete
tá funcionando mas queries ficam chatas. sempre tem que lembrar de filtrar deletedAt
alternativa: mover pra collection de archived depois de X meses?

## Cache
redis só no contador. cachear lista completa dá muito problema de invalidação
ttl de 5min tá ok

## Problemas
- jwt não revoga, precisa blacklist no redis
- paginação offset pode dar problema se dados mudarem muito (cursor-based seria melhor mas é + complexo)

## Testes
75% coverage, falta testar edge cases dos validators