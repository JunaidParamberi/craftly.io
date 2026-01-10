import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Download, FileText, Loader2, Share2, Globe } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../services/firebase.ts';
import { Invoice, InvoiceTemplate } from '../types.ts';
import { renderInvoiceTemplate } from '../utils/pdfTemplates.tsx';

const PublicInvoiceViewer: React.FC = () => {
  const params = useParams<{ publicToken: string }>();
  const publicToken = params.publicToken;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!publicToken) {
        setError('Invalid link');
        setLoading(false);
        return;
      }

      try {
        // Query invoices collection by publicToken field
        // Note: Firestore rules allow public read if isPublic == true
        // We query with both conditions to ensure we only get public invoices
        const invoicesRef = collection(db, 'invoices');
        const q = query(
          invoicesRef, 
          where('publicToken', '==', publicToken),
          where('isPublic', '==', true),
          limit(1) // Only need one result
        );
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setError('Invoice not found or link expired. The invoice may not be publicly accessible.');
          setLoading(false);
          return;
        }

        // Get the first matching invoice
        const invoiceDoc = querySnapshot.docs[0];
        const invoiceData = { ...invoiceDoc.data(), id: invoiceDoc.id } as Invoice;
        
        // Double-check it's a public invoice (security check)
        if (!invoiceData.isPublic || invoiceData.publicToken !== publicToken) {
          setError('Invalid or expired link');
          setLoading(false);
          return;
        }
        
        setInvoice(invoiceData);

        // For public viewing, we don't fetch user profile (requires auth)
        // Instead, use invoice data directly or create minimal profile for rendering
        // The invoice template can handle minimal profile data
        
        // Create minimal client object from invoice data
        setClient({
          name: invoiceData.clientId,
          email: invoiceData.clientEmail
        });

      } catch (err: any) {
        console.error('Error fetching invoice:', err);
        setError(err.message || 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [publicToken]);

  const total = useMemo(() => 
    (invoice?.productList ?? []).reduce((a, b) => a + ((b.price ?? 0) * (b.quantity ?? 1)), 0), 
  [invoice]);

  // Override body styles to enable scrolling for public invoice viewer
  // This must be called before any conditional returns (React hooks rule)
  useEffect(() => {
    // Save original body styles
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalHeight = document.body.style.height;
    const originalWidth = document.body.style.width;
    const originalTop = document.body.style.top;
    const originalLeft = document.body.style.left;

    // Enable scrolling for public invoice viewer
    document.body.style.overflow = 'auto';
    document.body.style.position = 'relative';
    document.body.style.height = 'auto';
    document.body.style.width = '100%';
    document.body.style.top = 'auto';
    document.body.style.left = 'auto';

    // Cleanup: restore original styles when component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.height = originalHeight;
      document.body.style.width = originalWidth;
      document.body.style.top = originalTop;
      document.body.style.left = originalLeft;
    };
  }, []);

  const handleDownloadPdf = async () => {
    if (!pdfRef.current || !invoice) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(pdfRef.current, { 
        scale: 2, 
        useCORS: true, 
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, (canvas.height * 210) / canvas.width);
      pdf.save(`${invoice.id}.pdf`);
    } catch (e) { 
      console.error('PDF generation error:', e);
      alert('Failed to generate PDF. Please try again.');
    } finally { 
      setIsExporting(false); 
    }
  };

  const handleCopyLink = async () => {
    const currentUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy link:', e);
    }
  };

  const selectedTemplate: InvoiceTemplate = invoice?.templateType || 'Swiss_Clean';
  
  // Create minimal user profile for public viewing (can't fetch from Firestore without auth)
  // In production, you might want to store minimal branding info in invoice when making it public
  const minimalUserProfile: any = userProfile || {
    companyName: 'Company',
    fullName: 'Authorized Signatory',
    title: 'OPERATIVE',
    email: '',
    branding: {
      logoUrl: undefined,
      address: '',
      trn: '',
      bankDetails: '',
      signatureUrl: undefined,
      primaryColor: '#6366F1',
      country: 'UAE',
      isTaxRegistered: false
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Loading Invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md">
          <FileText className="w-16 h-16 text-rose-500 mx-auto opacity-50" />
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--text-primary)] mb-2">
              Invoice Not Found
            </h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              {error || 'The invoice you are looking for does not exist or the link has expired.'}
            </p>
          </div>
          <button
            onClick={() => {
              // Redirect to app subdomain home page
              const baseUrl = window.location.origin.includes('app.craftlyai.app') 
                ? window.location.origin 
                : 'https://app.craftlyai.app';
              window.location.href = `${baseUrl}/#/`;
            }}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-wider hover:bg-indigo-700 transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col" style={{ position: 'relative', height: 'auto', overflow: 'visible' }}>
      {/* Header - Fixed at top */}
      <header className="bg-white border-b border-slate-200 p-4 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg flex-shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight text-slate-900">
                {invoice.type} {invoice.id}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Globe size={12} className="text-emerald-500" />
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                  Public View - Anyone with this link can access
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleCopyLink}
              className="h-10 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-700 transition-all flex items-center gap-2"
            >
              <Share2 size={14} />
              {copied ? 'Copied!' : 'Share Link'}
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download size={14} />
                  Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Invoice Preview - Scrollable */}
      <div className="flex-1 bg-slate-200/50 py-10 px-4" style={{ minHeight: 'calc(100vh - 200px)', overflow: 'visible' }}>
        <div className="max-w-4xl mx-auto">
          <div ref={pdfRef} className="bg-white shadow-2xl rounded-2xl overflow-hidden" style={{ width: '100%', maxWidth: '794px', minHeight: '1123px', margin: '0 auto' }}>
            {renderInvoiceTemplate(selectedTemplate, {
              invoice,
              userProfile: minimalUserProfile,
              client: client || { name: invoice.clientId, email: invoice.clientEmail },
              total,
              isEditing: false
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 p-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            This is a public invoice view. Anyone with this link can access it.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicInvoiceViewer;
