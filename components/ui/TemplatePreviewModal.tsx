import React, { useRef, useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Eye } from 'lucide-react';
import { InvoiceTemplate, Invoice, Proposal, UserProfile, Client } from '../../types';
import { renderInvoiceTemplate, renderProposalTemplate } from '../../utils/pdfTemplates';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: InvoiceTemplate) => void;
  template: InvoiceTemplate;
  type: 'invoice' | 'proposal';
  sampleData: {
    invoice?: Partial<Invoice>;
    proposal?: Partial<Proposal>;
    userProfile: UserProfile | null | undefined;
    client: Client | null | undefined;
  };
}

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  template,
  type,
  sampleData
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  // Create sample data for preview - moved before useEffect that references them
  const sampleInvoice = useMemo<Invoice>(() => ({
    id: 'INV-2024-001',
    companyId: 'COMP-001',
    version: 1,
    clientId: sampleData.client?.name || 'Client Name',
    clientEmail: sampleData.client?.email || 'client@example.com',
    language: 'EN',
    type: 'Invoice',
    date: new Date().toISOString().split('T')[0],
    productList: [
      { productId: 'ITEM-1', name: 'Professional Service', quantity: 2, price: 1500 },
      { productId: 'ITEM-2', name: 'Consulting Hours', quantity: 10, price: 250 }
    ],
    taxRate: 0,
    discountRate: 0,
    depositPaid: 0,
    amountPaid: 5500,
    amountAED: 5500,
    exchangeRate: 1,
    status: 'Draft',
    currency: 'AED',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    templateType: template,
    matchStatus: 'NOT_CHECKED',
    isReoccurring: false,
    reoccurrenceFrequency: 'Monthly',
    ...(sampleData.invoice || {})
  } as Invoice), [sampleData.client, sampleData.invoice, template]);

  const sampleProposal = useMemo<Proposal>(() => ({
    id: 'PRO-2024-001',
    companyId: 'COMP-001',
    title: 'Strategic Project Proposal',
    clientName: sampleData.client?.name || 'Client Name',
    clientId: sampleData.client?.id || 'CLIENT-001',
    industry: 'Technology',
    scope: 'This proposal outlines a comprehensive solution for your business needs.',
    items: [
      { id: 'item-1', name: 'Phase 1: Discovery & Planning', price: 5000, tax: 0 },
      { id: 'item-2', name: 'Phase 2: Development & Implementation', price: 15000, tax: 0 },
      { id: 'item-3', name: 'Phase 3: Testing & Deployment', price: 5000, tax: 0 }
    ],
    startDate: new Date().toISOString().split('T')[0],
    timeline: '90 days',
    budget: 25000,
    billingType: 'Fixed Price',
    status: 'Draft',
    currency: 'AED',
    templateType: template,
    aiDraftContent: 'This is a comprehensive proposal designed to address your business requirements with a strategic approach to implementation and delivery.',
    ...(sampleData.proposal || {})
  } as Proposal), [sampleData.client, sampleData.proposal, template]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      if (!containerRef.current) return;
      const availableWidth = containerRef.current.offsetWidth - 64; // Account for padding (32px each side)
      const docWidthPx = 794;
      
      // Calculate scale based on width to fit horizontally, allow vertical scrolling
      const scale = Math.min(1, availableWidth / docWidthPx);
      
      setPreviewScale(Math.max(0.4, scale)); // Minimum scale of 0.4 for very small screens
    };

    // Initial calculation after DOM is ready - use multiple attempts to ensure container is rendered
    const timeoutId1 = setTimeout(() => {
      handleResize();
    }, 100);
    
    const timeoutId2 = setTimeout(() => {
      handleResize();
    }, 300);
    
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  // Update wrapper height to ensure full content is visible
  useEffect(() => {
    if (!isOpen || !previewRef.current || !wrapperRef.current) return;
    
    const updateWrapperHeight = () => {
      if (!previewRef.current || !wrapperRef.current) return;
      
      // Get the actual content height before scaling (scrollHeight gives original size)
      const originalHeight = previewRef.current.scrollHeight || previewRef.current.offsetHeight || 1123;
      
      // Calculate the visual height after scaling
      const scaledHeight = originalHeight * previewScale;
      
      // Update wrapper to show full content - add buffer for safety
      const wrapperHeight = Math.max(scaledHeight + 20, 1123 * previewScale);
      wrapperRef.current.style.height = `${wrapperHeight}px`;
    };

    // Multiple timeouts to ensure content has rendered
    const timeouts = [
      setTimeout(updateWrapperHeight, 100),
      setTimeout(updateWrapperHeight, 300),
      setTimeout(updateWrapperHeight, 600),
      setTimeout(updateWrapperHeight, 1000)
    ];

    return () => {
      timeouts.forEach(id => clearTimeout(id));
    };
  }, [isOpen, previewScale, template, type, sampleInvoice, sampleProposal]);

  if (!isOpen) return null;

  const total = useMemo(() => {
    return type === 'invoice' 
      ? sampleInvoice.productList.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      : sampleProposal.budget;
  }, [type, sampleInvoice, sampleProposal]);

  return createPortal(
    <div className="fixed inset-0 z-[10001] bg-[#0A0A0B]/98 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div 
        className="bg-[#111] border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-16 bg-[#0A0A0B] border-b border-white/10 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <Eye size={20} className="text-indigo-400" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white">
                Template Preview: {template.replace('_', ' ')}
              </h3>
              <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest mt-0.5">
                Click outside or press ESC to close
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onSelect(template);
                onClose();
              }}
              className="h-10 px-6 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg"
            >
              <Check size={14} />
              <span>Use This Template</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div ref={containerRef} className="flex-1 overflow-auto bg-slate-200/50 flex flex-col items-center py-10 px-4 relative">
          <div 
            ref={wrapperRef}
            className="relative transition-all duration-300 shadow-2xl"
            style={{ 
              width: `${794 * previewScale}px`, 
              minHeight: `${1123 * previewScale}px`
            }}
          >
            <div 
              ref={previewRef} 
              className="bg-white flex flex-col font-sans absolute top-0 left-0"
              style={{ 
                width: '794px', 
                minHeight: '1123px',
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left'
              }}
            >
              {type === 'invoice' 
                ? renderInvoiceTemplate(template, {
                    invoice: sampleInvoice,
                    userProfile: sampleData.userProfile,
                    client: sampleData.client || null,
                    total,
                    isEditing: false
                  })
                : renderProposalTemplate(template, {
                    proposal: sampleProposal,
                    userProfile: sampleData.userProfile,
                    client: sampleData.client || null,
                    total
                  })
              }
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-16 bg-[#0A0A0B] border-t border-white/10 flex items-center justify-between px-6 shrink-0">
          <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest">
            Preview showing sample {type === 'invoice' ? 'invoice' : 'proposal'} data
          </p>
          <button
            onClick={() => {
              onSelect(template);
              onClose();
            }}
            className="h-10 px-8 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
          >
            Select This Template
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TemplatePreviewModal;
