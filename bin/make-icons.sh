#!/usr/bin/env bash
# Brand → icon pipeline for expo-supabase-template forks (PROD-5170).
#
# Takes one brand logo (SVG preferred, PNG with alpha works) and generates
# every raster asset that app.json references:
#
#   <out-dir>/images/icon.png                      1024x1024  canvas color + centered logo (opaque — iOS forbids alpha)
#   <out-dir>/images/android-icon-foreground.png   1024x1024  logo in adaptive-icon safe zone (66/108), transparent
#   <out-dir>/images/android-icon-background.png   1024x1024  solid canvas color (adaptive backgroundImage), opaque
#   <out-dir>/images/android-icon-monochrome.png   1024x1024  white silhouette from logo alpha, transparent
#   <out-dir>/images/favicon.png                     48x48    downscaled app icon
#   <out-dir>/images/splash-icon.png                512x512   logo on transparent (splash plugin scales via imageWidth)
#
# NOTE: assets/expo.icon (iOS 26 Icon Composer bundle) is vector-based and NOT
# regenerated here — update it in Icon Composer, or delete ios.icon from
# app.json to fall back to the generated icon.png.
#
# Usage:
#   bin/make-icons.sh --brand-icon=brand/logo.svg [--canvas='#0F1023'] [--scale=70] [--out-dir=assets] [--dry-run]
#
# Requires: imagemagick (magick). For SVG input rsvg-convert is preferred
# (better fidelity), magick is the fallback. Install: brew install librsvg imagemagick

set -euo pipefail

BRAND_ICON=""
CANVAS="#FFFFFF"
SCALE=70
OUT_DIR="assets"
DRY_RUN=false

usage() {
  cat <<HELP
Usage: bin/make-icons.sh --brand-icon=PATH [OPTIONS]

Generate all app icon assets referenced by app.json from a single brand logo.

OPTIONS:
  --brand-icon=PATH   Brand logo — .svg (preferred) or .png with alpha (required)
  --canvas=HEX        Background color for app icon + android background (default: #FFFFFF)
                      iOS app icons must be opaque — canvas fills the square.
  --scale=PCT         Logo size as % of the app-icon canvas, 1-100 (default: 70)
  --out-dir=DIR       Output root — files land in DIR/images/ (default: assets)
  --dry-run           Print what would be generated, generate nothing
  --help, -h          This help
HELP
}

for arg in "$@"; do
  case $arg in
    --brand-icon=*) BRAND_ICON="${arg#*=}" ;;
    --canvas=*) CANVAS="${arg#*=}" ;;
    --scale=*) SCALE="${arg#*=}" ;;
    --out-dir=*) OUT_DIR="${arg#*=}" ;;
    --dry-run) DRY_RUN=true ;;
    --help|-h) usage; exit 0 ;;
    *) echo "❌ Unknown option: $arg" >&2; usage >&2; exit 1 ;;
  esac
done

# --- Validate inputs -------------------------------------------------------
if [ -z "$BRAND_ICON" ]; then
  echo "❌ --brand-icon=PATH is required" >&2
  usage >&2
  exit 1
fi
if [ ! -f "$BRAND_ICON" ]; then
  echo "❌ Brand icon not found: $BRAND_ICON" >&2
  exit 1
fi

case $CANVAS in
  \#[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]) : ;;
  \#[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]) : ;;
  *) echo "❌ --canvas must be #RGB or #RRGGBB hex (got: $CANVAS)" >&2; exit 1 ;;
esac

case $SCALE in
  ''|*[!0-9]*) echo "❌ --scale must be an integer 1-100 (got: $SCALE)" >&2; exit 1 ;;
esac
if [ "$SCALE" -lt 1 ] || [ "$SCALE" -gt 100 ]; then
  echo "❌ --scale must be between 1 and 100 (got: $SCALE)" >&2
  exit 1
fi

EXT_LOWER=$(printf '%s' "${BRAND_ICON##*.}" | tr '[:upper:]' '[:lower:]')
case $EXT_LOWER in
  svg|png) : ;;
  *) echo "❌ Brand icon must be .svg or .png (got: .$EXT_LOWER)" >&2; exit 1 ;;
