#!/usr/bin/env python3
"""
DRIP. Viral TikTok Content Generator
Generates "Banger" videos with modern effects for maximum engagement

Effects:
- Flash transitions (0.1s white screen)
- Zoom punch (1.0 -> 1.2 in 0.3s)
- Neon text with glow effect (rose #FF4D6D)
- Shake effect for urgency
- Blur-in transitions
- Rapid cuts (1-2s per scene)

Usage: python3 scripts/generate-viral-content.py
Output: public/ads/viral_banger_j9.mp4
"""

import json
import os
import math
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

# moviepy imports
from moviepy import (
    ImageClip,
    TextClip,
    CompositeVideoClip,
    ColorClip,
    concatenate_videoclips,
    VideoClip
)

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
DATA_FILE = PROJECT_ROOT / "src" / "data" / "tiktok-fiches-production.json"
OUTPUT_DIR = PROJECT_ROOT / "public" / "ads"
TEMP_DIR = PROJECT_ROOT / "scripts" / ".temp_images"

# TikTok dimensions (9:16)
VIDEO_WIDTH = 1080
VIDEO_HEIGHT = 1920
FPS = 30

# DRIP Colors
ROSE_NEON = "#FF4D6D"
ROSE_GLOW = "#FF6B8A"
GOLD = "#FFD700"
WHITE = "#FFFFFF"
BLACK = "#000000"
DARK_BG = "#1A1A2E"


