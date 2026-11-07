# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Preserve line numbers for Crashlytics / Play Console deobfuscation
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Keep MainActivity and Capacitor BridgeActivity entrypoints
-keep class com.showup.fitness.MainActivity { *; }
-keep class com.getcapacitor.BridgeActivity { *; }

# Keep Capacitor plugins and their annotated plugin/callback methods
-keep @com.getcapacitor.annotation.CapacitorPlugin class * extends com.getcapacitor.Plugin {
    public <init>();
    @com.getcapacitor.PluginMethod public <methods>;
    @com.getcapacitor.annotation.ActivityCallback <methods>;
    @com.getcapacitor.annotation.PermissionCallback <methods>;
}
-keep class * extends com.getcapacitor.Plugin {
    public <init>();
    @com.getcapacitor.PluginMethod public <methods>;
    @com.getcapacitor.annotation.ActivityCallback <methods>;
    @com.getcapacitor.annotation.PermissionCallback <methods>;
}

# Keep WebView JavascriptInterface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-dontwarn com.google.android.gms.**
