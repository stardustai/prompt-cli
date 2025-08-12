import chalk from 'chalk';
import OSS from 'ali-oss';
import { OSSConfig, FileInfo, DirectoryStructure, DisplayItem } from '../types/serviceTypes';

/**
 * OSS服务
 * 负责处理OSS文件系统相关操作
 */
export class OSSService {
  private client: OSS;

  constructor(config: OSSConfig) {
    this.client = new OSS({
      endpoint: `https://${config.endpoint}`,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      bucket: config.bucket
    });
  }

  /**
   * 获取OSS文件结构
   */
  async getFileStructure(ossPath: string): Promise<string> {
    try {
      console.log(chalk.blue('📡 正在连接OSS并获取文件列表...'));

      // 获取文件结构
      const structure = await this.scanDirectory(ossPath, 3); // 限制扫描深度为3级

      // 生成文件结构描述
      const fileStructureText = this.generateFileStructureText(structure);

      console.log(chalk.green('✅ 文件结构获取完成'));
      return fileStructureText;
    } catch (error) {
      console.warn(chalk.yellow('⚠️  无法连接OSS，使用示例文件结构'));
      console.warn(chalk.gray(`错误详情: ${error instanceof Error ? error.message : '未知错误'}`));
      return '';
    }
  }

  /**
   * 扫描OSS目录
   */
  private async scanDirectory(
    prefix: string = '',
    maxDepth: number = 5,
    currentDepth: number = 0
  ): Promise<DirectoryStructure> {
    const structure: DirectoryStructure = {
      path: prefix,
      files: [],
      subdirectories: new Map(),
      totalFiles: 0,
      totalSize: 0
    };

    if (currentDepth >= maxDepth) {
      return structure;
    }

    try {
      let nextMarker: string | undefined;
      let objectCount = 0;
      const maxObjectsPerDirectory = 20;

      // 分页获取对象列表
      do {
        const result = await this.client.list({
          prefix: prefix,
          delimiter: '/',
          'max-keys': Math.min(50, maxObjectsPerDirectory - objectCount),
          marker: nextMarker
        }, {});

        // 处理文件
        if (result.objects) {
          for (const obj of result.objects) {
            if (obj.name !== prefix && objectCount < maxObjectsPerDirectory) {
              const fileName = obj.name.substring(prefix.length);
              if (!fileName.includes('/')) {
                structure.files.push({
                  name: fileName,
                  size: obj.size || 0,
                  lastModified: typeof obj.lastModified === 'string'
                    ? new Date(obj.lastModified)
                    : (obj.lastModified || new Date()),
                  isDirectory: false
                });
                structure.totalFiles++;
                structure.totalSize += obj.size || 0;
                objectCount++;
              }
            }
          }
        }

        nextMarker = result.nextMarker;

        if (objectCount >= maxObjectsPerDirectory) {
          if (result.isTruncated) {
            structure.files.push({
              name: `... (还有更多文件，总计可能超过 ${maxObjectsPerDirectory} 个)`,
              size: 0,
              lastModified: new Date(),
              isDirectory: false
            });
          }
          break;
        }

      } while (nextMarker);

      // 处理子目录
      const result = await this.client.list({
        prefix: prefix,
        delimiter: '/',
        'max-keys': 50
      }, {});

      if (result.prefixes && result.prefixes.length > 0) {
        const limitedPrefixes = result.prefixes.slice(0, 15);

        for (const subPrefix of limitedPrefixes) {
          const dirName = subPrefix.substring(prefix.length).replace('/', '');
          const subStructure = await this.scanDirectory(subPrefix, maxDepth, currentDepth + 1);
          structure.subdirectories.set(dirName, subStructure);
          structure.totalFiles += subStructure.totalFiles;
          structure.totalSize += subStructure.totalSize;
        }

        if (result.prefixes.length > 15) {
          const remaining = result.prefixes.length - 15;
          structure.subdirectories.set(`... (还有 ${remaining} 个子目录未显示)`, {
            path: '',
            files: [],
            subdirectories: new Map(),
            totalFiles: 0,
            totalSize: 0
          });
        }
      }

    } catch (error) {
      console.warn(chalk.yellow(`⚠️  扫描目录 ${prefix} 时出错: ${error instanceof Error ? error.message : '未知错误'}`));
    }

    return structure;
  }