esac

# --- Tool detection --------------------------------------------------------
if ! command -v magick >/dev/null 2>&1; then
  echo "❌ ImageMagick 7 ('magick') not found — required for icon generation." >&2
  echo "   Install: brew install imagemagick" >&2
  exit 1
fi

SVG_RASTERIZER=""
if [ "$EXT_LOWER" = "svg" ]; then
  if command -v rsvg-convert >/dev/null 2>&1; then
    SVG_RASTERIZER="rsvg-convert"
  else
    SVG_RASTERIZER="magick"
    echo "⚠️  rsvg-convert not found — falling back to ImageMagick for SVG (quality may differ)."
    echo "   For best results: brew install librsvg"
  fi
fi

# --- Geometry --------------------------------------------------------------
ICON_SIZE=1024
SPLASH_SIZE=512
FAVICON_SIZE=48
LOGO_PX=$((ICON_SIZE * SCALE / 100))
# Android adaptive icon safe zone: 66dp of the 108dp canvas → logo fits inside it.
FG_LOGO_PX=$((ICON_SIZE * 66 / 108))

IMAGES_DIR="$OUT_DIR/images"
OUT_ICON="$IMAGES_DIR/icon.png"
OUT_FG="$IMAGES_DIR/android-icon-foreground.png"
OUT_BG="$IMAGES_DIR/android-icon-background.png"
OUT_MONO="$IMAGES_DIR/android-icon-monochrome.png"
OUT_FAVICON="$IMAGES_DIR/favicon.png"
OUT_SPLASH="$IMAGES_DIR/splash-icon.png"

if [ "$DRY_RUN" = true ]; then
  cat <<PLAN
🔎 Dry run — nothing generated. Plan:
  input:      $BRAND_ICON ($EXT_LOWER${SVG_RASTERIZER:+, rasterizer: $SVG_RASTERIZER})
  canvas:     $CANVAS
  scale:      $SCALE% → logo ${LOGO_PX}px on ${ICON_SIZE}px app icon
  outputs:
    $OUT_ICON      ${ICON_SIZE}x${ICON_SIZE}  opaque, canvas + logo
    $OUT_FG        ${ICON_SIZE}x${ICON_SIZE}  transparent, logo ${FG_LOGO_PX}px (66/108 safe zone)
    $OUT_BG        ${ICON_SIZE}x${ICON_SIZE}  opaque, solid $CANVAS
    $OUT_MONO      ${ICON_SIZE}x${ICON_SIZE}  transparent, white silhouette
    $OUT_FAVICON   ${FAVICON_SIZE}x${FAVICON_SIZE}      opaque, downscaled app icon
    $OUT_SPLASH    ${SPLASH_SIZE}x${SPLASH_SIZE}    transparent, logo only
PLAN
  exit 0
fi

mkdir -p "$IMAGES_DIR"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT
LOGO_MASTER="$TMP_DIR/logo-master.png"

# --- Rasterize logo master (transparent, fits 1024x1024) --------------------
echo "🎨 Rasterizing brand logo → ${ICON_SIZE}px master..."
if [ "$EXT_LOWER" = "svg" ]; then
  if [ "$SVG_RASTERIZER" = "rsvg-convert" ]; then
    rsvg-convert --width="$ICON_SIZE" --height="$ICON_SIZE" --keep-aspect-ratio \
      --output="$LOGO_MASTER" "$BRAND_ICON"
  else
    magick -background none -density 300 "$BRAND_ICON" \
      -resize "${ICON_SIZE}x${ICON_SIZE}" "$LOGO_MASTER"
  fi
else
  SRC_W=$(magick identify -format '%w' "$BRAND_ICON")
  if [ "$SRC_W" -lt "$ICON_SIZE" ]; then
    echo "⚠️  PNG source is ${SRC_W}px wide (< ${ICON_SIZE}px) — will be upscaled. SVG input avoids this."
  fi
  magick "$BRAND_ICON" -background none -resize "${ICON_SIZE}x${ICON_SIZE}" "$LOGO_MASTER"
fi

