/**
 * Expo config plugin that copies GGUF model files directly into the
 * Android app's assets folder during prebuild. This bypasses Metro
 * (which can't handle files >512MB) and makes them available via
 * Android's native AssetManager at runtime.
 */
const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const GGUF_SOURCE_DIR = "assets/qwen_finetune_mobile_gguf";
const GGUF_FILES = [
  "Qwen3.5-2B.Q4_K_M.gguf",
  "Qwen3.5-2B.BF16-mmproj.gguf",
];

function withGgufAssets(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidAssetsDir = path.join(
        projectRoot,
        "android",
        "app",
        "src",
        "main",
        "assets"
      );

      // Ensure the Android assets directory exists
      if (!fs.existsSync(androidAssetsDir)) {
        fs.mkdirSync(androidAssetsDir, { recursive: true });
      }

      for (const fileName of GGUF_FILES) {
        const source = path.join(projectRoot, GGUF_SOURCE_DIR, fileName);
        const destination = path.join(androidAssetsDir, fileName);

        if (!fs.existsSync(source)) {
          console.warn(
            `[withGgufAssets] WARNING: Source file not found: ${source}`
          );
          continue;
        }

        // Skip if destination already exists and has the same size
        if (fs.existsSync(destination)) {
          const srcStat = fs.statSync(source);
          const dstStat = fs.statSync(destination);
          if (srcStat.size === dstStat.size) {
            console.log(
              `[withGgufAssets] ${fileName} already exists in android assets, skipping`
            );
            continue;
          }
        }

        console.log(
          `[withGgufAssets] Copying ${fileName} to android assets...`
        );
        fs.copyFileSync(source, destination);
        console.log(`[withGgufAssets] ${fileName} copied successfully`);
      }

      // Patch build.gradle to add aaptOptions { noCompress 'gguf' }
      // This prevents AAPT2 from trying to compress the large model files
      const buildGradlePath = path.join(
        projectRoot,
        "android",
        "app",
        "build.gradle"
      );
      if (fs.existsSync(buildGradlePath)) {
        let buildGradle = fs.readFileSync(buildGradlePath, "utf8");
        if (!buildGradle.includes("noCompress 'gguf'")) {
          // Insert aaptOptions before the closing brace of the android block
          buildGradle = buildGradle.replace(
            /androidResources\s*\{[^}]*\}/,
            (match) =>
              match +
              `\n    aaptOptions {\n        noCompress 'gguf'\n    }`
          );
          fs.writeFileSync(buildGradlePath, buildGradle);
          console.log("[withGgufAssets] Added aaptOptions noCompress for gguf");
        }
      }

      return config;
    },
  ]);
}

module.exports = withGgufAssets;
