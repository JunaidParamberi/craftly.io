
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, 
  Trash2, X, Clock, Video, Flag, DollarSign, Bell, ChevronDown, 
  Share2, CheckCircle2, CalendarRange, Mail, CreditCard,
  AlertCircle, Briefcase, Hash
} from 'lucide-react';
import { CalendarEvent } from '../types';
import { useBusiness } from '../context/BusinessContext.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import TemporalPicker from './TemporalPicker.tsx';
import { Button, Card, Input, Select, Badge } from './ui/Primitives.tsx';

const CalendarView: React.FC = () => {
  const { events, setEvents, deleteEvent, pushNotification, invoices, proposals } = useBusiness();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CalendarEvent>>({ 
    title: '', description: '', type: 'Reminder', priority: 'Medium', time: '09:00' 
  });

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const mobileWeekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const allEvents = useMemo(() => {
    const manual = events.map(e => ({ ...e, source: 'manual' }));
    
    const invoiceEvents = invoices.map(inv => ({
      id: `inv-${inv.id}`,
      title: `Finance: ${inv.clientId}`,
      description: `Invoice ${inv.id} settlement target.`,
      date: inv.dueDate,
      type: 'Finance' as const,
      priority: 'High' as const,
      source: 'invoice',
      time: '09:00'
    }));

    const projectEvents = proposals.map(prop => ({
      id: `prop-${prop.id}`,
      title: `Project: ${prop.title}`,
      description: `Target deployment for ${prop.clientName}.`,
      date: prop.timeline,
      type: 'Milestone' as const,
      priority: 'High' as const,
      source: 'project',
      time: '17:00'
    }));

    return [...manual, ...invoiceEvents, ...projectEvents].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.time || '00:00').localeCompare(b.time || '00:00');
    });
  }, [events, invoices, proposals]);

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const typeConfig: Record<string, { icon: any, color: string, ring: string }> = {
    Meeting: { icon: Video, color: 'bg-indigo-500', ring: 'ring-indigo-500/20' },
    Milestone: { icon: Flag, color: 'bg-emerald-500', ring: 'ring-emerald-500/20' },
    Reminder: { icon: Bell, color: 'bg-slate-500', ring: 'ring-slate-500/20' },
    Finance: { icon: DollarSign, color: 'bg-amber-500', ring: 'ring-amber-500/20' },
    Payment: { icon: CreditCard, color: 'bg-amber-500', ring: 'ring-amber-500/20' }
  };

  const selectedDayEvents = allEvents.filter(e => e.date === selectedDate);

  const handleAddEvent = () => {
    setFormData({ title: '', description: '', type: 'Reminder', priority: 'Medium', time: '09:00' });
    setShowForm(true);
  };

  const finalizeSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.title) return;

    const newEvent: CalendarEvent = { 
      ...formData, 
      id: `ev_${Date.now()}`, 
      date: selectedDate 
    } as CalendarEvent;
    
    setEvents(prev => [...prev, newEvent]);
    pushNotification({ title: 'Event Saved', description: `"${newEvent.title}" added to schedule.`, type: 'deadline' });
    setShowForm(false);
  };

  const shareEvent = (event: any) => {
    const start = event.date.replace(/-/g, '') + 'T' + (event.time || '09:00').replace(':', '') + '00Z';
    const end = event.date.replace(/-/g, '') + 'T' + (event.time ? (parseInt(event.time.split(':')[0]) + 1).toString().padStart(2, '0') + event.time.split(':')[1] : '10:00').replace(':', '') + '00Z';
    const icsContent = ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',`SUMMARY:${event.title}`,`DTSTART:${start}`,`DTEND:${end}`,`DESCRIPTION:${event.description}`,'END:VEVENT','END:VCALENDAR'].join('\n');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsSharing(event.id);
    setTimeout(() => setIsSharing(null), 3000);
  };

  return (
    <div className="flex flex-col min-h-screen lg:h-[calc(100vh-10rem)] animate-enter pb-32 lg:pb-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
            <CalendarRange size={24} />
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-black uppercase tracking-tight">Schedule</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <p className="text-[9px] lg:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Temporal Logic Active</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-[var(--bg-card)] p-1.5 rounded-2xl border border-[var(--border-ui)] shadow-sm">
          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-xl transition-all">Today</button>
          <div className="w-px h-6 bg-[var(--border-ui)]/50" />
          <div className="flex items-center">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"><ChevronLeft size={16} /></button>
            <button onClick={() => setShowJump(true)} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-indigo-500 transition-colors">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              <ChevronDown size={12} className="opacity-40" />
            </button>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>

        <Button icon={Plus} onClick={handleAddEvent} className="h-12 lg:h-14 shadow-xl text-[10px] font-black uppercase tracking-widest">Add Mission</Button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        <div className="lg:col-span-8 flex flex-col min-h-0">
          <Card padding="p-0" className="flex-1 flex flex-col overflow-hidden border border-[var(--border-ui)] shadow-xl bg-[var(--bg-card)]">
            <div className="grid grid-cols-7 bg-[var(--bg-card-muted)]/50 text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-[var(--border-ui)]">
              {weekDays.map((d, i) => (
                <div key={d} className="py-3 text-center">
                  <span className="hidden sm:inline">{d}</span>
                  <span className="sm:hidden">{mobileWeekDays[i]}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto custom-scroll">
              <div className="grid grid-cols-7 min-h-full">
                {(() => {
                  const cells = [];
                  const numDays = daysInMonth(currentDate);
                  const startDay = firstDayOfMonth(currentDate);
                  const todayStr = new Date().toISOString().split('T')[0];

                  for (let i = 0; i < startDay; i++) {
                    cells.push(<div key={`empty-${i}`} className="h-24 lg:h-32 bg-[var(--bg-canvas)]/20 border-r border-b border-[var(--border-ui)]/50" />);
                  }

                  for (let day = 1; day <= numDays; day++) {
                    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
                    const isToday = todayStr === dateStr;
                    const isSelected = selectedDate === dateStr;
                    const dayEvents = allEvents.filter(e => e.date === dateStr);

                    cells.push(
                      <div 
                        key={day} 
                        onClick={() => setSelectedDate(dateStr)}
                        className={`h-24 lg:h-32 p-2 lg:p-3 border-r border-b border-[var(--border-ui)]/50 cursor-pointer transition-all group overflow-hidden ${isSelected ? 'bg-indigo-500/10 ring-2 ring-inset ring-indigo-500/20' : 'bg-[var(--bg-card)] hover:bg-indigo-500/[0.03]'}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-[10px] lg:text-[11px] font-black w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center rounded-lg lg:rounded-xl transition-all ${isToday ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 group-hover:text-indigo-400'}`}>
                            {day}
                          </span>
                          {dayEvents.length > 0 && <span className="text-[8px] font-black text-indigo-500 opacity-40">{dayEvents.length}</span>}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map(e => (
                            <div key={e.id} className="flex items-center gap-1 lg:gap-1.5 px-1.5 py-0.5 rounded-md bg-slate-100/50 dark:bg-slate-850 border border-slate-200/50 dark:border-white/5 truncate">
                               <div className={`w-1 lg:w-1.5 h-1 lg:h-1.5 rounded-full shrink-0 ${typeConfig[e.type]?.color || 'bg-slate-400'}`} />
                               <span className="text-[7px] lg:text-[8px] font-black uppercase truncate opacity-70 tracking-tight">{e.title}</span>
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest pl-1">+{dayEvents.length - 2} More</div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return cells;
                })()}
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6 min-h-0">
          <Card padding="p-6 lg:p-8" className="flex-1 flex flex-col min-h-[400px] lg:min-h-0 border-2 border-indigo-500/10 h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
              <CalendarIcon size={180} strokeWidth={1} />
            </div>

            <div className="flex items-center justify-between mb-6 border-b border-[var(--border-ui)] pb-5 shrink-0 relative z-10">
              <div className="min-w-0">
                <h4 className="text-base lg:text-lg font-black uppercase tracking-tight leading-none mb-2 truncate">
                  {new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
                </h4>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <p className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-slate-500">Day View Registry</p>
                </div>
              </div>
              <Badge variant="info" className="shrink-0">{selectedDayEvents.length} Missions</Badge>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scroll space-y-4 relative z-10 pr-2">
              {selectedDayEvents.length > 0 ? selectedDayEvents.map(e => {
                const Icon = typeConfig[e.type]?.icon || Bell;
                const isManual = (e as any).source === 'manual';
                return (
                  <div key={e.id} className="p-4 lg:p-6 bg-[var(--bg-canvas)] border border-[var(--border-ui)] rounded-[1.5rem] lg:rounded-[1.75rem] flex items-center justify-between group hover:border-indigo-500 transition-all shadow-sm">
                    <div className="flex items-center gap-4 lg:gap-5 min-w-0 flex-1">
                      <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0 text-white ${typeConfig[e.type]?.color || 'bg-slate-500'} shadow-lg ${typeConfig[e.type]?.ring}`}>
                        <Icon size={18}/>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                           <h5 className="text-[10px] lg:text-[11px] font-black uppercase tracking-tight truncate pr-2 group-hover:text-indigo-500 transition-colors">{e.title}</h5>
                           <Badge variant={e.priority === 'High' ? 'danger' : e.priority === 'Medium' ? 'warning' : 'default'}>{e.priority}</Badge>
                        </div>
                        <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
                           <div className="flex items-center gap-1.5 text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                             <Clock size={10} className="opacity-40" /> {e.time || 'All Day'}
                           </div>
                           <div className="hidden lg:block w-1 h-1 rounded-full bg-slate-300" />
                           <span className="text-[8px] lg:text-[9px] font-black text-indigo-400 uppercase tracking-widest whitespace-nowrap">{e.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-0 lg:opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 ml-2">
                      <button onClick={() => shareEvent(e)} className="p-2 lg:p-3 bg-white dark:bg-slate-900 border border-[var(--border-ui)] rounded-xl text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all shadow-xl"><Share2 size={14} /></button>
                      {isManual && (
                        <button onClick={() => setConfirmDeleteId(e.id)} className="p-2 lg:p-3 bg-white dark:bg-slate-900 border border-[var(--border-ui)] rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-xl"><Trash2 size={14}/></button>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <div className="py-12 lg:py-20 text-center opacity-40 border-2 border-dashed border-[var(--border-ui)] rounded-[2rem] lg:rounded-[2.5rem] flex flex-col items-center">
                  <CalendarIcon size={32} className="mb-4 opacity-20" />
                  <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em] mb-4">No events scheduled</p>
                  <Button variant="outline" size="sm" onClick={handleAddEvent}>Register Task</Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {showForm && createPortal(
        <div className="exec-modal-overlay">
          <div className="exec-modal-container max-w-xl animate-pop-in">
             <header className="p-8 lg:p-10 border-b border-[var(--border-ui)] flex justify-between items-center shrink-0 bg-[var(--bg-card)]">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl"><Plus size={24} /></div>
                  <h4 className="text-lg lg:text-xl font-black uppercase tracking-tight">Initialize Mission</h4>
                </div>
                <button onClick={() => setShowForm(false)} className="p-3 lg:p-4 text-rose-500 hover:bg-rose-500/5 rounded-2xl transition-all"><X size={24} /></button>
             </header>
             <div className="custom-scroll bg-[var(--bg-canvas)]/20 !p-8 lg:!p-10 max-h-[70vh] overflow-y-auto">
               <form onSubmit={finalizeSave} className="space-y-8 lg:space-y-10">
                  <Input label="Mission Designation" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value.toUpperCase()})} placeholder="E.G. STRATEGIC SYNC" autoFocus required />
                  
                  <div className="grid grid-cols-2 gap-6 lg:gap-8">
                     <TemporalPicker label="Activation Date" value={selectedDate} onChange={setSelectedDate} />
                     <Input label="Target Time" type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-6 lg:gap-8">
                    <Select label="Modality" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                      <option value="Reminder">Reminder</option>
                      <option value="Meeting">Meeting Node</option>
                      <option value="Milestone">Mission Deadline</option>
                      <option value="Finance">Fiscal Settlement</option>
                    </Select>
                    <Select label="Priority Rank" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
                      <option value="Low">Low - Deferred</option>
                      <option value="Medium">Medium - Standard</option>
                      <option value="High">High - Critical</option>
                    </Select>
                  </div>

                  <div className="space-y-3">
                     <label className="block text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-secondary)] ml-1 opacity-60">Technical Directives</label>
                     <textarea 
                       className="w-full bg-[var(--input-bg)] border border-[var(--border-ui)] p-5 lg:p-6 text-xs font-medium rounded-[1.5rem] lg:rounded-[1.75rem] outline-none focus:border-indigo-500 transition-all placeholder:opacity-30" 
                       rows={4} 
                       value={formData.description} 
                       onChange={e => setFormData({...formData, description: e.target.value})} 
                       placeholder="DEFINE ADDITIONAL PARAMETERS..." 
                     />
                  </div>

                  <div className="pt-4 lg:pt-8">
                    <Button type="submit" disabled={!formData.title} className="w-full h-14 lg:h-16 shadow-2xl uppercase tracking-widest text-[10px] lg:text-[11px] font-black">Commit to Registry</Button>
                  </div>
               </form>
             </div>
          </div>
        </div>, document.body
      )}

      {showJump && createPortal(
        <div className="exec-modal-overlay">
          <div className="exec-modal-container max-w-md animate-pop-in p-8 lg:p-12 text-center" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl lg:text-2xl font-black uppercase tracking-tight mb-8 lg:mb-10">Navigate Timeline</h3>
            <div className="grid grid-cols-3 gap-3">
              {monthNames.map((m, i) => (
                <button 
                  key={m} 
                  onClick={() => { setCurrentDate(new Date(currentDate.getFullYear(), i, 1)); setShowJump(false); }} 
                  className={`py-4 lg:py-5 rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest border-2 transition-all ${currentDate.getMonth() === i ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-[var(--bg-card)] border-[var(--border-ui)] hover:border-indigo-500'}`}
                >
                  {m.slice(0, 3)}
                </button>
              ))}
            </div>
            <div className="mt-8 lg:mt-12 flex justify-center">
              <Button variant="ghost" className="px-8 lg:px-10 h-10 lg:h-12 text-[10px] font-black uppercase tracking-widest" onClick={() => setShowJump(false)}>Close Timeline</Button>
            </div>
          </div>
        </div>, document.body
      )}

      <ConfirmationModal 
        isOpen={!!confirmDeleteId} 
        title="Purge Event" 
        message="This schedule node will be permanently decommissioned. Proceed?" 
        onConfirm={() => { if (confirmDeleteId) deleteEvent(confirmDeleteId); setConfirmDeleteId(null); }} 
        onCancel={() => setConfirmDeleteId(null)} 
      />
    </div>
  );
};

export default CalendarView;
