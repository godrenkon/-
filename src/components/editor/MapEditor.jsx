import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { rpgStore } from '@/lib/rpgStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import {
  ChevronDown, ChevronRight, ChevronUp, Copy, Eraser, Eye, EyeOff, Flame, Grid3x3, Hash, Layers, MapPin,
  PaintBucket, Palette, Pencil, Pipette, Plus, Shield, Square, Trash2,
  Upload, X, Zap, ZoomIn, ZoomOut,
} from 'lucide-react';
import { cloneData, createEvent, createGrid, createId, createMap, resizeGrid } from '@/lib/gameData';

const EDITOR_TILE_SIZE = 24;
const DEFAULT_TILE_COLORS = [
  '#315f3b', '#4a7c3a', '#86a65d', '#8b7355', '#c2b280', '#2563eb',
  '#1e40af', '#713f12', '#9ca3af', '#475569', '#fbbf24', '#f97316',
  '#dc2626', '#7c3aed', '#ec4899', '#14b8a6', '#f8fafc', '#18181b',
];

const TOOL_DEFINITIONS = [
  ['pencil', Pencil, '鉛筆'], ['rect', Square, '矩形'], ['fill', PaintBucket, '塗りつぶし'],
  ['eraser', Eraser, '消しゴム'], ['eyedropper', Pipette, '色を取得'],
  ['collision', Shield, '通行設定'], ['region', Hash, 'リージョン'],
  ['damage', Flame, 'ダメージ床'],
  ['event', Zap, 'イベント配置'], ['start', MapPin, '開始位置'],
];

const normalizeColor = tile => typeof tile === 'string' ? tile : tile?.color || null;

function NumberInput({ value, onCommit, min = 1, max = 500, ...props }) {
  const [draft, setDraft] = useState(String(value ?? ''));
  useEffect(() => setDraft(String(value ?? '')), [value]);
  const commit = () => {
    const number = Number.parseInt(draft, 10);
    if (Number.isFinite(number)) onCommit(Math.min(max, Math.max(min, number)));
    else setDraft(String(value ?? ''));
  };
  return <Input type="number" min={min} max={max} value={draft} onChange={event => setDraft(event.target.value)} onBlur={commit} onKeyDown={event => event.key === 'Enter' && event.currentTarget.blur()} {...props} />;
}

