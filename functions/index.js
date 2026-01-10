import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// For Firebase Functions v2, onCall functions automatically handle CORS
// No need to set cors option for onCall functions

// Base function options with required secrets only
const functionOptions = {
  region: "us-central1",
  maxInstances: 10,
  secrets: ["SMTP_USER", "SMTP_PASS"] // Only required secrets - Twilio secrets are optional
};

/**
 * Terminal Style Email Template Generator
 * Designed for ERP-grade professional communication
 */
const getTerminalTemplate = ({ title, body, actionLink, actionLabel, footerNote }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding-bottom: 40px; }
        .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .header { background-color: #4f46e5; padding: 40px 20px; text-align: center; }
        .logo-box { width: 48px; height: 48px; background-color: #ffffff; border-radius: 12px; display: inline-block; margin-bottom: 16px; position: relative; }
        .zap-icon { color: #4f46e5; font-size: 24px; font-weight: 900; line-height: 48px; }
        .content { padding: 48px 40px; }
        .title { font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em; color: #0f172a; margin: 0 0 24px 0; line-height: 1.2; }
        .body-text { font-size: 16px; line-height: 1.6; color: #64748b; margin: 0 0 32px 0; }
        .button { display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; font-size: 14px; font-weight: 800; text-decoration: none; text-transform: uppercase; letter-spacing: 0.1em; }
        .footer { padding: 32px 40px; text-align: center; background-color: #f1f5f9; }
        .footer-text { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.2em; margin: 0; }
        .badge { display: inline-block; padding: 4px 12px; background-color: #e0e7ff; color: #4338ca; border-radius: 9999px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 12px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <table class="main" width="100%">
          <tr>
            <td class="header">
              <div class="logo-box"><span class="zap-icon">Z</span></div>
              <div style="color: #ffffff; font-size: 10px; font-weight: 900; letter-spacing: 0.4em; text-transform: uppercase;">CreaftlyAI Node System</div>
            </td>
          </tr>
          <tr>
            <td class="content">
              <h1 class="title">${title}</h1>
              <div class="body-text">${body}</div>
              <div style="text-align: center;">
                <a href="${actionLink}" class="button">${actionLabel}</a>
              </div>
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p class="footer-text">Secure Protocol Sync Handshake</p>
              <div class="badge">Distributed Cloud Infrastructure 01</div>
              ${footerNote ? `<p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">${footerNote}</p>` : ''}
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;
};

const getTransporter = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
};

const verifyAdminAccess = async (auth) => {
  if (!auth) return false;
  const userSnap = await db.collection("users").doc(auth.uid).get();
  const userData = userSnap.data();
  if (!userData) return false;
  const dbRole = (userData.role || '').toUpperCase();
  return dbRole === 'SUPER_ADMIN' || dbRole === 'OWNER';
};

export const initializeTenant = onCall(functionOptions, async (request) => {
  // 1. Auth Guard
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Node access denied: Authentication required.");
  }

  const { companyId, fullName, title, companyName, currency, branding } = request.data;

  // 2. Data Validation (Prevents crashes from missing data)
  if (!companyId || !companyName) {
    throw new HttpsError("invalid-argument", "Matrix error: Missing enterprise identity parameters.");
  }

  try {
    // 3. Set Custom Claims (Wait for this to complete)
    await admin.auth().setCustomUserClaims(request.auth.uid, { 
      role: 'owner', 
      companyId: companyId 
    });

    // 4. Create User Document
    await db.collection("users").doc(request.auth.uid).set({
      id: request.auth.uid,
      fullName: fullName || '',
      title: title || '',
      companyName: companyName,
      companyId: companyId,
      currency: currency || 'AED',
      branding: branding || {},
      role: 'OWNER',
      permissions: [
        'MANAGE_CLIENTS', 'MANAGE_PROJECTS', 'MANAGE_FINANCE', 
        'MANAGE_EXPENSES', 'MANAGE_CATALOG', 'MANAGE_PROVISIONING', 
        'ACCESS_AI', 'MANAGE_CAMPAIGNS'
      ],
      onboarded: true,
      status: 'ONLINE',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: "Node initialized successfully." };
  } catch (error) {
    console.error("Initialization Sync Error:", error);
    // Convert generic error to a structured HttpsError to avoid 500 status
    throw new HttpsError("internal", error.message || "Protocol failure during node initialization.");
  }
});

export const sendInviteEmail = onCall(functionOptions, async (request) => {
  if (!(await verifyAdminAccess(request.auth))) throw new HttpsError("permission-denied", "Admin only.");
  const { email, role, permissions, companyId, companyName } = request.data;
  
  const inviteToken = uuidv4();
  await db.collection("pending_invites").doc(inviteToken).set({
    email, role, permissions, companyId, token: inviteToken, status: "PENDING", companyName,
    expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 86400000))
  });

  const transporter = getTransporter();
  const joinLink = `https://app.craftlyai.app/#/join?token=${inviteToken}`;
  let emailSent = false;

  if (transporter) {
    try {
      const htmlContent = getTerminalTemplate({
        title: "Initialize Secure Handshake",
        body: `An authorization packet has been generated for you to join the <strong>${companyName}</strong> strategic node on CreaftlyAI.<br/><br/><strong>Security Clearance:</strong> ${role}<br/><strong>Registry Target:</strong> ${email}`,
        actionLink: joinLink,
        actionLabel: "Synchronize Identity",
        footerNote: "This handshake expires in 24 hours for security purposes."
      });

      await transporter.sendMail({
        from: `"CreaftlyAI Node System" <${process.env.SMTP_USER || 'no-reply@craftlyai.app'}>`,
        to: email,
        subject: `[ACTION REQUIRED] Identity Sync Protocol for ${companyName}`,
        html: htmlContent
      });
      emailSent = true;
    } catch (e) {
      console.error("Mail transmission error", e);
    }
  }

  return { success: true, emailSent, joinLink };
});

export const createUser = onCall(functionOptions, async (request) => {
  if (!(await verifyAdminAccess(request.auth))) throw new HttpsError("permission-denied", "Unauthorized.");
  const { email, password, fullName, title, companyId, role, permissions } = request.data;
  const userRecord = await admin.auth().createUser({ email, password, displayName: fullName });
  await admin.auth().setCustomUserClaims(userRecord.uid, { role: role.toLowerCase(), companyId });
  await db.collection("users").doc(userRecord.uid).set({
    id: userRecord.uid, email, fullName, title: title || 'OPERATIVE', role: role.toUpperCase(), permissions: permissions || [], companyId, onboarded: true, status: 'OFFLINE',
    branding: { address: '', trn: '', bankDetails: '', primaryColor: '#6366F1', country: 'UAE', isTaxRegistered: false }
  });
  return { success: true, uid: userRecord.uid };
});

export const updateUser = onCall(functionOptions, async (request) => {
  if (!(await verifyAdminAccess(request.auth))) throw new HttpsError("permission-denied", "Unauthorized.");
  const { uid, fullName, title, role, permissions, password } = request.data;
  if (!uid) throw new HttpsError("invalid-argument", "UID required.");

  const authUpdates = {};
  if (fullName) authUpdates.displayName = fullName;
  if (password) authUpdates.password = password;

  if (Object.keys(authUpdates).length > 0) {
    await admin.auth().updateUser(uid, authUpdates);
  }

  const firestoreUpdates = {};
  if (fullName) firestoreUpdates.fullName = fullName.toUpperCase();
  if (title) firestoreUpdates.title = title.toUpperCase();
  if (permissions) firestoreUpdates.permissions = permissions;
  if (role) {
    firestoreUpdates.role = role.toUpperCase();
    const user = await admin.auth().getUser(uid);
    const companyId = user.customClaims?.companyId;
    await admin.auth().setCustomUserClaims(uid, { role: role.toLowerCase(), companyId });
  }

  if (Object.keys(firestoreUpdates).length > 0) {
    await db.collection("users").doc(uid).update(firestoreUpdates);
  }

  return { success: true };
});

export const completeSignup = onCall(functionOptions, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Auth required.");
  const { token, fullName } = request.data;
  const inviteRef = db.collection("pending_invites").doc(token);
  const inviteSnap = await inviteRef.get();
  if (!inviteSnap.exists) throw new HttpsError("not-found", "Invalid token.");
  
  const data = inviteSnap.data();
  await db.collection("users").doc(request.auth.uid).set({
    id: request.auth.uid, email: data.email, fullName, role: data.role, permissions: data.permissions || [], companyId: data.companyId, onboarded: true, status: 'ONLINE',
    branding: { address: '', trn: '', bankDetails: '', primaryColor: '#6366F1', country: 'UAE', isTaxRegistered: false }
  });
  await admin.auth().setCustomUserClaims(request.auth.uid, { role: data.role.toLowerCase(), companyId: data.companyId });
  await inviteRef.delete();
  return { success: true };
});

/**
 * Send Invoice Email with PDF Attachment
 */
export const sendInvoiceEmail = onCall(functionOptions, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required.");
  
  const { invoiceId, recipientEmail, pdfBase64, pdfFileName, invoiceLink, subject, body, senderEmail, senderName, publicToken } = request.data;
  
  if (!recipientEmail || !pdfBase64 || !pdfFileName) {
    throw new HttpsError("invalid-argument", "Missing required fields: recipientEmail, pdfBase64, pdfFileName");
  }

  const transporter = getTransporter();
  if (!transporter) {
    throw new HttpsError("failed-precondition", "Email service not configured. Please set SMTP credentials.");
  }

  try {
    // Get user's email from request data or fetch from Firestore
    let userEmail = senderEmail;
    let userName = senderName;
    
    if (!userEmail || !userName) {
      try {
        const userDoc = await db.collection("users").doc(request.auth.uid).get();
        const userData = userDoc.data();
        userEmail = userEmail || userData?.email || '';
        userName = userName || userData?.fullName || userData?.companyName || '';
      } catch (e) {
        console.warn("Could not fetch user data:", e);
      }
    }

    // For user-initiated emails (invoices, LPOs): Use user's email as "from"
    // SMTP must be configured to allow sending from user's email (same domain or "send as")
    const smtpEmail = process.env.SMTP_USER || 'no-reply@craftlyai.app';
    
    // Use user's email if available (for user-initiated emails)
    // Fallback to app domain email if user email not available
    const fromEmail = userEmail || smtpEmail || 'no-reply@craftlyai.app';
    const fromName = userName || 'CreaftlyAI User';
    
    // Note: If user's email is different domain, SMTP must support "send as" feature
    // Otherwise, emails will fail. Consider setting replyTo for different domains.
    
    // Convert base64 to buffer for attachment
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    const emailSubject = subject || `Invoice from ${userName || userEmail || fromEmail.split('@')[0]}`;
    const emailBody = body || `Please find attached invoice and viewing link:\n\n${invoiceLink || ''}`;

    const htmlContent = getTerminalTemplate({
      title: "Invoice Dispatch",
      body: emailBody.replace(/\n/g, '<br/>'),
      actionLink: invoiceLink || '#',
      actionLabel: "View Invoice",
      footerNote: "This is an automated dispatch from CreaftlyAI Node System."
    });

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: recipientEmail,
      subject: emailSubject,
      html: htmlContent,
      text: emailBody,
      attachments: [{
        filename: pdfFileName,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    };

    // If user has a different email than fromEmail (e.g., personal email), set replyTo
    // This allows recipients to reply directly to the user
    if (userEmail && userEmail !== fromEmail) {
      mailOptions.replyTo = userEmail;
    }

    await transporter.sendMail(mailOptions);

    // Update invoice status to 'Sent' and make it public if invoiceId provided
    if (invoiceId) {
      try {
        const invoiceRef = db.collection("invoices").doc(invoiceId);
        const invoiceDoc = await invoiceRef.get();
        const invoiceData = invoiceDoc.data();
        
        // Ensure invoice has publicToken and isPublic flag
        const updates = {
          status: 'Sent',
          sentAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Use the publicToken passed from client if provided (to ensure consistency with email link)
        // Otherwise, use existing token or generate a new one as fallback
        if (publicToken) {
          // Use the token from the email link to ensure it matches
          updates.publicToken = publicToken;
        } else if (!invoiceData?.publicToken) {
          // Generate public token only if not provided and doesn't exist
          const prefix = invoiceData?.type === 'LPO' ? 'lpo' : 'inv';
          updates.publicToken = `${prefix}-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
        }
        // If invoice already has a token and no token was passed, keep existing token
        
        // Mark as public if not already
        if (!invoiceData?.isPublic) {
          updates.isPublic = true;
        }
        
        await invoiceRef.update(updates);
        console.log(`Invoice ${invoiceId} updated with publicToken: ${updates.publicToken || invoiceData?.publicToken}, isPublic: true`);
      } catch (e) {
        console.error("Error updating invoice status:", e);
        // Don't throw - email was sent, this is just metadata update
      }
    }

    return { success: true, message: "Invoice email sent successfully" };
  } catch (error) {
    console.error("Email sending error:", error);
    throw new HttpsError("internal", error.message || "Failed to send invoice email");
  }
});

/**
 * Send Bulk Emails
 */
export const sendBulkEmails = onCall(functionOptions, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required.");
  
  const { recipients, subject, body, htmlBody, attachments, senderEmail, senderName } = request.data;
  
  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    throw new HttpsError("invalid-argument", "Recipients array is required");
  }

  if (!subject || !body) {
    throw new HttpsError("invalid-argument", "Subject and body are required");
  }

  const transporter = getTransporter();
  if (!transporter) {
    throw new HttpsError("failed-precondition", "Email service not configured");
  }

  // Get user's email from request data or fetch from Firestore
  let userEmail = senderEmail;
  let userName = senderName;
  
  if (!userEmail || !userName) {
    try {
      const userDoc = await db.collection("users").doc(request.auth.uid).get();
      const userData = userDoc.data();
      userEmail = userEmail || userData?.email || '';
      userName = userName || userData?.fullName || userData?.companyName || '';
    } catch (e) {
      console.warn("Could not fetch user data:", e);
    }
  }

  // For user-initiated emails (campaigns, bulk emails): Use user's email as "from"
  // SMTP must be configured to allow sending from user's email (same domain or "send as")
  const smtpEmail = process.env.SMTP_USER || 'hello@craftlyai.app';
  
  // Use user's email if available (for user-initiated emails)
  // Fallback to app domain email if user email not available
  const fromEmail = userEmail || smtpEmail || 'hello@craftlyai.app';
  const fromName = userName || 'CreaftlyAI User';
  
  // Note: If user's email is different domain, SMTP must support "send as" feature
  // Otherwise, emails will fail. Consider setting replyTo for different domains.

  const results = [];
  const errors = [];

  for (const recipient of recipients) {
    try {
      const emailBody = htmlBody || body.replace(/\n/g, '<br/>');
      const htmlContent = htmlBody || getTerminalTemplate({
        title: subject,
        body: emailBody,
        actionLink: '#',
        actionLabel: "View Details",
        footerNote: ""
      });

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: recipient.email || recipient,
        subject: subject,
        html: htmlContent,
        text: body,
      };

      // If user has a different email than fromEmail (e.g., personal email), set replyTo
      // This allows recipients to reply directly to the user
      if (userEmail && userEmail !== fromEmail) {
        mailOptions.replyTo = userEmail;
      }

      if (attachments && Array.isArray(attachments)) {
        mailOptions.attachments = attachments.map(att => ({
          filename: att.filename,
          content: Buffer.from(att.content, 'base64'),
          contentType: att.contentType || 'application/pdf'
        }));
      }

      await transporter.sendMail(mailOptions);
      results.push({ recipient: recipient.email || recipient, status: 'sent' });
    } catch (error) {
      console.error(`Error sending email to ${recipient.email || recipient}:`, error);
      errors.push({ recipient: recipient.email || recipient, error: error.message });
    }
  }

  return {
    success: true,
    sent: results.length,
    failed: errors.length,
    results,
    errors: errors.length > 0 ? errors : undefined
  };
});

/**
 * Send WhatsApp Message (using Twilio or similar)
 * Note: Twilio is optional - function will return WhatsApp web link if Twilio not configured
 * To enable Twilio, set these secrets: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER
 * Then redeploy with secrets included in functionOptions
 */
export const sendWhatsAppMessage = onCall(functionOptions, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required.");
  
  const { phoneNumber, message, invoiceId } = request.data;
  
  if (!phoneNumber || !message) {
    throw new HttpsError("invalid-argument", "Phone number and message are required");
  }

  // Clean phone number (remove non-digits except +)
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  
  // Twilio secrets are optional - if not configured, return WhatsApp web link
  // Note: To use Twilio, add these secrets to the secrets array and redeploy:
  // TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER;

  // Always return WhatsApp web link for now (Twilio integration requires secrets setup)
  // This allows the function to work without Twilio configuration
  const whatsappLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  
  // Update invoice status if provided
  if (invoiceId) {
    try {
      const invoiceRef = db.collection("invoices").doc(invoiceId);
      await invoiceRef.update({ 
        status: 'Sent', 
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        sentVia: 'WhatsApp'
      });
    } catch (e) {
      console.error("Error updating invoice status:", e);
    }
  }

  return {
    success: true,
    whatsappLink,
    message: "WhatsApp web link generated (Twilio not configured - use WhatsApp web link)"
  };
  
  /* Twilio Integration (commented out - uncomment when Twilio secrets are configured)
  if (twilioSid && twilioToken && twilioWhatsApp) {
    try {
      // Dynamic import for Twilio (requires: npm install twilio)
      let twilio;
      try {
        twilio = (await import('twilio')).default;
      } catch (importError) {
        console.warn('Twilio package not installed. Install with: npm install twilio');
        throw new Error('Twilio package not installed');
      }
      const client = twilio(twilioSid, twilioToken);

      const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
      
      const whatsappResponse = await client.messages.create({
        from: `whatsapp:${twilioWhatsApp}`,
        to: `whatsapp:${formattedPhone}`,
        body: message
      });

      if (invoiceId) {
        try {
          const invoiceRef = db.collection("invoices").doc(invoiceId);
          await invoiceRef.update({ 
            status: 'Sent', 
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            sentVia: 'WhatsApp'
          });
        } catch (e) {
          console.error("Error updating invoice status:", e);
        }
      }

      return { 
        success: true, 
        messageId: whatsappResponse.sid,
        message: "WhatsApp message sent successfully via Twilio"
      };
    } catch (error) {
      console.error("Twilio WhatsApp error:", error);
      // Fallback to web link on Twilio error
      return {
        success: true,
        whatsappLink,
        message: "Twilio error - using WhatsApp web link instead"
      };
    }
  }
  */
});

/**
 * Process Recurring Invoices - Scheduled Function
 * Runs daily at 9 AM UTC to check for recurring invoices due to be sent
 */
export const processRecurringInvoices = onSchedule(
  {
    schedule: "0 9 * * *", // 9 AM UTC daily
    timeZone: "UTC",
    region: "us-central1"
  },
  async (event) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      // Find all recurring invoices that are due today
      const invoicesSnapshot = await db.collection("invoices")
        .where("isReoccurring", "==", true)
        .where("status", "in", ["Sent", "Draft", "Paid"]) // Only process active/sent invoices
        .get();

      if (invoicesSnapshot.empty) {
        console.log("No recurring invoices found");
        return { processed: 0 };
      }

      let processed = 0;
      const errors = [];

      for (const doc of invoicesSnapshot.docs) {
        const invoice = doc.data();
        const recurringDate = invoice.reoccurrenceDate;

        if (!recurringDate || recurringDate !== todayStr) {
          continue; // Skip if not due today
        }

        try {
          // Create a new invoice based on the recurring one
          const newInvoiceId = `${invoice.type === 'LPO' ? 'LPO' : 'INV'}-${Math.floor(1000 + Math.random() * 9000)}`;
          
          // Calculate next recurring date based on frequency
          const nextDate = calculateNextRecurringDate(today, invoice.reoccurrenceFrequency || 'Monthly');
          
          const newInvoice = {
            ...invoice,
            id: newInvoiceId,
            date: todayStr,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
            status: 'Draft',
            reoccurrenceDate: nextDate,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            parentInvoiceId: invoice.id
          };

          // Remove the id field before saving (Firestore will use doc ID)
          const { id, ...invoiceData } = newInvoice;
          await db.collection("invoices").doc(newInvoiceId).set(invoiceData);

          // Update original invoice's next recurring date
          await doc.ref.update({
            reoccurrenceDate: nextDate,
            lastProcessedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          processed++;

          // Optionally auto-send the invoice if configured
          if (invoice.autoSend === true && invoice.clientEmail) {
            try {
              // Note: This would require PDF generation on the server side
              // For now, we'll just create the invoice and log it
              console.log(`Created recurring invoice ${newInvoiceId} for ${invoice.clientEmail}`);
            } catch (e) {
              console.error(`Error auto-sending invoice ${newInvoiceId}:`, e);
            }
          }
        } catch (error) {
          console.error(`Error processing recurring invoice ${doc.id}:`, error);
          errors.push({ invoiceId: doc.id, error: error.message });
        }
      }

      console.log(`Processed ${processed} recurring invoices`);
      return { processed, errors: errors.length > 0 ? errors : undefined };
    } catch (error) {
      console.error("Error in processRecurringInvoices:", error);
      throw error;
    }
  }
);

/**
 * Helper function to calculate next recurring date
 */
function calculateNextRecurringDate(fromDate, frequency) {
  const nextDate = new Date(fromDate);
  
  switch (frequency) {
    case 'Weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'Monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'Quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'Yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      nextDate.setMonth(nextDate.getMonth() + 1); // Default to monthly
  }
  
  return nextDate.toISOString().split('T')[0];
}