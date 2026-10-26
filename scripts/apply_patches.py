#!/usr/bin/env python3
import shutil
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# iOS patch
SRC_IOS = os.path.join(ROOT, "scripts", "patches", "Plugin.swift")
DEST_IOS = os.path.join(ROOT, "node_modules", "@codetrix-studio", "capacitor-google-auth", "ios", "Plugin", "Plugin.swift")
if os.path.exists(SRC_IOS) and os.path.exists(os.path.dirname(DEST_IOS)):
    shutil.copyfile(SRC_IOS, DEST_IOS)
    print(f"✅ Applied Plugin.swift patch to {DEST_IOS}")

# Android patch
SRC_ANDROID = os.path.join(ROOT, "scripts", "patches", "GoogleAuth.java")
DEST_ANDROID = os.path.join(ROOT, "node_modules", "@codetrix-studio", "capacitor-google-auth", "android", "src", "main", "java", "com", "codetrixstudio", "capacitor", "GoogleAuth", "GoogleAuth.java")
if os.path.exists(SRC_ANDROID) and os.path.exists(os.path.dirname(DEST_ANDROID)):
    shutil.copyfile(SRC_ANDROID, DEST_ANDROID)
    print(f"✅ Applied GoogleAuth.java patch to {DEST_ANDROID}")
