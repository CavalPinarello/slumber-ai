import tailwindThemeVarDefine from './themes/tailwind-theme-var-define'

const config = {
  theme: {
    typography: require('./typography'),
    extend: {
      colors: {
        gray: {
          25: '#FCFDFE',
          50: '#FBFBFC',
          100: '#F8F9F9',
          200: '#F4F5F6',
          300: '#E5E8E9',
          400: '#D3D7D9',
          500: '#858F97',
          600: '#707B84',
          700: '#606A72',
          800: '#535B62',
          900: '#474E54',
        },
        primary: {
          25: '#F2D7DD',
          50: '#E85F76',
          100: '#D14F66',
          200: '#D73D56',
          300: '#C32844',
          400: '#B50034',
          500: '#8E1730',
          600: '#751228',
          700: '#5C0E20',
          800: '#440A18',
          900: '#2B0610',
        },
        purple: {
          25: '#A98AFF',
          50: '#9B74FF',
          100: '#8C5DFF',
          200: '#7F47FF',
          300: '#7230FF',
          400: '#661AFF',
          500: '#5605FE',
          600: '#4D03E8',
          700: '#4504D1',
          800: '#3D04B9',
          900: '#3505A2',
        },
        blue: {
          500: '#E1EFFE',
        },
        green: {
          50: '#F3FAF7',
          100: '#DEF7EC',
          800: '#03543F',

        },
        yellow: {
          100: '#FDF6B2',
          800: '#723B13',
        },
        indigo: {
          25: '#F5F8FF',
          50: '#EEF4FF',
          100: '#E0EAFF',
          300: '#A4BCFD',
          400: '#8098F9',
          600: '#444CE7',
          800: '#2D31A6',
        },
        ...tailwindThemeVarDefine,
      },
      screens: {
        'mobile': '100px',
        // => @media (min-width: 100px) { ... }
        'tablet': '640px', // 391
        // => @media (min-width: 600px) { ... }
        'pc': '769px',
        // => @media (min-width: 769px) { ... }
        '2k': '2560px',
      },
      boxShadow: {
        'xs': '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
        'sm': '0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)',
        'md': '0px 2px 4px -2px rgba(16, 24, 40, 0.06), 0px 4px 8px -2px rgba(16, 24, 40, 0.10)',
        'lg': '0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)',
        'xl': '0px 8px 8px -4px rgba(16, 24, 40, 0.03), 0px 20px 24px -4px rgba(16, 24, 40, 0.08)',
        '2xl': '0px 24px 48px -12px rgba(16, 24, 40, 0.18)',
        '3xl': '0px 32px 64px -12px rgba(16, 24, 40, 0.14)',
        'status-indicator-green-shadow': '0px 2px 6px 0px var(--color-components-badge-status-light-success-halo), 0px 0px 0px 1px var(--color-components-badge-status-light-border-outer)',
        'status-indicator-warning-shadow': '0px 2px 6px 0px var(--color-components-badge-status-light-warning-halo), 0px 0px 0px 1px var(--color-components-badge-status-light-border-outer)',
        'status-indicator-red-shadow': '0px 2px 6px 0px var(--color-components-badge-status-light-error-halo), 0px 0px 0px 1px var(--color-components-badge-status-light-border-outer)',
        'status-indicator-blue-shadow': '0px 2px 6px 0px var(--color-components-badge-status-light-normal-halo), 0px 0px 0px 1px var(--color-components-badge-status-light-border-outer)',
        'status-indicator-gray-shadow': '0px 1px 2px 0px var(--color-components-badge-status-light-disabled-halo), 0px 0px 0px 1px var(--color-components-badge-status-light-border-outer)',
      },
      opacity: {
        2: '0.02',
        8: '0.08',
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      backgroundImage: {
        'chatbot-bg': 'var(--color-chatbot-bg)',
        'chat-bubble-bg': 'var(--color-chat-bubble-bg)',
        'chat-input-mask': 'var(--color-chat-input-mask)',
        'workflow-process-bg': 'var(--color-workflow-process-bg)',
        'workflow-run-failed-bg': 'var(--color-workflow-run-failed-bg)',
        'workflow-batch-failed-bg': 'var(--color-workflow-batch-failed-bg)',
        'mask-top2bottom-gray-50-to-transparent': 'var(--mask-top2bottom-gray-50-to-transparent)',
        'marketplace-divider-bg': 'var(--color-marketplace-divider-bg)',
        'marketplace-plugin-empty': 'var(--color-marketplace-plugin-empty)',
        'toast-success-bg': 'var(--color-toast-success-bg)',
        'toast-warning-bg': 'var(--color-toast-warning-bg)',
        'toast-error-bg': 'var(--color-toast-error-bg)',
        'toast-info-bg': 'var(--color-toast-info-bg)',
        'app-detail-bg': 'var(--color-app-detail-bg)',
        'app-detail-overlay-bg': 'var(--color-app-detail-overlay-bg)',
        'dataset-chunk-process-success-bg': 'var(--color-dataset-chunk-process-success-bg)',
        'dataset-chunk-process-error-bg': 'var(--color-dataset-chunk-process-error-bg)',
        'dataset-chunk-detail-card-hover-bg': 'var(--color-dataset-chunk-detail-card-hover-bg)',
        'dataset-child-chunk-expand-btn-bg': 'var(--color-dataset-child-chunk-expand-btn-bg)',
        'dataset-option-card-blue-gradient': 'var(--color-dataset-option-card-blue-gradient)',
        'dataset-option-card-purple-gradient': 'var(--color-dataset-option-card-purple-gradient)',
        'dataset-option-card-orange-gradient': 'var(--color-dataset-option-card-orange-gradient)',
        'dataset-chunk-list-mask-bg': 'var(--color-dataset-chunk-list-mask-bg)',
        'line-divider-bg': 'var(--color-line-divider-bg)',
        'dataset-warning-message-bg': 'var(--color-dataset-warning-message-bg)',
        'price-premium-badge-background': 'var(--color-premium-badge-background)',
        'premium-yearly-tip-text-background': 'var(--color-premium-yearly-tip-text-background)',
        'price-premium-text-background': 'var(--color-premium-text-background)',
        'price-enterprise-background': 'var(--color-price-enterprise-background)',
        'grid-mask-background': 'var(--color-grid-mask-background)',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  // https://github.com/tailwindlabs/tailwindcss/discussions/5969
  corePlugins: {
    preflight: false,
  },
}

export default config
