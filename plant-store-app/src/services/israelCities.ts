/** CKAN DataStore (data.gov.il) */
const DATA_GOV_CKAN = 'https://data.gov.il/api/3/action/datastore_search';

/**
 * מאגר "טבלת ישובים" (למ"ס) — resource פעיל ב-data.gov.il.
 * ה-UUID מהתכנון המקורי (5c78ad88-…) אינו קיים יותר ב-API; נשתמש במאגר הרשמי המקביל.
 */
export const ISRAEL_SETTLEMENTS_RESOURCE_ID = 'b7cf8f14-64a2-4b33-8d4b-edb286fdbd37';

/** שם עמודת שם הישוב בעברית במאגר זה */
export const SETTLEMENT_NAME_FIELD = 'שם_ישוב';

export type CityDropdownItem = {
  label: string;
  value: string;
};

type CkanDatastoreResponse = {
  success: boolean;
  error?: { message?: string };
  result?: {
    records: Record<string, unknown>[];
    total?: number;
  };
};

function normalizeName(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;

  const s = String(raw)
    .replace(/\s+/g, ' ')
    .trim();

  if (!s) return null;

  const cleaned = s
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*\)[^)]*\(\s*/g, ' ')
    .replace(/\s*\)[^)]*\(/g, '')
    .replace(/\b(ישוב|כפר|עיר|שכונה|מושב|קיבוץ|יישוב קהילתי|מועצה מקומית|מועצה אזורית|רשות מקומית|מועצה|אזורי)\b/gi, ' ')
    .replace(/\b(שבט|שבטי|שבטים)\b/gi, ' ')
    .replace(/\b(ה|ו|של|על|ב|ל|מ|ש|כ|העיר|הכפר|השכונה)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.length > 0 ? cleaned : null;
}

/**
 * מושך את כל רשומות הישובים (עם pagination אם נדרש), מנקה רווחים, מסיר כפילויות, ממיין לעברית.
 */
export async function fetchIsraelCities(): Promise<CityDropdownItem[]> {
  const resourceId = ISRAEL_SETTLEMENTS_RESOURCE_ID;
  const allRecords: Record<string, unknown>[] = [];
  let offset = 0;
  const pageLimit = 3200;
  let total = Number.POSITIVE_INFINITY;

  try {
    while (offset < total) {
      const params = new URLSearchParams({
        resource_id: resourceId,
        limit: String(pageLimit),
        offset: String(offset),
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(`${DATA_GOV_CKAN}?${params.toString()}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`שגיאת רשת: ${response.status}`);
      }

      const data = (await response.json()) as CkanDatastoreResponse;

      if (!data.success || !data.result) {
        const msg = data.error?.message || 'השרת לא החזיר נתוני ישובים';
        throw new Error(msg);
      }

      const { records } = data.result;
      const t = data.result.total;

      allRecords.push(...records);

      if (typeof t === 'number') {
        total = t;
      } else if (records.length < pageLimit) {
        total = allRecords.length;
      }

      offset += records.length;

      if (records.length === 0) break;
      if (allRecords.length >= total) break;
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message || 'בעיית רשת — נסה שוב מאוחר יותר');
    }
    throw new Error('בעיית רשת — נסה שוב מאוחר יותר');
  }

  const seen = new Set<string>();
  const items: CityDropdownItem[] = [];

  for (const rec of allRecords) {
    const name = normalizeName(rec[SETTLEMENT_NAME_FIELD]);
    if (!name) continue;

    const key = name.replace(/\s+/g, ' ').trim();
    if (seen.has(key)) continue;

    seen.add(key);
    items.push({ label: key, value: key });
  }

  items.sort((a, b) => a.label.localeCompare(b.label, 'he'));

  return items;
}
