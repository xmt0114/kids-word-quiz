/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	// 确保所有动态类都被包含
	safelist: [
		// 颜色 - 所有组合
		'bg-primary-50', 'bg-primary-500', 'bg-primary-600', 'bg-primary-500', 'bg-primary-600',
		'bg-secondary-50', 'bg-secondary-500', 'bg-secondary-600', 'bg-secondary-500', 'bg-secondary-600',
		'bg-accent-500', 'bg-success', 'bg-error', 'bg-background-secondary',
		'text-primary-500', 'text-secondary-500', 'text-text-inverse', 'text-text-primary', 'text-text-secondary', 'text-white',
		'border-primary-500', 'border-white', 'border-gray-200',
		'border-primary-300', 'border-4', 'border-3', 'border-2', 'border-1',

		// 阴影
		'shadow-card', 'shadow-card-hover', 'shadow-button', 'shadow-md', 'shadow-lg',

		// 尺寸
		'min-h-button', 'min-w-touch', 'min-h-touch',

		// 字体
		'text-hero', 'text-h1', 'text-h2', 'text-h3', 'text-question', 'text-body', 'text-button', 'text-small',

		// 间距
		'p-sm', 'p-md', 'p-lg', 'p-xl', 'px-sm', 'px-md', 'px-lg', 'px-xl', 'py-sm', 'py-md',
		'mb-sm', 'mb-md', 'mb-lg', 'mb-xl', 'space-y-xl',
		'gap-sm', 'gap-md', 'gap-lg', 'gap-xl',

		// 网格和布局
		'grid', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-12', 'grid-cols-13',
		'col-span-1', 'col-span-2', 'col-span-3', 'col-span-4', 'col-span-12', 'col-span-13',
		'flex', 'items-center', 'justify-center', 'justify-between',
		'inline-flex', 'flex-col', 'flex-row', 'gap-sm', 'gap-md',

		// 圆角
		'rounded-lg', 'rounded-full', 'rounded-sm', 'rounded-md',

		// 变换和过渡
		'scale-105', 'scale-102', 'scale-100',
		'hover:scale-105', 'hover:scale-102', 'hover:scale-95',
		'active:scale-95', 'active:scale-105',
		'hover:-translate-y-1', 'hover:-translate-y-2',
		'-rotate-0.5', '-rotate-1',
		'transition-all', 'duration-fast', 'duration-normal', 'transition-colors',

		// 位置和层级
		'absolute', 'relative', 'fixed', 'z-10', 'z-20',
		'top-0', 'top-4', 'right-4', 'left-4', 'bottom-4',
		'-top-4', '-top-2', '-left-8', '-right-12',

		// 背景渐变
		'from-blue-400', 'from-blue-600', 'from-green-400', 'from-green-600',
		'from-purple-400', 'from-purple-600', 'from-orange-400', 'from-orange-600',
		'to-blue-400', 'to-blue-600', 'to-green-400', 'to-green-600',
		'to-purple-400', 'to-purple-600', 'to-orange-400', 'to-orange-600',

		// 文字和字体
		'font-body', 'font-display', 'font-bold', 'font-semibold', 'font-normal',
		'text-left', 'text-center', 'text-right', 'text-sm', 'text-base', 'text-lg', 'text-xl',

		// 其他
		'focus:outline-none', 'focus:ring-4', 'focus:ring-primary-500', 'focus:ring-opacity-50',
		'opacity-75', 'opacity-50', 'opacity-20',
		'cursor-pointer', 'cursor-default',
		'disabled:opacity-50', 'disabled:cursor-not-allowed',
		'hover:shadow-xl', 'hover:shadow-md', 'hover:shadow-lg',
		'hover:bg-primary-500', 'hover:bg-opacity-90', 'hover:border-primary-300',
		'animate-float', 'animate-bounce-in', 'animate-pulse-gentle',
		'animate-fade-in', 'animate-scale-in', 'animate-slide-in-right',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			// 儿童友好字体
			fontFamily: {
				'display': ['Fredoka', 'Baloo 2', 'Noto Sans SC', 'system-ui', 'sans-serif'],
				'body': ['Fredoka', 'Nunito', 'Noto Sans SC', 'system-ui', 'sans-serif'],
				'title': ['ZCOOL QingKe HuangYou', 'Noto Sans SC', 'sans-serif'],
				'chinese': ['Noto Sans SC', 'KaiTi', 'serif'],
				'fredoka': ['Fredoka', 'system-ui', 'sans-serif'],
				'kaiti': ['KaiTi', 'STKaiti', 'SimKai', 'serif'],
			},

			// 色彩系统
			colors: {
				// 主色 - 珊瑚红
				primary: {
					500: '#ff6b6b',
					600: '#ff8e53',
					DEFAULT: '#ff6b6b',
					foreground: '#ffffff',
				},

				// 次要色 - 青绿色
				secondary: {
					500: '#4ecdc4',
					600: '#44a2fc',
					DEFAULT: '#4ecdc4',
					foreground: '#ffffff',
				},

				// 强调色 - 阳光黄
				accent: {
					500: '#ffe66d',
					DEFAULT: '#ffe66d',
					foreground: '#2d3748',
				},

				// 语义色
				success: '#51cf66',
				error: '#ff5757',
				warning: '#ffd43b',

				// 文字颜色
				text: {
					primary: '#2d3748',
					secondary: '#4a5568',
					tertiary: '#718096',
					inverse: '#ffffff',
				},

				// 背景色
				background: {
					primary: '#fffbf0',
					secondary: '#ffffff',
				},

				// 品牌渐变色 (用于 Header 按钮等)
				brand: {
					'purple-start': '#667eea',
					'purple-end': '#764ba2',
					'peach-start': '#ffecd2',
					'peach-end': '#fcb69f',
					'mint-start': '#a8edea',
					'mint-end': '#fed6e3',
				},

				// 保留原有的shadcn/ui颜色（兼容性）
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				foreground: 'hsl(var(--foreground))',
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
			},

			// 字体大小
			fontSize: {
				'hero': ['clamp(48px, 5vw + 1rem, 72px)', { lineHeight: '1.1' }],
				'h1': ['clamp(28px, 3vw + 0.8rem, 44px)', { lineHeight: '1.15' }],
				'h2': ['clamp(28px, 3vw + 1rem, 40px)', { lineHeight: '1.2' }],
				'h3': ['clamp(24px, 2vw + 1rem, 32px)', { lineHeight: '1.25' }],
				// 单行自适应字体（用于题目文字）- 调大字体
				'question': ['clamp(16px, 1.8vw + 0.8rem, 28px)', { lineHeight: '1.2' }],
				'body': ['clamp(15px, 0.8vw + 0.4rem, 17px)', { lineHeight: '1.7' }],
				'button': ['clamp(17px, 0.5vw + 0.5rem, 20px)', { lineHeight: '1.2' }],
				'small': ['clamp(15px, 0.25vw + 0.5rem, 16px)', { lineHeight: '1.5' }],
			},

			// 字重
			fontWeight: {
				regular: 400,
				semibold: 600,
				bold: 700,
			},

			// 间距系统（8pt网格）
			spacing: {
				'xs': '8px',
				'sm': '16px',
				'md': '24px',
				'lg': '32px',
				'xl': '48px',
				'2xl': '64px',
				'3xl': '96px',
			},

			// 圆角系统
			borderRadius: {
				'sm': '16px',
				'md': '24px',
				'lg': '32px',
				'full': '50px',
			},

			// 阴影系统
			boxShadow: {
				'sm': '0 4px 12px rgba(45, 55, 72, 0.08)',
				'card': '0 8px 24px rgba(45, 55, 72, 0.12)',
				'card-hover': '0 16px 40px rgba(255, 107, 107, 0.25)',
				'button': '0 8px 24px rgba(255, 107, 107, 0.35)',
			},

			// 动画持续时间
			transitionDuration: {
				'fast': '150ms',
				'normal': '300ms',
				'slow': '500ms',
			},

			// 缓动函数
			transitionTimingFunction: {
				'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
				'smooth': 'ease-out',
			},

			// 尺寸标准
			minHeight: {
				'touch': '64px',
				'button': '56px',
				'input': '80px',
			},

			minWidth: {
				'touch': '64px',
			},

			// 动画关键帧
			keyframes: {
				// 弹跳动画
				'bounce-in': {
					'0%': { transform: 'scale(0.95)' },
					'50%': { transform: 'scale(1.05)' },
					'100%': { transform: 'scale(1)' },
				},

				// 脉搏动画（音频播放）
				'pulse-gentle': {
					'0%, 100%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(1.1)' },
				},

				// 抖动动画（错误反馈）
				'shake': {
					'0%, 100%': { transform: 'translateX(0)' },
					'10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-10px)' },
					'20%, 40%, 60%, 80%': { transform: 'translateX(10px)' },
				},

				// 浮动动画（装饰元素）
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-20px)' },
				},

				// 星星爆炸特效
				'star-explosion': {
					'0%': {
						transform: 'scale(0) rotate(0deg)',
						opacity: '1'
					},
					'100%': {
						transform: 'scale(1) rotate(360deg)',
						opacity: '0'
					},
				},

				// 页面切换动画
				'slide-in-right': {
					'0%': {
						transform: 'translateX(50px)',
						opacity: '0'
					},
					'100%': {
						transform: 'translateX(0)',
						opacity: '1'
					},
				},

				'slide-out-left': {
					'0%': {
						transform: 'translateX(0)',
						opacity: '1'
					},
					'100%': {
						transform: 'translateX(-50px)',
						opacity: '0'
					},
				},

				// 保留原有的动画
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
			},

			// 动画
			animation: {
				'bounce-in': 'bounce-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
				'pulse-gentle': 'pulse-gentle 2s ease-in-out infinite',
				'shake': 'shake 400ms ease-in-out',
				'float': 'float 3s ease-in-out infinite',
				'star-explosion': 'star-explosion 600ms ease-out forwards',
				'slide-in-right': 'slide-in-right 250ms ease-out',
				'slide-out-left': 'slide-out-left 250ms ease-out',

				// 保留原有的动画
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}