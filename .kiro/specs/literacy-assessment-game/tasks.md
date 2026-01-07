# Implementation Plan: Literacy Assessment Game (儿童识字量测试)

## Overview

本实现计划将儿童识字量测试游戏分解为离散的编码任务。每个任务都是独立的、可测试的步骤，按照从基础到高级的顺序组织。任务包含核心实现和可选的测试子任务。

## Tasks

- [x] 1. 创建类型定义和数据模型
  - 在 `src/types/literacyAssessment.ts` 中定义所有 TypeScript 接口
  - 包括 GamePhase、AssessmentSession、LevelPacket、AssessmentQuestion、LevelInfo、PacketResult、AssessmentReport、ChartData、Conclusion、GameState
  - 导出所有类型供其他模块使用
  - _Requirements: 10.2, 10.3_

- [x] 2. 实现核心游戏状态管理 Hook
  - [x] 2.1 创建 `useLiteracyAssessmentGame` Hook
    - 在 `src/hooks/useLiteracyAssessmentGame.ts` 中实现
    - 管理游戏阶段转换 (age-selection → assessment → level-transition → result)
    - 管理测试会话状态 (session, packets, results)
    - 实现年龄验证逻辑
    - 实现题目答案验证逻辑
    - 实现 base_set 和 rescue_set 的评估逻辑
    - 集成 API 调用（startAssessmentV6 和 submitPacketV6）
    - _Requirements: 1.2, 4.2, 4.3, 4.4, 5.2, 5.3, 5.4_

  - [ ]* 2.2 编写 Hook 的单元测试
    - 测试年龄验证边界条件
    - 测试阈值判断逻辑
    - 测试正确率计算
    - _Requirements: 1.2, 4.2, 4.3, 4.4_

  - [ ]* 2.3 编写属性测试：年龄验证边界
    - **Property 1: Age Validation Boundary**
    - **Validates: Requirements 1.2, 1.3**

  - [ ]* 2.4 编写属性测试：基础题集阈值逻辑
    - **Property 3: Base Set Threshold Logic**
    - **Validates: Requirements 4.2, 4.3, 4.4**

- [x] 3. 实现 API 调用和数据处理
  - [x] 3.1 在 `src/utils/supabaseApi.ts` 中添加 RPC 调用函数
    - 实现 `startAssessmentV6(birthDate: string)` 函数
    - 实现 `submitPacketV6(sessionId: string, results: PacketResult[])` 函数
    - 添加错误处理和重试逻辑
    - _Requirements: 2.1, 7.1, 7.5_

  - [x] 3.2 实现数据验证和转换逻辑
    - 验证 API 返回的数据结构
    - 转换后端数据为前端类型
    - 处理缺失字段和默认值
    - _Requirements: 2.3_

  - [ ]* 3.3 编写 API 调用的单元测试
    - 测试成功响应处理
    - 测试错误响应处理
    - 测试数据验证逻辑
    - _Requirements: 2.1, 2.3_

- [x] 4. 实现年龄选择组件
  - [x] 4.1 创建 `AgeSelector` 组件
    - 在 `src/components/LiteracyAssessmentGame/AgeSelector.tsx` 中实现
    - 实现日期选择器（年/月/日）
    - 实现实时年龄计算和显示
    - 实现年龄验证和错误提示
    - 实现出生日期的本地存储（localStorage）
    - 使用 Tailwind CSS 实现色彩鲜艳的儿童友好界面
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 12.1, 12.2, 12.3, 12.5_

  - [ ]* 4.2 编写组件的单元测试
    - 测试日期选择和年龄计算
    - 测试错误提示显示
    - 测试本地存储读写
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [ ]* 4.3 编写属性测试：出生日期持久化
    - **Property 8: Birth Date Persistence**
    - **Validates: Requirements 1.4, 1.5**

