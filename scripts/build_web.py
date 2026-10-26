#!/usr/bin/env python3
import os
import shutil

def build():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dest = os.path.join(root, 'www')
    if os.path.exists(dest):
        shutil.rmtree(dest)
    os.makedirs(dest, exist_ok=True)

    # Copy files
    files = ['index.html', 'privacy.html', 'terms.html', 'logo.png', 'showup_emblem.png']
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

if __name__ == '__main__':
    build()
