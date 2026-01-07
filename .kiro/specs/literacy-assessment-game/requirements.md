# Requirements Document

## Introduction

儿童识字量测试游戏是一个独立的游戏类型，专为3-10岁儿童设计，通过自适应测试评估儿童的汉字识字量。游戏采用色彩鲜艳、即时反馈的界面设计，通过语音提示和选择题形式进行测试，最终生成正态分布图展示测试结果。

## Glossary

- **Literacy_Assessment_Game**: 儿童识字量测试游戏系统
- **Assessment_Session**: 一次完整的测试会话，包含多个等级包
- **Level_Packet**: 等级题包，包含基础题集和急救题集
- **Base_Set**: 基础题集，用于初步评估当前等级掌握情况
- **Rescue_Set**: 急救题集，当基础题正确率处于中间区间时触发
- **Question_Item**: 单个测试题目，包含汉字、音频提示文本和混淆选项
- **TTS_Engine**: 文本转语音引擎，用于播放题目音频
- **Normal_Distribution_Chart**: 正态分布图，展示用户识字量在同龄人中的位置
- **Age_Validator**: 年龄验证器，限制用户年龄在3-10岁之间
- **Result_Submitter**: 结果提交器，向后端提交测试结果

## Requirements

### Requirement 1: 年龄选择与验证

**User Story:** 作为用户，我想要选择儿童的出生年月日，以便系统能够根据年龄提供适合的测试题目。

#### Acceptance Criteria

1. WHEN 用户进入游戏页面 THEN THE Literacy_Assessment_Game SHALL 显示出生日期选择界面
2. WHEN 用户选择出生日期 THEN THE Age_Validator SHALL 计算年龄并验证是否在3-10岁范围内
3. IF 用户年龄小于3岁或大于10岁 THEN THE Age_Validator SHALL 显示错误提示并阻止继续
4. WHEN 用户完成有效的年龄选择 THEN THE Literacy_Assessment_Game SHALL 保存该日期供下次测试使用
5. WHEN 用户再次进入游戏 THEN THE Literacy_Assessment_Game SHALL 自动填充上次保存的出生日期

### Requirement 2: 测试会话初始化

**User Story:** 作为用户，我想要开始测试，以便系统能够获取适合当前年龄段的题目。

#### Acceptance Criteria

1. WHEN 用户确认出生日期并开始测试 THEN THE Assessment_Session SHALL 调用 start_assessment_v6 接口并传入出生日期参数
2. WHEN 后端返回题包数据 THEN THE Assessment_Session SHALL 解析并存储 session_id 和 packets 数组
3. WHEN 接收到 packets 数据 THEN THE Assessment_Session SHALL 验证每个 Level_Packet 包含 level、config、base_set、rescue_set 和 level_info 字段
4. IF 接口调用失败 THEN THE Assessment_Session SHALL 显示错误信息并允许用户重试

### Requirement 3: 题目展示与音频播放

**User Story:** 作为用户，我想要听到题目的语音提示并看到选项，以便我能够选择正确的汉字。

#### Acceptance Criteria

1. WHEN 展示题目 THEN THE Literacy_Assessment_Game SHALL 显示4个选项，包含1个正确答案和最多3个混淆选项
2. WHEN 题目加载完成 THEN THE TTS_Engine SHALL 自动播放 audio_prompt_text 的语音
3. WHEN 用户点击选项 THEN THE Literacy_Assessment_Game SHALL 立即提供视觉和音效反馈
4. WHEN 用户选择答案后 THEN THE Literacy_Assessment_Game SHALL 记录答案并进入下一题
5. THE Literacy_Assessment_Game SHALL 确保选项顺序随机化以避免位置偏好

### Requirement 4: 基础题集评估逻辑

**User Story:** 作为系统，我需要根据基础题集的表现判断是否需要触发急救题集。

#### Acceptance Criteria

1. WHEN 用户完成 Base_Set 所有题目 THEN THE Literacy_Assessment_Game SHALL 计算正确率
2. IF 正确率大于等于 pass_threshold THEN THE Literacy_Assessment_Game SHALL 标记该等级为通过且不触发 Rescue_Set
3. IF 正确率小于等于 drop_threshold THEN THE Literacy_Assessment_Game SHALL 标记该等级为失败且不触发 Rescue_Set
4. IF 正确率在 drop_threshold 和 pass_threshold 之间 THEN THE Literacy_Assessment_Game SHALL 触发 Rescue_Set
5. THE Literacy_Assessment_Game SHALL 使用 Level_Packet 中的 config 字段提供的阈值进行判断

### Requirement 5: 急救题集评估逻辑

**User Story:** 作为系统，当基础题表现处于中间区间时，我需要通过急救题集进行更准确的评估。

#### Acceptance Criteria

1. WHEN Rescue_Set 被触发 THEN THE Literacy_Assessment_Game SHALL 展示 rescue_set 中的所有题目
2. WHEN 用户完成 Rescue_Set THEN THE Literacy_Assessment_Game SHALL 计算基础题和急救题的总正确率
3. IF 总正确率大于等于 pass_threshold THEN THE Literacy_Assessment_Game SHALL 标记该等级为通过
4. IF 总正确率小于 pass_threshold THEN THE Literacy_Assessment_Game SHALL 标记该等级为失败

### Requirement 6: 等级通过提示

