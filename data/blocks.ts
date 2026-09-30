import type { Block, CropId, Lang, Ring, Zone } from "@/types";
import { seededRange } from "@/lib/seededRandom";

/**
 * 40 Maharashtra blocks (talukas) across four agro-climatic zones.
 * Coordinates are approximate taluka headquarters. Geometry is an
 * APPROXIMATE hexagonal cell around the centroid (not an official boundary).
 */

interface RawBlock {
  name: string;
  district: string;
  zone: Zone;
  lat: number;
  lng: number;
  villages: string[];
}

const RAW: RawBlock[] = [
  // ---- Konkan (coastal, earliest onset, heavy rain) ----
  { name: "Dahanu", district: "Palghar", zone: "Konkan", lat: 19.97, lng: 72.73, villages: ["Kasa", "Chinchani", "Vangaon"] },
  { name: "Shahapur", district: "Thane", zone: "Konkan", lat: 19.45, lng: 73.33, villages: ["Kasara", "Asangaon", "Kinhavali"] },
  { name: "Alibag", district: "Raigad", zone: "Konkan", lat: 18.64, lng: 72.87, villages: ["Revdanda", "Chaul", "Poynad"] },
  { name: "Mahad", district: "Raigad", zone: "Konkan", lat: 18.08, lng: 73.42, villages: ["Birwadi", "Nate", "Varandh"] },
  { name: "Dapoli", district: "Ratnagiri", zone: "Konkan", lat: 17.76, lng: 73.19, villages: ["Harnai", "Asud", "Kolthare"] },
  { name: "Chiplun", district: "Ratnagiri", zone: "Konkan", lat: 17.53, lng: 73.52, villages: ["Sawarde", "Alore", "Kherdi"] },
  { name: "Ratnagiri", district: "Ratnagiri", zone: "Konkan", lat: 16.99, lng: 73.3, villages: ["Pawas", "Ganpatipule", "Nivali"] },
  { name: "Devgad", district: "Sindhudurg", zone: "Konkan", lat: 16.38, lng: 73.39, villages: ["Jamsande", "Mithbav", "Shirgaon"] },
  { name: "Kudal", district: "Sindhudurg", zone: "Konkan", lat: 16.01, lng: 73.69, villages: ["Pinguli", "Oros", "Mangaon"] },

  // ---- Western Maharashtra (ghats wet, eastern rain-shadow dry) ----
  { name: "Junnar", district: "Pune", zone: "Western Maharashtra", lat: 19.2, lng: 73.88, villages: ["Narayangaon", "Otur", "Alephata"] },
  { name: "Sangamner", district: "Ahmednagar", zone: "Western Maharashtra", lat: 19.57, lng: 74.21, villages: ["Ghargaon", "Talegaon", "Ashvi"] },
  { name: "Rahuri", district: "Ahmednagar", zone: "Western Maharashtra", lat: 19.39, lng: 74.65, villages: ["Deolali Pravara", "Wambori", "Takalimiya"] },
  { name: "Baramati", district: "Pune", zone: "Western Maharashtra", lat: 18.15, lng: 74.58, villages: ["Malegaon", "Supe", "Morgaon"] },
  { name: "Indapur", district: "Pune", zone: "Western Maharashtra", lat: 18.12, lng: 75.02, villages: ["Bhigwan", "Nimgaon Ketki", "Walchandnagar"] },
  { name: "Satara", district: "Satara", zone: "Western Maharashtra", lat: 17.68, lng: 74.0, villages: ["Limb", "Nagthane", "Varye"] },
  { name: "Karad", district: "Satara", zone: "Western Maharashtra", lat: 17.29, lng: 74.18, villages: ["Umbraj", "Masur", "Kale"] },
  { name: "Karvir", district: "Kolhapur", zone: "Western Maharashtra", lat: 16.7, lng: 74.24, villages: ["Kasaba Bawda", "Vadange", "Shiye"] },
  { name: "Miraj", district: "Sangli", zone: "Western Maharashtra", lat: 16.83, lng: 74.64, villages: ["Arag", "Bedag", "Kavathe Piran"] },
  { name: "Jath", district: "Sangli", zone: "Western Maharashtra", lat: 17.05, lng: 75.22, villages: ["Daflapur", "Umadi", "Sankh"] },
  { name: "Pandharpur", district: "Solapur", zone: "Western Maharashtra", lat: 17.68, lng: 75.33, villages: ["Kasegaon", "Bhose", "Tungat"] },

  // ---- Marathwada (semi-arid, break-prone; hero false-onset cluster) ----
  { name: "Latur", district: "Latur", zone: "Marathwada", lat: 18.4, lng: 76.56, villages: ["Harangul", "Murud", "Gategaon"] },
  { name: "Nilanga", district: "Latur", zone: "Marathwada", lat: 18.12, lng: 76.75, villages: ["Kasar Shirsi", "Aurad Shahajani", "Hadga"] },
  { name: "Udgir", district: "Latur", zone: "Marathwada", lat: 18.39, lng: 77.12, villages: ["Her", "Wadhwana", "Nalgir"] },
  { name: "Dharashiv", district: "Dharashiv", zone: "Marathwada", lat: 18.18, lng: 76.04, villages: ["Ter", "Yedshi", "Dhoki"] },
  { name: "Ambajogai", district: "Beed", zone: "Marathwada", lat: 18.73, lng: 76.38, villages: ["Bardapur", "Ghatnandur", "Lokhandi Savargaon"] },
  { name: "Beed", district: "Beed", zone: "Marathwada", lat: 18.99, lng: 75.76, villages: ["Pali", "Chausala", "Nalwandi"] },
  { name: "Parbhani", district: "Parbhani", zone: "Marathwada", lat: 19.27, lng: 76.77, villages: ["Pingli", "Jamb", "Daithana"] },
  { name: "Nanded", district: "Nanded", zone: "Marathwada", lat: 19.15, lng: 77.31, villages: ["Vishnupuri", "Tuppa", "Limbgaon"] },
  { name: "Hingoli", district: "Hingoli", zone: "Marathwada", lat: 19.72, lng: 77.15, villages: ["Narsi", "Basamba", "Digras"] },
  { name: "Jalna", district: "Jalna", zone: "Marathwada", lat: 19.84, lng: 75.88, villages: ["Ramnagar", "Viregaon", "Sevli"] },
  { name: "Paithan", district: "Chh. Sambhajinagar", zone: "Marathwada", lat: 19.48, lng: 75.38, villages: ["Pachod", "Bidkin", "Dhakephal"] },
  { name: "Sambhajinagar", district: "Chh. Sambhajinagar", zone: "Marathwada", lat: 19.88, lng: 75.34, villages: ["Karmad", "Ladsawangi", "Chitegaon"] },

  // ---- Vidarbha (later onset, cotton/soybean belt) ----
  { name: "Buldhana", district: "Buldhana", zone: "Vidarbha", lat: 20.53, lng: 76.18, villages: ["Dhad", "Raipur", "Mhasla"] },
  { name: "Akola", district: "Akola", zone: "Vidarbha", lat: 20.71, lng: 77.0, villages: ["Borgaon Manju", "Kurankhed", "Apatapa"] },
  { name: "Washim", district: "Washim", zone: "Vidarbha", lat: 20.11, lng: 77.13, villages: ["Anasing", "Kata", "Pardi Tikas"] },
  { name: "Amravati", district: "Amravati", zone: "Vidarbha", lat: 20.93, lng: 77.75, villages: ["Walgaon", "Nandgaon Peth", "Badnera"] },
  { name: "Yavatmal", district: "Yavatmal", zone: "Vidarbha", lat: 20.39, lng: 78.12, villages: ["Lohara", "Jodmoha", "Akola Bazar"] },
  { name: "Wardha", district: "Wardha", zone: "Vidarbha", lat: 20.74, lng: 78.6, villages: ["Sewagram", "Pipri", "Salod"] },
  { name: "Katol", district: "Nagpur", zone: "Vidarbha", lat: 21.27, lng: 78.59, villages: ["Kondhali", "Metpanjra", "Yenwa"] },
  { name: "Chandrapur", district: "Chandrapur", zone: "Vidarbha", lat: 19.96, lng: 79.3, villages: ["Ghuggus", "Durgapur", "Padoli"] },
];

