#!/usr/bin/env node

/**
 * Script om automatisch de changelog bij te werken
 * Gebruik: node scripts/update-changelog.js [version] [type] [changes...]
 *
 * Voorbeelden:
 * node scripts/update-changelog.js 1.2.0 minor "Nieuwe feature toegevoegd" "Bug fix"
 * node scripts/update-changelog.js 2.0.0 major "Complete redesign" "Nieuwe API"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Haal command line argumenten op
const args = process.argv.slice(2);

if (args.length < 3) {
  console.log('❌ Gebruik: node scripts/update-changelog.js [version] [type] [changes...]');
  console.log('');
  console.log('Voorbeelden:');
  console.log('  node scripts/update-changelog.js 1.2.0 minor "Nieuwe feature" "Bug fix"');
  console.log('  node scripts/update-changelog.js 2.0.0 major "Complete redesign"');
  console.log('');
  console.log('Types: major, minor, patch');
  process.exit(1);
}

const [version, type, ...changes] = args;

// Valideer type
if (!['major', 'minor', 'patch'].includes(type)) {
  console.log('❌ Type moet major, minor of patch zijn');
  process.exit(1);
}

// Valideer versie formaat
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.log('❌ Versie moet in formaat x.y.z zijn (bijv. 1.2.0)');
  process.exit(1);
}

// Genereer datum
const today = new Date().toISOString().split('T')[0];

// Maak nieuwe changelog entry
const newEntry = {
  version,
  date: today,
  type,
  changes,
};

console.log('📝 Nieuwe changelog entry:');
console.log(JSON.stringify(newEntry, null, 2));

// Lees huidige changelog
const changelogPath = path.join(__dirname, '..', 'src', 'utils', 'changelog.ts');
let changelogContent = fs.readFileSync(changelogPath, 'utf8');

// Voeg nieuwe entry toe aan het begin van de array
const changelogArrayStart = changelogContent.indexOf(
  'export const changelog: ChangelogEntry[] = [',
);
const changelogArrayEnd = changelogContent.indexOf(']', changelogArrayStart);

if (changelogArrayStart === -1 || changelogArrayEnd === -1) {
  console.log('❌ Kon changelog array niet vinden in changelog.ts');
  process.exit(1);
}

// Maak nieuwe entry string
const newEntryString = `  {
    version: '${version}',
    date: '${today}',
    type: '${type}',
    changes: [
${changes.map((change) => `      '${change.replace(/'/g, "\\'")}'`).join(',\n')}
    ]
  },`;

// Voeg nieuwe entry toe
const beforeArray = changelogContent.substring(0, changelogArrayStart + 45); // +45 voor de array declaratie
const afterArray = changelogContent.substring(changelogArrayEnd);

const updatedContent = beforeArray + '\n' + newEntryString + '\n' + afterArray;

// Schrijf terug naar bestand
fs.writeFileSync(changelogPath, updatedContent);

console.log('✅ Changelog succesvol bijgewerkt!');
console.log(`📅 Versie ${version} (${type}) toegevoegd met ${changes.length} wijzigingen`);

// Update ook package.json versie als die bestaat
const packagePath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  packageJson.version = version;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log('📦 Package.json versie bijgewerkt naar', version);
}
