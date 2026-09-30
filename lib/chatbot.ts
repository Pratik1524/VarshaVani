/**
 * VarshaVani assistant: a lightweight, offline conversational layer over the
 * advisory engine. It detects what the farmer is asking about (intent), which
 * crop and which week, then answers from the same forecast and rules the rest
 * of the app uses, in English, Hindi or Marathi.
 *
 * NOTE: prototype. There is no LLM or server call here; replace `answer()` with
 * an API call to a hosted model if free-form conversation is needed.
 */
import type { Block, BlockForecast, ClimateDrivers, CropId, FarmerCrop, GrowthStage, Lang, Week } from "@/types";
import { getAdvisory, sowingWindows } from "./advisoryEngine";
import { fmtRange, renderMsg, translate } from "./i18n";
import { blockName } from "@/data/blocks";
import { CROPS, PRE_SOWING_STAGES } from "@/data/crops";

export interface BotContext {
  forecast: BlockForecast;
  drivers: ClimateDrivers;
  block: Block;
  crops: FarmerCrop[];
  activeCrop?: FarmerCrop;
}

export type Intent =
  | "help"
  | "thanks"
  | "greet"
  | "why"
  | "fertilizer"
  | "pest"
  | "heavy"
  | "dry"
  | "water"
  | "alternatives"
  | "sow"
  | "rain"
  | "unknown";

/* ---------------- Understanding ---------------- */

// Latin keywords are matched on word starts; Devanagari ones as substrings.
const KEYWORDS: [Exclude<Intent, "unknown">, string[]][] = [
  ["help", ["helpline", "help line", "call", "officer", "contact", "number", "insurance", "bima", "हेल्पलाइन", "नंबर", "क्रमांक", "अधिकारी", "बीमा", "विमा", "संपर्क"]],
  ["thanks", ["thank", "thanks", "dhanyavad", "shukriya", "धन्यवाद", "शुक्रिया", "आभार"]],
  ["why", ["why", "reason", "mjo", "el nino", "elnino", "enso", "iod", "kyon", "kyu", "क्यों", "कारण", "कशामुळे", "सल्ला का"]],
  ["fertilizer", ["fertili", "urea", "dap", "manure", "khad", "खाद", "उर्वरक", "यूरिया", "युरिया", "खत"]],
  ["pest", ["pest", "insect", "disease", "worm", "spray", "keet", "कीट", "कीड़", "कीड", "रोग", "इल्ली", "फवारणी", "छिड़काव"]],
  ["heavy", ["heavy", "flood", "storm", "cyclone", "भारी", "बाढ़", "तूफ़ान", "तूफान", "मुसळधार", "पूर", "वादळ"]],
  ["dry", ["dry", "drought", "break", "sukha", "सूखा", "सूखे", "खंड", "कोरड", "दुष्काळ"]],
  ["water", ["irrigat", "water", "moisture", "mulch", "pani", "पानी", "सिंचाई", "नमी", "पाणी", "सिंचन", "ओलावा"]],
  ["alternatives", ["variety", "varieties", "alternative", "other crop", "intercrop", "किस्म", "वैरायटी", "विकल्प", "वाण", "पर्याय", "आंतरपीक"]],
  ["sow", ["sow", "plant", "seed", "buvai", "buwai", "बुवाई", "बोन", "बोऊ", "बोएँ", "बीज", "पेरणी", "पेर", "लागवड", "बियाणे"]],
  ["rain", ["rain", "weather", "forecast", "monsoon", "barish", "baarish", "mausam", "बारिश", "वर्षा", "मौसम", "मानसून", "पाऊस", "पावसा", "हवामान", "अंदाज"]],
];

const GREET = ["hi", "hello", "hey", "namaste", "namaskar", "नमस्ते", "नमस्कार", "राम राम"];