/** Devanagari names (shared by Hindi and Marathi UI and SMS). */
export const BLOCK_NAME_DEVA: Record<string, string> = {
  Dahanu: "डहाणू", Shahapur: "शहापूर", Alibag: "अलिबाग", Mahad: "महाड", Dapoli: "दापोली",
  Chiplun: "चिपळूण", Ratnagiri: "रत्नागिरी", Devgad: "देवगड", Kudal: "कुडाळ", Junnar: "जुन्नर",
  Sangamner: "संगमनेर", Rahuri: "राहुरी", Baramati: "बारामती", Indapur: "इंदापूर", Satara: "सातारा",
  Karad: "कराड", Karvir: "करवीर", Miraj: "मिरज", Jath: "जत", Pandharpur: "पंढरपूर",
  Latur: "लातूर", Nilanga: "निलंगा", Udgir: "उदगीर", Dharashiv: "धाराशिव", Ambajogai: "अंबाजोगाई",
  Beed: "बीड", Parbhani: "परभणी", Nanded: "नांदेड", Hingoli: "हिंगोली", Jalna: "जालना",
  Paithan: "पैठण", Sambhajinagar: "संभाजीनगर", Buldhana: "बुलढाणा", Akola: "अकोला", Washim: "वाशिम",
  Amravati: "अमरावती", Yavatmal: "यवतमाळ", Wardha: "वर्धा", Katol: "काटोल", Chandrapur: "चंद्रपूर",
};

