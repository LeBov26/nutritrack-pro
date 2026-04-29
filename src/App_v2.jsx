import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & SEED DATA
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = { goalKcal: 1900, goalWeight: 105, startWeight: 118.5, intolerances: ["coriandre"] };
const MACROS = { protein: 150, carbs: 190, fat: 63 };
const TABS = [
  { id: "today", icon: "🥗", label: "Aujourd'hui" },
  { id: "weight", icon: "⚖️", label: "Poids" },
  { id: "history", icon: "📅", label: "Historique" },
  { id: "stats", icon: "📊", label: "Stats" },
  { id: "coach", icon: "💬", label: "Coach" },
  { id: "settings", icon: "⚙️", label: "Réglages" },
];
const MEAL_TYPES = ["🌅 Petit-déj", "☀️ Déjeuner", "🌙 Dîner", "🍎 Collation"];

// unit: "g" = saisie en grammes (valeurs pour 100g), "ml" = saisie en ml (valeurs pour 100ml), "unit" = par pièce (pas de saisie grammes)
const FOOD_DB = [
  // Viandes & poissons
  { name: "Blanc de poulet", unit: "g", cal: 110, protein: 23, carbs: 0, fat: 2 },
  { name: "Bœuf haché 5%", unit: "g", cal: 130, protein: 22, carbs: 0, fat: 5 },
  { name: "Saumon", unit: "g", cal: 208, protein: 20, carbs: 0, fat: 14 },
  { name: "Thon en boîte", unit: "g", cal: 116, protein: 26, carbs: 0, fat: 1 },
  { name: "Colin", unit: "g", cal: 82, protein: 18, carbs: 0, fat: 1 },
  { name: "Crevettes", unit: "g", cal: 85, protein: 18, carbs: 1, fat: 1 },
  { name: "Surimi", unit: "g", cal: 95, protein: 8, carbs: 13, fat: 1 },
  { name: "Œuf entier", unit: "unit", defaultQty: 1, cal: 78, protein: 6, carbs: 0, fat: 5 },
  // Féculents
  { name: "Pâtes crues", unit: "g", cal: 359, protein: 13, carbs: 71, fat: 2 },
  { name: "Riz cru", unit: "g", cal: 350, protein: 7, carbs: 77, fat: 1 },
  { name: "Patate douce", unit: "g", cal: 86, protein: 2, carbs: 20, fat: 0 },
  { name: "Pain complet", unit: "g", cal: 233, protein: 9, carbs: 44, fat: 3 },
  { name: "Gratin ravioles", unit: "g", cal: 223, protein: 6, carbs: 24, fat: 11 },
  // Légumes
  { name: "Avocat", unit: "g", cal: 160, protein: 2, carbs: 2, fat: 15 },
  { name: "Brocolis", unit: "g", cal: 34, protein: 3, carbs: 5, fat: 0 },
  { name: "Poivron", unit: "g", cal: 28, protein: 1, carbs: 6, fat: 0 },
  { name: "Épinards", unit: "g", cal: 23, protein: 3, carbs: 1, fat: 0 },
  { name: "Haricots verts", unit: "g", cal: 31, protein: 2, carbs: 5, fat: 0 },
  { name: "Petits pois", unit: "g", cal: 81, protein: 5, carbs: 14, fat: 0 },
  { name: "Tomate", unit: "g", cal: 18, protein: 1, carbs: 3, fat: 0 },
  { name: "Oignon", unit: "g", cal: 40, protein: 1, carbs: 9, fat: 0 },
  { name: "Salade verte", unit: "g", cal: 15, protein: 1, carbs: 2, fat: 0 },
  { name: "Betterave", unit: "g", cal: 43, protein: 2, carbs: 10, fat: 0 },
  // Fruits
  { name: "Pomme", unit: "unit", defaultQty: 1, cal: 80, protein: 0, carbs: 21, fat: 0 },
  { name: "Kiwi", unit: "unit", defaultQty: 1, cal: 42, protein: 1, carbs: 10, fat: 0 },
  { name: "Banane", unit: "unit", defaultQty: 1, cal: 89, protein: 1, carbs: 23, fat: 0 },
  { name: "Mangue", unit: "g", cal: 60, protein: 1, carbs: 15, fat: 0 },
  { name: "Ananas", unit: "g", cal: 50, protein: 1, carbs: 13, fat: 0 },
  // Laitages
  { name: "Yaourt nature", unit: "g", cal: 60, protein: 6, carbs: 7, fat: 2 },
  { name: "Fromage blanc 0%", unit: "g", cal: 45, protein: 8, carbs: 4, fat: 0 },
  { name: "Cottage cheese", unit: "g", cal: 98, protein: 11, carbs: 3, fat: 4 },
  { name: "Ricotta", unit: "g", cal: 174, protein: 11, carbs: 3, fat: 13 },
  { name: "Mousse au chocolat", unit: "unit", defaultQty: 1, cal: 230, protein: 4, carbs: 28, fat: 11 },
  // Condiments & liquides
  { name: "Huile d'olive", unit: "ml", cal: 884, protein: 0, carbs: 0, fat: 100 },
  { name: "Huile de sésame", unit: "ml", cal: 820, protein: 0, carbs: 0, fat: 91 },
  { name: "Sauce soja", unit: "ml", cal: 50, protein: 5, carbs: 7, fat: 0 },
  { name: "Cappuccino", unit: "unit", defaultQty: 1, cal: 80, protein: 4, carbs: 8, fat: 3 },
  { name: "Bonbons", unit: "g", cal: 350, protein: 0, carbs: 87, fat: 0 },
];

// Helper: calcule les macros en fonction du poids/quantité saisi
function calcFood(food, qty) {
  if (food.unit === "unit") return { cal: Math.round(food.cal * qty), protein: Math.round(food.protein * qty), carbs: Math.round(food.carbs * qty), fat: Math.round(food.fat * qty) };
  return { cal: Math.round(food.cal * qty / 100), protein: Math.round(food.protein * qty / 100), carbs: Math.round(food.carbs * qty / 100), fat: Math.round(food.fat * qty / 100) };
}

