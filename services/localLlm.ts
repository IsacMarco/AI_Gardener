import { initLlama, type LlamaContext, type CompletionParams, type TokenData, type RNLlamaOAICompatibleMessage } from "llama.rn";
import { NativeModules, Platform } from "react-native";
import { Directory, File, Paths } from "expo-file-system";

// ─── Model filenames (must match files in android/app/src/main/assets/) ─
const MODEL_FILENAME = "Qwen3.5-2B.Q4_K_M.gguf";
const MMPROJ_FILENAME = "Qwen3.5-2B.BF16-mmproj.gguf";
const MODELS_DIR_NAME = "llm-models";

// Native module for copying from Android bundled assets to filesystem
// Access via global turbo module proxy (New Arch) or NativeModules bridge (Old Arch)
const AssetCopyModule: { copyAssetToFilesystem(assetName: string, destPath: string): Promise<string> } =
  (global as any).__turboModuleProxy?.("AssetCopyModule") ??
  NativeModules.AssetCopyModule;

// ─── Types ──────────────────────────────────────────────────────────────
type OnTokenCallback = (token: string) => void;

export type ModelStatus =
  | "idle"
  | "copying"
  | "loading"
  | "ready"
  | "error"
  | "generating";

// ─── Singleton state ────────────────────────────────────────────────────
let llamaContext: LlamaContext | null = null;
let currentStatus: ModelStatus = "idle";
let initPromise: Promise<void> | null = null;

/**
 * Returns the current status of the local model.
 */
export const getModelStatus = (): ModelStatus => currentStatus;

/**
 * Get or create the models directory in the app's document folder.
 */
const getModelsDirectory = () => {
  return new Directory(Paths.document, MODELS_DIR_NAME);
};

/**
 * Ensure the models directory exists.
 */
const ensureModelsDirectory = () => {
  const dir = getModelsDirectory();
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
};

/**
 * Copy a model file from Android's bundled assets (inside the APK)
 * to the app's document directory. Skips if file already exists.
 * Returns the filesystem path.
 */
const copyModelFromAssets = async (fileName: string): Promise<string> => {
  const modelsDir = ensureModelsDirectory();
  const destinationFile = new File(modelsDir, fileName);

  // Skip copy if the file already exists (subsequent launches)
  if (destinationFile.exists) {
    console.log(`[LocalLLM] ${fileName} already exists, skipping copy`);
    // Return the filesystem path (not file:// URI)
    return destinationFile.uri.replace("file://", "");
  }

  console.log(`[LocalLLM] Copying ${fileName} from bundled assets...`);

  // Use the native AssetCopyModule to stream-copy from APK assets to filesystem
  const destPath = destinationFile.uri.replace("file://", "");
  await AssetCopyModule.copyAssetToFilesystem(fileName, destPath);

  console.log(`[LocalLLM] ${fileName} copied successfully`);
  return destPath;
};

/**
 * Initialize the local Qwen model. This is idempotent — calling it
 * multiple times returns the same promise if one is already in flight.
 */
export const initializeLocalModel = async (
  onStatusChange?: (status: ModelStatus) => void,
): Promise<void> => {
  // If already ready, nothing to do
  if (llamaContext && currentStatus === "ready") return;

  // If already initializing, wait for the existing promise
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // ── Step 1: Copy model files from APK assets to document dir ──
      currentStatus = "copying";
      onStatusChange?.("copying");

      const [modelPath, mmprojPath] = await Promise.all([
        copyModelFromAssets(MODEL_FILENAME),
        copyModelFromAssets(MMPROJ_FILENAME),
      ]);

      // ── Step 2: Initialize llama.rn context ──
      currentStatus = "loading";
      onStatusChange?.("loading");

      console.log("[LocalLLM] Initializing model context...");

      llamaContext = await initLlama({
        model: modelPath,
        n_ctx: 2048,
        n_gpu_layers: Platform.OS === "ios" ? 99 : 32, // Metal on iOS, conservative on Android
        use_mlock: true,
        flash_attn: Platform.OS === "ios", // Stable on iOS Metal, risky on some Android GPUs
      });

      // Initialize multimodal (vision) support with the projector model
      console.log("[LocalLLM] Initializing multimodal support...");
      await llamaContext.initMultimodal({
        path: mmprojPath,
        use_gpu: true,
      });

      currentStatus = "ready";
      onStatusChange?.("ready");
      console.log("[LocalLLM] Model initialized and ready!");
    } catch (error) {
      currentStatus = "error";
      onStatusChange?.("error");
      console.error("[LocalLLM] Initialization error:", error);
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
};

/**
 * Generate a response from the local model using ChatML-formatted messages.
 *
 * @param messages - Array of messages in OpenAI-compatible format (role + content).
 *                   llama.rn will apply the ChatML template from the model's GGUF metadata.
 * @param onToken - Optional callback invoked for each generated token (streaming)
 * @param base64Image - Optional base64-encoded image for multimodal analysis
 * @returns The full generated text
 */
export const generateResponse = async (
  messages: RNLlamaOAICompatibleMessage[],
  onToken?: OnTokenCallback,
  base64Image?: string | null,
): Promise<string> => {
  if (!llamaContext) {
    throw new Error("Model not initialized. Call initializeLocalModel() first.");
  }

  currentStatus = "generating";

  try {
    // Build the completion params using messages (ChatML template auto-applied)
    const completionParams: CompletionParams = {
      messages,
      n_predict: 1024,
      temperature: 0.7,
      top_p: 0.9,
      top_k: 40,
      enable_thinking: false, // Don't show <think>...</think> reasoning in output
      stop: [
        "<|end_of_text|>",
        "<|im_end|>",
        "<|endoftext|>",
      ],
    };

    // If there's an image, add it as a media path (data URI)
    if (base64Image) {
      completionParams.media_paths = [
        `data:image/jpeg;base64,${base64Image}`,
      ];
    }

    // Run completion with streaming callback
    const result = await llamaContext.completion(
      completionParams,
      (data: TokenData) => {
        if (data.token && onToken) {
          onToken(data.token);
        }
      },
    );

    currentStatus = "ready";
    return result.text.trim();
  } catch (error) {
    currentStatus = "ready";
    console.error("[LocalLLM] Generation error:", error);
    throw error;
  }
};

/**
 * Release the model context and free memory.
 */
export const releaseLocalModel = async (): Promise<void> => {
  if (llamaContext) {
    try {
      await llamaContext.release();
      console.log("[LocalLLM] Model context released");
    } catch (error) {
      console.error("[LocalLLM] Release error:", error);
    }
    llamaContext = null;
  }
  currentStatus = "idle";
  initPromise = null;
};