  /**
   * 生成文件结构文本
   */
  private generateFileStructureText(structure: DirectoryStructure): string {
    const lines: string[] = [];
    lines.push(structure.path || '/');
    this.generateDirectoryTree(structure, lines, '', true);
    return lines.join('\n');
  }

  /**
   * 生成目录树
   */
  private generateDirectoryTree(
    structure: DirectoryStructure,
    lines: string[],
    prefix: string = '',
    isRoot: boolean = false
  ): void {
    const directories = Array.from(structure.subdirectories.entries());
    const files = structure.files;
    const fileGroups = this.groupFilesByExtension(files);

    const allItems: DisplayItem[] = [
      ...directories.map(([name, subStructure]): DisplayItem => ({
        name,
        isDirectory: true,
        size: subStructure.totalSize,
        count: subStructure.totalFiles,
        type: 'directory'
      })),
      ...fileGroups.map((group): DisplayItem => ({
        name: group.extension,
        isDirectory: false,
        size: group.totalSize,
        count: group.files.length,
        type: 'fileGroup',
        files: group.files,
        totalSize: group.totalSize
      }))
    ];

    const maxItems = 20;
    const displayItems = allItems.slice(0, maxItems);
    const hasMore = allItems.length > maxItems;

    displayItems.forEach((item, index) => {
      const isLast = index === displayItems.length - 1 && !hasMore;
      const currentPrefix = isLast ? '└── ' : '├── ';
      const nextPrefix = isLast ? '    ' : '│   ';

      if (item.type === 'directory') {
        const dirStructure = structure.subdirectories.get(item.name);
        if (dirStructure) {
          const fileCount = dirStructure.totalFiles > 0 ? ` (${dirStructure.totalFiles} files)` : '';
          lines.push(`${prefix}${currentPrefix}${item.name}/${fileCount}`);

          if (dirStructure.subdirectories.size > 0 || dirStructure.files.length > 0) {
            this.generateDirectoryTree(dirStructure, lines, prefix + nextPrefix, false);
          }
        }
      } else if (item.type === 'fileGroup' && item.files) {
        if (item.files.length === 1) {
          const file = item.files[0];
          const sizeInfo = file.size > 0 ? ` (${this.formatFileSize(file.size)})` : '';
          lines.push(`${prefix}${currentPrefix}${file.name}${sizeInfo}`);
        } else {
          const ext = this.getFileExtension(item.files[0].name);
          const displayCount = Math.min(3, item.files.length);

          for (let i = 0; i < displayCount; i++) {
            const file = item.files[i];
            const sizeInfo = file.size > 0 ? ` (${this.formatFileSize(file.size)})` : '';
            const isFileLast = i === displayCount - 1 && item.files.length <= displayCount;
            const filePrefix = isFileLast ? '└── ' : '├── ';
            lines.push(`${prefix}${nextPrefix}${filePrefix}${file.name}${sizeInfo}`);
          }

          if (item.files.length > displayCount) {
            const remaining = item.files.length - displayCount;
            const avgSize = (item.totalSize || 0) / item.files.length;
            lines.push(`${prefix}${nextPrefix}└── ... (${remaining} more ${ext} files, avg ${this.formatFileSize(avgSize)} each)`);
          }
        }
      }
    });

    if (hasMore) {
      const remaining = allItems.length - maxItems;
      lines.push(`${prefix}└── ... (${remaining} more items)`);
    }
  }

  /**
   * 按文件扩展名分组
   */
  private groupFilesByExtension(files: FileInfo[]): Array<{extension: string, files: FileInfo[], totalSize: number}> {
    const groups = new Map<string, FileInfo[]>();

    files.forEach(file => {
      const ext = this.getFileExtension(file.name);
      if (!groups.has(ext)) {
        groups.set(ext, []);
      }
      groups.get(ext)!.push(file);
    });

    return Array.from(groups.entries()).map(([extension, groupFiles]) => ({
      extension,
      files: groupFiles.sort((a, b) => a.name.localeCompare(b.name)),
      totalSize: groupFiles.reduce((sum, file) => sum + file.size, 0)
    })).sort((a, b) => b.files.length - a.files.length);
  }

  /**
   * 获取文件扩展名
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === 0) return 'no-ext';
    return filename.substring(lastDot).toLowerCase();
  }

  /**
   * 格式化文件大小
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, unitIndex);

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}
