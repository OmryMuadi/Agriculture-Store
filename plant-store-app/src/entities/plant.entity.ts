import { supabase } from "../config/superbase";

export interface Plant {
  id: number;
  name: string;
}

// ==========================================
// PLANTS CRUD OPERATIONS
// ==========================================
export const subscribeToPlants = (onUpdate: (items: Plant[]) => void) => {
  fetchPlants(onUpdate);
  const interval = setInterval(() => fetchPlants(onUpdate), 5000);
  return () => clearInterval(interval);
};

const fetchPlants = async (onUpdate: (items: Plant[]) => void) => {
  try {
    const { data, error } = await supabase
      .from("plants")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    onUpdate(data as Plant[]);
  } catch (error) {
    console.error("Error fetching plants:", error);
  }
};

export const addPlant = async (plant: Omit<Plant, "id">) => {
  const { data, error } = await supabase
    .from("plants")
    .insert([plant])
    .select()
    .single();

  if (error) throw error;
  return (data as Plant).id;
};

export const deletePlant = async (id: number) => {
  const { error } = await supabase.from("plants").delete().eq("id", id);
  if (error) throw error;
};