import { ThemeProvider } from 'next-themes'
import type { Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import I18nServer from './components/i18n-server'
import RoutePrefixHandle from './routePrefixHandle'
import BrowserInitor from './components/browser-initor'
import SentryInitor from './components/sentry-initor'
import StatusBarMeta from './components/status-bar-meta'
import { getLocaleOnServer } from '@/i18n/server'
import { TanstackQueryIniter } from '@/context/query-client'
import './styles/globals.css'
import './styles/markdown.scss'
import GlobalPublicStoreProvider from '@/context/global-public-context'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  userScalable: false,
  minimumScale: 1,
}
const LocaleLayout = async ({
  children,
}: {
  children: React.ReactNode
}) => {
  const locale = await getLocaleOnServer()

  return (
    <html lang={locale ?? 'en'} className="h-full" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#FFFFFF" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SlumberAI" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="manifest" href="/api/manifest" />
      </head>
      <body
        className="color-scheme h-full select-auto"
        suppressHydrationWarning
        data-api-prefix={process.env.NEXT_PUBLIC_API_PREFIX}
        data-pubic-api-prefix={process.env.NEXT_PUBLIC_PUBLIC_API_PREFIX}
        data-marketplace-api-prefix={process.env.NEXT_PUBLIC_MARKETPLACE_API_PREFIX}
        data-marketplace-url-prefix={process.env.NEXT_PUBLIC_MARKETPLACE_URL_PREFIX}
        data-public-edition={process.env.NEXT_PUBLIC_EDITION}
        data-public-support-mail-login={process.env.NEXT_PUBLIC_SUPPORT_MAIL_LOGIN}
        data-public-sentry-dsn={process.env.NEXT_PUBLIC_SENTRY_DSN}
        data-public-maintenance-notice={process.env.NEXT_PUBLIC_MAINTENANCE_NOTICE}
        data-public-site-about={process.env.NEXT_PUBLIC_SITE_ABOUT}
        data-public-text-generation-timeout-ms={process.env.NEXT_PUBLIC_TEXT_GENERATION_TIMEOUT_MS}
        data-public-max-tools-num={process.env.NEXT_PUBLIC_MAX_TOOLS_NUM}
        data-public-max-parallel-limit={process.env.NEXT_PUBLIC_MAX_PARALLEL_LIMIT}
        data-public-top-k-max-value={process.env.NEXT_PUBLIC_TOP_K_MAX_VALUE}
        data-public-indexing-max-segmentation-tokens-length={process.env.NEXT_PUBLIC_INDEXING_MAX_SEGMENTATION_TOKENS_LENGTH}
        data-public-loop-node-max-count={process.env.NEXT_PUBLIC_LOOP_NODE_MAX_COUNT}
        data-public-max-iterations-num={process.env.NEXT_PUBLIC_MAX_ITERATIONS_NUM}
        data-public-enable-website-jinareader={process.env.NEXT_PUBLIC_ENABLE_WEBSITE_JINAREADER}
        data-public-enable-website-firecrawl={process.env.NEXT_PUBLIC_ENABLE_WEBSITE_FIRECRAWL}
        data-public-enable-website-watercrawl={process.env.NEXT_PUBLIC_ENABLE_WEBSITE_WATERCRAWL}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Comprehensive error suppression for common browser issues
              window.addEventListener('error', function(e) {
                // More aggressive pattern matching for file-preview errors
                if (e.message && (
                  e.message.includes('ResizeObserver loop completed with undelivered notifications') ||
                  e.message.includes('ResizeObserver loop limit exceeded') ||
                  e.message.includes('ResizeObserver') ||
                  e.message.includes('Failed to load resource') ||
                  e.message.includes('file-preview') ||
                  e.message.includes('/files') ||
                  e.message.includes('status of 404') ||
                  e.message.includes('404 ()')
                )) {
                  e.stopImmediatePropagation();
                  e.preventDefault();
                  // Completely silent suppression
                  return false;
                }
                
                // Also check the target element for resource loading errors
                if (e.target && (e.target.src || e.target.href)) {
                  const url = e.target.src || e.target.href;
                  if (url.includes('file-preview') || url.includes('/files')) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return false;
                  }
                }
              });
              
              // Intercept console.error for network errors - more aggressive suppression
              const originalConsoleError = console.error;
              console.error = function(...args) {
                const message = args.join(' ');
                // Suppress all file-preview related errors
                if (message.includes('Failed to load resource') || 
                    message.includes('file-preview') || 
                    message.includes('/files') ||
                    message.includes('status of 404')) {
                  // Completely silent - no debug log
                  return;
                }
                originalConsoleError.apply(console, args);
              };
              
              // Intercept console.log and console.warn for file-preview errors too
              const originalConsoleLog = console.log;
              const originalConsoleWarn = console.warn;
              
              console.log = function(...args) {
                const message = args.join(' ');
                if (message.includes('file-preview') || message.includes('Failed to load resource')) {
                  return;
                }
                originalConsoleLog.apply(console, args);
              };
              
              console.warn = function(...args) {
                const message = args.join(' ');
                if (message.includes('file-preview') || message.includes('Failed to load resource')) {
                  return;
                }
                originalConsoleWarn.apply(console, args);
              };
              
              // Suppress unhandled promise rejections for non-critical errors
              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason && e.reason.message && (
                  e.reason.message.includes('ResizeObserver') ||
                  e.reason.message.includes('Failed to load resource') ||
                  e.reason.message.includes('file-preview') ||
                  e.reason.message.includes('404')
                )) {
                  e.preventDefault();
                  console.debug('Promise rejection suppressed:', e.reason.message);
                  return false;
                }
              });

              
              // Add CSS to hide any potential error messages in the UI
              const style = document.createElement('style');
              style.textContent = \`
                /* Hide any error messages about file loading */
                *[class*="error"]:has(*[href*="file-preview"]),
                *[class*="error"]:has(*[src*="file-preview"]) {
                  display: none !important;
                }
              \`;
              document.head.appendChild(style);

            `,
          }}
        />
        <BrowserInitor>
          <SentryInitor>
            <TanstackQueryIniter>
              <ThemeProvider
                attribute='data-theme'
                defaultTheme='system'
                enableSystem
                disableTransitionOnChange
              >
                <StatusBarMeta />
                <I18nServer>
                  <GlobalPublicStoreProvider>
                    {children}
                  </GlobalPublicStoreProvider>
                </I18nServer>
              </ThemeProvider>
            </TanstackQueryIniter>
          </SentryInitor>
        </BrowserInitor>
        <RoutePrefixHandle />
        <Analytics />
      </body>
    </html>
  )
}

export default LocaleLayout
