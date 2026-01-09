import { onCall, HttpsError } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const functionOptions = {
  region: "us-central1",
  cors: true,
  maxInstances: 10,
  secrets: ["SMTP_USER", "SMTP_PASS"]
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
              <div style="color: #ffffff; font-size: 10px; font-weight: 900; letter-spacing: 0.4em; text-transform: uppercase;">Craftly Node System</div>
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
  if (!request.auth) throw new HttpsError("unauthenticated", "Auth required.");
  const { companyId } = request.data;
  await admin.auth().setCustomUserClaims(request.auth.uid, { role: 'owner', companyId });
  await db.collection("users").doc(request.auth.uid).set({
    ...request.data,
    id: request.auth.uid,
    role: 'OWNER',
    permissions: ['MANAGE_CLIENTS', 'MANAGE_PROJECTS', 'MANAGE_FINANCE', 'MANAGE_EXPENSES', 'MANAGE_CATALOG', 'MANAGE_PROVISIONING', 'ACCESS_AI'],
    onboarded: true,
    status: 'ONLINE'
  });
  return { success: true };
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
  const joinLink = `https://craftly.app/#/join?token=${inviteToken}`;
  let emailSent = false;

  if (transporter) {
    try {
      const htmlContent = getTerminalTemplate({
        title: "Initialize Secure Handshake",
        body: `An authorization packet has been generated for you to join the <strong>${companyName}</strong> strategic node on Craftly.<br/><br/><strong>Security Clearance:</strong> ${role}<br/><strong>Registry Target:</strong> ${email}`,
        actionLink: joinLink,
        actionLabel: "Synchronize Identity",
        footerNote: "This handshake expires in 24 hours for security purposes."
      });

      await transporter.sendMail({
        from: `"Craftly Node System" <${process.env.SMTP_USER}>`,
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
