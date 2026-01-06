export type FingerName =
    | 'left-pinky'   // 左小指
    | 'left-ring'    // 左无名指
    | 'left-middle'  // 左中指
    | 'left-index'   // 左食指
    | 'thumb'        // 拇指 (空格)
    | 'right-index'  // 右食指
    | 'right-middle' // 右中指
    | 'right-ring'   // 右无名指
    | 'right-pinky'; // 右小指

export interface KeyConfig {
    code: string;         // 对应的物理按键 Code (如 'KeyA', 'Digit1')
    fingers: FingerName[]; // 需要用到的手指数组 (数组长度 > 1 代表需要组合键)
    isShift?: boolean;    // 辅助标记：是否需要按下 Shift
}

// 辅助常量：定义左右手 Shift 键的手指
const LEFT_SHIFT_FINGER: FingerName = 'left-pinky';
const RIGHT_SHIFT_FINGER: FingerName = 'right-pinky';

export const KEYBOARD_MAP: Record<string, KeyConfig> = {
    // ==========================================
    // 第一排：数字与符号 (Row 1)
    // ==========================================
    '`': { code: 'Backquote', fingers: ['left-pinky'] },
    '~': { code: 'Backquote', fingers: ['left-pinky', RIGHT_SHIFT_FINGER], isShift: true },

    '1': { code: 'Digit1', fingers: ['left-pinky'] },
    '!': { code: 'Digit1', fingers: ['left-pinky', RIGHT_SHIFT_FINGER], isShift: true },

    '2': { code: 'Digit2', fingers: ['left-ring'] },
    '@': { code: 'Digit2', fingers: ['left-ring', RIGHT_SHIFT_FINGER], isShift: true },

    '3': { code: 'Digit3', fingers: ['left-middle'] },
    '#': { code: 'Digit3', fingers: ['left-middle', RIGHT_SHIFT_FINGER], isShift: true },

    '4': { code: 'Digit4', fingers: ['left-index'] },
    '$': { code: 'Digit4', fingers: ['left-index', RIGHT_SHIFT_FINGER], isShift: true },

    '5': { code: 'Digit5', fingers: ['left-index'] },
    '%': { code: 'Digit5', fingers: ['left-index', RIGHT_SHIFT_FINGER], isShift: true },

    '6': { code: 'Digit6', fingers: ['right-index'] },
    '^': { code: 'Digit6', fingers: ['right-index', LEFT_SHIFT_FINGER], isShift: true },

    '7': { code: 'Digit7', fingers: ['right-index'] },
    '&': { code: 'Digit7', fingers: ['right-index', LEFT_SHIFT_FINGER], isShift: true },

    '8': { code: 'Digit8', fingers: ['right-middle'] },
    '*': { code: 'Digit8', fingers: ['right-middle', LEFT_SHIFT_FINGER], isShift: true },

    '9': { code: 'Digit9', fingers: ['right-ring'] },
    '(': { code: 'Digit9', fingers: ['right-ring', LEFT_SHIFT_FINGER], isShift: true },

    '0': { code: 'Digit0', fingers: ['right-pinky'] },
    ')': { code: 'Digit0', fingers: ['right-pinky', LEFT_SHIFT_FINGER], isShift: true },

    '-': { code: 'Minus', fingers: ['right-pinky'] },
    '_': { code: 'Minus', fingers: ['right-pinky', LEFT_SHIFT_FINGER], isShift: true },

    '=': { code: 'Equal', fingers: ['right-pinky'] },
    '+': { code: 'Equal', fingers: ['right-pinky', LEFT_SHIFT_FINGER], isShift: true },

    // ==========================================
    // 第二排：QWERTY (Row 2)
    // ==========================================
    'q': { code: 'KeyQ', fingers: ['left-pinky'] },
    'Q': { code: 'KeyQ', fingers: ['left-pinky', RIGHT_SHIFT_FINGER], isShift: true },

    'w': { code: 'KeyW', fingers: ['left-ring'] },
    'W': { code: 'KeyW', fingers: ['left-ring', RIGHT_SHIFT_FINGER], isShift: true },

    'e': { code: 'KeyE', fingers: ['left-middle'] },
    'E': { code: 'KeyE', fingers: ['left-middle', RIGHT_SHIFT_FINGER], isShift: true },

    'r': { code: 'KeyR', fingers: ['left-index'] },
    'R': { code: 'KeyR', fingers: ['left-index', RIGHT_SHIFT_FINGER], isShift: true },

    't': { code: 'KeyT', fingers: ['left-index'] },
    'T': { code: 'KeyT', fingers: ['left-index', RIGHT_SHIFT_FINGER], isShift: true },

    'y': { code: 'KeyY', fingers: ['right-index'] },
    'Y': { code: 'KeyY', fingers: ['right-index', LEFT_SHIFT_FINGER], isShift: true },

    'u': { code: 'KeyU', fingers: ['right-index'] },
    'U': { code: 'KeyU', fingers: ['right-index', LEFT_SHIFT_FINGER], isShift: true },

    'i': { code: 'KeyI', fingers: ['right-middle'] },
    'I': { code: 'KeyI', fingers: ['right-middle', LEFT_SHIFT_FINGER], isShift: true },

    'o': { code: 'KeyO', fingers: ['right-ring'] },
    'O': { code: 'KeyO', fingers: ['right-ring', LEFT_SHIFT_FINGER], isShift: true },

    'p': { code: 'KeyP', fingers: ['right-pinky'] },
    'P': { code: 'KeyP', fingers: ['right-pinky', LEFT_SHIFT_FINGER], isShift: true },

    '[': { code: 'BracketLeft', fingers: ['right-pinky'] },
    '{': { code: 'BracketLeft', fingers: ['right-pinky', LEFT_SHIFT_FINGER], isShift: true },

    ']': { code: 'BracketRight', fingers: ['right-pinky'] },
    '}': { code: 'BracketRight', fingers: ['right-pinky', LEFT_SHIFT_FINGER], isShift: true },

    '\\': { code: 'Backslash', fingers: ['right-pinky'] },
    '|': { code: 'Backslash', fingers: ['right-pinky', LEFT_SHIFT_FINGER], isShift: true },

    // ==========================================
    // 第三排：ASDF (Row 3 - Home Row)
    // ==========================================
    'a': { code: 'KeyA', fingers: ['left-pinky'] },
    'A': { code: 'KeyA', fingers: ['left-pinky', RIGHT_SHIFT_FINGER], isShift: true },

    's': { code: 'KeyS', fingers: ['left-ring'] },
    'S': { code: 'KeyS', fingers: ['left-ring', RIGHT_SHIFT_FINGER], isShift: true },

    'd': { code: 'KeyD', fingers: ['left-middle'] },
    'D': { code: 'KeyD', fingers: ['left-middle', RIGHT_SHIFT_FINGER], isShift: true },

    'f': { code: 'KeyF', fingers: ['left-index'] },
    'F': { code: 'KeyF', fingers: ['left-index', RIGHT_SHIFT_FINGER], isShift: true },

    'g': { code: 'KeyG', fingers: ['left-index'] },
    'G': { code: 'KeyG', fingers: ['left-index', RIGHT_SHIFT_FINGER], isShift: true },

    'h': { code: 'KeyH', fingers: ['right-index'] },
    'H': { code: 'KeyH', fingers: ['right-index', LEFT_SHIFT_FINGER], isShift: true },

    'j': { code: 'KeyJ', fingers: ['right-index'] },
    'J': { code: 'KeyJ', fingers: ['right-index', LEFT_SHIFT_FINGER], isShift: true },

    'k': { code: 'KeyK', fingers: ['right-middle'] },
    'K': { code: 'KeyK', fingers: ['right-middle', LEFT_SHIFT_FINGER], isShift: true },

    'l': { code: 'KeyL', fingers: ['right-ring'] },
    'L': { code: 'KeyL', fingers: ['right-ring', LEFT_SHIFT_FINGER], isShift: true },

    ';': { code: 'Semicolon', fingers: ['right-pinky'] },
    ':': { code: 'Semicolon', fingers: ['right-pinky', LEFT_SHIFT_FINGER], isShift: true },

    "'": { code: 'Quote', fingers: ['right-pinky'] },
    '"': { code: 'Quote', fingers: ['right-pinky', LEFT_SHIFT_FINGER], isShift: true },

    // ==========================================
    // 第四排：ZXCV (Row 4)
    // ==========================================
    'z': { code: 'KeyZ', fingers: ['left-pinky'] },
    'Z': { code: 'KeyZ', fingers: ['left-pinky', RIGHT_SHIFT_FINGER], isShift: true },

    'x': { code: 'KeyX', fingers: ['left-ring'] },
    'X': { code: 'KeyX', fingers: ['left-ring', RIGHT_SHIFT_FINGER], isShift: true },

    'c': { code: 'KeyC', fingers: ['left-middle'] },
    'C': { code: 'KeyC', fingers: ['left-middle', RIGHT_SHIFT_FINGER], isShift: true },

    'v': { code: 'KeyV', fingers: ['left-index'] },
    'V': { code: 'KeyV', fingers: ['left-index', RIGHT_SHIFT_FINGER], isShift: true },

    'b': { code: 'KeyB', fingers: ['left-index'] }, // 注意：B 属于左手食指管辖，所以Shift用右手
    'B': { code: 'KeyB', fingers: ['left-index', RIGHT_SHIFT_FINGER], isShift: true },

    'n': { code: 'KeyN', fingers: ['right-index'] },
    'N': { code: 'KeyN', fingers: ['right-index', LEFT_SHIFT_FINGER], isShift: true },

    'm': { code: 'KeyM', fingers: ['right-index'] },
    'M': { code: 'KeyM', fingers: ['right-index', LEFT_SHIFT_FINGER], isShift: true },

    ',': { code: 'Comma', fingers: ['right-middle'] },
    '<': { code: 'Comma', fingers: ['right-middle', LEFT_SHIFT_FINGER], isShift: true },

    '.': { code: 'Period', fingers: ['right-ring'] },
    '>': { code: 'Period', fingers: ['right-ring', LEFT_SHIFT_FINGER], isShift: true },

    '/': { code: 'Slash', fingers: ['right-pinky'] },
    '?': { code: 'Slash', fingers: ['right-pinky', LEFT_SHIFT_FINGER], isShift: true },

    // ==========================================
    // 特殊键
    // ==========================================
    ' ': { code: 'Space', fingers: ['thumb'] }, // 空格通常两手拇指皆可，这里通用thumb
};

// 辅助函数：根据 fingers 数组判断是左Shift还是右Shift
export const getShiftKey = (fingers: FingerName[]): string | null => {
    if (fingers.includes('left-pinky') && fingers.length > 1) {
        // 如果主键是左小指(如 Q)，那么 Shift 必须是右 Shift
        // 但如果 fingers 里显式包含了 'left-pinky' 代表的是主键(如Q)还是Shift(如H的Shift)?
        // 逻辑修正：看 KEYBOARD_MAP 的定义：
        // 如果 isShift 为 true:
        //   - 组合里包含 'left-pinky' 且 'right-pinky' -> 比较特殊(Q大写)，Q是主键(左)，Shift是右
        //   - 组合里包含 'right-pinky' 且 'left-pinky' -> P大写，P是主键(右)，Shift是左
    }

    if (fingers.includes('left-pinky') && fingers.includes('right-pinky')) {
        // 这是一个特殊情况，左右小指都在用。
        // 我们需要结合 code 来判断。这个逻辑最好在前端组件里结合 isShift 字段写。
        // 简单逻辑：
        // 如果 isShift === true，且 fingers 包含 'left-pinky'，则 Shift 为 'ShiftLeft' (除非主键本身就是左小指)
    }

    return null;
};