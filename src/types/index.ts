export interface Address {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
}

export type ShippingStatus = 'pending' | 'shipped';

export const SHIPPING_STATUS: Record<ShippingStatus, { label: string; color: string }> = {
  pending: { label: '待发货', color: '#FFA500' },
  shipped: { label: '已发货', color: '#228B22' },
};

export interface Label {
  id: string;
  expressCompany: string;
  sender: Address;
  receiver: Address;
  createdAt: string;
  trackingNumber: string;
  status: ShippingStatus;
  shippedAt?: string;
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