export default function MapEditor({ gameData, updateGameData, endHistoryGroup, selectedMapId, setSelectedMapId }) {
  const { t } = useI18n();
  const canvasRef = useRef(null);
  const strokeRef = useRef(null);
  const imageCache = useRef(new Map());
  const redrawRef = useRef(() => {});
  const [tool, setTool] = useState('pencil');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_TILE_COLORS[0]);
  const [selectedImage, setSelectedImage] = useState('');
  const [activeLayer, setActiveLayer] = useState('ground');
  const [showGrid, setShowGrid] = useState(true);
  const [showCollision, setShowCollision] = useState(false);
  const [regionId, setRegionId] = useState(1);
  const [damageValue, setDamageValue] = useState(10);
  const [zoom, setZoom] = useState(1);
  const [rectangle, setRectangle] = useState(null);

  const maps = gameData.maps || [];
  const currentMap = maps.find(map => map.id === selectedMapId) || maps[0] || null;
  const layerOrder = useMemo(
    () => currentMap?.layerOrder || Object.keys(currentMap?.layers || {}),
    [currentMap],
  );

  useEffect(() => {
    if ((!selectedMapId || !maps.some(map => map.id === selectedMapId)) && maps[0]) {
      setSelectedMapId(maps[0].id);
    }
  }, [maps, selectedMapId, setSelectedMapId]);

  useEffect(() => {
    if (currentMap && !layerOrder.includes(activeLayer)) setActiveLayer(layerOrder[0] || 'ground');
  }, [activeLayer, currentMap, layerOrder]);

  const mutateCurrentMap = useCallback((mutator, options) => {
    if (!currentMap) return;
    updateGameData(previous => {
      const index = (previous.maps || []).findIndex(map => map.id === currentMap.id);
      if (index < 0) return previous;
      const mapsCopy = [...previous.maps];
      const mapCopy = cloneData(mapsCopy[index]);
      if (mutator(mapCopy) === false) return previous;
      mapsCopy[index] = mapCopy;
      return { ...previous, maps: mapsCopy };
    }, options);
  }, [currentMap, updateGameData]);

  const loadImage = useCallback((url) => {
    if (!url) return null;
    if (!imageCache.current.has(url)) {
      const image = new Image();
      image.onload = () => redrawRef.current();
      image.src = url;
      imageCache.current.set(url, image);
    }
    return imageCache.current.get(url);
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentMap) return;
    const context = canvas.getContext('2d');
    const size = EDITOR_TILE_SIZE;
    canvas.width = currentMap.width * size;
    canvas.height = currentMap.height * size;
    context.imageSmoothingEnabled = false;
    context.fillStyle = currentMap.bgColor || '#111827';
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (currentMap.bgImage) {
      const image = loadImage(currentMap.bgImage);
      if (image?.complete && image.naturalWidth) context.drawImage(image, 0, 0, canvas.width, canvas.height);
    }

    for (const layerId of layerOrder) {
      const settings = currentMap.layerSettings?.[layerId] || {};
      if (settings.visible === false) continue;
      context.globalAlpha = Number.isFinite(settings.opacity) ? settings.opacity : 1;
      const grid = currentMap.layers?.[layerId];
      for (let y = 0; y < currentMap.height; y += 1) {
        for (let x = 0; x < currentMap.width; x += 1) {
          const tile = grid?.[y]?.[x];
          if (!tile) continue;
          const color = normalizeColor(tile);
          if (color) {
            context.fillStyle = color;
            context.fillRect(x * size, y * size, size, size);
          }
          if (tile?.image) {
            const image = loadImage(tile.image);
            if (image?.complete && image.naturalWidth) context.drawImage(image, x * size, y * size, size, size);
          }
        }
      }
    }
    context.globalAlpha = 1;

    if (showCollision || tool === 'collision') {
      for (let y = 0; y < currentMap.height; y += 1) {
        for (let x = 0; x < currentMap.width; x += 1) {
          if (!currentMap.collision?.[y]?.[x]) continue;
          context.fillStyle = 'rgba(239,68,68,.28)';
          context.fillRect(x * size, y * size, size, size);
          context.strokeStyle = 'rgba(248,113,113,.9)';
          context.beginPath();
          context.moveTo(x * size + 5, y * size + 5);
          context.lineTo((x + 1) * size - 5, (y + 1) * size - 5);
          context.moveTo((x + 1) * size - 5, y * size + 5);
          context.lineTo(x * size + 5, (y + 1) * size - 5);
          context.stroke();
        }
      }
    }

    if (tool === 'region') {
      context.font = 'bold 11px sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      for (let y = 0; y < currentMap.height; y += 1) {
        for (let x = 0; x < currentMap.width; x += 1) {
          const value = currentMap.regions?.[y]?.[x] || 0;
          if (!value) continue;
          context.fillStyle = 'rgba(59,130,246,.35)';
          context.fillRect(x * size, y * size, size, size);
          context.fillStyle = '#dbeafe';
          context.fillText(String(value), x * size + size / 2, y * size + size / 2);
        }
      }
    }

    if (tool === 'damage') {
      context.font = 'bold 10px sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      for (let y = 0; y < currentMap.height; y += 1) for (let x = 0; x < currentMap.width; x += 1) {
        const value = currentMap.damage?.[y]?.[x] || 0;
        if (!value) continue;
        context.fillStyle = 'rgba(249,115,22,.38)';
        context.fillRect(x * size, y * size, size, size);
        context.fillStyle = '#ffedd5';
        context.fillText(String(value), x * size + size / 2, y * size + size / 2);
      }
    }

    for (const event of currentMap.events || []) {
      const x = event.x * size;
      const y = event.y * size;
      const image = loadImage(event.graphic);
      if (image?.complete && image.naturalWidth) context.drawImage(image, x + 1, y + 1, size - 2, size - 2);
      else {
        context.fillStyle = 'rgba(245,158,11,.32)';
        context.fillRect(x + 2, y + 2, size - 4, size - 4);
      }
      context.strokeStyle = '#fbbf24';
      context.lineWidth = 2;
      context.strokeRect(x + 2, y + 2, size - 4, size - 4);
    }

    const system = gameData.system || {};
    if (system.startMapId === currentMap.id) {
      const x = system.startX * size;
      const y = system.startY * size;
      context.fillStyle = '#8b5cf6';
      context.beginPath();
      context.arc(x + size / 2, y + size / 2, size * .28, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#fff';
      context.font = 'bold 10px sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('S', x + size / 2, y + size / 2);
    }

    if (rectangle) {
      const left = Math.min(rectangle.start.x, rectangle.end.x);
      const top = Math.min(rectangle.start.y, rectangle.end.y);
      const width = Math.abs(rectangle.end.x - rectangle.start.x) + 1;
      const height = Math.abs(rectangle.end.y - rectangle.start.y) + 1;
      context.fillStyle = `${selectedColor}66`;
      context.fillRect(left * size, top * size, width * size, height * size);
      context.strokeStyle = '#fff';
      context.lineWidth = 2;
      context.strokeRect(left * size + 1, top * size + 1, width * size - 2, height * size - 2);
    }

    if (showGrid) {
      context.strokeStyle = 'rgba(255,255,255,.11)';
      context.lineWidth = 1;
      for (let x = 0; x <= currentMap.width; x += 1) {
        context.beginPath(); context.moveTo(x * size + .5, 0); context.lineTo(x * size + .5, canvas.height); context.stroke();
      }
      for (let y = 0; y <= currentMap.height; y += 1) {
        context.beginPath(); context.moveTo(0, y * size + .5); context.lineTo(canvas.width, y * size + .5); context.stroke();
      }
    }
  }, [currentMap, gameData.system, layerOrder, loadImage, rectangle, selectedColor, showCollision, showGrid, tool]);

  redrawRef.current = drawCanvas;
  useEffect(() => drawCanvas(), [drawCanvas]);

  const getTilePosition = (event) => {
    const canvas = canvasRef.current;
    if (!canvas || !currentMap) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) * canvas.width / rect.width / EDITOR_TILE_SIZE);
    const y = Math.floor((event.clientY - rect.top) * canvas.height / rect.height / EDITOR_TILE_SIZE);
    return x >= 0 && y >= 0 && x < currentMap.width && y < currentMap.height ? { x, y } : null;
  };

  const floodFill = (grid, startX, startY, replacement) => {
    const target = grid[startY]?.[startX] ?? null;
    const equal = (left, right) => JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
    if (equal(target, replacement)) return false;
    const stack = [[startX, startY]];
    while (stack.length) {
      const [x, y] = stack.pop();
      if (x < 0 || y < 0 || x >= currentMap.width || y >= currentMap.height) continue;
      if (!equal(grid[y]?.[x], target)) continue;
      grid[y][x] = cloneData(replacement);
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    return true;
  };

  const applyAt = (position, historyGroup) => {
    if (!currentMap || !position) return;
    const key = `${position.x}:${position.y}`;
    if (strokeRef.current?.last === key && !['fill', 'eyedropper', 'event', 'start'].includes(tool)) return;
    if (strokeRef.current) strokeRef.current.last = key;

    if (tool === 'eyedropper') {
      const tile = currentMap.layers?.[activeLayer]?.[position.y]?.[position.x];
      const color = normalizeColor(tile);
      if (color) setSelectedColor(color);
      setSelectedImage(typeof tile === 'object' ? tile.image || '' : '');
      setTool('pencil');
      return;
    }
    if (tool === 'event') {
      mutateCurrentMap(map => {
        if (map.events.some(event => event.x === position.x && event.y === position.y)) return false;
        map.events.push(createEvent(position.x, position.y, `イベント ${map.events.length + 1}`));
      }, { historyGroup });
      return;
    }
    if (tool === 'start') {
      updateGameData(previous => ({
        ...previous,
        system: { ...previous.system, startMapId: currentMap.id, startX: position.x, startY: position.y },
      }));
      return;
    }

    mutateCurrentMap(map => {
      if (tool === 'collision') {
        const value = strokeRef.current?.paintValue ?? !map.collision?.[position.y]?.[position.x];
        if (map.collision[position.y][position.x] === value) return false;
        map.collision[position.y][position.x] = value;
        if (strokeRef.current) strokeRef.current.paintValue = value;
        return;
      }
      if (tool === 'region') {
        if (map.regions[position.y][position.x] === regionId) return false;
        map.regions[position.y][position.x] = regionId;
        return;
      }
      if (tool === 'damage') {
        if (map.damage[position.y][position.x] === damageValue) return false;
        map.damage[position.y][position.x] = damageValue;
        return;
      }
      const grid = map.layers[activeLayer] || (map.layers[activeLayer] = createGrid(map.width, map.height));
      const paint = selectedImage ? { color: selectedColor, image: selectedImage } : selectedColor;
      if (tool === 'fill') return floodFill(grid, position.x, position.y, paint);
      const value = tool === 'eraser' ? null : paint;
      if (JSON.stringify(grid[position.y][position.x]) === JSON.stringify(value)) return false;
      grid[position.y][position.x] = cloneData(value);
    }, { historyGroup });
  };

  const handlePointerDown = (event) => {
    const position = getTilePosition(event);
    if (!position) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const group = createId('stroke');
    strokeRef.current = { group, last: null, paintValue: null };
    if (tool === 'rect') setRectangle({ start: position, end: position });
    else applyAt(position, group);
  };

  const handlePointerMove = (event) => {
    if (!strokeRef.current) return;
    const position = getTilePosition(event);
    if (!position) return;
    if (tool === 'rect') setRectangle(previous => previous ? { ...previous, end: position } : null);
    else if (!['fill', 'eyedropper', 'event', 'start'].includes(tool)) applyAt(position, strokeRef.current.group);
  };

  const finishStroke = (event) => {
    if (tool === 'rect' && rectangle && currentMap) {
      const end = event ? getTilePosition(event) || rectangle.end : rectangle.end;
      const start = rectangle.start;
      mutateCurrentMap(map => {
        const grid = map.layers[activeLayer] || (map.layers[activeLayer] = createGrid(map.width, map.height));
        const left = Math.min(start.x, end.x);
        const right = Math.max(start.x, end.x);
        const top = Math.min(start.y, end.y);
        const bottom = Math.max(start.y, end.y);
        for (let y = top; y <= bottom; y += 1) {
          for (let x = left; x <= right; x += 1) grid[y][x] = selectedImage ? { color: selectedColor, image: selectedImage } : selectedColor;
        }
      });
    }
    strokeRef.current = null;
    setRectangle(null);
    endHistoryGroup?.();
  };

  const addMap = () => {
    const map = createMap({ name: `マップ ${maps.length + 1}` });
    updateGameData(previous => ({ ...previous, maps: [...(previous.maps || []), map] }));
    setSelectedMapId(map.id);
  };

  const duplicateMap = () => {
    if (!currentMap) return;
    const copy = cloneData(currentMap);
    copy.id = createId('map');
    copy.name = `${currentMap.name} コピー`;
    copy.events = copy.events.map(event => ({
      ...event,
      id: createId('evt'),
      pages: (event.pages || []).map(page => ({
        ...page,
        id: createId('page'),
        commands: (page.commands || []).map(command => ({ ...command, id: createId('cmd') })),
      })),
    }));
    updateGameData(previous => ({ ...previous, maps: [...previous.maps, copy] }));
    setSelectedMapId(copy.id);
  };

  const deleteMap = (mapId) => {
    if (!confirm(t('deleteConfirm'))) return;
    const remaining = maps.filter(map => map.id !== mapId);
    updateGameData(previous => ({
      ...previous,
      maps: previous.maps.filter(map => map.id !== mapId),
      system: previous.system?.startMapId === mapId
        ? { ...previous.system, startMapId: remaining[0]?.id || null, startX: 0, startY: 0 }
        : previous.system,
    }));
    setSelectedMapId(remaining[0]?.id || null);
  };

  const updateMap = (field, value) => {
    if (field === 'width' || field === 'height') {
      updateGameData(previous => {
        const map = previous.maps.find(item => item.id === currentMap.id);
        if (!map) return previous;
        const width = field === 'width' ? value : map.width;
        const height = field === 'height' ? value : map.height;
        const resized = cloneData(map);
        for (const layerId of resized.layerOrder) resized.layers[layerId] = resizeGrid(resized.layers[layerId], width, height);
        resized.collision = resizeGrid(resized.collision, width, height, false);
        resized.damage = resizeGrid(resized.damage, width, height, 0);
        resized.regions = resizeGrid(resized.regions, width, height, 0);
        resized.events = resized.events.map(event => ({ ...event, x: Math.min(event.x, width - 1), y: Math.min(event.y, height - 1) }));
        resized.width = width;
        resized.height = height;
        const system = previous.system?.startMapId === resized.id
          ? { ...previous.system, startX: Math.min(previous.system.startX, width - 1), startY: Math.min(previous.system.startY, height - 1) }
          : previous.system;
        return { ...previous, maps: previous.maps.map(item => item.id === resized.id ? resized : item), system };
      });
      return;
    }
    mutateCurrentMap(map => { map[field] = value; });
  };

  const addLayer = () => {
    const id = createId('layer');
    mutateCurrentMap(map => {
    map.layerOrder.push(id);
    map.layers[id] = createGrid(map.width, map.height);
    map.layerSettings[id] = { name: `レイヤー ${map.layerOrder.length}`, visible: true, opacity: 1, collision: false };
    });
    setActiveLayer(id);
  };

  const removeLayer = (layerId) => {
    if (!currentMap || ['ground', 'object'].includes(layerId) || !confirm('このレイヤーを削除しますか？')) return;
    mutateCurrentMap(map => {
      map.layerOrder = map.layerOrder.filter(id => id !== layerId);
      delete map.layers[layerId];
      delete map.layerSettings[layerId];
    });
    setActiveLayer(currentMap.layerOrder.find(id => id !== layerId) || 'ground');
  };

  const updateLayerSetting = (layerId, field, value) => mutateCurrentMap(map => {
    map.layerSettings[layerId] = { ...(map.layerSettings[layerId] || {}), [field]: value };
  });

  const moveLayer = (layerId, offset) => mutateCurrentMap(map => {
    const from = map.layerOrder.indexOf(layerId);
    const to = from + offset;
    if (from < 0 || to < 0 || to >= map.layerOrder.length) return false;
    [map.layerOrder[from], map.layerOrder[to]] = [map.layerOrder[to], map.layerOrder[from]];
  });

  const uploadBackground = async (file) => {
    if (!file) return;
    try {
      const { file_url: fileUrl } = await rpgStore.integrations.Core.UploadFile({ file });
      updateMap('bgImage', fileUrl);
    } catch (error) {
      console.error(error);
      toast({ title: 'アップロードに失敗しました', variant: 'destructive' });
    }
  };

  const tools = useMemo(() => TOOL_DEFINITIONS.map(([id, icon, label]) => ({ id, icon, label })), []);

  if (!currentMap) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-zinc-500">
        <Grid3x3 size={48} className="text-zinc-700" />
        <p>{t('editor_add_map')}</p>
        <Button onClick={addMap} className="bg-violet-600 hover:bg-violet-500"><Plus size={16} className="mr-1" /> {t('editor_add_map')}</Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-w-0">
      <aside className="hidden w-48 flex-shrink-0 flex-col border-r border-zinc-800 bg-[#0e0e14] lg:flex">
        <div className="flex items-center justify-between border-b border-zinc-800 p-2">
          <span className="px-1 text-xs font-medium text-zinc-400">マップ</span>
          <button aria-label="マップ追加" onClick={addMap} className="p-1 text-zinc-400 hover:text-violet-400"><Plus size={15} /></button>
        </div>
        <div className="flex-1 space-y-0.5 overflow-y-auto p-1.5">
          {maps.map(map => (
            <div key={map.id} onClick={() => setSelectedMapId(map.id)} className={`group flex cursor-pointer items-center gap-1 rounded px-2 py-1.5 text-xs transition ${map.id === currentMap.id ? 'bg-violet-600/15 text-violet-300' : 'text-zinc-400 hover:bg-zinc-800/50'}`}>
              <ChevronRight size={12} className="flex-shrink-0 opacity-50" />
              <span className="flex-1 truncate">{map.name}</span>
              <button aria-label="マップ削除" onClick={event => { event.stopPropagation(); deleteMap(map.id); }} className="text-zinc-500 opacity-0 hover:text-red-400 group-hover:opacity-100"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-[#0e0e14] px-2 py-2">
          <select value={currentMap.id} onChange={event => setSelectedMapId(event.target.value)} className="h-8 max-w-36 rounded-md border border-zinc-700 bg-zinc-800 px-2 text-xs lg:hidden">
            {maps.map(map => <option key={map.id} value={map.id}>{map.name}</option>)}
          </select>
          <div className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg bg-zinc-800/60 p-0.5">
            {tools.map(item => (
              <button key={item.id} aria-label={item.label} title={item.label} onClick={() => { setTool(item.id); if (item.id === 'collision') setShowCollision(true); }} className={`flex-shrink-0 rounded-md p-1.5 transition ${tool === item.id ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-zinc-100'}`}>
                <item.icon size={16} />
              </button>
            ))}
          </div>
          {tool === 'region' && <NumberInput value={regionId} onCommit={setRegionId} min={0} max={255} className="h-8 w-16 border-zinc-700 bg-zinc-800 text-xs" title="リージョンID" />}
          {tool === 'damage' && <NumberInput value={damageValue} onCommit={setDamageValue} min={0} max={9999} className="h-8 w-20 border-zinc-700 bg-zinc-800 text-xs" title="ダメージ量" />}
          <button aria-label="グリッド表示" title="グリッド" onClick={() => setShowGrid(value => !value)} className={`rounded p-1.5 ${showGrid ? 'text-violet-400' : 'text-zinc-500'}`}><Grid3x3 size={16} /></button>
          <button aria-label="通行表示" title="通行設定を表示" onClick={() => setShowCollision(value => !value)} className={`rounded p-1.5 ${showCollision ? 'text-red-400' : 'text-zinc-500'}`}><Shield size={16} /></button>
          <div className="ml-auto flex items-center gap-1">
            <button aria-label="縮小" onClick={() => setZoom(value => Math.max(.25, value - .25))} className="p-1 text-zinc-500 hover:text-white"><ZoomOut size={15} /></button>
            <span className="w-11 text-center text-xs text-zinc-500">{Math.round(zoom * 100)}%</span>
            <button aria-label="拡大" onClick={() => setZoom(value => Math.min(4, value + .25))} className="p-1 text-zinc-500 hover:text-white"><ZoomIn size={15} /></button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="flex flex-1 items-start justify-center overflow-auto bg-[#08080c] p-4">
            <canvas ref={canvasRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={finishStroke} onPointerCancel={finishStroke} onPointerLeave={event => { if (!event.currentTarget.hasPointerCapture?.(event.pointerId)) finishStroke(); }} className="max-w-none cursor-crosshair border border-zinc-700 shadow-2xl" style={{ imageRendering: 'pixelated', touchAction: 'none', width: currentMap.width * EDITOR_TILE_SIZE * zoom, height: currentMap.height * EDITOR_TILE_SIZE * zoom }} />
          </div>

          <aside className="w-44 flex-shrink-0 overflow-y-auto border-l border-zinc-800 bg-[#0e0e14] p-3 sm:w-56">
            <section className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-1 text-xs font-medium text-zinc-400"><Palette size={13} /> パレット</h3>
                <button aria-label="マップ複製" title="マップを複製" onClick={duplicateMap} className="text-zinc-500 hover:text-violet-400"><Copy size={13} /></button>
              </div>
              <div className="mb-3 grid grid-cols-5 gap-1.5">
                {DEFAULT_TILE_COLORS.map(color => <button key={color} aria-label={color} onClick={() => { setSelectedColor(color); setSelectedImage(''); }} className={`aspect-square rounded transition ${selectedColor === color && !selectedImage ? 'scale-110 ring-2 ring-violet-400' : 'hover:scale-105'}`} style={{ backgroundColor: color }} />)}
              </div>
              <Input type="color" value={selectedColor} onChange={event => setSelectedColor(event.target.value)} className="h-8 border-zinc-700 bg-zinc-800 p-1" />
              <Input value={selectedImage} onChange={event => setSelectedImage(event.target.value)} placeholder="タイル画像URL（任意）" className="mt-2 h-8 border-zinc-700 bg-zinc-800 text-xs" />
            </section>

            <section className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-1 text-xs font-medium text-zinc-400"><Layers size={13} /> レイヤー</h3>
                <button aria-label="レイヤー追加" onClick={addLayer} className="text-zinc-500 hover:text-violet-400"><Plus size={13} /></button>
              </div>
              <div className="space-y-1">
                {layerOrder.map(layerId => {
                  const settings = currentMap.layerSettings?.[layerId] || {};
                  return (
                    <div key={layerId} className={`rounded border p-1.5 ${activeLayer === layerId ? 'border-violet-500/40 bg-violet-500/10' : 'border-zinc-800 bg-zinc-900/40'}`}>
                      <div className="flex items-center gap-1">
                        {activeLayer === layerId ? <input value={settings.name || layerId} onChange={event => updateLayerSetting(layerId, 'name', event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs text-zinc-200 outline-none" /> : <button onClick={() => setActiveLayer(layerId)} className="min-w-0 flex-1 truncate text-left text-xs text-zinc-300">{settings.name || layerId}</button>}
                        <button aria-label="上へ" onClick={() => moveLayer(layerId, -1)} className="text-zinc-600 hover:text-zinc-200"><ChevronUp size={12} /></button>
                        <button aria-label="下へ" onClick={() => moveLayer(layerId, 1)} className="text-zinc-600 hover:text-zinc-200"><ChevronDown size={12} /></button>
                        <button aria-label="表示切替" onClick={() => updateLayerSetting(layerId, 'visible', settings.visible === false)} className="text-zinc-500 hover:text-zinc-200">{settings.visible === false ? <EyeOff size={12} /> : <Eye size={12} />}</button>
                        {!['ground', 'object'].includes(layerId) && <button aria-label="レイヤー削除" onClick={() => removeLayer(layerId)} className="text-zinc-600 hover:text-red-400"><Trash2 size={12} /></button>}
                      </div>
                      {activeLayer === layerId && <div className="mt-1 space-y-1"><input aria-label="不透明度" type="range" min="0" max="1" step="0.05" value={settings.opacity ?? 1} onChange={event => updateLayerSetting(layerId, 'opacity', Number(event.target.value))} className="w-full accent-violet-500" /><label className="flex items-center gap-1.5 text-[10px] text-zinc-500"><input type="checkbox" checked={settings.collision === true} onChange={event => updateLayerSetting(layerId, 'collision', event.target.checked)} className="accent-violet-500" />配置タイルを通行不可</label><label className="flex items-center gap-1.5 text-[10px] text-zinc-500"><input type="checkbox" checked={settings.aboveCharacters === true} onChange={event => updateLayerSetting(layerId, 'aboveCharacters', event.target.checked)} className="accent-violet-500" />キャラクターより前</label></div>}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mb-4 space-y-2 border-t border-zinc-800 pt-3">
              <Label className="text-xs text-zinc-400">マップ名</Label>
              <Input value={currentMap.name} onChange={event => updateMap('name', event.target.value)} className="h-8 border-zinc-700 bg-zinc-800 text-xs" />
              <div className="grid grid-cols-2 gap-2">
                <NumberInput value={currentMap.width} onCommit={value => updateMap('width', value)} className="h-8 border-zinc-700 bg-zinc-800 text-xs" title="横幅" />
                <NumberInput value={currentMap.height} onCommit={value => updateMap('height', value)} className="h-8 border-zinc-700 bg-zinc-800 text-xs" title="高さ" />
              </div>
              <NumberInput value={currentMap.tileSize} onCommit={value => updateMap('tileSize', value)} min={8} max={128} className="h-8 border-zinc-700 bg-zinc-800 text-xs" title="ゲーム内タイルサイズ" />
              <Input type="color" value={currentMap.bgColor || '#111827'} onChange={event => updateMap('bgColor', event.target.value)} className="h-8 border-zinc-700 bg-zinc-800 p-1" />
            </section>

            <section className="mb-4 border-t border-zinc-800 pt-3">
              <Label className="mb-1 block text-xs text-zinc-400">背景画像</Label>
              {currentMap.bgImage ? (
                <div className="relative"><img src={currentMap.bgImage} alt="背景" className="h-20 w-full rounded border border-zinc-700 object-cover" /><button aria-label="背景削除" onClick={() => updateMap('bgImage', '')} className="absolute right-1 top-1 rounded bg-black/70 p-0.5 text-white hover:text-red-400"><X size={12} /></button></div>
              ) : (
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300"><input type="file" accept="image/*" onChange={event => uploadBackground(event.target.files?.[0])} className="hidden" /><Upload size={14} /> 画像を選択</label>
              )}
            </section>

            {!!currentMap.events?.length && <section className="border-t border-zinc-800 pt-3"><h3 className="mb-2 flex items-center gap-1 text-xs font-medium text-zinc-400"><Zap size={13} /> イベント ({currentMap.events.length})</h3><div className="space-y-1">{currentMap.events.map(event => <div key={event.id} className="truncate rounded bg-zinc-800/50 px-2 py-1 text-xs text-zinc-400">{event.name} ({event.x},{event.y})</div>)}</div></section>}
          </aside>
        </div>
      </div>
    </div>
  );
}
