import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// 1. Handler configured to show notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 2. Request permission from the user
export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  //   if (!Device.isDevice) {
  //     console.log("Must use physical device for Push Notifications");
  //     return;
  //   }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    alert("Failed to get push token for push notification!");
    return;
  }
}

// 3. Scheduling Function (Mathematics for calculating next trigger date)
export async function scheduleWateringNotification(
  plantName: string,
  frequencyDays: number,
  timeString: string, // format "HH:mm"
) {
  const [hour, minute] = timeString.split(":").map(Number);

  const triggerDate = new Date();
  triggerDate.setHours(hour, minute, 0, 0);

  const now = new Date();

  // If the time hasn't passed yet today, schedule for today.
  // Otherwise, add the frequency.
  if (triggerDate <= now) {
    triggerDate.setDate(triggerDate.getDate() + frequencyDays);
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `🌱 Time to water your plant ${plantName}!`,
      body: `It's been ${frequencyDays} days. Keep it hydrated!`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  if (!notificationId) {
    console.warn("Failed to schedule notification for ", plantName);
    return null;
  } else {
    console.log(
      `Scheduled notification (${notificationId}) for plant ${plantName} at ${triggerDate}`,
    );
  }
  return notificationId;
}

// 4. Cancel Function
export async function cancelNotification(notificationId: string) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`Cancelled notification: ${notificationId}`);
  } catch (error) {
    console.warn("Could not cancel notification", error);
  }
}
