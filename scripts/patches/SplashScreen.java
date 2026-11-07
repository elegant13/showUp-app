package com.capacitorjs.plugins.splashscreen;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ObjectAnimator;
import android.app.Activity;
import android.app.Dialog;
import android.content.Context;
import android.content.res.ColorStateList;
import android.content.res.Resources;
import android.graphics.PixelFormat;
import android.graphics.drawable.Animatable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.os.Build;
import android.os.Handler;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewTreeObserver;
import android.view.ViewTreeObserver.OnPreDrawListener;
import android.view.Window;
import android.view.WindowManager;
import android.view.animation.LinearInterpolator;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Logger;

/**
 * A Splash Screen service for showing and hiding a splash screen in the app.
 */
public class SplashScreen {

    private Dialog dialog;
    private View splashImage;
    private ProgressBar spinnerBar;
    private WindowManager windowManager;
    private boolean isVisible = false;
    private boolean isHiding = false;
    private Context context;
    private View content;
    private SplashScreenConfig config;
    private OnPreDrawListener onPreDrawListener;

    SplashScreen(Context context, SplashScreenConfig config) {
        this.context = context;
        this.config = config;
    }

    public void showOnLaunch(final AppCompatActivity activity) {
        if (config.getLaunchShowDuration() == 0) {
            return;
        }
        SplashScreenSettings settings = new SplashScreenSettings();
        settings.setShowDuration(config.getLaunchShowDuration());
        settings.setAutoHide(config.isLaunchAutoHide());

        try {
            showWithAndroid12API(activity, settings);
            return;
        } catch (Exception e) {
            Logger.warn("Android 12 Splash API failed... using previous method.");
            this.onPreDrawListener = null;
        }

        settings.setFadeInDuration(config.getLaunchFadeInDuration());
        if (config.isUsingDialog()) {
            showDialog(activity, settings, null, true);
        } else {
            show(activity, settings, null, true);
        }
    }

