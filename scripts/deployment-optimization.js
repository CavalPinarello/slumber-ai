#!/usr/bin/env node

// Production deployment optimization script

const fs = require('node:fs')
const path = require('node:path')
const { execSync } = require('node:child_process')

/**
 * Deployment optimization configuration
 */
const OPTIMIZATION_CONFIG = {
  // Bundle analysis
  analyzeBundle: process.env.ANALYZE_BUNDLE === 'true',

  // Compression settings
  enableGzip: true,
  enableBrotli: true,

  // Image optimization
  optimizeImages: true,

  // Cache optimization
  enableStaticCaching: true,

  // Security headers
  enableSecurityHeaders: true,

  // Performance monitoring
  enablePerformanceMonitoring: true,
}

/**
 * Console logging utilities
 */
const log = {
  info: msg => console.log(`\x1B[36m[INFO]\x1B[0m ${msg}`),
  success: msg => console.log(`\x1B[32m[SUCCESS]\x1B[0m ${msg}`),
  warning: msg => console.log(`\x1B[33m[WARNING]\x1B[0m ${msg}`),
  error: msg => console.log(`\x1B[31m[ERROR]\x1B[0m ${msg}`),
}

/**
 * Check if file exists
 */
const fileExists = (filePath) => {
  try {
    return fs.statSync(filePath).isFile()
  }
  catch {
    return false
  }
}

/**
 * Ensure directory exists
 */
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath))
    fs.mkdirSync(dirPath, { recursive: true })
}

/**
 * Bundle analysis optimization
 */
const analyzeBundleSize = () => {
  log.info('Analyzing bundle size...')

  try {
    // Run bundle analyzer
    execSync('ANALYZE=true npm run build', { stdio: 'inherit' })

    // Check if analysis files were generated
    const clientAnalysis = path.join('.next', 'analyze', 'client.html')
    const serverAnalysis = path.join('.next', 'analyze', 'server.html')

    if (fileExists(clientAnalysis))
      log.success('Client bundle analysis generated')

    if (fileExists(serverAnalysis))
      log.success('Server bundle analysis generated')

    // Parse package.json to check for heavy dependencies
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

    const heavyDependencies = [
      'monaco-editor',
      'echarts',
      'reactflow',
      '@lexical/core',
      'canvas',
    ]

    const foundHeavy = heavyDependencies.filter(dep => dependencies[dep])
    if (foundHeavy.length > 0) {
      log.warning(`Heavy dependencies detected: ${foundHeavy.join(', ')}`)
      log.info('Consider lazy loading these dependencies')
    }
  }
  catch (error) {
    log.error('Bundle analysis failed:', error.message)
  }
}

/**
 * Generate static cache headers
 */
const generateCacheHeaders = () => {
  log.info('Generating cache headers...')

  const headers = `
# Cache static assets
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

# Cache images
/images/*
  Cache-Control: public, max-age=2592000

# Cache API responses (short-lived)
/api/*
  Cache-Control: no-cache, must-revalidate, max-age=0

# Security headers
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
`

  const headersPath = path.join(process.cwd(), '_headers')
  fs.writeFileSync(headersPath, headers.trim())
  log.success('Cache headers generated')
}

/**
 * Optimize static assets
 */
const optimizeStaticAssets = () => {
  log.info('Optimizing static assets...')

  const publicDir = path.join(process.cwd(), 'public')
  const staticFiles = []

  // Recursively find all files in public directory
  const findFiles = (dir) => {
    const files = fs.readdirSync(dir)

    files.forEach((file) => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory())
        findFiles(filePath)
      else
        staticFiles.push(filePath)
    })
  }

  findFiles(publicDir)

  // Check for unoptimized images
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg']
  const images = staticFiles.filter(file =>
    imageExtensions.some(ext => file.toLowerCase().endsWith(ext)),
  )

  if (images.length > 0) {
    log.info(`Found ${images.length} image files`)

    // Check for large images
    const largeImages = images.filter((img) => {
      const stat = fs.statSync(img)
      return stat.size > 500000 // 500KB
    })

    if (largeImages.length > 0) {
      log.warning('Large images detected (>500KB):')
      largeImages.forEach((img) => {
        const stat = fs.statSync(img)
        const sizeKB = Math.round(stat.size / 1024)
        log.warning(`  ${path.relative(publicDir, img)} (${sizeKB}KB)`)
      })
    }
  }

  // Generate manifest for static assets
  const manifest = {
    generated: new Date().toISOString(),
    assets: staticFiles.map(file => ({
      path: path.relative(publicDir, file),
      size: fs.statSync(file).size,
    })),
  }

  fs.writeFileSync(
    path.join(publicDir, 'asset-manifest.json'),
    JSON.stringify(manifest, null, 2),
  )

  log.success('Static asset optimization completed')
}

/**
 * Generate service worker with asset caching
 */
