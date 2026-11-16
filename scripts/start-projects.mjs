// 在指定目录中运行两个保留项目；不修改业务源码，不连接真实 CRM。
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const basePort = Number(process.env.OKKI_BASE_PORT || 8181);
if (!Number.isInteger(basePort) || basePort < 1024 || basePort > 65533) throw new Error('OKKI_BASE_PORT 必须为 1024–65533 的整数');
const projects = [
  { name: '智能销售与 AI 背调', dir: 'okkicrm/site', spa: false },
  { name: 'AI 对话、邮件与 WhatsApp（含分支最新动效）', dir: 'okki-chat/site', spa: false },
];
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.gif':'image/gif', '.ico':'image/x-icon', '.woff':'font/woff', '.woff2':'font/woff2', '.ttf':'font/ttf', '.mp4':'video/mp4', '.pdf':'application/pdf' };
const servers=[];
for (const p of projects) {
  const dir = resolve(root, p.dir);
  if (!existsSync(resolve(dir, 'index.html'))) throw new Error(`缺少 ${p.dir}/index.html，请检查保留项目的网页文件`);
}
try {
  for (const [i, p] of projects.entries()) {
    const dir = resolve(root, p.dir), port = basePort+i;
    let existing = false;
    try {
      const response = await fetch(`http://127.0.0.1:${port}/__okki_local_health__`, { signal: AbortSignal.timeout(1000) });
      const health = await response.json();
      existing = response.ok && health.root === root && health.dir === p.dir;
    } catch {}
    if (existing) {
      console.log(`${p.name}（已运行，复用）: http://127.0.0.1:${port}/`);
      continue;
    }
    const server = createServer(async (req,res) => {
      if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405, {'Allow':'GET, HEAD'}).end(); return; }
      try {
        const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
        if (pathname === '/__okki_local_health__') {
          const body = JSON.stringify({ root, dir: p.dir, name: p.name });
          res.writeHead(200, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' }).end(req.method === 'HEAD' ? undefined : body);
          return;
        }
        if (pathname === '/favicon.ico' && !existsSync(resolve(dir,'favicon.ico'))) { res.writeHead(204).end(); return; }
        let file=resolve(dir, '.'+pathname);
        if (file!==dir && !file.startsWith(dir+sep)) { res.writeHead(403).end('Forbidden'); return; }
        try { if((await stat(file)).isDirectory()) file=resolve(file,'index.html'); }
        catch { if(p.spa && !extname(pathname)) file=resolve(dir,'index.html'); }
        const body=await readFile(file);
        res.writeHead(200, {'Content-Type':mime[extname(file)]||'application/octet-stream', 'Content-Length':body.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
        res.end(req.method === 'HEAD' ? undefined : body);
      } catch(e) { res.writeHead(e instanceof URIError ? 400 : 404, {'Content-Type':'text/plain; charset=utf-8'}).end('文件不存在或 URL 无效'); }
    });
    servers.push(server);
    await new Promise((ok,fail) => { server.once('error',fail); server.listen(port,'127.0.0.1',ok); });
    console.log(`${p.name}: http://127.0.0.1:${port}/`);
  }
  console.log(`\n${projects.length} 个项目可用，目录：${root}。所有业务保持原有本地演示模式。`);
  if (servers.length) console.log('关闭窗口或按 Ctrl+C 停止本次新建的服务；已复用的服务不受影响。');
  else console.log('全部复用已有服务，可关闭此窗口。');
  if (!process.argv.includes('--no-open') && process.platform==='win32') {
    for (let i=0;i<projects.length;i++) spawn('cmd.exe',['/d','/c','start','',`http://127.0.0.1:${basePort+i}/`],{stdio:'ignore',windowsHide:true});
  }
} catch(e) {
  for(const s of servers) s.close();
  console.error('启动失败：',e.message,'\n若端口被占用，请设置 OKKI_BASE_PORT 为其他起始端口后重试。');
  process.exitCode=1;
}
function stop(){ for(const s of servers) s.close(); }
process.on('SIGINT',stop); process.on('SIGTERM',stop);
