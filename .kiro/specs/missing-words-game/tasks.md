# Implementation Plan: Missing Words Game

## Overview

实现"哪个词语不见了？"游戏的完整功能，包括独立的游戏页面、状态管理Hook、多种游戏模式、动画效果和音效系统。采用渐进式开发方式，确保每个步骤都能独立验证和测试。

## Tasks

- [x] 1. 设置项目基础结构和类型定义
  - 创建游戏相关的TypeScript类型定义
  - 设置基础的文件结构和导入路径
  - 定义游戏配置和状态接口
  - _Requirements: 9.1, 9.3_

- [x] 1.1 为基础类型定义编写单元测试
  - 测试类型定义的完整性和正确性
  - _Requirements: 9.1_

- [x] 2. 实现核心游戏状态管理Hook
  - [x] 2.1 创建useMissingWordsGame Hook基础结构
    - 实现游戏状态初始化
    - 实现基础的状态管理逻辑
    - _Requirements: 9.1, 9.3_

  - [x] 2.2 实现游戏配置管理
    - 实现配置的读取、保存和验证
    - 实现配置边界值检查
    - _Requirements: 2.3, 2.4, 2.5, 2.6_

  - [x] 2.3 为配置管理编写属性测试
    - **Property 2: Configuration Boundary Validation**
    - **Validates: Requirements 2.3, 2.4, 2.5**

  - [x] 2.4 实现游戏阶段转换逻辑
    - 实现观察阶段到幕布阶段的转换
    - 实现幕布阶段到答题阶段的转换
    - _Requirements: 4.3, 4.4, 5.1_

  - [x] 2.5 为游戏阶段转换编写属性测试
    - **Property 7: Game Phase Transitions**
    - **Validates: Requirements 4.3, 4.4**

- [x] 3. 创建词语数据管理系统
  - [x] 3.1 实现Mock词语数据
    - 创建中英文词语的Mock数据
    - 实现词语随机选择算法
    - _Requirements: 3.6, 3.7_

  - [x] 3.2 实现挑战模式词语计算逻辑
    - 实现n+(4-k)词语总数计算
    - 实现干扰项生成逻辑
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 3.3 为词语计算编写属性测试
    - **Property 12: Challenge Mode Word Calculation**
    - **Validates: Requirements 10.1, 10.2, 10.3**

  - [x] 3.4 为未来扩展预留数据接口
    - 定义WordDataSource接口结构
    - 实现可切换的数据源机制
    - _Requirements: 9.3_

- [x] 4. 实现WordCard组件
  - [x] 4.1 创建基础WordCard组件
    - 实现卡片的基础样式和布局
    - 实现中英文字体切换逻辑
    - _Requirements: 3.3, 3.8, 3.9_

  - [x] 4.2 为多语言字体应用编写属性测试
    - **Property 5: Multi-language Font Application**
    - **Validates: Requirements 3.8, 3.9**

  - [x] 4.3 实现卡片出现动画
    - 添加卡片出现的CSS动画效果
    - 实现随机位置布局算法
    - _Requirements: 3.2_

  - [x] 4.4 为卡片动画编写单元测试
    - 测试动画类的正确应用
    - 测试随机位置的生成
    - _Requirements: 3.2_

- [x] 5. 实现GameStage舞台组件
  - [x] 5.1 创建舞台布局组件
    - 实现舞台的基础样式和布局
    - 确保PC端一屏显示
    - _Requirements: 3.1, 3.5_

  - [x] 5.2 实现词语卡片的舞台布局
    - 实现卡片在舞台上的随机散落效果
    - 集成WordCard组件到舞台
    - _Requirements: 3.2_

  - [x] 5.3 为舞台布局编写属性测试
    - **Property 4: Word Card Display and Animation**
    - **Validates: Requirements 3.2, 3.4**

