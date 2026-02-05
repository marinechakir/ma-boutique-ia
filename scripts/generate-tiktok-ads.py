#!/usr/bin/env python3
"""
DRIP. TikTok Ads Generator
Generates promotional videos from tiktok-fiches-production.json

Usage: python3 scripts/generate-tiktok-ads.py
Output: public/ads/*.mp4
"""

import json
import os
import requests
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np

# moviepy imports
from moviepy import (
    ImageClip,
    TextClip,
    CompositeVideoClip,
    ColorClip,
    concatenate_videoclips
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

# Colors
ROSE_PRIMARY = "#FF4D6D"
ROSE_SECONDARY = "#FF6B8A"
GOLD = "#FFD700"
WHITE = "#FFFFFF"
BLACK = "#000000"


def ensure_dirs():
    """Create necessary directories"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    TEMP_DIR.mkdir(parents=True, exist_ok=True)


def download_image(url: str, name: str) -> Path:
    """Download image from URL and save locally"""
    filepath = TEMP_DIR / f"{name}.jpg"

    if filepath.exists():
        print(f"  Using cached: {name}")
        return filepath

    print(f"  Downloading: {url[:50]}...")
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        with open(filepath, 'wb') as f:
            f.write(response.content)

        return filepath
    except Exception as e:
        print(f"  ERROR downloading {name}: {e}")
        return None


def resize_for_tiktok(image_path: Path) -> Image.Image:
    """Resize and crop image to TikTok 9:16 format"""
    img = Image.open(image_path)

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


def create_text_overlay(
    text: str,
    width: int = VIDEO_WIDTH,
    font_size: int = 60,
    color: str = WHITE,
    bg_color: str = None,
    padding: int = 20
) -> Image.Image:
    """Create a text overlay image with optional background"""
    # Use system font
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

    # Create image with padding
    img_width = min(text_width + padding * 2, width)
    img_height = text_height + padding * 2

    if bg_color:
        img = Image.new('RGBA', (img_width, img_height), bg_color)
    else:
        img = Image.new('RGBA', (img_width, img_height), (0, 0, 0, 0))

    draw = ImageDraw.Draw(img)

    # Center text
    x = (img_width - text_width) // 2
    y = (img_height - text_height) // 2

    # Add shadow for visibility
    if not bg_color:
        draw.text((x + 2, y + 2), text, font=font, fill=(0, 0, 0, 180))

    draw.text((x, y), text, font=font, fill=color)

    return img


def create_urgency_badge() -> Image.Image:
    """Create the urgency badge banner"""
    badge_height = 80
    img = Image.new('RGBA', (VIDEO_WIDTH, badge_height), ROSE_PRIMARY)
    draw = ImageDraw.Draw(img)

    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 36)
    except:
        font = ImageFont.load_default()

    text = "LIVRAISON GARANTIE AVANT LE 14/02"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    x = (VIDEO_WIDTH - text_width) // 2
    y = (badge_height - text_height) // 2

    draw.text((x, y), text, font=font, fill=WHITE)

    return img


def create_scene_with_text(
    image_path: Path,
    duration: float,
    overlays: list,
    zoom_effect: bool = True
) -> CompositeVideoClip:
    """Create a video scene from image with text overlays"""

    # Load and resize image
    pil_img = resize_for_tiktok(image_path)
    img_array = np.array(pil_img)

    # Create base image clip
    if zoom_effect:
        # Ken Burns effect - slight zoom in
        def zoom_in(t):
            zoom = 1 + (t / duration) * 0.1  # 10% zoom over duration
            return zoom

        img_clip = (ImageClip(img_array)
                   .with_duration(duration)
                   .resized(lambda t: zoom_in(t))
                   .with_position('center'))
    else:
        img_clip = ImageClip(img_array).with_duration(duration)

    clips = [img_clip]

    # Add text overlays
    for overlay in overlays:
        text = overlay.get('text', '')
        start = overlay.get('start', 0)
        end = overlay.get('end', duration)
        position = overlay.get('position', 'center')
        font_size = overlay.get('font_size', 50)
        color = overlay.get('color', 'white')

        if not text:
            continue

        try:
            txt_clip = (TextClip(
                text=text,
                font_size=font_size,
                color=color,
                font='/System/Library/Fonts/Helvetica.ttc',
                stroke_color='black',
                stroke_width=2
            )
            .with_position(position)
            .with_start(start)
            .with_duration(end - start))

            clips.append(txt_clip)
        except Exception as e:
            print(f"  Warning: Could not create text '{text}': {e}")

    return CompositeVideoClip(clips, size=(VIDEO_WIDTH, VIDEO_HEIGHT))


def generate_projecteur_video(data: dict) -> str:
    """Generate the projector ad video"""
    print("\n[1/3] Generating: Projecteur (89 Euro)")

    fiche = data['fiche_1_projecteur']
    images = fiche['images_cj']
    overlays_data = fiche['overlays_texte']

    # Download images
    img_principale = download_image(images['principale'], 'projecteur_main')
    img_ambiance = download_image(images['ambiance'], 'projecteur_ambiance')
    img_lifestyle = download_image(images['lifestyle'], 'projecteur_lifestyle')

    scenes = []

    # Scene 1: Hook (0-5s)
    if img_principale:
        scene1 = create_scene_with_text(
            img_principale,
            duration=5,
            overlays=[
                {
                    'text': "Le resto a 150 Euro etait complet...",
                    'start': 0,
                    'end': 4,
                    'position': ('center', 300),
                    'font_size': 55,
                    'color': 'white'
                }
            ]
        )
        scenes.append(scene1)

    # Scene 2: Product reveal (5-15s)
    if img_ambiance:
        scene2 = create_scene_with_text(
            img_ambiance,
            duration=10,
            overlays=[
                {
                    'text': "Alors j'ai cree NOTRE cinema",
                    'start': 0,
                    'end': 4,
                    'position': ('center', 400),
                    'font_size': 50,
                    'color': 'white'
                },
                {
                    'text': "89 Euro - UNE SEULE FOIS",
                    'start': 5,
                    'end': 10,
                    'position': ('center', 1400),
                    'font_size': 60,
                    'color': 'gold'
                }
            ]
        )
        scenes.append(scene2)

    # Scene 3: Lifestyle + CTA (15-30s)
    if img_lifestyle:
        scene3 = create_scene_with_text(
            img_lifestyle,
            duration=15,
            overlays=[
                {
                    'text': "Netflix sur 120 pouces",
                    'start': 0,
                    'end': 5,
                    'position': ('center', 400),
                    'font_size': 55,
                    'color': 'white'
                },
                {
                    'text': "Sur mon plafond.",
                    'start': 5,
                    'end': 10,
                    'position': ('center', 500),
                    'font_size': 50,
                    'color': 'white'
                },
                {
                    'text': "Lien en bio - DRIP.",
                    'start': 10,
                    'end': 15,
                    'position': ('center', 1500),
                    'font_size': 45,
                    'color': 'white'
                }
            ]
        )
        scenes.append(scene3)

    if not scenes:
        print("  ERROR: No scenes created!")
        return None

    # Concatenate scenes
    final = concatenate_videoclips(scenes, method="compose")

    # Add urgency badge at bottom
    badge_img = create_urgency_badge()
    badge_array = np.array(badge_img.convert('RGB'))
    badge_clip = (ImageClip(badge_array)
                  .with_duration(final.duration)
                  .with_position(('center', VIDEO_HEIGHT - 100)))

    final_with_badge = CompositeVideoClip(
        [final, badge_clip],
        size=(VIDEO_WIDTH, VIDEO_HEIGHT)
    )

    # Export
    output_path = OUTPUT_DIR / "ad_projecteur_89.mp4"
    print(f"  Exporting to: {output_path}")

    final_with_badge.write_videofile(
        str(output_path),
        fps=FPS,
        codec='libx264',
        audio=False,
        preset='medium',
        threads=4
    )

    return str(output_path)


def generate_body_video(data: dict) -> str:
    """Generate the body sculptant ad video"""
    print("\n[2/3] Generating: Body Sculptant (35 Euro)")

    fiche = data['fiche_2_body']
    images = fiche['images_cj']

    # Download images
    img_principale = download_image(images['principale'], 'body_main')
    img_detail = download_image(images['detail'], 'body_detail')
    img_lifestyle = download_image(images['lifestyle'], 'body_lifestyle')

    scenes = []

    # Scene 1: Hook (0-5s)
    if img_principale:
        scene1 = create_scene_with_text(
            img_principale,
            duration=5,
            overlays=[
                {
                    'text': "Le cadeau qu'elle veut VRAIMENT",
                    'start': 0,
                    'end': 4,
                    'position': ('center', 300),
                    'font_size': 50,
                    'color': 'white'
                }
            ]
        )
        scenes.append(scene1)

    # Scene 2: Product details (5-15s)
    if img_detail:
        scene2 = create_scene_with_text(
            img_detail,
            duration=10,
            overlays=[
                {
                    'text': "Pas un parfum. Pas des fleurs.",
                    'start': 0,
                    'end': 3,
                    'position': ('center', 400),
                    'font_size': 45,
                    'color': 'gray'
                },
                {
                    'text': "LA CONFIANCE EN SOI",
                    'start': 3,
                    'end': 8,
                    'position': ('center', 500),
                    'font_size': 55,
                    'color': '#FFB6C1'
                },
                {
                    'text': "Seamless - Tummy Control - XS-3XL",
                    'start': 8,
                    'end': 10,
                    'position': ('center', 1400),
                    'font_size': 40,
                    'color': 'white'
                }
            ]
        )
        scenes.append(scene2)

    # Scene 3: Transformation + CTA (15-25s)
    if img_lifestyle:
        scene3 = create_scene_with_text(
            img_lifestyle,
            duration=10,
            overlays=[
                {
                    'text': "35 Euro - Le dupe Skims",
                    'start': 0,
                    'end': 5,
                    'position': ('center', 400),
                    'font_size': 55,
                    'color': '#FFB6C1'
                },
                {
                    'text': "Effet WOW garanti",
                    'start': 5,
                    'end': 8,
                    'position': ('center', 500),
                    'font_size': 50,
                    'color': 'white'
                },
                {
                    'text': "Lien en bio - DRIP.",
                    'start': 8,
                    'end': 10,
                    'position': ('center', 1500),
                    'font_size': 45,
                    'color': 'white'
                }
            ]
        )
        scenes.append(scene3)

    if not scenes:
        print("  ERROR: No scenes created!")
        return None

    # Concatenate scenes
    final = concatenate_videoclips(scenes, method="compose")

    # Add urgency badge
    badge_img = create_urgency_badge()
    badge_array = np.array(badge_img.convert('RGB'))
    badge_clip = (ImageClip(badge_array)
                  .with_duration(final.duration)
                  .with_position(('center', VIDEO_HEIGHT - 100)))

    final_with_badge = CompositeVideoClip(
        [final, badge_clip],
        size=(VIDEO_WIDTH, VIDEO_HEIGHT)
    )

    # Export
    output_path = OUTPUT_DIR / "ad_body_sculptant_35.mp4"
    print(f"  Exporting to: {output_path}")

    final_with_badge.write_videofile(
        str(output_path),
        fps=FPS,
        codec='libx264',
        audio=False,
        preset='medium',
        threads=4
    )

    return str(output_path)


def generate_compilation_video(data: dict) -> str:
    """Generate the compilation ad video (3 gadgets)"""
    print("\n[3/3] Generating: Compilation 3 Cadeaux")

    # Use images from both products + create colored backgrounds
    fiche1 = data['fiche_1_projecteur']
    fiche2 = data['fiche_2_body']

    # Download images
    img_projecteur = download_image(fiche1['images_cj']['principale'], 'projecteur_main')
    img_body = download_image(fiche2['images_cj']['principale'], 'body_main')

    scenes = []

    # Scene 1: Hook (0-5s) - Dark background with text
    hook_bg = Image.new('RGB', (VIDEO_WIDTH, VIDEO_HEIGHT), (30, 30, 40))
    hook_path = TEMP_DIR / "compilation_hook.jpg"
    hook_bg.save(hook_path)

    scene1 = create_scene_with_text(
        hook_path,
        duration=5,
        zoom_effect=False,
        overlays=[
            {
                'text': "3 cadeaux pour eviter",
                'start': 0,
                'end': 2,
                'position': ('center', 700),
                'font_size': 55,
                'color': 'white'
            },
            {
                'text': "le celibat le 15/02",
                'start': 1.5,
                'end': 5,
                'position': ('center', 800),
                'font_size': 55,
                'color': '#FF4D6D'
            }
        ]
    )
    scenes.append(scene1)

    # Scene 2: Projecteur (5-15s)
    if img_projecteur:
        scene2 = create_scene_with_text(
            img_projecteur,
            duration=10,
            overlays=[
                {
                    'text': "#1 Cinema prive",
                    'start': 0,
                    'end': 3,
                    'position': ('center', 400),
                    'font_size': 55,
                    'color': 'gold'
                },
                {
                    'text': "89 Euro",
                    'start': 3,
                    'end': 10,
                    'position': ('center', 1400),
                    'font_size': 70,
                    'color': 'gold'
                }
            ]
        )
        scenes.append(scene2)

    # Scene 3: Body (15-25s)
    if img_body:
        scene3 = create_scene_with_text(
            img_body,
            duration=10,
            overlays=[
                {
                    'text': "#2 Body sculptant",
                    'start': 0,
                    'end': 3,
                    'position': ('center', 400),
                    'font_size': 55,
                    'color': '#FFB6C1'
                },
                {
                    'text': "35 Euro",
                    'start': 3,
                    'end': 10,
                    'position': ('center', 1400),
                    'font_size': 70,
                    'color': '#FFB6C1'
                }
            ]
        )
        scenes.append(scene3)

    # Scene 4: Station charge - use gradient background
    tech_bg = Image.new('RGB', (VIDEO_WIDTH, VIDEO_HEIGHT), (40, 50, 80))
    tech_path = TEMP_DIR / "compilation_tech.jpg"
    tech_bg.save(tech_path)

    scene4 = create_scene_with_text(
        tech_path,
        duration=8,
        zoom_effect=False,
        overlays=[
            {
                'text': "#3 Station de charge",
                'start': 0,
                'end': 3,
                'position': ('center', 400),
                'font_size': 55,
                'color': '#87CEEB'
            },
            {
                'text': "45 Euro",
                'start': 3,
                'end': 8,
                'position': ('center', 1400),
                'font_size': 70,
                'color': '#87CEEB'
            }
        ]
    )
    scenes.append(scene4)

    # Scene 5: Countdown + CTA (33-45s)
    cta_bg = Image.new('RGB', (VIDEO_WIDTH, VIDEO_HEIGHT), (50, 30, 40))
    cta_path = TEMP_DIR / "compilation_cta.jpg"
    cta_bg.save(cta_path)

    scene5 = create_scene_with_text(
        cta_path,
        duration=10,
        zoom_effect=False,
        overlays=[
            {
                'text': "PLUS QUE 9 JOURS",
                'start': 0,
                'end': 5,
                'position': ('center', 700),
                'font_size': 70,
                'color': '#FF4D6D'
            },
            {
                'text': "Lien en bio",
                'start': 5,
                'end': 10,
                'position': ('center', 900),
                'font_size': 55,
                'color': 'white'
            },
            {
                'text': "DRIP.",
                'start': 7,
                'end': 10,
                'position': ('center', 1000),
                'font_size': 80,
                'color': 'white'
            }
        ]
    )
    scenes.append(scene5)

    # Concatenate scenes
    final = concatenate_videoclips(scenes, method="compose")

    # Add urgency badge
    badge_img = create_urgency_badge()
    badge_array = np.array(badge_img.convert('RGB'))
    badge_clip = (ImageClip(badge_array)
                  .with_duration(final.duration)
                  .with_position(('center', VIDEO_HEIGHT - 100)))

    final_with_badge = CompositeVideoClip(
        [final, badge_clip],
        size=(VIDEO_WIDTH, VIDEO_HEIGHT)
    )

    # Export
    output_path = OUTPUT_DIR / "ad_compilation_3cadeaux.mp4"
    print(f"  Exporting to: {output_path}")

    final_with_badge.write_videofile(
        str(output_path),
        fps=FPS,
        codec='libx264',
        audio=False,
        preset='medium',
        threads=4
    )

    return str(output_path)


def main():
    print("=" * 60)
    print("DRIP. TikTok Ads Generator")
    print("Saint-Valentin 2026 Campaign")
    print("=" * 60)

    # Setup
    ensure_dirs()

    # Load data
    print("\nLoading production data...")
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Campaign: {data['campagne']}")
    print(f"Countdown: {data['countdown']}")
    print(f"Deadline: {data['date_limite_livraison']}")

    # Generate videos
    results = []

    try:
        video1 = generate_projecteur_video(data)
        if video1:
            results.append(("Projecteur 89 Euro", video1))
    except Exception as e:
        print(f"  ERROR generating projecteur video: {e}")

    try:
        video2 = generate_body_video(data)
        if video2:
            results.append(("Body Sculptant 35 Euro", video2))
    except Exception as e:
        print(f"  ERROR generating body video: {e}")

    try:
        video3 = generate_compilation_video(data)
        if video3:
            results.append(("Compilation 3 Cadeaux", video3))
    except Exception as e:
        print(f"  ERROR generating compilation video: {e}")

    # Summary
    print("\n" + "=" * 60)
    print("GENERATION COMPLETE!")
    print("=" * 60)

    if results:
        print(f"\nGenerated {len(results)} videos:")
        for name, path in results:
            print(f"  - {name}: {path}")

        print(f"\nOutput directory: {OUTPUT_DIR}")
        print("\nNext steps:")
        print("  1. Add music/voiceover in CapCut or TikTok")
        print("  2. Upload to TikTok following the calendar")
        print("  3. Use provided hashtags and captions")
    else:
        print("\nNo videos were generated. Check errors above.")

    return results


if __name__ == "__main__":
    main()
