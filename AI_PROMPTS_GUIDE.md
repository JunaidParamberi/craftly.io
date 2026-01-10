# AI Prompts Guide for Landing Website Creation

**Guide for using Google AI Studio (Gemini) in Cursor to create CraftlyAI landing pages**

## Table of Contents
1. [Getting Started](#getting-started)
2. [Landing Page Content Prompts](#landing-page-content-prompts)
3. [Design & UI Prompts](#design--ui-prompts)
4. [Code Generation Prompts](#code-generation-prompts)
5. [Component-Specific Prompts](#component-specific-prompts)
6. [Content Optimization Prompts](#content-optimization-prompts)
7. [Best Practices](#best-practices)

---

## Getting Started

### Setup Context for AI
Before starting, provide context about CraftlyAI:

```
I'm building a landing page for CraftlyAI, a business management platform for independent consultants and freelancers in the UAE. 

Brand Details:
- Primary Color: Indigo #6366F1
- Font: Inter (sans-serif)
- Tone: Professional, futuristic, efficient, strategic
- Target Audience: UAE-based freelancers, independent consultants, small agencies
- Key Features: AI-powered proposals, client management, financial tracking, invoice generation, team collaboration
- Unique Value: "Empower your independent consultancy with AI-driven business management"

Brand Voice: Terminal/command-line aesthetic, professional yet approachable, business-focused language
```

---

## Landing Page Content Prompts

### Hero Section Headline

```
Create a compelling hero headline for CraftlyAI landing page. Requirements:
- 5-8 words maximum
- Focus on the main value proposition for UAE freelancers
- Should convey: automation, efficiency, AI-powered, professional
- Use uppercase style for terminal aesthetic
- Target audience: Independent consultants and freelancers
- Should be action-oriented and benefit-focused
- Avoid generic words like "revolutionary" or "game-changing"

Return only the headline, no explanations.
```

**Expected Output Format:**
```
EMPOWER YOUR STRATEGIC NODE WITH AI-DRIVEN AUTOMATION
```

### Hero Subheadline

```
Create a supporting subheadline for the CraftlyAI hero section. Requirements:
- 12-18 words
- Expand on the headline with specific benefits
- Mention: UAE, freelancers, business operations
- Professional but approachable tone
- Should lead naturally into a CTA

Format: One sentence, no bullet points
```

### Value Propositions

```
Generate 5 key value propositions for CraftlyAI landing page. Each should:
- Be one short sentence (8-12 words)
- Start with a benefit or action verb
- Focus on outcomes, not features
- Target independent consultants in UAE
- Be specific and concrete

Format as a numbered list with just the value propositions.
```

**Example Output:**
```
1. Generate professional proposals in minutes using AI assistance
2. Track all invoices and expenses in one centralized platform
3. Manage client relationships with intelligent CRM capabilities
4. Automate repetitive tasks to focus on growing your business
5. Access real-time financial insights to make informed decisions
```

### Feature Descriptions

```
Write a feature description for [FEATURE NAME] on CraftlyAI landing page. Requirements:
- Feature: [e.g., "AI-Powered Proposal Generation"]
- Length: 2-3 sentences (40-60 words total)
- Focus on benefits, not just features
- Explain how it solves a problem for freelancers
- Use clear, professional language
- Include a specific example if possible
- End with the outcome/benefit

Format: Paragraph format, no bullets
```

### Testimonial Generation

```
Create a realistic customer testimonial for CraftlyAI. Requirements:
- Persona: Ahmed Al-Mansoori, Independent Consultant, Dubai
- Length: 2-3 sentences
- Should mention specific feature or benefit (e.g., time savings, proposal generation, invoice management)
- Include a quantifiable result if possible (e.g., "saved 10 hours per week")
- Authentic, professional tone
- No overly enthusiastic language

Format: Just the testimonial text in quotes
```

---

## Design & UI Prompts

### Color Scheme Suggestions

```
Suggest a complementary color palette for CraftlyAI landing page. Base color is Indigo #6366F1. 
Requirements:
- Maintain professional, modern aesthetic
- Include: primary action color, secondary actions, success, error, neutral grays
- Should work in both light and dark modes
- Accessible contrast ratios (WCAG AA)
- Suitable for financial/business platform

Format: Hex codes with brief description for each color
```

### Layout Structure

```
Design a landing page layout structure for CraftlyAI. Requirements:
- Sections: Hero, Features (3-column), Social Proof, Pricing, FAQ, Final CTA
- Mobile-first responsive design
- Terminal/command-line aesthetic elements
- Modern, clean, professional
- Above-the-fold optimization
- Logical content flow

Describe the layout structure and spacing approach (no code, just description)
```

### Typography Hierarchy

```
Create a typography system for CraftlyAI landing page using Inter font family. 
Specify sizes and weights for:
- Hero headline (H1)
- Section headings (H2)
- Feature titles (H3)
- Body text
- Labels/CTAs (terminal-style uppercase)
- Supporting text

Include line-height and letter-spacing recommendations. Format as a structured list.
```

---

## Code Generation Prompts

### React Component Generation

```
Create a React TypeScript component for [COMPONENT_NAME] section of CraftlyAI landing page.

Requirements:
- Component name: [e.g., "HeroSection"]
- Use Tailwind CSS for styling
- Follow CraftlyAI brand colors (primary: #6366F1)
- Responsive design (mobile-first)
- Use Inter font family
- Terminal-style aesthetic for labels (uppercase, tracking-widest)
- Include proper TypeScript types
- Follow React best practices (functional component, hooks)
- Props interface if needed
- Accessible HTML semantics

Brand Guidelines:
- Primary color: #6366F1 (indigo-600)
- Dark mode support using CSS variables
- Terminal labels: text-xs, font-black, uppercase, tracking-[0.3em]
- Button style: rounded-xl, font-black, uppercase, tracking-wider

Generate complete, production-ready code.
```

### Feature Card Component

```
Create a FeatureCard React component for CraftlyAI landing page features section.

Specifications:
- Props: { icon: ReactNode, title: string, description: string }
- Styling: White/dark card with border, hover effects
- Icon: Use Lucide React icons (size 32px, indigo color)
- Title: H3, bold, dark text
- Description: Body text, gray-600, 2-3 lines
- Hover: Border color change, subtle shadow
- Responsive: Stack on mobile, 3-column grid on desktop
- Dark mode compatible

Return complete component code with TypeScript.
```

### CTA Button Component

```
Create a reusable CTA button component for CraftlyAI landing page.

Requirements:
- Variants: primary (indigo), secondary (outline), white (for dark backgrounds)
- Sizes: default (h-14), large (h-16), small (h-10)
- Style: rounded-xl, font-black, uppercase, tracking-wider, px-8
- States: default, hover, active, disabled
- Include loading state (spinner icon)
- Icon support (optional, left side)
- Full-width option for mobile
- Accessible (ARIA labels, keyboard navigation)
- TypeScript with proper prop types

Generate complete component code.
```

### Responsive Navigation

```
Create a responsive navigation header component for CraftlyAI landing page.

Features:
- Logo on left (use placeholder or SVG)
- Desktop: Horizontal menu (Features, Pricing, About, etc.)
- Mobile: Hamburger menu that slides in from right
- CTA button: "Get Started" (indigo, sticky on mobile)
- Sticky header on scroll (backdrop blur effect)
- Smooth scroll to sections
- Dark mode support
- Accessible (ARIA labels, keyboard nav)

Use React, TypeScript, Tailwind CSS, Lucide icons. Return complete code.
```

---

## Component-Specific Prompts

### Hero Section

```
Generate a complete Hero section component for CraftlyAI landing page.

Layout:
- Split layout: Text left, illustration/image right (desktop)
- Centered on mobile
- Headline: Large, bold, uppercase style
- Subheadline: Medium, supporting text
- Two CTAs: Primary "Start Free Trial", Secondary "Watch Demo"
- Trust indicators below CTAs: "No credit card required • 14-day free trial"
- Background: Gradient or subtle pattern

Content:
- Headline: [Use hero headline from content prompts]
- Subheadline: [Use hero subheadline from content prompts]
- Primary CTA: "Start Free Trial"
- Secondary CTA: "Watch Demo"

Styling: Follow CraftlyAI brand guidelines, terminal aesthetic for labels
Technology: React, TypeScript, Tailwind CSS, responsive

Generate complete component code.
```

### Features Section

```
Create a Features section for CraftlyAI landing page with 5 feature cards.

Features to include:
1. AI-Powered Proposals - Generate professional proposals in minutes
2. Client Management - Comprehensive CRM for tracking relationships  
3. Financial Tracking - Invoices, expenses, and revenue analytics
4. Professional Documents - Branded PDFs for invoices and proposals
5. Team Collaboration - Multi-user support for agencies

Layout:
- Section title: "Platform Capabilities" or "Key Features"
- Section subtitle: Brief description
- 5 feature cards in responsive grid (1 col mobile, 2 col tablet, 3 col desktop with 5th card spanning)
- Each card: Icon, title, description, optional "Learn more" link

Styling: Follow CraftlyAI brand, use Lucide icons, hover effects
Generate complete React component code.
```

### Social Proof Section

```
Create a Social Proof section for CraftlyAI landing page.

Include:
- Section title: "Trusted by Independent Consultants"
- Statistics: "500+ freelancers", "10,000+ invoices generated", "AED 5M+ tracked"
- 3-4 testimonials in carousel or grid
- Optional: Logo showcase (if applicable)

Testimonial format:
- Star rating (5 stars)
- Quote text (2-3 sentences)
- Person: Name, Title, Location (e.g., "Ahmed Al-Mansoori, Independent Consultant, Dubai")
- Avatar placeholder or icon

Layout: Responsive grid/carousel, alternating left/right on desktop
Styling: Clean, professional, with subtle backgrounds
Generate complete React component code.
```

### Pricing Section

```
Create a Pricing section for CraftlyAI landing page (if applicable).

Structure:
- Section title: "Simple, Transparent Pricing"
- 3 tiers: Free, Pro, Enterprise
- Feature comparison table or cards
- "Most Popular" badge on recommended plan
- CTA button per tier
- Optional: "All plans include 14-day free trial"
- FAQ link: "See full pricing details" or "Compare plans"

If pricing not public, create a "Request Pricing" CTA section instead.

Generate complete component code with responsive design.
```

### FAQ Section

```
Create an FAQ (Frequently Asked Questions) accordion section for CraftlyAI.

Questions to include:
1. Is there a free trial?
2. Do I need a credit card to start?
3. Can I use this for multiple businesses?
4. What payment methods do you accept?
5. Is my data secure?
6. Can I export my data?
7. Do you support UAE tax/VAT?
8. Can I customize invoices and proposals?

Format: Accordion/collapsible sections
- Question: Bold, clickable, with chevron icon
- Answer: Expandable, 2-4 sentences
- Smooth animation on expand/collapse
- Mobile-friendly spacing

Styling: Clean, minimal, easy to scan
Generate complete React component with state management.
```

### Final CTA Section

```
~Create a final Call-to-Action section for CraftlyAI landing page.

Design:
- Full-width section with indigo gradient background
- Centered content
- Large headline: "Ready to Transform Your Consultancy?"
- Supporting text: Benefit reminder
- Prominent CTA button: "Start Your Free Trial"
- Trust indicators: "No credit card required • Setup in 2 minutes"
- Optional: Social proof number (e.g., "Join 500+ freelancers")

Styling: High contrast, eye-catching, clear hierarchy
Responsive: Stack on mobile, centered on desktop
Generate complete component code.
```~

---

## Content Optimization Prompts

### SEO Meta Description

```
Create an SEO meta description for CraftlyAI landing page. Requirements:
- 150-160 characters
- Include: "CraftlyAI", "freelancers", "UAE", key benefit
- Action-oriented, compelling
- Include primary keyword
- Clear value proposition

Return just the meta description text.
```

### Meta Keywords

```
Generate 10-15 relevant SEO keywords for CraftlyAI landing page targeting UAE freelancers and consultants.

Focus on:
- Primary service keywords (CRM, invoicing, business management)
- Location keywords (UAE, Dubai, freelancers UAE)
- Benefit keywords (automation, efficiency, AI-powered)
- Industry keywords (consulting, freelance business)

Format as comma-separated list.
```

### Open Graph Tags

```
Create Open Graph meta tags for CraftlyAI landing page sharing on social media.

Include:
- og:title (60 characters max)
- og:description (200 characters max)
- og:image (suggest dimensions and description)
- og:url
- og:type

Format as HTML meta tags ready to use.
```

---

## Advanced Prompts

### Complete Landing Page Generation

```
Generate a complete landing page for CraftlyAI using React, TypeScript, and Tailwind CSS.

Include all sections:
1. Navigation header (responsive, sticky)
2. Hero section (headline, CTA, trust indicators)
3. Features section (5 key features with icons)
4. Social proof (testimonials and stats)
5. Pricing section (or "Request Demo" if no public pricing)
6. FAQ accordion (8 questions)
7. Final CTA section
8. Footer (links, social, copyright)

Requirements:
- Follow CraftlyAI brand guidelines (colors, fonts, tone)
- Fully responsive (mobile-first)
- Dark mode support
- Accessible (ARIA labels, semantic HTML)
- Smooth scroll behavior
- Terminal/command-line aesthetic where appropriate
- Use Lucide React for icons
- TypeScript with proper types
- Production-ready code with best practices

Break into separate components for maintainability.
Include proper routing structure if needed.

Generate complete codebase structure.
```

### A/B Testing Variants

```
Generate two headline variants for A/B testing on CraftlyAI landing page.

Variant A: Benefit-focused (save time, increase efficiency)
Variant B: Feature-focused (AI-powered, automation)

Both should:
- Be 5-8 words
- Target UAE freelancers
- Maintain brand voice
- Be testable against each other

Return both variants labeled clearly.
```

### Conversion Optimization

```
Suggest conversion optimization improvements for CraftlyAI landing page hero section.

Current elements:
- Headline
- Subheadline  
- Primary CTA: "Start Free Trial"
- Secondary CTA: "Watch Demo"
- Trust indicators

Suggest:
- 3 alternative headline options
- 2 alternative CTA button texts
- Additional trust indicators or social proof elements
- Above-the-fold content improvements
- Mobile optimization suggestions

Format as structured recommendations.
```

---

## Prompt Templates

### Content Generation Template

```
[ROLE] You are a marketing copywriter specializing in B2B SaaS landing pages for small businesses.

[TASK] Create [CONTENT_TYPE] for CraftlyAI, a business management platform for independent consultants in the UAE.

[CONTEXT]
- Product: CraftlyAI - AI-powered business management for freelancers
- Target: UAE-based independent consultants, freelancers, small agencies
- Brand Voice: Professional, efficient, terminal-style, strategic
- Tone: Authoritative but approachable, business-focused

[REQUIREMENTS]
- Length: [X] words/characters
- Focus: [BENEFIT/FEATURE]
- Style: [FORMAL/CASUAL/TERMINAL]
- Include: [SPECIFIC ELEMENTS]

[OUTPUT FORMAT]
[STRUCTURED/UNSTRUCTURED, EXAMPLES]

Generate [CONTENT_TYPE].
```

### Code Generation Template

```
[ROLE] You are a senior React/TypeScript developer specializing in modern web applications.

[TASK] Create a [COMPONENT_TYPE] component for CraftlyAI landing page.

[TECHNOLOGY STACK]
- React 19
- TypeScript
- Tailwind CSS
- Lucide React (icons)
- Responsive design (mobile-first)

[BRAND GUIDELINES]
- Primary Color: #6366F1 (indigo-600)
- Font: Inter
- Style: Terminal/command-line aesthetic for labels
- Dark mode: Supported via CSS variables

[REQUIREMENTS]
- [FEATURE_1]
- [FEATURE_2]
- [FEATURE_3]

[ACCESSIBILITY]
- ARIA labels
- Keyboard navigation
- Screen reader support
- WCAG AA contrast

[OUTPUT]
Generate complete, production-ready component code with:
- TypeScript interfaces
- Proper prop types
- Responsive classes
- Hover/focus states
- Error handling (if applicable)
```

---

## Best Practices

### Prompt Engineering Tips

1. **Be Specific**: Include exact requirements, lengths, formats
2. **Provide Context**: Give brand guidelines, target audience, tone
3. **Use Examples**: Show desired output format with examples
4. **Iterate**: Refine prompts based on outputs
5. **Break Down**: Break large tasks into smaller, focused prompts
6. **Set Constraints**: Specify character limits, word counts, structure
7. **Request Format**: Always specify desired output format

### Prompt Structure Formula

```
[Role] + [Context] + [Task] + [Requirements] + [Constraints] + [Format] = Good Prompt
```

### Example: Optimized Prompt

```
You are an expert web developer. Create a hero section component for CraftlyAI landing page. 
The platform helps UAE freelancers manage their business operations. 

Requirements:
- Split layout (text left, image right on desktop)
- Headline: "EMPOWER YOUR STRATEGIC NODE" (uppercase, bold, 48px)
- Subheadline: Supporting text (18px, gray)
- Two CTAs: Primary "Start Free Trial" (indigo), Secondary "Watch Demo" (outline)
- Responsive: Stack on mobile
- Use React, TypeScript, Tailwind CSS
- Follow brand colors: #6366F1 primary

Generate complete component code with proper TypeScript types.
```

### Common Mistakes to Avoid

❌ **Too Vague**: "Create a landing page"
✅ **Specific**: "Create a hero section with headline, subheadline, and 2 CTAs"

❌ **No Context**: "Write content"
✅ **With Context**: "Write a hero headline for CraftlyAI targeting UAE freelancers"

❌ **No Format**: "Generate code"
✅ **With Format**: "Generate React TypeScript component with Tailwind CSS, return complete file"

❌ **Too Complex**: Asking for entire page in one prompt
✅ **Modular**: Break into sections (hero, features, pricing, etc.)

---

## Quick Reference: Key Prompts

### Content
```
Hero Headline: "Create a 5-8 word headline for CraftlyAI hero section targeting UAE freelancers"
Feature Description: "Write 2-3 sentence description for [FEATURE] focusing on benefits"
Testimonial: "Create testimonial from Ahmed, Dubai consultant, mentioning time savings"
```

### Design
```
Color Palette: "Suggest complementary colors for base indigo #6366F1, WCAG AA compliant"
Layout: "Design responsive layout structure for hero, features, pricing, FAQ sections"
Typography: "Create typography scale using Inter font for landing page hierarchy"
```

### Code
```
Hero Component: "Generate React TypeScript hero section with split layout, 2 CTAs, responsive"
Feature Card: "Create FeatureCard component with icon, title, description, hover effects"
FAQ Accordion: "Build FAQ accordion with 8 questions, smooth animations, accessible"
```

---

## Google AI Studio Specific Tips

### Using in Cursor

1. **Select Code**: Highlight existing code, then use AI prompt to modify
2. **Inline Chat**: Use Cursor's inline chat for quick iterations
3. **File Context**: Reference other files with @filename syntax
4. **Multi-file**: Generate multiple components in one prompt using structure

### Example Workflow

```
1. Generate content prompts → Get headlines, descriptions
2. Generate component structure → Get React components
3. Generate styling → Get Tailwind classes
4. Iterate and refine → Adjust based on output
5. Integrate → Combine into complete landing page
```

### Context Setting in Cursor

```
@BRAND_GUIDELINES.md Create a hero section following these brand guidelines
@LANDING_PAGE_GUIDE.md Generate hero section matching this structure
@components/ExistingComponent.tsx Create similar component but for landing page
```

---

## Example: Complete Landing Page Prompt

```
Create a complete landing page for CraftlyAI business management platform.

Platform: CraftlyAI - AI-powered business management for UAE freelancers and consultants
Brand: Professional, terminal-style aesthetic, indigo #6366F1 primary color
Target: Independent consultants, freelancers, small agencies in UAE

Sections Required:
1. Navigation (logo, menu, CTA button)
2. Hero (headline, subheadline, 2 CTAs, trust indicators)
3. Features (5 features: AI Proposals, CRM, Finance, Documents, Team)
4. Social Proof (stats: 500+ users, testimonials)
5. Pricing (Free, Pro, Enterprise - or Request Demo)
6. FAQ (8 questions in accordion)
7. Final CTA (large, prominent, indigo background)
8. Footer (links, social, copyright)

Technical Requirements:
- React 19 + TypeScript
- Tailwind CSS (responsive, mobile-first)
- Lucide React icons
- Dark mode support
- Accessible (ARIA, keyboard nav)
- Smooth scroll behavior
- Production-ready code

Structure as separate component files:
- components/landing/HeroSection.tsx
- components/landing/FeaturesSection.tsx
- components/landing/TestimonialsSection.tsx
- etc.

Generate complete codebase with all components and proper imports.
```

---

## Troubleshooting Prompts

### If Output is Too Generic

```
Add more specific context:
- Mention exact brand colors
- Specify target audience demographics
- Include competitor analysis
- Provide style references
```

### If Code Has Errors

```
Request:
- TypeScript strict mode compliance
- Error handling
- Type definitions
- Proper imports
- Dependency checks
```

### If Design Doesn't Match Brand

```
Reinforce brand guidelines:
- Show example of brand style
- Reference existing components
- Specify exact color codes
- Provide typography scale
```

---

**Last Updated**: 2024  
**Version**: 1.0

**Usage**: Copy these prompts into Cursor's AI chat or Google AI Studio, customize the bracketed placeholders, and iterate based on outputs.
