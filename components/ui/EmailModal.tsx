import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Mail, Loader2, Edit2, Eye } from 'lucide-react';
import { Button } from './Primitives.tsx';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (emailData: { to: string; subject: string; body: string }) => Promise<void>;
  recipient: string;
  subject: string;
  body: string;
  invoiceId?: string;
  invoiceLink?: string;
}

const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  onSend,
  recipient: initialRecipient,
  subject: initialSubject,
  body: initialBody,
  invoiceId,
  invoiceLink
}) => {
  const [recipient, setRecipient] = useState(initialRecipient);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [isSending, setIsSending] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRecipient(initialRecipient);
      setSubject(initialSubject);
      setBody(initialBody);
      setError(null);
      setIsPreview(false);
    }
  }, [isOpen, initialRecipient, initialSubject, initialBody]);

  const handleSend = async () => {
    if (!recipient || !subject || !body) {
      setError('Please fill in all required fields');
      return;
    }

    if (!recipient.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      await onSend({ to: recipient, subject, body });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[20000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-pop-in">
        {/* Header */}
        <header className="p-6 border-b border-[var(--border-ui)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
              <Mail size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase text-[var(--text-primary)] tracking-tight">
                Dispatch Email
              </h3>
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-1">
                {invoiceId ? `Invoice: ${invoiceId}` : 'Compose Email'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-ui)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scroll p-6 bg-[var(--bg-canvas)]">
          {isPreview ? (
            // Email Preview
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-[var(--border-ui)]">
              {/* Email Header Preview */}
              <div className="bg-slate-50 border-b border-[var(--border-ui)] p-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">FROM</p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">CreaftlyAI Node System</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">TO</p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{recipient}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">SUBJECT</p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{subject}</p>
                  </div>
                </div>
              </div>

              {/* Email Body Preview */}
              <div className="p-8 bg-white">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-[var(--text-primary)] leading-relaxed">
                    {body}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            // Email Compose Form
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Recipient */}
              <div>
                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  TO <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full h-12 px-4 bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-xl text-sm font-bold outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  disabled={isSending}
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  SUBJECT <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                  className="w-full h-12 px-4 bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-xl text-sm font-bold outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  disabled={isSending}
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  MESSAGE <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Enter your message..."
                  rows={12}
                  className="w-full px-4 py-4 bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-xl text-sm font-semibold outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none custom-scroll leading-relaxed"
                  disabled={isSending}
                />
                {invoiceLink && (
                  <p className="mt-2 text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                    Invoice link will be included automatically
                  </p>
                )}
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
              disabled={isSending || !recipient || !subject || !body}
              className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Send Email
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

export default EmailModal;
