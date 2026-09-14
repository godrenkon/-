import { parseAIResult } from './aiActions.js';

const trimSlash = value => String(value || '').trim().replace(/\/+$/, '');

export function openAIChatUrl(baseUrl) {
  const base = trimSlash(baseUrl);
  if (!base) return '';
  if (base.endsWith('/chat/completions')) return base;
  return `${base.endsWith('/v1') ? base : `${base}/v1`}/chat/completions`;
}

export function ollamaChatUrl(baseUrl) {
  const base = trimSlash(baseUrl);
  return base.endsWith('/api/chat') ? base : `${base}/api/chat`;
}

export function buildAIContext(gameData) {
  return {
    maps: (gameData.maps || []).map(map => ({ id: map.id, name: map.name, width: map.width, height: map.height })),
    actors: (gameData.actors || []).map(actor => ({ name: actor.name, level: actor.level })),
    items: (gameData.items || []).map(item => ({ name: item.name, price: item.price })),
    skills: (gameData.skills || []).map(skill => ({ name: skill.name, mpCost: skill.mpCost })),
    enemies: (gameData.enemies || []).map(enemy => ({ name: enemy.name, hp: enemy.hp })),
    system: { currency: gameData.system?.currency, startMapId: gameData.system?.startMapId, battleSystem: gameData.system?.battleSystem },
  };
}

export function buildSystemPrompt(gameData) {
  return `あなたはRPG制作アシスタントです。ゲームのデータを安全に追加・変更するための提案を作成します。現在のデータは以下です。\n${JSON.stringify(buildAIContext(gameData))}\n\n使える操作は add_map, add_item, add_skill, add_actor, add_enemy, add_event, add_common_event, set_system です。\nadd_event は既存マップの mapId または mapName を指定してください。commands は message, choices, switch, variable, gold, item, transfer, wait, condition, bgm, se のみ使えます。\n\n必ず次だけをJSONで返してください。\n{"message":"短い説明","actions":[{"type":"add_...","data":{}}]}\nコードブロックや説明文はJSONの外に書かないでください。`;
}

async function errorMessage(response) {
  try {
    const body = await response.json();
    return body?.error?.message || body?.message || `HTTP ${response.status}`;
  } catch { return `HTTP ${response.status}`; }
}

export async function requestAI({ provider, apiUrl, apiKey, model, localUrl, localModel, prompt, gameData }) {
  const system = buildSystemPrompt(gameData);
  let response;
  if (provider === 'ollama') {
    response = await fetch(ollamaChatUrl(localUrl), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: localModel, stream: false, format: 'json', messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }] }) });
  } else {
    if (!apiKey) throw new Error('APIキーを入力してください。キーはこのタブを閉じるまでだけ保持されます。');
    response = await fetch(openAIChatUrl(apiUrl), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }] }) });
  }
  if (!response.ok) throw new Error(await errorMessage(response));
  const body = await response.json();
  const content = provider === 'ollama' ? body.message?.content : body.choices?.[0]?.message?.content;
  const parsed = parseAIResult(content);
  if (!parsed) throw new Error('AIの応答をJSONとして読み取れませんでした。もう一度生成してください。');
  return parsed;
}
