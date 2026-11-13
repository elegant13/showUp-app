# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Preserve annotations, signatures, and line numbers for Capacitor reflection & Play Console deobfuscation
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod,SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Keep AndroidX WebKit boundary interfaces used via dynamic Proxy reflection by WebViewCompat
-keep interface org.chromium.support_lib_boundary.** { *; }
-keep class org.chromium.support_lib_boundary.** { *; }
-keep class androidx.webkit.** { *; }

# Keep Capacitor core runtime, annotations, and plugins
-keep @interface com.getcapacitor.** { *; }
-keep class com.getcapacitor.** { *; }
-keep class com.showup.fitness.** { *; }
-keep class com.codetrixstudio.capacitor.GoogleAuth.** { *; }

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
