import { supabase } from "../config/superbase";

export interface Client {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
}

// ==========================================
// CLIENTS CRUD OPERATIONS
// ==========================================
export const subscribeToClients = (onUpdate: (items: Client[]) => void) => {
  fetchClients(onUpdate);
  const interval = setInterval(() => fetchClients(onUpdate), 5000);
  return () => clearInterval(interval);
};

const fetchClients = async (onUpdate: (items: Client[]) => void) => {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("first_name", { ascending: true });

    if (error) throw error;
    onUpdate(data as Client[]);
  } catch (error) {
    console.error("Error fetching clients:", error);
  }
};

export const addClient = async (client: Omit<Client, "id">) => {
  const { data, error } = await supabase
    .from("clients")
    .insert([client])
    .select()
    .single();

  if (error) throw error;
  return (data as Client).id;
};

export const updateClient = async (
  id: number,
  updates: Partial<Omit<Client, "id">>
) => {
  const { error } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
};

export const deleteClient = async (id: number) => {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
};