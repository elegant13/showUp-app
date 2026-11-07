#!/usr/bin/env python3
import shutil
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PATCHES = [
    (
        os.path.join(ROOT, "scripts", "patches", "Plugin.swift"),
        os.path.join(ROOT, "node_modules", "@codetrix-studio", "capacitor-google-auth", "ios", "Plugin", "Plugin.swift"),
        "Plugin.swift",
    ),
    (
        os.path.join(ROOT, "scripts", "patches", "GoogleAuth.java"),
        os.path.join(ROOT, "node_modules", "@codetrix-studio", "capacitor-google-auth", "android", "src", "main", "java", "com", "codetrixstudio", "capacitor", "GoogleAuth", "GoogleAuth.java"),
        "GoogleAuth.java",
    ),
    (
        os.path.join(ROOT, "scripts", "patches", "StatusBar.java"),
        os.path.join(ROOT, "node_modules", "@capacitor", "status-bar", "android", "src", "main", "java", "com", "capacitorjs", "plugins", "statusbar", "StatusBar.java"),
        "StatusBar.java",
    ),
    (
        os.path.join(ROOT, "scripts", "patches", "SplashScreen.java"),
        os.path.join(ROOT, "node_modules", "@capacitor", "splash-screen", "android", "src", "main", "java", "com", "capacitorjs", "plugins", "splashscreen", "SplashScreen.java"),
        "SplashScreen.java",
    ),
    (
        os.path.join(ROOT, "scripts", "patches", "splash_styles.xml"),
        os.path.join(ROOT, "node_modules", "@capacitor", "splash-screen", "android", "src", "main", "res", "values", "styles.xml"),
        "splash_styles.xml",
    ),
]

for src, dest, label in PATCHES:
    if os.path.exists(src) and os.path.exists(os.path.dirname(dest)):
        shutil.copyfile(src, dest)
        print(f"✅ Applied {label} patch to {dest}")
