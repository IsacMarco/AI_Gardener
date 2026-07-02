# 🌿 AI Gardener

A mobile application that helps users identify plant diseases and manage their garden using a locally-running AI model. Built with React Native (Expo) and powered by a fine-tuned Qwen3.5-2B model running entirely on-device via llama.cpp — no internet required for AI features.

<p align="center">
  <img src="assets/images/logo.png" alt="AI Gardener Logo" width="180" />
</p>

> **Platform:** Developed and tested on **Android**. The core app (authentication, plant management, marketplace) uses cross-platform libraries and should work on iOS as well. However, the on-device AI feature currently relies on Android-specific native plugins for bundling the GGUF model files into the APK — an equivalent iOS configuration would need to be added to load the models from the iOS app bundle.

---

## ✨ Features

### 🤖 On-Device AI Assistant
- **Offline plant diagnosis** — a fine-tuned Qwen3.5-2B Vision model runs locally on the phone using llama.cpp (via `llama.rn`)
- **Image analysis** — take a photo of a leaf and get instant species identification & disease diagnosis
- **Conversational chat** — multi-turn chat with streaming responses, conversation history, and voice input
- **Context-aware** — the AI has access to your saved plants and provides personalized care advice

### 🌱 Plant Management
- **Add, edit, and delete plants** with photos, species, and location
- **Watering reminders** — configurable push notifications with custom frequency and time
- **Plant gallery** — browse your collection with detailed plant cards

### 🗺️ Marketplace / Nearby Garden Shops
- **Find nearby garden stores** using OpenStreetMap (Overpass API) with multi-endpoint fallback
- **Interactive MapLibre map** with shop markers, categories, and distance calculations
- **Google Maps navigation** — one-tap directions to any store
- **Smart caching** — results cached with 500m proximity logic to reduce API calls

### 🔐 Authentication
- **Email & Password** login and registration with real-time password validation
- **Google Sign-In** with Firebase Authentication
- **Password recovery** via Firebase email reset
- **Protected routes** with automatic redirect based on auth state

