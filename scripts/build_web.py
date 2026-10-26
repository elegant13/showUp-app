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
    dirs = ['css', 'js']
    for d in dirs:
        src_dir = os.path.join(root, d)
        if os.path.exists(src_dir):
            shutil.copytree(src_dir, os.path.join(dest, d))

    print(f"Successfully packaged web assets into {dest}")

if __name__ == '__main__':
    build()
