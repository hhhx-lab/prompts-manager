import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const env = loadEnvFiles();
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const apiPort = env.API_PORT || env.PORT || '8787';
const apiBaseUrl = env.VITE_API_BASE_URL || `http://127.0.0.1:${apiPort}`;
const webUrl = 'http://127.0.0.1:3000';
const children = new Map();
let shuttingDown = false;

console.log('');
console.log('PromptMaster Pro dev stack');
console.log(`- Web: ${webUrl}`);
console.log(`- API: ${apiBaseUrl}`);
console.log(`- Model: ${env.LLM_MODEL || env.MODEL_NAME || 'gpt-5.5'} (${env.LLM_BASE_URL || env.MODEL_BASE_URL ? 'configured base url' : 'missing LLM_BASE_URL'})`);
console.log('');

start('api', ['run', 'dev:api']);
start('web', ['run', 'dev:web']);

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

function start(name, args) {
  const child = spawn(npmBin, args, {
    cwd: rootDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  children.set(name, child);
  pipeWithPrefix(name, child.stdout);
  pipeWithPrefix(name, child.stderr);
  child.on('exit', (code, signal) => {
    children.delete(name);
    if (shuttingDown) return;
    const exitCode = code ?? (signal ? 1 : 0);
    console.log(`[${name}] exited with ${signal || exitCode}`);
    if (exitCode !== 0) shutdown(exitCode);
    else if (children.size === 0) process.exit(0);
  });
}

function pipeWithPrefix(name, stream) {
  let buffer = '';
  stream.on('data', chunk => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.trim()) console.log(`[${name}] ${line}`);
    }
  });
  stream.on('end', () => {
    if (buffer.trim()) console.log(`[${name}] ${buffer}`);
  });
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('');
  console.log('Stopping dev stack...');
  for (const [name, child] of children.entries()) {
    console.log(`- stopping ${name}`);
    child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(code), 800);
}

function loadEnvFiles() {
  const nextEnv = { ...process.env };
  for (const filename of ['.env.local', '.env']) {
    const filePath = path.join(rootDir, filename);
    if (!existsSync(filePath)) continue;
    const text = readFileSync(filePath, 'utf8');
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#') || !line.includes('=')) continue;
      const index = line.indexOf('=');
      const key = line.slice(0, index).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || nextEnv[key] !== undefined) continue;
      nextEnv[key] = unquoteEnvValue(line.slice(index + 1).trim());
    }
  }
  return nextEnv;
}

function unquoteEnvValue(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}
