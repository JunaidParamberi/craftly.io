#!/bin/bash

# Script to generate PNG files from SVG logos
# Requires: Inkscape or ImageMagick
# Usage: ./generate-png.sh [inkscape|imagemagick]

METHOD=${1:-inkscape}

echo "Generating PNG files from SVG logos using $METHOD..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Generate logos from SVG
generate_logo_png() {
    local input=$1
    local output=$2
    local width=$3
    
    if [ "$METHOD" = "inkscape" ]; then
        if command_exists inkscape; then
            inkscape "$input" --export-filename="$output" --export-width=$width --export-dpi=96
            echo "Generated: $output ($width px)"
        else
            echo "Error: Inkscape not found. Install with: brew install inkscape (macOS) or apt-get install inkscape (Ubuntu)"
            exit 1
        fi
    elif [ "$METHOD" = "imagemagick" ]; then
        if command_exists convert; then
            convert -background none -density 96 "$input" -resize ${width}x "$output"
            echo "Generated: $output ($width px)"
        else
            echo "Error: ImageMagick not found. Install with: brew install imagemagick (macOS) or apt-get install imagemagick (Ubuntu)"
            exit 1
        fi
    else
        echo "Error: Unknown method. Use 'inkscape' or 'imagemagick'"
        exit 1
    fi
}

# Create output directories
mkdir -p logo/web
mkdir -p logo/print
mkdir -p icon/web

# Generate main logo variations (web)
echo "Generating web-optimized logos..."
generate_logo_png "logo/craftly_logo.svg" "logo/web/craftly_logo_120.png" 120
generate_logo_png "logo/craftly_logo.svg" "logo/web/craftly_logo_180.png" 180
generate_logo_png "logo/craftly_logo.svg" "logo/web/craftly_logo_240.png" 240
generate_logo_png "logo/craftly_logo.svg" "logo/web/craftly_logo_400.png" 400

# Generate white logo variations (web)
generate_logo_png "logo/craftly_logo_white.svg" "logo/web/craftly_logo_white_120.png" 120
generate_logo_png "logo/craftly_logo_white.svg" "logo/web/craftly_logo_white_180.png" 180
generate_logo_png "logo/craftly_logo_white.svg" "logo/web/craftly_logo_white_240.png" 240
generate_logo_png "logo/craftly_logo_white.svg" "logo/web/craftly_logo_white_400.png" 400

# Generate high-res logo for print (300 DPI)
echo "Generating print-ready logos (300 DPI)..."
if [ "$METHOD" = "inkscape" ]; then
    if command_exists inkscape; then
        inkscape "logo/craftly_logo.svg" --export-filename="logo/print/craftly_logo_highres.png" --export-width=1200 --export-dpi=300
        inkscape "logo/craftly_logo_white.svg" --export-filename="logo/print/craftly_logo_white_highres.png" --export-width=1200 --export-dpi=300
        echo "Generated print-ready logos"
    fi
elif [ "$METHOD" = "imagemagick" ]; then
    if command_exists convert; then
        convert -background none -density 300 "logo/craftly_logo.svg" -resize 1200x "logo/print/craftly_logo_highres.png"
        convert -background none -density 300 "logo/craftly_logo_white.svg" -resize 1200x "logo/print/craftly_logo_white_highres.png"
        echo "Generated print-ready logos"
    fi
fi

# Generate icon variations
echo "Generating icon variations..."
for size in 32 64 128 256 512 1024; do
    generate_logo_png "icon/craftly_icon.svg" "icon/web/craftly_icon_${size}.png" $size
    generate_logo_png "icon/craftly_icon_white.svg" "icon/web/craftly_icon_white_${size}.png" $size
done

# Generate favicon sizes
echo "Generating favicon sizes..."
generate_logo_png "icon/craftly_icon.svg" "icon/favicon-16.png" 16
generate_logo_png "icon/craftly_icon.svg" "icon/favicon-32.png" 32
generate_logo_png "icon/craftly_icon.svg" "icon/favicon-48.png" 48

# Generate Apple Touch Icon
generate_logo_png "icon/craftly_icon.svg" "icon/apple-touch-icon.png" 180

# Create high-res logo in root (for backward compatibility)
generate_logo_png "logo/craftly_logo.svg" "logo/craftly_logo_highres.png" 800

echo ""
echo "✅ PNG generation complete!"
echo ""
echo "Generated files:"
echo "  - Web logos: logo/web/*.png"
echo "  - Print logos: logo/print/*.png (300 DPI)"
echo "  - Icons: icon/web/*.png"
echo "  - Favicons: icon/favicon-*.png"
echo ""
echo "Note: For ICO file generation, use an online tool like https://realfavicongenerator.net/"