- [x] 5. 实现题目展示组件
  - [x] 5.1 创建 `QuestionDisplay` 组件
    - 在 `src/components/LiteracyAssessmentGame/QuestionDisplay.tsx` 中实现
    - 显示4个选项（正确答案 + 混淆选项）
    - 实现选项随机化逻辑
    - 集成 TTS 自动播放 audio_prompt_text
    - 实现选项点击处理和即时反馈
    - 使用音效系统播放正确/错误音效
    - 使用 Tailwind CSS 实现大字体、清晰按钮
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.1, 9.2, 9.4, 12.1, 12.2, 12.3, 12.5_

  - [ ]* 5.2 编写组件的单元测试
    - 测试选项生成逻辑
    - 测试选项随机化
    - 测试答案验证
    - _Requirements: 3.1, 3.5_

  - [ ]* 5.3 编写属性测试：题目选项完整性
    - **Property 2: Question Options Completeness**
    - **Validates: Requirements 3.1**

  - [ ]* 5.4 编写属性测试：选项随机化
    - **Property 10: Option Randomization**
    - **Validates: Requirements 3.5**

  - [ ]* 5.5 编写属性测试：TTS 音频播放
    - **Property 9: TTS Audio Playback**
    - **Validates: Requirements 3.2**

- [x] 6. 实现等级过渡组件
  - [x] 6.1 创建 `LevelTransition` 组件
    - 在 `src/components/LiteracyAssessmentGame/LevelTransition.tsx` 中实现
    - 显示 level_info 的 pass_message、title 和 vocab_milestone
    - 实现庆祝动画（复用 StarExplosion 组件）
    - 播放成功音效
    - 自动过渡到下一阶段
    - 使用 Tailwind CSS 实现吸引人的视觉效果
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 9.3, 12.1, 12.2, 12.5_

  - [ ]* 6.2 编写组件的单元测试
    - 测试信息显示
    - 测试自动过渡逻辑
    - _Requirements: 6.1, 6.2, 6.4_

- [x] 7. 实现正态分布图组件
  - [x] 7.1 创建 `NormalDistributionChart` 组件
    - 在 `src/components/LiteracyAssessmentGame/NormalDistributionChart.tsx` 中实现
    - 使用 Canvas 或 SVG 绘制正态分布曲线
    - 标记四个等级区间（新手级、标准级、高手级、大师级）
    - 标记用户位置
    - 处理用户分数超出 max_val 的情况
    - 使用 Tailwind CSS 实现图表样式
    - _Requirements: 8.1, 8.2, 8.3, 12.5_

  - [ ]* 7.2 编写组件的单元测试
    - 测试曲线绘制逻辑
    - 测试用户位置计算
    - 测试边界情况处理
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 7.3 编写属性测试：图表边界处理
    - **Property 7: Chart Boundary Handling**
    - **Validates: Requirements 8.3**

- [x] 8. 实现结果展示组件
  - [x] 8.1 创建 `ResultDisplay` 组件
    - 在 `src/components/LiteracyAssessmentGame/ResultDisplay.tsx` 中实现
    - 集成 NormalDistributionChart 组件
    - 显示识字量分数、年龄、百分位
    - 显示等级标题和结论文本
    - 实现"重新测试"按钮
    - 使用 Tailwind CSS 实现结果页面布局
    - _Requirements: 8.1, 8.4, 8.5, 12.5_

  - [ ]* 8.2 编写组件的单元测试
    - 测试数据显示
    - 测试重新测试功能
    - _Requirements: 8.1, 8.4, 8.5_

- [x] 9. 实现主游戏页面组件
  - [x] 9.1 创建 `LiteracyAssessmentGamePage` 组件
    - 在 `src/components/LiteracyAssessmentGame/LiteracyAssessmentGamePage.tsx` 中实现
    - 集成 useLiteracyAssessmentGame Hook
    - 根据 gamePhase 渲染不同的子组件
    - 实现顶部导航栏（返回首页按钮）
    - 实现音效控制
    - 处理错误状态显示
    - 使用 Tailwind CSS 实现整体布局
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 12.1, 12.4, 12.5, 12.6_

  - [x] 9.2 创建组件导出文件
    - 在 `src/components/LiteracyAssessmentGame/index.ts` 中导出所有组件
    - _Requirements: 10.2_

  - [ ]* 9.3 编写页面组件的集成测试
    - 测试阶段转换流程
    - 测试错误处理
    - _Requirements: 10.1, 10.2_

