#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Resolve package name from build.gradle
// ---------------------------------------------------------------------------
const buildGradlePath = path.join(__dirname, '../android/app/build.gradle');
if (!fs.existsSync(buildGradlePath)) {
  console.error('android/app/build.gradle not found. Run "npx cap add android" first.');
  process.exit(1);
}

let buildGradle = fs.readFileSync(buildGradlePath, 'utf-8');
const appIdMatch = buildGradle.match(/applicationId\s*[=]?\s*["']([^"']+)["']/);
if (!appIdMatch) {
  console.error('Could not find applicationId in android/app/build.gradle');
  process.exit(1);
}

const packageName = appIdMatch[1];
const packagePath = packageName.replace(/\./g, '/');
const javaDir = path.join(__dirname, `../android/app/src/main/java/${packagePath}`);

if (!fs.existsSync(javaDir)) {
  console.error(`Java source directory not found: ${javaDir}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Patch 1: Fullscreen plugin
//
const pluginSource = `package ${packageName};

import android.graphics.Color;
import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AndroidFullscreen")
public class AndroidFullscreenPlugin extends Plugin {

    private View.OnFocusChangeListener focusChangeListener = null;

    private void enableInsetsInterceptor() {
        View contentView = getActivity().findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(contentView, (v, insets) -> {
            WindowInsetsCompat cleared = new WindowInsetsCompat.Builder(insets)
                .setInsets(
                    WindowInsetsCompat.Type.systemBars()
                        | WindowInsetsCompat.Type.displayCutout(),
                    Insets.NONE
                )
                .build();
            return ViewCompat.onApplyWindowInsets(v, cleared);
        });
        ((View) getBridge().getWebView().getParent()).setPadding(0, 0, 0, 0);
        ViewCompat.requestApplyInsets(contentView);
    }

    private void disableInsetsInterceptor() {
        View contentView = getActivity().findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(contentView, null);
        ViewCompat.requestApplyInsets(contentView);
    }

    @PluginMethod
    public void enable(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            android.view.Window window = getActivity().getWindow();
            android.view.View decorView = window.getDecorView();

            WindowCompat.setDecorFitsSystemWindows(window, false);
            window.setStatusBarColor(Color.TRANSPARENT);
            window.setNavigationBarColor(Color.TRANSPARENT);

            enableInsetsInterceptor();

            WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(window, decorView);
            controller.hide(WindowInsetsCompat.Type.systemBars());
            controller.setSystemBarsBehavior(
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            );

            decorView.setOnFocusChangeListener(null);
            focusChangeListener = (v, hasFocus) -> {
                if (hasFocus) {
                    decorView.postDelayed(
                        () -> controller.hide(WindowInsetsCompat.Type.systemBars()),
                        100
                    );
                }
            };
            decorView.setOnFocusChangeListener(focusChangeListener);
        });
        call.resolve();
    }

    @PluginMethod
    public void disable(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            android.view.Window window = getActivity().getWindow();
            android.view.View decorView = window.getDecorView();

            decorView.setOnFocusChangeListener(null);
            focusChangeListener = null;

            disableInsetsInterceptor();

            WindowCompat.setDecorFitsSystemWindows(window, false);

            WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(window, decorView);
            controller.show(WindowInsetsCompat.Type.systemBars());
        });
        call.resolve();
    }
}
`;

const pluginPath = path.join(javaDir, 'AndroidFullscreenPlugin.java');
fs.writeFileSync(pluginPath, pluginSource);
console.log(`Written:  ${pluginPath}`);

const mainActivityPath = path.join(javaDir, 'MainActivity.java');
if (!fs.existsSync(mainActivityPath)) {
  console.error(`MainActivity.java not found: ${mainActivityPath}`);
  process.exit(1);
}

let mainActivity = fs.readFileSync(mainActivityPath, 'utf-8');
if (mainActivity.includes('AndroidFullscreenPlugin')) {
  console.log('Skipped:  MainActivity.java (already patched)');
} else {
  mainActivity = mainActivity.replace(
    /public class MainActivity extends BridgeActivity \{\s*\}/,
    'import android.os.Bundle;\nimport android.webkit.WebSettings;\n\npublic class MainActivity extends BridgeActivity {\n\n    @Override\n    public void onCreate(Bundle savedInstanceState) {\n        registerPlugin(AndroidFullscreenPlugin.class);\n        super.onCreate(savedInstanceState);\n        WebSettings webSettings = getBridge().getWebView().getSettings();\n        webSettings.setMinimumFontSize(1);\n        webSettings.setMinimumLogicalFontSize(1);\n    }\n}'
  );
  fs.writeFileSync(mainActivityPath, mainActivity);
  console.log(`Patched:  ${mainActivityPath}`);
}

// ---------------------------------------------------------------------------
// Patch 2: Version (only when GITHUB_REF_NAME is set)
// ---------------------------------------------------------------------------
const refName = process.env.GITHUB_REF_NAME || '';
if (refName) {
  const versionName = refName.replace(/^v/, '') || '1.0';
  const parts = versionName.split(/[.\-]/);
  const major = parseInt(parts[0]) || 1;
  const minor = parseInt(parts[1]) || 0;
  const patch = parseInt(parts[2]) || 0;
  const versionCode = major * 1_000_000 + minor * 1_000 + patch;

  buildGradle = buildGradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
  buildGradle = buildGradle.replace(/versionName\s+"[^"]*"/, `versionName "${versionName}"`);
  console.log(`Versioned: versionName=${versionName}, versionCode=${versionCode}`);
} else {
  console.log('Skipped:  version patch (GITHUB_REF_NAME not set)');
}

// ---------------------------------------------------------------------------
// Patch 3: Signing config
// ---------------------------------------------------------------------------
const alreadyPatched = buildGradle.includes('GHS_APP_STORE_FILE') && buildGradle.includes('signingConfig signingConfigs.release');

if (alreadyPatched) {
  console.log('Skipped:  signing config (already patched)');
} else {
  if (!buildGradle.includes('GHS_APP_STORE_FILE')) {
    const signingConfigs = `
    signingConfigs {
        release {
            if (project.hasProperty("GHS_APP_STORE_FILE")) {
                storeFile file(project.property("GHS_APP_STORE_FILE"))
                storePassword project.property("GHS_APP_STORE_PASSWORD")
                keyAlias project.property("GHS_APP_KEY_ALIAS")
                keyPassword project.property("GHS_APP_KEY_PASSWORD")
            }
        }
    }

`;
    buildGradle = buildGradle.replace('android {', `android {${signingConfigs}`);
  }

  if (!buildGradle.includes('signingConfig signingConfigs.release')) {
    const signingConfigRef = `
            if (project.hasProperty("GHS_APP_STORE_FILE")) {
                signingConfig signingConfigs.release
            }
`;
    // Insert right after the "release {" line inside buildTypes
    buildGradle = buildGradle.replace(/(buildTypes\s*\{[\s\S]*?release\s*\{\n)/, `$1${signingConfigRef}`);
  }

  console.log('Patched:  signing config in android/app/build.gradle');
}

// Write build.gradle once with all patches applied
fs.writeFileSync(buildGradlePath, buildGradle);

console.log(`\nDone. Android patched for: ${packageName}`);
