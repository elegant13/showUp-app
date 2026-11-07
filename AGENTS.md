# Agent Guidelines for showUp

## Android Releases & Version Codes
- **Never reuse a `versionCode`**: Google Play Console permanently reserves every uploaded `versionCode` across all release and testing tracks. Any attempt to upload a previously used `versionCode` will be rejected by Play Console.
- **Always bump before building**: Whenever creating or preparing an Android release bundle (`bundleRelease`) or APK (`assembleRelease`), always run `python3 scripts/bump_android_version.py` or increment `versionCode` in `android/app/build.gradle` to ensure it is strictly greater than the last used code.
- **Target API Level**: Maintain `targetSdkVersion` and `compileSdkVersion` at 36 or higher.
- **Release Signing**: Always use the production release keystore (`android/app/showup-release-key.jks` via `android/key.properties`). Never use debug certificates for Play Console builds.