- [x] 10. 集成到首页和路由系统
  - [x] 10.1 更新类型定义
    - 在 `src/types/index.ts` 中更新 Game 类型，添加 'shizi_test'
    - _Requirements: 10.1, 11.1_

  - [x] 10.2 添加路由配置
    - 在 `src/App.tsx` 中添加 `/literacy-assessment` 路由
    - _Requirements: 10.1, 11.2_

  - [x] 10.3 在首页添加游戏卡片
    - 在 `src/components/HomePage.tsx` 中添加识字量测试游戏支持
    - 添加 'shizi_test' 到 SUPPORTED_GAME_TYPES
    - 添加路由跳转逻辑到 `/literacy-assessment`
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ]* 10.4 编写路由和导航的集成测试
    - 测试从首页到游戏页面的导航
    - 测试返回首页功能
    - _Requirements: 11.2_

- [x] 11. 实现评估逻辑和结果提交
  - [x] 11.1 在 Hook 中实现 base_set 评估逻辑
    - 计算正确率
    - 根据阈值判断是否触发 rescue_set
    - 构造 PacketResult 对象
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 11.2 在 Hook 中实现 rescue_set 评估逻辑
    - 计算总正确率（base + rescue）
    - 根据总正确率判断通过/失败
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 11.3 在 Hook 中实现结果提交和流程控制
    - 实现提前终止逻辑（passed: false）
    - 调用 submit_packet_v6 提交结果
    - 根据响应状态决定继续或结束
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 11.4 编写属性测试：急救题集总正确率
    - **Property 4: Rescue Set Total Accuracy**
    - **Validates: Requirements 5.2, 5.3, 5.4**

  - [ ]* 11.5 编写属性测试：提前终止逻辑
    - **Property 5: Early Termination on Failure**
    - **Validates: Requirements 7.2**

  - [ ]* 11.6 编写属性测试：会话继续逻辑
    - **Property 6: Session Continuation Logic**
    - **Validates: Requirements 7.3, 7.4**

- [x] 12. 实现音效集成
  - [x] 12.1 在各组件中集成音效系统
    - 在 QuestionDisplay 中播放正确/错误音效
    - 在 LevelTransition 中播放成功音效
    - 在按钮点击时播放点击音效
    - 使用 useAppStore 的 playSound 方法
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 12.2 编写属性测试：音效映射
    - **Property 11: Sound Effect Mapping**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

- [x] 13. Checkpoint - 确保所有测试通过
  - 运行所有单元测试和属性测试
  - 修复任何失败的测试
  - 确保代码质量和测试覆盖率
  - 如有问题，询问用户

- [-] 14. 端到端测试和优化
  - [ ] 14.1 进行完整流程测试
    - 测试从年龄选择到结果展示的完整流程
    - 测试不同年龄段的体验
    - 测试网络错误恢复
    - _Requirements: 所有需求_

  - [ ] 14.2 性能优化
    - 优化组件渲染性能
    - 优化 TTS 播放体验
    - 优化动画流畅度
    - _Requirements: 12.1, 12.2_

  - [ ] 14.3 浏览器兼容性测试
    - 测试主流浏览器（Chrome、Safari、Firefox）
    - 测试移动端浏览器
    - 修复兼容性问题
    - _Requirements: 所有需求_

- [ ] 15. 最终检查和文档
  - [ ] 15.1 代码审查和清理
    - 移除调试代码和 console.log
    - 确保代码符合项目规范
    - 添加必要的注释
    - _Requirements: 10.2, 10.3_

  - [ ] 15.2 更新相关文档
    - 更新 README（如需要）
    - 添加游戏使用说明
    - _Requirements: 所有需求_

## Notes

- 任务标记 `*` 的为可选测试任务，可以跳过以加快 MVP 开发
- 每个任务都引用了具体的需求编号，确保可追溯性
- 属性测试使用 fast-check 库，每个测试至少运行 100 次迭代
- 所有样式使用 Tailwind CSS utility classes，不创建新的 .css 文件
- 游戏逻辑与现有游戏类型完全隔离，保持独立性
- 优先实现核心功能，测试任务可以在后期补充
