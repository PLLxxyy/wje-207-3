import inquirer from 'inquirer';
import chalk from 'chalk';
import { loadHistory, clearHistory, updateLabelStatus } from '../utils/storage';
import { renderLabel, renderSmallLabel } from '../utils/renderer';
import { exportHtml } from '../utils/exporter';
import { SHIPPING_STATUS, ShippingStatus } from '../types';

export async function historyCommand(): Promise<void> {
  console.log(chalk.bold.magenta('\n========================================'));
  console.log(chalk.bold.magenta('       历史记录'));
  console.log(chalk.bold.magenta('========================================\n'));

  const batches = loadHistory();

  if (batches.length === 0) {
    console.log(chalk.yellow('\n暂无历史记录。'));
    console.log(chalk.gray('使用 "生成面单" 或 "批量导入" 来创建面单。\n'));
    return;
  }

  const totalLabels = batches.reduce((sum, b) => sum + b.labels.length, 0);
  console.log(chalk.cyan(`共 ${batches.length} 个批次，${totalLabels} 张面单\n`));

  // Build choice list
  const choices: Array<{ name: string; value: string }> = [];
  batches.forEach((batch, bIdx) => {
    batch.labels.forEach((label, lIdx) => {
      const company = label.expressCompany;
      const statusInfo = SHIPPING_STATUS[label.status];
      const statusColor = label.status === 'shipped' ? chalk.green : chalk.yellow;
      choices.push({
        name: `${statusColor(`[${statusInfo.label}]`)} [${label.createdAt}] ${company} - ${label.sender.name} -> ${label.receiver.name} (${label.trackingNumber})`,
        value: `${bIdx}-${lIdx}`,
      });
    });
  });

  choices.push({ name: chalk.gray('--- 导出全部为HTML ---'), value: 'export-all' });
  choices.push({ name: chalk.gray('--- 清空历史记录 ---'), value: 'clear' });
  choices.push({ name: chalk.red('返回'), value: 'back' });

  const { selected } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selected',
      message: '请选择要查看的面单:',
      choices,
      pageSize: 15,
    },
  ]);

  if (selected === 'back') {
    return;
  }

  if (selected === 'clear') {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '确定要清空所有历史记录吗？此操作不可恢复。',
        default: false,
      },
    ]);
    if (confirm) {
      clearHistory();
      console.log(chalk.green('\n历史记录已清空。'));
    } else {
      console.log(chalk.gray('\n已取消。'));
    }
    return;
  }

  if (selected === 'export-all') {
    const allLabels = batches.flatMap(b => b.labels);
    const filePath = exportHtml(allLabels);
    console.log(chalk.green(`\n已导出 ${allLabels.length} 张面单到: ${filePath}`));
    console.log(chalk.gray('请在浏览器中打开该文件，按 Ctrl+P 打印'));
    return;
  }

  // Show specific label
  const [bIdx, lIdx] = selected.split('-').map(Number);
  const label = batches[bIdx].labels[lIdx];
  const currentStatus = label.status;

  console.log(chalk.bold.yellow('\n========== 面单详情 ==========\n'));
  console.log(renderLabel(label));

  const otherStatus: ShippingStatus = currentStatus === 'pending' ? 'shipped' : 'pending';
  const otherStatusLabel = SHIPPING_STATUS[otherStatus].label;

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '操作:',
      choices: [
        { name: `标记为「${otherStatusLabel}」`, value: 'toggle-status' },
        { name: '导出此面单为HTML', value: 'export' },
        { name: '返回', value: 'back' },
      ],
    },
  ]);

  if (action === 'toggle-status') {
    const ok = updateLabelStatus(label.id, otherStatus);
    if (ok) {
      console.log(chalk.green(`\n状态已更新为「${SHIPPING_STATUS[otherStatus].label}」`));
    } else {
      console.log(chalk.red('\n更新状态失败，请稍后重试。'));
    }
    return;
  }

  if (action === 'export') {
    const filePath = exportHtml([label]);
    console.log(chalk.green(`\nHTML文件已导出: ${filePath}`));
    console.log(chalk.gray('请在浏览器中打开该文件，按 Ctrl+P 打印'));
  }
}
