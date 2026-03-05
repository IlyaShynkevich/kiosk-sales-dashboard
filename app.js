const translations = {
  ru: {
    appTitle: "Подсчет продаж киоска",
    appSubtitle: "Отслеживание по товарам: сколько было, сколько продано, что осталось и сколько нужно довезти.",
    language: "Язык",
    excelFile: "Excel файл",
    sheetFrom: "Лист с",
    sheetTo: "по лист",
    searchProduct: "Поиск товара",
    searchPlaceholder: "Например, pod",
    needToDeliver: "Нужно довезти",
    needBySales: "По продажам",
    needAsInFile: "Как в файле",
    products: "Товары",
    uploadPrompt: "Загрузите Excel-файл",
    colProduct: "Товар",
    colStart: "Было",
    colSold: "Продано",
    colLeft: "Осталось",
    colNeed: "Нужно довезти",
    colRevenue: "Выручка",
    xlsxLoadError: "Не удалось загрузить модуль Excel. Проверьте интернет и обновите страницу.",
    fileLoaded: "Файл загружен",
    period: "Период",
    productsCount: "Товаров",
    statTotalStart: "Всего было (шт)",
    statSold: "Продано (шт)",
    statLeft: "Осталось (шт)",
    statNeed: "Нужно довезти (шт)",
    statRevenue: "Выручка (оценка)",
    noRows: "Ничего не найдено для выбранного периода/поиска."
  },
  en: {
    appTitle: "Kiosk Sales Dashboard",
    appSubtitle: "Track products by opening stock, sold units, leftovers, and replenishment needs.",
    language: "Language",
    excelFile: "Excel file",
    sheetFrom: "Sheet from",
    sheetTo: "to sheet",
    searchProduct: "Product search",
    searchPlaceholder: "For example, pod",
    needToDeliver: "Need to deliver",
    needBySales: "By sales",
    needAsInFile: "As in file",
    products: "Products",
    uploadPrompt: "Upload an Excel file",
    colProduct: "Product",
    colStart: "Opening",
    colSold: "Sold",
    colLeft: "Left",
    colNeed: "Need to deliver",
    colRevenue: "Revenue",
    xlsxLoadError: "Excel module failed to load. Check your internet connection and refresh the page.",
    fileLoaded: "File loaded",
    period: "Period",
    productsCount: "Products",
    statTotalStart: "Total opening (pcs)",
    statSold: "Sold (pcs)",
    statLeft: "Left (pcs)",
    statNeed: "Need to deliver (pcs)",
    statRevenue: "Revenue (estimated)",
    noRows: "No rows found for the selected period/search."
  }
};

const state = {
  workbook: null,
  sheetNames: [],
  rowsBySheet: new Map(),
  language: localStorage.getItem("dashboard_language") || "ru"
};

const fileInput = document.getElementById("fileInput");
const fromSheet = document.getElementById("fromSheet");
const toSheet = document.getElementById("toSheet");
const searchInput = document.getElementById("searchInput");
const stats = document.getElementById("stats");
const rowsEl = document.getElementById("rows");
const statusEl = document.getElementById("status");
const needModeWrap = document.getElementById("needModeWrap");
const langSelect = document.getElementById("langSelect");

fileInput.addEventListener("change", onFileChange);
fromSheet.addEventListener("change", render);
toSheet.addEventListener("change", render);
searchInput.addEventListener("input", render);
needModeWrap.addEventListener("change", render);
langSelect.addEventListener("change", onLanguageChange);

initLanguage();

if (typeof XLSX === "undefined") {
  statusEl.textContent = t("xlsxLoadError");
  fileInput.disabled = true;
}

function initLanguage() {
  if (!translations[state.language]) {
    state.language = "ru";
  }
  langSelect.value = state.language;
  applyTranslations();
}

function onLanguageChange(event) {
  const next = event.target.value;
  if (!translations[next]) return;
  state.language = next;
  localStorage.setItem("dashboard_language", next);
  applyTranslations();
  render();
}

function t(key) {
  return (translations[state.language] && translations[state.language][key]) || translations.ru[key] || key;
}

