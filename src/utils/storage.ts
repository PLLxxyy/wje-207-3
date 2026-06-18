import fs from 'fs';
import path from 'path';
import { Label, LabelBatch, ShippingStatus } from '../types';

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function normalizeLabel(label: any): Label {
  if (!label.status) {
    return { ...label, status: 'pending' as ShippingStatus };
  }
  return label as Label;
}

function normalizeBatch(batch: any): LabelBatch {
  return {
    ...batch,
    labels: (batch.labels || []).map(normalizeLabel),
  };
}

export function loadHistory(): LabelBatch[] {
  ensureDataDir();
  if (!fs.existsSync(HISTORY_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeBatch);
  } catch {
    return [];
  }
}

function writeHistory(batches: LabelBatch[]): void {
  ensureDataDir();
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(batches, null, 2), 'utf-8');
}

export function updateLabelStatus(labelId: string, status: ShippingStatus, shippedAt?: string): boolean {
  const batches = loadHistory();
  let found = false;
  for (const batch of batches) {
    for (const label of batch.labels) {
      if (label.id === labelId) {
        label.status = status;
        if (status === 'shipped') {
          label.shippedAt = shippedAt || formatNow();
        } else if (status === 'pending') {
          label.shippedAt = undefined;
        }
        found = true;
      }
    }
  }
  if (found) {
    writeHistory(batches);
  }
  return found;
}

function formatNow(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
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
