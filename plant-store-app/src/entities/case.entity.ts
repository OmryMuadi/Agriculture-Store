import { supabase } from "../config/superbase";

export interface Case {
  id: number;
  client_id: number;
  plant_id: number;
  disease_id: number;
  solution: string;
  case_date: string;      // DATE → "YYYY-MM-DD" string from Supabase
  cost: number;
}

// ==========================================
// CASES CRUD OPERATIONS
// ==========================================
export const subscribeToCases = (onUpdate: (cases: Case[]) => void) => {
  fetchCases(onUpdate);
  const interval = setInterval(() => fetchCases(onUpdate), 5000);
  return () => clearInterval(interval);
};

const fetchCases = async (onUpdate: (cases: Case[]) => void) => {
  try {
    const { data, error } = await supabase
      .from("cases")
      .select("*")

    if (error) throw error;
    onUpdate(data as Case[]);
  } catch (error) {
    console.error("Error fetching cases:", error);
  }
};

// case_date and created_at are set by Supabase defaults — don't send them
export const addCase = async (
  caseData: Pick<Case, "client_id" | "plant_id" | "disease_id" | "solution">
) => {
  const { data, error } = await supabase
    .from("cases")
    .insert([caseData])
    .select()
    .single();

  if (error) throw error;
  return (data as Case).id;
};

export const updateCase = async (
  id: number,
  updates: Partial<Pick<Case, "client_id" | "plant_id" | "disease_id" | "solution">>
) => {
  const { error } = await supabase.from("cases").update(updates).eq("id", id);
  if (error) throw error;
};

export const deleteCase = async (id: number) => {
  const { error } = await supabase.from("cases").delete().eq("id", id);
  if (error) throw error;
};