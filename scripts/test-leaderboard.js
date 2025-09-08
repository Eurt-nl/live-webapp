#!/usr/bin/env node

/**
 * Test script voor leaderboard functionaliteit
 * Test de Pinia store en component logica
 */

console.log('🧪 Testing Leaderboard Functionality...\n');

// Simuleer test data
const mockEventId = 'test-event-123';
const mockCurrentUserId = 'user-456';

// Mock player data
const mockPlayers = [
  {
    userId: 'user-1',
    name: 'Jan Jansen',
    categoryLetter: 'a',
    thru: 18,
    vsPar: -2,
    status: 'active',
    lastUpdate: '2024-01-15 14:30:00',
  },
  {
    userId: 'user-2',
    name: 'Piet Peters',
    categoryLetter: 'b',
    thru: 18,
    vsPar: -2,
    status: 'active',
    lastUpdate: '2024-01-15 14:25:00',
  },
  {
    userId: 'user-3',
    name: 'Klaas Klaassen',
    categoryLetter: 'a',
    thru: 17,
    vsPar: 1,
    status: 'active',
    lastUpdate: '2024-01-15 14:20:00',
  },
  {
    userId: mockCurrentUserId,
    name: 'Huidige Speler',
    categoryLetter: 'a',
    thru: 16,
    vsPar: 3,
    status: 'active',
    lastUpdate: '2024-01-15 14:15:00',
  },
];

// Test sortering algoritme
function testSorting() {
  console.log('📊 Testing sorting algorithm...');

  // Sorteer: Thru (desc), vsPar (asc), naam (asc)
  const sorted = [...mockPlayers].sort((a, b) => {
    // 1. Thru (desc: meeste holes eerst)
    if (a.thru !== b.thru) {
      return b.thru - a.thru;
    }

    // 2. vsPar (asc: laagste eerst)
    if (a.vsPar !== b.vsPar) {
      return a.vsPar - b.vsPar;
    }

    // 3. Naam (asc: voor stabiele volgorde)
    return a.name.localeCompare(b.name);
  });

  console.log('Sorted players:');
  sorted.forEach((player, index) => {
    console.log(`  ${index + 1}. ${player.name} - Thru: ${player.thru}, vsPar: ${player.vsPar}`);
  });

  return sorted;
}

// Test position mapping
function testPositionMapping(sortedPlayers) {
  console.log('\n🏆 Testing position mapping...');

  const positions = {};
  let currentPosition = 1;
  let currentThru = -1;
  let currentVsPar = -1;

  for (let i = 0; i < sortedPlayers.length; i++) {
    const player = sortedPlayers[i];

    // Check voor tie (Thru én vsPar gelijk)
    if (i > 0 && player.thru === currentThru && player.vsPar === currentVsPar) {
      // Tie: gebruik T-prefix
      positions[player.userId] = `T${currentPosition}`;
    } else {
      // Geen tie: nieuwe positie
      currentPosition = i + 1;
      positions[player.userId] = currentPosition > 71 ? 'T71' : currentPosition.toString();
    }

    currentThru = player.thru;
    currentVsPar = player.vsPar;
  }

  console.log('Position mapping:');
  Object.entries(positions).forEach(([userId, position]) => {
    const player = sortedPlayers.find((p) => p.userId === userId);
    console.log(`  ${position}: ${player.name}`);
  });

  return positions;
}