const ZONE_CROPS: Record<Zone, CropId[]> = {
  Konkan: ["rice", "maize"],
  "Western Maharashtra": ["soybean", "bajra", "maize", "tur"],
  Marathwada: ["soybean", "tur", "cotton", "bajra"],
  Vidarbha: ["cotton", "soybean", "tur", "rice"],
};

const ZONE_IRRIGATION: Record<Zone, [number, number]> = {
  Konkan: [8, 18],
  "Western Maharashtra": [22, 45],
  Marathwada: [8, 20],
  Vidarbha: [10, 22],
};

/** Hexagon radius in degrees (~10 km). */
const HEX_R = 0.11;

function hexagon(lat: number, lng: number, r = HEX_R): Ring {
  const ring: Ring = [];
  const lngScale = 1 / Math.cos((lat * Math.PI) / 180);
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    ring.push([+(lng + r * lngScale * Math.cos(a)).toFixed(4), +(lat + r * Math.sin(a)).toFixed(4)]);
  }
  ring.push(ring[0]);
  return ring;
}

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const BLOCKS: Block[] = RAW.map((b) => {
  const id = slugify(b.name);
  const [irrLo, irrHi] = ZONE_IRRIGATION[b.zone];
  return {
    id,
    name: b.name,
    district: b.district,
    zone: b.zone,
    lat: b.lat,
    lng: b.lng,
    geometry: hexagon(b.lat, b.lng),
    villages: b.villages,
    irrigatedPct: Math.round(seededRange(`${id}:irr`, irrLo, irrHi)),
    farmers: Math.round(seededRange(`${id}:farmers`, 18000, 52000) / 100) * 100,
    kharifAreaHa: Math.round(seededRange(`${id}:area`, 38000, 96000) / 100) * 100,
    majorCrops: ZONE_CROPS[b.zone],
  };
});

export const BLOCK_BY_ID: Record<string, Block> = Object.fromEntries(BLOCKS.map((b) => [b.id, b]));

/** Localised block name: Devanagari for Hindi/Marathi, Latin for English. */
export function blockName(block: Block | undefined, lang: Lang): string {
  if (!block) return "";
  return lang === "en" ? block.name : (BLOCK_NAME_DEVA[block.name] ?? block.name);
}

export const DISTRICTS = Array.from(new Set(BLOCKS.map((b) => b.district))).sort();
export const ZONES: Zone[] = ["Konkan", "Western Maharashtra", "Marathwada", "Vidarbha"];

/** Hero block for the false-onset demo storyline. */
export const HERO_BLOCK_ID = "latur";
