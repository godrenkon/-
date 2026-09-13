import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultGameData, createGrid, normalizeGameData, resizeGrid, validateGameData,
} from '../src/lib/gameData.js';
import {
  OFFICIAL_EXTENSIONS, createOfficialExtension, getOfficialExtension,
} from '../src/lib/officialExtensions.js';

test('starter data is immediately playable', () => {
  const game = createDefaultGameData({ starter: true });
  assert.equal(validateGameData(game).length, 0);
  assert.equal(game.maps.length, 1);
  assert.equal(game.actors.length, 1);
  assert.equal(game.system.startMapId, game.maps[0].id);
  assert.deepEqual(game.system.startParty, [game.actors[0].id]);
  assert.ok(game.maps[0].events[0].pages[0].commands.length > 0);
});

test('normalization migrates legacy maps and clamps unsafe values', () => {
  const game = normalizeGameData({
    maps: [{ id: 'legacy', name: 'Legacy', width: 2, height: 2, layers: { ground: [['#fff']], upper: [] }, events: [{ id: 'event', x: 99, y: -2, commands: [] }] }],
    system: { startMapId: 'missing', startX: 99, startY: -1 },
  });
  const map = game.maps[0];
  assert.equal(map.layers.ground.length, 2);
  assert.equal(map.layers.ground[0].length, 2);
  assert.equal(map.events[0].x, 1);
  assert.equal(map.events[0].y, 0);
  assert.equal(game.system.startMapId, 'legacy');
  assert.equal(game.system.startX, 1);
  assert.equal(game.system.startY, 0);
  assert.equal(map.layerSettings.upper.aboveCharacters, true);
});

test('grid creation and resizing never aliases object cells', () => {
  const grid = createGrid(2, 2, { value: 1 });
  grid[0][0].value = 9;
  assert.equal(grid[0][1].value, 1);
  const resized = resizeGrid(grid, 3, 3, false);
  assert.equal(resized[0][0].value, 9);
  assert.equal(resized[2][2], false);
});

test('validation rejects broken map structures before import', () => {
  const game = createDefaultGameData({ starter: true });
  game.maps[0].layers.ground.pop();
  game.maps[0].events.push({ id: game.maps[0].events[0].id, name: '壊れたイベント', x: 999, y: 0, pages: [] });
  game.system.startMapId = 'missing';
  const errors = validateGameData(game);
  assert.ok(errors.some(message => message.includes('layers.ground')));
  assert.ok(errors.some(message => message.includes('イベントID')));
  assert.ok(errors.some(message => message.includes('座標')));
  assert.ok(errors.some(message => message.includes('開始マップ')));
});

test('official extension catalog contains 100 unique runnable entries', () => {
  assert.equal(OFFICIAL_EXTENSIONS.length, 100);
  assert.equal(new Set(OFFICIAL_EXTENSIONS.map(item => item.id)).size, 100);
  assert.equal(new Set(OFFICIAL_EXTENSIONS.map(item => item.commandId)).size, 100);
  for (const extension of OFFICIAL_EXTENSIONS) {
    assert.equal(getOfficialExtension(extension.plugin_id), extension);
    assert.equal(typeof createOfficialExtension(extension).commands[extension.commandId].execute, 'function');
  }
});

test('counter extension updates state through the constrained API', () => {
  const extension = getOfficialExtension('difficulty');
  const runtime = createOfficialExtension(extension, { target: 'difficulty', amount: 2 });
  const variables = {};
  const api = {
    getVariable: key => variables[key] || 0,
    setVariable: (key, value) => { variables[key] = value; },
  };
  runtime.commands[extension.commandId].execute(api);
  assert.equal(variables.difficulty, 2);
});