**User Story:** 作为用户，当我通过一个等级时，我想看到鼓励性的提示，以便获得成就感。

#### Acceptance Criteria

1. WHEN 用户通过某个等级 THEN THE Literacy_Assessment_Game SHALL 显示该等级的 level_info 中的 pass_message
2. WHEN 显示通过提示 THEN THE Literacy_Assessment_Game SHALL 展示 level_info 中的 title 和 vocab_milestone
3. THE Literacy_Assessment_Game SHALL 使用色彩鲜艳和动画效果增强视觉吸引力
4. WHEN 显示通过提示期间 THEN THE Literacy_Assessment_Game SHALL 在后台准备下一个等级的题目

### Requirement 7: 结果提交与测试流程控制

**User Story:** 作为系统，我需要将测试结果提交给后端并根据响应决定继续测试或结束。

#### Acceptance Criteria

1. WHEN 用户完成当前所有 packets THEN THE Result_Submitter SHALL 构造 results 数组并调用 submit_packet_v6 接口
2. WHEN 某个 packet 结果为 passed: false THEN THE Result_Submitter SHALL 立即停止处理剩余 packets 并提交当前结果
3. WHEN 后端返回 status: "active" THEN THE Assessment_Session SHALL 解析新的 packets 并继续测试流程
4. WHEN 后端返回 status: "completed" THEN THE Assessment_Session SHALL 结束测试并展示最终结果
5. THE Result_Submitter SHALL 在每次提交时包含 session_id 和完整的 results 数组

### Requirement 8: 最终结果展示

**User Story:** 作为用户，我想看到我的识字量测试结果以正态分布图的形式展示，以便了解我在同龄人中的水平。

#### Acceptance Criteria

1. WHEN 测试完成 THEN THE Normal_Distribution_Chart SHALL 展示正态分布曲线
2. THE Normal_Distribution_Chart SHALL 将横轴分为大师级（>95分位）、高手级（>80分位）、标准级（>40分位）和新手级（其余）四个区间
3. WHEN 用户识字量超过年龄段最高值 THEN THE Normal_Distribution_Chart SHALL 将用户位置固定在最右侧
4. THE Normal_Distribution_Chart SHALL 显示用户的 score、user_age、user_percentile 和 level_title
5. THE Normal_Distribution_Chart SHALL 显示 conclusion 中的 text 和 comparison_text
6. THE Normal_Distribution_Chart SHALL 使用 chart_data 中的 mean、max_val 和 std_dev 绘制正态分布曲线

### Requirement 9: 音效反馈

**User Story:** 作为用户，我想在游戏过程中听到音效反馈，以便获得更好的交互体验。

#### Acceptance Criteria

1. WHEN 用户选择正确答案 THEN THE Literacy_Assessment_Game SHALL 播放成功音效
2. WHEN 用户选择错误答案 THEN THE Literacy_Assessment_Game SHALL 播放错误音效
3. WHEN 用户通过等级 THEN THE Literacy_Assessment_Game SHALL 播放庆祝音效
4. WHEN 用户点击按钮或选项 THEN THE Literacy_Assessment_Game SHALL 播放点击音效
5. THE Literacy_Assessment_Game SHALL 使用现有音效库中的音效文件

### Requirement 10: 游戏类型独立性

**User Story:** 作为开发者，我需要确保新游戏类型与现有游戏逻辑隔离，以便维护和扩展。

#### Acceptance Criteria

1. THE Literacy_Assessment_Game SHALL 使用独立的游戏类型标识 "shizi_test"
2. THE Literacy_Assessment_Game SHALL 在独立的组件文件夹中实现所有功能
3. THE Literacy_Assessment_Game SHALL 使用独立的 Custom Hook 管理游戏状态
4. THE Literacy_Assessment_Game SHALL 不依赖于教材选择功能
5. THE Literacy_Assessment_Game SHALL 不需要独立的设置页面
6. THE Literacy_Assessment_Game SHALL 不与 Universal、typing 或 observe 游戏类型的代码耦合

### Requirement 11: 首页入口展示

**User Story:** 作为用户，我想在首页看到识字量测试游戏的卡片入口，以便快速开始测试。

#### Acceptance Criteria

1. WHEN 用户访问首页 THEN THE Literacy_Assessment_Game SHALL 在游戏卡片列表中显示
2. WHEN 用户点击"开始游戏"按钮 THEN THE Literacy_Assessment_Game SHALL 导航到游戏页面
3. THE Literacy_Assessment_Game SHALL 在首页卡片上显示游戏名称和简短描述
4. THE Literacy_Assessment_Game SHALL 使用与其他游戏卡片一致的视觉风格

### Requirement 12: 界面设计要求

**User Story:** 作为儿童用户，我需要一个色彩鲜艳、易于理解的界面，以便轻松完成测试。

#### Acceptance Criteria

1. THE Literacy_Assessment_Game SHALL 使用色彩鲜艳的配色方案
2. THE Literacy_Assessment_Game SHALL 提供即时的视觉反馈
3. THE Literacy_Assessment_Game SHALL 使用大字体和清晰的按钮
4. THE Literacy_Assessment_Game SHALL 提供明确的操作引导
5. THE Literacy_Assessment_Game SHALL 使用 Tailwind CSS utility classes 实现所有样式
6. THE Literacy_Assessment_Game SHALL 与网站整体 UI 风格保持协调
