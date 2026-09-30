import type { AdvisoryType, CropId, FarmerProfile, FeedbackEntry, Lang, MessageLog } from "@/types";
import { BLOCKS } from "./blocks";
import { rng } from "@/lib/seededRandom";

/**
 * Mock farmer profiles, message logs and feedback.
 * Names and phone numbers are fictional placeholders.
 */

export const DEMO_FARMER: FarmerProfile = {
  id: "f-001",
  name: "Sunil Jadhav",
  village: "Harangul",
  blockId: "latur",
  phone: "+91 98XXX XX101",
  lang: "mr",
  crops: [{ id: "c-1", crop: "soybean", stage: "not_sown", areaAcres: 4 }],
};

export const FARMERS: FarmerProfile[] = [
  DEMO_FARMER,
  {
    id: "f-002",
    name: "Kavita Shinde",
    village: "Ter",
    blockId: "dharashiv",
    phone: "+91 98XXX XX102",
    lang: "mr",
    crops: [{ id: "c-2", crop: "tur", stage: "not_sown", areaAcres: 3 }],
  },
  {
    id: "f-003",
    name: "Rajesh Yadav",
    village: "Borgaon Manju",
    blockId: "akola",
    phone: "+91 98XXX XX103",
    lang: "hi",
    crops: [{ id: "c-3", crop: "cotton", stage: "sowing", areaAcres: 6 }],
  },
  {
    id: "f-004",
    name: "Meena Patil",
    village: "Harnai",
    blockId: "dapoli",
    phone: "+91 98XXX XX104",
    lang: "mr",
    crops: [{ id: "c-4", crop: "rice", stage: "germination", areaAcres: 2 }],
  },
  {
    id: "f-005",
    name: "Anil Deshmukh",
    village: "Narayangaon",
    blockId: "junnar",
    phone: "+91 98XXX XX105",
    lang: "en",
    crops: [{ id: "c-5", crop: "maize", stage: "vegetative", areaAcres: 5 }],
  },
];

const TYPES: AdvisoryType[] = ["delay_sowing", "safe_to_sow", "sow_caution", "heavy_rain", "conserve_moisture"];
const CROPS: CropId[] = ["soybean", "cotton", "tur", "rice", "bajra", "maize"];
const LANGS: Lang[] = ["mr", "mr", "mr", "hi", "hi", "en"];

const PREVIEWS: Record<Lang, string> = {
  mr: "🔴 लातूर: पुढील २ आठवडे कोरड्या खंडाचा धोका. सोयाबीन पेरणी ७-१० दिवस पुढे ढकला.",
  hi: "🔴 लातूर: अगले 2 हफ्ते सूखे का खतरा। सोयाबीन बुवाई 7-10 दिन टालें।",
  en: "🔴 Latur: High dry-spell risk next 2 weeks. Delay soybean sowing by 7-10 days.",
};

function isoMinusHours(base: string, hours: number): string {
  const d = new Date(`${base}T09:30:00+05:30`);
  d.setTime(d.getTime() - hours * 3600 * 1000);
  return d.toISOString();
}

export const SEED_MESSAGES: MessageLog[] = Array.from({ length: 14 }, (_, i) => {
  const r = rng(`msg:${i}`);
  const lang = LANGS[Math.floor(r() * LANGS.length)];
  const block = BLOCKS[Math.floor(r() * BLOCKS.length)];
  const statusRoll = r();
  return {
    id: `m-${100 + i}`,
    timestamp: isoMinusHours("2026-06-12", 6 + i * 11),
    channel: r() < 0.55 ? "whatsapp" : "sms",
    lang,
    blockIds: [block.id],
    crop: block.majorCrops[Math.floor(r() * block.majorCrops.length)],
    recipients: Math.round(800 + r() * 5200),
    status: statusRoll < 0.08 ? "failed" : statusRoll < 0.45 ? "delivered" : "read",
    preview: PREVIEWS[lang],
    advisoryType: TYPES[Math.floor(r() * TYPES.length)],
  } satisfies MessageLog;
});

/** ~6 weeks of feedback; usefulness trends upward as advisories improve. */
export const SEED_FEEDBACK: FeedbackEntry[] = Array.from({ length: 84 }, (_, i) => {
  const r = rng(`fb:${i}`);
  const daysAgo = 41 - Math.floor(i / 2);
  const d = new Date("2026-06-12T12:00:00+05:30");
  d.setDate(d.getDate() - daysAgo);
  const pUseful = 0.58 + (i / 84) * 0.28;
  const block = BLOCKS[Math.floor(r() * BLOCKS.length)];
  return {
    id: `fb-${i}`,
    timestamp: d.toISOString(),
    blockId: block.id,
    crop: CROPS[Math.floor(r() * CROPS.length)],
    advisoryType: TYPES[Math.floor(r() * TYPES.length)],
    useful: r() < pUseful,
    lang: LANGS[Math.floor(r() * LANGS.length)],
  } satisfies FeedbackEntry;
});
