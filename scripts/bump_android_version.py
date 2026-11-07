#!/usr/bin/env python3
import os
import re
import sys

def bump_version_code():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    gradle_file = os.path.join(root, 'android', 'app', 'build.gradle')
    
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
    
    updated_content = re.sub(
        r'versionCode\s+\d+',
        f'versionCode {new_code}',
        content,
        count=1
    )
    
    with open(gradle_file, 'w', encoding='utf-8') as f:
        f.write(updated_content)
        
    print(f"Successfully bumped Android versionCode: {current_code} -> {new_code}")
    return new_code

if __name__ == '__main__':
    bump_version_code()
