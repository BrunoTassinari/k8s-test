const http = require('http');
const os = require('os');

const PORT = process.env.PORT || 3000;
const APP_NAME = process.env.APP_NAME || 'k8s-lab';
const GREETING = process.env.GREETING || 'Olá';
const API_KEY = process.env.API_KEY || '(nao definida)';
const VERSION = process.env.APP_VERSION || 'v1';

// Estado usado para brincar com os probes: /toggle-ready derruba o readiness
// e o Kubernetes tira o pod do Service sem reiniciar o container.
let ready = true;
let healthy = true;
const startedAt = Date.now();
let requests = 0;

const routes = {
  '/': (req, res) => json(res, 200, {
    message: `${GREETING}, mundo! Eu sou o pod ${os.hostname()}`,
    app: APP_NAME,
    version: VERSION,
    pod: os.hostname(),
    node: process.env.NODE_NAME || '(desconhecido)',
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    requests,
  }),

  '/info': (req, res) => json(res, 200, {
    app: APP_NAME,
    version: VERSION,
    greeting: GREETING,
    // mostra só o tamanho: serve para provar que o Secret chegou sem vazar valor
    apiKeyLength: API_KEY.length,
    nodeVersion: process.version,
    memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
  }),

  '/healthz': (req, res) => healthy
    ? json(res, 200, { status: 'ok' })
    : json(res, 500, { status: 'unhealthy' }),

  '/readyz': (req, res) => ready
    ? json(res, 200, { status: 'ready' })
    : json(res, 503, { status: 'not-ready' }),

  '/toggle-ready': (req, res) => {
    ready = !ready;
    json(res, 200, { ready });
  },

  '/kill': (req, res) => {
    // derruba o liveness: o kubelet vai reiniciar o container em alguns segundos
    healthy = false;
    json(res, 200, { healthy, aviso: 'liveness vai falhar e o container sera reiniciado' });
  },

  '/load': (req, res) => {
    // queima CPU por ~300ms, útil para ver o HPA escalar
    const end = Date.now() + 300;
    let n = 0;
    while (Date.now() < end) n += Math.sqrt(n + 1);
    json(res, 200, { done: true, n: Math.round(n) });
  },
};

function json(res, status, body) {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(payload + '\n');
}

const server = http.createServer((req, res) => {
  requests++;
  const path = req.url.split('?')[0];
  const handler = routes[path];
  console.log(JSON.stringify({ ts: new Date().toISOString(), method: req.method, path, pod: os.hostname() }));
  if (handler) return handler(req, res);
  json(res, 404, { error: 'rota nao encontrada', rotas: Object.keys(routes) });
});

server.listen(PORT, () => console.log(`${APP_NAME} ${VERSION} ouvindo na porta ${PORT} (pod ${os.hostname()})`));

// Sem isso o pod morre no braço durante um rollout e algumas requisições caem.
function shutdown(signal) {
  console.log(`recebi ${signal}, encerrando com elegancia...`);
  ready = false; // para de receber trafego novo
  setTimeout(() => {
    server.close(() => process.exit(0));
  }, 2000);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
