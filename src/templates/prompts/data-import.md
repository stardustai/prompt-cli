# 数据导入任务

## 任务背景

{{#isPointCloud}}从云存储获取多模态传感器数据（点云、图像、IMU等），进行坐标系转换、时间同步、格式标准化等处理，{{/isPointCloud}}输出符合目标平台要求的结构化数据。

- 请使用 `source .venv/bin/activate` 激活虚拟环境后再开始执行命令，所有命令都应该在项目根目录执行。
- 不需要创建使用示例脚本及各类说明文档。
- 所有任务执行完成后清理各类中间文件。

## 数据记录类型

- **附件类型**: {{attachmentType}}

> 请参考 `data/` 目录下生成的 `example.json` 文件了解具体的数据结构要求。

## 任务步骤

1. 创建并执行 `scripts/fetch_config.py`，获取各类配置文件并保存到 data 目录下，不需要获取资源类文件
2. 创建并执行 `scripts/parse_config.py`，分析各类配置文件内容，思考其常见含义，确认解析方式
3. 创建并执行 `scripts/validate_config.py`，结合已有信息验证参数完整性及正确性
4. 创建并执行 `scripts/import_data.py`，获取远程完整文件列表，生成目标格式文件，需考虑大批量文件处理优化
5. 创建 `scripts/main.py`，完整执行整个流程

{{#isPointCloud}}
## 关键技术处理点

### 坐标系

- 点云采用右手坐标系（threejs）
  - X轴：前进方向（车辆前方）
  - Y轴：左侧方向
  - Z轴：向上方向

### 相机参数

- 相机外参表示的是相机在世界坐标系中的位置和朝向
- 自动识别相机类型：fisheye → "Fisheye"，其他 → "PinHole"
- 图像的宽高信息在配置中有则使用配置的值，没有则移除
- 不可以使用任何推测值或默认值，应当计算得出参数
{{/isPointCloud}}

## OSS配置信息

- **Bucket**: {{bucketName}}
- **Path**: {{bucketPath}}
- **Endpoint**: {{ossEndpoint}}

## 文件结构

```
{{fileStructure}}
```

## 目录规范

> 任务完成后请清理临时文件

1. **配置文件**: `.env` - 配置文件
2. **示例数据**: `data/example.json` - 数据记录结构示例文件
3. **处理脚本**: `scripts/` - 主要的数据导入脚本
4. **生成结果** `results/project_name.json` - 最终结果以 json 格式保存
5. **依赖文件**: `requirements.txt` - Python依赖包列表
6. **文档**: `README.md` - 使用说明和配置指南，包含 `mermaid` 格式的数据解析流程图

{{#isPointCloud}}
## 常见问题

- 计算机视觉中，rt 通常表示的是世界坐标系原点在相机坐标系中的位移和旋转，需要进行转换
{{/isPointCloud}}

## 核心准则

- 不可以使用任何推测值或默认值，应当解析或计算得出参数
- 合理分解为多个任务执行，不要急于完成所有任务，每个任务验证无误后再执行后续任务

请根据以上信息生成完整的数据导入脚本，确保输出的数据记录严格符合 `{{attachmentType}}` 附件类型的结构要求。
