import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  MessageSquare, ListPlus, Package, Coins, ToggleLeft, Hash, GitBranch, MapPin,
  Music, Volume2, Swords, Clock, Palette, MoveRight, Image, Eye, Tag,
  ArrowRightLeft, MessageCircle, Settings, Users, Heart, Zap, Shield, Star,
  UserCog, Sparkles, Film, Monitor, Save, Menu, Hash as HashIcon, ScrollText,
  Gamepad2, Home, Repeat, Layers, Ghost, PersonStanding, Bell, ShoppingBag,
  Lock, Grid, Database
} from 'lucide-react';

export const COMMAND_CATEGORIES = [
  {
    id: 'message', labelKey: 'editor_cmd_category_message', commands: [
      { id: 'message', icon: MessageSquare, labelKey: 'editor_cmd_message' },
      { id: 'choices', icon: ListPlus, labelKey: 'editor_cmd_choices' },
      { id: 'scroll_text', icon: ScrollText, labelKey: 'editor_cmd_scroll_text' },
      { id: 'input_number', icon: HashIcon, labelKey: 'editor_cmd_input_number' },
    ]
  },
  {
    id: 'actor', labelKey: 'editor_cmd_category_actor', commands: [
      { id: 'change_party', icon: Users, labelKey: 'editor_cmd_change_party' },
      { id: 'change_hp', icon: Heart, labelKey: 'editor_cmd_change_hp' },
      { id: 'change_mp', icon: Sparkles, labelKey: 'editor_cmd_change_mp' },
      { id: 'change_exp', icon: Star, labelKey: 'editor_cmd_change_exp' },
      { id: 'change_level', icon: Zap, labelKey: 'editor_cmd_change_level' },
      { id: 'change_param', icon: Shield, labelKey: 'editor_cmd_change_param' },
      { id: 'recover_all', icon: Heart, labelKey: 'editor_cmd_recover_all' },
      { id: 'change_equipment', icon: Package, labelKey: 'editor_cmd_change_equipment' },
      { id: 'change_name', icon: UserCog, labelKey: 'editor_cmd_change_name' },
      { id: 'change_class', icon: UserCog, labelKey: 'editor_cmd_change_class' },
      { id: 'change_graphic', icon: Image, labelKey: 'editor_cmd_change_graphic' },
      { id: 'change_formation', icon: Users, labelKey: 'editor_cmd_change_formation' },
    ]
  },
  {
    id: 'item', labelKey: 'editor_cmd_category_item', commands: [
      { id: 'item', icon: Package, labelKey: 'editor_cmd_item' },
      { id: 'gold', icon: Coins, labelKey: 'editor_cmd_gold' },
      { id: 'change_gold_variable', icon: Coins, labelKey: 'editor_cmd_change_gold_variable' },
      { id: 'change_item_variable', icon: Package, labelKey: 'editor_cmd_change_item_variable' },
    ]
  },
  {
    id: 'flow', labelKey: 'editor_cmd_category_flow', commands: [
      { id: 'battle', icon: Swords, labelKey: 'editor_cmd_battle' },
      { id: 'open_shop', icon: ShoppingBag, labelKey: 'editor_cmd_open_shop' },
      { id: 'open_save', icon: Save, labelKey: 'editor_cmd_open_save' },
      { id: 'open_menu', icon: Menu, labelKey: 'editor_cmd_open_menu' },
      { id: 'game_over', icon: Eye, labelKey: 'editor_cmd_game_over' },
      { id: 'return_title', icon: Home, labelKey: 'editor_cmd_return_title' },
      { id: 'change_encounter', icon: Repeat, labelKey: 'editor_cmd_change_encounter' },
      { id: 'change_save_access', icon: Lock, labelKey: 'editor_cmd_change_save_access' },
      { id: 'change_menu_access', icon: Lock, labelKey: 'editor_cmd_change_menu_access' },
    ]
  },
  {
    id: 'map', labelKey: 'editor_cmd_category_map', commands: [
      { id: 'transfer', icon: MapPin, labelKey: 'editor_cmd_transfer' },
      { id: 'scroll_map', icon: MoveRight, labelKey: 'editor_cmd_scroll_map' },
      { id: 'set_event_location', icon: MapPin, labelKey: 'editor_cmd_set_event_location' },
      { id: 'change_tileset', icon: Layers, labelKey: 'editor_cmd_change_tileset' },
      { id: 'change_player_graphic', icon: PersonStanding, labelKey: 'editor_cmd_change_player_graphic' },
      { id: 'set_move_speed', icon: Gamepad2, labelKey: 'editor_cmd_set_move_speed' },
      { id: 'transparent', icon: Ghost, labelKey: 'editor_cmd_transparent' },
      { id: 'gather_followers', icon: Users, labelKey: 'editor_cmd_gather_followers' },
      { id: 'get_location_info', icon: Grid, labelKey: 'editor_cmd_get_location_info' },
      { id: 'wait_for_movement', icon: Clock, labelKey: 'editor_cmd_wait_for_movement' },
    ]
  },
  {
    id: 'screen', labelKey: 'editor_cmd_category_screen', commands: [
      { id: 'tint', icon: Palette, labelKey: 'editor_cmd_tint' },
      { id: 'shake', icon: MoveRight, labelKey: 'editor_cmd_shake' },
      { id: 'fade_screen', icon: Eye, labelKey: 'editor_cmd_fade_screen' },
      { id: 'flash_screen', icon: Sparkles, labelKey: 'editor_cmd_flash_screen' },
      { id: 'weather', icon: Eye, labelKey: 'editor_cmd_weather' },
      { id: 'show_animation', icon: Sparkles, labelKey: 'editor_cmd_show_animation' },
      { id: 'show_balloon', icon: Bell, labelKey: 'editor_cmd_show_balloon' },
      { id: 'change_window_color', icon: Palette, labelKey: 'editor_cmd_change_window_color' },
    ]
  },
  {
    id: 'audio', labelKey: 'editor_cmd_category_audio', commands: [
      { id: 'bgm', icon: Music, labelKey: 'editor_cmd_bgm' },
      { id: 'se', icon: Volume2, labelKey: 'editor_cmd_se' },
      { id: 'change_system_bgm', icon: Music, labelKey: 'editor_cmd_change_system_bgm' },
      { id: 'play_movie', icon: Film, labelKey: 'editor_cmd_play_movie' },
    ]
  },
  {
    id: 'advanced', labelKey: 'editor_cmd_category_advanced', commands: [
      { id: 'switch', icon: ToggleLeft, labelKey: 'editor_cmd_switch' },
      { id: 'variable', icon: Hash, labelKey: 'editor_cmd_variable' },
      { id: 'change_self_switch', icon: ToggleLeft, labelKey: 'editor_cmd_change_self_switch' },
      { id: 'condition', icon: GitBranch, labelKey: 'editor_cmd_condition' },
      { id: 'label', icon: Tag, labelKey: 'editor_cmd_label' },
      { id: 'jump', icon: ArrowRightLeft, labelKey: 'editor_cmd_jump' },
      { id: 'comment', icon: MessageCircle, labelKey: 'editor_cmd_comment' },
      { id: 'common', icon: Settings, labelKey: 'editor_cmd_common' },
      { id: 'wait', icon: Clock, labelKey: 'editor_cmd_wait' },
      { id: 'erase', icon: Eye, labelKey: 'editor_cmd_erase' },
      { id: 'move_route', icon: MoveRight, labelKey: 'editor_cmd_move_route' },
      { id: 'show_picture', icon: Image, labelKey: 'editor_cmd_show_picture' },
      { id: 'erase_picture', icon: Image, labelKey: 'editor_cmd_erase_picture' },
    ]
  },
];