function getFormatters() {
  const numberLocale = state.language === "en" ? "en-US" : "ru-RU";
  const moneyLocale = state.language === "en" ? "en-US" : "be-BY";
  return {
    fmtNum: new Intl.NumberFormat(numberLocale, { maximumFractionDigits: 0 }),
    fmtMoney: new Intl.NumberFormat(moneyLocale, {
      style: "currency",
      currency: "BYN",
      maximumFractionDigits: 0
    })
  };
}

function applyTranslations() {
  document.documentElement.lang = state.language === "en" ? "en" : "ru";
  document.title = t("appTitle");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = t(key);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key) el.setAttribute("placeholder", t(key));
  });
}

function onFileChange(event) {
  if (typeof XLSX === "undefined") return;
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    state.workbook = XLSX.read(data, { type: "array" });
    state.sheetNames = [...state.workbook.SheetNames];
    state.rowsBySheet.clear();

    for (const sheetName of state.sheetNames) {
      const ws = state.workbook.Sheets[sheetName];
      const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
      state.rowsBySheet.set(sheetName, parseRows(matrix));
    }

    hydrateSheetSelectors();
    searchInput.disabled = false;
    needModeWrap.disabled = false;
    statusEl.textContent = `${t("fileLoaded")}: ${file.name}`;
    render();
  };
  reader.readAsArrayBuffer(file);
}

function hydrateSheetSelectors() {
  fromSheet.innerHTML = "";
  toSheet.innerHTML = "";

  state.sheetNames.forEach((name, idx) => {
    const o1 = document.createElement("option");
    o1.value = String(idx);
    o1.textContent = name;
    fromSheet.appendChild(o1);

    const o2 = document.createElement("option");
    o2.value = String(idx);
    o2.textContent = name;
    toSheet.appendChild(o2);
  });

  fromSheet.disabled = false;
  toSheet.disabled = false;
  fromSheet.value = "0";
  toSheet.value = String(Math.max(0, state.sheetNames.length - 1));
}

function parseRows(matrix) {
  const items = [];
  let emptyStreak = 0;

  for (let i = 5; i < matrix.length; i++) {
    const row = matrix[i] || [];
    const nameA = cleanText(row[3]);
    const nameB = cleanText(row[1]);
    const useFormatA = isLikelyName(nameA);
    const useFormatB = !useFormatA && isLikelyName(nameB);
    const name = useFormatA ? nameA : (useFormatB ? nameB : "");

    if (!name || isSummaryRow(name)) {
      if (items.length > 0) {
        emptyStreak += 1;
        if (emptyStreak >= 8) break;
      }
      continue;
    }
    emptyStreak = 0;

    const startQty = useFormatA ? toNumber(row[4]) : toNumber(row[2]);
    const price = useFormatA ? toNumber(row[5]) : toNumber(row[3]);
    const soldCols = useFormatA ? [7, 8, 9, 10, 11] : [5, 6, 7, 8, 9, 10];
    const sold = soldCols.reduce((sum, idx) => sum + toNumber(row[idx]), 0);
    const leftover = Math.max(startQty - sold, 0);
    const fileNeed = useFormatA ? toNumber(row[16]) : toNumber(row[11]);
    const revenue = sold * price;

    items.push({
      name,
      startQty,
      sold,
      leftover,
      fileNeed,
      revenue,
      recommendedNeed: sold
    });
  }

  return items;
}

function isLikelyName(value) {
  if (!value) return false;
  const text = cleanText(value);
  if (!text) return false;
  if (/^[0-9.,]+$/.test(text)) return false;
  return /[A-Za-zА-Яа-яЁё]/.test(text);
}

function isSummaryRow(name) {
  const text = cleanText(name).toLowerCase();
  if (!text) return false;
  const normalized = text
    .replace(/\uFEFF/g, "")
    .replace(/[^a-zа-яё0-9]+/gi, " ")
    .trim();
  return /^(итог|итого|всего|сумма|total)/i.test(normalized);
}

