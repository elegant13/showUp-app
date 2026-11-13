#!/usr/bin/env python3
import os
import re
import sys

def bump_version_code():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    gradle_file = os.path.join(root, 'android', 'app', 'build.gradle')
    config_file = os.path.join(root, 'js', 'config.js')
    html_file = os.path.join(root, 'index.html')

    if not os.path.exists(gradle_file):
        print(f"Error: Gradle file not found at {gradle_file}", file=sys.stderr)
        return False

    with open(gradle_file, 'r', encoding='utf-8') as f:
        content = f.read()

    match = re.search(r'versionCode\s+(\d+)', content)
    if not match:
        print("Error: Could not find versionCode in build.gradle", file=sys.stderr)
        return False

    current_code = int(match.group(1))
    new_code = current_code + 1
    new_version_name = f"1.0.{new_code}"

    updated_content = re.sub(
        r'versionCode\s+\d+',
        f'versionCode {new_code}',
        content,
        count=1
    )
    updated_content = re.sub(
        r'versionName\s+"[^"]+"',
        f'versionName "{new_version_name}"',
        updated_content,
        count=1
    )

    with open(gradle_file, 'w', encoding='utf-8') as f:
        f.write(updated_content)

    # Sync APP_VERSION_NAME and APP_BUILD_NUMBER in js/config.js
    if os.path.exists(config_file):
        with open(config_file, 'r', encoding='utf-8') as f:
            cfg = f.read()
        cfg = re.sub(r'const APP_VERSION_NAME = "[^"]+";', f'const APP_VERSION_NAME = "{new_version_name}";', cfg)
        cfg = re.sub(r'const APP_BUILD_NUMBER = \d+;', f'const APP_BUILD_NUMBER = {new_code};', cfg)
        with open(config_file, 'w', encoding='utf-8') as f:
            f.write(cfg)

    # Sync visible version badges in index.html
    if os.path.exists(html_file):
        with open(html_file, 'r', encoding='utf-8') as f:
            html = f.read()
        html = re.sub(
            r'(<span id="settings-header-version-pill"[^>]*>)[^<]*(</span>)',
            rf'\g<1>v{new_version_name} • Build {new_code}\g<2>',
            html
        )
        html = re.sub(
            r'(<span id="settings-app-version-badge"[^>]*>)[^<]*(</span>)',
            rf'\g<1>v{new_version_name} (Build {new_code})\g<2>',
            html
        )
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html)

    print(f"Successfully bumped Android versionCode: {current_code} -> {new_code} (versionName: {new_version_name})")
    return new_code

if __name__ == '__main__':
    bump_version_code()