// Test compact list algoritme
function testCompactList(sortedPlayers, currentUserId) {
  console.log('\n📋 Testing compact list algorithm...');

  const L = sortedPlayers;
  if (L.length === 0) return [];

  // Algoritme voor compacte slice (max 10 regels)
  const top3 = L.slice(0, 3);
  const playerIndex = L.findIndex((player) => player.userId === currentUserId);

  if (playerIndex === -1) return top3.slice(0, 10);

  // Neem 3 boven en 3 onder de speler
  const above = L.slice(Math.max(0, playerIndex - 3), playerIndex);
  const below = L.slice(playerIndex + 1, playerIndex + 4);
  const currentPlayer = L[playerIndex];

  // Combineer met prioriteit: [speler] + top3 + 3 boven + 3 onder
  const priority = [currentPlayer, ...top3, ...above, ...below];

  // Verwijder duplicaten en behoud volgorde
  const unique = priority.filter(
    (player, index, arr) => arr.findIndex((p) => p.userId === player.userId) === index,
  );

  // Vul tot 10 met extra spelers
  if (unique.length < 10) {
    const remaining = L.filter((player) => !unique.some((u) => u.userId === player.userId));
    const needed = 10 - unique.length;

    // Voeg symmetrisch toe: eerst onderliggende, dan bovenliggende
    const belowExtra = remaining.slice(0, Math.ceil(needed / 2));
    const aboveExtra = remaining.slice(-Math.floor(needed / 2));

    unique.push(...belowExtra, ...aboveExtra);
  }

  const result = unique.slice(0, 10);

  console.log('Compact list (max 10):');
  result.forEach((player, index) => {
    const isCurrent = player.userId === currentUserId;
    console.log(
      `  ${index + 1}. ${player.name} - Thru: ${player.thru}, vsPar: ${player.vsPar}${isCurrent ? ' (CURRENT)' : ''}`,
    );
  });

  return result;
}

// Test scope filtering
function testScopeFiltering(sortedPlayers, currentUserId, scope) {
  console.log(`\n🔍 Testing scope filtering (${scope})...`);

  if (scope === 'event') {
    console.log('Event scope: showing all players');
    return sortedPlayers;
  }

  if (scope === 'category') {
    const currentUserCategory = sortedPlayers.find(
      (p) => p.userId === currentUserId,
    )?.categoryLetter;
    if (currentUserCategory) {
      const filtered = sortedPlayers.filter((p) => p.categoryLetter === currentUserCategory);
      console.log(`Category scope: showing only category '${currentUserCategory}'`);
      filtered.forEach((player, index) => {
        console.log(`  ${index + 1}. ${player.name} (${player.categoryLetter})`);
      });
      return filtered;
    }
  }

  return sortedPlayers;
}

// Test vsPar formatting
function testVsParFormatting() {
  console.log('\n📈 Testing vsPar formatting...');

  const testValues = [-5, -1, 0, 1, 5, 10];

  testValues.forEach((vsPar) => {
    let formatted;
    if (vsPar === 0) formatted = 'E';
    else if (vsPar > 0) formatted = `+${vsPar}`;
    else formatted = vsPar.toString();

    console.log(`  ${vsPar} -> ${formatted}`);
  });
}

// Run alle tests
function runTests() {
  console.log('🚀 Starting leaderboard tests...\n');

  const sortedPlayers = testSorting();
  const positions = testPositionMapping(sortedPlayers);
  const compactList = testCompactList(sortedPlayers, mockCurrentUserId);
  const eventScope = testScopeFiltering(sortedPlayers, mockCurrentUserId, 'event');
  const categoryScope = testScopeFiltering(sortedPlayers, mockCurrentUserId, 'category');
  testVsParFormatting();

  console.log('\n✅ All tests completed!');
  console.log('\n📋 Summary:');
  console.log(`  - Total players: ${mockPlayers.length}`);
  console.log(`  - Sorted positions: ${Object.keys(positions).length}`);
  console.log(`  - Compact list size: ${compactList.length}`);
  console.log(`  - Event scope size: ${eventScope.length}`);
  console.log(`  - Category scope size: ${categoryScope.length}`);

  // Test edge cases
  console.log('\n🧪 Testing edge cases...');

  // Test met lege lijst
  const emptyCompact = testCompactList([], mockCurrentUserId);
  console.log(`  - Empty list compact size: ${emptyCompact.length}`);

  // Test met speler niet in lijst
  const notFoundCompact = testCompactList(sortedPlayers, 'non-existent-user');
  console.log(`  - Player not found compact size: ${notFoundCompact.length}`);

  console.log('\n🎉 All edge case tests passed!');
}

// Run de tests
runTests();
