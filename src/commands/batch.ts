import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { Address, Label, EXPRESS_COMPANIES, ShippingStatus, SHIPPING_STATUS } from '../types';
import { generateId, generateTrackingNumber, saveBatch } from '../utils/storage';
import { renderLabel, renderSmallLabel } from '../utils/renderer';
import { exportHtml } from '../utils/exporter';

interface BatchItem {
  expressCompany?: string;
  sender: Address;
  receiver: Address;
}

function validateBatchItem(item: any, index: number): string[] {
  const errors: string[] = [];
  const prefix = `第 ${index + 1} 条`;

  if (!item.sender || typeof item.sender !== 'object') {
    errors.push(`${prefix}: 缺少发件人信息 (sender)`);
  } else {
    if (!item.sender.name) errors.push(`${prefix}: 发件人姓名为空`);
    if (!item.sender.phone) errors.push(`${prefix}: 发件人电话为空`);
    if (!item.sender.province) errors.push(`${prefix}: 发件人省份为空`);
    if (!item.sender.city) errors.push(`${prefix}: 发件人城市为空`);
    if (!item.sender.detail) errors.push(`${prefix}: 发件人详细地址为空`);
  }

  if (!item.receiver || typeof item.receiver !== 'object') {
    errors.push(`${prefix}: 缺少收件人信息 (receiver)`);
  } else {
    if (!item.receiver.name) errors.push(`${prefix}: 收件人姓名为空`);
    if (!item.receiver.phone) errors.push(`${prefix}: 收件人电话为空`);
    if (!item.receiver.province) errors.push(`${prefix}: 收件人省份为空`);
    if (!item.receiver.city) errors.push(`${prefix}: 收件人城市为空`);
    if (!item.receiver.detail) errors.push(`${prefix}: 收件人详细地址为空`);
  }

  if (item.expressCompany) {
    const valid = EXPRESS_COMPANIES.some(c => c.code === item.expressCompany);
    if (!valid) errors.push(`${prefix}: 快递公司代码 "${item.expressCompany}" 无效`);
  }

  return errors;
}

export async function batchCommand(filePath: string): Promise<void> {
  console.log(chalk.bold.magenta('\n========================================'));
  console.log(chalk.bold.magenta('       批量导入面单'));
  console.log(chalk.bold.magenta('========================================\n'));

  // Resolve file path
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.log(chalk.red(`\n错误: 文件不存在 - ${resolvedPath}`));
    console.log(chalk.gray('\n示例 JSON 格式:'));
    console.log(chalk.gray(JSON.stringify([
      {
        expressCompany: 'SF',
        sender: { name: '张三', phone: '13800001111', province: '广东省', city: '深圳市', district: '南山区', detail: '科技园路1号' },
        receiver: { name: '李四', phone: '13900002222', province: '北京市', city: '北京市', district: '海淀区', detail: '中关村大街1号' },
      }
    ], null, 2)));
    return;
  }

  // Read and parse file
  let items: BatchItem[];
  try {
    const raw = fs.readFileSync(resolvedPath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.log(chalk.red('\n错误: JSON 文件内容必须是数组格式'));
      return;
    }
    items = parsed;
  } catch {
    console.log(chalk.red('\n错误: JSON 文件格式不正确'));
    return;
  }

  if (items.length === 0) {
    console.log(chalk.yellow('\n文件为空，没有需要处理的数据'));
    return;
  }

  console.log(chalk.cyan(`读取到 ${items.length} 条地址信息\n`));

  // Validate
  const allErrors: string[] = [];
  items.forEach((item, i) => {
    allErrors.push(...validateBatchItem(item, i));
  });

  if (allErrors.length > 0) {
    console.log(chalk.red('数据验证失败:\n'));
    allErrors.forEach(e => console.log(chalk.red(`  - ${e}`)));
    return;
  }

  // Ask for default express company if not specified
  let defaultCompany = 'SF';
  const hasEmptyCompany = items.some(i => !i.expressCompany);
  if (hasEmptyCompany) {
    const { company } = await inquirer.prompt([
      {
        type: 'list',
        name: 'company',
        message: '部分条目未指定快递公司，请选择默认快递公司:',
        choices: EXPRESS_COMPANIES.map(c => ({
          name: `${c.name} (${c.code})`,
          value: c.code,
        })),
      },
    ]);
    defaultCompany = company;
  }

  // Generate labels
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const { initialStatus } = await inquirer.prompt([
    {
      type: 'list',
      name: 'initialStatus',
      message: '请选择初始发货状态:',
      choices: [
        { name: SHIPPING_STATUS.pending.label, value: 'pending' as ShippingStatus },
        { name: SHIPPING_STATUS.shipped.label, value: 'shipped' as ShippingStatus },
      ],
    },
  ]);

  const labels: Label[] = items.map(item => ({
    id: generateId(),
    expressCompany: item.expressCompany || defaultCompany,
    sender: {
      name: item.sender.name,
      phone: item.sender.phone,
      province: item.sender.province,
      city: item.sender.city,
      district: item.sender.district || '',
      detail: item.sender.detail,
    },
    receiver: {
      name: item.receiver.name,
      phone: item.receiver.phone,
      province: item.receiver.province,
      city: item.receiver.city,
      district: item.receiver.district || '',
      detail: item.receiver.detail,
    },
    createdAt: dateStr,
    trackingNumber: generateTrackingNumber(item.expressCompany || defaultCompany),
    status: initialStatus,
    shippedAt: initialStatus === 'shipped' ? dateStr : undefined,
  }));

  // Show preview
  console.log(chalk.bold.yellow(`\n========== 面单预览 (共 ${labels.length} 张) ==========\n`));

  if (labels.length <= 3) {
    labels.forEach(label => {
      console.log(renderLabel(label));
      console.log('');
    });
  } else {
    labels.forEach(label => {
      console.log(renderSmallLabel(label));
      console.log('');
    });
    console.log(chalk.gray(`(共 ${labels.length} 张面单，以上为简略预览，导出HTML可查看完整面单)`));
  }

  // Ask for action
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '请选择操作:',
      choices: [
        { name: '保存到历史记录', value: 'save' },
        { name: '导出为HTML文件（可浏览器打印）', value: 'export' },
        { name: '保存并导出HTML', value: 'both' },
        { name: '放弃', value: 'discard' },
      ],
    },
  ]);

  if (action === 'save' || action === 'both') {
    saveBatch({
      labels,
      createdAt: dateStr,
      batchId: generateId(),
    });
    console.log(chalk.green(`\n${labels.length} 张面单已保存到历史记录!`));
  }

  if (action === 'export' || action === 'both') {
    const outPath = exportHtml(labels);
    console.log(chalk.green(`\nHTML文件已导出: ${outPath}`));
    console.log(chalk.gray('请在浏览器中打开该文件，按 Ctrl+P 打印'));
  }

  if (action === 'discard') {
    console.log(chalk.gray('\n已放弃，面单未保存。'));
  }
}
