#!/usr/bin/env node

/**
 * Script om de Rafi server automatisch te deployen naar Vercel
 *
 * Gebruik:
 * node scripts/deploy-rafi-server.js
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const EXPRESS_DIR = 'src-pwa/express';
const VERCEL_CONFIG = 'vercel.json';

console.log('🚀 Rafi Server Deployment Script');
console.log('================================');

// Controleer of we in de juiste directory zijn
if (!existsSync(EXPRESS_DIR)) {
  console.error('❌ Express directory niet gevonden:', EXPRESS_DIR);
  console.error('Zorg ervoor dat je in de root van het project bent');
  process.exit(1);
}

// Controleer of vercel.json bestaat
if (!existsSync(join(EXPRESS_DIR, VERCEL_CONFIG))) {
  console.error('❌ vercel.json niet gevonden in:', EXPRESS_DIR);
  console.error('Maak eerst een vercel.json bestand aan');
  process.exit(1);
}

try {
  console.log('📁 Ga naar express directory...');
  process.chdir(EXPRESS_DIR);

  console.log('🔍 Controleer Vercel CLI...');
  try {
    execSync('vercel --version', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Vercel CLI niet geïnstalleerd');
    console.log('Installeer Vercel CLI: npm install -g vercel');
    process.exit(1);
  }

  console.log('🚀 Start deployment...');
  console.log('⚠️  Zorg ervoor dat je environment variables hebt ingesteld:');
  console.log('   - OPENAI_API_KEY');
  console.log('   - OPENAI_MODEL');
  console.log('   - ALLOWED_ORIGIN');
  console.log('   - RATE_LIMIT_MAX_PER_MIN');
  console.log('   - RULES_VERSION');
  console.log('');

  // Start Vercel deployment
  execSync('vercel --prod', { stdio: 'inherit' });

  console.log('');
  console.log('✅ Deployment voltooid!');
  console.log('');
  console.log('📋 Volgende stappen:');
  console.log('1. Controleer de deployment URL in de Vercel dashboard');
  console.log('2. Test de health endpoint: curl https://your-project.vercel.app/api/health');
  console.log('3. Update VITE_API_BASE_URL in de frontend .env file');
  console.log('4. Deploy de frontend met de nieuwe API URL');
} catch (error) {
  console.error('❌ Deployment gefaald:', error.message);
  process.exit(1);
}