const CROP_WORDS: [CropId, string[]][] = [
  ["soybean", ["soy", "सोयाबीन"]],
  ["cotton", ["cotton", "kapas", "कपास", "कापूस"]],
  ["tur", ["tur", "toor", "arhar", "pigeon", "तुअर", "तूर", "अरहर"]],
  ["rice", ["rice", "paddy", "dhan", "धान", "चावल", "भात"]],
  ["bajra", ["bajra", "millet", "बाजरा", "बाजरी"]],
  ["maize", ["maize", "corn", "makka", "मक्का", "मका"]],
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function has(text: string, words: string[]): boolean {
  return words.some((w) => (/^[a-z ?]+$/.test(w) ? new RegExp(`(^|[^a-z])${escape(w)}`).test(text) : text.includes(w)));
}

export function detectIntent(raw: string): Intent {
  const text = raw.toLowerCase();
  for (const [intent, words] of KEYWORDS) if (has(text, words)) return intent;
  if (has(text, GREET)) return "greet";
  return "unknown";
}

function detectCrop(text: string): CropId | undefined {
  const t = text.toLowerCase();
  return CROP_WORDS.find(([, words]) => has(t, words))?.[0];
}

function detectWeek(text: string): Week | undefined {
  const t = text.toLowerCase();
  const n = t.match(/(?:week|सप्ताह|हफ्ते|हफ़्ते|आठवडा|आठवड्यात)\s*([1-4])/)?.[1];
  if (n) return Number(n) as Week;
  if (has(t, ["next week", "agle", "अगले", "पुढच्या", "पुढील"])) return 2;
  if (has(t, ["this week", "today", "now", "is hafte", "इस", "आज", "या आठवड"])) return 1;
  return undefined;
}

/* ---------------- Framing copy ---------------- */

const COPY: Record<Lang, Record<string, string>> = {
  en: {
    greet: "Namaste! How can I help your farm today? You can ask me:",
    capabilities: "• Can I sow now?\n• Will it rain this week?\n• Dry spell or heavy rain coming?\n• Water, pests or fertiliser tips\n• Why this advice?",
    thanks: "You are welcome. Take care of your crop. Ask me anytime. 🌱",
    unknown: "Sorry, I did not understand that fully. I can help with:",
    alreadySown: "Your {crop} is already at the *{stage}* stage. Here is the advice for this week:",
    bestWindow: "📅 Best sowing window: *{range}*",
    noWindow: "📅 No safe sowing window in the next 4 weeks. Check again next week.",
    rainTitle: "*Rain outlook for {block}*",
    expected: "about {mm} mm",
    confidence: "Confidence",
    dryTitle: "*Dry-spell chance, next 4 weeks*",
    heavyTitle: "*Heavy-rain chance, next 4 weeks*",
    waterTitle: "*Water tips for your {crop}*",
    whyTitle: "*Why this advice for {crop}?*",
    altTitle: "*Other options for {crop}*",
    pestTitle: "*Pest care for your {crop}*",
    pest1: "Walk the field twice a week and check the underside of leaves.",
    pest2: "Put up yellow sticky traps and pheromone traps (about 5 per acre).",
    pest3: "Spray only when pests cross the damage level, and only if no rain is expected for 24 hours.",
    pest4: "Ask your agriculture officer before using a new pesticide.",
    pestRain: "Rain is likely this week ({p}%), so a spray may wash off.",
    fertTitle: "*Fertiliser timing for your {crop}*",
    fertMoist: "Give fertiliser when the soil is moist, ideally just after a light rain.",
    fertDry: "A dry spell is possible ({p}%). Fertiliser on dry soil is wasted, so wait for moisture.",
    fertOk: "No major weather risk this week, so this is a good time to top-dress.",
    helpTitle: "*Help and contacts*",
    help1: "📞 Kisan Call Centre: *1800-180-1551* (toll-free, 6 am – 10 pm)",
    help2: "👨‍🌾 Your block agriculture office in {block} for local advice and schemes.",
    help3: "🛡 For crop insurance, report crop loss to your insurer, bank or agriculture office quickly, usually within 72 hours.",
  },
  hi: {
    greet: "नमस्ते! आज मैं आपके खेत के लिए कैसे मदद करूँ? आप पूछ सकते हैं:",
    capabilities: "• क्या अभी बुवाई करूँ?\n• क्या इस सप्ताह बारिश होगी?\n• सूखा अंतराल या भारी बारिश आएगी?\n• पानी, कीट या खाद की सलाह\n• यह सलाह क्यों?",
    thanks: "आपका स्वागत है। अपनी फ़सल का ध्यान रखें। कभी भी पूछें। 🌱",
    unknown: "माफ़ कीजिए, मैं पूरी तरह समझ नहीं पाया। मैं इनमें मदद कर सकता हूँ:",
    alreadySown: "आपकी {crop} पहले से *{stage}* अवस्था में है। इस सप्ताह की सलाह:",
    bestWindow: "📅 बुवाई का सबसे अच्छा समय: *{range}*",
    noWindow: "📅 अगले 4 सप्ताह में बुवाई का कोई सुरक्षित समय नहीं। अगले सप्ताह फिर देखें।",
    rainTitle: "*{block} के लिए बारिश का पूर्वानुमान*",
    expected: "लगभग {mm} मिमी",
    confidence: "भरोसा",
    dryTitle: "*सूखे अंतराल की संभावना, अगले 4 सप्ताह*",
    heavyTitle: "*भारी बारिश की संभावना, अगले 4 सप्ताह*",
    waterTitle: "*आपकी {crop} के लिए पानी की सलाह*",
    whyTitle: "*{crop} के लिए यह सलाह क्यों?*",
    altTitle: "*{crop} के लिए दूसरे विकल्प*",
    pestTitle: "*आपकी {crop} में कीट देखभाल*",
    pest1: "सप्ताह में दो बार खेत घूमें और पत्तियों के नीचे की तरफ़ देखें।",
    pest2: "पीले चिपचिपे ट्रैप और फेरोमोन ट्रैप लगाएँ (लगभग 5 प्रति एकड़)।",
    pest3: "कीट नुकसान स्तर से ऊपर हों तभी छिड़काव करें, और तभी जब 24 घंटे बारिश की संभावना न हो।",
    pest4: "नई दवा इस्तेमाल करने से पहले अपने कृषि अधिकारी से पूछें।",
    pestRain: "इस सप्ताह बारिश की संभावना है ({p}%), छिड़काव धुल सकता है।",
    fertTitle: "*आपकी {crop} में खाद का समय*",
    fertMoist: "मिट्टी में नमी हो तब खाद दें, हल्की बारिश के ठीक बाद सबसे अच्छा।",
    fertDry: "सूखा अंतराल संभव है ({p}%)। सूखी मिट्टी में खाद बेकार जाती है, नमी का इंतज़ार करें।",
    fertOk: "इस सप्ताह कोई बड़ा मौसम जोखिम नहीं है, ऊपर से खाद देने का अच्छा समय है।",
    helpTitle: "*मदद और संपर्क*",
    help1: "📞 किसान कॉल सेंटर: *1800-180-1551* (निःशुल्क, सुबह 6 – रात 10)",
    help2: "👨‍🌾 स्थानीय सलाह और योजनाओं के लिए {block} का ब्लॉक कृषि कार्यालय।",
    help3: "🛡 फ़सल बीमा के लिए, नुकसान की सूचना जल्दी, आमतौर पर 72 घंटे के भीतर, बीमा कंपनी, बैंक या कृषि कार्यालय को दें।",
  },
  mr: {
    greet: "नमस्कार! आज तुमच्या शेतासाठी मी कशी मदत करू? तुम्ही विचारू शकता:",
    capabilities: "• आता पेरणी करू का?\n• या आठवड्यात पाऊस पडेल का?\n• पावसाचा खंड की मुसळधार पाऊस?\n• पाणी, कीड किंवा खताचा सल्ला\n• हा सल्ला का?",
    thanks: "तुमचे स्वागत आहे. पिकाची काळजी घ्या. केव्हाही विचारा. 🌱",
    unknown: "माफ करा, मला पूर्ण समजले नाही. मी यात मदत करू शकतो:",
    alreadySown: "तुमचे {crop} आधीच *{stage}* अवस्थेत आहे. या आठवड्याचा सल्ला:",
    bestWindow: "📅 पेरणीचा सर्वात योग्य काळ: *{range}*",
    noWindow: "📅 पुढील ४ आठवड्यांत पेरणीसाठी सुरक्षित काळ नाही. पुढच्या आठवड्यात पुन्हा पहा.",
    rainTitle: "*{block} साठी पावसाचा अंदाज*",
    expected: "सुमारे {mm} मिमी",
    confidence: "खात्री",
    dryTitle: "*पावसाच्या खंडाची शक्यता, पुढील ४ आठवडे*",
    heavyTitle: "*मुसळधार पावसाची शक्यता, पुढील ४ आठवडे*",
    waterTitle: "*तुमच्या {crop} साठी पाण्याचा सल्ला*",
    whyTitle: "*{crop} साठी हा सल्ला का?*",
    altTitle: "*{crop} साठी इतर पर्याय*",
    pestTitle: "*तुमच्या {crop} मधील कीड व्यवस्थापन*",
    pest1: "आठवड्यातून दोनदा शेत फिरा आणि पानांच्या खालच्या बाजूला तपासा.",
    pest2: "पिवळे चिकट सापळे आणि कामगंध सापळे लावा (एकरी सुमारे ५).",
    pest3: "कीड नुकसान पातळीच्या वर गेल्यावरच फवारणी करा, आणि २४ तास पाऊस अपेक्षित नसेल तेव्हाच.",
    pest4: "नवीन औषध वापरण्यापूर्वी कृषी अधिकाऱ्यांना विचारा.",
    pestRain: "या आठवड्यात पावसाची शक्यता आहे ({p}%), फवारणी धुऊन जाऊ शकते.",
    fertTitle: "*तुमच्या {crop} साठी खताची वेळ*",
    fertMoist: "जमिनीत ओलावा असताना खत द्या, हलक्या पावसानंतर लगेच उत्तम.",
    fertDry: "पावसाचा खंड शक्य आहे ({p}%). कोरड्या जमिनीत खत वाया जाते, ओलाव्याची वाट पहा.",
    fertOk: "या आठवड्यात मोठा हवामान धोका नाही, वरखत देण्यासाठी चांगली वेळ आहे.",
    helpTitle: "*मदत आणि संपर्क*",
    help1: "📞 किसान कॉल सेंटर: *1800-180-1551* (मोफत, सकाळी ६ – रात्री १०)",
    help2: "👨‍🌾 स्थानिक सल्ला आणि योजनांसाठी {block} येथील तालुका कृषी कार्यालय.",
    help3: "🛡 पीक विम्यासाठी, नुकसानाची माहिती लवकर, साधारणपणे ७२ तासांच्या आत, विमा कंपनी, बँक किंवा कृषी कार्यालयाला द्या.",
  },
};

const c = (lang: Lang, key: string, params: Record<string, string | number> = {}) =>
  (COPY[lang][key] ?? COPY.en[key] ?? key).replace(/\{(\w+)\}/g, (_, n: string) => String(params[n] ?? `{${n}}`));

const bullets = (lines: string[]) => lines.filter(Boolean).map((l) => `• ${l}`).join("\n");

/* ---------------- Answering ---------------- */

export function answer(raw: string, lang: Lang, ctx: BotContext): string {
  const intent = detectIntent(raw);
  const cropId = detectCrop(raw) ?? ctx.activeCrop?.crop ?? ctx.crops[0]?.crop ?? "soybean";
  const farmerCrop = ctx.crops.find((x) => x.crop === cropId);
  const stage: GrowthStage = farmerCrop?.stage ?? "not_sown";
  const week: Week = detectWeek(raw) ?? 1;
  const opts = { drivers: ctx.drivers, block: ctx.block };
  const crop = translate(lang, `crop.${cropId}`);
  const bName = blockName(ctx.block, lang);
  const adv = getAdvisory(cropId, stage, ctx.forecast, week, opts);
  const w = ctx.forecast.weeks[week - 1];
  const tm = (m: { key: string; params?: Record<string, string | number> }) => renderMsg(lang, m);
  const weekLabel = (n: number) => translate(lang, "common.week", { n });

  switch (intent) {
    case "greet":
      return `${c(lang, "greet")}\n${c(lang, "capabilities")}`;
    case "thanks":
      return c(lang, "thanks");
    case "help":
      return [c(lang, "helpTitle"), c(lang, "help1"), c(lang, "help2", { block: bName }), c(lang, "help3")].join("\n");

    case "sow": {
      const preSowing = PRE_SOWING_STAGES.includes(stage);
      const sowAdv = preSowing ? adv : getAdvisory(cropId, "not_sown", ctx.forecast, week, opts);
      const windows = sowingWindows(cropId, ctx.forecast, opts)
        .filter((x) => x.decision !== "wait")
        .sort((a, b) => b.score - a.score);
      const best = windows[0];
      const head = preSowing
        ? `*${sowAdv.decision ? translate(lang, `decision.${sowAdv.decision}`) : translate(lang, `type.${sowAdv.type}`)}* – ${crop}`
        : c(lang, "alreadySown", { crop, stage: translate(lang, `stage.${stage}`) });
      const body = preSowing ? sowAdv : adv;
      return [
        head,
        tm(body.action),
        bullets(body.reasons.slice(0, 2).map(tm)),
        `💧 ${tm(body.irrigationTip)}`,
        preSowing ? (best ? c(lang, "bestWindow", { range: fmtRange(lang, best.startDate, best.endDate) }) : c(lang, "noWindow")) : "",
      ]
        .filter(Boolean)
        .join("\n");
    }

    case "rain": {
      const weeks = detectWeek(raw) ? [w] : ctx.forecast.weeks.slice(0, 2);
      const lines = weeks.map(
        (x) =>
          `📅 *${weekLabel(x.week)}* (${fmtRange(lang, x.startDate, x.endDate)})\n` +
          `🌧 ${translate(lang, "layer.onset")}: ${x.onset}% · ${c(lang, "expected", { mm: x.expectedRainMm })}\n` +
          `☀️ ${translate(lang, "layer.break")}: ${x.breakProb}%\n` +
          `⛈ ${translate(lang, "layer.heavy")}: ${x.heavyRain}%\n` +
          `${c(lang, "confidence")}: ${translate(lang, `conf.${x.confidenceLevel}`)}`,
      );
      return [
        c(lang, "rainTitle", { block: bName }),
        translate(lang, "home.recentRain", { mm: ctx.forecast.recentRainMm }),
        ...lines,
        ctx.forecast.falseOnsetRisk && weeks[0].week === 1 ? `⚠️ ${translate(lang, "home.falseOnset")}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    }

    case "dry":
      return [
        c(lang, "dryTitle"),
        ...ctx.forecast.weeks.map((x) => `☀️ ${weekLabel(x.week)} (${fmtRange(lang, x.startDate, x.endDate)}): *${x.breakProb}%*`),
        "",
        `💧 ${tm(adv.irrigationTip)}`,
        `💡 ${translate(lang, "alt.mulch")}`,
      ].join("\n");

    case "heavy":
      return [
        c(lang, "heavyTitle"),
        ...ctx.forecast.weeks.map((x) => `⛈ ${weekLabel(x.week)} (${fmtRange(lang, x.startDate, x.endDate)}): *${x.heavyRain}%*`),
        "",
        `💡 ${translate(lang, "alt.drainage")}`,
        `💡 ${translate(lang, "alt.delay_fertilizer")}`,
      ].join("\n");

    case "water":
      return [
        c(lang, "waterTitle", { crop }),
        `💧 ${tm(adv.irrigationTip)}`,
        bullets([translate(lang, "alt.mulch"), translate(lang, "alt.bbf"), w.breakProb >= 50 ? translate(lang, "alt.foliar_spray") : ""]),
      ].join("\n");

    case "pest":
      return [
        c(lang, "pestTitle", { crop }),
        bullets([c(lang, "pest1"), c(lang, "pest2"), c(lang, "pest3"), c(lang, "pest4")]),
        w.onset >= 50 || w.heavyRain >= 40 ? `⚠️ ${c(lang, "pestRain", { p: Math.max(w.onset, w.heavyRain) })}` : "",
      ]
        .filter(Boolean)
        .join("\n");

    case "fertilizer": {
      const lines = [c(lang, "fertTitle", { crop }), `• ${c(lang, "fertMoist")}`];
      if (w.heavyRain >= 40) lines.push(`⚠️ ${translate(lang, "alt.delay_fertilizer")}`, `• ${translate(lang, "reason.heavy_moderate", { p: w.heavyRain, week })}`);
      else if (w.breakProb >= 50) lines.push(`⚠️ ${c(lang, "fertDry", { p: w.breakProb })}`);
      else lines.push(`✅ ${c(lang, "fertOk")}`);
      return lines.join("\n");
    }

    case "why":
      return [c(lang, "whyTitle", { crop }), bullets(adv.drivers.map(tm))].join("\n");

    case "alternatives": {
      const alts = adv.alternatives.length ? adv.alternatives.map(tm) : CROPS[cropId].alternatives.map((k) => translate(lang, k));
      return [c(lang, "altTitle", { crop }), bullets(alts)].join("\n");
    }

    default:
      return `${c(lang, "unknown")}\n${c(lang, "capabilities")}`;
  }
}