const HISTORY_DAYS = {
  "2026-04-19": { meals: { "☀️ Déjeuner": [{ id: 1, name: "Salade crevettes / pâtes / avocat / cottage", cal: 1200, protein: 45, carbs: 120, fat: 35 }], "🌙 Dîner": [{ id: 2, name: "Mousse chocolat", cal: 470, protein: 6, carbs: 55, fat: 25 }] } },
  "2026-04-20": { meals: { "☀️ Déjeuner": [{ id: 1, name: "Gamelle poulet / pâtes / brocolis", cal: 600, protein: 45, carbs: 65, fat: 12 }, { id: 2, name: "Kiwi + yaourt", cal: 130, protein: 6, carbs: 20, fat: 2 }], "🌙 Dîner": [{ id: 3, name: "Gratin ravioles (~350g)", cal: 780, protein: 22, carbs: 85, fat: 38 }, { id: 4, name: "Mousse + pomme", cal: 260, protein: 4, carbs: 38, fat: 10 }] } },
  "2026-04-21": { meals: { "☀️ Déjeuner": [{ id: 1, name: "Gamelle riz / bœuf / poulet", cal: 650, protein: 50, carbs: 70, fat: 14 }, { id: 2, name: "Kiwi + yaourt", cal: 130, protein: 6, carbs: 20, fat: 2 }], "🌙 Dîner": [{ id: 3, name: "Gratin + pâtes + mousse + pomme", cal: 995, protein: 25, carbs: 115, fat: 42 }] } },
  "2026-04-22": { meals: { "☀️ Déjeuner": [{ id: 1, name: "Gamelle riz / brocolis / poulet", cal: 580, protein: 42, carbs: 68, fat: 10 }], "🌙 Dîner": [{ id: 2, name: "Traiteur chinois (riz + bœuf oignons + algues)", cal: 850, protein: 35, carbs: 95, fat: 28 }, { id: 3, name: "Bonbons + pomme + fromage blanc", cal: 320, protein: 10, carbs: 63, fat: 2 }] } },
  "2026-04-23": { meals: { "☀️ Déjeuner": [{ id: 1, name: "Gamelle bœuf / légumes / patate douce", cal: 580, protein: 38, carbs: 62, fat: 14 }, { id: 2, name: "Kiwi + yaourt", cal: 130, protein: 6, carbs: 20, fat: 2 }], "🌙 Dîner": [{ id: 3, name: "Salade pâtes + crevettes + surimi", cal: 505, protein: 28, carbs: 68, fat: 10 }, { id: 4, name: "Bonbons + pomme", cal: 230, protein: 0, carbs: 59, fat: 0 }] } },
  "2026-04-24": { meals: { "☀️ Déjeuner": [{ id: 1, name: "Gamelle colin / légumes / petits pois", cal: 520, protein: 38, carbs: 48, fat: 10 }, { id: 2, name: "Kiwi + yaourt", cal: 130, protein: 6, carbs: 20, fat: 2 }], "🌙 Dîner": [{ id: 3, name: "Salade pâtes + surimi + betteraves + cottage", cal: 745, protein: 30, carbs: 95, fat: 18 }, { id: 4, name: "Pomme", cal: 80, protein: 0, carbs: 21, fat: 0 }] } },
  "2026-04-25": { meals: { "☀️ Déjeuner": [{ id: 1, name: "Restaurant burger + frites + crème brûlée + pain", cal: 1350, protein: 38, carbs: 145, fat: 58 }], "🌙 Dîner": [{ id: 2, name: "Dîner léger poulet / légumes + salade + pomme", cal: 530, protein: 35, carbs: 43, fat: 12 }] } },
  "2026-04-26": { meals: { "☀️ Déjeuner": [{ id: 1, name: "Bœuf / frites / haricots + ananas + bonbons", cal: 955, protein: 39, carbs: 133, fat: 28 }], "🌙 Dîner": [{ id: 2, name: "McDo (Royal cheese + frites + 2 cheeseburgers)", cal: 1150, protein: 48, carbs: 120, fat: 52 }] } },
  "2026-04-27": { meals: { "☀️ Déjeuner": [{ id: 1, name: "Gamelle poulet / pâtes / brocolis", cal: 600, protein: 45, carbs: 65, fat: 12 }, { id: 2, name: "Mousse + pomme + cappuccino", cal: 295, protein: 5, carbs: 42, fat: 10 }], "🌙 Dîner": [{ id: 3, name: "Salade pâtes + crevettes + avocat + sauce skyr", cal: 440, protein: 28, carbs: 52, fat: 14 }, { id: 4, name: "Pomme + mousse", cal: 200, protein: 3, carbs: 32, fat: 8 }] } },
  "2026-04-28": { meals: { "☀️ Déjeuner": [{ id: 1, name: "Saumon / épinards / ricotta", cal: 520, protein: 38, carbs: 12, fat: 32 }, { id: 2, name: "Yaourt + pomme", cal: 155, protein: 7, carbs: 28, fat: 2 }], "🌙 Dîner": [{ id: 3, name: "Gratin (~400g)", cal: 890, protein: 24, carbs: 95, fat: 42 }, { id: 4, name: "Pomme + mangue + yaourt + ananas", cal: 310, protein: 8, carbs: 65, fat: 2 }] } },
};

const HISTORY_WEIGHTS = [
  { date: "2026-04-19", weight: 118.5 }, { date: "2026-04-21", weight: 117.8 },
  { date: "2026-04-23", weight: 117.3 }, { date: "2026-04-24", weight: 117.1 },
  { date: "2026-04-25", weight: 116.7 }, { date: "2026-04-26", weight: 116.1 },
  { date: "2026-04-27", weight: 115.4 }, { date: "2026-04-28", weight: 116.6 },
  { date: "2026-04-29", weight: 116.9 },
];

const toDateKey = (d = new Date()) => d.toISOString().slice(0, 10);
const todayKey = () => toDateKey();
const fmtDate = (k) => new Date(k + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const fmtShort = (k) => new Date(k + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE
// ─────────────────────────────────────────────────────────────────────────────
function sGet(key) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; } }
function sSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

// ─────────────────────────────────────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function Ring({ value, max, size = 120, stroke = 10, color = "#4ade80" }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r, pct = Math.min(value / max, 1), over = value > max;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1c2333" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={over ? "#f87171" : color}
        strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset .6s ease" }} />
    </svg>
  );
}

function Bar({ val, max, color }) {
  return (
    <div style={{ background: "#1c2333", borderRadius: 99, height: 5, overflow: "hidden", flex: 1 }}>
      <div style={{ width: `${Math.min((val/max)*100,100)}%`, height: "100%", background: val > max ? "#f87171" : color, borderRadius: 99, transition: "width .5s ease" }} />
    </div>
  );
}

function MacroRow({ label, val, max, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 11, color: "#64748b", width: 68 }}>{label}</span>
      <Bar val={val} max={max} color={color} />
      <span style={{ fontSize: 11, color: val > max ? "#f87171" : "#94a3b8", width: 72, textAlign: "right" }}>{val}g / {max}g</span>
    </div>
  );
}

function WeightChart({ entries }) {
  if (entries.length < 2) return <div style={{ textAlign: "center", color: "#475569", fontSize: 13, padding: "24px 0" }}>Enregistre au moins 2 pesées pour voir la courbe</div>;
  const W = 340, H = 150, PAD = 24;
  const weights = entries.map(e => e.weight);
  const minW = Math.min(...weights) - 0.5, maxW = Math.max(...weights) + 0.5;
  const toX = i => PAD + (i / (entries.length - 1)) * (W - PAD * 2);
  const toY = w => H - PAD - ((w - minW) / (maxW - minW)) * (H - PAD * 2);
  const pts = entries.map((e, i) => `${toX(i)},${toY(e.weight)}`).join(" ");
  const area = `M ${toX(0)},${toY(entries[0].weight)} ` + entries.slice(1).map((e, i) => `L ${toX(i+1)},${toY(e.weight)}`).join(" ") + ` L ${toX(entries.length-1)},${H} L ${toX(0)},${H} Z`;
  const target = 105;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4ade80" stopOpacity="0.25"/><stop offset="100%" stopColor="#4ade80" stopOpacity="0"/></linearGradient></defs>
      <path d={area} fill="url(#wg)" />
      <polyline points={pts} fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {target >= minW && target <= maxW && <>
        <line x1={PAD} y1={toY(target)} x2={W-PAD} y2={toY(target)} stroke="#f59e0b" strokeWidth="1" strokeDasharray="4,4" opacity="0.7" />
        <text x={W-PAD+2} y={toY(target)+4} fill="#f59e0b" fontSize="9" fontFamily="DM Mono,monospace">{target}</text>
      </>}
      {entries.map((e, i) => (
        <g key={i}>
          <circle cx={toX(i)} cy={toY(e.weight)} r={i === entries.length-1 ? 5 : 3} fill={i === entries.length-1 ? "#4ade80" : "#2d4a2d"} stroke="#4ade80" strokeWidth="1.5" />
          {(i === 0 || i === entries.length-1) && <text x={toX(i)} y={toY(e.weight)-9} textAnchor="middle" fill="#4ade80" fontSize="10" fontFamily="DM Mono,monospace">{e.weight}</text>}
          {(i === 0 || i === entries.length-1) && <text x={toX(i)} y={H-4} textAnchor="middle" fill="#475569" fontSize="8" fontFamily="DM Mono,monospace">{fmtShort(e.date)}</text>}
        </g>
      ))}
    </svg>
  );
}

