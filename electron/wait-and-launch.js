// Waits for React dev server then launches Electron
const { execSync, spawn } = require('child_process');

function waitFor(url, maxMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      execSync(`node -e "require('http').get('${url}', r => process.exit(0)).on('error', () => process.exit(1))"`, { stdio: 'ignore' });
      return true;
    } catch (_) {
      // not ready yet
      const wait = ms => { const t = Date.now() + ms; while (Date.now() < t) {} };
      wait(500);
    }
  }
  return false;
}

console.log('[launcher] Waiting for React on http://localhost:3000...');
if (waitFor('http://localhost:3000')) {
  console.log('[launcher] React ready — launching Electron');
  const el = spawn('npx', ['electron', '.'], { stdio: 'inherit', shell: true });
  el.on('exit', code => process.exit(code || 0));
} else {
  console.error('[launcher] Timeout waiting for React');
  process.exit(1);
}
