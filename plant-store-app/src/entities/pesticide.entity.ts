import { supabase } from "../config/superbase";

export interface Pesticide {
  id: number;
  name: string;
}

export const subscribeToPesticides = (onUpdate: (items: Pesticide[]) => void) => {
  fetchPesticides(onUpdate);
  const interval = setInterval(() => fetchPesticides(onUpdate), 5000);
  return () => clearInterval(interval);
};

const fetchPesticides = async (onUpdate: (items: Pesticide[]) => void) => {
  try {
    const { data, error } = await supabase
      .from("pesticides")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    onUpdate(data as Pesticide[]);
  } catch (error) {
    console.error("Error fetching pesticides:", error);
  }
};

export const addPesticide = async (pesticide: Omit<Pesticide, "id">) => {
  const { data, error } = await supabase
    .from("pesticides")
    .insert([pesticide])
    .select()
    .single();

  if (error) throw error;
  return (data as Pesticide).id;
};

export const deletePesticide = async (id: number) => {
  const { error } = await supabase.from("pesticides").delete().eq("id", id);
  if (error) throw error;
};
