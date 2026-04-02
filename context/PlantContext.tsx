import { getAuth, FirebaseAuthTypes, onAuthStateChanged } from "@react-native-firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

type PlantPayload = {
  userId: string;
  name: string;
  species: string;
  location: string;
  remindersActive: boolean;
  frequency: number;
  preferredTime: string;
  imageBase64: string | null;
  notificationId: string | null;
};

type PlantUpdatePayload = {
  name: string;
  species: string;
  location: string;
  watering: {
    enabled: boolean;
    frequency: number;
    time: string;
    notificationId?: string | null;
  };
  imageBase64: string | null;
};

type PendingPlant = {
  localId: string;
  payload: PlantPayload;
  createdAt: string;
};

type PendingUpdate = {
  id: string;
  payload: PlantUpdatePayload;
  updatedAt: string;
};

type PendingDelete = {
  id: string;
  deletedAt: string;
};

type AddPlantResult = {
  success: boolean;
  savedLocally: boolean;
};

type PlantContextType = {
  plants: Plant[];
  loading: boolean;
  lastPlantsSource: "server" | "local" | "none";
  usedLocalFallback: boolean;
  shouldShowOfflineModal: boolean;
  dismissLocalFallbackNotice: () => void;
  addPlant: (payload: PlantPayload) => Promise<AddPlantResult>;
  updatePlant: (id: string, payload: PlantUpdatePayload) => Promise<AddPlantResult>;
  refreshPlants: () => Promise<void>;
  deletePlant: (id: string) => Promise<boolean>;
};

const PlantContext = createContext<PlantContextType | undefined>(undefined);
const PLANTS_CACHE_KEY_PREFIX = "plants_cache";
const PENDING_PLANTS_KEY_PREFIX = "pending_plants";
const PENDING_UPDATES_KEY_PREFIX = "pending_updates";
const PENDING_DELETES_KEY_PREFIX = "pending_deletes";
const SERVER_FETCH_TIMEOUT_MS = 7000;

const isAbortLikeError = (error: unknown) => {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.message === "FETCH_TIMEOUT")
  );
};