function CalChart({ days }) {
  if (!days.length) return null;
  const max = Math.max(...days.map(d => d.cal), 1900);
  const W = 340, H = 100, BW = Math.min(30, (W-20)/days.length - 4);
  const toX = i => 10 + i*((W-20)/days.length) + ((W-20)/days.length - BW)/2;
  const toH = c => (c/max)*(H-22);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <line x1={10} y1={H-22-(1900/max)*(H-22)} x2={W-10} y2={H-22-(1900/max)*(H-22)} stroke="#f59e0b" strokeWidth="1" strokeDasharray="4,3" opacity="0.7"/>
      {days.map((d,i) => {
        const h = toH(d.cal); const over = d.cal > 1900;
        return <g key={i}>
          {h > 0 && <rect x={toX(i)} y={H-22-h} width={BW} height={h} rx={3} fill={over?"#f87171":"#4ade80"} opacity="0.8"/>}
          <text x={toX(i)+BW/2} y={H-8} textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="DM Mono,monospace">{d.label}</text>
          {d.cal > 0 && <text x={toX(i)+BW/2} y={Math.max(8, H-24-h)} textAnchor="middle" fill={over?"#f87171":"#4ade80"} fontSize="7" fontFamily="DM Mono,monospace">{d.cal}</text>}
        </g>;
      })}
    </svg>
  );
}

