# Requirements Document

## Introduction

"哪个词语不见了？"是一个专为儿童设计的观察记忆游戏。游戏通过让玩家观察散落在舞台上的词语卡片，然后随机隐藏部分词语，要求玩家识别出消失的词语来训练观察力和记忆力。游戏提供休闲和挑战两种模式，界面色彩鲜艳，具有丰富的动画效果和音效反馈。

## Glossary

- **Missing_Words_Game**: 哪个词语不见了游戏系统
- **Stage_Area**: 游戏舞台区域，词语卡片显示的主要区域
- **Word_Card**: 词语卡片，显示单个词语的UI组件，支持中英文显示
- **Chinese_Word**: 中文词语，最多不超过4个字符
- **English_Word**: 英文单词
- **Curtain_Effect**: 幕布效果，用于遮挡和显示舞台的动画
- **Casual_Mode**: 休闲模式，不限时观察，手动触发词语消失
- **Challenge_Mode**: 挑战模式，限时观察，自动消失词语并提供选择题
- **Observation_Phase**: 观察阶段，玩家观察词语卡片的阶段
- **Answer_Phase**: 答题阶段，玩家识别消失词语的阶段
- **Game_Config**: 游戏配置，包含游戏参数的设置

## Requirements

### Requirement 1: 游戏入口和导航

**User Story:** 作为用户，我想要从首页进入"哪个词语不见了？"游戏，以便开始游戏体验。

#### Acceptance Criteria

1. WHEN 用户在首页看到type为"observe"的游戏卡片 THEN Missing_Words_Game SHALL 显示专门的游戏入口卡片
2. WHEN 用户点击"开始游戏"按钮 THEN Missing_Words_Game SHALL 导航到独立的游戏页面
3. THE Missing_Words_Game SHALL 不依赖于教材选择
4. THE Missing_Words_Game SHALL 不需要独立的设置页面

### Requirement 2: 游戏配置管理

**User Story:** 作为用户，我想要配置游戏参数，以便调整游戏难度和体验。

#### Acceptance Criteria

1. WHEN 用户点击右上角配置按钮 THEN Game_Config SHALL 显示配置面板
2. THE Game_Config SHALL 支持选择游戏模式（休闲模式/挑战模式）
3. THE Game_Config SHALL 支持设置观察词语数量n（3<=n<=8，默认4）
4. THE Game_Config SHALL 支持设置消失词语数量k（1<=k<=3，默认1）
5. WHERE 挑战模式被选择 THE Game_Config SHALL 支持设置观察时间t（3<=t<=10，默认5秒）
6. THE Game_Config SHALL 保存用户的配置选择
7. WHEN 用户保存配置更改 THEN Missing_Words_Game SHALL 显示确认弹框提示用户当前游戏将被中断
8. WHEN 用户确认配置更改 THEN Missing_Words_Game SHALL 使用新参数重新开始游戏

### Requirement 3: 游戏舞台和词语显示

**User Story:** 作为用户，我想要看到词语以卡片形式散落在舞台上，以便进行观察记忆。

#### Acceptance Criteria

1. THE Stage_Area SHALL 在页面中央显示类似舞台的区域
2. WHEN 游戏开始 THEN Word_Card SHALL 以动画效果随机散落在舞台上
3. THE Word_Card SHALL 使用卡牌样式设计
4. WHEN Word_Card 出现 THEN Missing_Words_Game SHALL 播放"突突突突"类似的音效
5. THE Stage_Area SHALL 与交互区域一起在PC端一屏内完整显示
6. THE Missing_Words_Game SHALL 使用本地mock数据提供词语
7. THE Word_Card SHALL 支持显示中文词语（最多4个字符）和英文单词
8. WHERE 显示中文词语 THE Word_Card SHALL 使用KaiTi字体
9. WHERE 显示英文单词 THE Word_Card SHALL 使用Fredoka字体

### Requirement 4: 观察阶段交互

**User Story:** 作为用户，我想要有足够的时间观察词语，以便记住它们的位置和内容。

#### Acceptance Criteria

1. WHERE 休闲模式被选择 WHEN 观察阶段开始 THEN Missing_Words_Game SHALL 显示"观察好了"按钮
2. WHERE 挑战模式被选择 WHEN 观察阶段开始 THEN Missing_Words_Game SHALL 显示倒计时器
3. WHERE 休闲模式 WHEN 用户点击"观察好了" THEN Missing_Words_Game SHALL 进入词语消失阶段
4. WHERE 挑战模式 WHEN 倒计时结束 THEN Missing_Words_Game SHALL 自动进入词语消失阶段

