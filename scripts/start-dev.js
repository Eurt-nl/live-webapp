#!/usr/bin/env node

/**
 * Script om de volledige development omgeving te starten
 * Gebruik: node scripts/start-dev.js
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Development Environment...');
console.log('📡 Rafi Server: http://localhost:3000');
console.log('🌐 Frontend: https://localhost:9000');

// Start de Express server
const expressServer = spawn('node', ['index.js'], {
  cwd: path.join(__dirname, '../src-pwa/express'),
  stdio: 'inherit',
});

// Wacht even en start dan de frontend
setTimeout(() => {
  console.log('🌐 Starting Frontend...');

  const frontendServer = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });

  frontendServer.on('error', (error) => {
    console.error('❌ Failed to start frontend:', error);
  });

  frontendServer.on('close', (code) => {
    console.log(`📴 Frontend server exited with code ${code}`);
    expressServer.kill('SIGINT');
    process.exit(code);
  });
}, 2000);

expressServer.on('error', (error) => {
  console.error('❌ Failed to start Express server:', error);
  process.exit(1);
});

expressServer.on('close', (code) => {
  console.log(`📴 Express server exited with code ${code}`);
  process.exit(code);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development environment...');
  expressServer.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down development environment...');
  expressServer.kill('SIGTERM');
});
