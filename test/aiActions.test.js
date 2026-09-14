import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAIActions, parseAIResult, validateAIActions } from '../src/lib/aiActions.js';
import { createDefaultGameData } from '../src/lib/gameData.js';

test('AI output parser accepts JSON wrapped in a code block', () => {
  const result = parseAIResult('```json\n{"message":"ok","actions":[]}\n```');
  assert.equal(result.message, 'ok');
});

test('AI actions are constrained before a game is modified', () => {
  const game = createDefaultGameData({ starter: true });
  const checked = validateAIActions({ actions: [
    { type: 'raw_patch', data: { maps: [] } },
    { type: 'add_map', data: { name: '城', width: 9999, height: -3, bgColor: 'nope' } },
    { type: 'add_event', data: { mapId: game.maps[0].id, name: '兵士', x: 999, y: -1, commands: [{ type: 'message', params: { text: '止まれ' } }, { type: 'unknown', params: {} }] } },
  ] }, game);
  assert.equal(checked.actions.length, 2);
  assert.equal(checked.actions[0].data.width, 120);
  assert.equal(checked.actions[0].data.height, 1);
  assert.equal(checked.actions[0].data.bgColor, '#111827');
  assert.equal(checked.actions[1].data.commands.length, 1);
});

test('selected AI actions apply without corrupting the playable game', () => {
  const game = createDefaultGameData({ starter: true });
  const checked = validateAIActions({ actions: [
    { type: 'add_item', data: { name: '回復薬', hp: 50, price: 30 } },
    { type: 'add_event', data: { mapName: game.maps[0].name, name: '宝箱', x: 2, y: 2, commands: [{ type: 'item', params: { operation: '+', itemName: '回復薬', amount: 1 } }] } },
  ] }, game);
  const applied = applyAIActions(game, checked.actions);
  assert.equal(applied.applied, 2);
  assert.equal(applied.gameData.items.at(-1).name, '回復薬');
  assert.equal(applied.gameData.maps[0].events.at(-1).name, '宝箱');
});
