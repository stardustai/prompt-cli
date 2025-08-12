import inquirer from 'inquirer';
import chalk from 'chalk';
import { OSSConfig, PlatformConfig } from '../types/serviceTypes';
import { ATTACHMENT_TYPES } from '../constants/dataRecordTypes';

/**
 * 用户交互服务
 * 负责处理命令行交互、用户输入验证等功能
 */
export class UserInteractionService {

  /**
   * 选择任务类型
   */
  static async selectTaskType(): Promise<string> {
    const { taskType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'taskType',
        message: '请选择任务类型:',
        choices: [
          {
            name: '📊 数据导入 - 生成数据导入脚本',
            value: 'data-import'
          },
          {
            name: '📤 数据导出 - 生成数据导出脚本',
            value: 'data-export'
          }
        ]
      }
    ]);

    return taskType;
  }

  /**
   * 解析 OSS URL
   */
  static parseOSSUrl(ossUrl: string): { bucket: string; path: string; endpoint?: string } {
    // 解析 oss://bucket-name/path 格式
    const match = ossUrl.match(/^oss:\/\/([^/]+)(\/.*)?$/);
    if (!match) {
      throw new Error('无效的 OSS URL 格式，请使用 oss://bucket-name/path 格式');
    }

    const bucket = match[1];
    const path = match[2] ? match[2].substring(1) : ''; // 移除开头的 /
    
    // 根据 bucket 名称推断地域
    let endpoint = 'oss-cn-hangzhou.aliyuncs.com'; // 默认杭州
    if (bucket.includes('beijing') || bucket.includes('bj')) {
      endpoint = 'oss-cn-beijing.aliyuncs.com';
    } else if (bucket.includes('shanghai') || bucket.includes('sh')) {
      endpoint = 'oss-cn-shanghai.aliyuncs.com';
    } else if (bucket.includes('shenzhen') || bucket.includes('sz')) {
      endpoint = 'oss-cn-shenzhen.aliyuncs.com';
    }

    return {
      bucket,
      path: path.endsWith('/') ? path : path + '/',
      endpoint
    };
  }

  /**
   * 获取OSS配置信息（用户输入部分）
   */
  static async getOSSConfigInput(
    existingConfig: Partial<OSSConfig>
  ): Promise<Partial<OSSConfig & { bucket: string; path: string }>> {
    // 检查是否有缺失的基础配置
    const missingConfigs: string[] = [];
    if (!existingConfig.accessKeyId) missingConfigs.push('Access Key ID');
    if (!existingConfig.accessKeySecret) missingConfigs.push('Access Key Secret');

    let configAnswers = {};

    if (missingConfigs.length > 0) {
      console.log(chalk.yellow('⚠️  检测到缺少OSS配置，请输入相关信息:'));

      configAnswers = await inquirer.prompt([
        {
          type: 'input',
          name: 'accessKeyId',
          message: 'OSS Access Key ID:',
          when: !existingConfig.accessKeyId,
          validate: (input) => input.trim() !== '' || '请输入有效的Access Key ID'
        },
        {
          type: 'password',
          name: 'accessKeySecret',
          message: 'OSS Access Key Secret:',
          when: !existingConfig.accessKeySecret,
          validate: (input) => input.trim() !== '' || '请输入有效的Access Key Secret'
        }
      ]);
    }

    // 获取 OSS URL（不使用缓存默认值）
    const ossUrlAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'ossUrl',
        message: 'OSS 地址 (格式: oss://bucket-name/path/):',
        validate: (input) => {
          try {
            this.parseOSSUrl(input.trim());
            return true;
          } catch (error) {
            return (error as Error).message;
          }
        }
      }
    ]);

    // 解析 OSS URL
    const { bucket, path, endpoint } = this.parseOSSUrl(ossUrlAnswer.ossUrl);

    return { 
      ...existingConfig, 
      ...configAnswers, 
      bucket, 
      path, 
      endpoint 
    };
  }

  /**
   * 获取平台配置信息（用户输入部分）
   */
  static async getPlatformConfigInput(
    existingConfig: Partial<PlatformConfig>
  ): Promise<PlatformConfig> {
    // 检查是否有缺失的配置
    const missingConfigs: string[] = [];
    if (!existingConfig.username) missingConfigs.push('用户名');
    if (!existingConfig.password) missingConfigs.push('密码');

    let configAnswers = {};

    if (missingConfigs.length > 0) {
      console.log(chalk.yellow('⚠️  检测到缺少平台信息配置，请输入相关信息:'));

      configAnswers = await inquirer.prompt([
        {
          type: 'input',
          name: 'username',
          message: '平台用户名:',
          when: !existingConfig.username,
          validate: (input) => input.trim() !== '' || '请输入有效的用户名'
        },
        {
          type: 'password',
          name: 'password',
          message: '平台密码:',
          when: !existingConfig.password,
          validate: (input) => input.trim() !== '' || '请输入有效的密码'
        }
      ]);
    }

    // 获取项目ID信息（不使用缓存）
    const projectInfo = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectId',
        message: '项目ID:',
        validate: (input) => input.trim() !== '' || '请输入有效的项目ID'
      }
    ]);

    return { ...existingConfig, ...configAnswers, ...projectInfo } as PlatformConfig;
  }

  /**
   * 选择附件类型
   */
  static async selectAttachmentType(): Promise<string> {
    console.log(chalk.blue('📋 请选择附件类型:'));

    const { attachmentType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'attachmentType',
        message: '选择要导入的附件类型:',
        choices: ATTACHMENT_TYPES.map(type => ({
          name: type.name,
          value: type.attachmentType,
          short: type.name
        })),
        pageSize: 15
      }
    ]);

    const selectedType = ATTACHMENT_TYPES.find(type => type.attachmentType === attachmentType);
    if (!selectedType) {
      throw new Error('未知的附件类型');
    }

    console.log(chalk.green(`✅ 已选择: ${selectedType.name}`));
    return attachmentType;
  }

  /**
   * 询问是否需要导入预标注数据
   */
  static async askForPreAnnotationImport(): Promise<boolean> {
    const { includePreAnnotation } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'includePreAnnotation',
        message: '是否需要导入预标注数据？',
        default: false
      }
    ]);

    return includePreAnnotation;
  }
}
