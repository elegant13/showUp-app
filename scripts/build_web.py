#!/usr/bin/env python3
import json
import os
import shutil

def sync_capacitor_configs(root):
    root_cfg_path = os.path.join(root, 'capacitor.config.json')
    if not os.path.exists(root_cfg_path):
        return
    with open(root_cfg_path, 'r', encoding='utf-8') as f:
        root_cfg = json.load(f)

    # 1. Sync Android capacitor.config.json
    android_cfg_path = os.path.join(root, 'android', 'app', 'src', 'main', 'assets', 'capacitor.config.json')
    if os.path.exists(os.path.dirname(android_cfg_path)):
        with open(android_cfg_path, 'w', encoding='utf-8') as f:
            json.dump(root_cfg, f, indent='\t')
        print(f"Synced Capacitor config to Android: {android_cfg_path}")

    # 2. Sync iOS capacitor.config.json (preserving packageClassList if present)
    ios_cfg_path = os.path.join(root, 'ios', 'App', 'App', 'capacitor.config.json')
    if os.path.exists(os.path.dirname(ios_cfg_path)):
        ios_cfg = dict(root_cfg)
        if os.path.exists(ios_cfg_path):
            try:
                with open(ios_cfg_path, 'r', encoding='utf-8') as f:
                    existing_ios = json.load(f)
                if 'packageClassList' in existing_ios:
                    ios_cfg['packageClassList'] = existing_ios['packageClassList']
            except Exception:
                pass
        if 'packageClassList' not in ios_cfg:
            ios_cfg['packageClassList'] = [
                "HapticsPlugin",
                "LocalNotificationsPlugin",
                "SplashScreenPlugin",
                "StatusBarPlugin",
                "CapacitorUpdaterPlugin",
                "GoogleAuth"
            ]
        with open(ios_cfg_path, 'w', encoding='utf-8') as f:
            json.dump(ios_cfg, f, indent='\t')
        print(f"Synced Capacitor config to iOS: {ios_cfg_path}")

def build():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # Apply native plugin patches automatically
    try:
        import apply_patches  # noqa: F401
    except Exception:
        pass

    dest = os.path.join(root, 'www')
    if os.path.exists(dest):
        shutil.rmtree(dest)
    os.makedirs(dest, exist_ok=True)

    # Copy files
    files = ['index.html', 'privacy.html', 'terms.html', 'logo.png', 'showup_emblem.png', 'sitemap.xml', 'robots.txt']
    for f in files:
        src_path = os.path.join(root, f)
        if os.path.exists(src_path):
            shutil.copy2(src_path, os.path.join(dest, f))

    # Copy directories
    dirs = ['css', 'js', 'assets']
    for d in dirs:
        src_dir = os.path.join(root, d)
        if os.path.exists(src_dir):
            shutil.copytree(src_dir, os.path.join(dest, d))

    print(f"Successfully packaged web assets into {dest}")

    # Sync to iOS public directory if it exists
    ios_public = os.path.join(root, 'ios', 'App', 'App', 'public')
    if os.path.exists(ios_public):
        shutil.rmtree(ios_public)
        shutil.copytree(dest, ios_public)
        print(f"Successfully synced web assets to iOS: {ios_public}")

    # Sync to Android assets public directory if it exists
    android_public = os.path.join(root, 'android', 'app', 'src', 'main', 'assets', 'public')
    if os.path.exists(android_public):
        shutil.rmtree(android_public)
        shutil.copytree(dest, android_public)
        print(f"Successfully synced web assets to Android: {android_public}")

    sync_capacitor_configs(root)

if __name__ == '__main__':
    build()
