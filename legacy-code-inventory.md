# Guess_Word 遗留代码清单

## 路由定义 (src/App.tsx)
- `/guess-word/settings` → 应迁移到 `/games/guess-word/settings`
- `/guess-word/game` → 应迁移到 `/games/guess-word/play`
- `/guess-word/result` → 应迁移到通用结果页面或 `/games/guess-word/result`
- `/guess-word/data` → 管理员功能，需重新组织
- `/guess-word/invite` → 管理员功能，需重新组织

## 组件文件 (需要移除)
1. `src/components/GuessWordSettingsPage.tsx` - 功能已被 GameSettingsPage 覆盖
2. `src/components/GuessWordGamePage.tsx` - 功能已被 UniversalGamePage 覆盖
3. `src/components/GuessWordResultPage.tsx` - 可以使用通用结果处理
4. `src/components/GuessWordSettingsSimple.tsx` - 未使用的简化版本
5. `src/components/GuessWordSettingsMinimal.tsx` - 未使用的最小版本

## 组件导入 (src/App.tsx)
- `import { GuessWordSettingsPage } from './components/GuessWordSettingsPage';`
- `import { GuessWordGamePage } from './components/GuessWordGamePage';`
- `import { GuessWordResultPage } from './components/GuessWordResultPage';`

## 硬编码导航链接
1. `src/components/user/UserHeader.tsx`:
   - `/guess-word/data` (管理员数据管理)
   - `/guess-word/invite` (管理员邀请用户)

2. `src/components/GuessWordSettingsPage.tsx`:
   - `navigate('/guess-word/data')`

3. `src/components/GuessWordResultPage.tsx`:
   - `navigate('/guess-word/game')`
   - `navigate('/guess-word/data')`
   - `navigate(\`/games/\${gameId || 'guess-word'}/play\`)` (部分已更新)

4. `src/components/GuessWordGamePage.tsx`:
   - `navigate('/guess-word/result')`

5. `src/components/GuessWordSettingsSimple.tsx`:
   - `navigate('/guess-word/game')`

6. `src/components/UniversalGamePage.tsx`:
   - `navigate('/guess-word/result')` (应该使用通用结果页面)

## Store 中的遗留逻辑 (src/stores/appStore.ts)
1. `useQuizSettings` 默认参数: `gameId: string = 'guess_word'`
2. 兼容性逻辑: `if (gameId === 'guess_word' && userSettings && userSettings.questionType)`
3. 配置引用: `guestConfig.guess_word_settings`
4. 内置默认值中的 `guess_word_settings` 配置
5. 配置分类逻辑: `if (['supported_games', 'guess_word_settings'].includes(key))`

## HomePage 中的兼容性逻辑 (src/components/HomePage.tsx)
- 兼容旧版扁平化设置: `if (!userSettings && (game.id === 'guess-word' || game.id === 'guess_word'))`
- Fallback 游戏配置: `id: 'guess-word'`

## 未使用的组件 (需要删除)
1. `src/components/HomePageSimple.tsx` - 包含硬编码的 `id: 'guess-word'`
2. `src/components/GuessWordSettingsSimple.tsx` - 包含 `/guess-word/game` 导航
3. `src/components/GuessWordSettingsMinimal.tsx` - 引用 GuessWordSettingsPage

## 临时文件 (可以删除)
1. `temp_original_game_page.tsx` - 包含 `/guess-word/result` 导航
2. `temp_original_game_page_utf8.tsx` - 包含 `/guess-word/result` 导航

## 依赖关系分析
- App.tsx 依赖所有 GuessWord* 组件
- GuessWordResultPage 有到其他 guess-word 路由的导航
- GuessWordSettingsPage 有到 guess-word/data 的导航
- UserHeader 有到 guess-word 管理员功能的链接
- UniversalGamePage 仍然导航到 guess-word/result

## 清理优先级
1. **高优先级**: 路由定义和导航链接 (影响用户体验)
2. **中优先级**: 组件移除和导入更新 (代码清理)
3. **低优先级**: Store 兼容性逻辑 (向后兼容，可以保留一段时间)