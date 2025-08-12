import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { OSSConfig, OperationItem, TemplateVars } from '../types/serviceTypes';
import { generateLocalEnvFile, renderTemplate } from '../utils/templateUtils';

/**
 * 文件生成服务
 * 负责处理各种文件的生成工作
 */
export class FileGeneratorService {

  /**
   * 生成示例数据文件
   */
  static async generateExampleDataFile(attachmentType: string, targetDir: string = process.cwd()): Promise<string> {
    console.log(chalk.blue('📄 正在生成示例数据文件...'));

    // 确保data目录存在
    const dataDir = path.join(targetDir, 'data');
    await fs.ensureDir(dataDir);

    // 渲染模板文件内容
    const templateContent = await renderTemplate(`dataRecord/${attachmentType}.json`);

    // 写入文件
    const fileName = 'example.json';
    const filePath = path.join(dataDir, fileName);

    await fs.writeFile(filePath, templateContent, 'utf-8');

    console.log(chalk.green(`✅ 示例数据文件已生成: ${chalk.cyan(filePath)}`));
    return filePath;
  }

  /**
   * 生成操作项配置文件
   */
  static async saveOperationsToFile(operations: OperationItem[], targetDir: string = process.cwd()): Promise<void> {
    try {
      // 确保data目录存在
      const dataDir = path.join(targetDir, 'data');
      await fs.ensureDir(dataDir);

      const operatorsFilePath = path.join(dataDir, 'operators.json');
      await fs.writeFile(operatorsFilePath, JSON.stringify(operations, null, 2), 'utf-8');

      console.log(chalk.green(`✅ 操作项配置已保存到: ${chalk.cyan(operatorsFilePath)}`));
    } catch (error) {
      console.error(chalk.red('❌ 保存操作项配置失败:'), error);
      throw error;
    }
  }

  /**
   * 生成数据导入prompt文件
   */
  static async generateDataImportPromptFile(
    config: OSSConfig,
    fileStructure: string,
    attachmentType: string,
    targetDir: string = process.cwd()
  ): Promise<void> {
    console.log(chalk.blue('📝 正在生成 prompt.md 文件...'));

    try {
      // 准备模板变量
      const templateVars: TemplateVars = {
        bucketName: config.bucket,
        bucketPath: config.path || '/',
        ossEndpoint: config.endpoint,
        fileStructure: fileStructure,
        attachmentType: attachmentType,
        isPointCloud: attachmentType === 'POINTCLOUD_SEQUENCE'
      };

      // 渲染模板
      const promptContent = await renderTemplate('prompts/data-import.md', templateVars);

      const promptPath = path.join(targetDir, 'prompt.md');
      await fs.writeFile(promptPath, promptContent, 'utf-8');

      console.log(chalk.green('✅ prompt.md 文件已生成'));
      console.log(chalk.cyan(`📄 文件路径: ${promptPath}`));
      console.log(chalk.gray('💡 您现在可以将此文件内容复制到AI助手中进行数据导入脚本生成'));
    } catch (error) {
      console.error(chalk.red('❌ 生成 prompt.md 文件失败:'), error);
      throw error;
    }
  }

  /**
   * 生成数据导出prompt文件
   */
  static async generateDataExportPromptFile(
    config: OSSConfig,
    fileStructure: string,
    attachmentType: string,
    targetDir: string = process.cwd()
  ): Promise<void> {
    console.log(chalk.blue('📝 正在生成 export-prompt.md 文件...'));

    try {
      // 准备模板变量
      const templateVars: TemplateVars = {
        bucketName: config.bucket,
        bucketPath: config.path || '/',
        ossEndpoint: config.endpoint,
        fileStructure: fileStructure,
        attachmentType: attachmentType,
        isPointCloud: attachmentType === 'POINTCLOUD_SEQUENCE'
      };

      // 渲染模板
      const promptContent = await renderTemplate('prompts/data-export.md', templateVars);

      const promptPath = path.join(targetDir, 'export-prompt.md');
      await fs.writeFile(promptPath, promptContent, 'utf-8');

      console.log(chalk.green('✅ export-prompt.md 文件已生成'));
      console.log(chalk.cyan(`📄 文件路径: ${promptPath}`));
      console.log(chalk.gray('💡 您现在可以将此文件内容复制到AI助手中进行数据导出脚本生成'));
    } catch (error) {
      console.error(chalk.red('❌ 生成 export-prompt.md 文件失败:'), error);
      throw error;
    }
  }

  /**
   * 生成预标注结果导入prompt文件
   */
  static async generateResultImportPromptFile(
    config: OSSConfig,
    fileStructure: string,
    targetDir: string = process.cwd()
  ): Promise<void> {
    console.log(chalk.blue('📝 正在生成 result-prompt.md 文件...'));

    try {
      // 准备模板变量
      const templateVars: TemplateVars = {
        bucketName: config.bucket,
        bucketPath: config.path || '/',
        ossEndpoint: config.endpoint,
        fileStructure: fileStructure,
        attachmentType: '',
        isPointCloud: false
      };

      // 渲染模板
      const promptContent = await renderTemplate('prompts/result-import.md', templateVars);

      const promptPath = path.join(targetDir, 'result-prompt.md');
      await fs.writeFile(promptPath, promptContent, 'utf-8');

      console.log(chalk.green('✅ result-prompt.md 文件已生成'));
      console.log(chalk.cyan(`📄 文件路径: ${promptPath}`));
      console.log(chalk.gray('💡 您现在可以将此文件内容复制到AI助手中进行预标注结果导入脚本生成'));
    } catch (error) {
      console.error(chalk.red('❌ 生成 result-prompt.md 文件失败:'), error);
      throw error;
    }
  }

  /**
   * 生成本地环境配置文件
   */
  static async generateLocalEnvFile(ossConfig: OSSConfig, targetDir: string = process.cwd()): Promise<void> {
    await generateLocalEnvFile(targetDir, ossConfig);
  }
}