    private void showWithAndroid12API(final AppCompatActivity activity, final SplashScreenSettings settings) {
        if (activity == null || activity.isFinishing()) return;

        activity.runOnUiThread(() -> {
            androidx.core.splashscreen.SplashScreen windowSplashScreen = androidx.core.splashscreen.SplashScreen.installSplashScreen(
                activity
            );
            windowSplashScreen.setKeepOnScreenCondition(() -> isVisible || isHiding);

            if (config.getLaunchFadeOutDuration() > 0) {
                windowSplashScreen.setOnExitAnimationListener((windowSplashScreenView) -> {
                    final ObjectAnimator fadeAnimator = ObjectAnimator.ofFloat(windowSplashScreenView.getView(), View.ALPHA, 1f, 0f);
                    fadeAnimator.setInterpolator(new LinearInterpolator());
                    fadeAnimator.setDuration(config.getLaunchFadeOutDuration());

                    fadeAnimator.addListener(
                        new AnimatorListenerAdapter() {
                            @Override
                            public void onAnimationEnd(Animator animation) {
                                isHiding = false;
                                windowSplashScreenView.remove();
                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                                    activity.getSplashScreen().clearOnExitAnimationListener();
                                }
                            }
                        }
                    );

                    fadeAnimator.start();

                    isHiding = true;
                    isVisible = false;
                });
            }

            content = activity.findViewById(android.R.id.content);

            this.onPreDrawListener = new ViewTreeObserver.OnPreDrawListener() {
                @Override
                public boolean onPreDraw() {
                    if (!isVisible && !isHiding) {
                        isVisible = true;

                        new Handler(context.getMainLooper()).postDelayed(() -> {
                            if (settings.isAutoHide()) {
                                isVisible = false;
                                onPreDrawListener = null;
                                content.getViewTreeObserver().removeOnPreDrawListener(this);
                            }
                        }, settings.getShowDuration());
                    }

                    return false;
                }
            };

            content.getViewTreeObserver().addOnPreDrawListener(this.onPreDrawListener);
        });
    }

    public void show(final AppCompatActivity activity, final SplashScreenSettings settings, final SplashListener splashListener) {
        if (config.isUsingDialog()) {
            showDialog(activity, settings, splashListener, false);
        } else {
            show(activity, settings, splashListener, false);
        }
    }

    private void showDialog(
        final AppCompatActivity activity,
        final SplashScreenSettings settings,
        final SplashListener splashListener,
        final boolean isLaunchSplash
    ) {
        if (activity == null || activity.isFinishing()) return;

        if (isVisible) {
            splashListener.completed();
            return;
        }

        activity.runOnUiThread(() -> {
            if (config.isImmersive()) {
                dialog = new Dialog(activity, R.style.capacitor_immersive_style);
            } else if (config.isFullScreen()) {
                dialog = new Dialog(activity, R.style.capacitor_full_screen_style);
            } else {
                dialog = new Dialog(activity, R.style.capacitor_default_style);
            }
            int splashId = 0;
            if (config.getLayoutName() != null) {
                splashId = context.getResources().getIdentifier(config.getLayoutName(), "layout", context.getPackageName());
                if (splashId == 0) {
                    Logger.warn("Layout not found, using default");
                }
            }
            if (splashId != 0) {
                dialog.setContentView(splashId);
            } else {
                Drawable splash = getSplashDrawable();
                LinearLayout parent = new LinearLayout(context);
                parent.setLayoutParams(
                    new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)
                );
                parent.setOrientation(LinearLayout.VERTICAL);
                if (splash != null) {
                    parent.setBackground(splash);
                }
                dialog.setContentView(parent);
            }

            dialog.setCancelable(false);
            if (!dialog.isShowing()) {
                dialog.show();
            }
            isVisible = true;

            if (settings.isAutoHide()) {
                new Handler(context.getMainLooper()).postDelayed(() -> {
                    hideDialog(activity, isLaunchSplash);

                    if (splashListener != null) {
                        splashListener.completed();
                    }
                }, settings.getShowDuration());
            } else {
                if (splashListener != null) {
                    splashListener.completed();
                }
            }
        });
    }

    public void hide(SplashScreenSettings settings) {
        hide(settings.getFadeOutDuration(), false);
    }

    public void hideDialog(final AppCompatActivity activity) {
        hideDialog(activity, false);
    }

    public void onPause() {
        tearDown(true);
    }

    public void onDestroy() {
        tearDown(true);
    }

    private void buildViews() {
        if (splashImage == null) {
            int splashId = 0;
            Drawable splash;

            if (config.getLayoutName() != null) {
                splashId = context.getResources().getIdentifier(config.getLayoutName(), "layout", context.getPackageName());
                if (splashId == 0) {
                    Logger.warn("Layout not found, defaulting to ImageView");
                }
            }

            if (splashId != 0) {
                Activity activity = (Activity) context;
                LayoutInflater inflator = activity.getLayoutInflater();
                ViewGroup root = new FrameLayout(context);
                root.setLayoutParams(
                    new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
                );
                splashImage = inflator.inflate(splashId, root, false);
            } else {
                splash = getSplashDrawable();
                if (splash != null) {
                    if (splash instanceof Animatable) {
                        ((Animatable) splash).start();
                    }

                    if (splash instanceof LayerDrawable) {
                        LayerDrawable layeredSplash = (LayerDrawable) splash;

                        for (int i = 0; i < layeredSplash.getNumberOfLayers(); i++) {
                            Drawable layerDrawable = layeredSplash.getDrawable(i);

                            if (layerDrawable instanceof Animatable) {
                                ((Animatable) layerDrawable).start();
                            }
                        }
                    }

                    splashImage = new ImageView(context);
                    ImageView imageView = (ImageView) splashImage;
                    imageView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
                    imageView.setScaleType(config.getScaleType());
                    imageView.setImageDrawable(splash);
                } else {
                    return;
                }
            }

            splashImage.setFitsSystemWindows(true);

            if (config.getBackgroundColor() != null) {
                splashImage.setBackgroundColor(config.getBackgroundColor());
            }
        }

        if (spinnerBar == null) {
            if (config.getSpinnerStyle() != null) {
                int spinnerBarStyle = config.getSpinnerStyle();
                spinnerBar = new ProgressBar(context, null, spinnerBarStyle);
            } else {
                spinnerBar = new ProgressBar(context);
            }
            spinnerBar.setIndeterminate(true);

            Integer spinnerBarColor = config.getSpinnerColor();
            if (spinnerBarColor != null) {
                int[][] states = new int[][] {
                    new int[] { android.R.attr.state_enabled },
                    new int[] { -android.R.attr.state_enabled },
                    new int[] { -android.R.attr.state_checked },
                    new int[] { android.R.attr.state_pressed }
                };
                int[] colors = new int[] { spinnerBarColor, spinnerBarColor, spinnerBarColor, spinnerBarColor };
                ColorStateList colorStateList = new ColorStateList(states, colors);
                spinnerBar.setIndeterminateTintList(colorStateList);
            }
        }
    }

    private Drawable getSplashDrawable() {
        int splashId = context.getResources().getIdentifier(config.getResourceName(), "drawable", context.getPackageName());
        try {
            Drawable drawable = context.getResources().getDrawable(splashId, context.getTheme());
            return drawable;
        } catch (Resources.NotFoundException ex) {
            Logger.warn("No splash screen found, not displaying");
            return null;
        }
    }

    private void show(
        final AppCompatActivity activity,
        final SplashScreenSettings settings,
        final SplashListener splashListener,
        final boolean isLaunchSplash
    ) {
        windowManager = (WindowManager) activity.getSystemService(Context.WINDOW_SERVICE);

        if (activity.isFinishing()) {
            return;
        }

        buildViews();

        if (isVisible) {
            splashListener.completed();
            return;
        }

        final Animator.AnimatorListener listener = new Animator.AnimatorListener() {
            @Override
            public void onAnimationEnd(Animator animator) {
                isVisible = true;

                if (settings.isAutoHide()) {
                    new Handler(context.getMainLooper()).postDelayed(() -> {
                        hide(settings.getFadeOutDuration(), isLaunchSplash);

                        if (splashListener != null) {
                            splashListener.completed();
                        }
                    }, settings.getShowDuration());
                } else {
                    if (splashListener != null) {
                        splashListener.completed();
                    }
                }
            }

            @Override
            public void onAnimationCancel(Animator animator) {}

            @Override
            public void onAnimationRepeat(Animator animator) {}

            @Override
            public void onAnimationStart(Animator animator) {}
        };

        Handler mainHandler = new Handler(context.getMainLooper());

        mainHandler.post(() -> {
            WindowManager.LayoutParams params = new WindowManager.LayoutParams();
            params.gravity = Gravity.CENTER;
            params.flags = activity.getWindow().getAttributes().flags;

            params.format = PixelFormat.TRANSLUCENT;

            try {
                windowManager.addView(splashImage, params);
            } catch (IllegalStateException | IllegalArgumentException ex) {
                Logger.debug("Could not add splash view");
                return;
            }

            if (config.isImmersive()) {
                activity.runOnUiThread(() -> {
                    Window window = activity.getWindow();
                    WindowCompat.setDecorFitsSystemWindows(window, false);
                    WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, splashImage);
                    controller.hide(WindowInsetsCompat.Type.systemBars());
                    controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                });
            } else if (config.isFullScreen()) {
                activity.runOnUiThread(() -> {
                    Window window = activity.getWindow();
                    WindowCompat.setDecorFitsSystemWindows(window, false);
                    WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, splashImage);
                    controller.hide(WindowInsetsCompat.Type.statusBars());
                });
            }

            splashImage.setAlpha(0f);

            splashImage
                .animate()
                .alpha(1f)
                .setInterpolator(new LinearInterpolator())
                .setDuration(settings.getFadeInDuration())
                .setListener(listener)
                .start();

            splashImage.setVisibility(View.VISIBLE);

            if (spinnerBar != null) {
                spinnerBar.setVisibility(View.INVISIBLE);

                if (spinnerBar.getParent() != null) {
                    windowManager.removeView(spinnerBar);
                }

                params.height = WindowManager.LayoutParams.WRAP_CONTENT;
                params.width = WindowManager.LayoutParams.WRAP_CONTENT;

                windowManager.addView(spinnerBar, params);

                if (config.isShowSpinner()) {
                    spinnerBar.setAlpha(0f);

                    spinnerBar
                        .animate()
                        .alpha(1f)
                        .setInterpolator(new LinearInterpolator())
                        .setDuration(settings.getFadeInDuration())
                        .start();

                    spinnerBar.setVisibility(View.VISIBLE);
                }
            }
        });
    }

    private void hide(final int fadeOutDuration, boolean isLaunchSplash) {
        if (isLaunchSplash && isVisible) {
            Logger.debug(
                "SplashScreen was automatically hidden after the launch timeout. " +
                    "You should call `SplashScreen.hide()` as soon as your web app is loaded (or increase the timeout)." +
                    "Read more at https://capacitorjs.com/docs/apis/splash-screen#hiding-the-splash-screen"
            );
        }

        if (isHiding) {
            return;
        }

        if (null != this.onPreDrawListener) {
            if (fadeOutDuration != 200) {
                Logger.warn(
                    "fadeOutDuration parameter doesn't work on initial splash screen, use launchFadeOutDuration configuration option"
                );
            }
            this.isVisible = false;
            if (null != content) {
                content.getViewTreeObserver().removeOnPreDrawListener(this.onPreDrawListener);
            }
            this.onPreDrawListener = null;
            return;
        }

        if (splashImage == null || splashImage.getParent() == null) {
            return;
        }

        isHiding = true;

        final Animator.AnimatorListener listener = new Animator.AnimatorListener() {
            @Override
            public void onAnimationEnd(Animator animator) {
                tearDown(false);
            }

            @Override
            public void onAnimationCancel(Animator animator) {
                tearDown(false);
            }

            @Override
            public void onAnimationStart(Animator animator) {}

            @Override
            public void onAnimationRepeat(Animator animator) {}
        };

        Handler mainHandler = new Handler(context.getMainLooper());

        mainHandler.post(() -> {
            if (spinnerBar != null) {
                spinnerBar.setAlpha(1f);

                spinnerBar.animate().alpha(0).setInterpolator(new LinearInterpolator()).setDuration(fadeOutDuration).start();
            }

            splashImage.setAlpha(1f);

            splashImage
                .animate()
                .alpha(0)
                .setInterpolator(new LinearInterpolator())
                .setDuration(fadeOutDuration)
                .setListener(listener)
                .start();
        });
    }

    private void hideDialog(final AppCompatActivity activity, boolean isLaunchSplash) {
        if (isLaunchSplash && isVisible) {
            Logger.debug(
                "SplashScreen was automatically hidden after the launch timeout. " +
                    "You should call `SplashScreen.hide()` as soon as your web app is loaded (or increase the timeout)." +
                    "Read more at https://capacitorjs.com/docs/apis/splash-screen#hiding-the-splash-screen"
            );
        }

        if (isHiding) {
            return;
        }

        if (null != this.onPreDrawListener) {
            this.isVisible = false;
            if (null != content) {
                content.getViewTreeObserver().removeOnPreDrawListener(this.onPreDrawListener);
            }
            this.onPreDrawListener = null;
            return;
        }

        isHiding = true;

        activity.runOnUiThread(() -> {
            if (dialog != null && dialog.isShowing()) {
                if (!activity.isFinishing() && !activity.isDestroyed()) {
                    dialog.dismiss();
                }
                dialog = null;
                isHiding = false;
                isVisible = false;
            }
        });
    }

    private void tearDown(boolean removeSpinner) {
        if (spinnerBar != null && spinnerBar.getParent() != null) {
            spinnerBar.setVisibility(View.INVISIBLE);

            if (removeSpinner) {
                windowManager.removeView(spinnerBar);
            }
        }

        if (splashImage != null && splashImage.getParent() != null) {
            splashImage.setVisibility(View.INVISIBLE);

            windowManager.removeView(splashImage);
        }

        if (config.isFullScreen() || config.isImmersive()) {
            Window window = ((Activity) context).getWindow();
            WindowCompat.setDecorFitsSystemWindows(window, false);
        }
        isHiding = false;
        isVisible = false;
    }
}

