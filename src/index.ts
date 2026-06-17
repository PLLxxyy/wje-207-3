#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { generateCommand } from './commands/generate';
import { batchCommand } from './commands/batch';
import { historyCommand } from './commands/history';

const program = new Command();

program
  .name('wje-207')
  .description('快递面单打印工具 - 命令行快递面单生成与管理')
  .version('1.0.0');

program
  .command('generate')
  .alias('g')
  .description('交互式生成快递面单')
  .action(async () => {
    try {
      await generateCommand();
    } catch (err: any) {
      if (err.name === 'ExitPromptError') {
        console.log(chalk.gray('\n已取消。'));
      } else {
        console.error(chalk.red(`\n错误: ${err.message}`));
      }
    }
  });

program
  .command('batch <file>')
  .alias('b')
  .description('从JSON文件批量导入面单')
  .action(async (file: string) => {
    try {
      await batchCommand(file);
    } catch (err: any) {
      if (err.name === 'ExitPromptError') {
        console.log(chalk.gray('\n已取消。'));
      } else {
        console.error(chalk.red(`\n错误: ${err.message}`));
      }
    }
  });

program
  .command('history')
  .alias('h')
  .description('查看历史面单记录')
  .action(async () => {
    try {
      await historyCommand();
    } catch (err: any) {
      if (err.name === 'ExitPromptError') {
        console.log(chalk.gray('\n已取消。'));
      } else {
        console.error(chalk.red(`\n错误: ${err.message}`));
      }
    }
  });

// Interactive main menu
async function mainMenu(): Promise<void> {
  console.log(chalk.bold.cyan('\n╔══════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║       快递面单打印工具 v1.0.0        ║'));
  console.log(chalk.bold.cyan('╚══════════════════════════════════════╝\n'));

  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '请选择功能:',
        choices: [
          { name: '生成快递面单', value: 'generate' },
          { name: '批量导入面单（从JSON文件）', value: 'batch' },
          { name: '查看历史记录', value: 'history' },
          { name: '退出程序', value: 'exit' },
        ],
      },
    ]);

    try {
      switch (action) {
        case 'generate':
          await generateCommand();
          break;
        case 'batch': {
          const { filePath } = await inquirer.prompt([
            {
              type: 'input',
              name: 'filePath',
              message: '请输入JSON文件路径:',
              default: 'data/sample.json',
            },
          ]);
          await batchCommand(filePath);
          break;
        }
        case 'history':
          await historyCommand();
          break;
        case 'exit':
          console.log(chalk.cyan('\n感谢使用，再见!\n'));
          process.exit(0);
      }
    } catch (err: any) {
      if (err.name === 'ExitPromptError') {
        console.log(chalk.gray('\n已取消。'));
      } else {
        console.error(chalk.red(`\n错误: ${err.message}`));
      }
    }

    console.log(''); // blank line between operations
  }
}

// If no subcommand given, show interactive menu
const args = process.argv.slice(2);
if (args.length === 0) {
  mainMenu().catch((err) => {
    if (err.name !== 'ExitPromptError') {
      console.error(chalk.red(`\n程序错误: ${err.message}`));
    }
    process.exit(0);
  });
} else {
  program.parse();
}