export const PlantProvider = ({ children }: { children: ReactNode }) => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastPlantsSource, setLastPlantsSource] = useState<
    "server" | "local" | "none"
  >("none");
  const [usedLocalFallback, setUsedLocalFallback] = useState(false);
  const [hasShownOfflineModal, setHasShownOfflineModal] = useState(false);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  const getPlantsCacheKey = (uid: string) => `${PLANTS_CACHE_KEY_PREFIX}_${uid}`;
  const getPendingPlantsKey = (uid: string) =>
    `${PENDING_PLANTS_KEY_PREFIX}_${uid}`;
  const getPendingUpdatesKey = (uid: string) =>
    `${PENDING_UPDATES_KEY_PREFIX}_${uid}`;
  const getPendingDeletesKey = (uid: string) =>
    `${PENDING_DELETES_KEY_PREFIX}_${uid}`;

  const savePlantsToCache = async (uid: string, plantsToCache: Plant[]) => {
    try {
      await AsyncStorage.setItem(
        getPlantsCacheKey(uid),
        JSON.stringify(plantsToCache),
      );
    } catch (error) {
      console.error("Cache save error:", error);
    }
  };

  const loadPlantsFromCache = async (uid: string): Promise<Plant[] | null> => {
    try {
      const raw = await AsyncStorage.getItem(getPlantsCacheKey(uid));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      console.error("Cache load error:", error);
      return null;
    }
  };

  const loadPendingPlants = async (uid: string): Promise<PendingPlant[]> => {
    try {
      const raw = await AsyncStorage.getItem(getPendingPlantsKey(uid));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Pending cache load error:", error);
      return [];
    }
  };

  const savePendingPlants = async (uid: string, pendingPlants: PendingPlant[]) => {
    try {
      await AsyncStorage.setItem(
        getPendingPlantsKey(uid),
        JSON.stringify(pendingPlants),
      );
    } catch (error) {
      console.error("Pending cache save error:", error);
    }
  };

  const loadPendingUpdates = async (uid: string): Promise<PendingUpdate[]> => {
    try {
      const raw = await AsyncStorage.getItem(getPendingUpdatesKey(uid));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Pending updates load error:", error);
      return [];
    }
  };

  const savePendingUpdates = async (
    uid: string,
    pendingUpdates: PendingUpdate[],
  ) => {
    try {
      await AsyncStorage.setItem(
        getPendingUpdatesKey(uid),
        JSON.stringify(pendingUpdates),
      );
    } catch (error) {
      console.error("Pending updates save error:", error);
    }
  };

  const loadPendingDeletes = async (uid: string): Promise<PendingDelete[]> => {
    try {
      const raw = await AsyncStorage.getItem(getPendingDeletesKey(uid));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Pending deletes load error:", error);
      return [];
    }
  };

  const savePendingDeletes = async (
    uid: string,
    pendingDeletes: PendingDelete[],
  ) => {
    try {
      await AsyncStorage.setItem(
        getPendingDeletesKey(uid),
        JSON.stringify(pendingDeletes),
      );
    } catch (error) {
      console.error("Pending deletes save error:", error);
    }
  };

  const buildLocalPlantFromPayload = (
    localId: string,
    payload: PlantPayload,
    createdAt: string,
  ): Plant => ({
    _id: localId,
    name: payload.name,
    species: payload.species,
    location: payload.location,
    imageBase64: payload.imageBase64 || undefined,
    watering: {
      enabled: payload.remindersActive,
      frequency: payload.frequency,
      time: payload.preferredTime,
      notificationId: payload.notificationId || undefined,
    },
    createdAt,
  });

  const applyUpdatePayloadToPlant = (
    plant: Plant,
    payload: PlantUpdatePayload,
  ): Plant => ({
    ...plant,
    name: payload.name,
    species: payload.species,
    location: payload.location,
    imageBase64: payload.imageBase64 || undefined,
    watering: {
      enabled: payload.watering.enabled,
      frequency: payload.watering.frequency,
      time: payload.watering.time,
      notificationId: payload.watering.notificationId || undefined,
    },
  });

  const mapUpdatePayloadToCreatePayload = (
    existing: PlantPayload,
    updatePayload: PlantUpdatePayload,
  ): PlantPayload => ({
    ...existing,
    name: updatePayload.name,
    species: updatePayload.species,
    location: updatePayload.location,
    remindersActive: updatePayload.watering.enabled,
    frequency: updatePayload.watering.frequency,
    preferredTime: updatePayload.watering.time,
    imageBase64: updatePayload.imageBase64,
    notificationId: updatePayload.watering.notificationId || null,
  });

  const applyPendingUpdatesToPlants = (
    basePlants: Plant[],
    pendingUpdates: PendingUpdate[],
  ) => {
    const updateMap = new Map(pendingUpdates.map((item) => [item.id, item.payload]));

    return basePlants.map((plant) => {
      const update = updateMap.get(plant._id);
      return update ? applyUpdatePayloadToPlant(plant, update) : plant;
    });
  };

  const mergeLocalWithServer = (
    serverPlants: Plant[],
    pendingPlants: PendingPlant[],
    pendingUpdates: PendingUpdate[],
    pendingDeletes: PendingDelete[],
  ) => {
    const deletedIds = new Set(pendingDeletes.map((item) => item.id));

    const pendingLocalIds = new Set(pendingPlants.map((item) => item.localId));

    const cleanedServerPlants = serverPlants.filter(
      (plant) => !plant._id.startsWith("local-") && !pendingLocalIds.has(plant._id),
    );

    const filteredServerPlants = cleanedServerPlants.filter(
      (plant) => !deletedIds.has(plant._id),
    );

    const serverPlantsWithPendingUpdates = applyPendingUpdatesToPlants(
      filteredServerPlants,
      pendingUpdates,
    );

    const localPendingPlants = pendingPlants.map((pendingPlant) =>
      buildLocalPlantFromPayload(
        pendingPlant.localId,
        pendingPlant.payload,
        pendingPlant.createdAt,
      ),
    );

    return dedupePlantsById([...localPendingPlants, ...serverPlantsWithPendingUpdates]);
  };

  const dedupePlantsById = (list: Plant[]) => {
    const seen = new Set<string>();
    const result: Plant[] = [];

    for (const plant of list) {
      if (!seen.has(plant._id)) {
        seen.add(plant._id);
        result.push(plant);
      }
    }

    return result;
  };

  const fetchWithTimeout = async (url: string, options?: RequestInit) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SERVER_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (error) {
      if (isAbortLikeError(error)) {
        throw new Error("FETCH_TIMEOUT");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const postPlantToServer = async (payload: PlantPayload): Promise<boolean> => {
    const response = await fetchWithTimeout(
      process.env.EXPO_PUBLIC_MONGO_SERVER_URL + "/add-plant",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    return response.ok;
  };

  const putPlantToServer = async (
    id: string,
    payload: PlantUpdatePayload,
  ): Promise<boolean> => {
    const response = await fetchWithTimeout(
      process.env.EXPO_PUBLIC_MONGO_SERVER_URL + `/plants/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    return response.ok;
  };

  const deletePlantFromServer = async (id: string): Promise<boolean> => {
    const response = await fetchWithTimeout(
      process.env.EXPO_PUBLIC_MONGO_SERVER_URL + `/plants/${id}`,
      {
        method: "DELETE",
      },
    );

    return response.ok || response.status === 404;
  };

  const syncPendingChangesToServer = async (uid: string) => {
    let pendingPlants = await loadPendingPlants(uid);
    let pendingUpdates = await loadPendingUpdates(uid);
    let pendingDeletes = await loadPendingDeletes(uid);

    if (pendingDeletes.length > 0 && pendingUpdates.length > 0) {
      const deletedIds = new Set(pendingDeletes.map((item) => item.id));
      pendingUpdates = pendingUpdates.filter((item) => !deletedIds.has(item.id));
      await savePendingUpdates(uid, pendingUpdates);
    }

    let syncedAny = false;
    const remainingPending: PendingPlant[] = [];

    for (const pendingPlant of pendingPlants) {
      try {
        const isSaved = await postPlantToServer(pendingPlant.payload);
        if (isSaved) {
          syncedAny = true;
        } else {
          remainingPending.push(pendingPlant);
        }
      } catch {
        remainingPending.push(pendingPlant);
      }
    }

    await savePendingPlants(uid, remainingPending);
    pendingPlants = remainingPending;

    if (pendingUpdates.length > 0) {
      const remainingPendingUpdates: PendingUpdate[] = [];

      for (const pendingUpdate of pendingUpdates) {
        try {
          const isSaved = await putPlantToServer(
            pendingUpdate.id,
            pendingUpdate.payload,
          );

          if (isSaved) {
            syncedAny = true;
          } else {
            remainingPendingUpdates.push(pendingUpdate);
          }
        } catch {
          remainingPendingUpdates.push(pendingUpdate);
        }
      }

      await savePendingUpdates(uid, remainingPendingUpdates);
      pendingUpdates = remainingPendingUpdates;
    }

    if (pendingDeletes.length > 0) {
      const remainingPendingDeletes: PendingDelete[] = [];

      for (const pendingDelete of pendingDeletes) {
        try {
          const isDeleted = await deletePlantFromServer(pendingDelete.id);

          if (isDeleted) {
            syncedAny = true;
          } else {
            remainingPendingDeletes.push(pendingDelete);
          }
        } catch {
          remainingPendingDeletes.push(pendingDelete);
        }
      }

      await savePendingDeletes(uid, remainingPendingDeletes);
      pendingDeletes = remainingPendingDeletes;
    }

    return { syncedAny };
  };

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
    const currentUid = specificUserId || auth.currentUser?.uid;

    try {
      if (!currentUid) {
        setPlants([]);
        setLastPlantsSource("none");
        setUsedLocalFallback(false);
        setLoading(false);
        return;
      }

      // console.log(`📥 Fetching plants... (Sync: ${syncNotifications})`);

      let response = await fetchWithTimeout(
        process.env.EXPO_PUBLIC_MONGO_SERVER_URL +
          `/plants?userId=${currentUid}`,
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      let data = await response.json();
      let serverPlants = Array.isArray(data) ? data : [];

      const { syncedAny } = await syncPendingChangesToServer(currentUid);

      if (syncedAny) {
        response = await fetchWithTimeout(
          process.env.EXPO_PUBLIC_MONGO_SERVER_URL +
            `/plants?userId=${currentUid}`,
        );

        if (response.ok) {
          data = await response.json();
          serverPlants = Array.isArray(data) ? data : [];
        }
      }

      const pendingPlants = await loadPendingPlants(currentUid);
      const pendingUpdates = await loadPendingUpdates(currentUid);
      const pendingDeletes = await loadPendingDeletes(currentUid);

      const mergedPlants = mergeLocalWithServer(
        serverPlants,
        pendingPlants,
        pendingUpdates,
        pendingDeletes,
      );

      setPlants(mergedPlants);
      setLastPlantsSource("server");
      setUsedLocalFallback(false);
      setHasShownOfflineModal(false);
      await savePlantsToCache(currentUid, mergedPlants);

      if (syncNotifications && mergedPlants.length > 0) {
        await resyncNotificationsForDevice(mergedPlants);
      }
    } catch (error) {
      if (isAbortLikeError(error)) {
        console.log("Server timeout reached, switched to local cache.");
      } else {
        console.error("Network error in plant context:", error);
      }

      if (currentUid) {
        const cachedPlants = await loadPlantsFromCache(currentUid);
        const pendingPlants = await loadPendingPlants(currentUid);
        const pendingUpdates = await loadPendingUpdates(currentUid);
        const pendingDeletes = await loadPendingDeletes(currentUid);

        const mergedLocalPlants = mergeLocalWithServer(
          cachedPlants || [],
          pendingPlants,
          pendingUpdates,
          pendingDeletes,
        );

        setPlants(mergedLocalPlants);
        setLastPlantsSource("local");
        setUsedLocalFallback(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const addPlant = async (payload: PlantPayload): Promise<AddPlantResult> => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      return { success: false, savedLocally: false };
    }

    try {
      const savedToServer = await postPlantToServer(payload);

      if (savedToServer) {
        await fetchPlants(currentUid, false);
        return { success: true, savedLocally: false };
      }
    } catch {
      // Fallback to local store handled below
    }

    const createdAt = new Date().toISOString();
    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const pendingPlant: PendingPlant = {
      localId,
      payload,
      createdAt,
    };

    const existingPending = await loadPendingPlants(currentUid);
    const updatedPending = [pendingPlant, ...existingPending];
    await savePendingPlants(currentUid, updatedPending);

    const localPlant = buildLocalPlantFromPayload(localId, payload, createdAt);
    const updatedPlants = dedupePlantsById([localPlant, ...plants]);
    setPlants(updatedPlants);
    setLastPlantsSource("local");
    setUsedLocalFallback(true);
    await savePlantsToCache(currentUid, updatedPlants);

    return { success: true, savedLocally: true };
  };

  const updatePlant = async (
    id: string,
    payload: PlantUpdatePayload,
  ): Promise<AddPlantResult> => {
    const currentUid = auth.currentUser?.uid;

    if (!currentUid) {
      return { success: false, savedLocally: false };
    }

    if (id.startsWith("local-")) {
      const pendingPlants = await loadPendingPlants(currentUid);
      const updatedPendingPlants = pendingPlants.map((pendingPlant) =>
        pendingPlant.localId === id
          ? {
              ...pendingPlant,
              payload: mapUpdatePayloadToCreatePayload(
                pendingPlant.payload,
                payload,
              ),
            }
          : pendingPlant,
      );

      await savePendingPlants(currentUid, updatedPendingPlants);

      const updatedPlants = plants.map((plant) =>
        plant._id === id ? applyUpdatePayloadToPlant(plant, payload) : plant,
      );

      setPlants(dedupePlantsById(updatedPlants));
      setLastPlantsSource("local");
      setUsedLocalFallback(true);
      await savePlantsToCache(currentUid, updatedPlants);

      return { success: true, savedLocally: true };
    }

    try {
      const savedToServer = await putPlantToServer(id, payload);

      if (savedToServer) {
        await fetchPlants(currentUid, false);
        return { success: true, savedLocally: false };
      }
    } catch {
      // Fallback to pending queue below
    }

    const pendingDeletes = await loadPendingDeletes(currentUid);
    const isPendingDelete = pendingDeletes.some((item) => item.id === id);

    if (isPendingDelete) {
      return { success: true, savedLocally: true };
    }

    const pendingUpdates = await loadPendingUpdates(currentUid);
    const updatedPendingUpdates = [
      { id, payload, updatedAt: new Date().toISOString() },
      ...pendingUpdates.filter((item) => item.id !== id),
    ];

    await savePendingUpdates(currentUid, updatedPendingUpdates);

    const updatedPlants = plants.map((plant) =>
      plant._id === id ? applyUpdatePayloadToPlant(plant, payload) : plant,
    );
    setPlants(dedupePlantsById(updatedPlants));
    setLastPlantsSource("local");
    setUsedLocalFallback(true);
    await savePlantsToCache(currentUid, updatedPlants);

    return { success: true, savedLocally: true };
  };

  const deletePlant = async (id: string): Promise<boolean> => {
    const currentUid = auth.currentUser?.uid;

    if (!currentUid) {
      return false;
    }

    const plantToDelete = plants.find((p) => p._id === id);
    if (plantToDelete?.watering?.notificationId) {
      await cancelNotification(plantToDelete.watering.notificationId);
    }

    const updatedPlants = plants.filter((p) => p._id !== id);

    if (id.startsWith("local-")) {
      setPlants(updatedPlants);

      const pendingPlants = await loadPendingPlants(currentUid);
      const updatedPending = pendingPlants.filter((p) => p.localId !== id);
      await savePendingPlants(currentUid, updatedPending);
      await savePlantsToCache(currentUid, updatedPlants);

      return true;
    }

    try {
      const deletedFromServer = await deletePlantFromServer(id);

      if (deletedFromServer) {
        const pendingUpdates = await loadPendingUpdates(currentUid);
        await savePendingUpdates(
          currentUid,
          pendingUpdates.filter((item) => item.id !== id),
        );

        const pendingDeletes = await loadPendingDeletes(currentUid);
        await savePendingDeletes(
          currentUid,
          pendingDeletes.filter((item) => item.id !== id),
        );

        setPlants(updatedPlants);
        await savePlantsToCache(currentUid, updatedPlants);

        return true;
      }
    } catch {
      // Fallback to pending queue below
    }

    const pendingDeletes = await loadPendingDeletes(currentUid);
    const updatedPendingDeletes = [
      { id, deletedAt: new Date().toISOString() },
      ...pendingDeletes.filter((item) => item.id !== id),
    ];
    await savePendingDeletes(currentUid, updatedPendingDeletes);

    const pendingUpdates = await loadPendingUpdates(currentUid);
    await savePendingUpdates(
      currentUid,
      pendingUpdates.filter((item) => item.id !== id),
    );

    setPlants(updatedPlants);
    setLastPlantsSource("local");
    setUsedLocalFallback(true);
    await savePlantsToCache(currentUid, updatedPlants);

    return true;
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
        setLastPlantsSource("none");
        setUsedLocalFallback(false);
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
        lastPlantsSource,
        usedLocalFallback,
        shouldShowOfflineModal: usedLocalFallback && !hasShownOfflineModal,
        dismissLocalFallbackNotice: () => {
          setHasShownOfflineModal(true);
          setUsedLocalFallback(false);
        },
        addPlant,
        updatePlant,
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
