#!/usr/bin/env node

import { Command } from 'commander';
import { initProject } from './commands/init';
import { generateCommand } from './commands/generate';
import { configClearCommand } from './commands/config';
import { checkUpdateCommand, autoCheckUpdate } from './commands/update';

const program = new Command();

// 在程序启动时自动检查更新
autoCheckUpdate().catch(() => {
  // 静默忽略自动检查更新的错误
});

program
  .name('prompt')
  .description('A TypeScript-based command line tool')
  .version('1.0.0');

// init 命令
program
  .command('init [directory]')
  .description('初始化项目：检查并创建 Git 仓库、Python 虚拟环境，并安装依赖')
  .action(async (directory) => {
    await initProject(directory || process.cwd());
  });

// generate 命令
program
  .command('generate [directory]')
  .description('生成任务prompt：根据选择的任务类型生成相应的prompt文件')
  .action(async (directory) => {
    await generateCommand(directory || process.cwd());
  });

// config 命令
const configCommand = program
  .command('config')
  .description('配置管理命令');

configCommand
  .command('clear')
  .description('清空所有已缓存的配置')
  .action(async () => {
    await configClearCommand();
  });

// update 命令
program
  .command('update')
  .description('检查并显示可用的更新')
  .action(async () => {
    await checkUpdateCommand();
  });

program.parse(process.argv);