def ensure_dirs():
    """Create necessary directories"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    TEMP_DIR.mkdir(parents=True, exist_ok=True)


def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def resize_for_tiktok(image_path: Path) -> Image.Image:
    """Resize and crop image to TikTok 9:16 format"""
    img = Image.open(image_path)

    # Convert to RGB if necessary
    if img.mode != 'RGB':
        img = img.convert('RGB')

    # Calculate target aspect ratio
    target_ratio = VIDEO_WIDTH / VIDEO_HEIGHT
    img_ratio = img.width / img.height

    if img_ratio > target_ratio:
        # Image is wider - crop sides
        new_width = int(img.height * target_ratio)
        left = (img.width - new_width) // 2
        img = img.crop((left, 0, left + new_width, img.height))
    else:
        # Image is taller - crop top/bottom
        new_height = int(img.width / target_ratio)
        top = (img.height - new_height) // 2
        img = img.crop((0, top, img.width, top + new_height))

    # Resize to target resolution
    img = img.resize((VIDEO_WIDTH, VIDEO_HEIGHT), Image.Resampling.LANCZOS)

    return img


# =============================================================================
# VIRAL EFFECTS
# =============================================================================

def flash_transition(duration=0.1):
    """
    Creates a white flash transition clip
    Used between scenes for impact
    """
    return ColorClip(
        size=(VIDEO_WIDTH, VIDEO_HEIGHT),
        color=(255, 255, 255)
    ).with_duration(duration)


def create_zoom_punch_clip(image_path: Path, duration: float = 1.5,
                           zoom_start: float = 1.0, zoom_peak: float = 1.2,
                           punch_time: float = 0.3):
    """
    Creates a clip with rapid zoom punch effect
    Zooms quickly from zoom_start to zoom_peak in punch_time
    Then holds at zoom_peak
    """
    pil_img = resize_for_tiktok(image_path)
    img_array = np.array(pil_img)

    def zoom_punch(t):
        if t < punch_time:
            # Rapid zoom in (ease out)
            progress = t / punch_time
            # Ease out cubic for punchy feel
            eased = 1 - pow(1 - progress, 3)
            return zoom_start + (zoom_peak - zoom_start) * eased
        else:
            return zoom_peak

    clip = (ImageClip(img_array)
            .with_duration(duration)
            .resized(lambda t: zoom_punch(t))
            .with_position('center'))

    return clip


def create_simple_image_clip(image_path: Path, duration: float = 1.5):
    """
    Creates a simple image clip without complex effects
    """
    pil_img = resize_for_tiktok(image_path)
    img_array = np.array(pil_img)

    clip = (ImageClip(img_array)
            .with_duration(duration)
            .with_position('center'))

    return clip


def create_blur_in_clip(image_path: Path, duration: float = 1.5, blur_time: float = 0.5):
    """
    Creates a clip that starts blurred and becomes sharp
    Uses frame-by-frame approach with VideoClip
    """
    pil_img = resize_for_tiktok(image_path)

    # Pre-compute blur levels
    blur_frames = []
    sharp_array = np.array(pil_img)

    # Create blurred versions
    blur_radii = [20, 15, 10, 5, 2, 0]
    for blur_radius in blur_radii:
        if blur_radius > 0:
            blurred = pil_img.filter(ImageFilter.GaussianBlur(blur_radius))
            blur_frames.append(np.array(blurred))
        else:
            blur_frames.append(sharp_array)

    def make_frame(t):
        if t < blur_time:
            progress = t / blur_time
            frame_idx = min(int(progress * (len(blur_frames) - 1)), len(blur_frames) - 1)
            return blur_frames[frame_idx]
        return sharp_array

    clip = VideoClip(make_frame, duration=duration)
    return clip


def create_shake_clip_frames(base_frames: np.ndarray, duration: float,
                             intensity: int = 5, frequency: int = 20):
    """
    Creates a clip with shake effect using VideoClip
    """
    def make_frame(t):
        frame = base_frames.copy()
        x_shift = int(intensity * math.sin(t * frequency * 2 * math.pi))
        y_shift = int(intensity * math.cos(t * frequency * 1.5 * math.pi))
        return np.roll(np.roll(frame, x_shift, axis=1), y_shift, axis=0)

    return VideoClip(make_frame, duration=duration)


def create_neon_text_image(text: str, font_size: int = 70,
                           text_color: str = WHITE,
                           glow_color: str = ROSE_NEON,
                           glow_intensity: int = 3) -> Image.Image:
    """
    Creates a text image with neon glow effect
    """
    # Load font
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        font = ImageFont.load_default()

    # Calculate text size
    dummy_img = Image.new('RGBA', (1, 1))
    draw = ImageDraw.Draw(dummy_img)
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # Create image with padding for glow
    padding = 50
    img_width = text_width + padding * 2
    img_height = text_height + padding * 2

    # Create transparent base
    img = Image.new('RGBA', (img_width, img_height), (0, 0, 0, 0))

    # Create glow layers
    glow_rgb = hex_to_rgb(glow_color)

    for i in range(glow_intensity, 0, -1):
        glow_layer = Image.new('RGBA', (img_width, img_height), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow_layer)

        # Draw glow text
        alpha = int(255 * (0.3 / i))
        glow_draw.text(
            (padding, padding),
            text,
            font=font,
            fill=(*glow_rgb, alpha)
        )

        # Blur the glow
        glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=5 * i))

        # Composite
        img = Image.alpha_composite(img, glow_layer)

    # Draw main text
    draw = ImageDraw.Draw(img)
    text_rgb = hex_to_rgb(text_color)

    # Add subtle shadow
    draw.text((padding + 2, padding + 2), text, font=font, fill=(0, 0, 0, 150))

    # Main text
    draw.text((padding, padding), text, font=font, fill=(*text_rgb, 255))

    return img


def create_neon_text_clip(text: str, duration: float,
                          font_size: int = 70,
                          text_color: str = WHITE,
                          glow_color: str = ROSE_NEON,
                          position: tuple = ('center', 'center'),
                          pulse: bool = False):
    """
    Creates an animated neon text clip with optional pulse
    """
    neon_img = create_neon_text_image(text, font_size, text_color, glow_color)
    neon_array = np.array(neon_img)

    if pulse:
        # Create pulsing clip using VideoClip
        def make_pulse_frame(t):
            # Pulse between 0.95 and 1.05 at 2Hz
            scale = 1.0 + 0.05 * math.sin(t * 4 * math.pi)
            h, w = neon_array.shape[:2]
            new_h, new_w = int(h * scale), int(w * scale)

            # Resize using PIL
            pil_img = Image.fromarray(neon_array)
            resized = pil_img.resize((new_w, new_h), Image.Resampling.LANCZOS)

            # Pad/crop to original size
            result = Image.new('RGBA', (w, h), (0, 0, 0, 0))
            offset_x = (w - new_w) // 2
            offset_y = (h - new_h) // 2
            result.paste(resized, (offset_x, offset_y))

            return np.array(result)

        clip = VideoClip(make_pulse_frame, duration=duration).with_position(position)
    else:
        clip = ImageClip(neon_array).with_duration(duration).with_position(position)

    return clip


def create_urgency_badge_animated(text: str = "J-9", duration: float = 2.0):
    """
    Creates an animated urgency badge with pulsing effect
    """
    badge_height = 120

    # Create base badge
    img = Image.new('RGBA', (VIDEO_WIDTH, badge_height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw gradient-like background
    rose_rgb = hex_to_rgb(ROSE_NEON)
    for i in range(badge_height):
        alpha = int(255 * (0.8 + 0.2 * (i / badge_height)))
        draw.line([(0, i), (VIDEO_WIDTH, i)], fill=(*rose_rgb, alpha))

    # Add text
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 50)
    except:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    x = (VIDEO_WIDTH - text_width) // 2
    y = (badge_height - text_height) // 2

    # Shadow
    draw.text((x + 2, y + 2), text, font=font, fill=(0, 0, 0, 100))
    draw.text((x, y), text, font=font, fill=WHITE)

    badge_array = np.array(img)

    clip = (ImageClip(badge_array)
            .with_duration(duration)
            .with_position(('center', VIDEO_HEIGHT - 150)))

    return clip


# =============================================================================
# SCENE BUILDERS
# =============================================================================

def build_hook_scene(image_path: Path, hook_text: str, duration: float = 3.0):
    """
    Scene 1: Hook puissant (0-3s)
    - Flash d'entree
    - Texte choc en neon rose
    - Effet blur-in sur l'image
    """
    # Background with blur-in effect
    bg_clip = create_blur_in_clip(image_path, duration=duration, blur_time=0.5)

    # Darken overlay for text visibility
    dark_overlay = (ColorClip(size=(VIDEO_WIDTH, VIDEO_HEIGHT), color=(0, 0, 0))
                    .with_duration(duration)
                    .with_opacity(0.4))

    # Neon hook text
    hook_clip = (create_neon_text_clip(
        hook_text,
        duration=duration - 0.3,
        font_size=65,
        text_color=WHITE,
        glow_color=ROSE_NEON,
        position=('center', 400),
        pulse=True
    ).with_start(0.3))

    # Compose scene
    scene = CompositeVideoClip(
        [bg_clip, dark_overlay, hook_clip],
        size=(VIDEO_WIDTH, VIDEO_HEIGHT)
    ).with_duration(duration)

    return scene


def build_product_reveal_scene(image_path: Path, product_text: str,
                               price_text: str, duration: float = 4.0):
    """
    Scene 2: Reveal produit (3-10s)
    - Zoom punch dynamique
    - Texte produit
    - Prix en or avec glow
    """
    # Background with zoom punch
    bg_clip = create_zoom_punch_clip(
        image_path,
        duration=duration,
        zoom_start=1.0,
        zoom_peak=1.15,
        punch_time=0.4
    )

    # Product text
    product_clip = (create_neon_text_clip(
        product_text,
        duration=duration - 0.5,
        font_size=55,
        text_color=WHITE,
        glow_color=ROSE_GLOW,
        position=('center', 350)
    ).with_start(0.3))

    # Price in gold
    price_clip = (create_neon_text_clip(
        price_text,
        duration=duration - 1.0,
        font_size=80,
        text_color=GOLD,
        glow_color=GOLD,
        position=('center', 1400),
        pulse=True
    ).with_start(1.0))

    scene = CompositeVideoClip(
        [bg_clip, product_clip, price_clip],
        size=(VIDEO_WIDTH, VIDEO_HEIGHT)
    ).with_duration(duration)

    return scene


def build_urgency_scene(duration: float = 3.0):
    """
    Scene 3: Urgence (10-15s)
    - Background sombre
    - "J-9" pulsant en gros
    - Badge livraison
    """
    # Dark background
    bg_color = hex_to_rgb(DARK_BG)
    bg_clip = ColorClip(
        size=(VIDEO_WIDTH, VIDEO_HEIGHT),
        color=bg_color
    ).with_duration(duration)

    # Create base frame for shake effect
    base_frame = np.full((VIDEO_HEIGHT, VIDEO_WIDTH, 3), bg_color, dtype=np.uint8)

    # Shake effect on background
    bg_shake = create_shake_clip_frames(base_frame, duration, intensity=3, frequency=15)

    # J-9 countdown - BIG and pulsing
    countdown_clip = create_neon_text_clip(
        "J-9",
        duration=duration,
        font_size=200,
        text_color=ROSE_NEON,
        glow_color=ROSE_NEON,
        position=('center', 700),
        pulse=True
    )

    # Subtitle
    subtitle_clip = (create_neon_text_clip(
        "LIVRAISON GARANTIE",
        duration=duration - 0.5,
        font_size=45,
        text_color=WHITE,
        glow_color=ROSE_GLOW,
        position=('center', 1000)
    ).with_start(0.5))

    # Date
    date_clip = (create_neon_text_clip(
        "avant le 14/02",
        duration=duration - 1.0,
        font_size=40,
        text_color=WHITE,
        glow_color=ROSE_GLOW,
        position=('center', 1100)
    ).with_start(1.0))

    scene = CompositeVideoClip(
        [bg_shake, countdown_clip, subtitle_clip, date_clip],
        size=(VIDEO_WIDTH, VIDEO_HEIGHT)
    ).with_duration(duration)

    return scene


def build_cta_scene(duration: float = 3.0):
    """
    Scene 4: CTA (15-20s)
    - Logo DRIP. central
    - "Lien en bio"
    """
    # Dark gradient background
    bg_clip = ColorClip(
        size=(VIDEO_WIDTH, VIDEO_HEIGHT),
        color=hex_to_rgb(DARK_BG)
    ).with_duration(duration)

    # DRIP logo
    logo_clip = (create_neon_text_clip(
        "DRIP.",
        duration=duration - 0.5,
        font_size=120,
        text_color=WHITE,
        glow_color=ROSE_NEON,
        position=('center', 800),
        pulse=True
    ).with_start(0.3))

    # Lien en bio
    cta_clip = (create_neon_text_clip(
        "Lien en bio",
        duration=duration - 1.0,
        font_size=50,
        text_color=WHITE,
        glow_color=ROSE_GLOW,
        position=('center', 1050)
    ).with_start(0.8))

    # Urgency badge at bottom
    badge_clip = (create_urgency_badge_animated(
        "COMMANDE MAINTENANT",
        duration=duration - 0.5
    ).with_start(0.5))

    scene = CompositeVideoClip(
        [bg_clip, logo_clip, cta_clip, badge_clip],
        size=(VIDEO_WIDTH, VIDEO_HEIGHT)
    ).with_duration(duration)

    return scene


def build_quick_cut_scene(image_path: Path, text: str, duration: float = 1.5):
    """
    Quick cut scene for rapid montage
    - Fast zoom punch
    - Bold text overlay
    """
    bg_clip = create_zoom_punch_clip(
        image_path,
        duration=duration,
        zoom_start=1.05,
        zoom_peak=1.2,
        punch_time=0.2
    )

    text_clip = (create_neon_text_clip(
        text,
        duration=duration - 0.2,
        font_size=60,
        text_color=WHITE,
        glow_color=ROSE_NEON,
        position=('center', 900)
    ).with_start(0.1))

    scene = CompositeVideoClip(
        [bg_clip, text_clip],
        size=(VIDEO_WIDTH, VIDEO_HEIGHT)
    ).with_duration(duration)

    return scene


# =============================================================================
# MAIN VIDEO GENERATOR
# =============================================================================

def generate_viral_banger():
    """
    Generates the viral "Banger" video
    Structure:
    - Hook (0-3s): Texte choc + blur-in
    - Flash + Reveal (3-7s): Zoom dynamique + prix
    - Quick cuts (7-12s): Montage rapide
    - Urgence (12-16s): J-9 pulsant + shake
    - CTA (16-20s): DRIP. + lien en bio
    """
    print("=" * 60)
    print("DRIP. VIRAL BANGER GENERATOR")
    print("Saint-Valentin 2026 - J-9")
    print("=" * 60)

    ensure_dirs()

    # Load production data
    print("\nLoading production data...")
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Get image paths
    img_projecteur = TEMP_DIR / "projecteur_main.jpg"
    img_ambiance = TEMP_DIR / "projecteur_ambiance.jpg"
    img_body = TEMP_DIR / "body_main.jpg"
    img_lifestyle = TEMP_DIR / "body_lifestyle.jpg"

    # Check images exist
    for img in [img_projecteur, img_ambiance, img_body, img_lifestyle]:
        if not img.exists():
            print(f"WARNING: Missing image {img}")

    scenes = []

    print("\nBuilding viral scenes...")

    # === SCENE 1: HOOK (0-3s) ===
    print("  [1/6] Building hook scene...")
    hook_scene = build_hook_scene(
        img_projecteur,
        "Le resto etait complet...",
        duration=3.0
    )
    scenes.append(hook_scene)

    # === FLASH TRANSITION ===
    print("  [2/6] Adding flash transition...")
    flash1 = flash_transition(0.1)
    scenes.append(flash1)

    # === SCENE 2: PRODUCT REVEAL (3-7s) ===
    print("  [3/6] Building product reveal...")
    reveal_scene = build_product_reveal_scene(
        img_ambiance,
        "CINEMA PRIVE",
        "89 Euro",
        duration=4.0
    )
    scenes.append(reveal_scene)

    # === FLASH + QUICK CUTS (7-12s) ===
    print("  [4/6] Building quick cuts montage...")
    flash2 = flash_transition(0.08)
    scenes.append(flash2)

    # Quick cut 1
    cut1 = build_quick_cut_scene(img_body, "BODY SCULPTANT", duration=1.5)
    scenes.append(cut1)

    flash3 = flash_transition(0.08)
    scenes.append(flash3)

    # Quick cut 2
    cut2 = build_quick_cut_scene(img_lifestyle, "35 Euro", duration=1.5)
    scenes.append(cut2)

    flash4 = flash_transition(0.08)
    scenes.append(flash4)

    # Quick cut 3 - Lifestyle
    cut3 = build_quick_cut_scene(img_projecteur, "EFFET WOW", duration=1.5)
    scenes.append(cut3)

    # === SCENE 3: URGENCY (12-16s) ===
    print("  [5/6] Building urgency scene...")
    flash5 = flash_transition(0.1)
    scenes.append(flash5)

    urgency_scene = build_urgency_scene(duration=3.5)
    scenes.append(urgency_scene)

    # === SCENE 4: CTA (16-20s) ===
    print("  [6/6] Building CTA scene...")
    flash6 = flash_transition(0.1)
    scenes.append(flash6)

    cta_scene = build_cta_scene(duration=3.5)
    scenes.append(cta_scene)

    # === FINAL COMPOSITION ===
    print("\nConcatenating scenes...")
    final_video = concatenate_videoclips(scenes, method="compose")

    # Add persistent urgency badge
    badge = (create_urgency_badge_animated("J-9 | Livraison Garantie", final_video.duration)
             .with_position(('center', VIDEO_HEIGHT - 120)))

    final_with_badge = CompositeVideoClip(
        [final_video, badge],
        size=(VIDEO_WIDTH, VIDEO_HEIGHT)
    )

    # Export
    output_path = OUTPUT_DIR / "viral_banger_j9.mp4"
    print(f"\nExporting to: {output_path}")
    print("This may take a minute...")

    final_with_badge.write_videofile(
        str(output_path),
        fps=FPS,
        codec='libx264',
        audio=False,
        preset='medium',
        threads=4
    )

    # Calculate duration
    total_duration = final_with_badge.duration

    print("\n" + "=" * 60)
    print("VIRAL BANGER GENERATED!")
    print("=" * 60)
    print(f"\nOutput: {output_path}")
    print(f"Duration: {total_duration:.1f} seconds")
    print(f"Resolution: {VIDEO_WIDTH}x{VIDEO_HEIGHT}")
    print(f"FPS: {FPS}")

    return {
        "output_path": str(output_path),
        "duration": total_duration,
        "resolution": f"{VIDEO_WIDTH}x{VIDEO_HEIGHT}",
        "fps": FPS,
        "effects": [
            "flash_transition (0.1s white screen)",
            "zoom_punch (1.0 -> 1.2 in 0.3s)",
            "neon_text (#FF4D6D glow)",
            "shake_effect (urgency scene)",
            "blur_in (hook reveal)",
            "rapid_cuts (1.5s scenes)"
        ]
    }


if __name__ == "__main__":
    result = generate_viral_banger()

    print("\n" + "=" * 60)
    print("GENERATION REPORT")
    print("=" * 60)
    print(f"""
DRIP. Viral Banger - Saint-Valentin J-9
========================================

VIDEO OUTPUT:
- Path: {result['output_path']}
- Duration: {result['duration']:.1f}s
- Resolution: {result['resolution']}
- FPS: {result['fps']}

EFFECTS IMPLEMENTED:
""")
    for effect in result['effects']:
        print(f"  [OK] {effect}")

    print("""
VIDEO STRUCTURE:
  0-3s   : Hook (blur-in + texte choc neon)
  3-3.1s : Flash transition
  3.1-7s : Product reveal (zoom punch + prix or)
  7-12s  : Quick cuts montage (3 scenes rapides)
  12-16s : Urgence (J-9 pulsant + shake)
  16-20s : CTA (DRIP. logo + lien en bio)

NEXT STEPS:
  1. Add trending music in CapCut/TikTok
  2. Upload following the publication calendar
  3. Use hashtags: #SaintValentin2026 #TikTokMadeMeBuyIt
""")
