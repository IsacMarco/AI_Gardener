import { Ionicons } from "@expo/vector-icons";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  Camera,
  ChevronDown,
  Globe,
  Image as ImageIcon,
  Mic,
  Send,
  StopCircle,
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
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

const genAI = new GoogleGenerativeAI(
  process.env.EXPO_PUBLIC_GEMINI_API_KEY || "",
);

// Prompt-ul de sistem
const SYSTEM_PROMPT = `
### ROLE & IDENTITY
You are "AI Gardener", an expert botanist and horticulturist assistant. Your knowledge base covers plant identification, pathology (diseases/pests), and care requirements for indoor and outdoor plants.

### CORE OBJECTIVES
1. **Identify**: Recognize plant species from descriptions or images.
2. **Diagnose**: Detect health issues (fungus, pests, underwatering, etc.) and propose immediate solutions.
3. **Educate**: Provide concise care tips (light, water, soil, humidity).

### CONVERSATION RULES
- **Language Matching**: ALWAYS respond in the SAME LANGUAGE as the user's message. If the user writes in Romanian, reply in Romanian. If in Spanish, reply in Spanish. Match their language exactly.
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

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
};

const LANGUAGE_OPTIONS = [
  { code: "en-US", label: "English", short: "EN" },
  { code: "ro-RO", label: "Română", short: "RO" },
  { code: "es-ES", label: "Español", short: "ES" },
  { code: "fr-FR", label: "Français", short: "FR" },
  { code: "de-DE", label: "Deutsch", short: "DE" },
  { code: "it-IT", label: "Italiano", short: "IT" },
  { code: "pt-BR", label: "Português", short: "PT" },
];

export default function AiHelperScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const conversationListRef = useRef<ScrollView>(null);
  const conversationItemOffsetsRef = useRef<Record<string, number>>({});
  const shouldScrollToNewestConversationRef = useRef(false);
  const { height } = useWindowDimensions();
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedBase64, setSelectedBase64] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "conv-1",
      title: "Chat 1",
      messages: [
        {
          id: "1",
          text: "Hello! I'm AI Gardener. I hope you have a wonderful day! How can I assist you with your plants today?",
          sender: "ai",
        },
      ],
    },
  ]);
  const [activeConversationId, setActiveConversationId] = useState("conv-1");

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    type: "error" | "info" | "selection" | "voice-error";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    type: "info",
    title: "",
    message: "",
  });

  const [isRecognizing, setIsRecognizing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGE_OPTIONS[0]);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showConversationPicker, setShowConversationPicker] = useState(false);
  const [showRenameConversationModal, setShowRenameConversationModal] =
    useState(false);
  const [showConversationActionsModal, setShowConversationActionsModal] =
    useState(false);
  const [showDeleteConversationModal, setShowDeleteConversationModal] =
    useState(false);
  const [conversationActionId, setConversationActionId] = useState("");
  const [renameConversationId, setRenameConversationId] = useState("");
  const [renameConversationTitle, setRenameConversationTitle] = useState("");

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId) ||
    conversations[0];
  const messages = activeConversation?.messages || [];
  const conversationListMaxHeight = Math.min(340, Math.max(180, height * 0.4));

  const updateActiveConversationMessages = (
    nextMessages: Message[] | ((previousMessages: Message[]) => Message[]),
  ) => {
    setConversations((previousConversations) =>
      previousConversations.map((conversation) => {
        if (conversation.id !== activeConversationId) return conversation;

        const updatedMessages =
          typeof nextMessages === "function"
            ? nextMessages(conversation.messages)
            : nextMessages;

        return { ...conversation, messages: updatedMessages };
      }),
    );
  };

  const createNewConversation = () => {
    const newConversationId = `conv-${Date.now()}`;
    const newConversation: Conversation = {
      id: newConversationId,
      title: `Chat ${conversations.length + 1}`,
      messages: [
        {
          id: `${Date.now()}-welcome`,
          text: "Hello! I'm AI Gardener. I hope you have a wonderful day! How can I assist you with your plants today?",
          sender: "ai",
        },
      ],
    };

    setConversations((previousConversations) => [
      ...previousConversations,
      newConversation,
    ]);
    setActiveConversationId(newConversationId);
    setInputText("");
    setSelectedImage(null);
    setSelectedBase64(null);
  };

  const selectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setSelectedImage(null);
    setSelectedBase64(null);
    setShowConversationPicker(false);
  };

  const openRenameConversationModal = (conversationId: string) => {
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation) return;

    setRenameConversationId(conversation.id);
    setRenameConversationTitle(conversation.title);
    setShowRenameConversationModal(true);
  };

  const openConversationActionsModal = (conversationId: string) => {
    setConversationActionId(conversationId);
    setShowConversationPicker(false);
    setShowConversationActionsModal(true);
  };

  const handleRenameFromActions = () => {
    if (!conversationActionId) {
      setShowConversationActionsModal(false);
      return;
    }

    setShowConversationActionsModal(false);
    openRenameConversationModal(conversationActionId);
  };

  const handleDeleteFromActions = () => {
    if (!conversationActionId) {
      setShowConversationActionsModal(false);
      return;
    }

    if (conversations.length <= 1) {
      setShowConversationActionsModal(false);
      showModal(
        "info",
        "Cannot Delete",
        "You need to keep at least one conversation.",
      );
      return;
    }

    setShowConversationActionsModal(false);
    setShowDeleteConversationModal(true);
  };

  const confirmDeleteConversation = () => {
    if (!conversationActionId) {
      setShowDeleteConversationModal(false);
      return;
    }

    setConversations((previousConversations) => {
      const filteredConversations = previousConversations.filter(
        (conversation) => conversation.id !== conversationActionId,
      );

      if (activeConversationId === conversationActionId && filteredConversations[0]) {
        setActiveConversationId(filteredConversations[0].id);
      }

      return filteredConversations;
    });

    setShowDeleteConversationModal(false);
    setConversationActionId("");
    setSelectedImage(null);
    setSelectedBase64(null);
  };

  const handleRenameConversation = () => {
    const trimmedTitle = renameConversationTitle.trim();

    if (!renameConversationId) {
      setShowRenameConversationModal(false);
      return;
    }

    if (trimmedTitle.length === 0) {
      showModal("info", "Invalid Name", "Conversation name cannot be empty.");
      return;
    }

    setConversations((previousConversations) =>
      previousConversations.map((conversation) =>
        conversation.id === renameConversationId
          ? { ...conversation, title: trimmedTitle }
          : conversation,
      ),
    );

    setShowRenameConversationModal(false);
    setRenameConversationId("");
    setRenameConversationTitle("");
  };

  useSpeechRecognitionEvent("start", () => {
    setIsRecognizing(true);
  });

  useSpeechRecognitionEvent("result", (event) => {
    if (event.results && event.results.length > 0) {
      const lastResult = event.results[event.results.length - 1];
      if (lastResult?.transcript) {
        setInputText(lastResult.transcript);
      }
    }
  });

  useSpeechRecognitionEvent("error", (error) => {
    console.log("Speech error:", error);
    showModal(
      "voice-error",
      "No speech detected",
      "Please try again or use the keyboard to type your message.",
    );
    setIsRecognizing(false);
  });

  useSpeechRecognitionEvent("end", () => {
    setIsRecognizing(false);
  });

  const handleMicrophonePress = async () => {
    if (isRecognizing) {
      ExpoSpeechRecognitionModule.stop();
      setIsRecognizing(false);
      return;
    }

    try {
      const permission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        showModal(
          "error",
          "Permission Denied",
          "Need microphone and speech permissions to use voice.",
          () => Linking.openSettings(),
        );
        return;
      }

      ExpoSpeechRecognitionModule.start({
        lang: selectedLanguage.code,
        interimResults: true,
        maxAlternatives: 1,
        continuous: true,
      });
    } catch (e) {
      console.error("Start speech error:", e);
      setIsRecognizing(false);
    }
  };

  // useEffect(() => {
  //   const listModels = async () => {
  //     try {
  //       // ATENTIE: Asta necesita un import diferit, dar pentru test rapid
  //       // putem incerca un fetch direct daca SDK-ul face figuri.
  //       const response = await fetch(
  //         `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}`,
  //       );
  //       const data = await response.json();
  //       console.log("=== AVAILABLE GEMINI MODELS ===");
  //       // AfisAm doar numele modelelor
  //       if (data.models) {
  //         data.models.forEach((m: any) => console.log(m.name));
  //       } else {
  //         console.log("No models found or error:", data);
  //       }
  //       console.log("===============================");
  //     } catch (e) {
  //       console.error("Error listing models:", e);
  //     }
  //   };

  //   listModels();
  // }, []);
  // Auto-scroll
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [activeConversationId, messages, selectedImage, isTyping]);

  useEffect(() => {
    if (!showConversationPicker) return;

    setTimeout(() => {
      if (shouldScrollToNewestConversationRef.current) {
        conversationListRef.current?.scrollToEnd({ animated: true });
        shouldScrollToNewestConversationRef.current = false;
        return;
      }

      const activeConversationOffsetY =
        conversationItemOffsetsRef.current[activeConversationId];

      if (typeof activeConversationOffsetY === "number") {
        conversationListRef.current?.scrollTo({
          x: 0,
          y: Math.max(0, activeConversationOffsetY - 12),
          animated: true,
        });
      }
    }, 140);
  }, [activeConversationId, conversations.length, showConversationPicker]);

  useEffect(() => {
    return () => {
      Keyboard.dismiss();
      ExpoSpeechRecognitionModule.stop();
    };
  }, []);

  const showModal = (
    type: "error" | "info" | "selection" | "voice-error",
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
        return <ImageIcon size={32} color="white" strokeWidth={2} />;
      default:
        return <Ionicons name="information" size={32} color="white" />;
    }
  };

  const getModalColor = () => {
    if (modalConfig.type === "error") return "#ef4444";
    if (modalConfig.type === "selection") return "#5F7A4B";
    return "#5F7A4B";
  };

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
        base64: true,
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

  const sendMessage = async () => {
    if (inputText.trim().length === 0 && !selectedImage) return;

    if (isRecognizing) {
      ExpoSpeechRecognitionModule.stop();
      setIsRecognizing(false);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: inputText.trim().length > 0 ? inputText : undefined,
      imageUri: selectedImage,
    };

    const currentText = inputText;
    const currentBase64 = selectedBase64;

    const newMessages = [...messages, userMsg];
    updateActiveConversationMessages(newMessages);

    setInputText("");
    setSelectedImage(null);
    setSelectedBase64(null);
    setIsTyping(true);

    try {
      const model = genAI.getGenerativeModel({
        model: "gemma-3-27b-it",
      });
      const promptParts: any[] = [];

      promptParts.push(SYSTEM_PROMPT);

      const historyContext = messages
        .map((msg) => {
          const role = msg.sender === "user" ? "User" : "AI Gardener";
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

      if (currentText) {
        promptParts.push("\nUser Current Question: " + currentText);
      } else if (currentBase64) {
        promptParts.push("\nUser Current Question: Analyze this image.");
      }

      if (currentBase64) {
        promptParts.push({
          inlineData: {
            data: currentBase64,
            mimeType: "image/jpeg",
          },
        });
      }

      const result = await model.generateContent(promptParts);
      const response = await result.response;
      const text = response.text();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: text,
      };
      updateActiveConversationMessages((previousMessages) => [
        ...previousMessages,
        aiMsg,
      ]);
    } catch (error) {
      console.error("Gemini Error:", error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        sender: "ai",
        text: "Oops! Sorry! I am working on my garden. Please try again.",
      };
      updateActiveConversationMessages((previousMessages) => [
        ...previousMessages,
        errorMsg,
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const canSend = inputText.length > 0 || selectedImage !== null;

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/aiHelper");
  };

  return (
    <View className="flex-1" style={{ backgroundColor: "#AFA696" }}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#5F7A4B", "#8C8673", "#AFA696"]}
        locations={[0, 0.6, 1]}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1">
        <View className="px-4 mt-2 mb-3">
          <View className="bg-white/15 border border-white/20 rounded-2xl px-3 py-3 flex-row items-center">
            <TouchableOpacity
              onPress={handleGoBack}
              activeOpacity={0.8}
              className="w-10 h-10 rounded-xl bg-white/25 items-center justify-center"
            >
              <Ionicons name="chevron-back" size={22} color="white" />
            </TouchableOpacity>

            <View className="flex-1 px-3">
              <Text className="text-white/80 text-xs font-medium tracking-wide uppercase">
                AI Assistant
              </Text>
              <Text className="text-white text-2xl font-bold">Talk to AI Gardener</Text>
            </View>

            <View className="w-10 h-10" />
          </View>

          <View className="mt-3 items-center">
            <TouchableOpacity
              onPress={() => setShowConversationPicker(true)}
              activeOpacity={0.85}
              className="px-4 py-2 rounded-full border border-white/30 bg-white/20 flex-row items-center"
            >
              <Text className="text-white font-semibold">{activeConversation?.title || "Chat"}</Text>
              <ChevronDown size={14} color="white" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-1 bg-[#E8E6DE]/95 rounded-t-[35px] pt-4">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <ScrollView
              ref={scrollViewRef}
              className="flex-1 px-4"
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="on-drag"
              contentContainerStyle={{ paddingBottom: 20 }}
            >
            {messages.map((msg) => {
              const isAi = msg.sender === "ai";

              return (
                <View
                  key={msg.id}
                  className={`mb-6 rounded-2xl shadow-sm overflow-hidden ${
                    msg.imageUri ? "p-0" : "p-3"
                  } ${
                    isAi
                      ? "bg-[#C4DBB3] rounded-tl-none self-start"
                      : "bg-[#F3F4F6] rounded-tr-none self-end"
                  }`}
                  style={{
                    maxWidth: "85%",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.14,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  {msg.imageUri && (
                    <View className="bg-white rounded-xl overflow-hidden mb-3 items-center justify-center">
                      <Image
                        source={{ uri: msg.imageUri }}
                        style={{ width: 200, height: 200, borderRadius: 10 }}
                        resizeMode="cover"
                      />
                    </View>
                  )}

                  {msg.text && (
                    <View className={msg.imageUri ? "p-3" : ""}>
                      {isAi ? (
                        <MarkdownText content={msg.text} />
                      ) : (
                        <Text className="text-[#1F2937] text-base leading-6">
                          {msg.text}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}

            {isTyping && (
              <View
                className="bg-[#C4DBB3] p-3 rounded-2xl rounded-tl-none self-start mb-6 shadow-sm w-16 items-center"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.14,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <ActivityIndicator color="#5F7A4B" size="small" />
              </View>
            )}
            </ScrollView>

            <View className="px-4 pt-2 pb-4">
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

            <View className="bg-white flex-row items-center px-4 rounded-[24px] shadow-sm min-h-[54px]">
              <TouchableOpacity
                onPress={handleAddPhoto}
                activeOpacity={0.7}
                className="mr-3"
              >
                <Camera size={24} color="#5F7A4B" />
              </TouchableOpacity>

              <TextInput
                className="flex-1 text-base text-[#374151]"
                placeholder={
                  isRecognizing ? "Listening..." : "Ask me anything..."
                }
                placeholderTextColor={isRecognizing ? "#ef4444" : "#A0A0A0"}
                multiline
                style={{
                  paddingTop: 12,
                  paddingBottom: 12,
                  maxHeight: 120,
                }}
                value={inputText}
                onChangeText={setInputText}
              />

              <TouchableOpacity
                onPress={() => setShowLanguagePicker(true)}
                activeOpacity={0.7}
                className="mr-2 flex-row items-center bg-gray-100 px-2 py-1.5 rounded-lg"
              >
                <Globe size={14} color="#5F7A4B" />
                <Text className="text-xs font-bold text-[#5F7A4B] ml-1">
                  {selectedLanguage.short}
                </Text>
                <ChevronDown size={12} color="#5F7A4B" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleMicrophonePress}
                activeOpacity={0.7}
              >
                {isRecognizing ? (
                  <View className="bg-red-100 p-2 rounded-full animate-pulse">
                    <StopCircle size={24} color="#ef4444" fill="#ef4444" />
                  </View>
                ) : (
                  <Mic size={24} color="#5F7A4B" />
                )}
              </TouchableOpacity>

              {canSend && !isRecognizing && (
                <TouchableOpacity onPress={sendMessage} className="ml-3">
                  <View className="bg-[#5F7A4B]/10 p-2 rounded-full">
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
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showLanguagePicker}
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowLanguagePicker(false)}
          className="flex-1 justify-center items-center bg-black/60 px-6"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-[24px] p-6 shadow-2xl"
          >
            <View className="flex-row items-center justify-center mb-5">
              <View className="w-12 h-12 rounded-full items-center justify-center bg-[#5F7A4B]/10">
                <Globe size={24} color="#5F7A4B" />
              </View>
            </View>
            <Text className="text-xl font-bold text-[#1F2937] mb-4 text-center">
              Select Language
            </Text>
            <View className="gap-2">
              {LANGUAGE_OPTIONS.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => {
                    setSelectedLanguage(lang);
                    setShowLanguagePicker(false);
                  }}
                  className={`flex-row items-center justify-between p-4 rounded-xl ${
                    selectedLanguage.code === lang.code
                      ? "bg-[#5F7A4B]"
                      : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`font-medium text-base ${
                      selectedLanguage.code === lang.code
                        ? "text-white"
                        : "text-[#1F2937]"
                    }`}
                  >
                    {lang.label}
                  </Text>
                  <Text
                    className={`font-bold ${
                      selectedLanguage.code === lang.code
                        ? "text-white/70"
                        : "text-gray-400"
                    }`}
                  >
                    {lang.short}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => setShowLanguagePicker(false)}
              className="mt-4 py-2"
            >
              <Text className="text-gray-400 font-medium text-center">
                Cancel
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showConversationPicker}
        onRequestClose={() => setShowConversationPicker(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowConversationPicker(false)}
          className="flex-1 justify-center items-center bg-black/60 px-6"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-[24px] p-6 shadow-2xl"
          >
            <Text className="text-xl font-bold text-[#1F2937] mb-4 text-center">
              Conversations
            </Text>

            <ScrollView
              ref={conversationListRef}
              style={{ maxHeight: conversationListMaxHeight }}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ gap: 8, paddingRight: 2 }}
            >
              {conversations.map((conversation) => {
                const isActive = conversation.id === activeConversationId;

                return (
                  <TouchableOpacity
                    key={conversation.id}
                    onPress={() => selectConversation(conversation.id)}
                    onLongPress={() => openConversationActionsModal(conversation.id)}
                    onLayout={(event) => {
                      conversationItemOffsetsRef.current[conversation.id] =
                        event.nativeEvent.layout.y;
                    }}
                    className={`flex-row items-center justify-between p-4 rounded-xl border ${
                      isActive
                        ? "bg-[#EAF3E3] border-[#5F7A4B]/40"
                        : "bg-gray-100 border-transparent"
                    }`}
                  >
                    <Text
                      className={`font-medium text-base ${
                        isActive ? "text-[#2F4A1F]" : "text-[#1F2937]"
                      }`}
                    >
                      {conversation.title}
                    </Text>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={18} color="#5F7A4B" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={() => {
                shouldScrollToNewestConversationRef.current = true;
                createNewConversation();
              }}
              className="mt-6 bg-[#5F7A4B] w-full py-3.5 rounded-xl flex-row justify-center items-center"
            >
              <Ionicons name="add" size={18} color="white" />
              <Text className="text-white font-bold text-base ml-2">New Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowConversationPicker(false)}
              className="mt-3 py-2"
            >
              <Text className="text-gray-400 font-medium text-center">Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showConversationActionsModal}
        onRequestClose={() => setShowConversationActionsModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowConversationActionsModal(false)}
          className="flex-1 justify-center items-center bg-black/60 px-6"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-[24px] p-6 shadow-2xl"
          >
            <Text className="text-xl font-bold text-[#1F2937] mb-2 text-center">
              Conversation Options
            </Text>
            <Text className="text-xs text-gray-400 font-medium mb-8 text-center">
              What do you want to do with this conversation?
            </Text>

            <View className="gap-3">
              <TouchableOpacity
                onPress={handleRenameFromActions}
                className="bg-[#5F7A4B] w-full py-3.5 rounded-xl"
              >
                <Text className="text-white text-center font-bold text-base">Rename</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeleteFromActions}
                className="bg-[#ef4444] w-full py-3.5 rounded-xl"
              >
                <Text className="text-white text-center font-bold text-base">Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowConversationActionsModal(false)}
                className="py-2"
              >
                <Text className="text-gray-400 font-medium text-center">Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showDeleteConversationModal}
        onRequestClose={() => setShowDeleteConversationModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowDeleteConversationModal(false)}
          className="flex-1 justify-center items-center bg-black/60 px-6"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-[24px] p-6 shadow-2xl"
          >
            <Text className="text-xl font-bold text-[#1F2937] mb-3 text-center">
              Delete Conversation?
            </Text>
            <Text className="text-[#6B7280] text-center mb-5">
              Are you sure you want to delete this conversation? This action cannot be undone.
            </Text>

            <View className="gap-3">
              <TouchableOpacity
                onPress={confirmDeleteConversation}
                className="bg-[#ef4444] w-full py-3.5 rounded-xl"
              >
                <Text className="text-white text-center font-bold text-base">Yes, Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowDeleteConversationModal(false)}
                className="bg-[#5F7A4B] w-full py-3.5 rounded-xl"
              >
                <Text className="text-white text-center font-bold text-base">Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showRenameConversationModal}
        onRequestClose={() => setShowRenameConversationModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowRenameConversationModal(false)}
          className="flex-1 justify-center items-center bg-black/60 px-6"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-[24px] p-6 shadow-2xl"
          >
            <Text className="text-xl font-bold text-[#1F2937] mb-3 text-center">
              Rename Conversation
            </Text>
            <Text className="text-[#6B7280] text-center mb-4">
              Enter a new name for this chat.
            </Text>

            <TextInput
              value={renameConversationTitle}
              onChangeText={setRenameConversationTitle}
              placeholder="Conversation name"
              placeholderTextColor="#9CA3AF"
              className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-[#1F2937]"
              autoFocus
              maxLength={40}
            />

            <View className="w-full gap-3 mt-5">
              <TouchableOpacity
                onPress={handleRenameConversation}
                className="bg-[#5F7A4B] w-full py-3.5 rounded-xl"
              >
                <Text className="text-white text-center font-bold text-base">
                  Save Name
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowRenameConversationModal(false)}
                className="bg-[#8C8673] w-full py-3.5 rounded-xl"
              >
                <Text className="text-white text-center font-bold text-base">Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
          className="flex-1 justify-center items-center bg-black/60 px-6"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-[24px] p-6 items-center shadow-2xl"
          >
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
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const MarkdownText = ({ content }: { content: string }) => {
  if (!content) return null;
  const lines = content.split("\n");
  const renderTextWithBold = (text: string) => {
    const parts = text.split("**");
    return parts.map((part, index) => {
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
        if (trimmedLine === "") {
          return <View key={index} className="h-2" />;
        }
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
        const numberMatch = trimmedLine.match(/^(\d+\.)\s(.*)/);
        if (numberMatch) {
          const numberPrefix = numberMatch[1];
          const restOfText = numberMatch[2];
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
        return (
          <Text key={index} className="text-[#1F2937] text-base leading-6 mb-1">
            {renderTextWithBold(line)}
          </Text>
        );
      })}
    </View>
  );
};