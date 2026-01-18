import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  Camera,
  Image as ImageIcon,
  Mic,
  Send,
  X,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// --- IMPORT NOU PENTRU GEMINI ---
import { GoogleGenerativeAI } from "@google/generative-ai";

// Inițializăm clientul Gemini
// Asigură-te că ai cheia în .env: EXPO_PUBLIC_GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(
  process.env.EXPO_PUBLIC_GEMINI_API_KEY || "",
);

// Prompt-ul de sistem (Personalitatea)
const SYSTEM_PROMPT = `
### ROLE & IDENTITY
You are "AI Gardener", an expert botanist and horticulturist assistant. Your knowledge base covers plant identification, pathology (diseases/pests), and care requirements for indoor and outdoor plants.

### CORE OBJECTIVES
1. **Identify**: Recognize plant species from descriptions or images.
2. **Diagnose**: Detect health issues (fungus, pests, underwatering, etc.) and propose immediate solutions.
3. **Educate**: Provide concise care tips (light, water, soil, humidity).

### CONVERSATION RULES
- **Conciseness is Key**: Mobile users scan text. Use short paragraphs and bullet points. Avoid fluff.
- **Context Awareness**: Remember details from the current conversation (e.g., if the user previously mentioned they live in a cold climate).
- **Tone**: Friendly, encouraging, but scientifically accurate.

### IMAGE ANALYSIS PROTOCOL
If the user provides an image:
1. First, confirm if it is a plant. If NOT a plant, politely refuse to analyze it.
2. If it is a plant, immediately identify the species (if possible) and assess its health.
3. If the plant looks sick, list the symptoms and the recommended treatment clearly.

### GUARDRAILS
- If asked about non-plant topics (e.g., coding, politics, cooking non-plants), politely reply: "I specialize only in plants and gardening. How can I help your garden today?"
- If a plant is toxic to pets/humans, ALWAYS add a brief warning.

### OUTPUT FORMAT
- Use **Bold** for key terms (e.g., **Watering:**, **Light:**).
- Use emojis 🌱🌿 to make the text friendly but not excessive.
`;

type Message = {
  id: string;
  text?: string;
  imageUri?: string | null;
  sender: "user" | "ai";
};

