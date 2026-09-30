/**
 * Data service layer.
 *
 * Every function is async and returns plain typed data, exactly as a REST/
 * GraphQL client would. The UI only talks to this module, so swapping the mock
 * for the real model API requires no UI changes.
 *
 * >>> Replace with real model API <<<
 *   e.g. `return fetch(`${API}/forecast/${blockId}`).then(r => r.json())`
 */
import type {
  Block,
  BlockForecast,
  Channel,
  ClimateDrivers,
  CropId,
  AdvisoryType,
  FeedbackEntry,
  HistoryReplay,
  Lang,
  MessageLog,
} from "@/types";
import { BLOCKS, BLOCK_BY_ID } from "@/data/blocks";
import { FORECASTS } from "@/data/forecasts";
import { DRIVERS } from "@/data/drivers";
import { buildReplay, buildReplayDistribution, type ReplaySummary } from "@/data/history";
import { SEED_FEEDBACK, SEED_MESSAGES } from "@/data/community";

/** Simulated network latency so loading states are visible in the demo. */
const LATENCY_MS = 220;
const delay = <T,>(value: T, ms = LATENCY_MS): Promise<T> => new Promise((res) => setTimeout(() => res(value), ms));

const LAST_FORECAST_KEY = "mm:last-forecast";

// Replace with real model API: GET /blocks
export async function getBlocks(): Promise<Block[]> {
  return delay(BLOCKS, 120);
}

// Replace with real model API: GET /blocks/:id
export async function getBlock(id: string): Promise<Block | undefined> {
  return delay(BLOCK_BY_ID[id], 80);
}

// Replace with real model API: GET /forecast/:blockId
export async function getForecast(blockId: string): Promise<BlockForecast> {
  const f = FORECASTS[blockId];
  if (!f) throw new Error(`No forecast for block ${blockId}`);
  // Keep a copy for the offline banner ("showing last saved advisory").
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LAST_FORECAST_KEY, JSON.stringify({ savedAt: new Date().toISOString(), forecast: f }));
    } catch {
      /* storage full or disabled: ignore */
    }
  }
  return delay(f);
}

// Replace with real model API: GET /forecast?all=true
export async function getAllForecasts(): Promise<Record<string, BlockForecast>> {
  return delay(FORECASTS);
}

// Replace with real model API: GET /drivers/latest
export async function getDrivers(): Promise<ClimateDrivers> {
  return delay(DRIVERS);
}

// Replace with real model API: GET /hindcast/:year/:blockId
export async function getReplay(year: number, blockId: string): Promise<HistoryReplay | null> {
  return delay(buildReplay(year, blockId), 300);
}

// Replace with real model API: GET /hindcast/summary (all years × blocks)
export async function getReplayDistribution(): Promise<ReplaySummary[]> {
  return delay(buildReplayDistribution(), 300);
}

// Replace with real API: GET /messages
export async function getMessageLog(): Promise<MessageLog[]> {
  return delay(SEED_MESSAGES, 150);
}

// Replace with real API: GET /feedback
export async function getFeedback(): Promise<FeedbackEntry[]> {
  return delay(SEED_FEEDBACK, 150);
}

/** Last forecast cached in the browser, for offline use. */
export function getCachedForecast(): { savedAt: string; forecast: BlockForecast } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_FORECAST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export interface CampaignRequest {
  blockIds: string[];
  crop: CropId;
  lang: Lang;
  channel: Channel;
  preview: string;
  advisoryType: AdvisoryType;
}

let campaignCounter = 0;

// Replace with real SMS/WhatsApp gateway: POST /campaigns
export async function sendCampaign(req: CampaignRequest): Promise<MessageLog> {
  campaignCounter += 1;
  const recipients = req.blockIds.reduce((sum, id) => sum + Math.round((BLOCK_BY_ID[id]?.farmers ?? 0) * 0.35), 0);
  return delay(
    {
      id: `m-new-${Date.now()}-${campaignCounter}`,
      timestamp: new Date().toISOString(),
      channel: req.channel,
      lang: req.lang,
      blockIds: req.blockIds,
      crop: req.crop,
      recipients,
      status: "queued",
      preview: req.preview,
      advisoryType: req.advisoryType,
    },
    400,
  );
}