### Requirement 5: 词语消失和幕布效果

**User Story:** 作为用户，我想要看到词语通过幕布效果消失，以便增加游戏的戏剧性和趣味性。

#### Acceptance Criteria

1. WHEN 观察阶段结束 THEN Curtain_Effect SHALL 合拢遮挡整个舞台
2. WHILE 幕布遮挡舞台 THE Missing_Words_Game SHALL 随机移除k个词语卡片
3. WHEN 词语移除完成 THEN Curtain_Effect SHALL 拉开显示剩余词语
4. THE Curtain_Effect SHALL 具有流畅的动画效果

### Requirement 6: 答题阶段交互

**User Story:** 作为用户，我想要通过不同方式确认消失的词语，以便完成游戏挑战。

#### Acceptance Criteria

1. WHERE 休闲模式 WHEN 词语消失后 THEN Missing_Words_Game SHALL 显示"显示答案"按钮
2. WHERE 休闲模式 WHEN 用户点击"显示答案" THEN Missing_Words_Game SHALL 直接显示消失的词语
3. WHERE 挑战模式 WHEN 词语消失后 THEN Missing_Words_Game SHALL 显示4个选项供用户选择
4. WHERE 挑战模式 WHEN k=1 THEN Missing_Words_Game SHALL 提供单选交互
5. WHERE 挑战模式 WHEN k>1 THEN Missing_Words_Game SHALL 提供多选交互
6. WHEN 用户提交答案 THEN Missing_Words_Game SHALL 显示正确答案（绿色）和错误答案（红色）

### Requirement 7: 音效和视觉反馈

**User Story:** 作为用户，我想要丰富的音效和视觉反馈，以便获得更好的游戏体验。

#### Acceptance Criteria

1. WHEN Word_Card 出现 THEN Missing_Words_Game SHALL 播放卡片出现音效
2. WHEN 用户进行交互 THEN Missing_Words_Game SHALL 播放相应的点击音效
3. WHEN 答案正确 THEN Missing_Words_Game SHALL 播放成功音效
4. WHEN 答案错误 THEN Missing_Words_Game SHALL 播放错误音效
5. THE Missing_Words_Game SHALL 使用/public/sounds目录下的音效文件

### Requirement 8: 界面设计和布局

**User Story:** 作为儿童用户，我想要色彩鲜艳、具有引导性的界面，以便轻松理解和操作游戏。

#### Acceptance Criteria

1. THE Missing_Words_Game SHALL 使用色彩鲜艳的设计风格
2. THE Missing_Words_Game SHALL 提供即时的视觉反馈
3. THE Missing_Words_Game SHALL 具有引导性的界面元素
4. THE Missing_Words_Game SHALL 与网站整体UI风格保持一致
5. THE Missing_Words_Game SHALL 在PC端一屏内完整显示所有内容（包括舞台区域和交互区域）
6. THE Missing_Words_Game SHALL 将交互按钮放置在页面下方便于点击

### Requirement 9: 游戏状态管理

**User Story:** 作为开发者，我想要独立的游戏状态管理，以便与其他游戏逻辑隔离。

#### Acceptance Criteria

1. THE Missing_Words_Game SHALL 使用Custom Hook管理游戏状态
2. THE Missing_Words_Game SHALL 与通用游戏逻辑完全隔离
3. THE Missing_Words_Game SHALL 独立管理游戏配置、词语数据和游戏进度
4. THE Missing_Words_Game SHALL 不影响其他游戏的功能

### Requirement 10: 挑战模式词语数量计算

**User Story:** 作为用户，我想要在挑战模式下有合适数量的干扰选项，以便增加游戏难度。

#### Acceptance Criteria

1. WHERE 挑战模式被选择 THE Missing_Words_Game SHALL 准备总词数为n+(4-k)的词语
2. WHERE 挑战模式被选择 THE Missing_Words_Game SHALL 使用(4-k)个词语作为干扰项
3. WHERE 挑战模式被选择 THE Missing_Words_Game SHALL 确保选项总数固定为4个
4. THE Missing_Words_Game SHALL 随机排列正确答案和干扰项的顺序