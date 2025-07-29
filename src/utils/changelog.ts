// Changelog utility voor het bijhouden van versie-informatie
export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
  type: 'major' | 'minor' | 'patch';
}

// Automatisch gegenereerde changelog entries
export const changelog: ChangelogEntry[] = [
  {
    version: '1.2.0',
    date: '2024-12-19',
    type: 'minor',
    changes: [
      'Nieuwe eventsysteem geïmplementeerd zonder vooraf inschrijven',
      'Events verschijnen als pop-ups op homepage binnen 300m en 30 minuten',
      'Bulk event aanmaak functionaliteit toegevoegd (recurring events)',
      'Moderator systeem toegevoegd voor events',
      'Verbeterde homepage met logo en "is live!" tekst',
      'Hamburger menu toegevoegd in plaats van logo',
      'Event bewerken geblokkeerd na start van event',
      'Event archiveren alleen mogelijk na datum van event',
      'Verbeterde MyEventsPage met sortering op datum/tijd',
      'CreateEventPage uitgebreid met moderator selectie',
      'Recurring events met interval selectie (dag/week/maand)',
      'Verbeterde datum/tijd verwerking zonder tijdzone problemen',
    ],
  },
  {
    version: '1.0.0',
    date: '2024-01-15',
    type: 'major',
    changes: [
      'Eerste release van de Pitch & Putt app',
      'Basis functionaliteit voor banen, spelers en events',
      'PWA ondersteuning met offline functionaliteit',
      'Push notificatie systeem (later verwijderd)',
      'Capacitor integratie voor native features',
    ],
  },
  {
    version: '1.1.0',
    date: '2024-01-16',
    type: 'minor',
    changes: [
      'Automatische update notificaties toegevoegd',
      'Verbeterde PWA installatie flow',
      'Changelog systeem geïmplementeerd',
      'Betere error handling voor service worker updates',
    ],
  },
];

// Functie om de huidige app versie op te halen
export function getCurrentVersion(): string {
  // Gebruik package.json versie of een fallback
  return import.meta.env.VITE_APP_VERSION || '1.2.0';
}

// Functie om de laatste changelog entry op te halen
export function getLatestChangelog(): ChangelogEntry | null {
  return changelog.length > 0 ? changelog[0] : null;
}

// Functie om changelog entries te vergelijken
export function hasNewVersion(currentVersion: string, latestVersion: string): boolean {
  const current = parseVersion(currentVersion);
  const latest = parseVersion(latestVersion);

  return (
    latest.major > current.major ||
    (latest.major === current.major && latest.minor > current.minor) ||
    (latest.major === current.major &&
      latest.minor === current.minor &&
      latest.patch > current.patch)
  );
}

// Helper functie om versie strings te parsen
function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const parts = version.split('.').map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  };
}

// Functie om changelog entries te filteren op type
export function getChangelogByType(type: 'major' | 'minor' | 'patch'): ChangelogEntry[] {
  return changelog.filter((entry) => entry.type === type);
}

// Functie om changelog entries sinds een bepaalde versie op te halen
export function getChangelogSince(version: string): ChangelogEntry[] {
  const targetVersion = parseVersion(version);

  return changelog.filter((entry) => {
    const entryVersion = parseVersion(entry.version);
    return (
      entryVersion.major > targetVersion.major ||
      (entryVersion.major === targetVersion.major && entryVersion.minor > targetVersion.minor) ||
      (entryVersion.major === targetVersion.major &&
        entryVersion.minor === targetVersion.minor &&
        entryVersion.patch > targetVersion.patch)
    );
  });
}
