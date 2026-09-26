import { spawn } from 'child_process';

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('\x1b[36m%s\x1b[0m', '[BACKEND] Starting Express API on http://localhost:5000...');
const backend = spawn(npmCmd, ['run', 'dev'], { cwd: 'backend', stdio: 'inherit', shell: true });

console.log('\x1b[32m%s\x1b[0m', '[FRONTEND] Starting Next.js 15 on http://localhost:3000...');
const frontend = spawn(npmCmd, ['run', 'dev'], { cwd: 'frontend', stdio: 'inherit', shell: true });

process.on('SIGINT', () => {
  backend.kill();
  frontend.kill();
  process.exit();
});

process.on('exit', () => {
  backend.kill();
  frontend.kill();
});