export const ALL_COMMANDS = COMMAND_CATEGORIES.flatMap(c => c.commands);
export const COMMAND_MAP = Object.fromEntries(ALL_COMMANDS.map(c => [c.id, c]));

export function getCommandSummary(cmd, t) {
  const p = cmd.params || {};
  switch (cmd.type) {
    case 'message': return p.text ? `"${p.text.slice(0, 30)}"` : '';
    case 'item': return `${p.itemName || '?'} ${p.operation || '+'} ${p.amount || 1}`;
    case 'gold': return `${p.operation || '+'} ${p.amount || 0}`;
    case 'switch': return `${p.switchName || '?'} = ${p.value || 'ON'}`;
    case 'variable': return `${p.varName || '?'} = ${p.value || 0}`;
    case 'transfer': return `→ (${p.mapName || '?'}, ${p.x || 0}, ${p.y || 0})`;
    case 'bgm': case 'se': case 'change_system_bgm': return p.audioName || '';
    case 'wait': return `${p.duration || 60}`;
    case 'condition': return p.expression || '';
    case 'label': return p.name || '';
    case 'jump': return `→ ${p.label || ''}`;
    case 'comment': return p.text ? `// ${p.text.slice(0, 30)}` : '';
    case 'change_party': return `${p.operation || 'add'} ${p.actorId || '?'}`;
    case 'change_hp': case 'change_mp': case 'change_exp': case 'change_level':
      return `${p.actorId || '?'} ${p.operation || '+'} ${p.amount || 0}`;
    case 'change_param': return `${p.actorId || '?'} ${p.paramName || ''} ${p.operation || '+'} ${p.amount || 0}`;
    case 'recover_all': return '';
    case 'change_name': return `${p.actorId || '?'} → ${p.value || ''}`;
    case 'change_class': return `${p.actorId || '?'} → ${p.value || ''}`;
    case 'change_graphic': return p.value || '';
    case 'fade_screen': return p.fadeType || 'out';
    case 'flash_screen': return p.color || '';
    case 'change_player_graphic': return p.graphic || '';
    case 'set_move_speed': return `${p.speed || 4}`;
    case 'transparent': return p.value || 'ON';
    case 'open_shop': return p.shopId || '';
    case 'input_number': return `${p.varName || ''} (${p.digits || 4})`;
    case 'scroll_text': return p.text ? `"${p.text.slice(0, 20)}"` : '';
    case 'game_over': case 'return_title': case 'recover_all': case 'gather_followers': return '';
    case 'change_encounter': return `${p.rate || 0}`;
    case 'change_save_access': case 'change_menu_access': case 'change_formation': return p.value || 'ON';
    case 'change_self_switch': return `${p.switchName || 'A'} = ${p.value || 'ON'}`;
    case 'play_movie': return p.movieUrl || '';
    case 'get_location_info': return `→ ${p.varName || 'loc'}`;
    case 'set_event_location': return `${p.eventName || ''} (${p.x||0}, ${p.y||0})`;
    case 'change_tileset': return p.tilesetName || '';
    case 'change_equipment': return `${p.actorId || ''} ${p.slot || ''} = ${p.itemId || ''}`;
    case 'change_gold_variable': return `gold = ${p.varName || ''}`;
    case 'change_item_variable': return `${p.itemName || ''} = ${p.varName || ''}`;
    case 'wait_for_movement': return '';
    default: return '';
  }
}

