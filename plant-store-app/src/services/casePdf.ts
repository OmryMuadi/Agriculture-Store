import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

export type CasePdfMaterial = {
  name: string;
  amount: number;
};

export type CasePdfData = {
  caseId: number;
  caseDate: string;
  clientName: string;
  clientPhone?: string;
  clientVillage?: string;
  plantName: string;
  diseaseName: string;
  fertilizers: CasePdfMaterial[];
  pesticides: CasePdfMaterial[];
  solution: string;
  cost: number;
};

const escapeHtml = (value: string | number | undefined) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return dateString;
  return new Date(year, month - 1, day).toLocaleDateString("he-IL");
};

const renderMaterials = (title: string, materials: CasePdfMaterial[]) => {
  const rows = materials
    .map(
      ({ name, amount }) => `
        <tr>
          <td>${escapeHtml(name)}</td>
          <td class="amount">${escapeHtml(amount)} גרם</td>
        </tr>`
    )
    .join("");

  return `
    <section class="section avoid-break">
      <h2>${escapeHtml(title)}</h2>
      ${
        materials.length > 0
          ? `<table>
              <thead>
                <tr><th>שם החומר</th><th>כמות</th></tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>`
          : '<div class="empty">לא נוספו חומרים לטיפול זה</div>'
      }
    </section>`;
};

export const buildCasePdfHtml = (data: CasePdfData) => `
<!DOCTYPE html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      @page { size: A4; margin: 22px; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: #263238;
        background: #ffffff;
        direction: rtl;
        font-family: Arial, "Helvetica Neue", sans-serif;
        font-size: 13px;
        line-height: 1.4;
      }
      .document { width: 100%; }
      .header {
        padding: 18px 22px;
        border-radius: 16px;
        color: #ffffff;
        background: #2e7d32;
        margin-bottom: 10px;
      }
      .brand { font-size: 14px; font-weight: 700; opacity: 0.9; }
      h1 { margin: 3px 0 6px; font-size: 27px; line-height: 1.2; }
      .header-meta { display: flex; gap: 20px; font-size: 13px; }
      .section {
        margin-bottom: 9px;
        padding: 12px 15px;
        border: 1px solid #dfe7df;
        border-radius: 12px;
        background: #ffffff;
      }
      h2 {
        margin: 0 0 8px;
        color: #2e7d32;
        font-size: 17px;
        border-bottom: 2px solid #e8f5e9;
        padding-bottom: 5px;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 7px 14px;
      }
      .client-grid { grid-template-columns: 1.25fr 1fr 1fr; }
      .field {
        padding: 7px 9px;
        border-radius: 8px;
        background: #f6f8f6;
      }
      .field-label { color: #607d68; font-size: 11px; font-weight: 700; }
      .field-value { margin-top: 2px; color: #1b2b1c; font-size: 15px; font-weight: 700; }
      table { width: 100%; border-collapse: collapse; }
      th {
        padding: 6px 8px;
        color: #355a38;
        background: #e8f5e9;
        text-align: right;
        font-size: 12px;
      }
      td { padding: 7px 8px; border-bottom: 1px solid #edf1ed; text-align: right; }
      tr:last-child td { border-bottom: 0; }
      .amount { width: 32%; font-weight: 700; }
      .solution {
        white-space: pre-wrap;
        padding: 10px;
        border-right: 4px solid #2e7d32;
        border-radius: 8px;
        background: #f6f8f6;
      }
      .cost {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-radius: 12px;
        color: #ffffff;
        background: #37474f;
        font-size: 17px;
        font-weight: 700;
      }
      .cost-value { font-size: 22px; }
      .empty { padding: 10px; color: #78909c; background: #fafafa; border-radius: 8px; }
      .footer {
        margin-top: 10px;
        padding-top: 7px;
        border-top: 1px solid #dfe7df;
        color: #78909c;
        text-align: center;
        font-size: 10px;
      }
      .avoid-break { break-inside: avoid; page-break-inside: avoid; }
    </style>
  </head>
  <body>
    <main class="document">
      <header class="header avoid-break">
        <div class="brand">אמא אדמה</div>
        <h1>סיכום טיפול</h1>
        <div class="header-meta">
          <span>טיפול מספר ${escapeHtml(data.caseId)}</span>
          <span>תאריך: ${escapeHtml(formatDate(data.caseDate))}</span>
        </div>
      </header>

      <section class="section avoid-break">
        <h2>פרטי הלקוח</h2>
        <div class="grid client-grid">
          <div class="field">
            <div class="field-label">שם מלא</div>
            <div class="field-value">${escapeHtml(data.clientName)}</div>
          </div>
          <div class="field">
            <div class="field-label">טלפון</div>
            <div class="field-value">${escapeHtml(data.clientPhone || "לא צוין")}</div>
          </div>
          <div class="field">
            <div class="field-label">יישוב</div>
            <div class="field-value">${escapeHtml(data.clientVillage || "לא צוין")}</div>
          </div>
        </div>
      </section>

      <section class="section avoid-break">
        <h2>פרטי הטיפול</h2>
        <div class="grid">
          <div class="field">
            <div class="field-label">גידול</div>
            <div class="field-value">${escapeHtml(data.plantName)}</div>
          </div>
          <div class="field">
            <div class="field-label">מחלה</div>
            <div class="field-value">${escapeHtml(data.diseaseName)}</div>
          </div>
        </div>
      </section>

      ${renderMaterials("דשנים", data.fertilizers)}
      ${renderMaterials("חומרי הדברה", data.pesticides)}

      <section class="section avoid-break">
        <h2>הפתרון שניתן</h2>
        <div class="solution">${escapeHtml(data.solution)}</div>
      </section>

      <section class="cost avoid-break">
        <span>עלות הטיפול</span>
        <span class="cost-value">${escapeHtml(data.cost)} &#8362;</span>
      </section>

      <footer class="footer">מסמך זה הופק באמצעות מערכת אמא אדמה</footer>
    </main>
  </body>
</html>`;

export const exportCasePdf = async (data: CasePdfData) => {
  const html = buildCasePdfHtml(data);

  if (Platform.OS === "web") {
    await Print.printAsync({ html });
    return;
  }

  const { uri } = await Print.printToFileAsync({
    html,
    width: 595,
    height: 842,
  });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("שיתוף קבצים אינו זמין במכשיר זה");
  }

  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
    dialogTitle: `שמירת טיפול ${data.caseId} כ-PDF`,
  });
};
