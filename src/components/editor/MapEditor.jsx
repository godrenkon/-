import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Pencil, Square, PaintBucket, Eraser, Zap, Plus, Trash2, ChevronRight,
  Layers, Palette, Grid3x3, Upload, X
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';

const DEFAULT_TILE_COLORS = [
  '#4a7c3a', '#3b6b2a', '#8b7355', '#c2b280', '#3b82f6', '#1e40af',
  '#6b4423', '#8b4513', '#9ca3af', '#6b7280', '#fbbf24', '#f97316',
  '#dc2626', '#7c3aed', '#ec4899', '#14b8a6',
];

let mapIdCounter = 0;
const genMapId = () => `map_${Date.now()}_${mapIdCounter++}`;

function MapSettingInput({ value, onChange, ...props }) {
  const [local, setLocal] = useState(String(value ?? ''));
  useEffect(() => { setLocal(String(value ?? '')); }, [value]);
  return (
    <Input
      type="number"
      value={local}
      onChange={(e) => {
        setLocal(e.target.value);
        const n = parseInt(e.target.value);
        if (!isNaN(n) && n > 0) onChange(n);
      }}
      {...props}
    />
  );
}

export default function MapEditor({ gameData, updateGameData, selectedMapId, setSelectedMapId }) {
  const { t } = useI18n();
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('pencil');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_TILE_COLORS[0]);
  const [activeLayer, setActiveLayer] = useState('ground');
  const [showGrid, setShowGrid] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);

  const maps = gameData.maps || [];
  const currentMap = maps.find(m => m.id === selectedMapId);

  useEffect(() => {
    if (!selectedMapId && maps.length > 0) {
      setSelectedMapId(maps[0].id);
    }
  }, [maps, selectedMapId]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentMap) return;
    const ctx = canvas.getContext('2d');
    const ts = currentMap.tileSize || 32;
    canvas.width = currentMap.width * ts;
    canvas.height = currentMap.height * ts;

    ctx.fillStyle = currentMap.bgColor || '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (currentMap.layers?.ground) {
      for (let y = 0; y < currentMap.height; y++) {
        for (let x = 0; x < currentMap.width; x++) {
          const tile = currentMap.layers.ground[y]?.[x];
          if (tile) {
            ctx.fillStyle = tile;
            ctx.fillRect(x * ts, y * ts, ts, ts);
          }
        }
      }
    }

    if (currentMap.layers?.object) {
      for (let y = 0; y < currentMap.height; y++) {
        for (let x = 0; x < currentMap.width; x++) {
          const tile = currentMap.layers.object[y]?.[x];
          if (tile) {
            ctx.fillStyle = tile + 'cc';
            ctx.fillRect(x * ts, y * ts, ts, ts);
          }
        }
      }
    }

    if (showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= currentMap.width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * ts, 0);
        ctx.lineTo(x * ts, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= currentMap.height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * ts);
        ctx.lineTo(canvas.width, y * ts);
        ctx.stroke();
      }
    }

    if (currentMap.events) {
      currentMap.events.forEach(ev => {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.strokeRect(ev.x * ts + 2, ev.y * ts + 2, ts - 4, ts - 4);
        ctx.fillStyle = 'rgba(251,191,36,0.2)';
        ctx.fillRect(ev.x * ts + 2, ev.y * ts + 2, ts - 4, ts - 4);
      });
    }
  }, [currentMap, showGrid]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const getTilePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const ts = currentMap.tileSize || 32;
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / ts);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / ts);
    if (x < 0 || x >= currentMap.width || y < 0 || y >= currentMap.height) return null;
    return { x, y };
  };

  const paintTile = (x, y) => {
    if (!currentMap) return;
    if (tool === 'event') {
      addEvent(x, y);
      return;
    }
    const layer = activeLayer;
    updateGameData(prev => {
      const newMaps = [...(prev.maps || [])];
      const mi = newMaps.findIndex(m => m.id === currentMap.id);
      if (mi < 0) return prev;
      const map = JSON.parse(JSON.stringify(newMaps[mi]));
      if (!map.layers[layer]) {
        map.layers[layer] = Array(map.height).fill(null).map(() => Array(map.width).fill(null));
      }
      if (tool === 'pencil') {
        if (!map.layers[layer][y]) map.layers[layer][y] = Array(map.width).fill(null);
        map.layers[layer][y][x] = selectedColor;
      } else if (tool === 'eraser') {
        map.layers[layer][y][x] = null;
      } else if (tool === 'fill') {
        floodFill(map.layers[layer], x, y, map.layers[layer][y]?.[x] || null, selectedColor, currentMap.width, currentMap.height);
      }
      newMaps[mi] = map;
      return { ...prev, maps: newMaps };
    });
  };

  const floodFill = (grid, sx, sy, target, replacement, w, h) => {
    if (target === replacement) return;
    const stack = [[sx, sy]];
    while (stack.length > 0) {
      const [x, y] = stack.pop();
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const current = grid[y]?.[x] || null;
      if (current !== target) continue;
      if (!grid[y]) grid[y] = Array(w).fill(null);
      grid[y][x] = replacement;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  };

  const addEvent = (x, y) => {
    updateGameData(prev => {
      const newMaps = [...(prev.maps || [])];
      const mi = newMaps.findIndex(m => m.id === currentMap.id);
      if (mi < 0) return prev;
      const map = JSON.parse(JSON.stringify(newMaps[mi]));
      if (!map.events) map.events = [];
      map.events.push({
        id: `evt_${Date.now()}`,
        x, y,
        name: t('editor_event_new'),
        graphic: '',
        trigger: 'action',
        priority: 'same',
        moveType: 'fixed',
        moveSpeed: 3,
        pages: [{ conditions: [], commands: [] }],
        commands: [],
      });
      newMaps[mi] = map;
      return { ...prev, maps: newMaps };
    });
  };

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const pos = getTilePos(e);
    if (pos) paintTile(pos.x, pos.y);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !currentMap) return;
    const pos = getTilePos(e);
    if (pos) paintTile(pos.x, pos.y);
  };

  const handleMouseUp = () => setIsDrawing(false);

  const addMap = () => {
    const newMap = {
      id: genMapId(),
      name: `${t('editor_map_name')} ${(maps || []).length + 1}`,
      width: 20,
      height: 15,
      tileSize: 32,
      bgColor: '#1a1a2e',
      layers: {
        ground: Array(15).fill(null).map(() => Array(20).fill(null)),
        object: Array(15).fill(null).map(() => Array(20).fill(null)),
      },
      events: [],
    };
    updateGameData(prev => ({
      ...prev,
      maps: [...(prev.maps || []), newMap],
    }));
    setSelectedMapId(newMap.id);
  };

  const deleteMap = (mapId) => {
    if (!confirm(t('deleteConfirm'))) return;
    updateGameData(prev => ({
      ...prev,
      maps: (prev.maps || []).filter(m => m.id !== mapId),
    }));
    if (selectedMapId === mapId) {
      const remaining = maps.filter(m => m.id !== mapId);
      setSelectedMapId(remaining[0]?.id || null);
    }
  };

  const updateMap = (field, value) => {
    if (!currentMap) return;
    updateGameData(prev => {
      const newMaps = (prev.maps || []).map(m =>
        m.id === currentMap.id ? { ...m, [field]: value } : m
      );
      return { ...prev, maps: newMaps };
    });
  };

  const tools = [
    { id: 'pencil', icon: Pencil, label: t('editor_tool_pencil') },
    { id: 'rect', icon: Square, label: t('editor_tool_rect') },
    { id: 'fill', icon: PaintBucket, label: t('editor_tool_fill') },
    { id: 'eraser', icon: Eraser, label: t('editor_tool_eraser') },
    { id: 'event', icon: Zap, label: t('editor_tool_event') },
  ];

  const layers = [
    { id: 'ground', label: t('editor_layer_ground') },
    { id: 'object', label: t('editor_layer_object') },
  ];

  if (!currentMap && maps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Grid3x3 size={48} className="text-zinc-700" />
        <p className="text-zinc-500">{t('editor_add_map')}</p>
        <Button onClick={addMap} className="bg-violet-600 hover:bg-violet-500">
          <Plus size={16} className="mr-1" /> {t('editor_add_map')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Map list sidebar */}
      <div className="w-48 bg-[#0e0e14] border-r border-zinc-800 flex flex-col flex-shrink-0">
        <div className="p-2 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400 px-1">マップ</span>
          <button onClick={addMap} className="text-zinc-400 hover:text-violet-400 p-1">
            <Plus size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {maps.map((m) => (
            <div
              key={m.id}
              className={`group flex items-center gap-1 px-2 py-1.5 rounded text-xs cursor-pointer transition ${
                m.id === selectedMapId ? 'bg-violet-600/15 text-violet-300' : 'text-zinc-400 hover:bg-zinc-800/50'
              }`}
              onClick={() => setSelectedMapId(m.id)}
            >
              <ChevronRight size={12} className="flex-shrink-0 opacity-50" />
              <span className="truncate flex-1">{m.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteMap(m.id); }}
                className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main editing area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#0e0e14] border-b border-zinc-800 flex-wrap">
          <div className="flex items-center gap-0.5 bg-zinc-800/50 rounded-lg p-0.5">
            {tools.map(tl => (
              <button
                key={tl.id}
                onClick={() => setTool(tl.id)}
                title={tl.label}
                className={`p-1.5 rounded-md transition ${tool === tl.id ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                <tl.icon size={16} />
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-zinc-700" />

          <div className="flex items-center gap-1">
            {layers.map(l => (
              <button
                key={l.id}
                onClick={() => setActiveLayer(l.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  activeLayer === l.id ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30' : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <Layers size={12} className="inline mr-1" />{l.label}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-zinc-700" />

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-md transition ${showGrid ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-300'}`}
            title="Grid"
          >
            <Grid3x3 size={16} />
          </button>

          {currentMap && (
            <div className="flex items-center gap-2 ml-auto">
              <Input
                type="text"
                value={currentMap.name}
                onChange={(e) => updateMap('name', e.target.value)}
                className="h-7 w-32 bg-zinc-800 border-zinc-700 text-xs"
              />
              <MapSettingInput
                value={currentMap.width}
                onChange={(v) => updateMap('width', v)}
                className="h-7 w-16 bg-zinc-800 border-zinc-700 text-xs"
                title={t('editor_map_width')}
              />
              <span className="text-zinc-600 text-xs">×</span>
              <MapSettingInput
                value={currentMap.height}
                onChange={(v) => updateMap('height', v)}
                className="h-7 w-16 bg-zinc-800 border-zinc-700 text-xs"
                title={t('editor_map_height')}
              />
              <MapSettingInput
                value={currentMap.tileSize}
                onChange={(v) => updateMap('tileSize', v)}
                className="h-7 w-16 bg-zinc-800 border-zinc-700 text-xs"
                title={t('editor_tile_size')}
              />
              <Input
                type="color"
                value={currentMap.bgColor}
                onChange={(e) => updateMap('bgColor', e.target.value)}
                className="h-7 w-8 bg-zinc-800 border-zinc-700 p-0.5"
                title={t('editor_bg_color')}
              />
            </div>
          )}
        </div>

        {/* Canvas + palette */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto bg-[#08080c] p-4 flex items-start justify-center">
            {currentMap && (
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="border border-zinc-700 cursor-crosshair max-w-none"
                style={{ imageRendering: 'pixelated' }}
              />
            )}
          </div>

          <div className="w-44 bg-[#0e0e14] border-l border-zinc-800 p-3 overflow-y-auto flex-shrink-0">
            <h3 className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1">
              <Palette size={13} /> {t('editor_tile_palette')}
            </h3>
            <div className="grid grid-cols-4 gap-1.5 mb-4">
              {DEFAULT_TILE_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`aspect-square rounded transition ${
                    selectedColor === color ? 'ring-2 ring-violet-400 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="mb-3">
              <Label className="text-xs text-zinc-400 mb-1 block">{t('editor_bg_color')}</Label>
              <Input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="h-8 bg-zinc-800 border-zinc-700"
              />
            </div>

            <div className="mb-3">
              <Label className="text-xs text-zinc-400 mb-1 block">背景画像</Label>
              {currentMap?.bgImage ? (
                <div className="relative">
                  <img src={currentMap.bgImage} alt="" className="w-full h-20 object-cover rounded border border-zinc-700" />
                  <button onClick={() => updateMap('bgImage', '')} className="absolute top-1 right-1 p-0.5 rounded bg-black/60 text-white hover:text-red-400"><X size={12} /></button>
                </div>
              ) : (
                <label>
                  <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { const { file_url } = await base44.integrations.Core.UploadFile({ file: f }); updateMap('bgImage', file_url); } catch { toast({ title: 'アップロードエラー', variant: 'destructive' }); } }} className="hidden" />
                  <span className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 cursor-pointer"><Upload size={14} /> 画像をアップロード</span>
                </label>
              )}
            </div>

            {currentMap?.events && currentMap.events.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1">
                  <Zap size={13} /> {t('editor_event_list')} ({currentMap.events.length})
                </h3>
                <div className="space-y-1">
                  {currentMap.events.map(ev => (
                    <div key={ev.id} className="text-xs text-zinc-400 px-2 py-1 rounded bg-zinc-800/50 truncate">
                      {ev.name} ({ev.x},{ev.y})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}