#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Semver versie verhoging functies
const bumpVersion = (currentVersion, type) => {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
};

// Commit type naar versie type mapping
const getVersionType = (commitMessage) => {
  const firstLine = commitMessage.split('\n')[0].toLowerCase();
  
  if (firstLine.includes('breaking change') || firstLine.startsWith('major:')) {
    return 'major';
  }
  
  if (firstLine.startsWith('feat:') || firstLine.startsWith('feature:')) {
    return 'minor';
  }
  
  // Default voor fix, chore, docs, refactor, etc.
  return 'patch';
};

// Changelog entry toevoegen
const addChangelogEntry = (version, commitMessage, type) => {
  const changelogPath = path.join(__dirname, '..', 'src', 'utils', 'changelog.ts');
  
  // Lees bestaande changelog
  let changelogContent = '';
  try {
    changelogContent = fs.readFileSync(changelogPath, 'utf8');
  } catch {
    // Maak nieuwe changelog als het bestand niet bestaat
    changelogContent = `export interface ChangelogEntry {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  changes: string[];
}

export const changelog: ChangelogEntry[] = [];
`;
  }
  
  // Haal de changelog array uit de content
  const changelogMatch = changelogContent.match(/export const changelog: ChangelogEntry\[\] = (\[[\s\S]*?\]);/);
  
  if (!changelogMatch) {
    console.error('❌ Kon changelog array niet vinden');
    return;
  }
  
  let changelogArray = changelogMatch[1];
  
  // Maak nieuwe entry
  const today = new Date().toISOString().split('T')[0];
  const commitTitle = commitMessage.split('\n')[0];
  
  const newEntry = `  {
    version: "${version}",
    date: "${today}",
    type: "${type}",
    changes: ["${commitTitle.replace(/"/g, '\\"')}"]
  }`;
  
  // Voeg nieuwe entry toe aan begin van array
  if (changelogArray === '[]') {
    changelogArray = `[\n${newEntry}\n]`;
  } else {
    changelogArray = changelogArray.replace('[', `[\n${newEntry},`);
  }
  
  // Vervang de changelog array in de content
  const newContent = changelogContent.replace(
    /export const changelog: ChangelogEntry\[\] = (\[[\s\S]*?\]);/,
    `export const changelog: ChangelogEntry[] = ${changelogArray};`
  );
  
  // Schrijf terug naar bestand
  fs.writeFileSync(changelogPath, newContent);
  console.log(`✅ Changelog entry toegevoegd voor versie ${version}`);
};

// Hoofdfunctie
const main = () => {
  try {
    // Lees commit message uit stdin (wordt door git hook doorgegeven)
    const commitMessage = fs.readFileSync(0, 'utf8').trim();
    
    if (!commitMessage) {
      console.log('ℹ️ Geen commit message gevonden, skipping versie verhoging');
      return;
    }
    
    // Bepaal versie type
    const versionType = getVersionType(commitMessage);
    
    // Lees huidige versie
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const currentVersion = packageJson.version;
    
    // Bereken nieuwe versie
    const newVersion = bumpVersion(currentVersion, versionType);
    
    if (newVersion === currentVersion) {
      console.log(`ℹ️ Versie blijft ${currentVersion} (geen verhoging nodig)`);
      return;
    }
    
    // Update package.json
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    
    // Update version.json
    const versionJsonPath = path.join(__dirname, '..', 'public', 'version.json');
    const versionData = {
      version: newVersion,
      date: new Date().toISOString()
    };
    fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2) + '\n');
    
    // Voeg changelog entry toe
    addChangelogEntry(newVersion, commitMessage, versionType);
    
    console.log(`✅ Versie verhoogd van ${currentVersion} naar ${newVersion} (${versionType})`);
    console.log(`📝 Commit: ${commitMessage.split('\n')[0]}`);
    
  } catch (error) {
    console.error('❌ Fout bij automatische versie verhoging:', error);
    process.exit(1);
  }
};

// Voer script uit
main(); 