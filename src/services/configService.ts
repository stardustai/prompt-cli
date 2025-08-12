import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import * as dotenv from 'dotenv';
import { OSSConfig, PlatformConfig, CachedConfig } from '../types/serviceTypes';

/**
 * 配置管理服务
 * 负责处理全局配置文件的读写、缓存管理等功能
 */
export class ConfigService {
  private static readonly CONFIG_DIR_NAME = '.config/prompt-cli';
  private static readonly CACHE_FILE_NAME = 'cache.json';
  private static readonly ENV_FILE_NAME = '.env';

  /**
   * 获取全局配置目录路径
   */
  static getGlobalConfigDir(): string {
    const homeDir = os.homedir();

    // Windows 使用 AppData，其他系统使用 .config
    if (process.platform === 'win32') {
      const appDataDir = process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming');
      return path.join(appDataDir, 'prompt-cli');
    } else {
      return path.join(homeDir, this.CONFIG_DIR_NAME);
    }
  }

  /**
   * 获取全局缓存文件路径
   */
  static getGlobalCachePath(): string {
    return path.join(this.getGlobalConfigDir(), this.CACHE_FILE_NAME);
  }

  /**
   * 获取全局.env文件路径
   */
  static getGlobalEnvPath(): string {
    return path.join(this.getGlobalConfigDir(), this.ENV_FILE_NAME);
  }

  /**
   * 获取缓存配置
   */
  static async getCachedConfig(): Promise<CachedConfig> {
    const cachePath = this.getGlobalCachePath();
    try {
      if (await fs.pathExists(cachePath)) {
        const cacheContent = await fs.readFile(cachePath, 'utf-8');
        return JSON.parse(cacheContent);
      }
    } catch (error) {
      // 忽略缓存读取错误
    }
    return {};
  }

  /**
   * 保存缓存配置
   */
  static async saveCachedConfig(config: Partial<CachedConfig>): Promise<void> {
    const cachePath = this.getGlobalCachePath();
    try {
      // 确保目录存在
      await fs.ensureDir(path.dirname(cachePath));

      let existingCache = {};
      if (await fs.pathExists(cachePath)) {
        const cacheContent = await fs.readFile(cachePath, 'utf-8');
        existingCache = JSON.parse(cacheContent);
      }
      const updatedCache = { ...existingCache, ...config };
      await fs.writeFile(cachePath, JSON.stringify(updatedCache, null, 2));
    } catch (error) {
      // 忽略缓存保存错误
    }
  }

  /**
   * 加载全局环境变量
   */
  static loadGlobalEnv(): void {
    const globalEnvPath = this.getGlobalEnvPath();
    dotenv.config({ path: globalEnvPath });
  }

  /**
   * 保存OSS配置到.env文件
   */
  static async saveOSSConfigToEnv(config: OSSConfig): Promise<void> {
    const envPath = this.getGlobalEnvPath();

    // 确保全局配置目录存在
    await fs.ensureDir(this.getGlobalConfigDir());

    let envContent = '';

    // 如果全局.env文件存在，读取现有内容
    if (await fs.pathExists(envPath)) {
      envContent = await fs.readFile(envPath, 'utf-8');
    }

    // 更新或添加OSS配置
    const configs = [
      `OSS_ACCESS_KEY_ID=${config.accessKeyId}`,
      `OSS_ACCESS_KEY_SECRET=${config.accessKeySecret}`,
      `OSS_ENDPOINT=${config.endpoint}`
    ];

    for (const configLine of configs) {
      const [key] = configLine.split('=');
      const regex = new RegExp(`^${key}=.*$`, 'm');

      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, configLine);
      } else {
        envContent += (envContent ? '\n' : '') + configLine;
      }
    }

    await fs.writeFile(envPath, envContent);
  }

  /**
   * 保存平台配置到.env文件
   */
  static async savePlatformConfigToEnv(config: Partial<PlatformConfig>): Promise<void> {
    const envPath = this.getGlobalEnvPath();

    // 确保全局配置目录存在
    await fs.ensureDir(this.getGlobalConfigDir());

    let envContent = '';

    // 如果全局.env文件存在，读取现有内容
    if (await fs.pathExists(envPath)) {
      envContent = await fs.readFile(envPath, 'utf-8');
    }

    // 更新或添加平台配置
    const configs = [
      config.username && `PLATFORM_USERNAME=${config.username}`,
      config.password && `PLATFORM_PASSWORD=${config.password}`
    ].filter(Boolean) as string[];

    for (const configLine of configs) {
      const [key] = configLine.split('=');
      const regex = new RegExp(`^${key}=.*$`, 'm');

      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, configLine);
      } else {
        envContent += (envContent ? '\n' : '') + configLine;
      }
    }

    await fs.writeFile(envPath, envContent);
  }

  /**
   * 获取OSS配置
   */
  static getOSSConfigFromEnv(): Partial<OSSConfig> {
    return {
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      endpoint: process.env.OSS_ENDPOINT
    };
  }

  /**
   * 获取平台配置
   */
  static getPlatformConfigFromEnv(): Partial<PlatformConfig> {
    return {
      username: process.env.PLATFORM_USERNAME,
      password: process.env.PLATFORM_PASSWORD
    };
  }

  /**
   * 清空所有缓存配置
   */
  static async clearAllCache(): Promise<void> {
    const cachePath = this.getGlobalCachePath();
    const envPath = this.getGlobalEnvPath();

    try {
      // 删除缓存文件
      if (await fs.pathExists(cachePath)) {
        await fs.remove(cachePath);
      }

      // 删除全局.env文件
      if (await fs.pathExists(envPath)) {
        await fs.remove(envPath);
      }
    } catch (error) {
      throw new Error(`清空配置缓存失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
