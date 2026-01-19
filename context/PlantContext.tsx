import auth from "@react-native-firebase/auth";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

// Tipul de date
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
    remindersActive?: boolean; // Am adaugat si asta ca era in AddPlant
    preferredTime?: string;
  };
  createdAt?: string;
};

type PlantContextType = {
  plants: Plant[];
  loading: boolean;
  refreshPlants: () => Promise<void>;
  deletePlant: (id: string) => Promise<boolean>; // <--- Functia noua
};

const PlantContext = createContext<PlantContextType | undefined>(undefined);

export const PlantProvider = ({ children }: { children: ReactNode }) => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  // Functia de incarcare plante
  const fetchPlants = async () => {
    try {
      const user = auth().currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      //const SERVER_URL = `http://10.0.2.2:3000/plants?userId=${user.uid}`;

      const response = await fetch(
        process.env.EXPO_PUBLIC_MONGO_SERVER_URL + `/plants?userId=${user.uid}`,
      );
      const data = await response.json();

      if (response.ok) {
        setPlants(data);
      } else {
        console.error("Eroare server context:", data);
      }
    } catch (error) {
      console.error("Eroare retea context:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGICA NOUa PENTRU sTERGERE ---
  const deletePlant = async (id: string): Promise<boolean> => {
    try {
      // 1. URL-ul pentru stergere.
      // NOTa: Asigura-te ca in backend ai ruta DELETE '/plants/:id' sau '/delete-plant/:id'
      //const DELETE_URL = `http://10.0.2.2:3000/plants/${id}`;

      const response = await fetch(
        process.env.EXPO_PUBLIC_MONGO_SERVER_URL + `/plants/${id}`,
        {
          method: "DELETE",
        },
      );
      if (response.ok) {
        // 2. Actualizare Optimista:
        // stergem planta din starea locala imediat, fara sa reincarcam tot de la server.
        setPlants((currentPlants) =>
          currentPlants.filter((plant) => plant._id !== id),
        );
        return true;
      } else {
        console.error("Nu s-a putut sterge planta.");
        return false;
      }
    } catch (error) {
      console.error("Eroare la stergere:", error);
      return false; // Returnam false ca sa stim in UI sa afisam eroare
    }
  };
  // -----------------------------------

  useEffect(() => {
    fetchPlants();
  }, []);

  return (
    <PlantContext.Provider
      value={{ plants, loading, refreshPlants: fetchPlants, deletePlant }}
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
