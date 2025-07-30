#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const versionJsonPath = path.join(__dirname, '..', 'public', 'version.json');

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version;
  const currentDate = new Date().toISOString();

  // Create version.json content
  const versionData = {
    version: currentVersion,
    date: currentDate
  };

  // Write to version.json
  fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2));
  
  console.log(`✅ Updated version.json with version ${currentVersion} and date ${currentDate}`);
} catch (error) {
  console.error('❌ Error updating version.json:', error);
  process.exit(1);
} 