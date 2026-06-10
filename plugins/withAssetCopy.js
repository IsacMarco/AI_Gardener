/**
 * Expo config plugin that adds a small native Java module to the Android
 * project. This module exposes a method to copy files from Android's
 * bundled assets (inside the APK) to the app's filesystem at runtime.
 *
 * This is necessary because llama.cpp (via llama.rn) needs real filesystem
 * paths to load model files, but Android's bundled assets are packed inside
 * the APK and aren't accessible via regular file paths.
 */
const { withDangerousMod, withMainApplication } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const PACKAGE_NAME = "com.marco.aigardener";
const PACKAGE_DIR = PACKAGE_NAME.replace(/\./g, "/");

// ─── Java source: AssetCopyModule ──────────────────────────────────────
const ASSET_COPY_MODULE_JAVA = `package ${PACKAGE_NAME};

import android.content.res.AssetManager;
import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * Native module that copies files from Android bundled assets to the filesystem.
 * Used to make GGUF model files available to llama.cpp at runtime.
 */
public class AssetCopyModule extends ReactContextBaseJavaModule {

    AssetCopyModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    @NonNull
    public String getName() {
        return "AssetCopyModule";
    }

    /**
     * Copy a file from the app's bundled assets to a destination on the filesystem.
     * Skips copying if the destination already exists with the same size.
     *
     * @param assetName   The filename inside the assets folder (e.g. "model.gguf")
     * @param destPath    The absolute filesystem path to copy to
     * @param promise     Promise resolved with the destination path on success
     */
    @ReactMethod
    public void copyAssetToFilesystem(String assetName, String destPath, Promise promise) {
        try {
            File destFile = new File(destPath);

            // Check if already copied (compare file size with asset size)
            if (destFile.exists()) {
                AssetManager assetManager = getReactApplicationContext().getAssets();
                InputStream checkStream = assetManager.open(assetName);
                long assetSize = 0;
                byte[] skipBuf = new byte[8192];
                int read;
                while ((read = checkStream.read(skipBuf)) != -1) {
                    assetSize += read;
                }
                checkStream.close();

                if (destFile.length() == assetSize) {
                    promise.resolve(destPath);
                    return;
                }
            }

            // Ensure parent directory exists
            File parentDir = destFile.getParentFile();
            if (parentDir != null && !parentDir.exists()) {
                parentDir.mkdirs();
            }

            // Stream copy from assets to filesystem
            AssetManager assetManager = getReactApplicationContext().getAssets();
            InputStream input = assetManager.open(assetName);
            OutputStream output = new FileOutputStream(destFile);

            byte[] buffer = new byte[1024 * 1024]; // 1MB buffer for large files
            int length;
            while ((length = input.read(buffer)) > 0) {
                output.write(buffer, 0, length);
            }

            output.flush();
            output.close();
            input.close();

            promise.resolve(destPath);
        } catch (Exception e) {
            promise.reject("ASSET_COPY_ERROR", "Failed to copy asset: " + assetName, e);
        }
    }
}
`;

// ─── Java source: AssetCopyPackage ─────────────────────────────────────
const ASSET_COPY_PACKAGE_JAVA = `package ${PACKAGE_NAME};

import androidx.annotation.NonNull;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class AssetCopyPackage implements ReactPackage {
    @NonNull
    @Override
    public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new AssetCopyModule(reactContext));
        return modules;
    }

    @NonNull
    @Override
    public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
`;

function withAssetCopy(config) {
  // Step 1: Write the Java source files
  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const javaDir = path.join(
        projectRoot,
        "android",
        "app",
        "src",
        "main",
        "java",
        ...PACKAGE_DIR.split("/")
      );

      // Ensure directory exists
      if (!fs.existsSync(javaDir)) {
        fs.mkdirSync(javaDir, { recursive: true });
      }

      // Write AssetCopyModule.java
      const modulePath = path.join(javaDir, "AssetCopyModule.java");
      fs.writeFileSync(modulePath, ASSET_COPY_MODULE_JAVA);
      console.log("[withAssetCopy] Created AssetCopyModule.java");

      // Write AssetCopyPackage.java
      const packagePath = path.join(javaDir, "AssetCopyPackage.java");
      fs.writeFileSync(packagePath, ASSET_COPY_PACKAGE_JAVA);
      console.log("[withAssetCopy] Created AssetCopyPackage.java");

      return config;
    },
  ]);

  // Step 2: Register the package in MainApplication
  config = withMainApplication(config, (config) => {
    const contents = config.modResults.contents;

    // Check if already added
    if (contents.includes("AssetCopyPackage")) {
      return config;
    }

    // Add import statement (Kotlin style, no semicolons)
    const importStatement = `import ${PACKAGE_NAME}.AssetCopyPackage\n`;
    const lastImportIndex = contents.lastIndexOf("import ");
    const endOfLastImport = contents.indexOf("\n", lastImportIndex) + 1;
    let modified = contents.slice(0, endOfLastImport) + importStatement + contents.slice(endOfLastImport);

    // Add package registration inside the .apply { } block
    // Kotlin MainApplication uses: PackageList(this).packages.apply { ... }
    const applyBlockMatch = modified.match(/\.apply\s*\{[^}]*\}/);
    if (applyBlockMatch) {
      const applyBlock = applyBlockMatch[0];
      const closingBraceIndex = applyBlock.lastIndexOf("}");
      const newApplyBlock =
        applyBlock.slice(0, closingBraceIndex) +
        "              add(AssetCopyPackage())\n            " +
        applyBlock.slice(closingBraceIndex);
      modified = modified.replace(applyBlock, newApplyBlock);
    }

    config.modResults.contents = modified;
    console.log("[withAssetCopy] Registered AssetCopyPackage in MainApplication");

    return config;
  });

  return config;
}

module.exports = withAssetCopy;
