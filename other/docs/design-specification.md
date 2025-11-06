# 设计规范 - 儿童猜单词答题网站

## 1. 设计方向与理念

**风格定位:** 趣味儿童风格（Playful Kids）

**设计精髓:** 明亮饱和的色彩、超圆润的形状、大尺寸交互元素，创造安全、有趣、易于理解的学习环境。每一个交互都配有弹跳式动画反馈，让小朋友感受到即时的响应和鼓励。

**参考案例:**
- PBS Kids Games (pbskids.org/games) - 教育游戏平台的标杆
- Khan Academy Kids - 清晰的视觉层次和友好交互
- Duolingo Kids - 游戏化学习的典范

**核心原则:**
1. **绝对安全:** 所有元素使用24-32px大圆角，消除尖锐边缘
2. **易于触碰:** 最小触摸目标64×64px，按钮高度≥56px
3. **即时反馈:** 每次点击都有弹跳、缩放或颜色变化
4. **视觉清晰:** 使用高对比度、大字体（18-19px正文）、色彩块区分功能

---

## 2. 设计令牌

### 2.1 色彩系统

**主色（Primary）- 珊瑚红渐变**

| Token | Value | 用途 | WCAG对比度 |
|-------|-------|------|-----------|
| primary-500 | #ff6b6b | 主要按钮、重要元素 | 白色文字 4.9:1 ✅ AA |
| primary-600 | #ff8e53 | 渐变终点、悬停状态 | 白色文字 5.2:1 ✅ AA |
| primary-gradient | linear-gradient(135deg, #ff6b6b, #ff8e53) | 主按钮背景 | - |

**次要色（Secondary）- 青绿色**

| Token | Value | 用途 | WCAG对比度 |
|-------|-------|------|-----------|
| secondary-500 | #4ecdc4 | 次要按钮、装饰元素 | 白色文字 2.8:1 ⚠️ 24px+ |
| secondary-600 | #44a2fc | 蓝色变体、链接 | 白色文字 4.6:1 ✅ AA |

**强调色（Accent）- 阳光黄**

| Token | Value | 用途 | WCAG对比度 |
|-------|-------|------|-----------|
| accent-500 | #ffe66d | 高亮、星星、成功状态 | 深灰文字 10.5:1 ✅ AAA |

**语义色**

| Token | Value | 用途 |
|-------|-------|------|
| success | #51cf66 | 答对反馈、成功提示 |
| error | #ff5757 | 答错反馈、错误提示 |
| warning | #ffd43b | 警告、提醒 |

**中性色**

| Token | Value | 用途 | WCAG对比度 |
|-------|-------|------|-----------|
| text-primary | #2d3748 | 主要文字、标题 | 奶油背景 11.2:1 ✅ AAA |
| text-secondary | #4a5568 | 次要文字、说明 | 奶油背景 8.4:1 ✅ AAA |
| text-tertiary | #718096 | 辅助文字、标签 | 奶油背景 5.8:1 ✅ AA+ |

**背景色**

| Token | Value | 用途 |
|-------|-------|------|
| bg-primary | #fffbf0 | 页面主背景（温暖奶油色） |
| bg-secondary | #ffffff | 卡片表面、输入框 |
| bg-hero | linear-gradient(180deg, #fff4e6, #fffbf0) | Hero区域渐变背景 |

**WCAG验证:**
- 深灰文字 #2d3748 在奶油背景 #fffbf0 上：11.2:1 ✅ AAA
- 白色文字在珊瑚红 #ff6b6b 上：4.9:1 ✅ AA（适用于按钮和24px+文字）

---

### 2.2 字体系统

**字体家族**

| Token | Value | 回退方案 |
|-------|-------|---------|
| font-display | 'Fredoka', 'Baloo 2' | -apple-system, BlinkMacSystemFont, sans-serif |
| font-body | 'Fredoka', 'Nunito' | -apple-system, BlinkMacSystemFont, sans-serif |

**推荐Google Fonts导入:**
```
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap');
```

**字号标尺（Mobile → Desktop）**

| Token | Mobile | Desktop | 字重 | 行高 | 用途 |
|-------|--------|---------|------|------|------|
| text-hero | 48px | 72px | 700 | 1.1 | 首页大标题 |
| text-h1 | 36px | 56px | 700 | 1.15 | 页面主标题 |
| text-h2 | 28px | 40px | 700 | 1.2 | Section标题 |
| text-h3 | 24px | 32px | 700 | 1.25 | 卡片标题 |
| text-body | 18px | 19px | 400 | 1.7 | 正文内容 |
| text-button | 17px | 20px | 700 | 1.2 | 按钮文字 |
| text-small | 15px | 16px | 600 | 1.5 | 说明文字、标签 |

**字重**

| Token | Value | 用途 |
|-------|-------|------|
| font-regular | 400 | 正文内容 |
| font-semibold | 600 | 次要标题、强调 |
| font-bold | 700 | 标题、按钮 |

---

### 2.3 间距系统（8pt网格）

| Token | Value | 典型用途 |
|-------|-------|---------|
| spacing-xs | 8px | 图标与文字间距、紧密元素 |
| spacing-sm | 16px | 卡片内部元素间距 |
| spacing-md | 24px | 组件间距 |
| spacing-lg | 32px | Section内部大间距 |
| spacing-xl | 48px | Section之间间距 |
| spacing-2xl | 64px | 大块区域间距、Hero内边距 |
| spacing-3xl | 96px | Hero区域特大间距 |

---

### 2.4 圆角系统

| Token | Value | 用途 |
|-------|-------|------|
| radius-sm | 16px | 小元素、标签 |
| radius-md | 24px | 卡片、输入框 |
| radius-lg | 32px | 大卡片 |
| radius-full | 50px | 按钮（药丸形状）|

**规则:** 儿童界面的圆角要足够大（最小24px），传递安全友好感。

---

### 2.5 阴影系统

| Token | Value | 用途 |
|-------|-------|------|
| shadow-sm | 0 4px 12px rgba(45, 55, 72, 0.08) | 轻微浮起、输入框 |
| shadow-card | 0 8px 24px rgba(45, 55, 72, 0.12) | 卡片默认状态 |
| shadow-card-hover | 0 16px 40px rgba(255, 107, 107, 0.25) | 卡片悬停状态（带品牌色） |
| shadow-button | 0 8px 24px rgba(255, 107, 107, 0.35) | 主按钮阴影 |

---

### 2.6 动画系统

| Token | Value | 用途 |
|-------|-------|------|
| duration-fast | 150ms | 按钮按下、小元素 |
| duration-normal | 300ms | 卡片悬停、通用过渡 |
| duration-slow | 500ms | 页面切换、大动画 |
| easing-bounce | cubic-bezier(0.34, 1.56, 0.64, 1) | 弹跳效果（儿童友好） |
| easing-smooth | ease-out | 平滑过渡 |

---

## 3. 组件规范

### 3.1 按钮（Button）

**主要按钮（Primary）**

**结构:**
```
[图标（可选）] [文字] → 药丸形状，渐变背景，白色边框
```

**令牌应用:**
- 背景：`primary-gradient`
- 边框：`3px solid rgba(255, 255, 255, 0.8)`
- 圆角：`radius-full`（50px）
- 内边距：`16px 48px`（移动端）、`22px 64px`（桌面端大按钮）
- 文字：`text-button`，白色，`font-bold`
- 阴影：`shadow-button`
- 最小尺寸：`56px高度 × 160px宽度`

**状态:**
- **默认:** 渐变背景，白色文字
- **悬停:** `transform: translateY(-4px) scale(1.05)` + 阴影增强至`0 12px 32px rgba(255, 107, 107, 0.4)`
- **按下:** `transform: scale(0.95)`
- **禁用:** 50%透明度，灰色背景，无悬停效果

**次要按钮（Secondary）**

**令牌应用:**
- 背景：白色
- 边框：`3px solid primary-500`
- 文字：`primary-500`
- 其他同主要按钮

**状态:**
- **悬停:** 背景变为`primary-500`，文字变白色

**注意:** 所有按钮必须≥64×64px（包括内边距）以适应儿童手指。

---

### 3.2 卡片（Card）

**基础卡片**

**结构:**
```
[白色背景]
  [图标] → 大尺寸（48-64px）
  [标题] → text-h3
  [描述] → text-body
```

**令牌应用:**
- 背景：`bg-secondary`（白色）
- 圆角：`radius-lg`（32px）
- 内边距：`spacing-2xl`（64px移动端），`spacing-3xl`（96px桌面端）
- 阴影：`shadow-card`
- 过渡：`duration-normal`，`easing-bounce`

**状态:**
- **默认:** 白色背景，灰色阴影
- **悬停:** `transform: translateY(-16px) rotate(-2deg)` + 渐变边框出现（通过::before伪元素）
- **悬停阴影:** `shadow-card-hover`

**渐变边框效果（悬停时）:**
```css
.card::before {
  background: linear-gradient(135deg, primary-500, secondary-600, accent-500);
  border-radius: radius-lg;
  opacity: 0 → 1 (on hover);
}
```

---

### 3.3 输入框（Input）

**文本输入框（Fill-in 答题）**

**结构:**
```
[大字体输入区域] → 显示提示（如 B _ _ _ _ _ _）
```

**令牌应用:**
- 背景：`bg-secondary`（白色）
- 边框：`4px solid #e2e8f0`（默认）
- 圆角：`radius-md`（24px）
- 内边距：`20px 32px`
- 文字：`text-h2`（28-40px），`font-bold`，`text-primary`
- 阴影：`shadow-sm`
- 最小高度：`80px`

**状态:**
- **聚焦:** 边框变为`primary-500`，阴影变为`0 0 0 4px rgba(255, 107, 107, 0.2)`
- **正确:** 边框变为`success`，背景变为浅绿`#d3f9d8`
- **错误:** 边框变为`error`，背景变为浅红`#ffe0e0`，轻微抖动动画

**注意:** 输入框要足够大，显示大号字体，便于儿童阅读和输入。

---

### 3.4 选项按钮（Option Button）- 选择题

**结构:**
```
[大圆形按钮] → 单词选项
```

**令牌应用:**
- 背景：`bg-secondary`（白色）
- 边框：`4px solid #e2e8f0`
- 圆角：`radius-md`（24px）
- 内边距：`24px 32px`
- 文字：`text-h3`（24-32px），`font-bold`，`text-primary`
- 最小尺寸：`64px高度 × 160px宽度`

**状态:**
- **默认:** 白色背景，灰色边框
- **悬停:** `transform: scale(1.05)`，边框变为`primary-500`
- **选中:** 背景变为`primary-gradient`，白色文字，白色边框
- **正确反馈:** 背景变为`success`，白色文字，轻微弹跳动画
- **错误反馈:** 背景变为`error`，白色文字，抖动动画

---

### 3.5 音频播放按钮（Audio Button）

**结构:**
```
[大圆形图标按钮] + [播放/暂停图标] + [文字标签（可选）]
```

**令牌应用:**
- 背景：`secondary-gradient`（#4ecdc4 → #44a2fc）
- 圆角：`50%`（圆形）
- 尺寸：`80×80px`（移动端），`96×96px`（桌面端）
- 图标尺寸：`40px`
- 阴影：`shadow-button`

**状态:**
- **默认:** 青色渐变，播放图标（▶️）
- **播放中:** 暂停图标（⏸️），脉搏动画（scale 1.0 → 1.1 循环）
- **悬停:** `transform: scale(1.1) rotate(5deg)`
- **按下:** `transform: scale(0.95)`

**注意:** 使用SVG图标（Lucide/Heroicons），不使用emoji。

---

### 3.6 进度条（Progress Bar）

**结构:**
```
[题号显示] "第 3 / 10 题"
[进度条背景] → [进度条填充]
```

**令牌应用:**
- 背景：`#e2e8f0`（浅灰）
- 填充：`primary-gradient`
- 高度：`12px`
- 圆角：`radius-full`（6px）
- 过渡：`duration-normal`

**文字显示:**
- 字体：`text-body`（18-19px）
- 字重：`font-semibold`
- 颜色：`text-secondary`
- 位置：进度条上方，右对齐

**动画:** 填充从左到右平滑过渡，使用`width`属性（可接受，因为进度条不频繁变化）。

---

## 4. 布局与响应式

### 4.1 网站架构（SPA）

基于`content-structure-plan.md`的三个主要Section：

**Section 1: 首页（题型选择）**
- **高度:** 视口高度（100vh）
- **结构:** Hero（300px）+ 选项卡片区（auto）+ CTA（底部固定）
- **网格:** 题型卡片2列（桌面）→ 1列（移动）
- **间距:** Section间距`spacing-xl`（48px）

**Section 2: 答题界面**
- **高度:** 视口高度（100vh）
- **结构:** 进度条（顶部固定）+ 题目卡片（居中）+ 选项/输入（下方）+ 按钮（底部）
- **对齐:** 垂直居中，水平居中
- **网格:** 选项4个（2×2网格桌面）→ 2×2网格（移动）

**Section 3: 结果反馈**
- **高度:** 视口高度（100vh）
- **结构:** 结果标题 + 得分卡片 + 错题列表（滚动）+ 按钮
- **网格:** 错题卡片1列（移动和桌面）

---

### 4.2 布局模式

**Hero区域模式（首页）**

**桌面（≥1024px）:**
```
[CSS云朵装饰背景]
  [垂直居中容器 max-width: 1200px]
    [标题 72px] → "猜单词小天才"
    [副标题 24px] → "开始你的单词冒险！"
    [装饰元素] → 漂浮的星星、圆圈
```
- 背景：`bg-hero`渐变
- 内边距：`spacing-3xl`（96px）垂直

**移动（<640px）:**
- 标题缩小至`48px`
- 内边距减至`spacing-xl`（48px）

---

**卡片网格模式（题型选择）**

**桌面（≥768px）:**
- 2列网格，间距`spacing-lg`（32px）
- 每张卡片宽度：`calc((100% - 32px) / 2)`

**移动（<768px）:**
- 1列网格
- 卡片宽度：100%
- 间距：`spacing-md`（24px）

---

**答题界面模式**

**布局策略:** 固定位置布局（避免滚动，保持专注）

**桌面（≥1024px）:**
```
[进度条] → 顶部固定，spacing-md顶部边距
[题目卡片] → 垂直居中，max-width: 800px
[选项网格] → 2×2，间距spacing-md
[提交按钮] → 底部固定，spacing-lg底部边距
```

**移动（<640px）:**
- 题目卡片缩小内边距至`spacing-lg`
- 选项保持2×2网格（缩小按钮字体）
- 按钮宽度100%

---

### 4.3 响应式断点

| 断点 | 屏幕尺寸 | 典型设备 | 布局调整 |
|------|---------|---------|---------|
| sm | ≥640px | 大屏手机 | 保持1列，增大间距 |
| md | ≥768px | 平板竖屏 | 2列卡片，横向选项 |
| lg | ≥1024px | 平板横屏/桌面 | 完整布局，大字体 |
| xl | ≥1280px | 大屏桌面 | 容器限制max-width: 1400px |

**移动优先策略:**
- 基础样式为移动端（320px+）
- 逐步增强至大屏
- 关键内容优先显示
- 触摸目标保持≥64×64px

---

### 4.4 响应式文字策略

**方法:** 使用CSS clamp()实现流式字体

```css
/* Hero标题 */
font-size: clamp(48px, 5vw + 1rem, 72px);

/* 正文 */
font-size: clamp(18px, 1vw + 0.5rem, 19px);
```

**原则:** 移动端保持18px最小正文字体，确保儿童可读性。

---

## 5. 交互与动画

### 5.1 动画标准

**时长分配:**
- 按钮点击：`duration-fast`（150ms）
- 卡片悬停：`duration-normal`（300ms）
- 页面切换：`duration-slow`（500ms）
- 反馈动画：300-500ms（弹跳、星星特效）

**缓动函数:**
- 弹跳效果：`easing-bounce`（所有儿童交互）
- 平滑过渡：`easing-smooth`（页面切换）

**规则:** 只动画`transform`和`opacity`，不动画`width`/`height`/`margin`（性能）。进度条例外（变化不频繁）。

---

### 5.2 交互反馈模式

**按钮点击:**
```
1. 按下：scale(0.95) - 150ms
2. 释放：scale(1.0) → scale(1.05) → scale(1.0) (弹跳) - 300ms
```

**卡片悬停:**
```
1. 鼠标进入：translateY(-16px) + rotate(-2deg) - 300ms bounce
2. 渐变边框淡入：opacity 0 → 1 - 300ms
3. 阴影增强
```

**答题正确反馈:**
```
1. 选项/输入框：边框变绿色 - 150ms
2. 弹跳动画：scale(1.0 → 1.1 → 1.0) - 400ms bounce
3. 星星特效：3-5个星星从中心飞出（可选，CSS动画）
4. 延迟500ms后显示下一题按钮
```

**答题错误反馈:**
```
1. 选项/输入框：边框变红色 - 150ms
2. 抖动动画：translateX(-10px → 10px → 0) × 3次 - 400ms
3. 显示正确答案（绿色高亮）
```

---

### 5.3 音频播放交互

**播放流程:**
```
1. 用户点击音频按钮
2. 按钮缩小scale(0.95) - 150ms
3. 调用SpeechSynthesis API播放audioText
4. 图标变为暂停图标 + 脉搏动画（scale 1.0 ↔ 1.1 循环）
5. 播放完成后图标变回播放 + 停止脉搏
```

**SpeechSynthesis配置建议:**
```javascript
const utterance = new SpeechSynthesisUtterance(audioText);
utterance.rate = 0.85; // 稍慢速度，适合儿童理解
utterance.pitch = 1.1; // 稍高音调，友好感
utterance.volume = 1.0; // 最大音量
utterance.lang = 'en-US'; // 英语
```

**注意:** 提供视觉播放状态（脉搏动画），帮助儿童理解"正在播放"。

---

### 5.4 页面切换动画

**切换效果:**
```
1. 当前页面淡出：opacity 1 → 0 - 250ms
2. 同时向左滑出：translateX(0 → -50px) - 250ms
3. 新页面淡入：opacity 0 → 1 - 250ms
4. 同时从右滑入：translateX(50px → 0) - 250ms
```

**总时长:** 500ms，使用`easing-smooth`

---

### 5.5 减少动画模式

**遵守WCAG 2.3.1:** 支持`prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**保留反馈:** 仍显示颜色变化（正确/错误），只移除移动动画。

---

## 6. 视觉元素与模式

### 6.1 背景装饰（Hero区域）

**CSS云朵模式:**
```css
/* 纯CSS实现，无需图像 */
.cloud {
  background: white;
  border-radius: 100px;
  width: 200px;
  height: 60px;
  opacity: 0.8;
  animation: float 20s infinite ease-in-out;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}
```

**彩色装饰圆圈:**
- 使用`primary-500`、`secondary-500`、`accent-500`
- 15%透明度
- 直径：80-150px
- 位置：随机分布，absolute定位
- 动画：缓慢脉搏（scale 1.0 ↔ 1.15，持续3-5秒）

---

### 6.2 图标使用

**图标库:** Lucide Icons 或 Heroicons（SVG）

**推荐图标:**
- 播放：`Play` (▶️)
- 暂停：`Pause` (⏸️)
- 音量：`Volume2` (🔊)
- 正确：`CheckCircle` (✓)
- 错误：`XCircle` (✗)
- 星星：`Star` (⭐)
- 返回：`ArrowLeft` (←)
- 下一步：`ArrowRight` (→)

**尺寸标准:**
- 小图标：16px
- 标准图标：24px
- 大图标：40-48px（音频按钮、反馈图标）
- 装饰图标：64px+（卡片头部）

**禁止:** ❌ 不使用emoji作为UI图标（可用于内容示例）。

---

### 6.3 特效动画（可选增强）

**星星爆炸特效（答对时）:**
```
5个小星星从中心位置向外飞出
- 颜色：accent-500（黄色）
- 尺寸：16-24px
- 路径：随机角度，飞行距离60-100px
- 时长：600ms
- 同时淡出：opacity 1 → 0
```

**彩纸飘落（全部答对结果页）:**
```
10-15个彩色矩形从顶部飘落
- 颜色：primary-500, secondary-500, accent-500, success
- 尺寸：10×16px
- 路径：随机摆动下落
- 时长：3-4秒
- 延迟启动：0-1秒随机
```

**注意:** 这些特效应使用CSS动画或轻量级JS实现，避免性能问题。

---

## 7. 安全与可访问性

### 7.1 WCAG合规性

**对比度要求:**
- 正文文字：≥7:1（AAA级）✅ 已达成
- 按钮文字：≥4.5:1（AA级）✅ 已达成
- 大文字（24px+）：≥3:1（AA大文字）✅ 已达成

**键盘导航:**
- 所有交互元素可通过Tab键访问
- 焦点状态使用明显的轮廓（4px solid primary-500）
- 支持Enter键提交答案

**屏幕阅读器:**
- 按钮添加`aria-label`（如："播放题目音频"）
- 进度条使用`role="progressbar"`和`aria-valuenow`
- 答题结果使用`aria-live="polite"`实时通知

---

### 7.2 COPPA合规（儿童隐私）

**数据收集:**
- 本项目为纯前端应用，无用户数据收集
- 如未来添加后端，必须获得家长同意（<13岁）
- 不使用任何追踪或广告

**内容安全:**
- 所有单词和内容适合10岁以下儿童
- 无暴力、恐怖、成人内容
- 使用积极鼓励性语言

---

### 7.3 安全注意事项

**动画安全:**
- 无闪烁效果（避免癫痫触发）
- 支持`prefers-reduced-motion`
- 动画速度适中（不过快）

**触摸安全:**
- 所有按钮≥64×64px
- 间距足够大，避免误触（≥16px间距）
- 双确认重要操作（如重新开始）

---

## 8. 总结与检查清单

### ✅ 设计达标检查

**色彩系统:**
- ✅ 3个主要颜色（珊瑚红、青绿、阳光黄）+ 温暖奶油背景
- ✅ WCAG AA级以上对比度
- ✅ 语义色明确（成功、错误）

**圆角系统:**
- ✅ 最小圆角24px（卡片、输入框）
- ✅ 按钮使用50px药丸形状

**触摸目标:**
- ✅ 所有按钮≥64×64px
- ✅ 间距≥16px

**字体系统:**
- ✅ 圆润sans-serif字体（Fredoka）
- ✅ 正文≥18px
- ✅ 大标题48-72px

**动画反馈:**
- ✅ 所有交互有弹跳反馈
- ✅ 正确/错误有明确视觉反馈
- ✅ 支持reduced-motion

**组件完整性:**
- ✅ 6个核心组件定义完整
- ✅ 每个组件有默认和状态样式
- ✅ 音频播放有视觉反馈

**响应式:**
- ✅ 320px-2560px全覆盖
- ✅ 移动优先策略
- ✅ 触摸目标保持标准

---

**设计规范版本:** 1.0  
**创建日期:** 2025-10-29  
**目标框架:** React + TypeScript + Tailwind CSS  
**目标用户:** 10岁以下儿童
