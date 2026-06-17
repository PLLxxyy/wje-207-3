import fs from 'fs';
import path from 'path';
import { Label, LabelBatch } from '../types';

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadHistory(): LabelBatch[] {
  ensureDataDir();
  if (!fs.existsSync(HISTORY_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(raw) as LabelBatch[];
  } catch {
    return [];
  }
}

export function saveBatch(batch: LabelBatch): void {
  ensureDataDir();
  const history = loadHistory();
  history.unshift(batch);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
}

export function getAllLabels(): Label[] {
  const batches = loadHistory();
  return batches.flatMap(b => b.labels);
}

export function clearHistory(): void {
  ensureDataDir();
  fs.writeFileSync(HISTORY_FILE, '[]', 'utf-8');
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function generateTrackingNumber(code: string): string {
  const prefix: Record<string, string> = {
    SF: 'SF',
    YTO: 'YT',
    ZTO: 'ZT',
    YD: 'YD',
    JT: 'JT',
  };
  const p = prefix[code] || 'EX';
  const num = Math.floor(Math.random() * 9000000000000) + 1000000000000;
  return `${p}${num}`;
}
