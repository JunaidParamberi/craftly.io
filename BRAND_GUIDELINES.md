# CraftlyAI Brand Guidelines

**Version 1.0** | Last Updated: 2024

## Table of Contents
1. [Brand Overview](#brand-overview)
2. [Logo Usage](#logo-usage)
3. [Color Palette](#color-palette)
4. [Typography](#typography)
5. [Imagery & Photography](#imagery--photography)
6. [Voice & Tone](#voice--tone)
7. [Logo Files](#logo-files)
8. [Application Guidelines](#application-guidelines)

---

## Brand Overview

### Mission
CraftlyAI empowers independent consultants and freelancers in the UAE to streamline their business operations through intelligent automation and strategic management tools.

### Brand Personality
- **Professional**: Enterprise-grade reliability
- **Futuristic**: Cutting-edge AI technology
- **Efficient**: Streamlined workflows
- **Strategic**: Business-focused solutions
- **Premium**: High-quality experience

### Brand Values
1. **Innovation**: Leveraging AI to solve real business challenges
2. **Empowerment**: Enabling freelancers to scale their operations
3. **Precision**: Attention to detail in every interaction
4. **Trust**: Secure, reliable platform for business-critical operations

---

## Logo Usage

### Primary Logo
The CraftlyAI logo consists of the wordmark "CreaftlyAI" in uppercase, typically paired with a lightning bolt (⚡) icon representing energy and AI intelligence.

### Logo Variations

#### Horizontal Logo
- **Use**: Primary usage for headers, navigation bars, and horizontal layouts
- **Clearance**: Minimum 20px space around all sides
- **Minimum Size**: 120px width for digital, 1" for print

#### Stacked Logo
- **Use**: Square spaces, mobile headers, favicons
- **Clearance**: Minimum 15px space around all sides
- **Minimum Size**: 80px width/height for digital

#### Icon Only
- **Use**: App icons, favicons, social media profile pictures
- **Clearance**: Minimum 10px space around all sides
- **Minimum Size**: 32px × 32px (favicon), 1024px × 1024px (app icons)

### Logo Placement

**Do:**
- ✅ Use on white or light backgrounds with full color logo
- ✅ Use on dark backgrounds with white/light logo
- ✅ Maintain proper clearance space
- ✅ Scale proportionally

**Don't:**
- ❌ Rotate, skew, or distort the logo
- ❌ Use colors outside the brand palette
- ❌ Place on busy backgrounds without proper contrast
- ❌ Change the font or letter spacing
- ❌ Add effects (shadows, gradients, outlines) to the logo

### Logo Files Available

All logo files are located in `/public/branding/`:
- `craftly_logo.svg` - Vector logo (primary)
- `craftly_logo_highres.png` - High-resolution PNG (transparent background)
- `craftly_logo_white.svg` - White version for dark backgrounds
- `craftly_logo_white.png` - White PNG version
- `craftly_icon.svg` - Icon only (square)
- `craftly_icon.png` - Icon PNG (multiple sizes)
- `craftly_favicon.ico` - Favicon bundle

---

## Color Palette

### Primary Colors

#### Indigo 600 (Primary Brand Color)
- **Hex**: `#6366F1`
- **RGB**: `99, 102, 241`
- **Usage**: Primary CTAs, active states, brand highlights
- **Accessibility**: Meets WCAG AA contrast on white backgrounds

#### Indigo 700 (Primary Dark)
- **Hex**: `#4F46E5`
- **RGB**: `79, 70, 229`
- **Usage**: Hover states, emphasis, headers

#### Indigo 500 (Primary Light)
- **Hex**: `#818CF8`
- **RGB**: `129, 140, 248`
- **Usage**: Secondary actions, subtle highlights

### Neutral Colors

#### Dark Mode Canvas
- **Hex**: `#020617`
- **RGB**: `2, 6, 23`
- **Usage**: Dark theme background

#### Dark Mode Card
- **Hex**: `#0B1120`
- **RGB**: `11, 17, 32`
- **Usage**: Card backgrounds in dark mode

#### Light Mode Canvas
- **Hex**: `#FFFFFF`
- **RGB**: `255, 255, 255`
- **Usage**: Light theme background

#### Light Mode Card
- **Hex**: `#F8FAFC`
- **RGB**: `248, 250, 252`
- **Usage**: Card backgrounds in light mode

### Semantic Colors

#### Success (Emerald)
- **Primary**: `#10B981` (Emerald 500)
- **Light**: `#34D399` (Emerald 400)
- **Dark**: `#059669` (Emerald 600)
- **Usage**: Success states, positive actions, completed tasks

#### Warning (Amber)
- **Primary**: `#F59E0B` (Amber 500)
- **Light**: `#FBBF24` (Amber 400)
- **Dark**: `#D97706` (Amber 600)
- **Usage**: Warnings, pending states, attention required

#### Error (Rose)
- **Primary**: `#EF4444` (Rose 500)
- **Light**: `#F87171` (Rose 400)
- **Dark**: `#DC2626` (Rose 600)
- **Usage**: Errors, destructive actions, critical alerts

#### Info (Sky)
- **Primary**: `#0EA5E9` (Sky 500)
- **Light**: `#38BDF8` (Sky 400)
- **Dark**: `#0284C7` (Sky 600)
- **Usage**: Informational messages, links, notifications

### Color Usage Guidelines

**Accessibility Requirements:**
- Text on backgrounds must meet WCAG AA contrast (4.5:1 for normal text, 3:1 for large text)
- Interactive elements must have 3:1 contrast ratio
- Use color contrast checkers to verify compliance

**Color Application:**
- Use primary indigo for main CTAs and primary actions
- Use semantic colors consistently (green = success, red = error)
- Maintain sufficient contrast between text and backgrounds
- Test in both light and dark modes

---

## Typography

### Primary Typeface
**Inter** - Modern, clean, professional sans-serif

### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Type Scale

#### Display (Large Headings)
- **Size**: 48px - 64px
- **Weight**: 900 (Black)
- **Line Height**: 1.1
- **Letter Spacing**: -0.02em
- **Usage**: Hero headlines, landing page titles

#### Heading 1
- **Size**: 32px - 40px
- **Weight**: 800 (Extra Bold)
- **Line Height**: 1.2
- **Letter Spacing**: -0.01em
- **Usage**: Page titles, section headers

#### Heading 2
- **Size**: 24px - 32px
- **Weight**: 800 (Extra Bold)
- **Line Height**: 1.3
- **Letter Spacing**: 0
- **Usage**: Subsection headers, card titles

#### Heading 3
- **Size**: 20px - 24px
- **Weight**: 700 (Bold)
- **Line Height**: 1.4
- **Letter Spacing**: 0
- **Usage**: Component titles, form labels

#### Body Large
- **Size**: 18px
- **Weight**: 400 (Regular)
- **Line Height**: 1.6
- **Usage**: Lead paragraphs, important content

#### Body Regular
- **Size**: 16px
- **Weight**: 400 (Regular)
- **Line Height**: 1.6
- **Usage**: Standard body text, descriptions

#### Body Small
- **Size**: 14px
- **Weight**: 400 (Regular)
- **Line Height**: 1.5
- **Usage**: Secondary text, captions

#### Label/Uppercase
- **Size**: 10px - 12px
- **Weight**: 700 - 900 (Bold to Black)
- **Line Height**: 1.4
- **Letter Spacing**: 0.1em - 0.4em (tracking-widest)
- **Text Transform**: Uppercase
- **Usage**: Labels, badges, navigation items, terminal-style UI elements

### Typography Guidelines

**Hierarchy:**
- Use font size and weight to establish clear visual hierarchy
- Limit to 2-3 font sizes per section
- Maintain consistent spacing between headings and body text

**Readability:**
- Minimum 14px for body text (16px recommended)
- Line height should be 1.5-1.6 for body text
- Limit line length to 65-75 characters for optimal readability

**Terminal-Style UI:**
- The application uses uppercase labels with wide letter spacing for a terminal/command-line aesthetic
- Use sparingly for system-level UI elements
- Maintain consistency in tracking values

---

## Imagery & Photography

### Image Style
- **Clean and Minimal**: Avoid cluttered or busy images
- **Professional**: High-quality, business-focused imagery
- **Modern**: Contemporary, tech-forward aesthetic
- **Neutral Backgrounds**: Allow content to stand out

### Illustration Style
- **Geometric**: Clean lines, simple shapes
- **Monochromatic or Two-Tone**: Primarily using brand colors
- **Technical**: Data visualizations, charts, diagrams
- **Abstract**: Represent concepts rather than literal representations

### Photography Guidelines
- Use professional stock photography when needed
- Prioritize images with good contrast and clear subjects
- Ensure images are high-resolution (minimum 2x for retina displays)
- Optimize images for web (WebP format preferred)

### Icon Usage
- **Library**: Lucide React Icons (primary)
- **Style**: Line icons, 1.5-2px stroke width
- **Size**: Consistent sizing (16px, 20px, 24px, 32px)
- **Color**: Use brand colors or inherit from parent element

---

## Voice & Tone

### Voice Characteristics
- **Professional yet Approachable**: Enterprise-grade without being intimidating
- **Confident**: Assured in our capabilities and solutions
- **Efficient**: Direct, no-nonsense communication
- **Strategic**: Business-focused language

### Tone Variations

#### Documentation & Help Content
- Clear and instructional
- Step-by-step guidance
- Technical accuracy
- Examples and use cases

#### Marketing & Landing Pages
- Compelling and benefit-focused
- Action-oriented
- Premium positioning
- Clear value propositions

#### Application UI
- Concise and actionable
- Terminal/command-line aesthetic
- System-level precision
- Minimal but informative

### Writing Guidelines

**Do:**
- ✅ Use active voice
- ✅ Be specific and concrete
- ✅ Use business terminology appropriately
- ✅ Keep sentences concise
- ✅ Use bullet points for lists

**Don't:**
- ❌ Use jargon without explanation
- ❌ Be overly casual or informal
- ❌ Use passive voice unnecessarily
- ❌ Write overly long paragraphs
- ❌ Use exclamation points excessively

### Key Phrases
- "Strategic Node" - Company/Organization
- "Registry" - User account/profile
- "Terminal" - Application interface
- "Sync/Synchronize" - Save/Update operations
- "Dispatch" - Send/Submit actions
- "Operative" - User/Team member

---

## Application Guidelines

### UI Component Styling

#### Buttons
- **Primary**: Indigo 600 background, white text, rounded-xl (12px)
- **Secondary**: Transparent with border, inherit text color
- **Size**: Height 44px (h-11) for primary actions, 40px (h-10) for secondary
- **Typography**: Uppercase, tracking-widest, font-black, 10-11px

#### Cards
- **Background**: var(--bg-card) in theme
- **Border**: 1px solid var(--border-ui)
- **Border Radius**: rounded-3xl (24px) for main cards, rounded-2xl (16px) for smaller elements
- **Padding**: p-10 (40px) for main cards, p-6 (24px) for compact cards

#### Input Fields
- **Height**: h-14 (56px) for primary inputs, h-12 (48px) for secondary
- **Border**: 1px solid var(--border-ui)
- **Border Radius**: rounded-2xl (16px)
- **Background**: var(--input-bg) or var(--bg-card-muted)
- **Focus**: Border color changes to var(--accent)

### Dark Mode Considerations
- Ensure all colors work in both light and dark modes
- Use CSS variables for theme-aware colors
- Test contrast in both modes
- Provide sufficient visual feedback for interactive elements

### Animation & Transitions
- **Duration**: 150-300ms for UI interactions
- **Easing**: ease-out or ease-in-out
- **Hover States**: Subtle scale (1.01-1.02) or background color change
- **Loading States**: Use spinner (Loader2 icon) with animation

### Spacing System
- Based on 4px base unit
- Common spacing: 4px, 8px, 12px, 16px, 24px, 32px, 40px, 48px, 64px
- Use Tailwind spacing utilities consistently

---

## Logo Files

### File Formats & Use Cases

#### SVG (Scalable Vector Graphics)
- **Best for**: Web usage, scaling to any size, crisp rendering
- **Files**: `craftly_logo.svg`, `craftly_logo_white.svg`, `craftly_icon.svg`
- **Usage**: Web headers, responsive layouts, print at any size

#### PNG (Portable Network Graphics)
- **Best for**: Transparent backgrounds, specific sizes, compatibility
- **Files**: `craftly_logo_highres.png`, `craftly_logo_white.png`, various icon sizes
- **Usage**: Email signatures, documents, presentations, social media

#### ICO (Icon)
- **Best for**: Favicons, browser tabs
- **File**: `craftly_favicon.ico`
- **Usage**: Browser favicon (16x16, 32x32, 48x48 sizes included)

### Logo Download Locations

All logo files are available in:
- `/public/branding/logo/` - Production logos
- `/public/branding/logo/print/` - High-resolution print versions
- `/public/branding/logo/web/` - Optimized web versions
- `/public/branding/icon/` - Icon-only variations

### Logo Specifications

#### Standard Logo Sizes (Web)
- **Small**: 120px × 40px (minimum recommended)
- **Medium**: 180px × 60px (standard)
- **Large**: 240px × 80px (hero sections)

#### Icon Sizes
- **Favicon**: 32px × 32px
- **App Icon**: 1024px × 1024px
- **Social Media**: 1200px × 1200px (square)
- **Browser Icon**: 192px × 192px, 512px × 512px

#### Print Specifications
- **Vector**: Use SVG for unlimited scaling
- **Raster**: Minimum 300 DPI for print quality
- **CMYK**: Convert for professional printing (provided in print folder)

---

## Brand Application Checklist

### Landing Page
- [ ] Logo placed correctly with proper clearance
- [ ] Brand colors used consistently
- [ ] Typography follows brand guidelines
- [ ] Images align with brand style
- [ ] Voice and tone match brand personality
- [ ] Responsive design maintains brand integrity

### Application Interface
- [ ] Logo implemented in navigation/header
- [ ] Color scheme matches brand palette
- [ ] UI components follow style guidelines
- [ ] Typography hierarchy is clear
- [ ] Icons use brand-approved style
- [ ] Dark mode implemented correctly

### Marketing Materials
- [ ] Logo usage follows guidelines
- [ ] Colors are brand-accompliant
- [ ] Messaging reflects brand voice
- [ ] Imagery is on-brand
- [ ] Contact information is accurate

### Documentation
- [ ] Brand guidelines referenced
- [ ] Logo files properly attributed
- [ ] Colors specified with codes
- [ ] Typography styles documented

---

## Contact & Support

For brand-related questions or requests for additional assets:
- **Email**: branding@craftlyai.app
- **Documentation**: See `/docs/BRAND_GUIDELINES.md`
- **Asset Requests**: Contact design team

---

**© 2024 CraftlyAI. All rights reserved.**

*This brand guideline document is proprietary and confidential. Unauthorized use of CraftlyAI branding is prohibited.*
