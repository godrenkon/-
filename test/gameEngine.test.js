import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultGameData } from '../src/lib/gameData.js';
import { GameEngine } from '../src/lib/gameEngine.js';

const createEngine = () => {
  const game = createDefaultGameData({ starter: true });
  const canvas = { getContext: () => ({}) };
  const engine = new GameEngine(canvas, game);
  engine.state.currentMapId = game.system.startMapId;
  return { engine, game };
};

test('runtime condition parser supports state comparisons without executing code', () => {
  const { engine } = createEngine();
  engine.state.switches.door = true;
  engine.state.variables.level = 7;
  engine.state.items.key = 1;
  engine.state.gold = 50;
  assert.equal(engine.evalCondition('switch[door] == ON && var[level] >= 5'), true);
  assert.equal(engine.evalCondition('item[key] > 0 || gold >= 100'), true);
  assert.equal(engine.evalCondition('globalThis.alert(1)'), false);
});

test('event pages use the last page whose conditions are satisfied', () => {
  const { engine } = createEngine();
  const event = {
    id: 'event',
    pages: [
      { name: 'base', conditions: [], commands: [] },
      { name: 'opened', conditions: [{ type: 'switch', key: 'opened', operator: 'on' }], commands: [] },
    ],
  };
  assert.equal(engine.getActiveEventPage(event).name, 'base');
  engine.state.switches.opened = true;
  assert.equal(engine.getActiveEventPage(event).name, 'opened');
});

test('transfers and save restoration clamp invalid player positions', () => {
  const { engine, game } = createEngine();
  assert.equal(engine.transferPlayer(game.maps[0].id, 999, -10), true);
  assert.equal(engine.state.playerX, game.maps[0].width - 1);
  assert.equal(engine.state.playerY, 0);
  const save = engine.createSaveData();
  save.state.playerX = -30;
  save.state.playerY = 999;
  assert.equal(engine.restoreSaveData(save), true);
  assert.equal(engine.state.playerX, 0);
  assert.equal(engine.state.playerY, game.maps[0].height - 1);
  assert.equal(engine.restoreSaveData({ state: { currentMapId: 'missing' } }), false);
});

test('community extensions stay disabled until trusted and guarded code loads strictly', () => {
  const untrusted = createEngine();
  untrusted.game.plugins = [{ enabled: true, trusted: false, code: 'export default { onLoad(api) { api.setSwitch("loaded", true); } }' }];
  untrusted.engine.loadPlugins();
  assert.equal(untrusted.engine.state.switches.loaded, undefined);

  const trusted = createEngine();
  trusted.game.plugins = [{ enabled: true, trusted: true, code: 'export default { onLoad(api) { api.setSwitch("loaded", true); } }' }];
  trusted.engine.loadPlugins();
  assert.equal(trusted.engine.state.switches.loaded, true);

  const blocked = createEngine();
  blocked.game.plugins = [{ enabled: true, trusted: true, code: 'export default { onLoad() { window.alert("no"); } }' }];
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    blocked.engine.loadPlugins();
  } finally {
    console.warn = originalWarn;
  }
  assert.equal(blocked.engine.plugins.length, 0);
});
