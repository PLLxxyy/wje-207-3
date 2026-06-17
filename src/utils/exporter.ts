import fs from 'fs';
import path from 'path';
import { Label, EXPRESS_COMPANIES } from '../types';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getCompanyInfo(code: string) {
  return EXPRESS_COMPANIES.find(c => c.code === code) || { name: code, code, color: '#333' };
}

function renderSingleLabelHtml(label: Label): string {
  const company = getCompanyInfo(label.expressCompany);
  const senderAddr = `${label.sender.province}${label.sender.city}${label.sender.district}${label.sender.detail}`;
  const receiverAddr = `${label.receiver.province}${label.receiver.city}${label.receiver.district}${label.receiver.detail}`;

  return `
    <div class="label">
      <div class="label-header" style="border-bottom-color: ${company.color}">
        <span class="company-name" style="color: ${company.color}">【${escapeHtml(company.name)}】</span>
        <span class="tracking-number">单号: ${escapeHtml(label.trackingNumber)}</span>
      </div>
      <div class="label-body">
        <div class="address-section sender">
          <div class="section-title">发件信息</div>
          <div class="person-info">
            <span class="name">${escapeHtml(label.sender.name)}</span>
            <span class="phone">${escapeHtml(label.sender.phone)}</span>
          </div>
          <div class="address">${escapeHtml(senderAddr)}</div>
        </div>
        <div class="divider"></div>
        <div class="address-section receiver">
          <div class="section-title">收件信息</div>
          <div class="person-info">
            <span class="name">${escapeHtml(label.receiver.name)}</span>
            <span class="phone">${escapeHtml(label.receiver.phone)}</span>
          </div>
          <div class="address">${escapeHtml(receiverAddr)}</div>
        </div>
      </div>
      <div class="label-footer">
        生成时间: ${escapeHtml(label.createdAt)}
      </div>
    </div>`;
}

export function generateHtml(labels: Label[]): string {
  const labelsHtml = labels.map(renderSingleLabelHtml).join('\n');
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>快递面单打印</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Microsoft YaHei", "PingFang SC", "Helvetica Neue", Arial, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    h1 {
      text-align: center;
      margin-bottom: 20px;
      color: #333;
      font-size: 24px;
    }
    .print-info {
      text-align: center;
      margin-bottom: 20px;
      color: #666;
      font-size: 14px;
    }
    .label {
      width: 100mm;
      min-height: 80mm;
      margin: 10px auto;
      border: 2px solid #333;
      background: #fff;
      page-break-inside: avoid;
      page-break-after: always;
    }
    .label-header {
      padding: 12px 16px;
      border-bottom: 3px solid #333;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .company-name {
      font-size: 18px;
      font-weight: bold;
    }
    .tracking-number {
      font-size: 14px;
      font-family: monospace;
      color: #333;
    }
    .label-body {
      padding: 12px 16px;
    }
    .address-section { padding: 8px 0; }
    .section-title {
      font-size: 12px;
      color: #999;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .person-info {
      margin-bottom: 4px;
    }
    .person-info .name {
      font-size: 16px;
      font-weight: bold;
      margin-right: 16px;
    }
    .person-info .phone {
      font-size: 14px;
      font-family: monospace;
    }
    .address {
      font-size: 14px;
      color: #333;
      line-height: 1.4;
    }
    .divider {
      border-top: 1px dashed #ccc;
      margin: 8px 0;
    }
    .label-footer {
      padding: 8px 16px;
      font-size: 12px;
      color: #999;
      border-top: 1px solid #eee;
      text-align: right;
    }
    @media print {
      body { background: #fff; padding: 0; }
      h1, .print-info { display: none; }
      .label {
        border: 1px solid #000;
        margin: 0;
        width: 100%;
        min-height: auto;
      }
    }
  </style>
</head>
<body>
  <h1>快递面单打印</h1>
  <div class="print-info">共 ${labels.length} 张面单 - 按 Ctrl+P 打印</div>
  ${labelsHtml}
</body>
</html>`;
}

export function exportHtml(labels: Label[], outputPath?: string): string {
  const html = generateHtml(labels);
  const filePath = outputPath || path.join(process.cwd(), `labels_${Date.now()}.html`);
  fs.writeFileSync(filePath, html, 'utf-8');
  return filePath;
}
