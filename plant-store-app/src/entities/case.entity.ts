import { supabase } from "../config/superbase";

export interface CaseFertilizerUsage {
  fertilizer_id: number;
  amount: number;
}

export interface CasePesticideUsage {
  pesticide_id: number;
  amount: number;
}

export interface Case {
  id: number;
  client_id: number;
  plant_id: number;
  disease_id: number;
  fertilizer_usages?: CaseFertilizerUsage[];
  pesticide_usages?: CasePesticideUsage[];
  solution: string;
  case_date: string;      // DATE → "YYYY-MM-DD" string from Supabase
  cultivation_area_m2: number | null;
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
    // Include fertilizers and pesticides via their join tables.
    const { data, error } = await supabase
      .from("cases")
      .select(`*, case_fertilizers(fertilizer_id, amount), case_pesticides(pesticide_id, amount)`)
      .order("case_date", { ascending: false })
      .order("id", { ascending: false });

    if (error) throw error;
    // Normalize the join rows into the shape used by the case form and cards.
    const normalized = (data as any[]).map((r) => ({
      ...r,
      fertilizer_usages: (r.case_fertilizers || []).map((cf: any) => ({
        fertilizer_id: cf.fertilizer_id,
        amount: Number(cf.amount),
      })),
      pesticide_usages: (r.case_pesticides || []).map((cp: any) => ({
        pesticide_id: cp.pesticide_id,
        amount: Number(cp.amount),
      })),
    }));
    onUpdate(normalized as Case[]);
  } catch (error) {
    console.error("Error fetching cases:", error);
  }
};

// case_date is set by the Supabase CURRENT_DATE default.
export const addCase = async (
  caseData: Pick<Case, "client_id" | "plant_id" | "disease_id" | "solution" | "cultivation_area_m2" | "cost"> & {
    fertilizer_usages?: CaseFertilizerUsage[];
    pesticide_usages?: CasePesticideUsage[];
  }
) => {
  const payload = { ...caseData };
  const { fertilizer_usages, pesticide_usages, ...caseFields } = payload;

  const { data, error } = await supabase
    .from("cases")
    .insert([caseFields])
    .select()
    .single();

  if (error) throw error;
  const caseId = (data as Case).id;

  if (fertilizer_usages && fertilizer_usages.length > 0) {
    const inserts = fertilizer_usages.map(({ fertilizer_id, amount }) => ({
      case_id: caseId,
      fertilizer_id,
      amount,
    }));
    const { error: insertErr } = await supabase.from("case_fertilizers").insert(inserts);
    if (insertErr) throw insertErr;
  }

  if (pesticide_usages && pesticide_usages.length > 0) {
    const inserts = pesticide_usages.map(({ pesticide_id, amount }) => ({
      case_id: caseId,
      pesticide_id,
      amount,
    }));
    const { error: insertErr } = await supabase.from("case_pesticides").insert(inserts);
    if (insertErr) throw insertErr;
  }

  return caseId;
};

export const updateCase = async (
  id: number,
  updates: Partial<Pick<Case, "client_id" | "plant_id" | "disease_id" | "solution" | "cultivation_area_m2" | "cost">> & {
    fertilizer_usages?: CaseFertilizerUsage[];
    pesticide_usages?: CasePesticideUsage[];
  }
) => {
  const { fertilizer_usages, pesticide_usages, ...caseFields } = updates;

  if (Object.keys(caseFields).length > 0) {
    const { error } = await supabase.from("cases").update(caseFields).eq("id", id);
    if (error) throw error;
  }

  // Sync fertilizers: remove existing and insert new ones if provided
  if (fertilizer_usages) {
    const { error: delErr } = await supabase.from("case_fertilizers").delete().eq("case_id", id);
    if (delErr) throw delErr;

    if (fertilizer_usages.length > 0) {
      const inserts = fertilizer_usages.map(({ fertilizer_id, amount }) => ({
        case_id: id,
        fertilizer_id,
        amount,
      }));
      const { error: insErr } = await supabase.from("case_fertilizers").insert(inserts);
      if (insErr) throw insErr;
    }
  }

  // Sync pesticides when the field is supplied, including an empty selection.
  if (pesticide_usages) {
    const { error: delErr } = await supabase.from("case_pesticides").delete().eq("case_id", id);
    if (delErr) throw delErr;

    if (pesticide_usages.length > 0) {
      const inserts = pesticide_usages.map(({ pesticide_id, amount }) => ({
        case_id: id,
        pesticide_id,
        amount,
      }));
      const { error: insErr } = await supabase.from("case_pesticides").insert(inserts);
      if (insErr) throw insErr;
    }
  }
};

export const deleteCase = async (id: number) => {
  const { error } = await supabase.from("cases").delete().eq("id", id);
  if (error) throw error;
};
