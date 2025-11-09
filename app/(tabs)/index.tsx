import { ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return (
    <SafeAreaView>
      <ScrollView >
        <Text className="text-3xl font-bold text-center mt-10">
          Welcome to PlantAI!
        </Text>
        <Text className="text-lg text-center mt-4 mx-5">
          The best app for all things gardening. Explore tips,
          plant care advice, and AI-powered tools to help your garden thrive.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
