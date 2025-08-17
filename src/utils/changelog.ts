export interface ChangelogEntry {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  changes: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: "0.13.0",
    date: "2025-08-17",
    type: "minor",
    changes: ["feat: weer widget toegevoegd aan homepage met MET Norway Weather API"]
  },
  {
    version: "0.12.0",
    date: "2025-08-17",
    type: "minor",
    changes: ["feat: weer widget toegevoegd aan homepage met MET Norway Weather API"]
  },
  {
    version: "0.11.0",
    date: "2025-08-17",
    type: "minor",
    changes: ["feat: verbeterde local rules en slimme Rafi prompt logica"]
  },
  {
    version: "0.10.0",
    date: "2025-08-17",
    type: "minor",
    changes: ["feat: restrict Rafi access to authenticated users only"]
  },
  {
    version: "0.9.0",
    date: "2025-08-17",
    type: "minor",
    changes: ["feat: enhance Rafi menu item with larger avatar and descriptive text"]
  },
  {
    version: "0.8.3",
    date: "2025-08-17",
    type: "patch",
    changes: ["fix: Rafi avatar URL corrected in RafiChat component"]
  },
  {
    version: "0.8.2",
    date: "2025-08-17",
    type: "patch",
    changes: ["PWA: force network-only for /api/** to avoid cached Rafi responses"]
  },
  {
    version: "0.8.1",
    date: "2025-08-17",
    type: "patch",
    changes: ["PWA: force network-only for /api/** to avoid cached Rafi responses"]
  },
  {
    version: "0.8.0",
    date: "2025-08-16",
    type: "minor",
    changes: ["feat: optimaliseer realtime score updates en verbeter UX"]
  },
  {
    version: "0.7.1",
    date: "2025-08-15",
    type: "patch",
    changes: ["fix: resolve PWA cache issues and ClientResponseError import"]
  },
  {
    version: "0.7.0",
    date: "2025-08-11",
    type: "minor",
    changes: ["feat: VPS deployment setup voor Rafi server met Caddy"]
  },
  {
    version: "0.6.1",
    date: "2025-08-10",
    type: "patch",
    changes: ["fix: PocketBase initialisatie probleem in live omgeving opgelost"]
  },
  {
    version: "0.6.0",
    date: "2025-08-10",
    type: "minor",
    changes: ["feat: Rafi AI assistant server-proxy geïmplementeerd"]
  },
  {
    version: "0.5.0",
    date: "2025-08-10",
    type: "minor",
    changes: [
      "feat: Rafi AI assistant server-proxy geïmplementeerd",
      "feat: FIPPA regels integratie met OpenAI API",
      "feat: Express server met anti-misbruik bescherming",
      "feat: Proxy configuratie voor development omgeving",
      "feat: Multi-language support voor out-of-scope berichten",
      "feat: Local rules integratie met FIPPA regels",
      "feat: Development scripts voor eenvoudige server start",
      "feat: Health check en reload endpoints",
      "feat: Rate limiting en CORS beveiliging",
      "feat: ES module syntax voor Express server"
    ]
  },
  {
    version: "0.4.2",
    date: "2025-08-06",
    type: "patch",
    changes: ["fix: RAFI avatar hernoemd naar rafi-avatar.png voor betere server compatibiliteit"]
  },
  {
    version: "0.4.1",
    date: "2025-08-06",
    type: "patch",
    changes: ["fix: RAFI avatar toegevoegd aan public map voor PWA build"]
  },
  {
    version: "0.4.0",
    date: "2025-08-06",
    type: "minor",
    changes: ["feat: AI Referee avatar toegevoegd aan AppMenu met 'Binnenkort' tekst"]
  },
  {
    version: "0.3.2",
    date: "2025-08-06",
    type: "patch",
    changes: ["chore: auto-version update naar 0.3.1"]
  },
  {
    version: "0.3.1",
    date: "2025-08-06",
    type: "patch",
    changes: ["fix: versie cache probleem opgelost met cache-busting"]
  },
  {
    version: "0.3.0",
    date: "2025-08-06",
    type: "minor",
    changes: ["feat: slide-in score invoer met +/- knoppen voor putts/chips"]
  },
  {
    version: "0.2.8",
    date: "2025-08-06",
    type: "patch",
    changes: ["chore: update versie naar 0.2.7 en wijzig changelog met nieuwe versie-informatie"]
  },
  {
    version: "0.2.7",
    date: "2025-08-06",
    type: "patch",
    changes: ["chore: update versie naar 0.2.6 en wijzig changelog met nieuwe versie-informatie"]
  },
  {
    version: "0.2.6",
    date: "2025-08-06",
    type: "patch",
    changes: ["# Please enter the commit message for your changes. Lines starting"]
  },
  {
    version: "0.2.5",
    date: "2025-08-06",
    type: "patch",
    changes: ["chore: update versie naar 0.2.4 en wijzig changelog met nieuwe versie-informatie"]
  },
  {
    version: "0.2.4",
    date: "2025-07-30",
    type: "patch",
    changes: ["chore: update versie naar 0.2.3 en wijzig changelog met nieuwe versie-informatie"]
  },
  {
    version: "0.2.3",
    date: "2025-07-30",
    type: "patch",
    changes: ["# Please enter the commit message for your changes. Lines starting"]
  },
  {
    version: "0.2.2",
    date: "2025-07-30",
    type: "patch",
    changes: ["chore: update versie naar 0.2.1 en wijzig changelog met nieuwe versie-informatie"]
  },
  {
    version: "0.2.1",
    date: "2025-07-30",
    type: "patch",
    changes: ["# Please enter the commit message for your changes. Lines starting"]
  },
  {
    version: "0.2.0",
    date: "2025-07-30",
    type: "minor",
    changes: ["feat: implement automatic version bumping with commit-based semver"]
  },
  {
    version: "0.1.0",
    date: "2025-07-30",
    type: "minor",
    changes: ["feat: test automatische versie verhoging"]
  }
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
