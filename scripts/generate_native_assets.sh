#!/bin/bash
set -e

SRC="assets/icon.png"
SPLASH="assets/splash.png"

echo "1. Updating iOS App Icon & Splash..."
cp "$SRC" ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png
sips -z 1600 1600 "$SPLASH" --out ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png > /dev/null
sips -z 1200 1200 "$SPLASH" --out ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png > /dev/null
sips -z 600 600 "$SPLASH" --out ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png > /dev/null

echo "2. Updating Android Mipmaps..."
sips -z 48 48 "$SRC" --out android/app/src/main/res/mipmap-mdpi/ic_launcher.png > /dev/null
sips -z 48 48 "$SRC" --out android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png > /dev/null
sips -z 48 48 "$SRC" --out android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png > /dev/null

sips -z 72 72 "$SRC" --out android/app/src/main/res/mipmap-hdpi/ic_launcher.png > /dev/null
sips -z 72 72 "$SRC" --out android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png > /dev/null
sips -z 72 72 "$SRC" --out android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png > /dev/null

sips -z 96 96 "$SRC" --out android/app/src/main/res/mipmap-xhdpi/ic_launcher.png > /dev/null
sips -z 96 96 "$SRC" --out android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png > /dev/null
sips -z 96 96 "$SRC" --out android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png > /dev/null

sips -z 144 144 "$SRC" --out android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png > /dev/null
sips -z 144 144 "$SRC" --out android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png > /dev/null
sips -z 144 144 "$SRC" --out android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png > /dev/null

sips -z 192 192 "$SRC" --out android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png > /dev/null
sips -z 192 192 "$SRC" --out android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png > /dev/null
sips -z 192 192 "$SRC" --out android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png > /dev/null

echo "3. Updating Android Splash Drawables..."
sips -z 480 320 "$SPLASH" --out android/app/src/main/res/drawable-port-mdpi/splash.png > /dev/null
sips -z 800 480 "$SPLASH" --out android/app/src/main/res/drawable-port-hdpi/splash.png > /dev/null
sips -z 1280 720 "$SPLASH" --out android/app/src/main/res/drawable-port-xhdpi/splash.png > /dev/null
sips -z 1600 960 "$SPLASH" --out android/app/src/main/res/drawable-port-xxhdpi/splash.png > /dev/null
sips -z 1920 1280 "$SPLASH" --out android/app/src/main/res/drawable-port-xxxhdpi/splash.png > /dev/null

sips -z 320 480 "$SPLASH" --out android/app/src/main/res/drawable-land-mdpi/splash.png > /dev/null
sips -z 480 800 "$SPLASH" --out android/app/src/main/res/drawable-land-hdpi/splash.png > /dev/null
sips -z 720 1280 "$SPLASH" --out android/app/src/main/res/drawable-land-xhdpi/splash.png > /dev/null
sips -z 960 1600 "$SPLASH" --out android/app/src/main/res/drawable-land-xxhdpi/splash.png > /dev/null
sips -z 1280 1920 "$SPLASH" --out android/app/src/main/res/drawable-land-xxxhdpi/splash.png > /dev/null

echo "All native assets generated successfully!"
