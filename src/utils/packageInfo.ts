import * as fs from 'fs-extra';
import * as path from 'path';

export interface PackageInfo {
  name: string;
  version: string;
  description?: string;
  author?: string;
}

/**
 * 获取包信息
 */
export const packageInfo: PackageInfo = (() => {
  try {
    // 查找 package.json 文件
    let currentDir = __dirname;
    let packagePath: string | null = null;

    // 从当前目录往上查找 package.json
    while (currentDir !== path.dirname(currentDir)) {
      const testPath = path.join(currentDir, 'package.json');
      if (fs.existsSync(testPath)) {
        packagePath = testPath;
        break;
      }
      currentDir = path.dirname(currentDir);
    }

    // 如果没找到，尝试从项目根目录
    if (!packagePath) {
      const testPath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(testPath)) {
        packagePath = testPath;
      }
    }

    if (packagePath && fs.existsSync(packagePath)) {
      const packageContent = fs.readFileSync(packagePath, 'utf-8');
      return JSON.parse(packageContent);
    }

    // 如果都找不到，返回默认值
    return {
      name: '@stardustai/prompt-cli',
      version: '1.0.0'
    };
  } catch (error) {
    // 出错时返回默认值
    return {
      name: '@stardustai/prompt-cli',
      version: '1.0.0'
    };
  }
})();
