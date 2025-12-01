import { Game, GameTextConfig } from '../types';
import { getDefaultTextConfig } from '../utils/gameTextConfig';

/**
 * 游戏文本配置 Slice
 * 
 * 职责:
 * - 管理游戏列表及其文本配置
 * - 提供获取游戏文本配置的便捷方法
 * - 支持游戏的创建、更新和删除
 */
export interface GameTextsSlice {
    // 状态
    games: Game[];
    gamesLoading: boolean;
    gamesError: string | null;

    // Actions
    setGames: (games: Game[]) => void;
    setGamesLoading: (loading: boolean) => void;
    setGamesError: (error: string | null) => void;

    // 业务方法
    loadGames: () => Promise<void>;
    getGameTexts: (gameId: string) => GameTextConfig;
    updateGameTextConfig: (gameId: string, textConfig: GameTextConfig) => void;
}

/**
 * 创建游戏文本配置 Slice
 * 
 * 注意: 这个函数返回的是部分状态,会被合并到主 Store 中
 */
export const createGameTextsSlice = (
    set: any,
    get: any
): GameTextsSlice => ({
    // 初始状态
    games: [],
    gamesLoading: false,
    gamesError: null,

    // 基础 Actions
    setGames: (games) => {
        console.log('🎮 [GameTextsSlice] 设置游戏列表:', games.length, '个游戏');
        set({ games });
    },

    setGamesLoading: (loading) => {
        set({ gamesLoading: loading });
    },

    setGamesError: (error) => {
        set({ gamesError: error });
    },

    // 业务方法
    loadGames: async () => {
        console.log('📦 [GameTextsSlice] 开始加载游戏列表...');
        set({ gamesLoading: true, gamesError: null });

        try {
            // 动态导入 API
            const { wordAPI } = await import('../utils/api');

            if (!wordAPI.getGames) {
                throw new Error('getGames API 不可用');
            }

            const response = await wordAPI.getGames();

            if (response.success && response.data) {
                console.log('✅ [GameTextsSlice] 游戏列表加载成功:', response.data.length, '个游戏');
                set({
                    games: response.data,
                    gamesLoading: false
                });
            } else {
                throw new Error(response.error || '加载游戏列表失败');
            }
        } catch (error) {
            console.error('❌ [GameTextsSlice] 加载游戏列表失败:', error);
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            set({
                gamesError: errorMessage,
                gamesLoading: false
            });
        }
    },

    /**
     * 获取指定游戏的文本配置
     * 如果游戏没有配置,返回默认配置
     */
    getGameTexts: (gameId: string): GameTextConfig => {
        const state = get();
        const game = state.games?.find((g: Game) => g.id === gameId);

        if (game?.text_config) {
            console.log(`📖 [GameTextsSlice] 获取游戏 [${gameId}] 的文本配置:`, game.text_config);
            return game.text_config;
        }

        console.log(`📖 [GameTextsSlice] 游戏 [${gameId}] 无配置,使用默认配置`);
        return getDefaultTextConfig();
    },

    /**
     * 更新游戏的文本配置(仅本地缓存)
     * 注意: 这只更新本地状态,不同步到服务器
     * 要同步到服务器,需要调用 API 的 updateGame 方法
     */
    updateGameTextConfig: (gameId: string, textConfig: GameTextConfig) => {
        console.log(`💾 [GameTextsSlice] 更新游戏 [${gameId}] 的文本配置`);

        const state = get();
        const updatedGames = state.games.map((game: Game) =>
            game.id === gameId
                ? { ...game, text_config: textConfig }
                : game
        );

        set({ games: updatedGames });
    },
});
