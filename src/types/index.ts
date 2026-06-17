export interface Address {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
}

export interface Label {
  id: string;
  expressCompany: string;
  sender: Address;
  receiver: Address;
  createdAt: string;
  trackingNumber: string;
}

export interface LabelBatch {
  labels: Label[];
  createdAt: string;
  batchId: string;
}

export const EXPRESS_COMPANIES = [
  { name: '顺丰速运', code: 'SF', color: '#FF6600' },
  { name: '圆通速递', code: 'YTO', color: '#0066CC' },
  { name: '中通快递', code: 'ZTO', color: '#FF0000' },
  { name: '韵达快递', code: 'YD', color: '#8B4513' },
  { name: '极兔速递', code: 'JT', color: '#FF4500' },
] as const;

export type ExpressCode = typeof EXPRESS_COMPANIES[number]['code'];
