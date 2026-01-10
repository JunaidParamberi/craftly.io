# Branding Setup & Implementation Guide

**Version 1.0** | Complete Guide to Implementing CraftlyAI Branding

## Table of Contents
1. [Quick Setup](#quick-setup)
2. [Integrating Logos](#integrating-logos)
3. [Applying Brand Colors](#applying-brand-colors)
4. [Typography Setup](#typography-setup)
5. [Component Branding](#component-branding)
6. [User Branding System](#user-branding-system)
7. [Testing & Validation](#testing--validation)

---

## Quick Setup

### 1. Verify Logo Files
Ensure all logo files are in place:
```bash
ls -la public/branding/logo/
ls -la public/branding/icon/
```

### 2. Update Application Logo References
The application should use logos from the branding directory. Update any hardcoded logo paths:

**Before:**
```jsx
<img src="/craftly_logo.svg" alt="CraftlyAI" />
```

**After:**
```jsx
<img src="/branding/logo/craftly_logo.svg" alt="CraftlyAI" />
```

### 3. Configure Theme Colors
Update your theme context to use brand colors. See [Applying Brand Colors](#applying-brand-colors) section.

---

## Integrating Logos

### Navigation/Header Logo

Update `components/layout/Sidebar.tsx` or header component:

```tsx
import { useTheme } from '../context/ThemeContext';

const Sidebar = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  return (
    <div className="sidebar">
      <img 
        src={isDark 
          ? "/branding/logo/craftly_logo_white.svg" 
          : "/branding/logo/craftly_logo.svg"} 
        alt="CraftlyAI" 
        className="h-8" 
      />
    </div>
  );
};
```

### Auth Page Logo

Update `components/Auth.tsx`:

```tsx
const Auth = () => {
  return (
    <div className="auth-container">
      <img 
        src="/branding/logo/craftly_logo.svg" 
        alt="CraftlyAI" 
        className="h-10 mb-8" 
      />
      {/* Auth form */}
    </div>
  );
};
```

### Favicon Setup

Update `index.html`:

```html
<link rel="icon" type="image/svg+xml" href="/branding/icon/craftly_icon.svg" />
<link rel="alternate icon" href="/branding/icon/favicon-32.png" />
<link rel="apple-touch-icon" href="/branding/icon/apple-touch-icon.png" />
```

### Email Templates

Update email templates in `functions/index.js` to include logo:

```javascript
const getTerminalTemplate = ({ title, body, actionLink, actionLabel, footerNote }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        /* Email styles */
      </style>
    </head>
    <body>
      <div class="wrapper">
        <table class="main">
          <tr>
            <td class="header">
              <img src="https://app.craftlyai.app/branding/logo/craftly_logo_white.svg" 
                   alt="CraftlyAI" 
                   height="40" 
                   style="margin-bottom: 16px;" />
              <div style="color: #ffffff; font-size: 10px; font-weight: 900; letter-spacing: 0.4em; text-transform: uppercase;">
                CreaftlyAI Node System
              </div>
            </td>
          </tr>
          <!-- Email content -->
        </table>
      </div>
    </body>
    </html>
  `;
};
```

---

## Applying Brand Colors

### Theme Context Configuration

Update `context/ThemeContext.tsx` to use brand colors:

```tsx
// Brand color palette
const brandColors = {
  primary: {
    main: '#6366F1',      // Indigo 600
    dark: '#4F46E5',      // Indigo 700
    light: '#818CF8',     // Indigo 500
  },
  semantic: {
    success: '#10B981',   // Emerald 500
    warning: '#F59E0B',   // Amber 500
    error: '#EF4444',     // Rose 500
    info: '#0EA5E9',      // Sky 500
  },
};

// CSS Variables for theming
const lightTheme = {
  '--accent': brandColors.primary.main,
  '--accent-dark': brandColors.primary.dark,
  '--accent-light': brandColors.primary.light,
  '--success': brandColors.semantic.success,
  '--warning': brandColors.semantic.warning,
  '--error': brandColors.semantic.error,
  '--info': brandColors.semantic.info,
};
```

### Tailwind Configuration

Update `tailwind.config.js` (if using Tailwind):

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#6366F1',
          'primary-dark': '#4F46E5',
          'primary-light': '#818CF8',
        },
      },
    },
  },
};
```

### CSS Variables (Current Implementation)

The application uses CSS variables. Ensure these match brand colors in your global CSS:

```css
:root {
  --accent: #6366F1;           /* Primary brand color */
  --accent-hover: #4F46E5;     /* Primary dark for hover */
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  --info: #0EA5E9;
}

[data-theme="dark"] {
  --accent: #818CF8;           /* Lighter for dark mode */
  --accent-hover: #6366F1;
}
```

---

## Typography Setup

### Font Loading

Add Inter font to `index.html`:

```html
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
</head>
```

### Global Typography Styles

Add to your global CSS file:

```css
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Terminal-style uppercase labels */
.terminal-label {
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.3em;
}

/* Display headings */
.display-heading {
  font-family: 'Inter', sans-serif;
  font-size: 48px;
  font-weight: 900;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

/* Standard headings */
h1 {
  font-family: 'Inter', sans-serif;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1.2;
}
```

---

## Component Branding

### Button Components

Ensure buttons use brand colors:

```tsx
// Primary button
<button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-wider text-xs">
  Action
</button>

// Using CSS variables (preferred)
<button className="px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl font-black uppercase tracking-wider text-xs">
  Action
</button>
```

### Card Components

Use brand-consistent styling:

```tsx
<div className="bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-3xl p-10">
  {/* Card content */}
</div>
```

### Input Fields

Match brand styling:

```tsx
<input 
  className="h-14 bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-2xl px-6 focus:border-[var(--accent)] outline-none transition-all"
  type="text"
/>
```

---

## User Branding System

The application supports user-specific branding through the `UserBranding` interface. This allows each organization to customize:

### Branding Fields

```typescript
interface UserBranding {
  logoUrl?: string;              // Organization logo URL
  signatureUrl?: string;         // Digital signature image
  address: string;               // Business address
  trn: string;                   // Tax Registration Number
  bankDetails: string;           // Bank account details
  primaryColor: string;          // Custom primary color (defaults to brand color)
  campaignEmail?: string;        // Email for campaigns
  campaignPhone?: string;        // Phone for campaigns
  country: string;               // Country code
  isTaxRegistered: boolean;      // Tax registration status
  defaultInvoiceTemplate?: InvoiceTemplate;
  defaultProposalTemplate?: InvoiceTemplate;
}
```

### Implementing User Branding

#### 1. Logo Upload in Settings

The Settings component already supports logo upload. Ensure it saves to storage:

```tsx
const handleLogoUpload = async (file: File) => {
  // Upload to Firebase Storage
  const storageRef = ref(storage, `branding/${userProfile.id}/logo/${file.name}`);
  await uploadBytes(storageRef, file);
  const logoUrl = await getDownloadURL(storageRef);
  
  // Update user profile
  await handleBrandingChange('logoUrl', logoUrl);
};
```

#### 2. Using User Logo in Documents

When generating PDFs (invoices, proposals), use user's logo:

```tsx
// In pdfTemplates.tsx
const logoUrl = invoice.userProfile?.branding?.logoUrl || '/branding/logo/craftly_logo.svg';
<img src={logoUrl} alt={invoice.userProfile?.companyName || 'Company'} />
```

#### 3. Primary Color Customization

Allow users to set custom primary color (with validation):

```tsx
const handlePrimaryColorChange = (color: string) => {
  // Validate hex color
  if (/^#[0-9A-F]{6}$/i.test(color)) {
    handleBrandingChange('primaryColor', color);
  }
};

// Use in components
const primaryColor = userProfile?.branding?.primaryColor || '#6366F1';
<div style={{ borderColor: primaryColor }} />
```

### Branding in PDF Templates

Update PDF generation to use user branding:

```tsx
// In utils/pdfTemplates.tsx
export const renderInvoiceTemplate = (
  template: InvoiceTemplate,
  { invoice, userProfile, client, total }: InvoiceProps
) => {
  const branding = userProfile?.branding || {};
  const logoUrl = branding.logoUrl || '/branding/logo/craftly_logo.svg';
  const primaryColor = branding.primaryColor || '#6366F1';
  
  return (
    <div className="invoice-template">
      {/* Header with logo */}
      <div className="invoice-header">
        <img src={logoUrl} alt={userProfile?.companyName} className="invoice-logo" />
        {/* Company details */}
      </div>
      
      {/* Use primary color for accents */}
      <div style={{ color: primaryColor }}>
        {/* Invoice number, totals, etc. */}
      </div>
    </div>
  );
};
```

---

## Testing & Validation

### Logo Display Tests

1. **Light Mode**: Verify color logo displays correctly
2. **Dark Mode**: Verify white logo displays correctly
3. **Responsive**: Test logo scaling at different screen sizes
4. **Minimum Sizes**: Ensure logos meet minimum size requirements
5. **Clearance**: Verify proper spacing around logos

### Color Consistency Tests

1. **Primary Actions**: All primary CTAs use brand indigo
2. **Hover States**: Hover colors are appropriate (indigo-700)
3. **Dark Mode**: Colors are readable and accessible
4. **Contrast**: All text meets WCAG AA contrast ratios

### Typography Tests

1. **Font Loading**: Inter font loads correctly
2. **Hierarchy**: Heading sizes create clear hierarchy
3. **Readability**: Body text is readable (16px minimum)
4. **Terminal Labels**: Uppercase labels have proper tracking

### User Branding Tests

1. **Logo Upload**: Users can upload and see their logo
2. **Logo in PDFs**: User logos appear in generated documents
3. **Primary Color**: Custom colors apply correctly
4. **Fallbacks**: System defaults work when user branding missing

### Accessibility Tests

1. **Alt Text**: All logos have appropriate alt text
2. **Color Contrast**: Meet WCAG AA standards
3. **Keyboard Navigation**: All branded elements are accessible
4. **Screen Readers**: Logo purpose is clear to assistive tech

---

## Checklist

### Initial Setup
- [ ] Logo files placed in `/public/branding/`
- [ ] Logo references updated throughout application
- [ ] Favicon configured
- [ ] Brand colors added to theme
- [ ] Typography (Inter font) loaded
- [ ] CSS variables configured

### Component Updates
- [ ] Navigation/header uses correct logo version (light/dark)
- [ ] Auth pages display logo
- [ ] Buttons use brand colors
- [ ] Cards use brand styling
- [ ] Forms use brand styling

### User Branding
- [ ] Logo upload functional
- [ ] User logos display in settings
- [ ] User logos appear in PDFs
- [ ] Primary color customization works
- [ ] Fallbacks to system branding when needed

### Testing
- [ ] Light mode tested
- [ ] Dark mode tested
- [ ] Responsive design verified
- [ ] Accessibility validated
- [ ] Performance optimized (logo file sizes)

---

## Troubleshooting

### Logo Not Displaying
- Check file path is correct
- Verify file exists in public directory
- Check browser console for 404 errors
- Ensure SVG syntax is valid

### Colors Not Applied
- Verify CSS variables are defined
- Check theme context is providing values
- Ensure Tailwind config updated (if using)
- Clear browser cache

### Font Not Loading
- Verify Google Fonts link in HTML
- Check network tab for font requests
- Ensure font-family fallbacks are correct
- Test with system fonts as backup

### User Branding Issues
- Verify Firebase Storage permissions
- Check image upload size limits
- Ensure logoUrl is being saved to user profile
- Validate image URLs are accessible

---

## Additional Resources

- [Brand Guidelines](./BRAND_GUIDELINES.md) - Complete brand guidelines
- [Landing Page Guide](./LANDING_PAGE_GUIDE.md) - Landing page implementation
- [Branding Assets README](./public/branding/README.md) - Asset usage guide

---

**Need Help?** Contact the development team or refer to the main [Documentation](./DOCUMENTATION.md).
