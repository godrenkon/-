import React from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Circle, X } from 'lucide-react';

const POS_STYLES = {
  'bottom-left': 'bottom-6 left-6',
  'bottom-right': 'bottom-6 right-6',
  'top-left': 'top-6 left-6',
  'top-right': 'top-6 right-6',
};

export default function TouchControls({ onDirection, onAction, onCancel, onMenu, onCustom, config = {} }) {
  const dpadStyle = config.dpadStyle || 'cross';
  const dpadSize = config.dpadSize || 120;
  const dpadPos = POS_STYLES[config.dpadPosition || 'bottom-left'] || POS_STYLES['bottom-left'];
  const actionSize = config.actionButtonSize || 64;
  const actionPos = config.actionButtonPosition === 'bottom-left' ? POS_STYLES['bottom-left'] : POS_STYLES['bottom-right'];
  const customButtons = config.touchButtons || [];

  const handleDir = (dir) => (e) => {
    e.preventDefault();
    onDirection(dir);
  };
  const stop = (e) => { e.preventDefault(); };

  const half = dpadSize / 2;
  const btn = dpadSize / 3;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none select-none">
      {/* D-Pad */}
      <div className={`absolute ${dpadPos} pointer-events-auto`} style={{ width: dpadSize, height: dpadSize }}>
        <div className="relative" style={{ width: dpadSize, height: dpadSize }}>
          {/* Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-zinc-800/70 border border-zinc-600/50" style={{ width: btn, height: btn }} />
          </div>
          {/* Up */}
          <button
            onTouchStart={handleDir('up')} onMouseDown={handleDir('up')} onTouchEnd={stop} onMouseUp={stop}
            className="absolute left-1/2 -translate-x-1/2 rounded-t-lg bg-zinc-800/70 border border-zinc-600/50 active:bg-violet-600/70 flex items-center justify-center touch-none"
            style={{ top: 0, width: btn, height: btn }}
          >
            <ChevronUp size={dpadSize * 0.18} className="text-zinc-300" />
          </button>
          {/* Down */}
          <button
            onTouchStart={handleDir('down')} onMouseDown={handleDir('down')} onTouchEnd={stop} onMouseUp={stop}
            className="absolute left-1/2 -translate-x-1/2 rounded-b-lg bg-zinc-800/70 border border-zinc-600/50 active:bg-violet-600/70 flex items-center justify-center touch-none"
            style={{ bottom: 0, width: btn, height: btn }}
          >
            <ChevronDown size={dpadSize * 0.18} className="text-zinc-300" />
          </button>
          {/* Left */}
          <button
            onTouchStart={handleDir('left')} onMouseDown={handleDir('left')} onTouchEnd={stop} onMouseUp={stop}
            className="absolute top-1/2 -translate-y-1/2 rounded-l-lg bg-zinc-800/70 border border-zinc-600/50 active:bg-violet-600/70 flex items-center justify-center touch-none"
            style={{ left: 0, width: btn, height: btn }}
          >
            <ChevronLeft size={dpadSize * 0.18} className="text-zinc-300" />
          </button>
          {/* Right */}
          <button
            onTouchStart={handleDir('right')} onMouseDown={handleDir('right')} onTouchEnd={stop} onMouseUp={stop}
            className="absolute top-1/2 -translate-y-1/2 rounded-r-lg bg-zinc-800/70 border border-zinc-600/50 active:bg-violet-600/70 flex items-center justify-center touch-none"
            style={{ right: 0, width: btn, height: btn }}
          >
            <ChevronRight size={dpadSize * 0.18} className="text-zinc-300" />
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className={`absolute ${actionPos} pointer-events-auto flex flex-col items-center gap-3`}>
        {onMenu && (
          <button
            onTouchStart={(e) => { e.preventDefault(); onMenu(); }}
            onMouseDown={(e) => { e.preventDefault(); onMenu(); }}
            className="rounded-full bg-zinc-800/70 border border-zinc-600/50 active:bg-blue-600/70 flex items-center justify-center touch-none"
            style={{ width: actionSize * 0.75, height: actionSize * 0.75 }}
          >
            <span className="text-xs font-bold text-zinc-300">MENU</span>
          </button>
        )}
        <div className="flex items-center gap-3">
          <button
            onTouchStart={(e) => { e.preventDefault(); onCancel(); }}
            onMouseDown={(e) => { e.preventDefault(); onCancel(); }}
            className="rounded-full bg-red-600/60 border border-red-400/50 active:bg-red-500/80 flex items-center justify-center touch-none"
            style={{ width: actionSize * 0.875, height: actionSize * 0.875 }}
          >
            <X size={actionSize * 0.4} className="text-white" />
          </button>
          <button
            onTouchStart={(e) => { e.preventDefault(); onAction(); }}
            onMouseDown={(e) => { e.preventDefault(); onAction(); }}
            className="rounded-full bg-violet-600/70 border border-violet-400/50 active:bg-violet-500/90 flex items-center justify-center touch-none"
            style={{ width: actionSize, height: actionSize }}
          >
            <Circle size={actionSize * 0.45} className="text-white fill-white/20" />
          </button>
        </div>
      </div>

      {/* Custom buttons */}
      {customButtons.map(btn => (
        <button
          key={btn.id}
          onTouchStart={(e) => { e.preventDefault(); onCustom?.(btn.action); }}
          onMouseDown={(e) => { e.preventDefault(); onCustom?.(btn.action); }}
          className={`absolute pointer-events-auto flex items-center justify-center touch-none overflow-hidden ${
            btn.shape === 'circle' ? 'rounded-full' : 'rounded-lg'
          } border border-zinc-600/50 active:scale-95 transition`}
          style={{
            left: `${btn.x}%`,
            top: `${btn.y}%`,
            width: btn.size,
            height: btn.size,
            backgroundColor: btn.image ? 'transparent' : (btn.color || '#7c3aed') + 'cc',
            backgroundImage: btn.image ? `url(${btn.image})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {!btn.image && (
            <span className="text-xs font-bold text-white">{btn.label}</span>
          )}
        </button>
      ))}
    </div>
  );
}