export function CommandParamsEditor({ cmd, updateCommand, gameData, t }) {
  const p = cmd.params || {};
  const setParam = (key, val) => updateCommand(cmd.id, { [key]: val });
  const actors = gameData.actors || [];
  const shops = gameData.shops || [];

  switch (cmd.type) {
    case 'message': case 'comment':
      return <Textarea value={p.text || ''} onChange={(e) => setParam('text', e.target.value)} placeholder={cmd.type === 'message' ? t('editor_cmd_message') : t('editor_cmd_comment')} className="bg-zinc-900 border-zinc-700 text-sm min-h-[80px]" />;
    case 'scroll_text':
      return <Textarea value={p.text || ''} onChange={(e) => setParam('text', e.target.value)} placeholder={t('editor_cmd_scroll_text')} className="bg-zinc-900 border-zinc-700 text-sm min-h-[80px]" />;
    case 'choices':
      return (
        <div className="space-y-2">
          {(p.choices || ['', '', '']).map((choice, i) => (
            <Input key={i} value={choice} onChange={(e) => { const nc = [...(p.choices || ['', '', ''])]; nc[i] = e.target.value; setParam('choices', nc); }} placeholder={`${i + 1}`} className="bg-zinc-900 border-zinc-700 text-sm" />
          ))}
        </div>
      );
    case 'item':
      return (
        <div className="flex gap-2">
          <Input value={p.itemName || ''} onChange={(e) => setParam('itemName', e.target.value)} placeholder={t('db_name')} className="bg-zinc-900 border-zinc-700 text-sm flex-1" />
          <Select value={p.operation || '+'} onValueChange={(v) => setParam('operation', v)}>
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-sm w-20"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700"><SelectItem value="+">+</SelectItem><SelectItem value="-">-</SelectItem></SelectContent>
          </Select>
          <Input type="number" value={p.amount || 1} onChange={(e) => setParam('amount', parseInt(e.target.value) || 1)} className="bg-zinc-900 border-zinc-700 text-sm w-20" />
        </div>
      );
    case 'gold':
      return (
        <div className="flex gap-2">
          <Select value={p.operation || '+'} onValueChange={(v) => setParam('operation', v)}>
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-sm w-20"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700"><SelectItem value="+">+</SelectItem><SelectItem value="-">-</SelectItem></SelectContent>
          </Select>
          <Input type="number" value={p.amount || 0} onChange={(e) => setParam('amount', parseInt(e.target.value) || 0)} className="bg-zinc-900 border-zinc-700 text-sm flex-1" />
        </div>
      );
    case 'switch':
      return (
        <div className="flex gap-2">
          <Input value={p.switchName || ''} onChange={(e) => setParam('switchName', e.target.value)} placeholder={t('db_switch_name')} className="bg-zinc-900 border-zinc-700 text-sm flex-1" />
          <Select value={p.value || 'ON'} onValueChange={(v) => setParam('value', v)}>
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-sm w-20"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700"><SelectItem value="ON">ON</SelectItem><SelectItem value="OFF">OFF</SelectItem></SelectContent>
          </Select>
        </div>
      );
    case 'variable':
      return (
        <div className="flex gap-2">
          <Input value={p.varName || ''} onChange={(e) => setParam('varName', e.target.value)} placeholder={t('db_variable_name')} className="bg-zinc-900 border-zinc-700 text-sm flex-1" />
          <Input value={p.value || '0'} onChange={(e) => setParam('value', e.target.value)} placeholder="0, rand(10), lv*2" className="bg-zinc-900 border-zinc-700 text-sm flex-1" />
        </div>
      );
    case 'condition':
      return <Input value={p.expression || ''} onChange={(e) => setParam('expression', e.target.value)} placeholder="switch[ボス] == ON" className="bg-zinc-900 border-zinc-700 text-sm" />;
    case 'transfer':
      return (
        <div className="flex gap-2">
          <Input value={p.mapName || ''} onChange={(e) => setParam('mapName', e.target.value)} placeholder={t('editor_map_name')} className="bg-zinc-900 border-zinc-700 text-sm flex-1" />
          <Input type="number" value={p.x || 0} onChange={(e) => setParam('x', parseInt(e.target.value) || 0)} placeholder="X" className="bg-zinc-900 border-zinc-700 text-sm w-16" />
          <Input type="number" value={p.y || 0} onChange={(e) => setParam('y', parseInt(e.target.value) || 0)} placeholder="Y" className="bg-zinc-900 border-zinc-700 text-sm w-16" />
        </div>
      );
    case 'bgm': case 'se': case 'change_system_bgm':
      return <Input value={p.audioName || ''} onChange={(e) => setParam('audioName', e.target.value)} placeholder="URL" className="bg-zinc-900 border-zinc-700 text-sm" />;
    case 'wait':
      return <Input type="number" value={p.duration || 60} onChange={(e) => setParam('duration', parseInt(e.target.value) || 60)} className="bg-zinc-900 border-zinc-700 text-sm" />;
    case 'battle':
      return <Input value={p.troopName || ''} onChange={(e) => setParam('troopName', e.target.value)} placeholder={t('db_tab_troops')} className="bg-zinc-900 border-zinc-700 text-sm" />;
    case 'label':
      return <Input value={p.name || ''} onChange={(e) => setParam('name', e.target.value)} placeholder={t('editor_cmd_label')} className="bg-zinc-900 border-zinc-700 text-sm" />;
    case 'jump':
      return <Input value={p.label || ''} onChange={(e) => setParam('label', e.target.value)} placeholder={t('editor_cmd_label')} className="bg-zinc-900 border-zinc-700 text-sm" />;
    // ─── Party / Actor ───
    case 'change_party':
      return (
        <div className="flex gap-2">
          <Select value={p.operation || 'add'} onValueChange={(v) => setParam('operation', v)}>
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-sm w-24"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700"><SelectItem value="add">+</SelectItem><SelectItem value="remove">-</SelectItem></SelectContent>
          </Select>
          <Select value={p.actorId || ''} onValueChange={(v) => setParam('actorId', v)}>
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-sm flex-1"><SelectValue placeholder={t('db_tab_actors')} /></SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">{actors.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      );
    case 'change_hp': case 'change_mp': case 'change_exp': case 'change_level':
      return (
        <div className="flex gap-2">
          <Select value={p.actorId || ''} onValueChange={(v) => setParam('actorId', v)}>
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-sm flex-1"><SelectValue placeholder={t('db_tab_actors')} /></SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">{actors.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={p.operation || '+'} onValueChange={(v) => setParam('operation', v)}>
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-sm w-20"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700"><SelectItem value="+">+</SelectItem><SelectItem value="-">-</SelectItem><SelectItem value="=">=</SelectItem></SelectContent>
          </Select>
          <Input type="number" value={p.amount || 0} onChange={(e) => setParam('amount', parseInt(e.target.value) || 0)} className="bg-zinc-900 border-zinc-700 text-sm w-20" />
        </div>
      );
    case 'change_param':
      return (
        <div className="flex gap-2 flex-wrap">
          <Select value={p.actorId || ''} onValueChange={(v) => setParam('actorId', v)}>
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-sm flex-1"><SelectValue placeholder={t('db_tab_actors')} /></SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">{actors.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={p.paramName || 'attack'} onValueChange={(v) => setParam('paramName', v)}>
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-sm w-28"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="attack">{t('db_attack')}</SelectItem><SelectItem value="defense">{t('db_defense')}</SelectItem>
              <SelectItem value="magicAttack">{t('db_magic_attack')}</SelectItem><SelectItem value="magicDefense">{t('db_magic_defense')}</SelectItem>
              <SelectItem value="agility">{t('db_agility')}</SelectItem><SelectItem value="luck">{t('db_luck')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={p.operation || '+'} onValueChange={(v) => setParam('operation', v)}>
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-sm w-20"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700"><SelectItem value="+">+</SelectItem><SelectItem value="-">-</SelectItem><SelectItem value="=">=</SelectItem></SelectContent>
          </Select>
          <Input type="number" value={p.amount || 0} onChange={(e) => setParam('amount', parseInt(e.target.value) || 0)} className="bg-zinc-900 border-zinc-700 text-sm w-20" />
        </div>
      );
    case 'change_equipment':
      return (
        <div className="flex gap-2">
          <Select value={p.actorId || ''} onValueChange={(v) => setParam('actorId', v)}>
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-sm flex-1"><SelectValue placeholder={t('db_tab_actors')} /></SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">{actors.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={p.slot || 'weapon'} onValueChange={(v) => setParam('slot', v)}>
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-sm w-24"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700"><SelectItem value="weapon">{t('db_tab_weapons')}</SelectItem><SelectItem value="armor">{t('db_tab_armors')}</SelectItem></SelectContent>
          </Select>
          <Input value={p.itemId || ''} onChange={(e) => setParam('itemId', e.target.value)} placeholder="ID" className="bg-zinc-900 border-zinc-700 text-sm flex-1" />
        </div>
      );
    case 'change_name': case 'change_class':
      return (
        <div className="flex gap-2">
          <Select value={p.actorId || ''} onValueChange={(v) => setParam('actorId', v)}>
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-sm flex-1"><SelectValue placeholder={t('db_tab_actors')} /></SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">{actors.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
          </Select>
          <Input value={p.value || ''} onChange={(e) => setParam('value', e.target.value)} placeholder={cmd.type === 'change_name' ? t('db_name') : t('db_tab_classes')} className="bg-zinc-900 border-zinc-700 text-sm flex-1" />
        </div>
      );
    case 'change_graphic':
      return <Input value={p.value || ''} onChange={(e) => setParam('value', e.target.value)} placeholder="URL" className="bg-zinc-900 border-zinc-700 text-sm" />;
    case 'change_formation': case 'change_save_access': case 'change_menu_access': case 'transparent':
      return (
        <Select value={p.value || 'ON'} onValueChange={(v) => setParam('value', v)}>
          <SelectTrigger className="bg-zinc-900 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700"><SelectItem value="ON">ON</SelectItem><SelectItem value="OFF">OFF</SelectItem></SelectContent>
        </Select>
      );
    // ─── Screen ───
    case 'fade_screen':
      return (
        <Select value={p.fadeType || 'out'} onValueChange={(v) => setParam('fadeType', v)}>
          <SelectTrigger className="bg-zinc-900 border-zinc-700 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700"><SelectItem value="out">Fade Out</SelectItem><SelectItem value="in">Fade In</SelectItem></SelectContent>
        </Select>
      );
    case 'flash_screen':
      return (
        <div className="flex gap-2">
          <Input value={p.color || '#ffffff'} onChange={(e) => setParam('color', e.target.value)} placeholder="#ffffff" className="bg-zinc-900 border-zinc-700 text-sm flex-1" />
          <Input type="number" value={p.duration || 30} onChange={(e) => setParam('duration', parseInt(e.target.value) || 30)} className="bg-zinc-900 border-zinc-700 text-sm w-20" />
        </div>
      );
    case 'change_window_color':
      return <Input value={p.color || ''} onChange={(e) => setParam('color', e.target.value)} placeholder="#1a1a2e" className="bg-zinc-900 border-zinc-700 text-sm" />;
    case 'tint':
      return <Input value={p.color || '#000000'} onChange={(e) => setParam('color', e.target.value)} placeholder="#000000" className="bg-zinc-900 border-zinc-700 text-sm" />;
    case 'shake':
      return <Input type="number" value={p.duration || 30} onChange={(e) => setParam('duration', parseInt(e.target.value) || 30)} className="bg-zinc-900 border-zinc-700 text-sm" />;
    // ─── Map ───
    case 'scroll_map':
      return (
        <div className="flex gap-2">
          <Input type="number" value={p.x || 0} onChange={(e) => setParam('x', parseInt(e.target.value) || 0)} placeholder="X" className="bg-zinc-900 border-zinc-700 text-sm w-20" />
          <Input type="number" value={p.y || 0} onChange={(e) => setParam('y', parseInt(e.target.value) || 0)} placeholder="Y" className="bg-zinc-900 border-zinc-700 text-sm w-20" />
          <Input type="number" value={p.speed || 4} onChange={(e) => setParam('speed', parseInt(e.target.value) || 4)} placeholder="Speed" className="bg-zinc-900 border-zinc-700 text-sm w-20" />
        </div>
      );
    case 'set_event_location':
      return (
        <div className="flex gap-2">
          <Input value={p.eventName || ''} onChange={(e) => setParam('eventName', e.target.value)} placeholder={t('editor_event_name')} className="bg-zinc-900 border-zinc-700 text-sm flex-1" />
          <Input type="number" value={p.x || 0} onChange={(e) => setParam('x', parseInt(e.target.value) || 0)} placeholder="X" className="bg-zinc-900 border-zinc-700 text-sm w-16" />
          <Input type="number" value={p.y || 0} onChange={(e) => setParam('y', parseInt(e.target.value) || 0)} placeholder="Y" className="bg-zinc-900 border-zinc-700 text-sm w-16" />
        </div>
      );
    case 'change_tileset':
      return <Input value={p.tilesetName || ''} onChange={(e) => setParam('tilesetName', e.target.value)} placeholder={t('db_tab_tilesets')} className="bg-zinc-900 border-zinc-700 text-sm" />;
    case 'change_player_graphic':
      return <Input value={p.graphic || ''} onChange={(e) => setParam('graphic', e.target.value)} placeholder="URL" className="bg-zinc-900 border-zinc-700 text-sm" />;
    case 'set_move_speed':
      return <Input type="number" value={p.speed || 4} onChange={(e) => setParam('speed', parseInt(e.target.value) || 4)} className="bg-zinc-900 border-zinc-700 text-sm" />;
    case 'get_location_info':
      return (
        <div className="flex gap-2">
          <Input value={p.varName || ''} onChange={(e) => setParam('varName', e.target.value)} placeholder={t('db_variable_name')} className="bg-zinc-900 border-zinc-700 text-sm flex-1" />
          <Input type="number" value={p.x || 0} onChange={(e) => setParam('x', parseInt(e.target.value) || 0)} placeholder="X" className="bg-zinc-900 border-zinc-700 text-sm w-16" />
          <Input type="number" value={p.y || 0} onChange={(e) => setParam('y', parseInt(e.target.value) || 0)} placeholder="Y" className="bg-zinc-900 border-zinc-700 text-sm w-16" />
        </div>
      );
    // ─── Game Flow ───
    case 'open_shop':
      return (
        <Select value={p.shopId || ''} onValueChange={(v) => setParam('shopId', v)}>
          <SelectTrigger className="bg-zinc-900 border-zinc-700 text-sm"><SelectValue placeholder={t('db_tab_shops')} /></SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">{shops.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
        </Select>
      );
    case 'input_number':
      return (
        <div className="flex gap-2">
          <Input value={p.varName || ''} onChange={(e) => setParam('varName', e.target.value)} placeholder={t('db_variable_name')} className="bg-zinc-900 border-zinc-700 text-sm flex-1" />
          <Input type="number" value={p.digits || 4} onChange={(e) => setParam('digits', parseInt(e.target.value) || 4)} className="bg-zinc-900 border-zinc-700 text-sm w-20" />
        </div>
      );
    case 'change_encounter':
      return <Input type="number" value={p.rate || 0} onChange={(e) => setParam('rate', parseInt(e.target.value) || 0)} className="bg-zinc-900 border-zinc-700 text-sm" />;
    case 'change_self_switch':
      return (
        <div className="flex gap-2">
          <Select value={p.switchName || 'A'} onValueChange={(v) => setParam('switchName', v)}>
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-sm w-20"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700"><SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem><SelectItem value="C">C</SelectItem><SelectItem value="D">D</SelectItem></SelectContent>
          </Select>
          <Select value={p.value || 'ON'} onValueChange={(v) => setParam('value', v)}>
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-sm w-20"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700"><SelectItem value="ON">ON</SelectItem><SelectItem value="OFF">OFF</SelectItem></SelectContent>
          </Select>
        </div>
      );
    case 'play_movie':
      return <Input value={p.movieUrl || ''} onChange={(e) => setParam('movieUrl', e.target.value)} placeholder="URL" className="bg-zinc-900 border-zinc-700 text-sm" />;
    case 'change_gold_variable':
      return (
        <div className="flex gap-2">
          <span className="text-xs text-zinc-500 self-center">gold =</span>
          <Input value={p.varName || ''} onChange={(e) => setParam('varName', e.target.value)} placeholder={t('db_variable_name')} className="bg-zinc-900 border-zinc-700 text-sm flex-1" />
        </div>
      );
    case 'change_item_variable':
      return (
        <div className="flex gap-2">
          <Input value={p.itemName || ''} onChange={(e) => setParam('itemName', e.target.value)} placeholder={t('db_name')} className="bg-zinc-900 border-zinc-700 text-sm flex-1" />
          <span className="text-xs text-zinc-500 self-center">=</span>
          <Input value={p.varName || ''} onChange={(e) => setParam('varName', e.target.value)} placeholder={t('db_variable_name')} className="bg-zinc-900 border-zinc-700 text-sm flex-1" />
        </div>
      );
    default:
      return <p className="text-xs text-zinc-500">{t('noData')}</p>;
  }
}