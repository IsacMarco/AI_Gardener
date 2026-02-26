import { getAuth, FirebaseAuthTypes, onAuthStateChanged } from "@react-native-firebase/auth";
import * as Notifications from "expo-notifications";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  cancelNotification,
  scheduleWateringNotification,
} from "../services/notifications";

const auth = getAuth();

type Plant = {
  _id: string;
  name: string;
  species?: string;
  location?: string;
  imageBase64?: string;
  watering?: {
    enabled: boolean;
    frequency: number;
    time: string;
    notificationId?: string;
  };
  createdAt?: string;
};

type PlantContextType = {
  plants: Plant[];
  loading: boolean;
  refreshPlants: () => Promise<void>;
  deletePlant: (id: string) => Promise<boolean>;
};

const PlantContext = createContext<PlantContextType | undefined>(undefined);

export const PlantProvider = ({ children }: { children: ReactNode }) => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  // --- 1. SYNC NOTIFICATIONS (Doar la Login) ---
  const resyncNotificationsForDevice = async (fetchedPlants: Plant[]) => {
    console.log("🔄 START: Resync notifications (Hard Reset)...");
    await Notifications.cancelAllScheduledNotificationsAsync();

    let scheduledCount = 0;
    for (const plant of fetchedPlants) {
      if (plant.watering && plant.watering.enabled) {
        // Notă: Aici generăm ID-uri noi pentru device-ul curent.
        // Nu le salvăm în DB pentru că DB-ul are deja ID-uri (poate de pe alt device).
        // Asta e o limitare a notificărilor locale, dar e ok pentru MVP.
        await scheduleWateringNotification(
          plant.name,
          plant.watering.frequency,
          plant.watering.time,
        );
        scheduledCount++;
      }
    }
    console.log(`✅ DONE: Scheduled ${scheduledCount} notifications.`);
  };

  // --- 2. FETCH PLANTS (Cu parametru de control) ---
  // syncNotifications = true -> Rulează resync (Doar la Login)
  // syncNotifications = false -> Doar trage datele (La Add/Edit/Refresh)
  const fetchPlants = async (
    specificUserId?: string,
    syncNotifications = false,
  ) => {
    try {
      const currentUid = specificUserId || auth.currentUser?.uid;

      if (!currentUid) {
        setPlants([]);
        setLoading(false);
        return;
      }

      // console.log(`📥 Fetching plants... (Sync: ${syncNotifications})`);

      const response = await fetch(
        process.env.EXPO_PUBLIC_MONGO_SERVER_URL +
          `/plants?userId=${currentUid}`,
      );
      const data = await response.json();

      if (response.ok) {
        setPlants(data);

        // AICI ESTE FIX-UL TĂU:
        // Rulăm resync DOAR dacă am cerut explicit (la Login).
        if (syncNotifications && data.length > 0) {
          await resyncNotificationsForDevice(data);
        }
      } else {
        console.error("Eroare server context:", data);
      }
    } catch (error) {
      console.error("Eroare retea context:", error);
    } finally {
      setLoading(false);
    }
  };

  const deletePlant = async (id: string): Promise<boolean> => {
    try {
      // 1. Căutăm planta local înainte să o ștergem, ca să-i vedem ID-ul notificării
      const plantToDelete = plants.find((p) => p._id === id);

      // 2. Dacă are notificare programată, o anulăm din telefon
      if (plantToDelete?.watering?.notificationId) {
        await cancelNotification(plantToDelete.watering.notificationId);
      }

      // 3. O ștergem din baza de date
      const response = await fetch(
        process.env.EXPO_PUBLIC_MONGO_SERVER_URL + `/plants/${id}`,
        { method: "DELETE" },
      );

      if (response.ok) {
        // 4. Actualizăm UI-ul
        setPlants((prev) => prev.filter((p) => p._id !== id));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Delete error:", error);
      return false;
    }
  };
  // --- 3. AUTH LISTENER ---
  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, async (userState) => {
      setUser(userState);

      if (userState) {
        setLoading(true);
        // ✅ LA LOGIN: Vrem Sync = TRUE
        await fetchPlants(userState.uid, true);
      } else {
        setPlants([]);
        setLoading(false);
      }
    });

    return subscriber;
  }, []);

  return (
    <PlantContext.Provider
      value={{
        plants,
        loading,
        // ✅ LA REFRESH MANUAL (Add/Edit): Vrem Sync = FALSE (default)
        // Astfel nu stricăm notificările abia create.
        refreshPlants: () => fetchPlants(user?.uid, false),
        deletePlant,
      }}
    >
      {children}
    </PlantContext.Provider>
  );
};

export const usePlants = () => {
  const context = useContext(PlantContext);
  if (!context) {
    throw new Error("usePlants must be used within a PlantProvider");
  }
  return context;
};
