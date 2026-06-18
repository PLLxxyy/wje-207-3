import inquirer from 'inquirer';
import chalk from 'chalk';
import { Address, Label, EXPRESS_COMPANIES, ShippingStatus, SHIPPING_STATUS } from '../types';
import { generateId, generateTrackingNumber, saveBatch } from '../utils/storage';
import { renderLabel } from '../utils/renderer';
import { exportHtml } from '../utils/exporter';

async function promptAddress(role: string): Promise<Address> {
  console.log(chalk.cyan(`\n请输入${role}信息:`));
  const answers = await inquirer.prompt([
    { type: 'input', name: 'name', message: `${role}姓名:`, validate: v => v.trim() ? true : '请输入姓名' },
    { type: 'input', name: 'phone', message: `${role}电话:`, validate: v => /^1\d{10}$/.test(v.trim()) ? true : '请输入有效的11位手机号' },
    { type: 'input', name: 'province', message: '省份:', validate: v => v.trim() ? true : '请输入省份' },
    { type: 'input', name: 'city', message: '城市:', validate: v => v.trim() ? true : '请输入城市' },
    { type: 'input', name: 'district', message: '区/县:', validate: v => v.trim() ? true : '请输入区/县' },
    { type: 'input', name: 'detail', message: '详细地址:', validate: v => v.trim() ? true : '请输入详细地址' },
  ]);
  return {
    name: answers.name.trim(),
    phone: answers.phone.trim(),
    province: answers.province.trim(),
    city: answers.city.trim(),
    district: answers.district.trim(),
    detail: answers.detail.trim(),
  };
}

export async function generateCommand(): Promise<void> {
  console.log(chalk.bold.magenta('\n========================================'));
  console.log(chalk.bold.magenta('       快递面单生成工具'));
  console.log(chalk.bold.magenta('========================================\n'));

  const { expressCompany } = await inquirer.prompt([
    {
      type: 'list',
      name: 'expressCompany',
      message: '请选择快递公司:',
      choices: EXPRESS_COMPANIES.map(c => ({
        name: `${c.name} (${c.code})`,
        value: c.code,
      })),
    },
  ]);

  const sender = await promptAddress('发件人');
  const receiver = await promptAddress('收件人');

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

  const label: Label = {
    id: generateId(),
    expressCompany,
    sender,
    receiver,
    createdAt: dateStr,
    trackingNumber: generateTrackingNumber(expressCompany),
    status: initialStatus,
    shippedAt: initialStatus === 'shipped' ? dateStr : undefined,
  };

  console.log(chalk.bold.yellow('\n========== 面单预览 ==========\n'));
  console.log(renderLabel(label));
  console.log('');

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
      labels: [label],
      createdAt: dateStr,
      batchId: generateId(),
    });
    console.log(chalk.green('\n面单已保存到历史记录!'));
  }

  if (action === 'export' || action === 'both') {
    const filePath = exportHtml([label]);
    console.log(chalk.green(`\nHTML文件已导出: ${filePath}`));
    console.log(chalk.gray('请在浏览器中打开该文件，按 Ctrl+P 打印'));
  }

  if (action === 'discard') {
    console.log(chalk.gray('\n已放弃，面单未保存。'));
  }
}