function render() {
  if (!state.sheetNames.length) {
    if (typeof XLSX !== "undefined") {
      statusEl.textContent = t("uploadPrompt");
    }
    return;
  }

  let start = Number(fromSheet.value || 0);
  let end = Number(toSheet.value || state.sheetNames.length - 1);

  if (start > end) {
    [start, end] = [end, start];
    fromSheet.value = String(start);
    toSheet.value = String(end);
  }

  const needMode = document.querySelector('input[name="needMode"]:checked')?.value || "sales";
  const query = cleanText(searchInput.value).toLowerCase();
  const aggregate = new Map();

  for (let i = start; i <= end; i++) {
    const sheetName = state.sheetNames[i];
    const items = state.rowsBySheet.get(sheetName) || [];

    for (const item of items) {
      const key = item.name.toLowerCase();
      if (!aggregate.has(key)) {
        aggregate.set(key, {
          name: item.name,
          startQty: 0,
          sold: 0,
          leftover: 0,
          need: 0,
          revenue: 0
        });
      }

      const acc = aggregate.get(key);
      acc.startQty += item.startQty;
      acc.sold += item.sold;
      acc.revenue += item.revenue;

      const need = needMode === "sheet" && item.fileNeed > 0 ? item.fileNeed : item.recommendedNeed;
      acc.need += need;
    }
  }

  const rows = [...aggregate.values()]
    .map((x) => {
      x.leftover = Math.max(x.startQty - x.sold, 0);
      return x;
    })
    .filter((x) => !isSummaryRow(x.name))
    .filter((x) => !query || x.name.toLowerCase().includes(query));

  rows.sort((a, b) => b.need - a.need || b.sold - a.sold);
  renderStats(rows, start, end);
  renderTable(rows);
}

function renderStats(rows, start, end) {
  const { fmtNum, fmtMoney } = getFormatters();
  const totalStart = rows.reduce((s, r) => s + r.startQty, 0);
  const totalSold = rows.reduce((s, r) => s + r.sold, 0);
  const totalLeft = rows.reduce((s, r) => s + r.leftover, 0);
  const totalNeed = rows.reduce((s, r) => s + r.need, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);

  const period = `${state.sheetNames[start]} -> ${state.sheetNames[end]}`;
  statusEl.textContent = `${t("period")}: ${period}. ${t("productsCount")}: ${rows.length}`;

  stats.innerHTML = `
    <article class="stat"><div class="stat__label">${t("statTotalStart")}</div><div class="stat__value">${fmtNum.format(totalStart)}</div></article>
    <article class="stat"><div class="stat__label">${t("statSold")}</div><div class="stat__value">${fmtNum.format(totalSold)}</div></article>
    <article class="stat"><div class="stat__label">${t("statLeft")}</div><div class="stat__value">${fmtNum.format(totalLeft)}</div></article>
    <article class="stat"><div class="stat__label">${t("statNeed")}</div><div class="stat__value">${fmtNum.format(totalNeed)}</div></article>
    <article class="stat"><div class="stat__label">${t("statRevenue")}</div><div class="stat__value">${fmtMoney.format(totalRevenue)}</div></article>
  `;
}

function renderTable(rows) {
  const { fmtNum, fmtMoney } = getFormatters();
  if (!rows.length) {
    rowsEl.innerHTML = `<tr><td colspan="6">${t("noRows")}</td></tr>`;
    return;
  }

  rowsEl.innerHTML = rows.map((r) => {
    const needClass = r.need > 0 ? "badge badge--warn" : "badge";
    return `
      <tr>
        <td>${escapeHtml(r.name)}</td>
        <td class="num">${fmtNum.format(r.startQty)}</td>
        <td class="num">${fmtNum.format(r.sold)}</td>
        <td class="num">${fmtNum.format(r.leftover)}</td>
        <td class="num"><span class="${needClass}">${fmtNum.format(r.need)}</span></td>
        <td class="num">${fmtMoney.format(r.revenue)}</td>
      </tr>
    `;
  }).join("");
}

function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const normalized = value.replace(/\s+/g, "").replace(",", ".").trim();
    if (!normalized) return 0;
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function cleanText(value) {
  if (value == null) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function escapeHtml(input) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
