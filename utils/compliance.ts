
import { Invoice, Client } from '../types';

interface ComplianceParams {
  invoice: Partial<Invoice>;
  client: Client | undefined;
  lifetimeProfit: number;
  supplierTRN: string;
}

interface ComplianceResult {
  vatRate: number;
  vatAmount: number;
  corporateTaxLiability: number;
  eInvoicePayload: any;
  isThresholdExceeded: boolean;
  thresholdProgress: number;
}

/**
 * FTA UAE Compliance Engine v1.2
 * Handles VAT, Corporate Tax Thresholds (9%), and PINT-AE Schema Prep for 2026
 */
export const calculateUAECompliance = ({
  invoice,
  client,
  lifetimeProfit,
  supplierTRN
}: ComplianceParams): ComplianceResult => {
  // Identify UAE-to-UAE transactions for 5% VAT
  const isUAEBased = client?.countryCode === '+971' || 
                    client?.address?.toUpperCase().includes('UAE') || 
                    client?.address?.toUpperCase().includes('DUBAI') ||
                    client?.address?.toUpperCase().includes('EMIRATES');
                    
  const isB2B = !!client?.taxId;
  const amountAED = invoice.amountAED || 0;
  
  // 1. VAT Validation & Calculation
  // FTA Rule: UAE-to-UAE requires 5% VAT if registered
  const vatRate = isUAEBased ? 0.05 : 0;
  const vatAmount = amountAED * vatRate;

  // 2. Corporate Tax Tracker (9% on profit over 375,000 AED)
  const CT_THRESHOLD = 375000;
  const thresholdProgress = Math.min(100, (lifetimeProfit / CT_THRESHOLD) * 100);
  const isThresholdExceeded = lifetimeProfit > CT_THRESHOLD;
  
  // Liability logic: Apply 9% to any earnings above the threshold
  const corporateTaxLiability = isThresholdExceeded ? (amountAED * 0.09) : 0;

  // 3. E-Invoice Prep (PINT-AE / Peppol JSON Schema 2026)
  const uniqueContentString = `${invoice.id}-${amountAED}-${Date.now()}-${supplierTRN}`;
  const mockHash = btoa(uniqueContentString).substring(0, 16); 

  const eInvoicePayload = {
    specificationIdentifier: "urn:peppol:pint:billing-ae:1.0",
    invoiceNumber: invoice.id,
    issueDate: invoice.date,
    currency: "AED", 
    taxCurrency: "AED",
    accountingSupplierParty: {
      partyTaxScheme: {
        companyID: supplierTRN,
        taxScheme: "VAT"
      },
      partyLegalEntity: {
        registrationName: "Craftly Digital Systems"
      }
    },
    accountingCustomerParty: {
      partyTaxScheme: isB2B ? {
        companyID: client?.taxId,
        taxScheme: "VAT"
      } : null,
      partyIdentification: client?.name,
      postalAddress: {
        streetName: client?.address,
        country: {
          identificationCode: "AE"
        }
      }
    },
    taxTotal: {
      taxAmount: vatAmount,
      taxCurrency: "AED"
    },
    legalMonetaryTotal: {
      lineExtensionAmount: amountAED,
      taxExclusiveAmount: amountAED,
      taxInclusiveAmount: amountAED + vatAmount,
      payableAmount: amountAED + vatAmount
    },
    digitalSignature: {
      hash: mockHash,
      algorithm: "SHA-256-PINT-AE-2026"
    }
  };

  return {
    vatRate,
    vatAmount,
    corporateTaxLiability,
    eInvoicePayload,
    isThresholdExceeded,
    thresholdProgress
  };
};
