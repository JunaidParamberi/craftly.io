import React from 'react';
import { Invoice, InvoiceItem, Currency, InvoiceTemplate, Proposal } from '../types';
import { UserProfile } from '../types';
import { Client } from '../types';

const currencySymbols: Record<Currency, string> = { 
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$', CHF: 'Fr', 
  CNY: '¥', INR: '₹', BRL: 'R$', SGD: 'S$', AED: 'AED ', SAR: 'ر.س', QAR: 'ر.ق',
  MXN: '$', HKD: 'HK$', NZD: 'NZ$', ZAR: 'R', TRY: '₺', KRW: '₩',
  IDR: 'Rp', MYR: 'RM', PHP: '₱', THB: '฿', VND: '₫'
};

interface TemplateProps {
  invoice?: Invoice;
  proposal?: Proposal;
  userProfile: UserProfile | null | undefined;
  client: Client | null | undefined;
  total: number;
  isEditing?: boolean;
  onItemUpdate?: (index: number, updates: Partial<InvoiceItem>) => void;
}

export const renderInvoiceTemplate = (template: InvoiceTemplate, props: TemplateProps): React.ReactElement => {
  const { invoice, userProfile, client, total, isEditing, onItemUpdate } = props;
  if (!invoice) return <div></div>;
  // After this check, invoice is guaranteed to be defined - cast props to have required invoice
  const safeProps = { ...props, invoice } as TemplateProps & { invoice: Invoice };

  switch (template) {
    case 'Minimalist_Dark':
      return <MinimalistDarkTemplate {...safeProps} />;
    case 'Swiss_Clean':
      return <SwissCleanTemplate {...safeProps} />;
    case 'Corporate_Elite':
      return <CorporateEliteTemplate {...safeProps} />;
    case 'Cyber_Obsidian':
      return <CyberObsidianTemplate {...safeProps} />;
    case 'Modern_Soft':
      return <ModernSoftTemplate {...safeProps} />;
    case 'Classic_Blue':
      return <ClassicBlueTemplate {...safeProps} />;
    case 'Elegant_Gold':
      return <ElegantGoldTemplate {...safeProps} />;
    case 'Tech_Modern':
      return <TechModernTemplate {...safeProps} />;
    default:
      return <SwissCleanTemplate {...safeProps} />;
  }
};

export const renderProposalTemplate = (template: InvoiceTemplate, props: TemplateProps): React.ReactElement => {
  const { proposal, userProfile, client, total } = props;
  if (!proposal) return <div></div>;

  switch (template) {
    case 'Minimalist_Dark':
      return <ProposalMinimalistDark {...props} />;
    case 'Swiss_Clean':
      return <ProposalSwissClean {...props} />;
    case 'Corporate_Elite':
      return <ProposalCorporateElite {...props} />;
    case 'Cyber_Obsidian':
      return <ProposalCyberObsidian {...props} />;
    case 'Modern_Soft':
      return <ProposalModernSoft {...props} />;
    case 'Classic_Blue':
      return <ProposalClassicBlue {...props} />;
    case 'Elegant_Gold':
      return <ProposalElegantGold {...props} />;
    case 'Tech_Modern':
      return <ProposalTechModern {...props} />;
    default:
      return <ProposalSwissClean {...props} />;
  }
};

// ============= INVOICE TEMPLATES =============

