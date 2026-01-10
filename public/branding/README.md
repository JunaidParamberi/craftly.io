# CraftlyAI Branding Assets

This directory contains all branding assets for CraftlyAI, including logos, icons, and related files.

## Directory Structure

```
branding/
├── logo/
│   ├── craftly_logo.svg              # Primary horizontal logo (color)
│   ├── craftly_logo_white.svg        # White version for dark backgrounds
│   ├── craftly_logo_highres.png      # High-res PNG (existing, to be updated)
│   ├── web/                          # Optimized web versions
│   │   └── craftly_logo_compact.svg  # Compact version for small spaces
│   └── print/                        # High-resolution print versions (CMYK)
│       └── (PNG/PDF files for print)
└── icon/
    ├── craftly_icon.svg              # Icon only (square, color)
    ├── craftly_icon_white.svg        # Icon only (white version)
    └── (Various PNG sizes for app icons, favicons)
```

## Quick Start

### Using Logos in Your Code

#### React/TypeScript
```jsx
// Primary logo (color)
<img src="/branding/logo/craftly_logo.svg" alt="CraftlyAI" className="h-8" />

// White logo for dark backgrounds
<img src="/branding/logo/craftly_logo_white.svg" alt="CraftlyAI" className="h-8" />

// Compact version
<img src="/branding/logo/web/craftly_logo_compact.svg" alt="CraftlyAI" className="h-6" />

// Icon only
<img src="/branding/icon/craftly_icon.svg" alt="CraftlyAI Icon" className="w-8 h-8" />
```

#### HTML
```html
<!-- Primary logo -->
<img src="/branding/logo/craftly_logo.svg" alt="CraftlyAI" height="40" />

<!-- White logo for dark backgrounds -->
<img src="/branding/logo/craftly_logo_white.svg" alt="CraftlyAI" height="40" />
```

#### CSS Background
```css
.logo {
  background-image: url('/branding/logo/craftly_logo.svg');
  background-size: contain;
  background-repeat: no-repeat;
  width: 200px;
  height: 60px;
}
```

## File Formats

### SVG (Scalable Vector Graphics)
- **Best for**: Web, scaling to any size, crisp rendering
- **Files**: All `.svg` files
- **Advantages**: Scalable, small file size, crisp at any resolution
- **Usage**: Web headers, responsive layouts, modern browsers

### PNG (Portable Network Graphics)
- **Best for**: Email, documents, specific sizes, compatibility
- **Files**: `.png` files (to be generated from SVG)
- **Advantages**: Universal compatibility, transparent backgrounds
- **Usage**: Email signatures, presentations, older browser support

### ICO (Icon)
- **Best for**: Favicons, browser tabs
- **Files**: `craftly_favicon.ico`
- **Usage**: Browser favicon (includes multiple sizes: 16x16, 32x32, 48x48)

## Logo Variations

### Horizontal Logo
- **File**: `craftly_logo.svg`, `craftly_logo_white.svg`
- **Dimensions**: 400px × 120px (aspect ratio: 3.33:1)
- **Use**: Headers, navigation bars, horizontal layouts
- **Minimum Size**: 120px width

### Compact Logo
- **File**: `web/craftly_logo_compact.svg`
- **Dimensions**: 300px × 80px
- **Use**: Mobile headers, tight spaces, small navigation bars
- **Minimum Size**: 90px width

### Icon Only
- **File**: `icon/craftly_icon.svg`, `icon/craftly_icon_white.svg`
- **Dimensions**: 120px × 120px (square)
- **Use**: App icons, favicons, square spaces, social media
- **Sizes Available**: 32px, 64px, 128px, 256px, 512px, 1024px

## Color Versions

