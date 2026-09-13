import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { rpgStore } from '@/lib/rpgStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Keyboard, Smartphone, Eye, Plus, Trash2, Upload, GripVertical } from 'lucide-react';

const ACTIONS = [
  { id: 'up', label: '上移動' },
  { id: 'down', label: '下移動' },
  { id: 'left', label: '左移動' },
  { id: 'right', label: '右移動' },
  { id: 'action', label: '決定/話す' },
  { id: 'cancel', label: 'キャンセル' },
  { id: 'menu', label: 'メニュー' },
  { id: 'dash', label: 'ダッシュ' },
];

const DEFAULT_CONFIG = {
  keyBindings: {
    up: ['ArrowUp', 'w'],
    down: ['ArrowDown', 's'],
    left: ['ArrowLeft', 'a'],
    right: ['ArrowRight', 'd'],
    action: ['Enter', ' '],
    cancel: ['Escape'],
    menu: ['m'],
    dash: ['Shift'],
  },
  touchButtons: [],
  showHUD: true,
  showGold: true,
  showMapName: true,
  showSettingsButton: true,
  touchEnabled: false,
  touchSwitchId: null,
  dpadStyle: 'cross',
  dpadSize: 120,
  dpadPosition: 'bottom-left',
  actionButtonSize: 64,
  actionButtonPosition: 'bottom-right',
};

