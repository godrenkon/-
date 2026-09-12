import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Plus, Trash2, ToggleLeft, Sliders, ListChecks, Eye } from 'lucide-react';

export default function SettingsScreenEditor({ gameData, updateGameData }) {
  const { t } = useI18n();
  const items = gameData.settingsScreen || [];

  const update = (newItems) => {
    updateGameData(prev => ({ ...prev, settingsScreen: newItems }));
  };

  const addItem = (type) => {
    const newItem = {
      id: `set_${Date.now()}`,
      type,
      label: type === 'toggle' ? '設定項目' : type === 'slider' ? '音量' : '選択項目',
      targetType: type === 'toggle' ? 'switch' : 'variable',
      targetId: items.length + 1,
      defaultValue: type === 'toggle' ? false : type === 'slider' ? 50 : 0,
      min: 0,
      max: 100,
      options: ['オプション1', 'オプション2'],
    };
    update([...items, newItem]);
  };

  const updateItem = (id, field, value) => {
    update(items.map(it => it.id === id ? { ...it, [field]: value } : it));
  };

  const removeItem = (id) => {
    update(items.filter(it => it.id !== id));
  };

  const typeIcons = {
    toggle: ToggleLeft,
    slider: Sliders,
    select: ListChecks,
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye size={22} className="text-violet-400" />
            <h2 className="text-lg font-semibold">ゲーム内設定画面</h2>
          </div>
        </div>

        <p className="text-sm text-zinc-400">
          プレイヤーがゲーム中に開ける設定画面の項目を自由に作成できます。各項目はスイッチや変数に紐付けられ、プラグインやイベントから参照できます。
        </p>

        {/* Add buttons */}
        <div className="flex gap-2">
          <Button size="sm" onClick={() => addItem('toggle')} variant="outline" className="border-zinc-700">
            <ToggleLeft size={16} className="mr-1" /> ON/OFF項目
          </Button>
          <Button size="sm" onClick={() => addItem('slider')} variant="outline" className="border-zinc-700">
            <Sliders size={16} className="mr-1" /> スライダー項目
          </Button>
          <Button size="sm" onClick={() => addItem('select')} variant="outline" className="border-zinc-700">
            <ListChecks size={16} className="mr-1" /> 選択項目
          </Button>
        </div>

        {/* Items list */}
        {items.length === 0 ? (
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-8 text-center">
            <p className="text-sm text-zinc-500">設定項目がありません。上のボタンから追加してください。</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const Icon = typeIcons[item.type];
              return (
                <div key={item.id} className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-violet-400">
                      <Icon size={16} />
                      <span className="text-xs font-medium">
                        {item.type === 'toggle' ? 'ON/OFF' : item.type === 'slider' ? 'スライダー' : '選択'}
                      </span>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-zinc-500 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs text-zinc-400">ラベル</Label>
                      <Input value={item.label} onChange={(e) => updateItem(item.id, 'label', e.target.value)} className="bg-zinc-800 border-zinc-700 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-400">紐付け先</Label>
                      <Select value={item.targetType} onValueChange={(v) => updateItem(item.id, 'targetType', v)}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="switch">スイッチ</SelectItem>
                          <SelectItem value="variable">変数</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-400">{item.targetType === 'switch' ? 'スイッチ' : '変数'}番号</Label>
                      <Input type="number" value={item.targetId} onChange={(e) => updateItem(item.id, 'targetId', parseInt(e.target.value) || 1)} className="bg-zinc-800 border-zinc-700 text-sm" />
                    </div>
                  </div>

                  {item.type === 'toggle' && (
                    <div>
                      <Label className="text-xs text-zinc-400">デフォルト値</Label>
                      <Select value={String(item.defaultValue)} onValueChange={(v) => updateItem(item.id, 'defaultValue', v === 'true')}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="false">OFF</SelectItem>
                          <SelectItem value="true">ON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {item.type === 'slider' && (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs text-zinc-400">最小値</Label>
                        <Input type="number" value={item.min} onChange={(e) => updateItem(item.id, 'min', parseInt(e.target.value) || 0)} className="bg-zinc-800 border-zinc-700 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-zinc-400">最大値</Label>
                        <Input type="number" value={item.max} onChange={(e) => updateItem(item.id, 'max', parseInt(e.target.value) || 100)} className="bg-zinc-800 border-zinc-700 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-zinc-400">デフォルト</Label>
                        <Input type="number" value={item.defaultValue} onChange={(e) => updateItem(item.id, 'defaultValue', parseInt(e.target.value) || 0)} className="bg-zinc-800 border-zinc-700 text-sm" />
                      </div>
                    </div>
                  )}

                  {item.type === 'select' && (
                    <div>
                      <Label className="text-xs text-zinc-400">選択肢（カンマ区切り）</Label>
                      <Input
                        value={(item.options || []).join(', ')}
                        onChange={(e) => updateItem(item.id, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        className="bg-zinc-800 border-zinc-700 text-sm"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}