export default function AiHelperScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  // --- STATE CHAT ---
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // Preview URI
  const [selectedBase64, setSelectedBase64] = useState<string | null>(null); // Base64 pt AI
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm AI Gardener. I hope you have a wonderful day! How can I assist you with your plants today?",
      sender: "ai",
    },
  ]);

  // --- STATE MODAL ---
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    type: "error" | "info" | "selection";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    type: "info",
    title: "",
    message: "",
  });

  useEffect(() => {
    const listModels = async () => {
      try {
        // ATENȚIE: Asta necesită un import diferit, dar pentru test rapid
        // putem încerca un fetch direct dacă SDK-ul face figuri.
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}`,
        );
        const data = await response.json();
        console.log("=== AVAILABLE GEMINI MODELS ===");
        // Afișăm doar numele modelelor
        if (data.models) {
          data.models.forEach((m: any) => console.log(m.name));
        } else {
          console.log("No models found or error:", data);
        }
        console.log("===============================");
      } catch (e) {
        console.error("Error listing models:", e);
      }
    };

    listModels();
  }, []);

  // Auto-scroll
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, selectedImage, isTyping]);

  useEffect(() => {
    return () => {
      Keyboard.dismiss();
    };
  }, []);

  // --- HELPERE MODAL ---
  const showModal = (
    type: "error" | "info" | "selection",
    title: string,
    message: string,
    onConfirm = () => {},
  ) => {
    setModalConfig({ type, title, message, onConfirm });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const renderModalIcon = () => {
    switch (modalConfig.type) {
      case "error":
        return <AlertCircle size={32} color="white" strokeWidth={3} />;
      case "selection":
        return <ImageIcon size={32} color="white" strokeWidth={3} />;
      default:
        return <Ionicons name="information" size={32} color="white" />;
    }
  };

  const getModalColor = () => {
    if (modalConfig.type === "error") return "#ef4444";
    if (modalConfig.type === "selection") return "#5F7A4B";
    return "#5F7A4B";
  };

  // --- LOGICA FOTO ---
  const handleAddPhoto = async () => {
    if (Platform.OS === "web") {
      showModal(
        "info",
        "Not Supported",
        "Photo picking is not available on web.",
      );
      return;
    }
    Keyboard.dismiss();
    showModal(
      "selection",
      "Add Photo",
      "Choose where to upload your plant photo from.",
    );
  };

  const pickFromCamera = async () => {
    setModalVisible(false);
    const { status } = await ImagePicker.getCameraPermissionsAsync();

    const launchCamera = async () => {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.5,
        base64: true, // EXTREM DE IMPORTANT
        allowsEditing: true,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setSelectedImage(result.assets[0].uri);
        setSelectedBase64(result.assets[0].base64 || null);
      }
    };

    if (status === "granted") {
      launchCamera();
    } else if (status === "denied") {
      showModal(
        "error",
        "Camera Access Required",
        "You have denied camera access. Please enable it in settings.",
        () => Linking.openSettings(),
      );
    } else {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.status === "granted") launchCamera();
      else
        showModal(
          "error",
          "Permission Denied",
          "We cannot take a photo without permission.",
        );
    }
  };

  const pickFromGallery = async () => {
    setModalVisible(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      showModal(
        "error",
        "Permission Needed",
        "Gallery permission is required.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.5,
      base64: true,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setSelectedImage(result.assets[0].uri);
      setSelectedBase64(result.assets[0].base64 || null);
    }
  };

  // --- LOGICA CHAT CU GOOGLE GEMINI (GRATUIT) ---
  // --- LOGICA CHAT CU GOOGLE GEMINI (CU MEMORIE) ---
  const sendMessage = async () => {
    if (inputText.trim().length === 0 && !selectedImage) return;

    // 1. UI Update (User)
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: inputText.trim().length > 0 ? inputText : undefined,
      imageUri: selectedImage,
    };

    // Salvăm valorile locale
    const currentText = inputText;
    const currentBase64 = selectedBase64;

    // Actualizăm starea
    const newMessages = [...messages, userMsg]; // Calculăm noua listă acum ca să o folosim la istoric
    setMessages(newMessages);

    setInputText("");
    setSelectedImage(null);
    setSelectedBase64(null);
    setIsTyping(true);

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
      });
      const promptParts: any[] = [];
      // A. ADAUGĂM SYSTEM PROMPT
      promptParts.push(SYSTEM_PROMPT);
      // B. ADAUGĂM ISTORICUL (AICI ESTE SECRETUL PENTRU MEMORIE)
      // Convertim mesajele anterioare într-un format text pe care AI-ul să-l citească
      // Excludem ultimul mesaj (cel curent) pentru că îl adăugăm separat jos
      const historyContext = messages
        .map((msg) => {
          const role = msg.sender === "user" ? "User" : "AI Gardener";
          // Dacă mesajul are text, îl punem. Dacă a fost doar poză, scriem [Image]
          const content = msg.text || "[User sent a photo]";
          return `${role}: ${content}`;
        })
        .join("\n");
      if (historyContext) {
        promptParts.push(
          "\n=== CONVERSATION HISTORY ===\n" +
            historyContext +
            "\n==========================\n",
        );
      }
      // C. ADAUGĂM ÎNTREBAREA CURENTĂ
      if (currentText) {
        promptParts.push("\nUser Current Question: " + currentText);
      } else if (currentBase64) {
        // Dacă trimite doar poză fără text
        promptParts.push("\nUser Current Question: Analyze this image.");
      }
      // D. ADAUGĂM IMAGINEA CURENTĂ (Dacă există)
      if (currentBase64) {
        promptParts.push({
          inlineData: {
            data: currentBase64,
            mimeType: "image/jpeg",
          },
        });
      }
      // 4. Generăm Răspunsul
      const result = await model.generateContent(promptParts);
      const response = await result.response;
      const text = response.text();
      // 5. UI Update (AI)
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: text,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("Gemini Error:", error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        sender: "ai",
        text: "Oops! I lost connection to the garden. Please try again.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const canSend = inputText.length > 0 || selectedImage !== null;

  return (
    <View className="flex-1" style={{ backgroundColor: "#AFA696" }}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#5F7A4B", "#8C8673", "#AFA696"]}
        locations={[0, 0.6, 1]}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1">
        {/* HEADER */}
        <View className="flex-row items-center justify-between px-4 py-2 mb-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white tracking-wide">
            Talk to AI Gardener
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          {/* LISTA MESAJE */}
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {messages.map((msg) => {
              // Verificăm cine e expeditorul pentru a decide stilul
              const isAi = msg.sender === "ai";

              return (
                <View
                  key={msg.id}
                  className={`mb-6 rounded-2xl shadow-sm overflow-hidden ${
                    // Stiluri condiționate pentru padding și colțuri
                    msg.imageUri ? "p-0" : "p-3"
                  } ${
                    isAi
                      ? "bg-[#D4E7C5] rounded-tl-none self-start" // AI: Verde, Stânga
                      : "bg-[#F3F4F6] rounded-tr-none self-end" // User: Gri, Dreapta
                  }`}
                  style={{ maxWidth: "85%" }}
                >
                  {/* --- ZONA IMAGINE (COMUNĂ) --- */}
                  {msg.imageUri && (
                    <View className="bg-white rounded-xl overflow-hidden mb-3 items-center justify-center">
                      <Image
                        source={{ uri: msg.imageUri }}
                        style={{ width: 200, height: 200, borderRadius: 10 }}
                        resizeMode="cover"
                      />
                    </View>
                  )}

                  {/* --- ZONA TEXT (DIFERITĂ: AI vs USER) --- */}
                  {msg.text && (
                    <View className={msg.imageUri ? "p-3" : ""}>
                      {isAi ? (
                        // CAZUL 1: AI (Folosim componenta Custom Markdown)
                        <MarkdownText content={msg.text} />
                      ) : (
                        // CAZUL 2: USER (Text simplu, exact cum aveai înainte)
                        <Text className="text-[#1F2937] text-base leading-6">
                          {msg.text}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}

            {/* Indicator de tastare (Rămâne la fel) */}
            {isTyping && (
              <View className="bg-[#D4E7C5] p-3 rounded-2xl rounded-tl-none self-start mb-6 shadow-sm w-16 items-center">
                <ActivityIndicator color="#5F7A4B" size="small" />
              </View>
            )}
          </ScrollView>

          {/* INPUT AREA */}
          <View className="px-4 pt-2 pb-4">
            {/* PREVIEW POZĂ SELECTATĂ */}
            {selectedImage && (
              <View className="bg-white/90 p-2 rounded-2xl mb-2 self-start relative shadow-sm ml-1 border border-white/20">
                <Image
                  source={{ uri: selectedImage }}
                  style={{ width: 80, height: 80, borderRadius: 12 }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => {
                    setSelectedImage(null);
                    setSelectedBase64(null);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1.5 border-2 border-white shadow-sm"
                >
                  <X size={12} color="white" strokeWidth={3} />
                </TouchableOpacity>
              </View>
            )}

            {/* BARĂ INPUT */}
            <View className="bg-white flex-row items-center px-4 rounded-[24px] shadow-sm min-h-[54px]">
              {/* 1. BUTON CAMERĂ (STANGA) */}
              <TouchableOpacity
                onPress={handleAddPhoto}
                activeOpacity={0.7}
                className="mr-3"
              >
                <Camera size={24} color="#5F7A4B" />
              </TouchableOpacity>

              {/* 2. TEXT INPUT (MIJLOC) */}
              <TextInput
                className="flex-1 text-base text-[#374151]"
                placeholder="Ask me anything..."
                placeholderTextColor="#A0A0A0"
                multiline
                style={{
                  paddingTop: 12,
                  paddingBottom: 12,
                  maxHeight: 120,
                }}
                value={inputText}
                onChangeText={setInputText}
              />

              {/* 3. BUTON SEND/MIC (DREAPTA) */}
              <TouchableOpacity activeOpacity={0.7}>
                <Mic size={24} color="#5F7A4B" />
              </TouchableOpacity>
              <View className="ml-3">
                {canSend && (
                  <TouchableOpacity onPress={sendMessage} activeOpacity={0.7}>
                    <View className="bg-[#5F7A4B]/10 p-2 rounded-full">
                      {/* Am pus p-2 și fundal mic ca să iasă în evidență butonul de send */}
                      <Send
                        size={20}
                        color="#5F7A4B"
                        fill="#5F7A4B"
                        style={{ marginLeft: 2 }}
                      />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* --- MODALUL PERSONALIZAT --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          if (modalConfig.type !== "error") setModalVisible(false);
        }}
      >
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-white w-full max-w-sm rounded-[24px] p-6 items-center shadow-2xl">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-5 shadow-sm"
              style={{ backgroundColor: getModalColor() }}
            >
              {renderModalIcon()}
            </View>
            <Text className="text-xl font-bold text-[#1F2937] mb-2 text-center">
              {modalConfig.title}
            </Text>
            <Text className="text-gray-500 text-center mb-8 px-2 text-base leading-6">
              {modalConfig.message}
            </Text>

            {/* Butoane Modal */}
            {modalConfig.type === "selection" ? (
              <View className="w-full gap-3">
                <TouchableOpacity
                  onPress={pickFromCamera}
                  className="bg-[#5F7A4B] w-full py-3.5 rounded-xl flex-row justify-center items-center"
                >
                  <Camera size={20} color="white" className="mr-2" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Take Photo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={pickFromGallery}
                  className="bg-[#8C8673] w-full py-3.5 rounded-xl flex-row justify-center items-center"
                >
                  <ImageIcon size={20} color="white" className="mr-2" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Choose from Gallery
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className="mt-2 py-2"
                >
                  <Text className="text-gray-400 font-medium text-center">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  if (modalConfig.onConfirm) {
                    modalConfig.onConfirm();
                  }
                  closeModal();
                }}
                className="w-full py-3.5 rounded-xl shadow-sm active:opacity-90"
                style={{ backgroundColor: getModalColor() }}
              >
                <Text className="text-white text-center font-bold text-lg">
                  {modalConfig.type === "error" && modalConfig.onConfirm
                    ? "Open Settings"
                    : "Close"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- COMPONENTA AVANSATĂ DE PARSARE MARKDOWN ---
const MarkdownText = ({ content }: { content: string }) => {
  if (!content) return null;

  // 1. Spargem tot textul în linii
  const lines = content.split("\n");

  // Funcție mică pentru a rand textul care poate conține **BOLD**
  const renderTextWithBold = (text: string) => {
    const parts = text.split("**");
    return parts.map((part, index) => {
      // Părțile impare sunt între steluțe -> BOLD
      if (index % 2 === 1) {
        return (
          <Text key={index} style={{ fontWeight: "bold" }}>
            {part}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  return (
    <View>
      {lines.map((line, index) => {
        const trimmedLine = line.trim();

        // A. Ignorăm liniile goale, dar punem puțin spațiu
        if (trimmedLine === "") {
          return <View key={index} className="h-2" />;
        }

        // B. HEADERS (### Titlu)
        if (trimmedLine.startsWith("### ") || trimmedLine.startsWith("## ")) {
          const cleanText = trimmedLine.replace(/^#{2,3}\s/, "");
          return (
            <Text
              key={index}
              className="text-[#1F2937] text-lg font-bold mt-2 mb-1"
            >
              {cleanText}
            </Text>
          );
        }

        // C. BULLET LISTS (- Item sau * Item)
        if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
          const cleanText = trimmedLine.replace(/^[-*]\s/, "");
          return (
            <View key={index} className="flex-row ml-2 mb-1 pr-4">
              <Text className="text-[#1F2937] text-base mr-2 mt-1">•</Text>
              <Text className="text-[#1F2937] text-base leading-6 flex-1">
                {renderTextWithBold(cleanText)}
              </Text>
            </View>
          );
        }

        // D. NUMBERED LISTS (1. Item)
        // Regex simplu pentru a detecta "cifra + punct + spatiu" la inceput
        const numberMatch = trimmedLine.match(/^(\d+\.)\s(.*)/);
        if (numberMatch) {
          const numberPrefix = numberMatch[1]; // ex: "1."
          const restOfText = numberMatch[2]; // ex: "Textul meu"
          return (
            <View key={index} className="flex-row ml-2 mb-1 pr-4">
              <Text className="text-[#1F2937] text-base mr-2 mt-1 font-bold">
                {numberPrefix}
              </Text>
              <Text className="text-[#1F2937] text-base leading-6 flex-1">
                {renderTextWithBold(restOfText)}
              </Text>
            </View>
          );
        }

        // E. PARAGRAF NORMAL
        return (
          <Text key={index} className="text-[#1F2937] text-base leading-6 mb-1">
            {renderTextWithBold(line)}
          </Text>
        );
      })}
    </View>
  );
};
