// 配置相关接口
export interface OSSConfig {
  accessKeyId: string;
  accessKeySecret: string;
  endpoint: string;
  bucket: string;
  path: string;
}

export interface PlatformConfig {
  username: string;
  password: string;
  projectId: string;
}

// 缓存配置接口
export interface CachedConfig {
  platformToken?: string;
  platformTokenExpiry?: number;
  updateCache?: {
    lastCheckTime: number;
    latestVersion?: string;
    hasUpdate?: boolean;
  };
  [key: string]: any; // 支持动态属性
}

// API响应接口
export interface LoginResponse {
  code: number;
  message: string;
  data: {
    tokenName: string;
    tokenValue: string;
    isRegistered: boolean;
    licenseWarns: any;
    isAdmin: any;
    isExpired: any;
    isOAuthEnabled: boolean;
    isRemoteLogin: boolean;
    isBindingOAuthId: boolean;
  };
  date: string;
  requestId: string;
  success: boolean;
}

export interface OperationItem {
  id: number;
  name: string;
  description?: string;
  // 根据实际API响应添加更多字段
}

export interface OperationListResponse {
  code: number;
  message: string;
  data: {
    operation: OperationItem[];
    type: number;
  };
}

// 文件信息接口
export interface FileInfo {
  name: string;
  size: number;
  lastModified: Date;
  isDirectory: boolean;
}

// 目录结构信息
export interface DirectoryStructure {
  path: string;
  files: FileInfo[];
  subdirectories: Map<string, DirectoryStructure>;
  totalFiles: number;
  totalSize: number;
}

// 显示项目类型
export interface DisplayItem {
  name: string;
  isDirectory: boolean;
  size: number;
  count: number;
  type: 'directory' | 'fileGroup';
  files?: FileInfo[];
  totalSize?: number;
}

// 模板变量接口
export interface TemplateVars {
  bucketName: string;
  bucketPath: string;
  ossEndpoint: string;
  fileStructure: string;
  attachmentType: string;
  isPointCloud?: boolean;
}