### 🌍 Internationalization
- Multi-language support (English, Romanian, Spanish, French, German) via a custom `I18nContext`

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Expo](https://expo.dev) (SDK 54) with React Native 0.81 (New Architecture) |
| **Language** | TypeScript |
| **Routing** | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based) |
| **Styling** | [NativeWind](https://www.nativewind.dev/) (TailwindCSS for React Native) |
| **Auth** | [Firebase Authentication](https://firebase.google.com/) (Email + Google) |
| **Database** | MongoDB (via Express.js REST API) |
| **AI Inference** | [llama.rn](https://github.com/nicepkg/llama.rn) (llama.cpp bindings for React Native) |
| **AI Model** | Qwen3.5-2B (fine-tuned with LoRA on LeafNet dataset, exported as GGUF Q4_K_M) |
| **Maps** | [MapLibre React Native](https://github.com/maplibre/maplibre-react-native) + OpenStreetMap |
| **Storage** | AsyncStorage, MMKV, expo-file-system |
| **Notifications** | [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) |
| **Voice Input** | [expo-speech-recognition](https://github.com/nicepkg/expo-speech-recognition) |

---

## 📁 Project Structure

```
AI_Gardener/
├── app/
│   ├── (tabs)/                  # Bottom tab screens
│   │   ├── index.tsx            # Home screen
│   │   ├── myPlants.tsx         # Plant collection
│   │   ├── plantDetails.tsx     # Individual plant view
│   │   ├── aiHelper.tsx         # AI feature hub
│   │   ├── marketplace.tsx      # Nearby shops map
│   │   └── account.tsx          # User profile & settings
│   ├── (aiPart)/                # AI-related screens
│   │   ├── aiChat.tsx           # Conversational AI chat
│   │   ├── aiIdentifier.tsx     # Plant identifier
│   │   ├── addPlant.tsx         # Add new plant form
│   │   └── editPlant.tsx        # Edit plant form
│   ├── index.tsx                # Login screen
│   ├── signup.tsx               # Registration screen
│   ├── forgotpass.tsx           # Password recovery
│   └── _layout.tsx              # Root layout with auth guard
├── components/
│   ├── PlantCard.jsx            # Compact plant card
│   └── PlantCardExtended.tsx    # Detailed plant card
├── context/
│   ├── PlantContext.tsx         # Plant state management (CRUD + sync)
│   └── I18nContext.tsx          # Internationalization (5 languages)
├── services/
│   ├── localLlm.ts             # On-device LLM management (init, inference, release)
│   └── notifications.ts        # Push notification scheduling
├── plugins/
│   ├── withAssetCopy.js         # Expo config plugin: copy GGUF models from APK assets
│   └── withGgufAssets.js        # Expo config plugin: bundle GGUF files into APK
├── serverDB/
│   └── server.js                # Express.js + MongoDB REST API
└── assets/
    ├── images/                  # App icons, logo, splash screen
    └── qwen_finetune_mobile_gguf/ # GGUF model files (not in repo due to size)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** or **yarn**
- **Android Studio** with an emulator or a physical Android device
- **MongoDB** running locally (for the plant management backend)
- **Firebase project** with Authentication, Firestore, and Storage enabled

### 1. Clone the repository

```bash
git clone https://github.com/IsacMarco/AI_Gardener.git
cd AI_Gardener
```

### 2. Install dependencies

```bash
# Mobile app
npm install

# Backend server
cd serverDB
npm install
cd ..
```

### 3. Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Email/Password** and **Google** sign-in methods
3. To register your Android app in Firebase, you need the **SHA-1** (or SHA-256) signing certificate fingerprint. Generate the Android project first, then extract it:
   ```bash
   # Generate the android/ folder
   npx expo prebuild

   # Get the SHA-1 and SHA-256 fingerprints
   cd android
   ./gradlew signingReport
   ```
   Copy the `SHA1` value from the `debug` variant output and paste it into your Firebase project settings (Project Settings → Your Android app → Add fingerprint).
4. Download `google-services.json` (Android) from Firebase and place it in the project root
5. Download `GoogleService-Info.plist` (iOS) from Firebase and place it in the project root

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_WEB_CLIENT_ID=your_google_web_client_id
EXPO_PUBLIC_MONGO_SERVER_URL=http://your_pc_ip:3000
EXPO_PUBLIC_CONTACT_EMAIL=your_contact_email@example.com
```

### 5. AI Model Setup

The GGUF model files must be placed in `android/app/src/main/assets/`:

```
android/app/src/main/assets/
├── Qwen3.5-2B.Q4_K_M.gguf         # Quantized language model (~1.5 GB)
└── Qwen3.5-2B.BF16-mmproj.gguf    # Vision projector (~600 MB)
```

> **Note:** These files are not included in the repository due to their size. You can obtain them by fine-tuning the model yourself using the training notebook, or by contacting the author.

### 6. Start the backend

```bash
cd serverDB
node server.js
```

### 7. Run the app

```bash
# Build and run on Android
npx expo run:android

# Or start the dev server
npx expo start
```

---

## 🧠 AI Model Training

The AI model was fine-tuned from `Qwen3.5-2B` (a 2B parameter Vision Language Model by Alibaba) using:

- **Dataset:** [LeafNet](https://huggingface.co/datasets/enalis/LeafNet) — images of healthy and diseased leaves from 29 plant species
- **Technique:** LoRA (Low-Rank Adaptation) with rank 32, RSLoRA stabilization
- **Framework:** [Unsloth](https://github.com/unslothai/unsloth) for optimized training
- **Data augmentation:** Custom "internet simulator" pipeline (random flip, rotation, color jitter, sharpness) to bridge the gap between lab photos and real-world mobile photos
- **Training:** SFT (Supervised Fine-Tuning) with `train_on_responses_only`, cosine LR scheduler, gradient accumulation
- **Export:** Merged LoRA adapters → GGUF format → Q4_K_M quantization for mobile deployment
- **Hardware:** Intel Core i5-14600K, 32 GB RAM, NVIDIA GeForce RTX 5070 (11.49 GB VRAM)

---

## 📜 License

This project was developed as a **Bachelor's Thesis** (Lucrare de Licență) at the **Politehnica University of Timișoara**, Faculty of Automation and Computer Science (Automatică și Calculatoare).

---

## 👤 Author

**Marco Isac**

- GitHub: [@IsacMarco](https://github.com/IsacMarco)
- LinkedIn: [Marco Isac](https://www.linkedin.com/in/marco-deian-isac/)