export default function ControlEditor({ gameData, updateGameData }) {
  const { t } = useI18n();
  const config = { ...DEFAULT_CONFIG, ...(gameData.controlConfig || {}) };
  const [listeningAction, setListeningAction] = useState(null);
  const [uploading, setUploading] = useState(null);

  const update = (field, value) => {
    updateGameData(prev => ({
      ...prev,
      controlConfig: { ...DEFAULT_CONFIG, ...(prev.controlConfig || {}), [field]: value },
    }));
  };

  const bindKey = (action, slot) => {
    setListeningAction({ action, slot });
    const handler = (e) => {
      e.preventDefault();
      const key = e.key === ' ' ? 'Space' : e.key;
      const newBindings = { ...config.keyBindings };
      newBindings[action] = newBindings[action] || [];
      newBindings[action][slot] = key;
      update('keyBindings', newBindings);
      setListeningAction(null);
      window.removeEventListener('keydown', handler);
    };
    window.addEventListener('keydown', handler);
  };

  const unbindKey = (action, slot) => {
    const newBindings = { ...config.keyBindings };
    newBindings[action] = (newBindings[action] || []).filter((_, i) => i !== slot);
    update('keyBindings', newBindings);
  };

  const addTouchButton = () => {
    const newBtn = {
      id: `btn_${Date.now()}`,
      action: 'action',
      label: 'ボタン',
      x: 70,
      y: 80,
      size: 56,
      image: '',
      shape: 'circle',
      color: '#7c3aed',
    };
    update('touchButtons', [...(config.touchButtons || []), newBtn]);
  };

  const updateTouchButton = (id, field, value) => {
    update('touchButtons', (config.touchButtons || []).map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const removeTouchButton = (id) => {
    update('touchButtons', (config.touchButtons || []).filter(b => b.id !== id));
  };

  const handleButtonImageUpload = async (id, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(id);
    try {
      const { file_url } = await rpgStore.integrations.Core.UploadFile({ file });
      updateTouchButton(id, 'image', file_url);
    } catch (err) {
      toast({ title: t('error'), variant: 'destructive' });
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl space-y-5">
        {/* PC Key Bindings */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 space-y-4">
          <h2 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Keyboard size={16} /> PC キー設定
          </h2>
          <div className="space-y-2">
            {ACTIONS.map(act => (
              <div key={act.id} className="flex items-center gap-3">
                <span className="text-sm text-zinc-400 w-24">{act.label}</span>
                <div className="flex gap-2 flex-1">
                  {(config.keyBindings[act.id] || []).map((key, slot) => (
                    <button
                      key={slot}
                      onClick={() => unbindKey(act.id, slot)}
                      className="px-3 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 hover:border-red-500/50 hover:text-red-400 transition"
                    >
                      {key === 'Space' ? 'スペース' : key} ✕
                    </button>
                  ))}
                  {(config.keyBindings[act.id] || []).length < 2 && (
                    <button
                      onClick={() => bindKey(act.id, (config.keyBindings[act.id] || []).length)}
                      className={`px-3 py-1.5 rounded-md border text-sm transition ${
                        listeningAction?.action === act.id
                          ? 'border-violet-500 bg-violet-600/20 text-violet-300 animate-pulse'
                          : 'border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
                      }`}
                    >
                      {listeningAction?.action === act.id ? 'キーを押す...' : '+ キー割り当て'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Touch Controls */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <Smartphone size={16} /> スマホ タッチ設定
            </h2>
            <Button size="sm" onClick={addTouchButton} className="bg-violet-600 hover:bg-violet-500 h-7">
              <Plus size={14} className="mr-1" /> ボタン追加
            </Button>
          </div>

          {/* Enable toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={config.touchEnabled === true} onChange={(e) => update('touchEnabled', e.target.checked)} className="w-4 h-4 rounded accent-violet-600" />
            <span className="text-sm text-zinc-300">タッチ操作を有効にする（自分で用意する場合のみON）</span>
          </label>
          {config.touchEnabled && (
            <div>
              <Label className="text-xs text-zinc-500">表示/非表示スイッチ番号（任意）</Label>
              <Input type="number" value={config.touchSwitchId || ''} onChange={(e) => update('touchSwitchId', e.target.value ? parseInt(e.target.value) : null)} className="bg-zinc-800 border-zinc-700 text-sm h-8" placeholder="例: 299" />
              <p className="text-xs text-zinc-500 mt-1">指定したスイッチがONの時だけ表示。ゲーム内設定画面でON/OFFできます。</p>
            </div>
          )}

          {/* D-Pad settings */}
          <div className="bg-zinc-950/30 rounded-lg p-3 space-y-3 border border-zinc-800/50">
            <span className="text-xs font-medium text-zinc-400">Dパッド</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-zinc-500">スタイル</Label>
                <Select value={config.dpadStyle} onValueChange={(v) => update('dpadStyle', v)}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm h-8"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="cross">十字</SelectItem>
                    <SelectItem value="circle">丸</SelectItem>
                    <SelectItem value="arrows">矢印</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-zinc-500">サイズ (px)</Label>
                <Input
                  type="number"
                  value={config.dpadSize}
                  onChange={(e) => update('dpadSize', parseInt(e.target.value) || 120)}
                  className="bg-zinc-800 border-zinc-700 text-sm h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-500">位置</Label>
                <Select value={config.dpadPosition} onValueChange={(v) => update('dpadPosition', v)}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm h-8"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="bottom-left">左下</SelectItem>
                    <SelectItem value="bottom-right">右下</SelectItem>
                    <SelectItem value="top-left">左上</SelectItem>
                    <SelectItem value="top-right">右上</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-zinc-500">アクションボタンサイズ</Label>
                <Input
                  type="number"
                  value={config.actionButtonSize}
                  onChange={(e) => update('actionButtonSize', parseInt(e.target.value) || 64)}
                  className="bg-zinc-800 border-zinc-700 text-sm h-8"
                />
              </div>
            </div>
          </div>

          {/* Custom buttons */}
          {(config.touchButtons || []).length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-zinc-400">カスタムボタン</span>
              {config.touchButtons.map(btn => (
                <div key={btn.id} className="bg-zinc-950/30 rounded-lg p-3 border border-zinc-800/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <GripVertical size={14} className="text-zinc-600" />
                    <button onClick={() => removeTouchButton(btn.id)} className="text-zinc-500 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs text-zinc-500">アクション</Label>
                      <Select value={btn.action} onValueChange={(v) => updateTouchButton(btn.id, 'action', v)}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm h-8"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          {ACTIONS.map(a => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-500">ラベル</Label>
                      <Input value={btn.label} onChange={(e) => updateTouchButton(btn.id, 'label', e.target.value)} className="bg-zinc-800 border-zinc-700 text-sm h-8" />
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-500">サイズ</Label>
                      <Input type="number" value={btn.size} onChange={(e) => updateTouchButton(btn.id, 'size', parseInt(e.target.value) || 56)} className="bg-zinc-800 border-zinc-700 text-sm h-8" />
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-500">X位置 (%)</Label>
                      <Input type="number" value={btn.x} onChange={(e) => updateTouchButton(btn.id, 'x', parseInt(e.target.value) || 0)} className="bg-zinc-800 border-zinc-700 text-sm h-8" />
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-500">Y位置 (%)</Label>
                      <Input type="number" value={btn.y} onChange={(e) => updateTouchButton(btn.id, 'y', parseInt(e.target.value) || 0)} className="bg-zinc-800 border-zinc-700 text-sm h-8" />
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-500">形</Label>
                      <Select value={btn.shape} onValueChange={(v) => updateTouchButton(btn.id, 'shape', v)}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm h-8"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="circle">丸</SelectItem>
                          <SelectItem value="square">四角</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0">
                      {btn.image ? (
                        <img src={btn.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">{btn.label[0]}</div>
                      )}
                    </div>
                    <label>
                      <input type="file" accept="image/*" onChange={(e) => handleButtonImageUpload(btn.id, e)} className="hidden" />
                      <span className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 cursor-pointer">
                        <Upload size={14} /> {uploading === btn.id ? 'アップロード中...' : '画像アップロード'}
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
 )}
        </div>

        {/* HUD Settings */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-5 space-y-4">
          <h2 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Eye size={16} /> 表示設定 (HUD)
          </h2>
          <div className="space-y-2">
            {[
              { field: 'showHUD', label: 'HUD全体' },
              { field: 'showGold', label: '所持金表示' },
              { field: 'showMapName', label: 'マップ名表示' },
              { field: 'showSettingsButton', label: '設定ボタン表示' },
            ].map(item => (
              <label key={item.field} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config[item.field] !== false}
                  onChange={(e) => update(item.field, e.target.checked)}
                  className="w-4 h-4 rounded accent-violet-600"
                />
                <span className="text-sm text-zinc-300">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}