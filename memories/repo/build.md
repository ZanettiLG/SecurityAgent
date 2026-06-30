# Build & Dev

> Atualizado: 2026-06-30

## Serviços

```bash
# Todos os serviços (exceto vLLM que precisa de GPU)
docker compose up -d

# vLLM (requer GPU NVIDIA)
docker compose --profile gpu up -d vllm

# Desenvolvimento (back + dashboard)
npm run dev
```

## vLLM

```bash
# Ver logs
docker logs -f vllm-lfm-thinking

# Trocar modelo: editar LLM_MODEL no .env e recriar
docker compose --profile gpu up -d --force-recreate vllm

# Testar endpoint
curl http://localhost:11434/v1/models
```

## Testes

```bash
npx vitest run
```