### Color Logo (Primary)
- **Background**: White or light backgrounds
- **Colors**: Indigo gradient (#6366F1 to #818CF8)
- **Text**: Dark gray (#1E293B)
- **File**: `craftly_logo.svg`, `craftly_icon.svg`

### White Logo
- **Background**: Dark backgrounds (#020617, #0B1120)
- **Colors**: White gradient
- **Text**: White (#FFFFFF)
- **File**: `craftly_logo_white.svg`, `craftly_icon_white.svg`

## Generating PNG Files

### Method 1: Using Inkscape (Free, Open Source)
```bash
# Install Inkscape (if not installed)
# macOS: brew install inkscape
# Ubuntu: sudo apt-get install inkscape
# Windows: Download from inkscape.org

# Convert SVG to PNG (high resolution)
inkscape craftly_logo.svg --export-filename=craftly_logo_highres.png --export-width=1200 --export-dpi=300

# Convert to different sizes
inkscape craftly_logo.svg --export-filename=craftly_logo_240.png --export-width=240
inkscape craftly_logo.svg --export-filename=craftly_logo_180.png --export-width=180
inkscape craftly_logo.svg --export-filename=craftly_logo_120.png --export-width=120
```

### Method 2: Using ImageMagick
```bash
# Install ImageMagick
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick

# Convert SVG to PNG
convert -background none -density 300 craftly_logo.svg craftly_logo_highres.png

# Resize to specific dimensions
convert craftly_logo_highres.png -resize 240x craftly_logo_240.png
```

### Method 3: Using Online Tools
1. **CloudConvert**: https://cloudconvert.com/svg-to-png
   - Upload SVG
   - Set resolution (300 DPI for print, 72-96 DPI for web)
   - Download PNG

2. **SVG to PNG Converter**: https://svgtopng.com/
   - Simple drag-and-drop interface
   - Multiple size options

### Method 4: Using Design Software
- **Adobe Illustrator**: File → Export → Export As → PNG
- **Figma**: Right-click → Export → PNG
- **Sketch**: Make Exportable → Export as PNG

### Recommended PNG Sizes

#### Web Use
- **Small**: 120px × 36px
- **Medium**: 180px × 54px
- **Large**: 240px × 72px
- **Extra Large**: 400px × 120px

#### Print Use
- **Business Cards**: 600px width @ 300 DPI
- **Letterhead**: 1200px width @ 300 DPI
- **Large Format**: 2400px width @ 300 DPI

#### Icon Sizes
- **Favicon**: 32px × 32px, 48px × 48px
- **App Icon**: 1024px × 1024px
- **Social Media**: 1200px × 1200px (square)

## Favicon Generation

To create favicon files from the icon SVG:

```bash
# Using ImageMagick to create multiple sizes
for size in 16 32 48 64 128 256; do
  convert -background none craftly_icon.svg -resize ${size}x${size} favicon-${size}.png
done

# Combine into ICO file (requires ImageMagick or online tool)
# Or use: https://realfavicongenerator.net/
```

## Brand Guidelines

For detailed brand guidelines, see:
- [`BRAND_GUIDELINES.md`](../../BRAND_GUIDELINES.md) - Complete brand guidelines
- [`LANDING_PAGE_GUIDE.md`](../../LANDING_PAGE_GUIDE.md) - Landing page creation guide

## Usage Guidelines

### Do ✅
- Use SVG files for web when possible
- Maintain proper clearance space (minimum 20px)
- Use color version on light backgrounds
- Use white version on dark backgrounds
- Scale proportionally
- Use recommended minimum sizes

### Don't ❌
- Rotate, skew, or distort logos
- Change logo colors
- Modify the logo design
- Place on busy backgrounds without proper contrast
- Use below minimum size
- Add effects (shadows, gradients, outlines) to the logo itself

## License & Usage

These branding assets are proprietary to CraftlyAI and are for use only in official CraftlyAI applications and marketing materials. Unauthorized use is prohibited.

For questions or additional assets, contact: branding@craftlyai.app

---

**Last Updated**: 2024
**Version**: 1.0
