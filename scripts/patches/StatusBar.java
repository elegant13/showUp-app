package com.capacitorjs.plugins.statusbar;

import android.content.res.Configuration;
import android.graphics.Color;
import android.util.DisplayMetrics;
import android.view.View;
import android.view.Window;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.ColorUtils;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

public class StatusBar {

    public static final String statusBarVisibilityChanged = "statusBarVisibilityChanged";
    public static final String statusBarOverlayChanged = "statusBarOverlayChanged";

    private int currentStatusBarColor = Color.TRANSPARENT;
    private boolean currentOverlays = true;
    private final ChangeListener listener;
    private final AppCompatActivity activity;
    private String currentStyle = "DEFAULT";

    public StatusBar(AppCompatActivity activity, StatusBarConfig config, ChangeListener listener) {
        this.activity = activity;
        this.listener = listener;
        setBackgroundColor(config.getBackgroundColor());
        setStyle(config.getStyle());
        setOverlaysWebView(config.isOverlaysWebView());
        StatusBarInfo info = getInfo();
        info.setVisible(true);
        listener.onChange(statusBarOverlayChanged, info);
    }

    public void setStyle(String style) {
        Window window = activity.getWindow();
        View decorView = window.getDecorView();
        this.currentStyle = style;
        if (style.equals("DEFAULT")) {
            style = getStyleForTheme();
        }

        WindowInsetsControllerCompat windowInsetsControllerCompat = WindowCompat.getInsetsController(window, decorView);
        windowInsetsControllerCompat.setAppearanceLightStatusBars(!style.equals("DARK"));
    }

    private String getStyleForTheme() {
        int currentNightMode = activity.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        if (currentNightMode != Configuration.UI_MODE_NIGHT_YES) {
            return "LIGHT";
        }
        return "DARK";
    }

    public void updateStyle() {
        setStyle(this.currentStyle);
    }

    public void setBackgroundColor(int color) {
        Window window = activity.getWindow();
        currentStatusBarColor = color;
        if (currentStyle.equals("DEFAULT")) {
            boolean isLightColor = ColorUtils.calculateLuminance(color) > 0.5;
            WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, window.getDecorView());
            insetsController.setAppearanceLightStatusBars(isLightColor);
        }
    }

    public void hide() {
        View decorView = activity.getWindow().getDecorView();
        WindowInsetsControllerCompat windowInsetsControllerCompat = WindowCompat.getInsetsController(activity.getWindow(), decorView);
        windowInsetsControllerCompat.hide(WindowInsetsCompat.Type.statusBars());
        StatusBarInfo info = getInfo();
        info.setVisible(false);
        listener.onChange(statusBarVisibilityChanged, info);
    }

    public void show() {
        View decorView = activity.getWindow().getDecorView();
        WindowInsetsControllerCompat windowInsetsControllerCompat = WindowCompat.getInsetsController(activity.getWindow(), decorView);
        windowInsetsControllerCompat.show(WindowInsetsCompat.Type.statusBars());
        StatusBarInfo info = getInfo();
        info.setVisible(true);
        listener.onChange(statusBarVisibilityChanged, info);
    }

    public void setOverlaysWebView(Boolean overlays) {
        boolean shouldOverlay = overlays != null ? overlays : true;
        currentOverlays = shouldOverlay;
        WindowCompat.setDecorFitsSystemWindows(activity.getWindow(), !shouldOverlay);
        listener.onChange(statusBarOverlayChanged, getInfo());
    }

    private boolean getIsOverlaid() {
        return currentOverlays;
    }

    public StatusBarInfo getInfo() {
        Window window = activity.getWindow();
        WindowInsetsCompat windowInsetsCompat = ViewCompat.getRootWindowInsets(window.getDecorView());
        boolean isVisible = windowInsetsCompat != null && windowInsetsCompat.isVisible(WindowInsetsCompat.Type.statusBars());
        StatusBarInfo info = new StatusBarInfo();
        info.setStyle(getStyle());
        info.setOverlays(getIsOverlaid());
        info.setVisible(isVisible);
        info.setColor(String.format("#%06X", 0xFFFFFF & currentStatusBarColor));
        info.setHeight(getStatusBarHeight());
        return info;
    }

    private String getStyle() {
        View decorView = activity.getWindow().getDecorView();
        String style = "DARK";
        WindowInsetsControllerCompat windowInsetsControllerCompat = WindowCompat.getInsetsController(activity.getWindow(), decorView);
        if (windowInsetsControllerCompat.isAppearanceLightStatusBars()) {
            style = "LIGHT";
        }
        return style;
    }

    private int getStatusBarHeight() {
        DisplayMetrics metrics = activity.getResources().getDisplayMetrics();
        WindowInsetsCompat windowInsetsCompat = ViewCompat.getRootWindowInsets(activity.getWindow().getDecorView());
        if (windowInsetsCompat != null) {
            Insets insets = windowInsetsCompat.getInsets(WindowInsetsCompat.Type.statusBars());
            return (int) (insets.top / metrics.density);
        }
        return 0;
    }

    public interface ChangeListener {
        void onChange(String eventName, StatusBarInfo info);
    }
}

