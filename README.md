# k8s-lab — app Node para praticar Kubernetes

Servidor HTTP em Node **sem nenhuma dependência** (só o módulo `http` nativo).
As rotas existem para você provocar os comportamentos do Kubernetes quando for
montar os manifestos.

## Rodar

```bash
npm start              # porta 3000
PORT=3001 npm start    # sua 3000 está ocupada por outro app
npm run dev            # com --watch
```

## Rotas

| Rota | O que faz |
|---|---|
| `GET /` | Nome do pod (hostname), nó, versão e contador de requisições |
| `GET /info` | Config vinda do ambiente (mostra só o tamanho de `API_KEY`) |
| `GET /healthz` | Alvo de **liveness probe** |
| `GET /readyz` | Alvo de **readiness probe** |
| `GET /toggle-ready` | Liga/desliga o readiness — o pod sai do Service sem reiniciar |
| `GET /kill` | Faz o liveness falhar — o container é reiniciado |
| `GET /load` | Queima CPU por ~300 ms — para provocar o HPA |

## Variáveis de ambiente

| Variável | Padrão | Ideia |
|---|---|---|
| `PORT` | `3000` | porta do servidor |
| `APP_NAME` | `k8s-lab` | ConfigMap |
| `GREETING` | `Olá` | ConfigMap |
| `APP_VERSION` | `v1` | ConfigMap (útil para ver rollout) |
| `API_KEY` | — | Secret |
| `NODE_NAME` | — | Downward API (`spec.nodeName`) |

O servidor trata `SIGTERM` com graceful shutdown: para de aceitar tráfego novo,
espera 2 s e encerra — então dá para ver um rollout sem derrubar requisição.
