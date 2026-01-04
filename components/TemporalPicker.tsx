
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface TemporalPickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  align?: 'left' | 'right';
  variant?: 'inline' | 'form';
}

const TemporalPicker: React.FC<TemporalPickerProps> = ({ label, value, onChange, align = 'left', variant = 'form' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'days' | 'months' | 'years'>('days');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, right: 0, side: 'bottom' as 'top' | 'bottom' });
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewDate, setViewDate] = useState(new Date(value || Date.now()));
  
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fullMonthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  const handleToggle = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const pickerHeight = 420; 
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldShowAbove = spaceBelow < pickerHeight && rect.top > pickerHeight;

      setCoords({
        top: shouldShowAbove ? rect.top : rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        side: shouldShowAbove ? 'top' : 'bottom'
      });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        const portalEl = document.getElementById('temporal-portal-content');
        if (portalEl && portalEl.contains(e.target as Node)) return;
        setIsOpen(false);
        setMode('days');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleDaySelect = (d: number) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
    onChange(selected.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const handleMonthSelect = (mIdx: number) => {
    setViewDate(new Date(viewDate.getFullYear(), mIdx, 1));
    setMode('days');
  };

  const handleYearSelect = (year: number) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setMode('days');
  };

  const years = useMemo(() => {
    const current = viewDate.getFullYear();
    const range = [];
    for (let i = current - 5; i <= current + 6; i++) range.push(i);
    return range;
  }, [viewDate]);

  const displayDate = useMemo(() => {
    if (!value) return 'SELECT DATE';
    const d = new Date(value);
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  }, [value]);

  // Logic to keep the picker inside the viewport
  const pickerStyles = useMemo(() => {
    const pickerWidth = 320;
    const margin = 16;
    let left = align === 'right' ? coords.right - pickerWidth : coords.left;
    
    // Clamp to viewport
    if (left + pickerWidth > window.innerWidth - margin) {
      left = window.innerWidth - pickerWidth - margin;
    }
    if (left < margin) {
      left = margin;
    }

    return {
      top: coords.side === 'bottom' ? `${coords.top + 8}px` : `${coords.top - 428}px`,
      left: `${left}px`
    };
  }, [coords, align]);

  return (
    <div className={`relative ${variant === 'form' ? 'w-full' : ''}`} ref={containerRef}>
      {variant === 'form' ? (
        <div className="space-y-2">
          <label className="block text-[9px] font-black uppercase tracking-[0.25em] text-[var(--text-secondary)] ml-1 opacity-60">{label}</label>
          <button 
            type="button" 
            onClick={handleToggle} 
            className="w-full bg-[var(--bg-canvas)] border border-[var(--border-ui)] rounded-2xl px-5 flex items-center justify-between gap-3 text-left h-12 hover:border-[var(--accent)] transition-all group"
          >
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-[var(--accent)] opacity-40 group-hover:opacity-100 transition-all" />
              <span className="text-xs font-black uppercase tracking-tight">{displayDate}</span>
            </div>
            <ChevronDown size={14} className={`opacity-20 group-hover:opacity-100 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      ) : (
        <button 
          type="button" 
          onClick={handleToggle} 
          className="flex flex-col items-start gap-1 group text-left"
        >
          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 group-hover:text-[var(--accent)] transition-colors">{label}</span>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-[var(--accent)] opacity-40 group-hover:opacity-100 transition-all" />
            <span className="text-sm font-black tabular-nums tracking-tight text-[var(--text-primary)]">{displayDate}</span>
            <ChevronDown size={12} className={`opacity-20 group-hover:opacity-100 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>
      )}

      {isOpen && createPortal(
        <div 
          id="temporal-portal-content"
          className="fixed z-[99999] p-6 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.6)] animate-pop-in w-80 backdrop-blur-3xl"
          style={pickerStyles}
        >
          <div className="flex justify-between items-center mb-6 px-2">
            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-all text-[var(--accent)]"><ChevronLeft size={16}/></button>
            <div className="flex gap-2">
              <button type="button" onClick={() => setMode(mode === 'months' ? 'days' : 'months')} className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-ui)] hover:border-[var(--accent)] transition-all">
                {monthNames[viewDate.getMonth()]}
              </button>
              <button type="button" onClick={() => setMode(mode === 'years' ? 'days' : 'years')} className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-ui)] hover:border-[var(--accent)] transition-all">
                {viewDate.getFullYear()}
              </button>
            </div>
            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-all text-[var(--accent)]"><ChevronRight size={16}/></button>
          </div>

          {mode === 'days' && (
            <div className="animate-enter">
              <div className="grid grid-cols-7 gap-1 text-center mb-3">
                {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-[8px] font-black opacity-30">{d}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`p-${i}`} />)}
                {Array.from({ length: daysInMonth(viewDate.getFullYear(), viewDate.getMonth()) }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toISOString().split('T')[0];
                  const isSelected = value === dateStr;
                  return (
                    <button key={day} type="button" onClick={() => handleDaySelect(day)} 
                      className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all flex items-center justify-center ${isSelected ? 'bg-[var(--accent)] text-white shadow-lg shadow-indigo-500/40' : 'hover:bg-[var(--accent)]/10 text-[var(--text-primary)]'}`}>
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {mode === 'months' && (
            <div className="grid grid-cols-3 gap-2 animate-enter">
              {fullMonthNames.map((m, i) => (
                <button type="button" key={m} onClick={() => handleMonthSelect(i)}
                  className={`py-4 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${viewDate.getMonth() === i ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'bg-[var(--bg-canvas)] border border-[var(--border-ui)] hover:border-[var(--accent)]'}`}>
                  {m.slice(0, 3)}
                </button>
              ))}
            </div>
          )}

          {mode === 'years' && (
            <div className="grid grid-cols-3 gap-2 animate-enter">
              {years.map(y => (
                <button type="button" key={y} onClick={() => handleYearSelect(y)}
                  className={`py-4 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${viewDate.getFullYear() === y ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'bg-[var(--bg-canvas)] border border-[var(--border-ui)] hover:border-[var(--accent)]'}`}>
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default TemporalPicker;