function computeScore(cal, prot, carb, fat, goalKcal, cheatDay) {
  if (cheatDay) return { score: 100, label: "Jour de triche 🎉", color: "#f59e0b" };
  if (cal === 0) return { score: 0, label: "Rien loggé", color: "#475569" };
  let s = 100;
  s -= Math.min(30, (Math.abs(cal - goalKcal) / goalKcal) * 80);
  s -= Math.min(20, (Math.abs(prot - MACROS.protein) / MACROS.protein) * 40);
  s -= Math.min(15, (Math.abs(carb - MACROS.carbs) / MACROS.carbs) * 30);
  s -= Math.min(10, (Math.abs(fat - MACROS.fat) / MACROS.fat) * 20);
  s = Math.max(0, Math.round(s));
  const label = s >= 85 ? "Excellent 🔥" : s >= 70 ? "Très bien 👍" : s >= 50 ? "Correct 😐" : "À améliorer ⚠️";
  const color = s >= 85 ? "#4ade80" : s >= 70 ? "#22d3ee" : s >= 50 ? "#f59e0b" : "#f87171";
  return { score: s, label, color };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("today");
  const [allDays, setAllDays] = useState({});
  const [weightLog, setWeightLog] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [favorites, setFavorites] = useState([]);
  const [customDb, setCustomDb] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const emptyMeals = () => ({ "🌅 Petit-déj": [], "☀️ Déjeuner": [], "🌙 Dîner": [], "🍎 Collation": [] });
  const [meals, setMeals] = useState(emptyMeals());
  const [activeMealType, setActiveMealType] = useState("☀️ Déjeuner");
  const [cheatDay, setCheatDay] = useState(false);
  const [dbSearch, setDbSearch] = useState("");
  const [showDb, setShowDb] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null); // food being configured
  const [foodQty, setFoodQty] = useState("");
  const [cName, setCName] = useState(""); const [cCal, setCCal] = useState("");
  const [cProt, setCProt] = useState(""); const [cCarb, setCCarb] = useState(""); const [cFat, setCFat] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [chat, setChat] = useState([{ role: "assistant", text: "Salut ! Je suis ton coach nutrition 🥗\n\nJe connais ton profil complet et tout ton historique depuis le 19 avril.\n\n💡 Décris-moi ce que tu as mangé et je l'ajoute automatiquement au tracker !\n\nTu peux aussi me demander :\n• Une suggestion de dîner ce soir\n• Mon bilan de la semaine\n• Ma projection de poids" }]);
  const [msg, setMsg] = useState(""); const [aiLoading, setAiLoading] = useState(false);
  const chatRef = useRef(null);
  const [editGoalKcal, setEditGoalKcal] = useState("1900");
  const [editGoalWeight, setEditGoalWeight] = useState("105");
  const [saveMsg, setSaveMsg] = useState("");

  const mealsInitialized = useRef(false);

  // ── Load ──
  useEffect(() => {
    (() => {
      const savedDays = sGet("nt3_days") || {};
      const savedWeights = sGet("nt3_weights") || [];
      const savedSettings = sGet("nt3_settings");
      const savedFavs = sGet("nt3_favorites") || [];
      const savedCustomDb = sGet("nt3_customdb") || [];
      const mergedDays = { ...HISTORY_DAYS, ...savedDays };
      const wMap = {};
      HISTORY_WEIGHTS.forEach(e => wMap[e.date] = e);
      savedWeights.forEach(e => wMap[e.date] = e);
      const mergedWeights = Object.values(wMap).sort((a,b) => a.date.localeCompare(b.date));
      const s = savedSettings || DEFAULT_SETTINGS;
      setAllDays(mergedDays); setWeightLog(mergedWeights); setSettings(s); setFavorites(savedFavs); setCustomDb(savedCustomDb);
      setEditGoalKcal(String(s.goalKcal)); setEditGoalWeight(String(s.goalWeight));
      const td = mergedDays[todayKey()];
      if (td?.meals && !Array.isArray(td.meals)) {
        setMeals({ ...emptyMeals(), ...td.meals });
      }
      if (td?.cheatDay) setCheatDay(true);
      // Mark as initialized
      mealsInitialized.current = true;
      setLoaded(true);



    })();
  }, []);

  // ── Persist today — only after initialization ──
  useEffect(() => {
    if (!loaded || !mealsInitialized.current) return;
    const save = () => {
      const current = sGet("nt3_days") || {};
      const merged = { ...HISTORY_DAYS, ...current };
      const next = { ...merged, [todayKey()]: { ...(merged[todayKey()]||{}), meals, cheatDay } };
      sSet("nt3_days", next);
      setAllDays(next);
    };
    save();
  }, [meals, cheatDay, loaded]);

  // ── Computed ──
  const allMeals = Object.values(meals).flat();
  const totCal = allMeals.reduce((s,m) => s+m.cal, 0);
  const totProt = allMeals.reduce((s,m) => s+(m.protein||0), 0);
  const totCarb = allMeals.reduce((s,m) => s+(m.carbs||0), 0);
  const totFat = allMeals.reduce((s,m) => s+(m.fat||0), 0);
  const remaining = settings.goalKcal - totCal;
  const lastWeight = weightLog.length > 0 ? weightLog[weightLog.length-1].weight : settings.startWeight;
  const lost = settings.startWeight - lastWeight;
  const toGo = lastWeight - settings.goalWeight;
  const progress = Math.max(0, Math.min(1, lost / (settings.startWeight - settings.goalWeight)));
  const { score, label: scoreLabel, color: scoreColor } = computeScore(totCal, totProt, totCarb, totFat, settings.goalKcal, cheatDay);

  const getDayTotal = (k) => {
    const d = allDays[k]; if (!d) return 0;
    const m = d.meals;
    return Array.isArray(m) ? m.reduce((s,x)=>s+x.cal,0) : Object.values(m||{}).flat().reduce((s,x)=>s+x.cal,0);
  };

  const getProjection = () => {
    if (weightLog.length < 2) return null;
    const first = weightLog[0], last = weightLog[weightLog.length-1];
    const days = (new Date(last.date) - new Date(first.date)) / 86400000;
    if (days === 0) return null;
    const ratePerDay = (first.weight - last.weight) / days;
    if (ratePerDay <= 0) return null;
    const daysLeft = toGo / ratePerDay;
    const targetDate = new Date(); targetDate.setDate(targetDate.getDate() + daysLeft);
    return { ratePerDay: ratePerDay.toFixed(3), targetDate: targetDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }), daysLeft: Math.round(daysLeft) };
  };
  const projection = getProjection();

  const getNDays = (n) => {
    const days = [];
    for (let i = n-1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = toDateKey(d);
      const cal = getDayTotal(k);
      days.push({ k, label: n <= 7 ? d.toLocaleDateString("fr-FR",{weekday:"short"}).slice(0,3) : String(d.getDate()), cal, date: d });
    }
    return days;
  };
  const weekDays = getNDays(7);
  const weekAvg = Math.round(weekDays.filter(d=>d.cal>0).reduce((s,d)=>s+d.cal,0)/Math.max(1,weekDays.filter(d=>d.cal>0).length));
  const daysOnTrack = weekDays.filter(d=>d.cal>0&&d.cal<=settings.goalKcal).length;
  const weekDeficit = weekDays.filter(d=>d.cal>0).reduce((s,d)=>s+Math.max(0,settings.goalKcal-d.cal),0);

  // ── Food actions ──
  function addFood(food, qty) {
    const q = qty || 100;
    const computed = food.unit === "unit"
      ? { cal: Math.round(food.cal * q), protein: Math.round(food.protein * q), carbs: Math.round(food.carbs * q), fat: Math.round(food.fat * q) }
      : { cal: Math.round(food.cal * q / 100), protein: Math.round(food.protein * q / 100), carbs: Math.round(food.carbs * q / 100), fat: Math.round(food.fat * q / 100) };
    const unitLabel = food.unit === "unit" ? (q === 1 ? " (1 unité)" : ` (${q} unités)`) : ` (${q}${food.unit})`;
    setMeals(prev => ({ ...prev, [activeMealType]: [...(prev[activeMealType]||[]), { ...computed, name: food.name + unitLabel, id: Date.now()+Math.random() }] }));
    setDbSearch(""); setShowDb(false); setSelectedFood(null); setFoodQty("");
  }
  function addCustom() {
    if (!cName||!cCal) return;
    const food = { name: cName, cal: +cCal||0, protein: +cProt||0, carbs: +cCarb||0, fat: +cFat||0 };
    setMeals(prev => ({ ...prev, [activeMealType]: [...(prev[activeMealType]||[]), { ...food, id: Date.now()+Math.random() }] }));
    setCName(""); setCCal(""); setCProt(""); setCCarb(""); setCFat("");
  }
  function saveToCustomDb() {
    if (!cName||!cCal) return;
    // Store as per-100g equivalent with unit "g", or unit if no weight makes sense
    const entry = { id: Date.now(), name: cName, unit: "g", cal: +cCal||0, protein: +cProt||0, carbs: +cCarb||0, fat: +cFat||0, isCustom: true };
    const next = [...customDb, entry];
    setCustomDb(next); sSet("nt3_customdb", next);
    alert(`✅ "${cName}" ajouté à ta base perso !`);
  }
  function removeCustomDb(id) { const next = customDb.filter(f=>f.id!==id); setCustomDb(next); sSet("nt3_customdb", next); }
  function removeFood(type, id) { setMeals(prev => ({ ...prev, [type]: prev[type].filter(m => m.id !== id) })); }
  function saveFavorite() {
    if (!cName||!cCal) return;
    const fav = { id: Date.now(), name: cName, cal: +cCal||0, protein: +cProt||0, carbs: +cCarb||0, fat: +cFat||0 };
    const next = [...favorites, fav]; setFavorites(next); sSet("nt3_favorites", next);
  }
  function removeFav(id) { const next = favorites.filter(f=>f.id!==id); setFavorites(next); sSet("nt3_favorites", next); }

  function addWeight() {
    if (!newWeight) return;
    const entry = { date: todayKey(), weight: parseFloat(newWeight) };
    const wMap = {}; weightLog.forEach(e => wMap[e.date]=e); wMap[entry.date]=entry;
    const next = Object.values(wMap).sort((a,b)=>a.date.localeCompare(b.date));
    setWeightLog(next); sSet("nt3_weights", next); setNewWeight("");
  }

  function saveSettings() {
    const next = { ...settings, goalKcal: +editGoalKcal||1900, goalWeight: +editGoalWeight||105 };
    setSettings(next); sSet("nt3_settings", next);
    setSaveMsg("✅ Sauvegardé !"); setTimeout(() => setSaveMsg(""), 2000);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), days: allDays, weights: weightLog, settings, favorites, customDb }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`nutritrack-${todayKey()}.json`; a.click();
    URL.revokeObjectURL(url);
  }
  function importData(e) {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.days) { setAllDays(data.days); sSet("nt3_days", data.days); }
        if (data.weights) { setWeightLog(data.weights); sSet("nt3_weights", data.weights); }
        if (data.settings) { setSettings(data.settings); sSet("nt3_settings", data.settings); }
        if (data.favorites) { setFavorites(data.favorites); sSet("nt3_favorites", data.favorites); }
        if (data.customDb) { setCustomDb(data.customDb); sSet("nt3_customdb", data.customDb); }
        alert("Import réussi ✅");
      } catch { alert("Fichier invalide ❌"); }
    };
    r.readAsText(file);
  }

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [chat, aiLoading]);

  async function analyzePhoto(e) {
    const file = e.target.files[0]; if (!file) return;
    setAiLoading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result.split(",")[1];
      const mediaType = file.type || "image/jpeg";
      const newChat = [...chat, { role: "user", text: "📸 [Photo d'assiette envoyée]" }];
      setChat(newChat);
      try {
        const res = await fetch("/api/chat", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514", max_tokens: 1000,
            system: `Tu es un nutritionniste expert. Analyse cette photo d'assiette et estime les calories et macros. Profil : objectif ${settings.goalKcal} kcal/jour, intolérance coriandre. Aujourd'hui déjà consommé : ${totCal} kcal. Réponds en français avec une estimation détaillée puis termine OBLIGATOIREMENT par :
<<<FOOD_LOG>>>
{"name":"Repas photo","cal":0,"protein":0,"carbs":0,"fat":0}
<<<END>>>`,
            messages: [{ role: "user", content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
              { type: "text", text: "Analyse cette assiette et estime les calories." }
            ]}]
          })
        });
        const data = await res.json();
        let reply = data.content?.[0]?.text || "Impossible d'analyser la photo.";
        const foodMatch = reply.match(/<<<FOOD_LOG>>>\s*(\{[\s\S]*?\})\s*<<<END>>>/);
        if (foodMatch) {
          try {
            const food = JSON.parse(foodMatch[1]);
            setMeals(prev => ({ ...prev, [activeMealType]: [...(prev[activeMealType]||[]), { ...food, id: Date.now() }] }));
            reply = reply.replace(/<<<FOOD_LOG>>>[\s\S]*?<<<END>>>/, "").trim();
            reply += `\n\n✅ "${food.name}" ajouté dans "${activeMealType}" (${food.cal} kcal)`;
          } catch {}
        }
        setChat([...newChat, { role: "assistant", text: reply }]);
      } catch { setChat([...newChat, { role: "assistant", text: "Erreur lors de l'analyse de la photo." }]); }
      setAiLoading(false);
    };
    reader.readAsDataURL(file);
  }

  async function sendMsg() {
    if (!msg.trim()||aiLoading) return;
    const m = msg.trim(); setMsg("");
    const newChat = [...chat, { role: "user", text: m }];
    setChat(newChat); setAiLoading(true);
    const recentDays = Object.entries(allDays).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,7).map(([k,v])=>({
      date: k, total: Array.isArray(v.meals)?v.meals.reduce((s,x)=>s+x.cal,0):Object.values(v.meals||{}).flat().reduce((s,x)=>s+x.cal,0),
      repas: Array.isArray(v.meals)?v.meals.map(x=>x.name).join(", "):Object.entries(v.meals||{}).map(([t,items])=>`${t}: ${items.map(x=>x.name).join(", ")}`).join(" | ")
    }));
    const proj = getProjection();
    const system = `Tu es un nutritionniste expert et bienveillant. Profil :
- Poids : ${lastWeight}kg (départ ${settings.startWeight}kg, objectif ${settings.goalWeight}kg, perdu ${lost.toFixed(1)}kg, reste ${toGo.toFixed(1)}kg)
- Objectif : ${settings.goalKcal} kcal/jour | Macros : ${MACROS.protein}g prot / ${MACROS.carbs}g gluc / ${MACROS.fat}g lip
- Activité : sédentaire | Intolérance : coriandre (JAMAIS)
- Aujourd'hui : ${totCal} kcal (${totProt}g P / ${totCarb}g G / ${totFat}g L) | Score : ${score}/100
- Repas aujourd'hui : ${Object.entries(meals).filter(([,v])=>v.length>0).map(([t,v])=>`${t}: ${v.map(x=>x.name).join(", ")}`).join(" | ")||"aucun"}
- Historique 7j : ${JSON.stringify(recentDays)}
- Projection : ${proj?`objectif atteint vers le ${proj.targetDate} dans ${proj.daysLeft} jours`:"pas assez de données"}
- Moyenne semaine : ${weekAvg} kcal | Jours dans l'objectif : ${daysOnTrack}/7

RÈGLE : Si l'utilisateur décrit un repas/aliment consommé, termine OBLIGATOIREMENT par :
<<<FOOD_LOG>>>
{"name":"Nom du repas","cal":0,"protein":0,"carbs":0,"fat":0}
<<<END>>>
Sinon ne mets PAS ce bloc.
Réponds en français, concis et pratique. Jamais de coriandre.`;
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system, messages: newChat.map(x=>({ role: x.role==="assistant"?"assistant":"user", content: x.text })) })
      });
      const data = await res.json();
      let reply = data.content?.[0]?.text || "Erreur.";
      const foodMatch = reply.match(/<<<FOOD_LOG>>>\s*(\{[\s\S]*?\})\s*<<<END>>>/);
      if (foodMatch) {
        try {
          const food = JSON.parse(foodMatch[1]);
          setMeals(prev => ({ ...prev, [activeMealType]: [...(prev[activeMealType]||[]), { ...food, id: Date.now() }] }));
          reply = reply.replace(/<<<FOOD_LOG>>>[\s\S]*?<<<END>>>/, "").trim();
          reply += `\n\n✅ "${food.name}" ajouté dans "${activeMealType}" (${food.cal} kcal)`;
        } catch {}
      }
      setChat([...newChat, { role: "assistant", text: reply }]);
    } catch { setChat([...newChat, { role: "assistant", text: "Erreur de connexion." }]); }
    setAiLoading(false);
  }

  const inp = { background: "#1c2333", border: "1px solid #2d3a4f", borderRadius: 8, color: "#e2e8f0", padding: "9px 12px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" };
  const card = { background: "#161f2e", border: "1px solid #1e2d42", borderRadius: 18, padding: "16px", marginBottom: 14 };
  const ST = { fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700, marginBottom: 12 };
  const btn = (bg="#4ade80", col="#0d1117") => ({ background: bg, border: "none", borderRadius: 10, color: col, fontWeight: 700, fontSize: 13, padding: "10px 14px", cursor: "pointer", fontFamily: "inherit" });

  const allFoodDb = [...FOOD_DB, ...customDb];
  const filteredDb = allFoodDb.filter(f => f.name.toLowerCase().includes(dbSearch.toLowerCase())).slice(0, 8);

  if (!loaded) return <div style={{ minHeight:"100vh", background:"#0d1117", display:"flex", alignItems:"center", justifyContent:"center", color:"#4ade80", fontFamily:"DM Sans,sans-serif", fontSize:16 }}>Chargement…</div>;

  return (
    <div style={{ minHeight:"100vh", background:"#0d1117", color:"#e2e8f0", fontFamily:"'DM Sans',sans-serif", paddingBottom:80 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`input::placeholder{color:#3d4f66}*{scrollbar-width:thin;scrollbar-color:#1e2d42 transparent}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* HEADER */}
      <div style={{ background:"#0d1117", borderBottom:"1px solid #1e2d42", padding:"14px 16px 0", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ maxWidth:440, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
            <div>
              <div style={{ fontSize:9, color:"#4ade80", letterSpacing:3, textTransform:"uppercase", fontFamily:"DM Mono,monospace" }}>NutriTrack Pro</div>
              <div style={{ fontSize:18, fontWeight:700 }}>Bonjour 👋</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10, color:"#64748b", fontFamily:"DM Mono,monospace" }}>{lastWeight} kg · −{lost.toFixed(1)} kg</div>
              <div style={{ fontSize:11, fontWeight:600, color:"#4ade80" }}>objectif {settings.goalWeight} kg</div>
              <div style={{ background:"#1c2333", borderRadius:99, height:4, marginTop:3, overflow:"hidden", width:110 }}>
                <div style={{ width:`${progress*100}%`, height:"100%", background:"linear-gradient(90deg,#4ade80,#22d3ee)", borderRadius:99 }} />
              </div>
            </div>
          </div>
          <div style={{ display:"flex", overflowX:"auto" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:"0 0 auto", padding:"7px 8px", border:"none", background:"transparent", color:tab===t.id?"#4ade80":"#475569", fontWeight:600, fontSize:11, borderBottom:`2px solid ${tab===t.id?"#4ade80":"transparent"}`, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:440, margin:"0 auto", padding:"16px 14px 0" }}>

        {/* ══ TODAY ══ */}
        {tab==="today" && <>
          <div style={{ ...card, display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ position:"relative", flexShrink:0 }}>
              <Ring value={totCal} max={settings.goalKcal} size={115} />
              <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                <div style={{ fontSize:21, fontWeight:700, color:totCal>settings.goalKcal?"#f87171":"#f1f5f9", fontFamily:"DM Mono,monospace" }}>{totCal}</div>
                <div style={{ fontSize:9, color:"#64748b" }}>/{settings.goalKcal}</div>
              </div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ fontSize:12, fontWeight:600, color:remaining<0?"#f87171":"#4ade80" }}>
                  {remaining<0?`⚠️ +${Math.abs(remaining)} kcal`:`✅ ${remaining} kcal restantes`}
                </div>
                <div style={{ background:scoreColor+"22", borderRadius:99, padding:"2px 7px", fontSize:11, fontWeight:700, color:scoreColor }}>{score}/100</div>
              </div>
              <div style={{ fontSize:11, color:scoreColor, marginBottom:10 }}>{scoreLabel}</div>
              <MacroRow label="Protéines" val={totProt} max={MACROS.protein} color="#60a5fa"/>
              <MacroRow label="Glucides" val={totCarb} max={MACROS.carbs} color="#f59e0b"/>
              <MacroRow label="Lipides" val={totFat} max={MACROS.fat} color="#f472b6"/>
            </div>
          </div>

          {/* Cheat day */}
          <div style={{ ...card, display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px" }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600 }}>🎉 Mode jour de triche</div>
              <div style={{ fontSize:11, color:"#64748b" }}>Désactive les alertes pour aujourd'hui</div>
            </div>
            <div onClick={()=>setCheatDay(p=>!p)} style={{ width:44, height:24, borderRadius:99, background:cheatDay?"#f59e0b":"#1c2333", border:"1px solid #2d3a4f", cursor:"pointer", position:"relative", transition:"background .3s", flexShrink:0 }}>
              <div style={{ position:"absolute", top:3, left:cheatDay?23:3, width:18, height:18, borderRadius:99, background:"white", transition:"left .3s" }} />
            </div>
          </div>

          {/* Meal type tabs */}
          <div style={{ display:"flex", gap:6, marginBottom:12, overflowX:"auto" }}>
            {MEAL_TYPES.map(t => {
              const mCal = (meals[t]||[]).reduce((s,m)=>s+m.cal,0);
              return (
                <button key={t} onClick={()=>setActiveMealType(t)} style={{ flex:"0 0 auto", padding:"6px 11px", border:`1px solid ${activeMealType===t?"#4ade80":"#2d3a4f"}`, borderRadius:99, background:activeMealType===t?"#4ade8018":"transparent", color:activeMealType===t?"#4ade80":"#64748b", fontSize:12, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                  {t}{mCal>0?` · ${mCal}`:``}
                </button>
              );
            })}
          </div>

          {/* Current meal items */}
          {(meals[activeMealType]||[]).length > 0 && (
            <div style={card}>
              <div style={ST}>{activeMealType}</div>
              {meals[activeMealType].map(m => (
                <div key={m.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #111827" }}>
                  <div style={{ flex:1, paddingRight:8 }}>
                    <div style={{ fontSize:13, fontWeight:500 }}>{m.name}</div>
                    <div style={{ fontSize:10, color:"#475569", fontFamily:"DM Mono,monospace" }}>P:{m.protein}g G:{m.carbs}g L:{m.fat}g</div>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
                    <span style={{ fontWeight:700, color:"#4ade80", fontSize:13, fontFamily:"DM Mono,monospace" }}>{m.cal}</span>
                    <button onClick={()=>removeFood(activeMealType,m.id)} style={{ background:"#f8717120", border:"none", borderRadius:6, color:"#f87171", width:24, height:24, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Food DB */}
          <div style={card}>
            <div style={ST}>🔍 Base de données aliments</div>
            <input style={inp} placeholder="Rechercher (poulet, riz, pomme…)" value={dbSearch}
              onChange={e=>{setDbSearch(e.target.value);setShowDb(true);setSelectedFood(null);setFoodQty("")}}
              onFocus={()=>setShowDb(true)} />

            {/* Results list */}
            {showDb && dbSearch.length > 0 && !selectedFood && (
              <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:4 }}>
                {filteredDb.length === 0 && <div style={{ fontSize:12, color:"#475569", padding:"6px 0" }}>Aucun résultat</div>}
                {filteredDb.map(f => (
                  <button key={f.id||f.name} onClick={()=>{ setSelectedFood(f); setFoodQty(f.unit==="unit" ? String(f.defaultQty||1) : "100"); }}
                    style={{ background:"#111827", border:`1px solid ${f.isCustom?"#2d5a8e":"#2d3a4f"}`, borderRadius:8, color:"#e2e8f0", fontSize:12, padding:"8px 12px", cursor:"pointer", fontFamily:"inherit", textAlign:"left", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      {f.isCustom && <span style={{ fontSize:9, background:"#1e3a5f", color:"#60a5fa", borderRadius:4, padding:"1px 5px", fontWeight:700 }}>PERSO</span>}
                      <span>{f.name}</span>
                    </div>
                    <span style={{ color:"#64748b", fontSize:11, flexShrink:0, marginLeft:8 }}>
                      {f.unit==="unit" ? "par unité" : `pour 100${f.unit}`} · {f.cal} kcal
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Quantity input panel */}
            {selectedFood && (
              <div style={{ marginTop:10, background:"#111827", borderRadius:12, padding:14, border:"1px solid #2d3a4f" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ fontSize:14, fontWeight:600 }}>{selectedFood.name}</div>
                  <button onClick={()=>{setSelectedFood(null);setFoodQty("");}} style={{ background:"transparent", border:"none", color:"#475569", fontSize:18, cursor:"pointer" }}>×</button>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
                  <input
                    style={{ ...inp, flex:1, fontSize:16, fontWeight:600, textAlign:"center" }}
                    type="number"
                    placeholder={selectedFood.unit==="unit"?"Nb d'unités":"Quantité"}
                    value={foodQty}
                    onChange={e=>setFoodQty(e.target.value)}
                    autoFocus
                  />
                  <div style={{ fontSize:14, color:"#64748b", fontWeight:600, minWidth:30 }}>
                    {selectedFood.unit==="unit" ? "unité(s)" : selectedFood.unit}
                  </div>
                </div>
                {/* Live preview */}
                {foodQty > 0 && (() => {
                  const q = parseFloat(foodQty);
                  const c = selectedFood.unit==="unit"
                    ? { cal: Math.round(selectedFood.cal*q), protein: Math.round(selectedFood.protein*q), carbs: Math.round(selectedFood.carbs*q), fat: Math.round(selectedFood.fat*q) }
                    : { cal: Math.round(selectedFood.cal*q/100), protein: Math.round(selectedFood.protein*q/100), carbs: Math.round(selectedFood.carbs*q/100), fat: Math.round(selectedFood.fat*q/100) };
                  return (
                    <div style={{ background:"#0d1117", borderRadius:8, padding:"8px 12px", marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ fontSize:11, color:"#64748b" }}>P:{c.protein}g · G:{c.carbs}g · L:{c.fat}g</div>
                      <div style={{ fontSize:18, fontWeight:700, color:"#4ade80", fontFamily:"DM Mono,monospace" }}>{c.cal} kcal</div>
                    </div>
                  );
                })()}
                <button
                  onClick={()=>foodQty>0&&addFood(selectedFood, parseFloat(foodQty))}
                  style={{ ...btn(), width:"100%", textAlign:"center", opacity:foodQty>0?1:0.4 }}>
                  + Ajouter dans {activeMealType}
                </button>
              </div>
            )}
          </div>

          {/* Favorites */}
          {favorites.length > 0 && (
            <div style={card}>
              <div style={ST}>⭐ Repas favoris</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                {favorites.map(f => (
                  <div key={f.id} style={{ display:"flex", gap:3, alignItems:"center" }}>
                    <button onClick={()=>setMeals(prev => ({ ...prev, [activeMealType]: [...(prev[activeMealType]||[]), { ...f, id: Date.now()+Math.random() }] }))} style={{ background:"#111827", border:"1px solid #2d3a4f", borderRadius:99, color:"#e2e8f0", fontSize:12, padding:"5px 10px", cursor:"pointer", fontFamily:"inherit" }}>
                      {f.name} <span style={{ color:"#4ade80", fontFamily:"DM Mono,monospace" }}>{f.cal}</span>
                    </button>
                    <button onClick={()=>removeFav(f.id)} style={{ background:"transparent", border:"none", color:"#475569", cursor:"pointer", fontSize:14, lineHeight:1 }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual add */}
          <div style={card}>
            <div style={ST}>Ajouter manuellement</div>
            <div style={{ fontSize:11, color:"#475569", marginBottom:10 }}>Valeurs <strong style={{ color:"#94a3b8" }}>pour 100g</strong> — la base calculera selon ta quantité. Bouton 💾 pour sauvegarder dans ta base perso.</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <input style={inp} placeholder="Nom de l'aliment *" value={cName} onChange={e=>setCName(e.target.value)} />
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <input style={inp} placeholder="Calories / 100g *" type="number" value={cCal} onChange={e=>setCCal(e.target.value)} />
                <input style={inp} placeholder="Protéines g" type="number" value={cProt} onChange={e=>setCProt(e.target.value)} />
                <input style={inp} placeholder="Glucides g" type="number" value={cCarb} onChange={e=>setCCarb(e.target.value)} />
                <input style={inp} placeholder="Lipides g" type="number" value={cFat} onChange={e=>setCFat(e.target.value)} />
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={addCustom} style={{ ...btn(), flex:1 }}>+ Ajouter au repas</button>
                <button onClick={saveToCustomDb} title="Sauvegarder dans ma base perso" style={{ ...btn("#1e3a5f","#60a5fa"), border:"1px solid #2d5a8e", fontSize:18 }}>💾</button>
                <button onClick={saveFavorite} title="Sauvegarder en favori ⭐" style={{ ...btn("#1c2333","#f59e0b"), border:"1px solid #2d3a4f", fontSize:18 }}>⭐</button>
              </div>
            </div>
          </div>
        </>}

        {/* ══ WEIGHT ══ */}
        {tab==="weight" && <>
          <div style={card}>
            <div style={ST}>Enregistrer mon poids</div>
            <div style={{ display:"flex", gap:8 }}>
              <input style={{ ...inp, flex:1 }} placeholder="Ex: 116.5" type="number" step="0.1" value={newWeight} onChange={e=>setNewWeight(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addWeight()} />
              <button onClick={addWeight} style={{ ...btn(), padding:"0 18px", fontSize:20 }}>+</button>
            </div>
            <div style={{ display:"flex", justifyContent:"space-around", marginTop:16 }}>
              {[{label:"Départ",val:`${settings.startWeight} kg`,color:"#f59e0b"},{label:"Actuel",val:`${lastWeight} kg`,color:"#4ade80"},{label:"Objectif",val:`${settings.goalWeight} kg`,color:"#22d3ee"}].map(({label,val,color})=>(
                <div key={label} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:17, fontWeight:700, color, fontFamily:"DM Mono,monospace" }}>{val}</div>
                  <div style={{ fontSize:10, color:"#64748b" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <div style={ST}>Courbe d'évolution</div>
            <WeightChart entries={weightLog} />
          </div>

          {projection && (
            <div style={{ ...card, background:"#0a1f10", border:"1px solid #166534" }}>
              <div style={ST}>🎯 Projection</div>
              <div style={{ fontSize:15, fontWeight:700, color:"#4ade80", marginBottom:4 }}>Objectif atteint vers le {projection.targetDate}</div>
              <div style={{ fontSize:12, color:"#64748b" }}>Dans ~{projection.daysLeft} jours · perte moy. {projection.ratePerDay} kg/jour</div>
            </div>
          )}

          {weightLog.length > 0 && (
            <div style={card}>
              <div style={ST}>Historique pesées</div>
              {[...weightLog].reverse().map((e,i,arr)=>{
                const prev = arr[i+1];
                const diff = prev ? (e.weight - prev.weight).toFixed(1) : null;
                return (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #111827" }}>
                    <div>
                      <div style={{ fontSize:13, color:"#e2e8f0", fontWeight:500, textTransform:"capitalize" }}>{fmtDate(e.date)}</div>
                      {diff!==null && <div style={{ fontSize:11, color:+diff>0?"#f87171":"#4ade80", marginTop:1 }}>{+diff>0?`+${diff}`:diff} kg vs précédente</div>}
                    </div>
                    <span style={{ fontWeight:700, color:"#4ade80", fontFamily:"DM Mono,monospace", fontSize:16, flexShrink:0, marginLeft:8 }}>{e.weight} kg</span>
                  </div>
                );
              })}
            </div>
          )}
        </>}

        {/* ══ HISTORY ══ */}
        {tab==="history" && <>
          {Object.entries(allDays).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,60).map(([date,data])=>{
            const dayMeals = data.meals || {};
            const allM = Array.isArray(dayMeals) ? dayMeals : Object.values(dayMeals).flat();
            const cal = allM.reduce((s,m)=>s+m.cal,0);
            if (cal===0) return null;
            const ok = cal <= settings.goalKcal || data.cheatDay;
            return (
              <div key={date} style={card}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div style={{ fontSize:13, fontWeight:600, textTransform:"capitalize" }}>{fmtDate(date)}</div>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    {data.cheatDay && <span style={{ fontSize:10, color:"#f59e0b" }}>🎉</span>}
                    <span style={{ fontFamily:"DM Mono,monospace", fontWeight:700, color:ok?"#4ade80":"#f87171", fontSize:13 }}>{cal} kcal</span>
                  </div>
                </div>
                <div style={{ background:"#111827", borderRadius:99, height:3, overflow:"hidden", marginBottom:10 }}>
                  <div style={{ width:`${Math.min((cal/settings.goalKcal)*100,100)}%`, height:"100%", background:ok?"#4ade80":"#f87171", borderRadius:99 }} />
                </div>
                {!Array.isArray(dayMeals)
                  ? Object.entries(dayMeals).map(([type,items])=>items.length>0&&(
                    <div key={type} style={{ marginBottom:5 }}>
                      <div style={{ fontSize:10, color:"#475569", marginBottom:2 }}>{type}</div>
                      {items.map((m,i)=><div key={i} style={{ fontSize:12, color:"#64748b", paddingLeft:8 }}>· {m.name} — <span style={{ color:"#94a3b8", fontFamily:"DM Mono,monospace" }}>{m.cal} kcal</span></div>)}
                    </div>
                  ))
                  : allM.map((m,i)=><div key={i} style={{ fontSize:12, color:"#64748b" }}>· {m.name} — <span style={{ color:"#94a3b8", fontFamily:"DM Mono,monospace" }}>{m.cal} kcal</span></div>)
                }
              </div>
            );
          })}
          {Object.keys(allDays).length===0 && <div style={{ textAlign:"center", color:"#475569", paddingTop:40, fontSize:14 }}>Aucun historique</div>}
        </>}

        {/* ══ STATS ══ */}
        {tab==="stats" && <>
          <div style={card}>
            <div style={ST}>📋 Bilan 7 jours</div>
            <CalChart days={weekDays} />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:12 }}>
              {[
                { label:"Moy. calories", val:`${weekAvg} kcal` },
                { label:"Jours dans objectif", val:`${daysOnTrack}/7` },
                { label:"Déficit cumulé", val:`${weekDeficit} kcal` },
                { label:"Perte théorique", val:`~${(weekDeficit/7700).toFixed(2)} kg` },
              ].map(({label,val})=>(
                <div key={label} style={{ background:"#111827", borderRadius:10, padding:"10px 12px" }}>
                  <div style={{ fontSize:10, color:"#64748b", marginBottom:2 }}>{label}</div>
                  <div style={{ fontSize:15, fontWeight:700 }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <div style={ST}>📈 Calories — 30 jours</div>
            <CalChart days={getNDays(30)} />
          </div>

          <div style={card}>
            <div style={ST}>⚖️ Progression poids</div>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
              <div style={{ flex:1, background:"#111827", borderRadius:99, height:10, overflow:"hidden" }}>
                <div style={{ width:`${progress*100}%`, height:"100%", background:"linear-gradient(90deg,#4ade80,#22d3ee)", borderRadius:99 }} />
              </div>
              <span style={{ fontSize:12, fontWeight:700, color:"#4ade80", fontFamily:"DM Mono,monospace" }}>{Math.round(progress*100)}%</span>
            </div>
            <div style={{ fontSize:12, color:"#64748b" }}>−{lost.toFixed(1)} kg perdus · encore {toGo.toFixed(1)} kg à perdre</div>
            {projection && <div style={{ fontSize:12, color:"#4ade80", marginTop:6 }}>🎯 Projection : {projection.targetDate} (dans {projection.daysLeft}j)</div>}
          </div>

          <div style={card}>
            <div style={ST}>Détail 7 jours</div>
            {weekDays.map(d=>(
              <div key={d.k} style={{ display:"flex", alignItems:"center", padding:"6px 0", borderBottom:"1px solid #111827", gap:8 }}>
                <span style={{ fontSize:12, color:"#94a3b8", textTransform:"capitalize", width:56, flexShrink:0 }}>{d.date.toLocaleDateString("fr-FR",{weekday:"short",day:"numeric"})}</span>
                <div style={{ flex:1 }}>{d.cal>0?<Bar val={d.cal} max={settings.goalKcal} color="#4ade80"/>:<span style={{ fontSize:11, color:"#334155" }}>—</span>}</div>
                {d.cal>0&&<span style={{ fontSize:11, fontFamily:"DM Mono,monospace", color:d.cal>settings.goalKcal?"#f87171":"#4ade80", width:60, textAlign:"right", flexShrink:0 }}>{d.cal} kcal</span>}
              </div>
            ))}
          </div>

          <div style={card}>
            <div style={ST}>💾 Sauvegarde</div>
            <p style={{ fontSize:12, color:"#64748b", margin:"0 0 12px" }}>Exporte régulièrement pour garder une copie de secours.</p>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <button onClick={exportData} style={{ ...btn("#1e3a5f","#60a5fa"), border:"1px solid #2d5a8e", width:"100%", textAlign:"center" }}>📥 Exporter mes données (JSON)</button>
              <label style={{ ...btn("#1c2333","#94a3b8"), border:"1px solid #2d3a4f", textAlign:"center", cursor:"pointer", display:"block" }}>
                📤 Importer une sauvegarde (JSON)
                <input type="file" accept=".json" onChange={importData} style={{ display:"none" }} />
              </label>
            </div>
          </div>
        </>}

        {/* ══ COACH ══ */}
        {tab==="coach" && (
          <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 165px)" }}>
            <div style={{ fontSize:11, color:"#475569", marginBottom:8, textAlign:"center", padding:"4px 0", background:"#161f2e", borderRadius:8 }}>
              Repas ajoutés dans : <span style={{ color:"#4ade80", fontWeight:600 }}>{activeMealType}</span> · change dans l'onglet Aujourd'hui
            </div>
            <div ref={chatRef} style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:10, paddingBottom:12 }}>
              {chat.map((m,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
                  <div style={{ maxWidth:"83%", padding:"11px 14px", borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px", background:m.role==="user"?"#4ade80":"#161f2e", color:m.role==="user"?"#0d1117":"#e2e8f0", fontSize:13, lineHeight:1.55, border:m.role==="assistant"?"1px solid #1e2d42":"none", whiteSpace:"pre-wrap" }}>{m.text}</div>
                </div>
              ))}
              {aiLoading && (
                <div style={{ display:"flex" }}>
                  <div style={{ background:"#161f2e", border:"1px solid #1e2d42", borderRadius:"16px 16px 16px 4px", padding:"12px 16px", display:"flex", gap:5 }}>
                    {[0,1,2].map(i=><div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80", animation:"pulse 1s infinite", animationDelay:`${i*.15}s` }}/>)}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display:"flex", gap:8, paddingTop:8, borderTop:"1px solid #1e2d42" }}>
              <label title="Analyser une photo d'assiette 📸" style={{ ...btn("#1e3a5f","#60a5fa"), border:"1px solid #2d5a8e", padding:"0 12px", fontSize:20, cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center" }}>
                📸
                <input type="file" accept="image/*" capture="environment" onChange={analyzePhoto} style={{ display:"none" }} />
              </label>
              <input style={{ ...inp, flex:1 }} placeholder="Ex: j'ai mangé une gamelle poulet / riz…" value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()} />
              <button onClick={sendMsg} disabled={aiLoading} style={{ ...btn(), padding:"0 16px", fontSize:18, flexShrink:0 }}>→</button>
            </div>
          </div>
        )}

        {/* ══ SETTINGS ══ */}
        {tab==="settings" && <>
          <div style={card}>
            <div style={ST}>🎯 Mes objectifs</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div>
                <div style={{ fontSize:12, color:"#64748b", marginBottom:4 }}>Objectif calorique journalier (kcal)</div>
                <input style={inp} type="number" value={editGoalKcal} onChange={e=>setEditGoalKcal(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize:12, color:"#64748b", marginBottom:4 }}>Objectif de poids (kg)</div>
                <input style={inp} type="number" value={editGoalWeight} onChange={e=>setEditGoalWeight(e.target.value)} step="0.5" />
              </div>
              <button onClick={saveSettings} style={{ ...btn(), width:"100%", textAlign:"center" }}>💾 Sauvegarder</button>
              {saveMsg && <div style={{ textAlign:"center", color:"#4ade80", fontSize:13 }}>{saveMsg}</div>}
            </div>
          </div>

          <div style={card}>
            <div style={ST}>👤 Mon profil</div>
            {[
              { label:"Poids de départ", val:`${settings.startWeight} kg` },
              { label:"Poids actuel", val:`${lastWeight} kg` },
              { label:"Objectif", val:`${settings.goalWeight} kg` },
              { label:"Perdu", val:`${lost.toFixed(1)} kg` },
              { label:"Reste à perdre", val:`${toGo.toFixed(1)} kg` },
              { label:"Progression", val:`${Math.round(progress*100)}%` },
              { label:"Intolérance", val:settings.intolerances.join(", ") },
            ].map(({label,val})=>(
              <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #111827" }}>
                <span style={{ fontSize:13, color:"#64748b" }}>{label}</span>
                <span style={{ fontSize:13, fontWeight:600, fontFamily:"DM Mono,monospace" }}>{val}</span>
              </div>
            ))}
          </div>

          {customDb.length > 0 && (
            <div style={card}>
              <div style={ST}>🗃️ Ma base perso ({customDb.length} aliment{customDb.length>1?"s":""})</div>
              {customDb.map(f => (
                <div key={f.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #111827" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500 }}>{f.name}</div>
                    <div style={{ fontSize:11, color:"#475569", fontFamily:"DM Mono,monospace" }}>{f.cal} kcal · P:{f.protein}g G:{f.carbs}g L:{f.fat}g / 100g</div>
                  </div>
                  <button onClick={()=>removeCustomDb(f.id)} style={{ background:"#f8717120", border:"none", borderRadius:6, color:"#f87171", width:26, height:26, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginLeft:8 }}>×</button>
                </div>
              ))}
            </div>
          )}

          <div style={card}>
            <div style={ST}>ℹ️ À propos</div>
            <div style={{ fontSize:12, color:"#64748b", lineHeight:1.7 }}>
              NutriTrack Pro v3 · suivi nutrition & poids personnalisé.<br/>
              Données persistées dans le stockage Claude.<br/>
              Pense à exporter chaque semaine depuis l'onglet Stats.
            </div>
          </div>
        </>}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"#0d1117", borderTop:"1px solid #1e2d42", display:"flex", zIndex:20 }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, padding:"8px 2px 10px", border:"none", background:"transparent", color:tab===t.id?"#4ade80":"#334155", fontSize:15, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:1 }}>
            <span>{t.icon}</span>
            <span style={{ fontSize:8, fontWeight:600, color:tab===t.id?"#4ade80":"#334155", textTransform:"uppercase", letterSpacing:0.5 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
