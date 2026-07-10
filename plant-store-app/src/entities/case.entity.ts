import { supabase } from "../config/superbase";

export interface Case {
  id: number;
  client_id: number;
  plant_id: number;
  disease_id: number;
  fertilizer_ids?: number[]; // one case may have zero or many fertilizers
  solution: string;
  case_date: string;      // DATE → "YYYY-MM-DD" string from Supabase
  cost: number;
}

// ==========================================
// CASES CRUD OPERATIONS
// =========================================
export const subscribeToCases = (onUpdate: (cases: Case[]) => void) => {
  fetchCases(onUpdate);
  const interval = setInterval(() => fetchCases(onUpdate), 5000);
  return () => clearInterval(interval);
};

const fetchCases = async (onUpdate: (cases: Case[]) => void) => {
  try {
    // Include fertilizers via the join table
    const { data, error } = await supabase
      .from("cases")
      .select(`*, case_fertilizers(fertilizer_id)`)

    if (error) throw error;
    // Normalize returned rows to include `fertilizer_ids` array
    const normalized = (data as any[]).map((r) => ({
      ...r,
      fertilizer_ids: (r.case_fertilizers || []).map((cf: any) => cf.fertilizer_id),
    }));
    onUpdate(normalized as Case[]);
  } catch (error) {
    console.error("Error fetching cases:", error);
  }
};

// case_date and created_at are set by Supabase defaults — don't send them
export const addCase = async (
  caseData: Pick<Case, "client_id" | "plant_id" | "disease_id" | "solution"> & { fertilizer_ids?: number[]; cost?: number }
) => {
  const payload = { ...caseData };
  // cost and other fields are allowed by DB defaults
  const { fertilizer_ids, ...caseFields } = payload as any;

  const { data, error } = await supabase
    .from("cases")
    .insert([caseFields])
    .select()
    .single();

  if (error) throw error;
  const caseId = (data as Case).id;

    if (fertilizer_ids && fertilizer_ids.length > 0) {
    const inserts = fertilizer_ids.map((fid: number) => ({ case_id: caseId, fertilizer_id: fid }));
    const { error: insertErr } = await supabase.from("case_fertilizers").insert(inserts);
    if (insertErr) throw insertErr;
  }

  return caseId;
};

export const updateCase = async (
  id: number,
  updates: Partial<Pick<Case, "client_id" | "plant_id" | "disease_id" | "solution">> & { fertilizer_ids?: number[] }
) => {
  const { fertilizer_ids, ...caseFields } = updates as any;

  if (Object.keys(caseFields).length > 0) {
    const { error } = await supabase.from("cases").update(caseFields).eq("id", id);
    if (error) throw error;
  }

  // Sync fertilizers: remove existing and insert new ones if provided
  if (fertilizer_ids) {
    const { error: delErr } = await supabase.from("case_fertilizers").delete().eq("case_id", id);
    if (delErr) throw delErr;

    if (fertilizer_ids.length > 0) {
      const inserts = fertilizer_ids.map((fid: number) => ({ case_id: id, fertilizer_id: fid }));
      const { error: insErr } = await supabase.from("case_fertilizers").insert(inserts);
      if (insErr) throw insErr;
    }
  }
};

export const deleteCase = async (id: number) => {
  const { error } = await supabase.from("cases").delete().eq("id", id);
  if (error) throw error;
};