import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { readTemplate } from '../utils/templateUtils';
import { findCompatiblePython } from '../utils/pythonUtils';

export async function initProject(targetDir: string = process.cwd()) {
  console.log(chalk.blue('🚀 开始初始化项目...'));
  console.log(chalk.gray(`目标目录: ${targetDir}`));

  try {
    // 确保目标目录存在
    await fs.ensureDir(targetDir);

    // 检查并初始化 Git 仓库
    await initializeGit(targetDir);

    // 检查并初始化 Python 虚拟环境
    await initializePythonVenv(targetDir);

    // 创建 requirements.txt
    await createRequirementsTxt(targetDir);

    // 在虚拟环境中安装 Python 依赖
    await installPythonDependencies(targetDir);

    console.log(chalk.green('✅ 项目初始化完成！'));
  } catch (error) {
    console.error(chalk.red('❌ 初始化过程中出现错误:'), error);
    process.exit(1);
  }
}

async function initializeGit(targetDir: string) {
  const gitDir = path.join(targetDir, '.git');

  if (await fs.pathExists(gitDir)) {
    console.log(chalk.yellow('📁 Git 仓库已存在，跳过初始化'));
    return;
  }

  try {
    // 先检查 Git 是否可用
    execSync('git --version', {
      stdio: 'pipe',
      windowsHide: true
    });
  } catch (error) {
    // Git 不可用时跳过初始化
    console.log(chalk.yellow('⚠️  Git 未安装或不在 PATH 中，跳过 Git 仓库初始化'));
    console.log(chalk.gray('   如需版本控制，请安装 Git:'));
    console.log(chalk.gray('   Windows: https://git-scm.com/download/win'));
    console.log(chalk.gray('   macOS: brew install git'));
    console.log(chalk.gray('   Linux: sudo apt install git'));
    return;
  }

  try {
    console.log(chalk.blue('📁 初始化 Git 仓库...'));
    execSync('git init', {
      cwd: targetDir,
      stdio: 'pipe',
      windowsHide: true
    });
    console.log(chalk.green('✅ Git 仓库初始化完成'));

    // 创建 .gitignore 文件（如果不存在）
    const gitignorePath = path.join(targetDir, '.gitignore');
    if (!(await fs.pathExists(gitignorePath))) {
      const gitignoreContent = await readTemplate('gitignore.template');
      await fs.writeFile(gitignorePath, gitignoreContent);
      console.log(chalk.green('✅ .gitignore 文件已创建'));
    }
  } catch (error) {
    console.log(chalk.yellow('⚠️  Git 初始化失败，跳过 Git 仓库初始化'));
    console.log(chalk.gray(`   错误信息: ${error}`));
  }
}

async function initializePythonVenv(targetDir: string) {
  const venvDir = path.join(targetDir, '.venv');

  if (await fs.pathExists(venvDir)) {
    console.log(chalk.yellow('🐍 Python 虚拟环境已存在，跳过创建'));
    return;
  }

  try {
    console.log(chalk.blue('🐍 创建 Python 虚拟环境...'));

    // 寻找合适的 Python 版本
    const pythonCommand = await findCompatiblePython();

    // 创建虚拟环境
    execSync(`${pythonCommand} -m venv .venv`, {
      cwd: targetDir,
      stdio: 'inherit',
      windowsHide: true
    });

    // 验证虚拟环境是否成功创建
    const isWindows = process.platform === 'win32';
    const pipPath = isWindows
      ? path.join(venvDir, 'Scripts', 'pip.exe')
      : path.join(venvDir, 'bin', 'pip');

    if (!(await fs.pathExists(pipPath))) {
      throw new Error(`虚拟环境创建失败：pip 不存在于 ${pipPath}`);
    }

    console.log(chalk.green('✅ Python 虚拟环境创建完成'));
  } catch (error) {
    console.error(chalk.red('详细错误信息:'), error);
    throw new Error(`Python 虚拟环境创建失败: ${error}`);
  }
}

async function createRequirementsTxt(targetDir: string) {
  const requirementsPath = path.join(targetDir, 'requirements.txt');

  try {
    if (await fs.pathExists(requirementsPath)) {
      console.log(chalk.yellow('📄 requirements.txt 已存在，跳过创建'));
      return;
    }

    console.log(chalk.blue('📄 创建 requirements.txt...'));
    const requirements = await readTemplate('requirements.template');
    await fs.writeFile(requirementsPath, requirements);
    console.log(chalk.green('✅ requirements.txt 创建完成'));
  } catch (error) {
    throw new Error(`requirements.txt 创建失败: ${error}`);
  }
}

async function installPythonDependencies(targetDir: string) {
  const venvDir = path.join(targetDir, '.venv');
  const requirementsPath = path.join(targetDir, 'requirements.txt');

  if (!(await fs.pathExists(venvDir))) {
    throw new Error('虚拟环境不存在，无法安装依赖');
  }

  if (!(await fs.pathExists(requirementsPath))) {
    throw new Error('requirements.txt 不存在，无法安装依赖');
  }

  try {
    console.log(chalk.blue('📦 在虚拟环境中安装 Python 依赖...'));

    // 确定虚拟环境中的 pip 路径
    const isWindows = process.platform === 'win32';
    const pipPath = isWindows
      ? path.join(venvDir, 'Scripts', 'pip.exe')
      : path.join(venvDir, 'bin', 'pip');

    // 转换为绝对路径
    const absolutePipPath = path.resolve(pipPath);
    const absoluteTargetDir = path.resolve(targetDir);

    // 验证 pip 是否存在
    if (!(await fs.pathExists(absolutePipPath))) {
      throw new Error(`pip 不存在于虚拟环境中: ${absolutePipPath}`);
    }

    // 升级 pip（静默执行）
    const pipCommand = isWindows ? `"${absolutePipPath}"` : absolutePipPath;

    execSync(`${pipCommand} install --upgrade pip`, {
      cwd: absoluteTargetDir,
      stdio: 'pipe',
      windowsHide: true
    });

    // 安装依赖
    execSync(`${pipCommand} install -r requirements.txt`, {
      cwd: absoluteTargetDir,
      stdio: 'inherit',
      windowsHide: true
    });

    console.log(chalk.green('✅ Python 依赖安装完成'));
    console.log(chalk.cyan('💡 激活虚拟环境:'));
    if (isWindows) {
      console.log(chalk.cyan(`   ${absoluteTargetDir}\\.venv\\Scripts\\activate`));
    } else {
      console.log(chalk.cyan(`   source ${absoluteTargetDir}/.venv/bin/activate`));
    }
  } catch (error) {
    console.error(chalk.red('详细错误信息:'), error);
    throw new Error(`Python 依赖安装失败: ${error}`);
  }
}
