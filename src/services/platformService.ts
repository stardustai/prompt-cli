import axios from 'axios';
import chalk from 'chalk';
import { LoginResponse, OperationListResponse, OperationItem } from '../types/serviceTypes';
import { ConfigService } from './configService';

/**
 * 平台API服务
 * 负责处理平台登录、token管理、API调用等功能
 */
export class PlatformService {
  private static readonly BASE_URL = 'https://server.rosettalab.top/rosetta-service';
  private static readonly TOKEN_EXPIRY_DAYS = 7;

  /**
   * 检查并获取平台token
   */
  static async checkAndGetToken(username: string, password: string): Promise<string> {
    // 检查缓存中是否有有效的token
    const cachedConfig = await ConfigService.getCachedConfig();

    if (cachedConfig.platformToken && cachedConfig.platformTokenExpiry) {
      const now = Date.now();
      if (now < cachedConfig.platformTokenExpiry) {
        console.log(chalk.green('✅ 使用缓存的平台token'));
        return cachedConfig.platformToken;
      }
    }

    // token不存在或已过期，重新登录
    console.log(chalk.blue('🔑 正在登录平台获取token...'));
    return await this.login(username, password);
  }

  /**
   * 平台登录
   */
  static async login(username: string, password: string): Promise<string> {
    try {
      const response = await axios.post<LoginResponse>(`${this.BASE_URL}/user/login`, {
        username: username,
        password: password
      }, {
        headers: this.getCommonHeaders()
      });

      if (response.data.code === 2000 && response.data.data.tokenValue) {
        const token = response.data.data.tokenValue;

        // 保存token到缓存，设置过期时间
        const expiryTime = Date.now() + (this.TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        await ConfigService.saveCachedConfig({
          platformToken: token,
          platformTokenExpiry: expiryTime
        });

        console.log(chalk.green('✅ 平台登录成功'));
        return token;
      } else {
        throw new Error(`登录失败: ${response.data.message || '未知错误'}`);
      }
    } catch (error: any) {
      if (error.response) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`平台登录失败: ${message}`);
      }
      throw error;
    }
  }

  /**
   * 获取项目操作项配置
   */
  static async getProjectOperations(token: string, projectId: string): Promise<OperationItem[]> {
    try {
      console.log(chalk.blue('📋 正在获取项目操作项配置...'));

      const response = await axios.post<OperationListResponse>(
        `${this.BASE_URL}/project/operation/list`,
        { projectId: parseInt(projectId) },
        {
          headers: {
            ...this.getCommonHeaders(),
            'authorize': token,
            'projectid': projectId
          }
        }
      );

      if ((response.data.code === 200 || response.data.code === 2000) && response.data.data) {
        const operations = response.data.data.operation;
        console.log(chalk.green(`✅ 成功获取 ${operations.length} 个操作项配置`));
        return operations;
      } else {
        throw new Error(`获取操作项失败: ${response.data.message || '未知错误'}`);
      }
    } catch (error: any) {
      if (error.response && error.response.data) {
        const errorData = error.response.data;

        // 检查是否是token失效错误 (code: 4001)
        if (errorData.code === 4001 && errorData.message === 'Invalid token') {
          console.log(chalk.yellow('⚠️  Token已失效，需要重新登录'));
          throw new Error('TOKEN_EXPIRED');
        }

        const message = errorData.message || error.message;
        throw new Error(`获取项目操作项失败: ${message}`);
      }
      throw error;
    }
  }

  /**
   * 处理带token重试的操作项获取
   */
  static async getProjectOperationsWithRetry(
    token: string,
    projectId: string,
    username: string,
    password: string
  ): Promise<OperationItem[]> {
    try {
      return await this.getProjectOperations(token, projectId);
    } catch (error: any) {
      if (error.message === 'TOKEN_EXPIRED') {
        console.log(chalk.blue('🔄 正在重新登录获取新token...'));
        // 清除缓存的token
        await ConfigService.saveCachedConfig({
          platformToken: undefined,
          platformTokenExpiry: undefined
        });
        // 重新获取token
        const newToken = await this.login(username, password);
        // 重试获取操作项
        return await this.getProjectOperations(newToken, projectId);
      } else {
        throw error;
      }
    }
  }

  /**
   * 获取通用请求头
   */
  private static getCommonHeaders() {
    return {
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'en-US',
      'cache-control': 'no-cache',
      'content-type': 'application/json',
      'dnt': '1',
      'origin': 'https://rosettalab.top',
      'pragma': 'no-cache',
      'referer': 'https://rosettalab.top/',
      'sec-ch-ua': '"Chromium";v="137", "Not/A)Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
    };
  }
}
