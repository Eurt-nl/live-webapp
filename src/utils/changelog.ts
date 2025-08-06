export interface ChangelogEntry {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  changes: string[];
}

export const changelog: ChangelogEntry[] = [
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
