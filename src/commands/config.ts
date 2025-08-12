import { ConfigService } from '../services/configService';

/**
 * 配置管理命令
 */
export class ConfigCommand {
  /**
   * 清空所有配置缓存
   */
  static async clear(): Promise<void> {
    try {
      console.log('正在清空配置缓存...');
      await ConfigService.clearAllCache();
      console.log('✅ 所有配置缓存已成功清空');
    } catch (error) {
      console.error('❌ 清空配置缓存失败:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }
}

/**
 * 执行配置清空命令
 */
export async function configClearCommand(): Promise<void> {
  await ConfigCommand.clear();
}
