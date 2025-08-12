import { execSync } from 'child_process';
import chalk from 'chalk';

/**
 * 查找兼容的 Python 版本（3.8-3.11）
 * @returns Python 命令字符串
 */
export async function findCompatiblePython(): Promise<string> {
  // 根据平台设置不同的命令列表
  const isWindows = process.platform === 'win32';
  const pythonCommands = isWindows
    ? ['python', 'python3', 'py -3.11', 'py -3.10', 'py -3.9', 'py -3.8', 'py']
    : ['python3.11', 'python3.10', 'python3.9', 'python3.8', 'python3', 'python'];

  for (const command of pythonCommands) {
    try {
      const version = execSync(`${command} --version`, {
        stdio: 'pipe',
        windowsHide: true
      }).toString().trim();
      const versionMatch = version.match(/Python (\d+\.\d+\.\d+)/);

      if (versionMatch) {
        const [major, minor] = versionMatch[1].split('.').map(Number);

        if (major === 3 && minor >= 8 && minor < 12) {
          console.log(chalk.green(`✅ 找到兼容的 Python: ${command} (${versionMatch[1]})`));
          return command;
        }
      }
    } catch (error) {
      // 忽略错误，继续尝试下一个命令
    }
  }

  // 如果没有找到兼容版本，尝试自动安装
  return await attemptPythonInstallation();
}

/**
 * 尝试自动安装 Python
 * @returns Python 命令字符串
 */
async function attemptPythonInstallation(): Promise<string> {
  console.log(chalk.yellow('⚠️  未找到兼容的 Python 版本 (需要 Python 3.8-3.11)'));

  const platform = process.platform;

  if (platform === 'darwin') {
    // macOS
    return await installPythonOnMacOS();
  } else if (platform === 'linux') {
    // Linux
    return await installPythonOnLinux();
  } else if (platform === 'win32') {
    // Windows
    return await installPythonOnWindows();
  } else {
    // 其他平台
    throw new Error(`
请手动安装 Python 3.8-3.11 版本:

Windows:
  访问 https://www.python.org/downloads/ 下载并安装 Python 3.11
  或使用 winget: winget install Python.Python.3.11

macOS:
  brew install python@3.11

Linux (Ubuntu/Debian):
  sudo apt update && sudo apt install python3.11 python3.11-venv

安装完成后请重新运行此命令。
    `);
  }
}

/**
 * 在 macOS 上安装 Python
 * @returns Python 命令字符串
 */
async function installPythonOnMacOS(): Promise<string> {
  console.log(chalk.blue('🍺 尝试使用 Homebrew 安装 Python 3.11...'));

  try {
    // 检查是否已安装 Homebrew
    execSync('which brew', { stdio: 'pipe' });
  } catch {
    throw new Error(`
需要先安装 Homebrew:
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

然后安装 Python:
  brew install python@3.11

或者访问 https://www.python.org/downloads/ 手动下载安装 Python 3.11
    `);
  }

  try {
    console.log(chalk.blue('正在安装 Python 3.11...'));
    execSync('brew install python@3.11', { stdio: 'inherit' });

    // 验证安装
    const version = execSync('python3.11 --version', { stdio: 'pipe' }).toString().trim();
    console.log(chalk.green(`✅ Python 3.11 安装成功: ${version}`));

    return 'python3.11';
  } catch (error) {
    throw new Error(`
Homebrew 安装 Python 失败。请手动安装:
  brew install python@3.11

或访问 https://www.python.org/downloads/ 下载安装包

错误信息: ${error}
    `);
  }
}

/**
 * 在 Linux 上安装 Python
 * @returns Python 命令字符串
 */
async function installPythonOnLinux(): Promise<string> {
  console.log(chalk.blue('🐧 尝试安装 Python 3.11...'));

  try {
    // 尝试使用 apt (Ubuntu/Debian)
    try {
      execSync('which apt', { stdio: 'pipe' });
      console.log(chalk.blue('使用 apt 安装 Python 3.11...'));
      execSync('sudo apt update && sudo apt install -y python3.11 python3.11-venv', { stdio: 'inherit' });

      const version = execSync('python3.11 --version', { stdio: 'pipe' }).toString().trim();
      console.log(chalk.green(`✅ Python 3.11 安装成功: ${version}`));
      return 'python3.11';
    } catch {
      // 尝试使用 yum (CentOS/RHEL)
      try {
        execSync('which yum', { stdio: 'pipe' });
        console.log(chalk.blue('使用 yum 安装 Python 3.11...'));
        execSync('sudo yum install -y python3.11', { stdio: 'inherit' });

        const version = execSync('python3.11 --version', { stdio: 'pipe' }).toString().trim();
        console.log(chalk.green(`✅ Python 3.11 安装成功: ${version}`));
        return 'python3.11';
      } catch {
        throw new Error('未支持的包管理器');
      }
    }
  } catch (error) {
    throw new Error(`
自动安装失败，请手动安装 Python 3.11:

Ubuntu/Debian:
  sudo apt update
  sudo apt install python3.11 python3.11-venv

CentOS/RHEL:
  sudo yum install python3.11

或使用 pyenv:
  curl https://pyenv.run | bash
  pyenv install 3.11.7
  pyenv global 3.11.7

错误信息: ${error}
    `);
  }
}

/**
 * 在 Windows 上安装 Python
 * @returns Python 命令字符串
 */
async function installPythonOnWindows(): Promise<string> {
  console.log(chalk.blue('🪟 尝试在 Windows 上安装 Python 3.11...'));

  try {
    // 首先尝试使用 winget
    try {
      execSync('winget --version', { stdio: 'pipe', windowsHide: true });
      console.log(chalk.blue('使用 winget 安装 Python 3.11...'));
      execSync('winget install Python.Python.3.11 --accept-source-agreements --accept-package-agreements', {
        stdio: 'inherit',
        windowsHide: true
      });

      // 验证安装
      const version = execSync('python --version', { stdio: 'pipe', windowsHide: true }).toString().trim();
      console.log(chalk.green(`✅ Python 3.11 安装成功: ${version}`));
      return 'python';
    } catch (wingetError) {
      // 如果 winget 不可用，提供手动安装指导
      throw new Error(`
winget 不可用，请手动安装 Python 3.11:

方法1 - 使用 Microsoft Store:
  1. 打开 Microsoft Store
  2. 搜索 "Python 3.11"
  3. 点击安装

方法2 - 从官网下载:
  1. 访问 https://www.python.org/downloads/windows/
  2. 下载 Python 3.11.x 安装包
  3. 运行安装程序，确保勾选 "Add Python to PATH"

方法3 - 使用 Chocolatey (如果已安装):
  choco install python311

安装完成后请重新运行此命令。

错误信息: ${wingetError}
      `);
    }
  } catch (error) {
    throw error;
  }
}
