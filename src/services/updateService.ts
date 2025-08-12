import axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ConfigService } from './configService';
import { packageInfo } from '../utils/packageInfo';

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseNotes?: string;
  publishedAt?: string;
}

interface UpdateCache {
  lastCheckTime: number;
  latestVersion?: string;
  hasUpdate?: boolean;
}

/**
 * 更新检测服务
 */
export class UpdateService {
  private static readonly CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24小时
  private static readonly UPDATE_CACHE_KEY = 'updateCache';

  /**
   * 检查是否需要检测更新
   */
  static async shouldCheckForUpdates(): Promise<boolean> {
    try {
      const cache = await this.getUpdateCache();
      const now = Date.now();

      return !cache.lastCheckTime || (now - cache.lastCheckTime) >= this.CHECK_INTERVAL;
    } catch (error) {
      return true; // 出错时默认检查
    }
  }

  /**
   * 检查更新
   */
  static async checkForUpdates(): Promise<UpdateInfo> {
    const currentVersion = packageInfo.version;

    try {
      // 检查 npm registry 获取最新版本
      const response = await axios.get(
        `https://registry.npmjs.org/${packageInfo.name}/latest`,
        {
          timeout: 5000,
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      const data = response.data as any;
      const latestVersion = data.version;
      const publishedAt = data.time?.[latestVersion];

      const hasUpdate = this.compareVersions(currentVersion, latestVersion) < 0;

      // 获取发布说明（如果有的话）
      let releaseNotes: string | undefined;
      try {
        const repoInfo = data.repository;
        if (repoInfo?.url) {
          // 尝试从 GitHub 获取 release notes
          releaseNotes = await this.fetchReleaseNotes(repoInfo.url, latestVersion);
        }
      } catch (error) {
        // 忽略获取 release notes 的错误
      }

      // 缓存结果
      await this.updateCache({
        hasUpdate,
        latestVersion
      });

      return {
        hasUpdate,
        currentVersion,
        latestVersion,
        releaseNotes,
        publishedAt
      };
    } catch (error) {
      // 网络错误时，返回缓存的结果或默认结果
      const cache = await this.getUpdateCache();
      return {
        hasUpdate: cache.hasUpdate || false,
        currentVersion,
        latestVersion: cache.latestVersion || currentVersion
      };
    }
  }

  /**
   * 更新最后检查时间
   */
  static async updateLastCheckTime(): Promise<void> {
    const cache = await this.getUpdateCache();
    cache.lastCheckTime = Date.now();
    await this.saveUpdateCache(cache);
  }

  /**
   * 比较版本号
   * @param version1 版本1
   * @param version2 版本2
   * @returns 小于0表示version1 < version2，等于0表示相等，大于0表示version1 > version2
   */
  private static compareVersions(version1: string, version2: string): number {
    // 移除 v 前缀
    const v1 = version1.replace(/^v/, '');
    const v2 = version2.replace(/^v/, '');

    const parts1 = v1.split('.').map(n => parseInt(n) || 0);
    const parts2 = v2.split('.').map(n => parseInt(n) || 0);

    const maxLength = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLength; i++) {
      const num1 = parts1[i] || 0;
      const num2 = parts2[i] || 0;

      if (num1 < num2) return -1;
      if (num1 > num2) return 1;
    }

    return 0;
  }

  /**
   * 获取更新缓存
   */
  private static async getUpdateCache(): Promise<UpdateCache> {
    try {
      const cachedConfig = await ConfigService.getCachedConfig();
      return cachedConfig[this.UPDATE_CACHE_KEY] || { lastCheckTime: 0 };
    } catch (error) {
      return { lastCheckTime: 0 };
    }
  }

  /**
   * 保存更新缓存
   */
  private static async saveUpdateCache(cache: UpdateCache): Promise<void> {
    try {
      const cachedConfig = await ConfigService.getCachedConfig();
      cachedConfig[this.UPDATE_CACHE_KEY] = cache;
      await ConfigService.saveCachedConfig(cachedConfig);
    } catch (error) {
      // 忽略保存错误
    }
  }

  /**
   * 更新缓存信息
   */
  private static async updateCache(updateInfo: Partial<UpdateCache>): Promise<void> {
    const cache = await this.getUpdateCache();
    Object.assign(cache, updateInfo);
    await this.saveUpdateCache(cache);
  }

  /**
   * 尝试获取 GitHub release notes
   */
  private static async fetchReleaseNotes(repoUrl: string, version: string): Promise<string | undefined> {
    try {
      // 解析 GitHub 仓库地址
      const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
      if (!match) return undefined;

      const [, owner, repo] = match;
      const cleanRepo = repo.replace(/\.git$/, '');

      // 获取 release 信息
      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${cleanRepo}/releases/tags/v${version}`,
        {
          timeout: 3000,
          headers: {
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      const data = response.data as any;
      return data.body;
    } catch (error) {
      return undefined;
    }
  }
}
