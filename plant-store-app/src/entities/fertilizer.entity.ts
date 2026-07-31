import { supabase } from "../config/superbase";

export interface Fertilizer {
  id: number;
  name: string;
}

// ==========================================
// FERTILIZERS CRUD OPERATIONS
// ==========================================
export const subscribeToFertilizers = (onUpdate: (items: Fertilizer[]) => void) => {
  fetchFertilizers(onUpdate);
  const interval = setInterval(() => fetchFertilizers(onUpdate), 5000);
  return () => clearInterval(interval);
};

const fetchFertilizers = async (onUpdate: (items: Fertilizer[]) => void) => {
  try {
    const { data, error } = await supabase
      .from("fertilizers")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    onUpdate(data as Fertilizer[]);
  } catch (error) {
    console.error("Error fetching fertilizers:", error);
  }
};

export const addFertilizer = async (fertilizer: Omit<Fertilizer, "id">) => {
  const { data, error } = await supabase
    .from("fertilizers")
    .insert([fertilizer])
    .select()
    .single();

  if (error) throw error;
  return (data as Fertilizer).id;
};

export const deleteFertilizer = async (id: number) => {
  const { error } = await supabase.from("fertilizers").delete().eq("id", id);
  if (error) throw error;
};