# --- Generate outputs ------------------------------------------------------
echo "🖼  App icon → $OUT_ICON"
magick -size "${ICON_SIZE}x${ICON_SIZE}" xc:"$CANVAS" \
  \( "$LOGO_MASTER" -resize "${LOGO_PX}x${LOGO_PX}" \) \
  -gravity center -composite -alpha off "$OUT_ICON"

echo "🤖 Android adaptive foreground → $OUT_FG"
magick -size "${ICON_SIZE}x${ICON_SIZE}" xc:none \
  \( "$LOGO_MASTER" -resize "${FG_LOGO_PX}x${FG_LOGO_PX}" \) \
  -gravity center -composite "$OUT_FG"

echo "🎨 Android adaptive background → $OUT_BG"
magick -size "${ICON_SIZE}x${ICON_SIZE}" xc:"$CANVAS" -alpha off "$OUT_BG"

echo "⚪ Android monochrome → $OUT_MONO"
# White silhouette: keep the foreground's alpha channel, force RGB to pure white.
magick "$OUT_FG" -channel RGB -fill white -colorize 100 +channel "$OUT_MONO"

echo "🌐 Favicon → $OUT_FAVICON"
magick "$OUT_ICON" -resize "${FAVICON_SIZE}x${FAVICON_SIZE}" "$OUT_FAVICON"

echo "💦 Splash icon → $OUT_SPLASH"
magick "$LOGO_MASTER" -resize "${SPLASH_SIZE}x${SPLASH_SIZE}" \
  -background none -gravity center -extent "${SPLASH_SIZE}x${SPLASH_SIZE}" "$OUT_SPLASH"

# --- Validate --------------------------------------------------------------
echo ""
echo "🔍 Validating outputs..."
FAILED=0

validate() {
  local file="$1" want_size="$2" want_alpha="$3"  # want_alpha: opaque|alpha
  local info size channels
  info=$(magick identify -format '%wx%h %[channels]' "$file")
  size=${info%% *}
  channels=${info#* }
  local ok=true
  if [ "$size" != "$want_size" ]; then
    ok=false
  fi
  case $want_alpha in
    opaque) case $channels in *a*) ok=false ;; esac ;;
    alpha)  case $channels in *a*) : ;; *) ok=false ;; esac ;;
  esac
  if [ "$ok" = true ]; then
    echo "  ✅ $file — $info"
  else
    echo "  ❌ $file — got '$info', expected ${want_size} ($want_alpha)" >&2
    FAILED=1
  fi
}

validate "$OUT_ICON"    "${ICON_SIZE}x${ICON_SIZE}"       opaque
validate "$OUT_FG"      "${ICON_SIZE}x${ICON_SIZE}"       alpha
validate "$OUT_BG"      "${ICON_SIZE}x${ICON_SIZE}"       opaque
validate "$OUT_MONO"    "${ICON_SIZE}x${ICON_SIZE}"       alpha
validate "$OUT_FAVICON" "${FAVICON_SIZE}x${FAVICON_SIZE}" opaque
validate "$OUT_SPLASH"  "${SPLASH_SIZE}x${SPLASH_SIZE}"   alpha

# Monochrome sanity: opaque pixels must be pure white.
MONO_MEAN=$(magick "$OUT_MONO" -alpha off -format '%[fx:mean]' info:)
case $MONO_MEAN in
  1|1.0|0.99*|1.00*) echo "  ✅ $OUT_MONO — RGB mean $MONO_MEAN (pure white silhouette)" ;;
  *) echo "  ❌ $OUT_MONO — RGB mean $MONO_MEAN, expected ~1.0 (pure white)" >&2; FAILED=1 ;;
esac

if [ "$FAILED" -ne 0 ]; then
  echo ""
  echo "❌ Icon validation failed — see mismatches above." >&2
  exit 1
fi

echo ""
echo "✨ Done. 6 assets in $IMAGES_DIR/ match app.json references."
echo "   ℹ️  iOS Icon Composer bundle (assets/expo.icon) is NOT regenerated — update in"
echo "      Icon Composer or remove \"ios\".\"icon\" from app.json to use icon.png."
