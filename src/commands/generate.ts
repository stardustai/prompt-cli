import chalk from 'chalk';
import * as fs from 'fs-extra';
import { OSSConfig, PlatformConfig } from '../types/serviceTypes';
import { ConfigService } from '../services/configService';
import { UserInteractionService } from '../utils/userInteraction';
import { OSSService } from '../services/ossService';
import { PlatformService } from '../services/platformService';
import { FileGeneratorService } from '../services/fileGeneratorService';

/**
 * 生成命令主入口
 */
export async function generateCommand(targetDir: string = process.cwd()) {
  console.log(chalk.blue('🎯 欢迎使用 Prompt 生成工具'));
  console.log(chalk.gray(`目标目录: ${targetDir}`));

  try {
    // 确保目标目录存在
    await fs.ensureDir(targetDir);

    // 1. 选择任务类型
    const taskType = await UserInteractionService.selectTaskType();

    if (taskType === 'data-import') {
      await handleDataImportTask(targetDir);
    } else if (taskType === 'data-export') {
      await handleDataExportTask(targetDir);
    }
  } catch (error) {
    console.error(chalk.red('❌ 生成过程中出现错误:'), error);
    process.exit(1);
  }
}

/**
 * 处理数据导入任务
 */
async function handleDataImportTask(targetDir: string) {
  console.log(chalk.yellow('📊 开始配置数据导入任务...'));

  // 1. 检查或获取OSS配置
  const ossConfig = await getOSSConfig();

  // 2. 选择附件类型
  const attachmentType = await UserInteractionService.selectAttachmentType();

  // 3. 询问是否需要导入预标注数据
  const includePreAnnotation = await UserInteractionService.askForPreAnnotationImport();

  // 4. 如果需要导入预标注数据，先获取平台配置
  let platformConfig: PlatformConfig | undefined;
  let operations: any[] | undefined;
  if (includePreAnnotation) {
    console.log(chalk.yellow('📋 开始配置预标注数据导入...'));
    
    // 获取平台信息配置
    platformConfig = await getPlatformConfig();
    
    // 检查平台token并获取操作项配置
    operations = await PlatformService.getProjectOperationsWithRetry(
      await PlatformService.checkAndGetToken(platformConfig.username, platformConfig.password),
      platformConfig.projectId,
      platformConfig.username,
      platformConfig.password
    );
  }

  // 5. 获取文件结构
  console.log(chalk.blue('🔍 正在分析OSS文件结构...'));
  const ossService = new OSSService(ossConfig);
  const fileStructure = await ossService.getFileStructure(ossConfig.path);

  // 6. 生成示例JSON文件
  await FileGeneratorService.generateExampleDataFile(attachmentType, targetDir);

  // 7. 生成prompt文件
  await FileGeneratorService.generateDataImportPromptFile(ossConfig, fileStructure, attachmentType, targetDir);

  // 8. 如果需要导入预标注数据，保存相关文件
  if (includePreAnnotation && operations) {
    // 保存操作项到文件
    await FileGeneratorService.saveOperationsToFile(operations, targetDir);
    
    // 生成result-prompt.md文件
    await FileGeneratorService.generateResultImportPromptFile(ossConfig, fileStructure, targetDir);
  }

  // 9. 生成本地 .env 文件并填入 OSS 配置
  await FileGeneratorService.generateLocalEnvFile(ossConfig, targetDir);
}

/**
 * 处理数据导出任务
 */
async function handleDataExportTask(targetDir: string) {
  console.log(chalk.yellow('📤 开始配置数据导出任务...'));

  // 1. 检查或获取OSS配置
  const ossConfig = await getOSSConfig();

  // 2. 选择附件类型
  const attachmentType = await UserInteractionService.selectAttachmentType();

  // 3. 获取文件结构
  console.log(chalk.blue('🔍 正在分析OSS文件结构...'));
  const ossService = new OSSService(ossConfig);
  const fileStructure = await ossService.getFileStructure(ossConfig.path);

  // 4. 生成示例JSON文件
  await FileGeneratorService.generateExampleDataFile(attachmentType, targetDir);

  // 5. 生成prompt文件
  await FileGeneratorService.generateDataExportPromptFile(ossConfig, fileStructure, attachmentType, targetDir);

  // 6. 生成本地 .env 文件并填入 OSS 配置
  await FileGeneratorService.generateLocalEnvFile(ossConfig, targetDir);
}



/**
 * 获取OSS配置
 */
async function getOSSConfig(): Promise<OSSConfig> {
  // 加载全局环境变量
  ConfigService.loadGlobalEnv();

  // 从环境变量获取基础配置
  const envConfig = ConfigService.getOSSConfigFromEnv();

  // 通过用户交互获取完整配置（不使用OSS URL缓存）
  const finalConfig = await UserInteractionService.getOSSConfigInput(
    envConfig
  ) as OSSConfig;

  // 保存OSS配置到.env文件（如果有新的配置）
  if (!envConfig.accessKeyId || !envConfig.accessKeySecret || !envConfig.endpoint) {
    await ConfigService.saveOSSConfigToEnv(finalConfig);
    console.log(chalk.green(`✅ OSS配置已保存到全局配置文件`));
  }

  return finalConfig;
}

/**
 * 获取平台配置
 */
async function getPlatformConfig(): Promise<PlatformConfig> {
  // 加载全局环境变量
  ConfigService.loadGlobalEnv();

  // 从环境变量获取基础配置
  const envConfig = ConfigService.getPlatformConfigFromEnv();

  // 通过用户交互获取完整配置（不使用项目ID缓存）
  const finalConfig = await UserInteractionService.getPlatformConfigInput(
    envConfig
  );

  // 保存平台配置到.env文件（如果有新的配置）
  if (!envConfig.username || !envConfig.password) {
    await ConfigService.savePlatformConfigToEnv(finalConfig);
    console.log(chalk.green(`✅ 平台配置已保存到全局配置文件`));
  }

  return finalConfig;
}


