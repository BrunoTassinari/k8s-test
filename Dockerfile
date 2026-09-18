FROM node:22-alpine

WORKDIR /app

# Sem dependências externas: só o package.json e o código.
COPY package.json ./
COPY src ./src

# Rodar como usuário não-root (o node:alpine já traz o usuário "node").
USER node

ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/server.js"]
