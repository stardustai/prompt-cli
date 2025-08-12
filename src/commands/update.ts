import chalk from 'chalk';
import { UpdateService } from '../services/updateService';
import { packageInfo } from '../utils/packageInfo';

/**
 * 检查更新命令
 */
export async function checkUpdateCommand(): Promise<void> {
  console.log(chalk.blue('🔍 检查更新中...'));

  try {
    const updateInfo = await UpdateService.checkForUpdates();

    if (updateInfo.hasUpdate) {
      console.log(chalk.green('🎉 发现新版本！'));
      console.log(chalk.gray(`当前版本: ${updateInfo.currentVersion}`));
      console.log(chalk.green(`最新版本: ${updateInfo.latestVersion}`));

      if (updateInfo.releaseNotes) {
        console.log(chalk.yellow('\n📝 更新说明:'));
        console.log(updateInfo.releaseNotes);
      }

      console.log(chalk.blue('\n📦 更新命令:'));
      console.log(chalk.cyan(`npm install -g ${packageInfo.name}@latest`));
    } else {
      console.log(chalk.green('✅ 已是最新版本！'));
      console.log(chalk.gray(`当前版本: ${updateInfo.currentVersion}`));
    }
  } catch (error) {
    console.error(chalk.red('❌ 检查更新失败:'), error instanceof Error ? error.message : error);
  }
}

/**
 * 自动检查更新（静默模式）
 */
export async function autoCheckUpdate(): Promise<void> {
  try {
    const shouldCheck = await UpdateService.shouldCheckForUpdates();

    if (shouldCheck) {
      const updateInfo = await UpdateService.checkForUpdates();

      // 只在有更新时显示提示
      if (updateInfo.hasUpdate) {
        console.log(chalk.yellow(`\n💡 发现新版本 ${updateInfo.latestVersion}（当前: ${updateInfo.currentVersion}）`));
        console.log(chalk.gray(`   运行 'prompt update' 查看详情`));
      }

      // 更新最后检查时间
      await UpdateService.updateLastCheckTime();
    }
  } catch (error) {
    // 静默忽略自动检查更新的错误
  }
}
