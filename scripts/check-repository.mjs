// 提交前辅助检查：只读，不替代完整业务、隐私和许可证审查。
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, resolve, extname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [], warnings = [], files = [];
const secretPatterns = [/gh[pousr]_[A-Za-z0-9]{30,}/, /github_pat_[A-Za-z0-9_]{40,}/, /AKIA[0-9A-Z]{16}/, /sk-(?:proj-)?[A-Za-z0-9_-]{40,}/, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = resolve(dir, entry.name), rel = relative(root, file);
    if (entry.name === '.git' && dir === root) continue;
    if (entry.isSymbolicLink()) { errors.push(`请核对符号链接：${rel}`); continue; }
    if (['.git', '.manus', '.manus-webdev', '.work', '.ai-memory'].includes(entry.name) || /^\.env(?:\.|$)/.test(entry.name) && !['.env.example', '.env.sample'].includes(entry.name) || /\.(pem|key|p12|pfx|tmp|bak)$/i.test(entry.name)) {
      errors.push(`不应包含本地管理或敏感文件：${rel}`); continue;
    }
    if (entry.isDirectory()) { if (entry.name !== 'node_modules') await walk(file); }
    else if (entry.isFile()) files.push(file);
  }
}
await walk(root);
let refs = 0;
for (const file of files) {
  const rel = relative(root, file), size = (await stat(file)).size, ext = extname(file);
  if (size > 100 * 1024 * 1024) errors.push(`超过 GitHub 普通 Git 单文件限制：${rel}`);
  else if (size > 25 * 1024 * 1024) warnings.push(`网页上传单文件超过 25 MiB：${rel}`);
  if (['.js', '.mjs'].includes(ext)) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) errors.push(`JS 语法检查失败：${rel}\n${result.stderr || result.error || ''}`);
  }
  if (!['.html', '.css', '.js', '.mjs', '.json', '.md'].includes(ext)) continue;
  const text = await readFile(file, 'utf8');
  if (secretPatterns.some(pattern => pattern.test(text))) errors.push(`发现疑似凭据，请人工确认：${rel}`);
  // 不检查本工具源码中的正则字符串；资源检查仅针对两站源码。
  if (!rel.startsWith(`okki-chat${sep}site${sep}`) && !rel.startsWith(`okkicrm${sep}site${sep}`)) continue;
  const patterns = ext === '.html' ? [/(?:src|href)\s*=\s*["']([^"']+)["']/g] : ext === '.css' ? [/url\(\s*["']?([^"')\s]+)["']?\s*\)/g] : ext === '.js' ? [/(?:from\s+|import\s*)["']([^"']+)["']/g, /["']((?:\.\/)?assets\/[^"'`]+\.(?:jpg|png|svg|webp))["']/g] : [];
  for (const pattern of patterns) for (const match of text.matchAll(pattern)) {
    const url = match[1];
    if (!url || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url) || /[$}{]/.test(url)) continue;
    const projectRoot = resolve(root, rel.split(sep)[0], 'site');
    const target = url.startsWith('/') ? resolve(projectRoot, `.${url.split(/[?#]/)[0]}`) : resolve(dirname(file), decodeURIComponent(url.split(/[?#]/)[0]));
    if (target !== projectRoot && !target.startsWith(projectRoot + sep)) { errors.push(`资源越出站点目录：${rel} → ${url}`); continue; }
    refs++;
    try { await stat(target); } catch { errors.push(`缺少静态依赖：${rel} → ${url}`); }
  }
}
for (const message of warnings) console.warn(`提醒：${message}`);
for (const message of errors) console.error(`错误：${message}`);
console.log(`已检查 ${files.length} 个文件、${refs} 条静态本地引用；${errors.length} 个错误，${warnings.length} 个提醒。`);
process.exitCode = errors.length ? 1 : 0;
