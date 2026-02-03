#!/usr/bin/env node
/**
 * Cleans .next folder and kills Node processes.
 * Run before npm run dev if you get EPERM errors.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const nextDir = path.join(process.cwd(), '.next');

try {
  console.log('Stopping Node processes...');
  if (process.platform === 'win32') {
    execSync('taskkill /F /IM node.exe', { stdio: 'pipe', windowsHide: true });
  } else {
    execSync('pkill -f node || true', { stdio: 'pipe' });
  }
} catch {
  // Ignore - no node processes or already stopped
}

console.log('Waiting 2s for locks to release...');
const start = Date.now();
while (Date.now() - start < 2000) {
  // busy wait
}

if (fs.existsSync(nextDir)) {
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('Cleaned .next folder');
  } catch (err) {
    console.error('Could not delete .next - close all terminals and try again:', err.message);
    process.exit(1);
  }
} else {
  console.log('.next folder already removed');
}