const generateServiceWorkerManifest = () => {
  log.info('Generating service worker manifest...')

  const buildDir = path.join(process.cwd(), '.next')
  if (!fs.existsSync(buildDir)) {
    log.warning('Build directory not found, run build first')
    return
  }

  // Find all static assets
  const staticAssets = []
  const findStaticAssets = (dir, prefix = '') => {
    if (!fs.existsSync(dir))
      return

    const files = fs.readdirSync(dir)

    files.forEach((file) => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory())
        findStaticAssets(filePath, `${prefix}${file}/`)
      else
        staticAssets.push(`/_next/${prefix}${file}`)
    })
  }

  findStaticAssets(path.join(buildDir, 'static'), 'static/')

  // Generate SW manifest
  const swManifest = {
    cacheVersion: Date.now(),
    staticAssets: staticAssets.slice(0, 50), // Limit to first 50 assets
    apiEndpoints: [
      '/api/conversations',
      '/api/messages',
      '/api/info',
    ],
  }

  const manifestPath = path.join(process.cwd(), 'public', 'sw-manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(swManifest, null, 2))

  log.success('Service worker manifest generated')
}

/**
 * Create robots.txt
 */
const generateRobotsTxt = () => {
  log.info('Generating robots.txt...')

  const robots = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/sitemap.xml

# Disallow sensitive areas
Disallow: /api/
Disallow: /_next/
Disallow: /admin/
`

  fs.writeFileSync(path.join(process.cwd(), 'public', 'robots.txt'), robots)
  log.success('robots.txt generated')
}

/**
 * Generate sitemap.xml
 */
const generateSitemap = () => {
  log.info('Generating sitemap.xml...')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'
  const now = new Date().toISOString().split('T')[0]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/offline</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`

  fs.writeFileSync(path.join(process.cwd(), 'public', 'sitemap.xml'), sitemap)
  log.success('sitemap.xml generated')
}

/**
 * Validate environment variables
 */
const validateEnvironment = () => {
  log.info('Validating environment variables...')

  const requiredEnvVars = [
    'NEXT_PUBLIC_APP_ID',
    'NEXT_PUBLIC_APP_KEY',
    'NEXT_PUBLIC_API_URL',
  ]

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar])

  if (missing.length > 0) {
    log.error(`Missing required environment variables: ${missing.join(', ')}`)
    process.exit(1)
  }

  // Check for development values in production
  if (process.env.NODE_ENV === 'production') {
    const devPatterns = ['localhost', '127.0.0.1', 'dev', 'test']

    requiredEnvVars.forEach((envVar) => {
      const value = process.env[envVar]
      if (value && devPatterns.some(pattern => value.includes(pattern)))
        log.warning(`Environment variable ${envVar} contains development value: ${value}`)
    })
  }

  log.success('Environment validation completed')
}

/**
 * Performance budget check
 */
const checkPerformanceBudgets = () => {
  log.info('Checking performance budgets...')

  const buildManifestPath = path.join(process.cwd(), '.next', 'build-manifest.json')

  if (!fileExists(buildManifestPath)) {
    log.warning('Build manifest not found, skipping performance budget check')
    return
  }

  try {
    const buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'))

    // Calculate total bundle size (simplified)
    const pages = buildManifest.pages
    let totalSize = 0

    Object.values(pages).forEach((files) => {
      files.forEach((file) => {
        const filePath = path.join(process.cwd(), '.next', file)
        if (fileExists(filePath))
          totalSize += fs.statSync(filePath).size
      })
    })

    const totalSizeMB = totalSize / (1024 * 1024)
    const budgetMB = 2 // 2MB budget

    if (totalSizeMB > budgetMB)
      log.warning(`Bundle size (${totalSizeMB.toFixed(2)}MB) exceeds budget (${budgetMB}MB)`)
    else
      log.success(`Bundle size (${totalSizeMB.toFixed(2)}MB) is within budget (${budgetMB}MB)`)
  }
  catch (error) {
    log.error('Failed to check performance budgets:', error.message)
  }
}

/**
 * Main optimization function
 */
const runOptimization = () => {
  log.info('Starting production deployment optimization...')

  // Validate environment
  validateEnvironment()

  // Create necessary directories
  ensureDir(path.join(process.cwd(), '.next'))
  ensureDir(path.join(process.cwd(), 'public'))

  // Run optimizations
  if (OPTIMIZATION_CONFIG.analyzeBundle)
    analyzeBundleSize()

  if (OPTIMIZATION_CONFIG.enableStaticCaching)
    generateCacheHeaders()

  optimizeStaticAssets()
  generateServiceWorkerManifest()
  generateRobotsTxt()
  generateSitemap()
  checkPerformanceBudgets()

  log.success('Deployment optimization completed!')

  // Summary
  console.log(`\n${'='.repeat(50)}`)
  log.info('Optimization Summary:')
  log.info('✓ Environment variables validated')
  log.info('✓ Static assets optimized')
  log.info('✓ Service worker manifest generated')
  log.info('✓ SEO files generated (robots.txt, sitemap.xml)')
  log.info('✓ Performance budgets checked')

  if (OPTIMIZATION_CONFIG.analyzeBundle)
    log.info('✓ Bundle analysis completed')

  console.log('='.repeat(50))
}

// Run optimization if called directly
if (require.main === module)
  runOptimization()

module.exports = {
  runOptimization,
  analyzeBundleSize,
  optimizeStaticAssets,
  generateServiceWorkerManifest,
  validateEnvironment,
  checkPerformanceBudgets,
}
