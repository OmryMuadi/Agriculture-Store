import { supabase } from "../config/superbase";

export interface Disease {
  id: number;
  name: string;
}

// ==========================================
// DISEASES CRUD OPERATIONS
// ==========================================
export const subscribeToDiseases = (onUpdate: (items: Disease[]) => void) => {
  fetchDiseases(onUpdate);
  const interval = setInterval(() => fetchDiseases(onUpdate), 5000);
  return () => clearInterval(interval);
};

const fetchDiseases = async (onUpdate: (items: Disease[]) => void) => {
  try {
    const { data, error } = await supabase
      .from("plant_diseases")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    onUpdate(data as Disease[]);
  } catch (error) {
    console.error("Error fetching diseases:", error);
  }
};

export const addDisease = async (disease: Omit<Disease, "id">) => {
  const { data, error } = await supabase
    .from("plant_diseases")
    .insert([disease])
    .select()
    .single();

  if (error) throw error;
  return (data as Disease).id;
};

export const deleteDisease = async (id: number) => {
  const { error } = await supabase.from("plant_diseases").delete().eq("id", id);
  if (error) throw error;
};