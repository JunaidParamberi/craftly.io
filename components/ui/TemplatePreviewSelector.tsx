import React, { useState } from 'react';
import { InvoiceTemplate, Invoice, Proposal, UserProfile, Client } from '../../types';
import { Check, Eye } from 'lucide-react';
import TemplatePreviewModal from './TemplatePreviewModal';

interface TemplatePreviewSelectorProps {
  value: InvoiceTemplate;
  onChange: (template: InvoiceTemplate) => void;
  type?: 'invoice' | 'proposal';
  compact?: boolean;
  userProfile?: UserProfile | null | undefined;
  client?: Client | null | undefined;
  sampleInvoice?: Partial<Invoice>;
  sampleProposal?: Partial<Proposal>;
}

const templateInfo: Record<InvoiceTemplate, { name: string; description: string; previewClasses: string; accentColor: string }> = {
  'Minimalist_Dark': {
    name: 'Minimalist Dark',
    description: 'Dark theme with clean lines',
    previewClasses: 'bg-slate-900 border-white/20',
    accentColor: '#ffffff'
  },
  'Swiss_Clean': {
    name: 'Swiss Clean',
    description: 'Minimalist professional design',
    previewClasses: 'bg-white border-slate-900 border-4',
    accentColor: '#0f172a'
  },
  'Corporate_Elite': {
    name: 'Corporate Elite',
    description: 'Classic corporate style',
    previewClasses: 'bg-white border-l-8 border-indigo-600',
    accentColor: '#4f46e5'
  },
  'Cyber_Obsidian': {
    name: 'Cyber Obsidian',
    description: 'Terminal/tech aesthetic',
    previewClasses: 'bg-black border-2 border-green-400',
    accentColor: '#22c55e'
  },
  'Modern_Soft': {
    name: 'Modern Soft',
    description: 'Gradient modern design',
    previewClasses: 'bg-gradient-to-br from-slate-50 to-white border-slate-200',
    accentColor: '#6366f1'
  },
  'Classic_Blue': {
    name: 'Classic Blue',
    description: 'Blue accent corporate',
    previewClasses: 'bg-white border-4 border-blue-900',
    accentColor: '#1e3a8a'
  },
  'Elegant_Gold': {
    name: 'Elegant Gold',
    description: 'Formal elegant design',
    previewClasses: 'bg-[#faf8f3] border-t-4 border-b-4 border-amber-700',
    accentColor: '#b45309'
  },
  'Tech_Modern': {
    name: 'Tech Modern',
    description: 'Gradient tech style',
    previewClasses: 'bg-white border-t-2 border-indigo-500',
    accentColor: '#6366f1'
  }
};