const MinimalistDarkTemplate: React.FC<TemplateProps> = ({ invoice, userProfile, client, total, isEditing, onItemUpdate }) => {
  if (!invoice) return <div></div>;
  return (
    <div className="bg-slate-900 text-white min-h-full p-[80px] flex flex-col">
      <div className="flex justify-between items-start mb-16 border-b border-white/20 pb-12">
        <div className="flex-1">
          {userProfile?.branding?.logoUrl ? (
            <img src={userProfile.branding.logoUrl} alt="Logo" className="h-16 object-contain" crossOrigin="anonymous" />
          ) : (
            <h2 className="text-3xl font-bold text-white mb-2">{userProfile?.companyName}</h2>
          )}
          <p className="text-xs text-white/60 mt-2">{userProfile?.branding?.address}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/50 mb-2 uppercase tracking-wider">Invoice #</div>
          <div className="text-2xl font-bold text-white">#{invoice.id}</div>
        </div>
      </div>

      <div className="mb-12">
        <h1 className="text-5xl font-black text-white mb-8">{invoice.type}</h1>
        <div className="text-right text-white/70">{new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
      </div>

      <div className="grid grid-cols-2 gap-16 mb-16">
        <div>
          <h4 className="text-xs text-white/50 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Bill To</h4>
          <p className="text-lg font-semibold text-white mb-1">{client?.name || invoice.clientId}</p>
          <p className="text-xs text-white/60 leading-relaxed">{client?.address || 'No address provided'}</p>
          <p className="text-xs text-white/50 mt-2">{client?.email || invoice.clientEmail}</p>
        </div>
        <div>
          <h4 className="text-xs text-white/50 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">From</h4>
          <p className="text-lg font-semibold text-white mb-1">{userProfile?.fullName}</p>
          <p className="text-xs text-indigo-400 mb-2">{userProfile?.title || 'OPERATIVE'}</p>
          <p className="text-xs text-white/50">{userProfile?.email}</p>
        </div>
      </div>

      <div className="flex-1">
        <div className="w-full border-b border-white/20 pb-3 mb-4 flex justify-between text-xs text-white/50 uppercase tracking-widest">
          <span className="w-1/2">Description</span>
          <div className="flex w-1/2 justify-end gap-12">
            <span className="w-16 text-center">Qty</span>
            <span className="w-24 text-right">Price</span>
            <span className="w-24 text-right">Total</span>
          </div>
        </div>
        
        <div className="space-y-3">
          {(invoice.productList || []).map((item, i) => (
            <div key={i} className="flex justify-between items-center py-3 border-b border-white/5">
              <div className="flex-1 pr-10">
                {isEditing && onItemUpdate ? (
                  <input className="w-full bg-slate-800 border border-white/10 p-2 text-white focus:border-indigo-500" value={item.name} onChange={e => onItemUpdate(i, { name: e.target.value })} />
                ) : (
                  <p className="text-base text-white">{item.name}</p>
                )}
              </div>
              <div className="flex justify-end gap-12 items-center">
                <div className="w-16 text-center text-white">{item.quantity}</div>
                <div className="w-24 text-right text-white">{item.price.toLocaleString()}</div>
                <div className="w-24 text-right text-white font-semibold">{(item.price * item.quantity).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t-2 border-white/20">
          <div className="flex justify-between items-center">
            <span className="text-xl text-white/70 uppercase tracking-wider">Total</span>
            <span className="text-4xl font-bold text-white">{currencySymbols[invoice.currency]}{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="mt-16 pt-10 border-t border-white/10 grid grid-cols-2 gap-10">
        <div>
          <h5 className="text-xs text-white/50 uppercase tracking-widest mb-4">Payment Details</h5>
          <p className="text-xs text-white/60 leading-relaxed">{userProfile?.branding?.bankDetails || 'Payment details not provided'}</p>
          <p className="text-xs text-rose-400 mt-4">Due: {new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        </div>
        <div className="text-right flex flex-col items-end justify-end">
          {userProfile?.branding?.signatureUrl && <img src={userProfile.branding.signatureUrl} alt="Signature" className="h-12 mb-4 opacity-80" crossOrigin="anonymous" />}
          <p className="text-sm font-semibold text-white">{userProfile?.fullName}</p>
          <p className="text-xs text-white/50 mt-1">{userProfile?.title || 'OPERATIVE'}</p>
        </div>
      </div>
    </div>
  );
};

const SwissCleanTemplate: React.FC<TemplateProps> = ({ invoice, userProfile, client, total, isEditing, onItemUpdate }) => {
  if (!invoice) return <div></div>;
  return (
    <div className="bg-white text-slate-900 min-h-full p-[80px] flex flex-col font-sans">
      <div className="flex justify-between items-start mb-16 border-b-4 border-slate-900 pb-12">
        <div className="flex-1 min-w-0 max-w-[60%]">
          {userProfile?.branding?.logoUrl ? (
            <div className="h-24 flex items-center justify-start">
              <img src={userProfile.branding.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" crossOrigin="anonymous" />
            </div>
          ) : (
            <div className="space-y-1">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-4">{userProfile?.companyName}</h2>
              <div className="space-y-0.5">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight max-w-[320px]">{userProfile?.branding?.address}</p>
                {userProfile?.branding?.trn && (
                  <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">TRN: {userProfile.branding.trn}</p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Serial Node</div>
          <div className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">#{invoice.id}</div>
        </div>
      </div>

      <div className="flex justify-between items-end mb-16">
        <div>
          <h1 className="text-7xl font-black uppercase tracking-tighter text-slate-900 leading-none">{invoice.type}</h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Timestamp</div>
          <span className="text-lg font-black text-slate-900 uppercase">{new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-20 mb-20">
        <div>
          <h4 className="font-black text-slate-900 mb-6 uppercase text-[10px] tracking-[0.3em] border-b border-slate-100 pb-2">Target Registry (To)</h4>
          <div className="space-y-1">
            <p className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">{client?.name || invoice.clientId}</p>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest whitespace-pre-wrap leading-relaxed max-w-sm">{client?.address || 'No registered address.'}</p>
            <p className="text-[11px] text-slate-400 font-bold lowercase tracking-wider mt-2">{client?.email || invoice.clientEmail}</p>
          </div>
        </div>
        <div>
          <h4 className="font-black text-slate-900 mb-6 uppercase text-[10px] tracking-[0.3em] border-b border-slate-100 pb-2">Origin Registry (From)</h4>
          <div className="space-y-1">
            <p className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">{userProfile?.fullName}</p>
            <p className="text-[11px] text-indigo-600 font-black uppercase tracking-widest mb-1">{userProfile?.title || 'OPERATIVE'}</p>
            <p className="text-[11px] text-slate-400 font-bold lowercase tracking-wider mt-2">{userProfile?.email}</p>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="w-full border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-end">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] w-1/2">Service Allocation</span>
          <div className="flex w-1/2 justify-end gap-10">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] w-16 text-center">Volume</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] w-24 text-right">Unit Value</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] w-24 text-right">Node Worth</span>
          </div>
        </div>
        
        <div className="space-y-2">
          {(invoice.productList || []).map((item, i) => (
            <div key={i} className="flex justify-between items-center py-4 border-b border-slate-50">
              <div className="flex-1 pr-10">
                <p className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">{item.name}</p>
              </div>
              <div className="flex justify-end gap-10 items-center">
                <div className="w-16 text-center"><p className="text-sm font-black text-slate-900 tabular-nums">{item.quantity}</p></div>
                <div className="w-24 text-right"><p className="text-sm font-black text-slate-900 tabular-nums">{item.price.toLocaleString()}</p></div>
                <div className="w-24 text-right"><p className="text-lg font-black text-slate-900 tabular-nums">{(item.price * item.quantity).toLocaleString()}</p></div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 border-t-2 border-slate-100 pt-10">
          <div className="flex justify-between items-center pt-8 border-t-4 border-slate-900">
            <span className="text-xl font-black uppercase tracking-[0.3em]">Gross Worth</span>
            <span className="text-5xl font-black text-slate-900 tabular-nums tracking-tighter">{currencySymbols[invoice.currency]}{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="mt-20 pt-10 border-t border-slate-100 grid grid-cols-2 gap-10">
        <div>
          <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-4">Payment Node Parameters</h5>
          <div className="space-y-1 text-[11px] text-slate-500 font-bold uppercase tracking-widest">
            <p>Settlement to: {userProfile?.branding?.bankDetails || 'Manual wire.'}</p>
            <p className="mt-4 text-[9px] font-black text-rose-500 uppercase tracking-[0.4em]">Target Date: {new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end justify-end">
          {userProfile?.branding?.signatureUrl ? <img src={userProfile.branding.signatureUrl} alt="Signature" className="h-12 object-contain grayscale opacity-80 mb-4" crossOrigin="anonymous" /> : <div className="h-12 w-48 border-b-2 border-slate-900 mb-4"></div>}
          <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] leading-none">{userProfile?.fullName}</p>
          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-1.5">{userProfile?.title || 'OPERATIVE'}</p>
        </div>
      </div>
    </div>
  );
};

const CorporateEliteTemplate: React.FC<TemplateProps> = ({ invoice, userProfile, client, total, isEditing, onItemUpdate }) => {
  if (!invoice) return <div></div>;
  return (
    <div className="bg-white text-slate-800 min-h-full p-[80px] flex flex-col" style={{ fontFamily: "'Times New Roman', serif" }}>
      <div className="border-l-8 border-indigo-600 pl-8 mb-12">
        {userProfile?.branding?.logoUrl ? (
          <img src={userProfile.branding.logoUrl} alt="Logo" className="h-20 object-contain" crossOrigin="anonymous" />
        ) : (
          <h2 className="text-4xl font-bold text-slate-800 mb-2">{userProfile?.companyName}</h2>
        )}
        <p className="text-sm text-slate-600 mt-2">{userProfile?.branding?.address}</p>
        {userProfile?.branding?.trn && <p className="text-xs text-indigo-600 font-semibold mt-1">TRN: {userProfile.branding.trn}</p>}
      </div>

      <div className="flex justify-between items-start mb-12 border-b-2 border-slate-300 pb-8">
        <div>
          <h1 className="text-5xl font-bold text-slate-800 mb-2">{invoice.type}</h1>
          <p className="text-sm text-slate-600">Date: {new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Invoice Number</p>
          <p className="text-2xl font-bold text-indigo-600">#{invoice.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-16">
        <div className="bg-slate-50 p-6 rounded-lg">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Bill To</h4>
          <p className="text-base font-semibold text-slate-800 mb-2">{client?.name || invoice.clientId}</p>
          <p className="text-sm text-slate-600 leading-relaxed">{client?.address || 'Address not provided'}</p>
          <p className="text-xs text-slate-500 mt-2">{client?.email || invoice.clientEmail}</p>
        </div>
        <div className="bg-slate-50 p-6 rounded-lg">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">From</h4>
          <p className="text-base font-semibold text-slate-800 mb-2">{userProfile?.fullName}</p>
          <p className="text-xs text-indigo-600 font-semibold mb-2">{userProfile?.title || 'OPERATIVE'}</p>
          <p className="text-xs text-slate-500">{userProfile?.email}</p>
        </div>
      </div>

      <div className="flex-1">
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-slate-300">
              <th className="text-left py-4 text-xs font-bold text-slate-700 uppercase tracking-wide">Description</th>
              <th className="text-center py-4 text-xs font-bold text-slate-700 uppercase tracking-wide w-20">Qty</th>
              <th className="text-right py-4 text-xs font-bold text-slate-700 uppercase tracking-wide w-32">Unit Price</th>
              <th className="text-right py-4 text-xs font-bold text-slate-700 uppercase tracking-wide w-32">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.productList || []).map((item, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-4 text-base text-slate-800">{item.name}</td>
                <td className="py-4 text-center text-sm text-slate-700">{item.quantity}</td>
                <td className="py-4 text-right text-sm text-slate-700">{item.price.toLocaleString()}</td>
                <td className="py-4 text-right text-base font-semibold text-slate-800">{(item.price * item.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-16">
          <div className="w-80">
            <div className="flex justify-between items-center py-6 border-t-2 border-b-2 border-slate-300">
              <span className="text-lg font-bold text-slate-800">Total Amount</span>
              <span className="text-3xl font-bold text-indigo-600">{currencySymbols[invoice.currency]}{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-8 border-t-2 border-slate-300 grid grid-cols-2 gap-12">
        <div>
          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Payment Information</h5>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">{userProfile?.branding?.bankDetails || 'Payment details not provided'}</p>
          <p className="text-sm font-semibold text-rose-600">Due Date: {new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="text-right flex flex-col items-end justify-end">
          {userProfile?.branding?.signatureUrl && <img src={userProfile.branding.signatureUrl} alt="Signature" className="h-16 mb-4 opacity-70" crossOrigin="anonymous" />}
          <p className="text-base font-semibold text-slate-800">{userProfile?.fullName}</p>
          <p className="text-xs text-slate-500 mt-1">{userProfile?.title || 'Authorized Signatory'}</p>
        </div>
      </div>
    </div>
  );
};

const CyberObsidianTemplate: React.FC<TemplateProps> = ({ invoice, userProfile, client, total, isEditing, onItemUpdate }) => {
  if (!invoice) return <div></div>;
  return (
    <div className="bg-black text-green-400 min-h-full p-[80px] flex flex-col font-mono">
      <div className="border-2 border-green-400 p-8 mb-12">
        <div className="flex justify-between items-start">
          <div>
            {userProfile?.branding?.logoUrl ? (
              <img src={userProfile.branding.logoUrl} alt="Logo" className="h-16 object-contain grayscale brightness-200" crossOrigin="anonymous" />
            ) : (
              <h2 className="text-3xl font-bold text-green-400 mb-2">&gt; {userProfile?.companyName}</h2>
            )}
            <p className="text-xs text-green-500 mt-2 font-mono">{userProfile?.branding?.address}</p>
            {userProfile?.branding?.trn && <p className="text-xs text-green-400 mt-1">TRN: {userProfile.branding.trn}</p>}
          </div>
          <div className="text-right">
            <div className="text-xs text-green-500 mb-2">INVOICE_ID</div>
            <div className="text-2xl font-bold text-green-400 font-mono">#{invoice.id}</div>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <div className="text-green-500 text-xs mb-2">&gt; DOCUMENT_TYPE</div>
        <h1 className="text-6xl font-bold text-green-400 mb-4 font-mono">{invoice.type}</h1>
        <div className="text-green-500 text-xs">&gt; DATE: {new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-12 border border-green-400 p-6">
        <div>
          <div className="text-xs text-green-500 mb-3">&gt; TARGET_NODE</div>
          <div className="text-base font-bold text-green-400 mb-2">{client?.name || invoice.clientId}</div>
          <div className="text-xs text-green-600 leading-relaxed">{client?.address || 'NO_ADDRESS_REGISTERED'}</div>
          <div className="text-xs text-green-500 mt-2">{client?.email || invoice.clientEmail}</div>
        </div>
        <div>
          <div className="text-xs text-green-500 mb-3">&gt; ORIGIN_NODE</div>
          <div className="text-base font-bold text-green-400 mb-2">{userProfile?.fullName}</div>
          <div className="text-xs text-green-500">{userProfile?.title || 'OPERATIVE'}</div>
          <div className="text-xs text-green-600 mt-2">{userProfile?.email}</div>
        </div>
      </div>

      <div className="flex-1">
        <div className="border border-green-400 p-4 mb-4">
          <div className="grid grid-cols-4 gap-4 text-xs text-green-500 font-mono border-b border-green-400 pb-2">
            <div>ITEM</div>
            <div className="text-center">QTY</div>
            <div className="text-right">UNIT</div>
            <div className="text-right">TOTAL</div>
          </div>
        </div>
        
        <div className="space-y-2">
          {(invoice.productList || []).map((item, i) => (
            <div key={i} className="border border-green-400/30 p-4 grid grid-cols-4 gap-4 text-sm font-mono">
              <div className="text-green-400">{item.name}</div>
              <div className="text-center text-green-400">{item.quantity}</div>
              <div className="text-right text-green-400">{item.price.toLocaleString()}</div>
              <div className="text-right text-green-400 font-bold">{(item.price * item.quantity).toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 border-2 border-green-400 p-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-green-500 font-mono">&gt; TOTAL_AMOUNT</div>
            <div className="text-4xl font-bold text-green-400 font-mono">{currencySymbols[invoice.currency]}{total.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-green-400 grid grid-cols-2 gap-8 text-xs font-mono">
        <div>
          <div className="text-green-500 mb-3">&gt; PAYMENT_INSTRUCTIONS</div>
          <div className="text-green-600 leading-relaxed">{userProfile?.branding?.bankDetails || 'NO_PAYMENT_INFO'}</div>
          <div className="text-green-400 mt-4">&gt; DUE_DATE: {new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        </div>
        <div className="text-right">
          {userProfile?.branding?.signatureUrl && <img src={userProfile.branding.signatureUrl} alt="Signature" className="h-12 mb-4 opacity-50 grayscale brightness-200 ml-auto" crossOrigin="anonymous" />}
          <div className="text-green-400 font-bold">{userProfile?.fullName}</div>
          <div className="text-green-500 mt-1">{userProfile?.title || 'OPERATIVE'}</div>
        </div>
      </div>
    </div>
  );
};

const ModernSoftTemplate: React.FC<TemplateProps> = ({ invoice, userProfile, client, total, isEditing, onItemUpdate }) => {
  if (!invoice) return <div></div>;
  return (
    <div className="bg-gradient-to-br from-slate-50 to-white text-slate-800 min-h-full p-[80px] flex flex-col">
      <div className="flex justify-between items-start mb-16">
        <div className="flex-1">
          {userProfile?.branding?.logoUrl ? (
            <img src={userProfile.branding.logoUrl} alt="Logo" className="h-20 object-contain" crossOrigin="anonymous" />
          ) : (
            <h2 className="text-4xl font-light text-slate-800 mb-3">{userProfile?.companyName}</h2>
          )}
          <p className="text-sm text-slate-500 font-light mt-2">{userProfile?.branding?.address}</p>
          {userProfile?.branding?.trn && <p className="text-xs text-indigo-500 mt-1">TRN: {userProfile.branding.trn}</p>}
        </div>
        <div className="text-right">
          <div className="inline-block bg-indigo-100 px-6 py-3 rounded-full">
            <div className="text-xs text-indigo-600 font-medium mb-1">Invoice #</div>
            <div className="text-2xl font-semibold text-indigo-700">#{invoice.id}</div>
          </div>
        </div>
      </div>

      <div className="mb-16">
        <h1 className="text-6xl font-light text-slate-800 mb-4">{invoice.type}</h1>
        <p className="text-base text-slate-500">Issued on {new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-20">
        <div className="bg-white p-8 rounded-2xl shadow-sm">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Bill To</h4>
          <p className="text-lg font-medium text-slate-800 mb-2">{client?.name || invoice.clientId}</p>
          <p className="text-sm text-slate-500 leading-relaxed">{client?.address || 'Address not provided'}</p>
          <p className="text-xs text-slate-400 mt-3">{client?.email || invoice.clientEmail}</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">From</h4>
          <p className="text-lg font-medium text-slate-800 mb-2">{userProfile?.fullName}</p>
          <p className="text-sm text-indigo-600 mb-2">{userProfile?.title || 'OPERATIVE'}</p>
          <p className="text-xs text-slate-400">{userProfile?.email}</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl p-10 shadow-sm">
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-slate-700 mb-6">Items</h3>
          <div className="space-y-4">
            {(invoice.productList || []).map((item, i) => (
              <div key={i} className="flex justify-between items-center py-4 border-b border-slate-100 last:border-0">
                <div className="flex-1">
                  <p className="text-base font-medium text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-400 mt-1">Qty: {item.quantity} × {item.price.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-slate-800">{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t-2 border-slate-200">
          <div className="flex justify-between items-center">
            <span className="text-xl font-medium text-slate-600">Total Amount</span>
            <span className="text-4xl font-bold text-indigo-600">{currencySymbols[invoice.currency]}{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="mt-16 pt-10 grid grid-cols-2 gap-12">
        <div className="bg-white p-8 rounded-2xl shadow-sm">
          <h5 className="text-sm font-semibold text-slate-700 mb-4">Payment Details</h5>
          <p className="text-sm text-slate-500 leading-relaxed mb-4">{userProfile?.branding?.bankDetails || 'Payment details not provided'}</p>
          <p className="text-sm font-medium text-rose-600">Due: {new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm text-right flex flex-col items-end justify-end">
          {userProfile?.branding?.signatureUrl && <img src={userProfile.branding.signatureUrl} alt="Signature" className="h-14 mb-4 opacity-80" crossOrigin="anonymous" />}
          <p className="text-base font-medium text-slate-800">{userProfile?.fullName}</p>
          <p className="text-xs text-slate-400 mt-1">{userProfile?.title || 'Authorized Signatory'}</p>
        </div>
      </div>
    </div>
  );
};

const ClassicBlueTemplate: React.FC<TemplateProps> = ({ invoice, userProfile, client, total, isEditing, onItemUpdate }) => {
  if (!invoice) return <div></div>;
  return (
    <div className="bg-white text-slate-900 min-h-full p-[80px] flex flex-col">
      <div className="bg-blue-900 text-white p-10 mb-12 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            {userProfile?.branding?.logoUrl ? (
              <img src={userProfile.branding.logoUrl} alt="Logo" className="h-16 object-contain brightness-0 invert" crossOrigin="anonymous" />
            ) : (
              <h2 className="text-3xl font-bold text-white mb-2">{userProfile?.companyName}</h2>
            )}
            <p className="text-blue-200 text-sm mt-2">{userProfile?.branding?.address}</p>
            {userProfile?.branding?.trn && <p className="text-blue-300 text-xs mt-1">TRN: {userProfile.branding.trn}</p>}
          </div>
          <div className="text-right">
            <div className="text-blue-300 text-xs mb-2 uppercase tracking-wide">Invoice Number</div>
            <div className="text-3xl font-bold text-white">#{invoice.id}</div>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <h1 className="text-5xl font-bold text-blue-900 mb-4">{invoice.type}</h1>
        <p className="text-base text-slate-600">Date: {new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-16">
        <div>
          <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-4 border-l-4 border-blue-900 pl-3">Bill To</h4>
          <p className="text-lg font-semibold text-slate-900 mb-2">{client?.name || invoice.clientId}</p>
          <p className="text-sm text-slate-600 leading-relaxed">{client?.address || 'Address not provided'}</p>
          <p className="text-xs text-slate-500 mt-2">{client?.email || invoice.clientEmail}</p>
        </div>
        <div>
          <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-4 border-l-4 border-blue-900 pl-3">From</h4>
          <p className="text-lg font-semibold text-slate-900 mb-2">{userProfile?.fullName}</p>
          <p className="text-sm text-blue-700 mb-2">{userProfile?.title || 'OPERATIVE'}</p>
          <p className="text-xs text-slate-500">{userProfile?.email}</p>
        </div>
      </div>

      <div className="flex-1">
        <table className="w-full mb-8">
          <thead className="bg-blue-50">
            <tr>
              <th className="text-left py-4 px-4 text-xs font-bold text-blue-900 uppercase">Description</th>
              <th className="text-center py-4 px-4 text-xs font-bold text-blue-900 uppercase w-20">Qty</th>
              <th className="text-right py-4 px-4 text-xs font-bold text-blue-900 uppercase w-32">Price</th>
              <th className="text-right py-4 px-4 text-xs font-bold text-blue-900 uppercase w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.productList || []).map((item, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-4 px-4 text-base text-slate-800">{item.name}</td>
                <td className="py-4 px-4 text-center text-sm text-slate-700">{item.quantity}</td>
                <td className="py-4 px-4 text-right text-sm text-slate-700">{item.price.toLocaleString()}</td>
                <td className="py-4 px-4 text-right text-base font-semibold text-slate-900">{(item.price * item.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-96 bg-blue-900 text-white p-8 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Amount</span>
              <span className="text-3xl font-bold">{currencySymbols[invoice.currency]}{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 pt-10 border-t-2 border-blue-900 grid grid-cols-2 gap-12">
        <div>
          <h5 className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-4">Payment Information</h5>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">{userProfile?.branding?.bankDetails || 'Payment details not provided'}</p>
          <p className="text-sm font-semibold text-blue-900">Due Date: {new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="text-right flex flex-col items-end justify-end">
          {userProfile?.branding?.signatureUrl && <img src={userProfile.branding.signatureUrl} alt="Signature" className="h-16 mb-4 opacity-70" crossOrigin="anonymous" />}
          <p className="text-base font-semibold text-slate-900">{userProfile?.fullName}</p>
          <p className="text-xs text-slate-500 mt-1">{userProfile?.title || 'Authorized Signatory'}</p>
        </div>
      </div>
    </div>
  );
};

const ElegantGoldTemplate: React.FC<TemplateProps> = ({ invoice, userProfile, client, total, isEditing, onItemUpdate }) => {
  if (!invoice) return <div></div>;
  return (
    <div className="bg-cream-50 text-slate-900 min-h-full p-[80px] flex flex-col" style={{ backgroundColor: '#faf8f3' }}>
      <div className="border-t-4 border-b-4 border-amber-700 py-8 mb-12">
        <div className="flex justify-between items-center">
          <div>
            {userProfile?.branding?.logoUrl ? (
              <img src={userProfile.branding.logoUrl} alt="Logo" className="h-20 object-contain" crossOrigin="anonymous" />
            ) : (
              <h2 className="text-4xl font-bold text-amber-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{userProfile?.companyName}</h2>
            )}
            <p className="text-sm text-slate-600 mt-2" style={{ fontFamily: "'Georgia', serif" }}>{userProfile?.branding?.address}</p>
            {userProfile?.branding?.trn && <p className="text-xs text-amber-700 mt-1 font-semibold">TRN: {userProfile.branding.trn}</p>}
          </div>
          <div className="text-right">
            <div className="text-xs text-amber-700 uppercase tracking-widest mb-2 font-semibold">Invoice #</div>
            <div className="text-3xl font-bold text-amber-900" style={{ fontFamily: "'Playfair Display', serif" }}>#{invoice.id}</div>
          </div>
        </div>
      </div>

      <div className="mb-12 text-center">
        <h1 className="text-6xl font-bold text-amber-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>{invoice.type}</h1>
        <p className="text-base text-slate-600" style={{ fontFamily: "'Georgia', serif" }}>{new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-16">
        <div className="border-l-4 border-amber-700 pl-6">
          <h4 className="text-xs font-bold text-amber-900 uppercase tracking-widest mb-4" style={{ fontFamily: "'Georgia', serif" }}>Bill To</h4>
          <p className="text-lg font-semibold text-slate-900 mb-2">{client?.name || invoice.clientId}</p>
          <p className="text-sm text-slate-600 leading-relaxed italic" style={{ fontFamily: "'Georgia', serif" }}>{client?.address || 'Address not provided'}</p>
          <p className="text-xs text-slate-500 mt-2">{client?.email || invoice.clientEmail}</p>
        </div>
        <div className="border-l-4 border-amber-700 pl-6">
          <h4 className="text-xs font-bold text-amber-900 uppercase tracking-widest mb-4" style={{ fontFamily: "'Georgia', serif" }}>From</h4>
          <p className="text-lg font-semibold text-slate-900 mb-2">{userProfile?.fullName}</p>
          <p className="text-sm text-amber-700 mb-2 font-semibold">{userProfile?.title || 'OPERATIVE'}</p>
          <p className="text-xs text-slate-500">{userProfile?.email}</p>
        </div>
      </div>

      <div className="flex-1">
        <table className="w-full mb-8" style={{ fontFamily: "'Georgia', serif" }}>
          <thead>
            <tr className="border-b-2 border-amber-700">
              <th className="text-left py-4 text-xs font-bold text-amber-900 uppercase tracking-widest">Description</th>
              <th className="text-center py-4 text-xs font-bold text-amber-900 uppercase tracking-widest w-20">Qty</th>
              <th className="text-right py-4 text-xs font-bold text-amber-900 uppercase tracking-widest w-32">Price</th>
              <th className="text-right py-4 text-xs font-bold text-amber-900 uppercase tracking-widest w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.productList || []).map((item, i) => (
              <tr key={i} className="border-b border-amber-200">
                <td className="py-4 text-base text-slate-800">{item.name}</td>
                <td className="py-4 text-center text-sm text-slate-700">{item.quantity}</td>
                <td className="py-4 text-right text-sm text-slate-700">{item.price.toLocaleString()}</td>
                <td className="py-4 text-right text-base font-semibold text-slate-900">{(item.price * item.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-96 bg-amber-900 text-white p-8 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>Total Amount</span>
              <span className="text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>{currencySymbols[invoice.currency]}{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 pt-10 border-t-2 border-amber-700 grid grid-cols-2 gap-12">
        <div>
          <h5 className="text-xs font-bold text-amber-900 uppercase tracking-widest mb-4" style={{ fontFamily: "'Georgia', serif" }}>Payment Information</h5>
          <p className="text-sm text-slate-600 leading-relaxed mb-4 italic" style={{ fontFamily: "'Georgia', serif" }}>{userProfile?.branding?.bankDetails || 'Payment details not provided'}</p>
          <p className="text-sm font-semibold text-amber-900">Due Date: {new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="text-right flex flex-col items-end justify-end">
          {userProfile?.branding?.signatureUrl && <img src={userProfile.branding.signatureUrl} alt="Signature" className="h-16 mb-4 opacity-80" crossOrigin="anonymous" />}
          <p className="text-base font-semibold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>{userProfile?.fullName}</p>
          <p className="text-xs text-slate-500 mt-1" style={{ fontFamily: "'Georgia', serif" }}>{userProfile?.title || 'Authorized Signatory'}</p>
        </div>
      </div>
    </div>
  );
};

const TechModernTemplate: React.FC<TemplateProps> = ({ invoice, userProfile, client, total, isEditing, onItemUpdate }) => {
  if (!invoice) return <div></div>;
  return (
    <div className="bg-white text-slate-900 min-h-full p-[80px] flex flex-col">
      <div className="mb-12">
        <div className="flex justify-between items-start mb-6">
          {userProfile?.branding?.logoUrl ? (
            <img src={userProfile.branding.logoUrl} alt="Logo" className="h-16 object-contain" crossOrigin="anonymous" />
          ) : (
            <h2 className="text-3xl font-bold text-slate-900">{userProfile?.companyName}</h2>
          )}
          <div className="text-right">
            <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg">
              <span className="text-xs text-indigo-600 font-medium">INV-</span>
              <span className="text-xl font-bold text-indigo-700">#{invoice.id}</span>
            </div>
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"></div>
      </div>

      <div className="mb-12">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3">{invoice.type}</h1>
        <p className="text-sm text-slate-500">{new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-16">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl">
          <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-3">Bill To</h4>
          <p className="text-base font-semibold text-slate-900 mb-2">{client?.name || invoice.clientId}</p>
          <p className="text-sm text-slate-600 leading-relaxed">{client?.address || 'Address not provided'}</p>
          <p className="text-xs text-slate-500 mt-2">{client?.email || invoice.clientEmail}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl">
          <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-3">From</h4>
          <p className="text-base font-semibold text-slate-900 mb-2">{userProfile?.fullName}</p>
          <p className="text-sm text-purple-600 mb-2 font-semibold">{userProfile?.title || 'OPERATIVE'}</p>
          <p className="text-xs text-slate-500">{userProfile?.email}</p>
        </div>
      </div>

      <div className="flex-1">
        <div className="bg-slate-50 rounded-xl p-8">
          <div className="space-y-4">
            {(invoice.productList || []).map((item, i) => (
              <div key={i} className="flex justify-between items-center py-4 border-b border-slate-200 last:border-0">
                <div className="flex-1">
                  <p className="text-base font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500 mt-1">Quantity: {item.quantity} × {currencySymbols[invoice.currency]}{item.price.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{currencySymbols[invoice.currency]}{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t-2 border-slate-300">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-slate-700">Total Amount</span>
              <span className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">{currencySymbols[invoice.currency]}{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 pt-10 grid grid-cols-2 gap-12">
        <div className="bg-slate-50 p-6 rounded-xl">
          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-4">Payment Details</h5>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">{userProfile?.branding?.bankDetails || 'Payment details not provided'}</p>
          <p className="text-sm font-semibold text-indigo-600">Due: {new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="bg-slate-50 p-6 rounded-xl text-right flex flex-col items-end justify-end">
          {userProfile?.branding?.signatureUrl && <img src={userProfile.branding.signatureUrl} alt="Signature" className="h-14 mb-4 opacity-80" crossOrigin="anonymous" />}
          <p className="text-base font-semibold text-slate-900">{userProfile?.fullName}</p>
          <p className="text-xs text-slate-500 mt-1">{userProfile?.title || 'Authorized Signatory'}</p>
        </div>
      </div>
    </div>
  );
};

// ============= PROPOSAL TEMPLATES (Simplified versions) =============

const ProposalMinimalistDark: React.FC<TemplateProps> = ({ proposal, userProfile, client, total }) => {
  if (!proposal) return <div></div>;
  return (
    <div className="bg-slate-900 text-white min-h-full p-[80px] flex flex-col">
      <div className="mb-12">
        <h1 className="text-6xl font-bold text-white mb-4">{proposal.title}</h1>
        <p className="text-sm text-white/60">Proposal for {proposal.clientName}</p>
      </div>
      <div className="flex-1">
        <p className="text-base text-white/80 leading-relaxed whitespace-pre-wrap">{proposal.aiDraftContent || proposal.scope}</p>
        <div className="mt-12 pt-8 border-t border-white/20">
          <div className="text-3xl font-bold text-white">{currencySymbols[proposal.currency]}{proposal.budget.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

const ProposalSwissClean: React.FC<TemplateProps> = ({ proposal, userProfile, client, total }) => {
  if (!proposal) return <div></div>;
  return (
    <div className="bg-white text-slate-900 min-h-full p-[80px] flex flex-col font-sans">
      <div className="flex justify-between items-start mb-20 border-b-2 border-slate-100 pb-12 gap-12">
        <div className="flex-1 min-w-0 max-w-[60%]">
          {userProfile?.branding?.logoUrl ? (
            <div className="h-24 flex items-center justify-start">
              <img src={userProfile.branding.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" crossOrigin="anonymous" />
            </div>
          ) : (
            <div className="flex flex-col justify-center">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-[#1A1A1C] leading-none mb-4">{userProfile?.companyName}</h2>
              <div className="space-y-0.5">
                <p className="text-[10px] text-[#8A8A8E] font-bold uppercase tracking-widest leading-tight max-w-[320px]">{userProfile?.branding?.address}</p>
                {userProfile?.branding?.trn && (
                  <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-1">TRN: {userProfile.branding.trn}</p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="text-right shrink-0 flex-shrink-0">
          <div className="text-[10px] font-black text-[#8A8A8E] uppercase tracking-[0.3em] mb-2">Registry Trace</div>
          <p className="text-xl font-black text-[#1A1A1C] uppercase tracking-tight">{proposal.id}</p>
          <p className="text-[9px] font-bold text-[#8A8A8E] mt-2 lowercase tracking-wider opacity-80">{userProfile?.website?.replace('https://', '').replace('http://', '')}</p>
        </div>
      </div>

      <div className="mb-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-10 bg-indigo-500 rounded-full"></div>
          <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.5em]">Project Manifesto</h4>
        </div>
        <h1 className="text-[64px] font-black text-[#1A1A1C] uppercase tracking-[-0.04em] leading-[0.9] mb-8">{proposal.title}</h1>
      </div>

      <div className="grid grid-cols-12 gap-10 mb-20 pb-20 border-b border-[#F0F0F2]">
        <div className="col-span-7">
          <p className="text-[11px] font-black text-[#B0B0B4] uppercase tracking-[0.3em] mb-6">Client Objective Node:</p>
          <h4 className="text-[36px] font-black text-[#1A1A1C] uppercase leading-tight mb-4 tracking-tight">{proposal.clientName}</h4>
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-3 py-1 bg-slate-100 rounded-full">{proposal.industry}</span>
            <span className="text-[10px] font-bold text-[#8A8A8E] uppercase tracking-widest">Sector Deployment</span>
          </div>
        </div>
        <div className="col-span-5">
          <div className="bg-slate-50 rounded-[2rem] p-10 flex flex-col space-y-6 border border-slate-100">
            <div>
              <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-2 opacity-70">Mission Timeline</p>
              <p className="text-sm font-black text-[#1A1A1C] uppercase tracking-tight tabular-nums">{proposal.startDate} — {proposal.timeline}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-2 opacity-70">Strategic Worth</p>
              <p className="text-3xl font-black text-indigo-600 tracking-[-0.03em] leading-none tabular-nums">
                {currencySymbols[proposal.currency]}{proposal.budget.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-20">
        <div>
          <h4 className="text-[11px] font-black text-[#B0B0B4] uppercase tracking-[0.5em] mb-8 border-b border-slate-50 pb-4">Execution Logic</h4>
          <div className="text-[16px] text-[#4A4A4E] leading-[1.8] whitespace-pre-wrap font-medium">{proposal.aiDraftContent || proposal.scope || 'This document outlines the strategic implementation for the requested project nodes.'}</div>
        </div>

        {proposal.items && proposal.items.length > 0 && (
          <div>
            <h4 className="text-[11px] font-black text-[#B0B0B4] uppercase tracking-[0.5em] mb-8 border-b border-slate-50 pb-4">Resource Allocation</h4>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-[#1A1A1C]">
                  <th className="py-5 font-black uppercase text-[10px] tracking-[0.3em] text-[#8A8A8E]">Deployment Module</th>
                  <th className="py-5 text-right font-black uppercase text-[10px] tracking-[0.3em] text-[#8A8A8E]">Node Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F2]">
                {proposal.items.map((item, i) => (
                  <tr key={i} className="group">
                    <td className="py-6 font-black uppercase text-base text-[#1A1A1C] tracking-tight">{item.name}</td>
                    <td className="py-6 text-right font-black text-base text-[#1A1A1C] tabular-nums">
                      {currencySymbols[proposal.currency]}{item.price.toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-900 text-white">
                  <td className="py-10 px-8 font-black uppercase text-[12px] tracking-[0.4em]">Gross Mission Worth</td>
                  <td className="py-10 px-8 text-right font-black text-3xl tracking-tighter tabular-nums">
                    {currencySymbols[proposal.currency]}{proposal.budget.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-24 pt-16 border-t-2 border-slate-100">
        <div className="flex justify-between items-end">
          <div className="w-[320px]">
            <p className="text-[10px] font-black text-[#B0B0B4] uppercase tracking-[0.4em] mb-12">Authorized for Activation by</p>
            <div className="h-[2px] w-full bg-[#1A1A1C] mb-4"></div>
            <p className="text-[11px] font-black text-[#1A1A1C] uppercase tracking-[0.3em]">Client Strategic Node</p>
          </div>
          <div className="text-right">
            {userProfile?.branding?.signatureUrl ? (
              <img src={userProfile.branding.signatureUrl} alt="Signature" className="h-14 object-contain grayscale opacity-80 mb-6 ml-auto" crossOrigin="anonymous" />
            ) : (
              <div className="h-14 w-40 border-b-2 border-slate-200 mb-6 ml-auto opacity-30"></div>
            )}
            <p className="text-xl font-black text-[#1A1A1C] uppercase tracking-tight leading-none">{userProfile?.fullName}</p>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mt-2">{userProfile?.title || 'STRATEGIC OPERATIVE'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProposalCorporateElite: React.FC<TemplateProps> = ({ proposal, userProfile, client, total }) => {
  if (!proposal) return <div></div>;
  return (
    <div className="bg-white text-slate-800 min-h-full p-[80px] flex flex-col" style={{ fontFamily: "'Times New Roman', serif" }}>
      <div className="mb-12 border-l-8 border-indigo-600 pl-8">
        <h1 className="text-5xl font-bold text-slate-800 mb-4">{proposal.title}</h1>
        <p className="text-base text-slate-600">Proposal for {proposal.clientName}</p>
      </div>
      <div className="flex-1">
        <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap mb-12" style={{ fontFamily: "'Georgia', serif" }}>{proposal.aiDraftContent || proposal.scope}</p>
        <div className="mt-12 pt-8 border-t-2 border-slate-300">
          <div className="text-4xl font-bold text-indigo-600">{currencySymbols[proposal.currency]}{proposal.budget.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

const ProposalCyberObsidian: React.FC<TemplateProps> = ({ proposal, userProfile, client, total }) => {
  if (!proposal) return <div></div>;
  return (
    <div className="bg-black text-green-400 min-h-full p-[80px] flex flex-col font-mono">
      <div className="border-2 border-green-400 p-8 mb-12">
        <h1 className="text-5xl font-bold text-green-400 font-mono mb-4">&gt; {proposal.title}</h1>
        <p className="text-sm text-green-500">&gt; CLIENT: {proposal.clientName}</p>
      </div>
      <div className="flex-1">
        <p className="text-base text-green-400 leading-relaxed whitespace-pre-wrap mb-12 font-mono">{proposal.aiDraftContent || proposal.scope}</p>
        <div className="mt-12 pt-8 border-2 border-green-400 p-6">
          <div className="text-4xl font-bold text-green-400 font-mono">{currencySymbols[proposal.currency]}{proposal.budget.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

const ProposalModernSoft: React.FC<TemplateProps> = ({ proposal, userProfile, client, total }) => {
  if (!proposal) return <div></div>;
  return (
    <div className="bg-gradient-to-br from-slate-50 to-white text-slate-800 min-h-full p-[80px] flex flex-col">
      <div className="mb-12">
        <h1 className="text-6xl font-light text-slate-800 mb-4">{proposal.title}</h1>
        <p className="text-base text-slate-500">Proposal for {proposal.clientName}</p>
      </div>
      <div className="flex-1 bg-white rounded-2xl p-10 shadow-sm">
        <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap mb-12">{proposal.aiDraftContent || proposal.scope}</p>
        <div className="mt-12 pt-8 border-t-2 border-slate-200">
          <div className="text-4xl font-bold text-indigo-600">{currencySymbols[proposal.currency]}{proposal.budget.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

const ProposalClassicBlue: React.FC<TemplateProps> = ({ proposal, userProfile, client, total }) => {
  if (!proposal) return <div></div>;
  return (
    <div className="bg-white text-slate-900 min-h-full p-[80px] flex flex-col">
      <div className="bg-blue-900 text-white p-10 mb-12 rounded-lg">
        <h1 className="text-5xl font-bold text-white mb-4">{proposal.title}</h1>
        <p className="text-blue-200">Proposal for {proposal.clientName}</p>
      </div>
      <div className="flex-1">
        <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap mb-12">{proposal.aiDraftContent || proposal.scope}</p>
        <div className="mt-12 pt-8 border-t-2 border-blue-900">
          <div className="text-4xl font-bold text-blue-900">{currencySymbols[proposal.currency]}{proposal.budget.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

const ProposalElegantGold: React.FC<TemplateProps> = ({ proposal, userProfile, client, total }) => {
  if (!proposal) return <div></div>;
  return (
    <div className="bg-cream-50 text-slate-900 min-h-full p-[80px] flex flex-col" style={{ backgroundColor: '#faf8f3' }}>
      <div className="border-t-4 border-b-4 border-amber-700 py-8 mb-12 text-center">
        <h1 className="text-6xl font-bold text-amber-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>{proposal.title}</h1>
        <p className="text-base text-slate-600" style={{ fontFamily: "'Georgia', serif" }}>Proposal for {proposal.clientName}</p>
      </div>
      <div className="flex-1">
        <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap mb-12 italic" style={{ fontFamily: "'Georgia', serif" }}>{proposal.aiDraftContent || proposal.scope}</p>
        <div className="mt-12 pt-8 border-t-2 border-amber-700">
          <div className="text-4xl font-bold text-amber-900" style={{ fontFamily: "'Playfair Display', serif" }}>{currencySymbols[proposal.currency]}{proposal.budget.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

const ProposalTechModern: React.FC<TemplateProps> = ({ proposal, userProfile, client, total }) => {
  if (!proposal) return <div></div>;
  return (
    <div className="bg-white text-slate-900 min-h-full p-[80px] flex flex-col">
      <div className="mb-12">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">{proposal.title}</h1>
        <p className="text-base text-slate-500">Proposal for {proposal.clientName}</p>
      </div>
      <div className="flex-1 bg-slate-50 rounded-xl p-10">
        <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap mb-12">{proposal.aiDraftContent || proposal.scope}</p>
        <div className="mt-12 pt-8 border-t-2 border-slate-300">
          <div className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">{currencySymbols[proposal.currency]}{proposal.budget.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};
