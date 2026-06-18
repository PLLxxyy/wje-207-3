import chalk from 'chalk';
import { Label, EXPRESS_COMPANIES, SHIPPING_STATUS } from '../types';

function padRight(str: string, len: number): string {
  const visible = str.replace(/[一-鿿＀-￯]/g, 'xx');
  const padLen = len - visible.length;
  return padLen > 0 ? str + ' '.repeat(padLen) : str;
}

function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let current = '';
  let currentLen = 0;
  for (const ch of text) {
    const charLen = /[一-鿿＀-￯]/.test(ch) ? 2 : 1;
    if (currentLen + charLen > maxChars) {
      lines.push(current);
      current = '';
      currentLen = 0;
    }
    current += ch;
    currentLen += charLen;
  }
  if (current) lines.push(current);
  return lines;
}

function formatAddress(addr: { province: string; city: string; district: string; detail: string }): string {
  return `${addr.province}${addr.city}${addr.district}${addr.detail}`;
}

export function renderLabel(label: Label): string {
  const company = EXPRESS_COMPANIES.find(c => c.code === label.expressCompany);
  const companyName = company ? company.name : label.expressCompany;
  const statusInfo = SHIPPING_STATUS[label.status];
  const width = 50;
  const innerWidth = width - 4;

  const topBorder = '+' + '-'.repeat(width - 2) + '+';
  const separator = '|' + '='.repeat(width - 2) + '|';
  const thinSep = '|' + '-'.repeat(width - 2) + '|';
  const emptyLine = '|' + ' '.repeat(width - 2) + '|';

  function makeLine(text: string): string {
    const padded = padRight(text, innerWidth);
    return '| ' + padded + ' |';
  }

  const senderFull = formatAddress(label.sender);
  const receiverFull = formatAddress(label.receiver);

  const senderLines = [
    `发件人: ${label.sender.name}  ${label.sender.phone}`,
    `地址: ${senderFull}`,
  ];
  const receiverLines = [
    `收件人: ${label.receiver.name}  ${label.receiver.phone}`,
    `地址: ${receiverFull}`,
  ];

  const senderWrapped = senderLines.flatMap(l => wrapText(l, innerWidth));
  const receiverWrapped = receiverLines.flatMap(l => wrapText(l, innerWidth));

  const statusText = label.status === 'shipped'
    ? `【${statusInfo.label}】 发货时间: ${label.shippedAt || label.createdAt}`
    : `【${statusInfo.label}】`;
  const statusColor = label.status === 'shipped' ? chalk.green : chalk.yellow;

  const lines: string[] = [];
  lines.push(topBorder);
  lines.push(makeLine(`【${companyName}】  单号: ${label.trackingNumber}`));
  lines.push(separator);
  lines.push(statusColor.bold(makeLine(statusText)));
  lines.push(thinSep);

  lines.push(makeLine(''));
  lines.push(chalk.green.bold(makeLine('>>> 发件信息 <<<')));
  for (const sl of senderWrapped) {
    lines.push(makeLine(sl));
  }
  lines.push(emptyLine);

  lines.push(thinSep);
  lines.push(emptyLine);

  lines.push(chalk.red.bold(makeLine('>>> 收件信息 <<<')));
  for (const rl of receiverWrapped) {
    lines.push(makeLine(rl));
  }
  lines.push(makeLine(''));
  lines.push(makeLine(`生成时间: ${label.createdAt}`));
  lines.push(topBorder);

  return lines.join('\n');
}

export function renderLabelPlain(label: Label): string {
  const company = EXPRESS_COMPANIES.find(c => c.code === label.expressCompany);
  const companyName = company ? company.name : label.expressCompany;
  const statusInfo = SHIPPING_STATUS[label.status];
  const width = 50;
  const innerWidth = width - 4;

  const topBorder = '+' + '-'.repeat(width - 2) + '+';
  const separator = '|' + '='.repeat(width - 2) + '|';
  const thinSep = '|' + '-'.repeat(width - 2) + '|';
  const emptyLine = '|' + ' '.repeat(width - 2) + '|';

  function makeLine(text: string): string {
    const padded = padRight(text, innerWidth);
    return '| ' + padded + ' |';
  }

  const senderFull = formatAddress(label.sender);
  const receiverFull = formatAddress(label.receiver);

  const senderLines = [
    `发件人: ${label.sender.name}  ${label.sender.phone}`,
    `地址: ${senderFull}`,
  ];
  const receiverLines = [
    `收件人: ${label.receiver.name}  ${label.receiver.phone}`,
    `地址: ${receiverFull}`,
  ];

  const senderWrapped = senderLines.flatMap(l => wrapText(l, innerWidth));
  const receiverWrapped = receiverLines.flatMap(l => wrapText(l, innerWidth));

  const statusText = label.status === 'shipped'
    ? `【${statusInfo.label}】 发货时间: ${label.shippedAt || label.createdAt}`
    : `【${statusInfo.label}】`;

  const lines: string[] = [];
  lines.push(topBorder);
  lines.push(makeLine(`【${companyName}】  单号: ${label.trackingNumber}`));
  lines.push(separator);
  lines.push(makeLine(statusText));
  lines.push(thinSep);
  lines.push(makeLine(''));
  lines.push(makeLine('>>> 发件信息 <<<'));
  for (const sl of senderWrapped) {
    lines.push(makeLine(sl));
  }
  lines.push(emptyLine);
  lines.push(thinSep);
  lines.push(emptyLine);
  lines.push(makeLine('>>> 收件信息 <<<'));
  for (const rl of receiverWrapped) {
    lines.push(makeLine(rl));
  }
  lines.push(makeLine(''));
  lines.push(makeLine(`生成时间: ${label.createdAt}`));
  lines.push(topBorder);

  return lines.join('\n');
}

export function renderSmallLabel(label: Label): string {
  const company = EXPRESS_COMPANIES.find(c => c.code === label.expressCompany);
  const companyName = company ? company.name : label.expressCompany;
  const statusInfo = SHIPPING_STATUS[label.status];
  const statusColor = label.status === 'shipped' ? chalk.green : chalk.yellow;

  const lines: string[] = [];
  lines.push(chalk.gray(`  ┌${'─'.repeat(44)}┐`));
  lines.push(chalk.gray('  │') + chalk.bold(` 【${companyName}】 ${label.trackingNumber} `) + statusColor(`[${statusInfo.label}]`) + chalk.gray('│'));
  lines.push(chalk.gray(`  ├${'─'.repeat(44)}┤`));
  lines.push(chalk.gray('  │') + chalk.green(` 寄: ${label.sender.name} ${label.sender.phone}`) + chalk.gray('│'));
  lines.push(chalk.gray('  │') + chalk.red(` 收: ${label.receiver.name} ${label.receiver.phone}`) + chalk.gray('│'));
  lines.push(chalk.gray(`  └${'─'.repeat(44)}┘`));

  return lines.join('\n');
}
