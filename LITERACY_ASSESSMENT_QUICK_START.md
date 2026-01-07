# 儿童识字量测试游戏 - 快速开始指南

## 前端实现状态

✅ **前端代码已完成** - 所有核心功能已实现并通过类型检查

## 后端配置要求

### 1. 数据库配置

在 `games` 表中添加游戏记录：

```sql
INSERT INTO games (
  id,
  title,
  description,
  icon,
  type,
  language,
  is_active,
  default_config,
  created_at,
  updated_at
) VALUES (
  'literacy-assessment',
  '儿童识字量测试',
  '科学评估3-10岁儿童的识字量水平，提供个性化学习建议',
  'BookCheck',
  'shizi_test',
  'zh',
  true,
  '{}'::jsonb,
  NOW(),
  NOW()
);
```

### 2. RPC 函数

确保以下 RPC 函数已部署并可用：

#### start_assessment_v6
```sql
CREATE OR REPLACE FUNCTION start_assessment_v6(birth_date text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
-- 实现逻辑
$$;
```

#### submit_packet_v6
```sql
CREATE OR REPLACE FUNCTION submit_packet_v6(
  session_id text,
  results jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
-- 实现逻辑
$$;
```

## 测试步骤

### 1. 启动开发服务器

```bash
npm run dev
```

### 2. 访问首页

打开浏览器访问 `http://localhost:5173`

### 3. 查找游戏卡片

在首页应该能看到"儿童识字量测试"游戏卡片（如果后端配置正确）

### 4. 开始测试

1. 点击"开始游戏"按钮
2. 选择出生日期（3-10岁范围内）
3. 点击"开始测试"
4. 按照提示完成题目
5. 查看测试结果

## 游戏流程

```
年龄选择
   ↓
开始测试 (调用 start_assessment_v6)
   ↓
答题阶段 (base_set)
   ↓
评估结果
   ├─ 通过 → 等级过渡 → 下一题包
   ├─ 失败 → 提交结果 → 显示报告
   └─ 触发急救 → 急救题集 (rescue_set)
      ├─ 通过 → 等级过渡 → 下一题包
      └─ 失败 → 提交结果 → 显示报告
```

## 功能特点

### 年龄选择
- 支持 3-10 岁儿童
- 出生日期自动保存到 localStorage
- 实时年龄计算和验证

### 题目展示
- 4个选项（1个正确答案 + 3个混淆选项）
- 选项随机排序
- TTS 自动播放题目音频
- 即时反馈（正确/错误）
- 音效提示

### 评估逻辑
- **基础题集**: 根据正确率判断通过/失败/触发急救
- **急救题集**: 计算总正确率判断最终结果
- **提前终止**: 失败时立即结束测试
- **继续测试**: 通过时继续下一等级

### 等级过渡
- 显示等级信息（标题、通关消息、词汇里程碑）
- 星星爆炸庆祝动画
- 成功音效
- 自动过渡（3秒）或手动继续

### 结果展示
- 正态分布图可视化
- 识字量分数、年龄、百分位
- 等级标题和评价
- 学习建议
- 重新测试按钮

## 调试技巧

### 1. 检查 API 调用

打开浏览器开发者工具，查看 Network 标签：
- 查找 `start_assessment_v6` 和 `submit_packet_v6` 请求
- 检查请求参数和响应数据
- 查看是否有错误信息

### 2. 检查控制台日志

查看 Console 标签：
- Hook 会输出详细的状态变化日志
- API 调用错误会显示在控制台
- 数据验证失败会有错误提示

### 3. 检查 localStorage

在 Application 标签中查看 localStorage：
- 键名: `literacy-assessment-birth-date`
- 值: 出生日期字符串 (YYYY-MM-DD)

### 4. 常见问题

#### 游戏卡片不显示
- 检查后端 games 表是否有记录
- 检查 type 字段是否为 'shizi_test'
- 检查 is_active 字段是否为 true

#### 点击开始游戏没反应
- 检查路由配置是否正确
- 检查浏览器控制台是否有错误
- 检查 HomePage.tsx 中的 handleStartGame 逻辑

#### API 调用失败
- 检查 RPC 函数是否已部署
- 检查函数签名是否匹配
- 检查返回数据格式是否正确

#### TTS 不播放
- 检查浏览器是否支持 Web Speech API
- 尝试使用 Chrome 或 Edge 浏览器
- 检查浏览器音量设置

## 文件位置

所有游戏相关文件都在 `src/components/LiteracyAssessmentGame/` 目录下：

```
src/components/LiteracyAssessmentGame/
├── index.ts                          # 导出文件
├── types.ts                          # 类型定义
├── useLiteracyAssessmentGame.ts      # 核心 Hook
├── apiValidation.ts                  # API 验证
├── LiteracyAssessmentGamePage.tsx    # 主页面
├── AgeSelector.tsx                   # 年龄选择
├── QuestionDisplay.tsx               # 题目展示
├── LevelTransition.tsx               # 等级过渡
├── NormalDistributionChart.tsx       # 分布图
└── ResultDisplay.tsx                 # 结果展示
```

## 下一步

1. **配置后端**: 添加数据库记录和 RPC 函数
2. **测试游戏**: 运行完整流程测试
3. **优化性能**: 根据测试结果优化
4. **修复问题**: 解决发现的 bug
5. **部署上线**: 部署到生产环境

## 联系支持

如有问题，请查看：
- `LITERACY_ASSESSMENT_IMPLEMENTATION_SUMMARY.md` - 完整实现总结
- `.kiro/specs/literacy-assessment-game/` - 需求、设计和任务文档
