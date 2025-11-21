import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import PlantCard from "@/components/PlantCard";

export default function Index() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ minHeight: "100%", paddingBottom: 65 }}
        style={{
          backgroundColor: "#DDF6D2",
          paddingTop: 10
        }}
      >
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginHorizontal: 10,
            paddingVertical: 15,
            backgroundColor: '#57d979',
            borderRadius: 12,
            paddingHorizontal: 15
          }}
        >
          <View
            style={{
              width: "50%"
            }}
          >
            <Text className="text-2xl font-bold">Welcome to</Text>
            <Text
              style={{
                color: '#ffffff',
                fontSize: 23,
                fontWeight: 'bold',
                textShadowRadius: 20,
              }}>
              AI Gardener
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/aiHelper')}
            className="py-3 px-6 rounded-full my-3 items-center"
            style={{
              width: "50%",
              backgroundColor: "#16a34a",
            }}
          >
            <Text className="text-white font-semibold">Rootly</Text>
          </TouchableOpacity>
        </View>
        <View
          style={{
            marginTop: 20,
            marginHorizontal: 10,
            padding: 15,
            backgroundColor: '#ffffff',
            borderRadius: 12
          }}>
          <View className=""
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexDirection: 'row',
            }}
          >
            <Text className="text-2xl font-bold text-center h-.1 mb-1">
              Your Plants
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/myPlants')}
              className="py-3 px-6 rounded-full items-center"
              style={{
                width: "26%",
                backgroundColor: "#298742",
              }}
            >
              <Text className="text-white font-semibold">See all</Text>
            </TouchableOpacity>
          </View>
          <View
            style={{
              marginTop: 15,
              flexDirection: 'row',
              alignContent: 'flex-start',
              justifyContent: 'flex-start',
            }}
          >
            <PlantCard denumirePlanta="Aloe" poza={""} ddlUdare="20.11.2025" />
            <PlantCard denumirePlanta="Aloe" poza={""} ddlUdare="20.11.2025" />
            <PlantCard denumirePlanta="Aloe" poza={""} ddlUdare="20.11.2025" />
            <PlantCard denumirePlanta="Aloe" poza={""} ddlUdare="20.11.2025" />
            <PlantCard denumirePlanta="Aloe" poza={""} ddlUdare="20.11.2025" />
            <PlantCard denumirePlanta="Aloe" poza={""} ddlUdare="20.11.2025" />
            <PlantCard denumirePlanta="Aloe" poza={""} ddlUdare="20.11.2025" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView >
  );
}