- [x] 6. 实现CurtainEffect幕布组件
  - [x] 6.1 创建幕布动画组件
    - 实现幕布合拢和拉开的CSS动画
    - 确保幕布完全遮挡舞台
    - _Requirements: 5.1, 5.3_

  - [x] 6.2 集成幕布效果到游戏流程
    - 实现幕布动画的时序控制
    - 在幕布遮挡期间执行词语移除
    - _Requirements: 5.2_

  - [x] 6.3 为幕布效果编写属性测试
    - **Property 8: Curtain Effect and Word Hiding**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 7. 实现GameControls交互控制组件
  - [x] 7.1 创建基础控制按钮
    - 实现"开始游戏"、"观察好了"、"显示答案"按钮
    - 实现按钮的条件显示逻辑
    - _Requirements: 4.1, 6.1_

  - [x] 7.2 实现计时器组件
    - 实现挑战模式的倒计时显示
    - 实现计时器到期的自动转换
    - _Requirements: 4.2, 4.4_

  - [x] 7.3 为模式特定UI编写属性测试
    - **Property 6: Mode-Specific UI Display**
    - **Validates: Requirements 4.1, 4.2**

  - [x] 7.4 实现答题选项组件
    - 实现单选和多选交互界面
    - 实现选项的随机排列
    - _Requirements: 6.3, 6.4, 6.5_

  - [x] 7.5 为答题模式编写属性测试
    - **Property 9: Answer Mode Selection**
    - **Validates: Requirements 6.4, 6.5**

- [x] 8. 实现音效管理系统
  - [x] 8.1 创建音效管理Hook
    - 实现音效文件的加载和播放
    - 实现不同场景的音效触发
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 8.2 为音效系统编写属性测试
    - **Property 11: Audio Feedback System**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

- [x] 9. 实现GameConfigModal配置弹窗
  - [x] 9.1 创建配置弹窗组件
    - 实现配置参数的输入界面
    - 实现配置保存和取消功能
    - _Requirements: 2.1, 2.2_

  - [x] 9.2 实现配置变更确认机制
    - 实现配置变更时的确认弹窗
    - 实现游戏重启逻辑
    - _Requirements: 2.7, 2.8_

  - [x] 9.3 为配置变更处理编写属性测试
    - **Property 3: Configuration Change Handling**
    - **Validates: Requirements 2.7, 2.8**

- [x] 10. 集成主游戏页面组件
  - [x] 10.1 创建MissingWordsGame主页面
    - 集成所有子组件到主页面
    - 实现整体布局和响应式设计
    - _Requirements: 8.5, 8.6_

  - [x] 10.2 实现答案反馈显示
    - 实现正确答案的绿色高亮
    - 实现错误答案的红色高亮
    - _Requirements: 6.6_

  - [x] 10.3 为答案反馈编写属性测试
    - **Property 10: Answer Feedback Display**
    - **Validates: Requirements 6.6**

- [x] 11. 集成路由和导航
  - [x] 11.1 添加游戏路由配置
    - 在路由系统中添加/missing-words-game路径
    - 确保路由独立性
    - _Requirements: 1.2, 9.2_

  - [x] 11.2 更新首页游戏卡片
    - 为observe类型游戏添加专门的卡片显示
    - 实现点击导航到游戏页面
    - _Requirements: 1.1, 1.2_

  - [x] 11.3 为游戏导航编写属性测试
    - **Property 1: Game Navigation and Routing**
    - **Validates: Requirements 1.2, 1.3**

- [x] 12. 实现游戏隔离性验证
  - [x] 12.1 验证游戏状态隔离
    - 确保游戏状态不影响其他系统
    - 验证Hook的独立性
    - _Requirements: 9.2, 9.4_

  - [x] 12.2 为游戏隔离性编写属性测试
    - **Property 14: Game State Isolation**
    - **Validates: Requirements 9.2, 9.4**

- [x] 13. 实现选项随机化
  - [x] 13.1 实现答案选项随机排列
    - 实现正确答案和干扰项的随机混合
    - 确保每次游戏选项顺序不同
    - _Requirements: 10.4_

  - [x] 13.2 为选项随机化编写属性测试
    - **Property 13: Answer Option Randomization**
    - **Validates: Requirements 10.4**

- [x] 14. 最终集成测试和优化
  - [x] 14.1 进行完整游戏流程测试
    - 测试休闲模式完整流程
    - 测试挑战模式完整流程
    - 验证所有功能正常工作

  - [x] 14.2 编写集成测试
    - 测试组件间的协作
    - 测试错误处理机制
    - 验证性能和用户体验

- [x] 15. Checkpoint - 确保所有测试通过
  - 确保所有测试通过，询问用户是否有问题需要解决

## Notes

- 所有任务都是必需的，确保从一开始就有全面的测试覆盖
- 每个任务都引用了具体的需求以确保可追溯性
- Checkpoint确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证特定示例和边界情况
- 游戏逻辑与现有系统完全隔离，确保不影响其他功能