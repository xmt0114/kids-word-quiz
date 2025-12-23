# 样式开发规范 (Future Development Rulebook)

为了防止样式污染和回归 Bug，所有未来的样式修改必须遵循以下规则：

### 1. 优先使用 Tailwind CSS
*   **原则**：尽可能使用 Tailwind 的 utility 优先。
*   **严禁**：严禁在 `index.css` 中添加针对特定组件的全局类名（如 `.header-button`）。
*   **建议**：如果某些 Tailwind 类名链过长且多处复用，优先考虑在 `index.css` 的 `@layer components` 中定义，或提取为 React 组件。

### 2. 字体的统一管理
*   **位置**：所有字体必须在 `tailwind.config.js` 的 `fontFamily` 中定义。
*   **分类**：
    *   `font-display`: 用于主要显示内容（默认 Fredoka）。
    *   `font-body`: 用于正文。
    *   `font-title`: 用于品牌标题（黄油体）。
    *   `font-chinese`: 用于中文特定样式（Noto Sans SC/楷体）。
*   **默认值**：已经在 `index.css` 的 `body` 标签上应用了 `font-body`。

### 3. 数据与视图分离
*   **状态管理**：Zustand Store (如 `appStore`) 只能保存功能性状态（例如 `isMuted`, `fontSizeMode`）。
*   **样式表现**：组件负责根据状态应用具体的 Tailwind 类名。禁止将原始 CSS 值（如 `#ff6b6b` 或 `24px`）存入 Store。

### 4. 样式隔离与组合
*   **命名规范**：禁止使用过于通用的 HTML 标签选择器（如 `img { ... }`）。
*   **类名组合**：使用 `cn()` (即 `clsx` + `tailwind-merge`) 来安全地合并类名，防止样式冲突。

### 5. 禁止内联样式
*   **严禁**：严禁使用 `style={{ ... }}` 硬编码布局或装饰性属性。
*   **例外**：仅允许将真正动态的值（如进度条宽度、实时计时的延迟时间）通过内联样式传递。
