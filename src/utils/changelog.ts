// Changelog utility voor het bijhouden van versie-informatie
export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
  type: 'major' | 'minor' | 'patch';
}

// Automatisch gegenereerde changelog entries (nieuwste altijd bovenaan)
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
];

// Huidige appversie gebaseerd op laatste changelog-entry
export function getCurrentVersion(): string {
  return changelog.length > 0 ? changelog[0].version : '0.0.0';
}

// Haal de laatste changelog-entry op
export function getLatestChangelog(): ChangelogEntry | null {
  return changelog.length > 0 ? changelog[0] : null;
}

// Vergelijk versies om te zien of er een update is
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

// Parse een semver string
function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const parts = version.split('.').map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  };
}

// Filter changelog op type
export function getChangelogByType(type: 'major' | 'minor' | 'patch'): ChangelogEntry[] {
  return changelog.filter((entry) => entry.type === type);
}

// Haal alle entries sinds een bepaalde versie op
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
