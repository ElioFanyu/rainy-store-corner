import http from 'node:http';
import os from 'node:os';
import { readFile, stat, writeFile, unlink, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

/* 本地静态服务器
 * - 提供模型页面
 * - /__health 供桌面启动器探测
 * - 页面心跳消失一段时间后自动退出，避免后台常驻
 */

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4321);
const IDLE_MS = Number(process.env.IDLE_MS || 120000);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const stateDir = join(os.tmpdir(), 'RainyStoreCorner');
const pidFile = join(stateDir, 'server.pid');

let lastBeat = 0;
let sawHeartbeat = false;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/__health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, pid: process.pid, uptime: process.uptime() }));
    return;
  }

  if (url.pathname === '/__beat') {
    lastBeat = Date.now();
    sawHeartbeat = true;
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*' }).end();
    return;
  }

  try {
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = '/index.html';
    const filePath = normalize(join(root, pathname));
    if (!filePath.startsWith(root)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    const info = await stat(filePath);
    if (!info.isFile()) {
      res.writeHead(404).end('not found');
      return;
    }
    const data = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('not found');
  }
});

async function shutdown(code = 0) {
  try {
    await unlink(pidFile);
  } catch { /* 进程表已不在 */ }
  server.close(() => process.exit(code));
  setTimeout(() => process.exit(code), 800).unref();
}

server.on('error', async (err) => {
  if (err.code === 'EADDRINUSE') {
    // 端口已被占：说明已有实例在跑，本进程安静退出
    console.log(`port ${port} already in use`);
    process.exit(0);
  }
  console.error(err);
  process.exit(1);
});

server.listen(port, '127.0.0.1', async () => {
  try {
    await mkdir(stateDir, { recursive: true });
    await writeFile(pidFile, String(process.pid), 'utf8');
  } catch { /* 临时目录不可写也不影响运行 */ }
  console.log(`RAINY STORE CORNER  ->  http://127.0.0.1:${port}`);
});

// 页面关闭后自动收尾
setInterval(() => {
  if (!sawHeartbeat) return;
  if (Date.now() - lastBeat > IDLE_MS) {
    console.log('no heartbeat, shutting down');
    shutdown(0);
  }
}, 5000).unref();

for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => shutdown(0));
}
