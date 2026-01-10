import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, MessageSquare, Loader2, Edit2, Eye, ExternalLink } from 'lucide-react';
import { Button } from './Primitives.tsx';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (whatsappData: { phoneNumber: string; message: string }) => Promise<void>;
  phoneNumber: string;
  message: string;
  invoiceId?: string;
  invoiceLink?: string;
}

const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  onSend,
  phoneNumber: initialPhoneNumber,
  message: initialMessage,
  invoiceId,
  invoiceLink
}) => {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [message, setMessage] = useState(initialMessage);
  const [isSending, setIsSending] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPhoneNumber(initialPhoneNumber);
      setMessage(initialMessage);
      setError(null);
      setIsPreview(false);
    }
  }, [isOpen, initialPhoneNumber, initialMessage]);

  const handleSend = async () => {
    if (!phoneNumber || !message) {
      setError('Please fill in all required fields');
      return;
    }

    // Basic phone validation
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      await onSend({ phoneNumber, message });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send WhatsApp message');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const cleanPhoneForLink = phoneNumber.replace(/[^\d]/g, '');
  const whatsappLink = `https://wa.me/${cleanPhoneForLink}?text=${encodeURIComponent(message)}`;

  return createPortal(
    <div className="fixed inset-0 z-[20000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-pop-in">
        {/* Header */}
        <header className="p-6 border-b border-[var(--border-ui)] flex items-center justify-between shrink-0 bg-gradient-to-r from-emerald-600 to-emerald-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm text-white flex items-center justify-center shadow-lg border border-white/30">
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase text-white tracking-tight">
                WhatsApp Dispatch
              </h3>
              <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider mt-1">
                {invoiceId ? `Invoice: ${invoiceId}` : 'Send WhatsApp Message'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scroll p-6 bg-gradient-to-b from-emerald-50/50 to-white">
          {isPreview ? (
            // WhatsApp Preview
            <div className="max-w-2xl mx-auto space-y-4">
              {/* WhatsApp Chat Preview */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-emerald-200">
                <div className="bg-emerald-600 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageSquare size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{phoneNumber || 'Recipient'}</p>
                    <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">WhatsApp</p>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {/* Message bubbles */}
                  <div className="flex flex-col gap-2">
                    <div className="bg-emerald-100 rounded-2xl rounded-tl-none p-4 max-w-[80%] ml-auto">
                      <p className="text-sm font-semibold text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {message}
                      </p>
                      <p className="text-[9px] font-bold text-slate-500 mt-2 text-right">Now</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp Web Link */}
              <div className="bg-white/80 backdrop-blur-sm border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      WhatsApp Web Link
                    </p>
                    <p className="text-xs font-bold text-slate-700 break-all">
                      {whatsappLink}
                    </p>
                  </div>
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-all shrink-0"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            // WhatsApp Compose Form
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Phone Number */}
              <div>
                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  PHONE NUMBER <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890 or 1234567890"
                  className="w-full h-12 px-4 bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-xl text-sm font-bold outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  disabled={isSending}
                />
                <p className="mt-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  Include country code (e.g., +971 for UAE, +1 for US)
                </p>
              </div>

              {/* Message */}
              <div>
                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  MESSAGE <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your WhatsApp message..."
                  rows={12}
                  className="w-full px-4 py-4 bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-xl text-sm font-semibold outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none custom-scroll leading-relaxed"
                  disabled={isSending}
                />
                {invoiceLink && (
                  <p className="mt-2 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                    Invoice link will be included in message
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2 text-[9px] font-bold text-slate-500">
                  <MessageSquare size={12} />
                  <span>Character count: {message.length}</span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  <p className="text-sm font-bold text-rose-500">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="p-6 border-t border-[var(--border-ui)] bg-[var(--bg-card)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="h-11 px-5 bg-[var(--bg-canvas)] border border-[var(--border-ui)] rounded-xl text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center gap-2"
            >
              {isPreview ? <Edit2 size={14} /> : <Eye size={14} />}
              {isPreview ? 'Edit' : 'Preview'}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isSending}
              className="h-11 px-6 bg-[var(--bg-canvas)] border border-[var(--border-ui)] rounded-xl text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !phoneNumber || !message}
              className="h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Send via WhatsApp
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
};

export default WhatsAppModal;
