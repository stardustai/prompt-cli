import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import * as Mustache from 'mustache';

/**
 * 读取模板文件的辅助函数
 */
export async function readTemplate(templateName: string): Promise<string> {
  const templatePath = path.join(__dirname, '..', 'templates', templateName);
  try {
    return await fs.readFile(templatePath, 'utf-8');
  } catch (error) {
    throw new Error(`读取模板文件失败: ${templateName}, ${error}`);
  }
}

/**
 * 生成本地 .env 文件并填入配置
 */
export async function generateLocalEnvFile(
  targetDir: string = process.cwd(),
  ossConfig?: {
    accessKeyId: string;
    accessKeySecret: string;
    endpoint: string;
    bucket: string;
    path: string;
  }
) {
  const envPath = path.join(targetDir, '.env');

  // 检查 .env 文件是否已存在
  if (await fs.pathExists(envPath)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: '.env 文件已存在，是否覆盖？',
        default: false
      }
    ]);

    if (!overwrite) {
      console.log(chalk.yellow('⏭️  跳过 .env 文件生成'));
      return;
    }
  }

  try {
    console.log(chalk.blue('📄 生成 .env 文件...'));

    // 准备模板变量
    const templateVars = {
      ossAccessKeyId: ossConfig?.accessKeyId || '',
      ossAccessKeySecret: ossConfig?.accessKeySecret || '',
      ossEndpoint: ossConfig?.endpoint || '',
      ossBucket: ossConfig?.bucket || '',
      ossDataPath: ossConfig?.path || ''
    };

    // 渲染模板
    const envContent = await renderTemplate('env.template', templateVars);

    await fs.writeFile(envPath, envContent);
    console.log(chalk.green(`✅ .env 文件已生成: ${envPath}`));

    if (ossConfig) {
      console.log(chalk.cyan('💡 已自动填入 OSS 配置信息'));
    }
  } catch (error) {
    console.error(chalk.red('❌ 生成 .env 文件失败:'), error);
  }
}

/**
 * 通用模板渲染函数
 */
export async function renderTemplate(
  templateName: string,
  variables: Record<string, any> = {}
): Promise<string> {
  try {
    const templateContent = await readTemplate(templateName);
    // 配置 Mustache 选项，禁用 HTML 转义
    return Mustache.render(templateContent, variables, {}, {
      escape: (text: string) => text // 禁用转义
    });
  } catch (error) {
    throw new Error(`渲染模板失败: ${templateName}, ${error}`);
  }
}
