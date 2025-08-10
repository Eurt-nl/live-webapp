#!/usr/bin/env node

/**
 * Script om de Rafi server te starten
 * Gebruik: node scripts/start-rafi-server.js
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Rafi Server...');

// Start de Express server
const expressServer = spawn('node', ['index.js'], {
  cwd: path.join(__dirname, '../src-pwa/express'),
  stdio: 'inherit',
});

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
  console.log('\n🛑 Shutting down Rafi server...');
  expressServer.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Rafi server...');
  expressServer.kill('SIGTERM');
});
