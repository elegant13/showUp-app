#!/usr/bin/env python3
import hashlib
import json
import os
import re
import shutil
import zipfile

def compute_and_sync_content_hash(root, files, dirs):
    hasher = hashlib.sha256()
    for fname in sorted(files):
        fpath = os.path.join(root, fname)
        if os.path.exists(fpath):
            hasher.update(fname.encode('utf-8'))
            with open(fpath, 'rb') as f:
                hasher.update(f.read())

    for d in sorted(dirs):
        dpath = os.path.join(root, d)
        if not os.path.exists(dpath):
            continue
        for dirpath, dirnames, filenames in os.walk(dpath):
            dirnames[:] = sorted([dn for dn in dirnames if not dn.startswith('.') and dn != '__MACOSX'])
            for fname in sorted(filenames):
                if fname.startswith('.') or fname == '.DS_Store':
                    continue
                full_path = os.path.join(dirpath, fname)
                rel_path = os.path.relpath(full_path, root).replace(os.sep, '/')
                hasher.update(rel_path.encode('utf-8'))
                if rel_path == 'js/config.js':
                    with open(full_path, 'r', encoding='utf-8') as f:
                        cfg_text = f.read()
                    normalized = re.sub(r'const\s+APP_CONTENT_HASH\s*=\s*"[^"]*";', 'const APP_CONTENT_HASH = "";', cfg_text)
                    hasher.update(normalized.encode('utf-8'))
                else:
                    with open(full_path, 'rb') as f:
                        hasher.update(f.read())

    content_hash = hasher.hexdigest()[:12]
    config_file = os.path.join(root, 'js', 'config.js')
    if os.path.exists(config_file):
        with open(config_file, 'r', encoding='utf-8') as f:
            cfg_text = f.read()
        updated_cfg = re.sub(
            r'const\s+APP_CONTENT_HASH\s*=\s*"[^"]*";',
            f'const APP_CONTENT_HASH = "{content_hash}";',
            cfg_text
        )
        if updated_cfg != cfg_text:
            with open(config_file, 'w', encoding='utf-8') as f:
                f.write(updated_cfg)
    return content_hash

def generate_ota_bundle(root, www_dir, content_hash):
    config_file = os.path.join(root, 'js', 'config.js')
    version_name = "1.0.9"
    build_number = 9
    if os.path.exists(config_file):
        with open(config_file, 'r', encoding='utf-8') as f:
            cfg = f.read()
        m_ver = re.search(r'const\s+APP_VERSION_NAME\s*=\s*"([^"]+)"', cfg)
        m_bld = re.search(r'const\s+APP_BUILD_NUMBER\s*=\s*(\d+)', cfg)
        if m_ver:
            version_name = m_ver.group(1)
        if m_bld:
            build_number = int(m_bld.group(1))

    ota_dir = os.path.join(root, 'ota')
    os.makedirs(ota_dir, exist_ok=True)
    zip_path = os.path.join(ota_dir, 'showup-bundle.zip')

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for dirpath, dirnames, filenames in os.walk(www_dir):
            dirnames[:] = sorted([d for d in dirnames if not d.startswith('.') and d != '__MACOSX'])
            for fname in sorted(filenames):
                if fname.startswith('.') or fname == '.DS_Store':
                    continue
                full_path = os.path.join(dirpath, fname)
                rel_path = os.path.relpath(full_path, www_dir).replace(os.sep, '/')
                zinfo = zipfile.ZipInfo(rel_path, date_time=(2026, 1, 1, 0, 0, 0))
                zinfo.compress_type = zipfile.ZIP_DEFLATED
                zinfo.external_attr = 0o644 << 16
                with open(full_path, 'rb') as src_f:
                    zf.writestr(zinfo, src_f.read())

    sha256_hash = hashlib.sha256()
    with open(zip_path, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            sha256_hash.update(chunk)
    checksum = sha256_hash.hexdigest()

    version_manifest = {
        "version": f"{version_name}-{content_hash[:8]}",
        "versionName": version_name,
        "build": build_number,
        "contentHash": content_hash,
        "url": "https://trackshowup.app/ota/showup-bundle.zip",
        "checksum": checksum
    }
    manifest_path = os.path.join(ota_dir, 'version.json')
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(version_manifest, f, indent=2)

    print(f"Generated OTA bundle: {zip_path} (version={version_manifest['version']}, checksum={checksum[:12]}...)")

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
    dirs = ['css', 'js', 'assets']
    content_hash = compute_and_sync_content_hash(root, files, dirs)

    for f in files:
        src_path = os.path.join(root, f)
        if os.path.exists(src_path):
            shutil.copy2(src_path, os.path.join(dest, f))

    # Copy directories
    for d in dirs:
        src_dir = os.path.join(root, d)
        if os.path.exists(src_dir):
            shutil.copytree(src_dir, os.path.join(dest, d))

    print(f"Successfully packaged web assets into {dest}")
    generate_ota_bundle(root, dest, content_hash)

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