const TemplatePreviewSelector: React.FC<TemplatePreviewSelectorProps> = ({ 
  value, 
  onChange, 
  type = 'invoice',
  compact = false,
  userProfile,
  client,
  sampleInvoice,
  sampleProposal
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<InvoiceTemplate | null>(null);

  const templates: InvoiceTemplate[] = [
    'Minimalist_Dark',
    'Swiss_Clean',
    'Corporate_Elite',
    'Cyber_Obsidian',
    'Modern_Soft',
    'Classic_Blue',
    'Elegant_Gold',
    'Tech_Modern'
  ];

  const safeValue = value || 'Swiss_Clean';
  const selectedTemplate = templateInfo[safeValue] || templateInfo['Swiss_Clean'];

  const handlePreviewClick = (template: InvoiceTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewTemplate(template);
  };

  const handleSelectFromPreview = (template: InvoiceTemplate) => {
    onChange(template);
  };

  if (compact) {
    return (
      <>
        <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="h-10 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-[10px] font-bold uppercase tracking-widest cursor-pointer outline-none flex items-center gap-2 flex-shrink-0 transition-all"
        >
          <div className={`w-7 h-5 rounded border ${selectedTemplate.previewClasses} relative overflow-hidden p-0.5 flex-shrink-0`}>
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="w-full h-full flex flex-col">
                <div className="h-0.5 mb-0.5 w-3/4" style={{ backgroundColor: selectedTemplate.accentColor }}></div>
                <div className="h-0.5 mb-0.5 w-1/2" style={{ backgroundColor: selectedTemplate.accentColor }}></div>
                <div className="h-0.5 w-full mt-auto" style={{ backgroundColor: selectedTemplate.accentColor }}></div>
              </div>
            </div>
          </div>
          <span className="hidden sm:inline">{selectedTemplate.name}</span>
          <span className="sm:hidden">Template</span>
        </button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-[9998]" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-12 right-0 z-[9999] bg-[#0A0A0B] border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[320px] max-h-[80vh] overflow-y-auto">
              <div className="text-xs font-black uppercase tracking-widest text-white/60 mb-4 px-2">
                Select Template
              </div>
              <div className="grid grid-cols-1 gap-2">
                {templates.map((template) => {
                  const info = templateInfo[template] || templateInfo['Swiss_Clean'];
                  const isSelected = safeValue === template;
                  return (
                    <div
                      key={template}
                      className={`group/template p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <button
                            onClick={(e) => handlePreviewClick(template, e)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center opacity-0 group-hover/template:opacity-100 transition-opacity hover:bg-indigo-500 z-10 shadow-lg"
                            title="Preview template"
                          >
                            <Eye size={10} className="text-white" />
                          </button>
                          <div className={`w-16 h-10 rounded border-2 flex-shrink-0 ${info.previewClasses} relative overflow-hidden p-1`}>
                          <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <div className="w-full h-full flex flex-col p-0.5">
                              {template === 'Minimalist_Dark' && (
                                <>
                                  <div className="h-0.5 bg-white mb-0.5 w-3/4"></div>
                                  <div className="h-0.5 bg-white mb-0.5 w-1/2"></div>
                                  <div className="h-0.5 bg-white w-full mt-auto"></div>
                                </>
                              )}
                              {template === 'Swiss_Clean' && (
                                <>
                                  <div className="h-1 bg-slate-900 mb-0.5 w-full border-b border-slate-900"></div>
                                  <div className="h-0.5 bg-slate-400 w-2/3"></div>
                                  <div className="h-1 bg-slate-900 w-full mt-auto border-t-2 border-slate-900"></div>
                                </>
                              )}
                              {template === 'Corporate_Elite' && (
                                <>
                                  <div className="h-0.5 bg-indigo-600 mb-0.5 w-full border-l-2 border-indigo-600"></div>
                                  <div className="h-0.5 bg-slate-600 w-3/4 ml-1"></div>
                                  <div className="h-0.5 bg-slate-400 w-full mt-auto"></div>
                                </>
                              )}
                              {template === 'Cyber_Obsidian' && (
                                <>
                                  <div className="h-0.5 bg-green-400 mb-0.5 w-full border border-green-400"></div>
                                  <div className="h-0.5 bg-green-500 w-2/3"></div>
                                  <div className="h-0.5 bg-green-400 w-full mt-auto border border-green-400"></div>
                                </>
                              )}
                              {template === 'Modern_Soft' && (
                                <>
                                  <div className="h-0.5 bg-indigo-200 mb-0.5 w-full rounded"></div>
                                  <div className="h-0.5 bg-slate-300 w-3/4 rounded-full"></div>
                                  <div className="h-0.5 bg-indigo-200 w-full mt-auto rounded"></div>
                                </>
                              )}
                              {template === 'Classic_Blue' && (
                                <>
                                  <div className="h-1 bg-blue-900 mb-0.5 w-full"></div>
                                  <div className="h-0.5 bg-slate-400 w-2/3 border-l border-blue-900"></div>
                                  <div className="h-0.5 bg-blue-900 w-full mt-auto"></div>
                                </>
                              )}
                              {template === 'Elegant_Gold' && (
                                <>
                                  <div className="h-0.5 bg-amber-700 mb-0.5 w-full border-y border-amber-700"></div>
                                  <div className="h-0.5 bg-amber-200 w-2/3 border-l border-amber-700"></div>
                                  <div className="h-0.5 bg-amber-700 w-full mt-auto border-y border-amber-700"></div>
                                </>
                              )}
                              {template === 'Tech_Modern' && (
                                <>
                                  <div className="h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 mb-0.5 w-full rounded"></div>
                                  <div className="h-0.5 bg-indigo-200 w-3/4 rounded"></div>
                                  <div className="h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 w-full mt-auto rounded"></div>
                                </>
                              )}
                            </div>
                          </div>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => {
                              onChange(template);
                              setIsOpen(false);
                            }}
                            className="w-full text-left"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold uppercase tracking-widest ${
                                isSelected ? 'text-white' : 'text-white/90'
                              }`}>
                                {info.name}
                              </span>
                              {isSelected && (
                                <Check size={14} className="text-indigo-400 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-[9px] text-white/50 font-medium mt-0.5 leading-tight">
                              {info.description}
                            </p>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
        </div>
        {previewTemplate && (
          <TemplatePreviewModal
            isOpen={previewTemplate !== null}
            onClose={() => setPreviewTemplate(null)}
            onSelect={handleSelectFromPreview}
            template={previewTemplate}
            type={type}
            sampleData={{
              invoice: sampleInvoice,
              proposal: sampleProposal,
              userProfile,
              client
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="text-xs font-black uppercase tracking-widest text-white/60 mb-4">
          Available Templates
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {templates.map((template) => {
          const info = templateInfo[template] || templateInfo['Swiss_Clean'];
          const isSelected = safeValue === template;
          return (
            <div
              key={template}
              className={`group relative p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/30'
                  : 'bg-slate-950/50 border-white/5 hover:bg-slate-900/50 hover:border-indigo-500/30'
              }`}
              onClick={() => onChange(template)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviewClick(template, e);
                }}
                className="absolute top-2 right-2 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-500 z-10 shadow-lg"
                title="Preview template"
              >
                <Eye size={14} className="text-white" />
              </button>
              <div className={`w-full h-20 rounded-lg mb-3 border ${info.previewClasses} flex items-center justify-center overflow-hidden relative group/preview`}>
                <div className="absolute inset-0 opacity-5 group-hover/preview:opacity-15 transition-opacity pointer-events-none p-1.5">
                  <div className="w-full h-full flex flex-col">
                    {/* Template-specific preview patterns */}
                    {template === 'Minimalist_Dark' && (
                      <>
                        <div className="h-0.5 bg-white mb-1 w-4/5"></div>
                        <div className="h-0.5 bg-white mb-1 w-3/5"></div>
                        <div className="h-0.5 bg-white mb-1 w-2/5"></div>
                        <div className="h-0.5 bg-white w-full mt-auto"></div>
                      </>
                    )}
                    {template === 'Swiss_Clean' && (
                      <>
                        <div className="h-1 bg-slate-900 mb-1 w-full border-b-2 border-slate-900"></div>
                        <div className="h-0.5 bg-slate-400 mb-0.5 w-3/4"></div>
                        <div className="h-0.5 bg-slate-400 mb-0.5 w-1/2"></div>
                        <div className="h-1 bg-slate-900 w-full mt-auto border-t-4 border-slate-900"></div>
                      </>
                    )}
                    {template === 'Corporate_Elite' && (
                      <>
                        <div className="h-0.5 bg-indigo-600 mb-1 w-full border-l-4 border-indigo-600 pl-1"></div>
                        <div className="h-0.5 bg-slate-600 mb-0.5 w-5/6 ml-2"></div>
                        <div className="h-0.5 bg-slate-600 mb-0.5 w-4/6 ml-2"></div>
                        <div className="h-1 bg-slate-300 w-full mt-auto"></div>
                      </>
                    )}
                    {template === 'Cyber_Obsidian' && (
                      <>
                        <div className="h-0.5 bg-green-400 mb-0.5 w-full border border-green-400 font-mono text-[4px] text-green-400"> &gt; INVOICE</div>
                        <div className="h-0.5 bg-green-500 mb-0.5 w-3/4"></div>
                        <div className="h-0.5 bg-green-500 mb-0.5 w-2/3"></div>
                        <div className="h-0.5 bg-green-400 w-full mt-auto border border-green-400"></div>
                      </>
                    )}
                    {template === 'Modern_Soft' && (
                      <>
                        <div className="h-1 bg-gradient-to-r from-indigo-100 to-purple-100 mb-1 w-full rounded"></div>
                        <div className="h-0.5 bg-slate-300 mb-0.5 w-4/5 rounded-full"></div>
                        <div className="h-0.5 bg-slate-300 mb-0.5 w-3/5 rounded-full"></div>
                        <div className="h-1 bg-indigo-200 w-full mt-auto rounded"></div>
                      </>
                    )}
                    {template === 'Classic_Blue' && (
                      <>
                        <div className="h-1 bg-blue-900 mb-1 w-full"></div>
                        <div className="h-0.5 bg-slate-400 mb-0.5 w-4/5 border-l-2 border-blue-900 pl-0.5"></div>
                        <div className="h-0.5 bg-slate-400 mb-0.5 w-3/5 border-l-2 border-blue-900 pl-0.5"></div>
                        <div className="h-1 bg-blue-900 w-full mt-auto"></div>
                      </>
                    )}
                    {template === 'Elegant_Gold' && (
                      <>
                        <div className="h-1 bg-amber-700 mb-1 w-full border-t-2 border-b-2 border-amber-700"></div>
                        <div className="h-0.5 bg-amber-200 mb-0.5 w-4/5 border-l-2 border-amber-700 pl-0.5"></div>
                        <div className="h-0.5 bg-amber-200 mb-0.5 w-3/5 border-l-2 border-amber-700 pl-0.5"></div>
                        <div className="h-1 bg-amber-700 w-full mt-auto border-t-2 border-b-2 border-amber-700"></div>
                      </>
                    )}
                    {template === 'Tech_Modern' && (
                      <>
                        <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mb-1 w-full rounded-t"></div>
                        <div className="h-0.5 bg-indigo-200 mb-0.5 w-4/5 rounded"></div>
                        <div className="h-0.5 bg-purple-200 mb-0.5 w-3/5 rounded"></div>
                        <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 w-full mt-auto rounded-b"></div>
                      </>
                    )}
                  </div>
                </div>
                <div className="absolute bottom-1 right-1 w-6 h-6 rounded opacity-0 group-hover/preview:opacity-100 transition-opacity pointer-events-none">
                  <div className="w-full h-full border-2 rounded" style={{ borderColor: info.accentColor }}>
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: info.accentColor }}></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-widest ${
                    isSelected ? 'text-white' : 'text-white/90 group-hover:text-white'
                  }`}>
                    {info.name}
                  </span>
                  {isSelected && (
                    <Check size={14} className="text-indigo-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-[9px] text-white/50 font-medium leading-tight line-clamp-2">
                  {info.description}
                </p>
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center pointer-events-none">
                  <Check size={12} className="text-white" />
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>
      {previewTemplate && (
        <TemplatePreviewModal
          isOpen={previewTemplate !== null}
          onClose={() => setPreviewTemplate(null)}
          onSelect={handleSelectFromPreview}
          template={previewTemplate}
          type={type}
          sampleData={{
            invoice: sampleInvoice,
            proposal: sampleProposal,
            userProfile,
            client
          }}
        />
      )}
    </>
  );
};

export default TemplatePreviewSelector;
