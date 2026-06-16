export const templates = [
  {
    name: 'manifest.json',
    code: `{
  "name": "HYE Editor",
  "short_name": "HYE",
  "description": "Mobile code editor with AI templates for React, Node, Python",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1e1e1e",
  "theme_color": "#007acc",
  "orientation": "any",
  "scope": "/",
  "lang": "en",
  "dir": "ltr",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["productivity", "developer", "utilities"],
  "screenshots": [
    {
      "src": "/screenshots/mobile-1.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "HYE Editor on Mobile"
    },
    {
      "src": "/screenshots/desktop-1.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide",
      "label": "HYE Editor Desktop View"
    }
  ],
  "shortcuts": [
    {
      "name": "New File",
      "short_name": "New",
      "description": "Create new file in HYE Editor",
      "url": "/?action=new",
      "icons": [{ "src": "/icons/new.png", "sizes": "96x96" }]
    },
    {
      "name": "Open Folder",
      "short_name": "Open",
      "description": "Open project folder",
      "url": "/?action=open",
      "icons": [{ "src": "/icons/open.png", "sizes": "96x96" }]
    },
    {
      "name": "AI Generate",
      "short_name": "AI",
      "description": "Generate code with HYE AI",
      "url": "/?action=ai",
      "icons": [{ "src": "/icons/ai.png", "sizes": "96x96" }]
    }
  ],
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "file",
          "accept": ["text/*", ".js", ".jsx", ".ts", ".tsx", ".py", ".html", ".css"]
        }
      ]
    }
  },
  "file_handlers": [
    {
      "action": "/open",
      "accept": {
        "text/javascript": [".js", ".mjs"],
        "text/jsx": [".jsx"],
        "text/typescript": [".ts", ".tsx"],
        "text/python": [".py"],
        "text/html": [".html"],
        "text/css": [".css"],
        "application/json": [".json"]
      }
    }
  ],
  "protocol_handlers": [
    {
      "protocol": "web+hye",
      "url": "/open?url=%s"
    }
  ],
  "related_applications": [],
  "prefer_related_applications": false,
  "edge_side_panel": {
    "preferred_width": 400
  },
  "launch_handler": {
    "client_mode": "navigate-existing"
  }
}`,
    desc: 'PWA manifest file for HYE Editor'
  },
  {
    name: 'sw.js',
    code: `const CACHE_NAME = 'hye-editor-v1.3.0'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/templates.js',
  '/src/templates-extras.js',
  '/src/styles/terminal.css',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
]

const API_CACHE = 'hye-api-v1'
const IMAGE_CACHE = 'hye-images-v1'

self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME)
     .then(cache => cache.addAll(STATIC_ASSETS))
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key!== CACHE_NAME && key!== API_CACHE && key!== IMAGE_CACHE)
         .map(key => caches.delete(key))
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method!== 'GET') return

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE))
    return
  }

  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE))
    return
  }

  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, 'google-fonts'))
    return
  }

  event.respondWith(staleWhileRevalidate(request))
})

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    const cache = await caches.open(cacheName)
    cache.put(request, response.clone())
    return response
  } catch (error) {
    const cached = await caches.match(request)
    return cached || new Response('Offline', { status: 503 })
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  
  try {
    const response = await fetch(request)
    const cache = await caches.open(cacheName)
    cache.put(request, response.clone())
    return response
  } catch (error) {
    return new Response('Image not available', { status: 404 })
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request)
  const fetchPromise = fetch(request).then(response => {
    const cache = caches.open(CACHE_NAME)
    cache.then(c => c.put(request, response.clone()))
    return response
  }).catch(() => cached)
  
  return cached || fetchPromise
}

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
    )
  }
})

self.addEventListener('push', event => {
  const data = event.data?.json() || {}
  const title = data.title || 'HYE Editor'
  const options = {
    body: data.body || 'New update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: data.image,
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' }
    ],
    vibrate: [200, 100, 200]
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  if (event.action === 'close') return
  event.waitUntil(clients.openWindow(event.notification.data))
})

self.addEventListener('sync', event => {
  if (event.tag === 'sync-files') {
    event.waitUntil(syncFiles())
  }
})

async function syncFiles() {
  const cache = await caches.open('pending-files')
  const requests = await cache.keys()
  return Promise.all(
    requests.map(async request => {
      try {
        await fetch(request)
        await cache.delete(request)
      } catch (err) {
        console.log('Sync failed, will retry:', err)
      }
    })
  )
}`,
    desc: 'Service worker for PWA offline + push + sync'
  },
  {
    name: 'vite.config.js',
    code: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png', 'screenshots/*.png'],
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,ttf}'],
        maximumFileSizeToCacheInBytes: 5000000,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\\/\\/fonts\\.googleapis\\.com\\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\\/\\/fonts\\.gstatic\\.com\\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            urlPattern: /^https:\\/\\/jsonplaceholder\\.typicode\\.com\\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5
              },
              networkTimeoutSeconds: 3
            }
          },
          {
            urlPattern: /^https:\\/\\/HYE-API\\.onrender\\.com\\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'hye-ai-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 10
              }
            }
          },
          {
            urlPattern: /\\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco': ['@monaco-editor/react'],
          'vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
          'ui': ['lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5173,
    host: true,
    open: true,
    cors: true
  },
  preview: {
    port: 4173,
    host: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@monaco-editor/react']
  }
})`,
    desc: 'Vite config with PWA, chunking, aliases'
  },
  {
    name: 'Dockerfile',
    code: `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`,
    desc: 'Multi-stage Docker build for production'
  },
  {
    name: 'nginx.conf',
    code: `server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass https://HYE-API.onrender.com;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}`,
    desc: 'Nginx config with SPA routing + API proxy + gzip'
  },
  {
    name: 'capacitor.config.json',
    code: `{
  "appId": "com.hye.editor",
  "appName": "HYE Editor",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https",
    "allowNavigation": ["HYE-API.onrender.com"]
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#1e1e1e",
      "androidSplashResourceName": "splash",
      "androidScaleType": "CENTER_CROP",
      "showSpinner": false,
      "splashFullScreen": true,
      "splashImmersive": true
    },
    "Keyboard": {
      "resize": "body",
      "style": "dark",
      "resizeOnFullScreen": true
    },
    "StatusBar": {
      "style": "dark",
      "backgroundColor": "#1e1e1e"
    }
  },
  "android": {
    "buildOptions": {
      "keystorePath": "hye-release.keystore",
      "keystoreAlias": "hye",
      "keystorePassword": "hye123",
      "keystoreAliasPassword": "hye123",
      "releaseType": "APK",
      "signingType": "apksigner"
    },
    "minWebViewVersion": 60
  }
}`,
    desc: 'Capacitor config for Android APK build'
  },
  {
    name: '.gitignore',
    code: `node_modules
dist
dist-ssr
*.local
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
android
ios
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
.hye.json
*.apk
*.aab
coverage
.nyc_output
.cache
.parcel-cache
.DS_Store
Thumbs.db`,
    desc: 'Git ignore for Node/React/Capacitor project'
  },
  {
    name: 'tailwind.config.js',
    code: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        hye: {
          bg: '#1e1e1e',
          panel: '#252526',
          border: '#3e3e42',
          blue: '#007acc',
          text: '#d4d4d4',
          muted: '#7d8590',
          red: '#f85149',
          green: '#4ec9b0',
          yellow: '#ffd700'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwind-scrollbar')({ nocompatible: true })
  ],
}`,
    desc: 'Tailwind config with HYE theme colors'
  },
  {
    name: 'postcss.config.js',
    code: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production'? { cssnano: {} } : {})
  }
}`,
    desc: 'PostCSS config for Tailwind + autoprefixer'
  },
  {
    name: 'tsconfig.json',
    code: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"],
      "@hooks/*": ["src/hooks/*"],
      "@store/*": ["src/store/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`,
    desc: 'TypeScript config with path aliases'
  },
  {
    name: 'tsconfig.node.json',
    code: `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}`,
    desc: 'TypeScript config for Node/Vite files'
  },
  {
    name: 'jsconfig.json',
    code: `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"]
    },
    "allowSyntheticDefaultImports": true,
    "checkJs": false
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}`,
    desc: 'JavaScript config with path aliases'
  },
  {
    name: '.eslintrc.cjs',
    code: `module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'capacitor.config.ts'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react/jsx-no-target-blank': 'off',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react/prop-types': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }]
  },
}`,
    desc: 'ESLint config for React + Vite'
  },
  {
    name: '.prettierrc',
    code: `{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "jsxSingleQuote": false,
  "plugins": ["prettier-plugin-tailwindcss"]
}`,
    desc: 'Prettier config with Tailwind plugin'
  },
  {
    name: '.env.production',
    code: `VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_HYE_API_URL=https://HYE-API.onrender.com
VITE_APP_VERSION=$npm_package_version
VITE_BUILD_TIME=${new Date().toISOString()}`,
    desc: 'Production environment variables'
  },
  {
    name: 'vercel.json',
    code: `{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}`,
    desc: 'Vercel deployment config for SPA'
  },
  {
    name: 'netlify.toml',
    code: `[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
    Service-Worker-Allowed = "/"

[[headers]]
  for = "/manifest.json"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"`,
    desc: 'Netlify deployment config'
  },
  {
    name: '.github/workflows/deploy.yml',
    code: `name: Deploy HYE Editor

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Lint
        run: npm run lint
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: \${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: \${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_HYE_API_URL: \${{ secrets.VITE_HYE_API_URL }}
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./`,
    desc: 'GitHub Actions CI/CD to Vercel'
  },
  {
    name: 'README.md',
    code: `# HYE Editor

Mobile-first code editor with AI templates. Built for Android using Capacitor + React + Monaco.

## Features
- Monaco Editor with IntelliSense, bracket colorization
- File system access via Capacitor
- 18+ boilerplate templates
- Hugging Face AI code generation via HYE-API.onrender.com
- PWA with offline support
- Supabase auth + file sync
- Live preview for React
- Local/Offline code fix

## Quick Start
\`\`\`bash
npm install
npm run dev
\`\`\`

## Build APK
\`\`\`bash
npm run build
npm run cap:sync
npm run cap:open
\`\`\`
Then Build > Generate Signed APK in Android Studio

## Templates Included
1. React App.jsx - Full app with todos, API, modals
2. Express Server.js - Supabase + JWT auth
3. HTML Landing.html - Marketing page
4. Python API.py - FastAPI backend
5. Capacitor Config.ts - Android config
6. manifest.json - PWA manifest
7. sw.js - Service worker
8. vite.config.js - Build + PWA
9. Dockerfile - Container deploy
10. nginx.conf - Production server
11. capacitor.config.json - Native config
12. .gitignore - Git ignore
13. tailwind.config.js - Tailwind setup
14. postcss.config.js - CSS processing
15. tsconfig.json - TypeScript config
16. .eslintrc.cjs - Linting
17. .prettierrc - Code formatting
18. vercel.json - Vercel deploy
19. netlify.toml - Netlify deploy
20. deploy.yml - GitHub Actions CI/CD

## Environment Variables
Copy \`.env.example\` to \`.env\` and fill:
\`\`\`
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-key
VITE_HYE_API_URL=https://HYE-API.onrender.com
\`\`\`

## HYE AI Setup
Backend at \`https://HYE-API.onrender.com/generate\` expects:
\`\`\`json
POST /generate
{
  "prompt": "React login page with Supabase"
}
\`\`\`
Returns: \`{ "code": "..." }\`

## License
MIT - Built in Lagos, Nigeria 2026`,
    desc: 'Project README with setup instructions'
  },
  {
    name: 'src/styles/terminal.css',
    code: `:root {
  --hye-bg: #1e1e1e;
  --hye-panel: #252526;
  --hye-border: #3e3e42;
  --hye-blue: #007acc;
  --hye-blue-hover: #1177bb;
  --hye-text: #d4d4d4;
  --hye-muted: #7d8590;
  --hye-red: #f85149;
  --hye-green: #4ec9b0;
  --hye-yellow: #ffd700;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 13px;
  background: var(--hye-bg);
  color: var(--hye-text);
  overflow: hidden;
}

.hye-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: var(--hye-panel);
  border-bottom: 1px solid var(--hye-border);
  flex-wrap: nowrap;
  overflow-x: auto;
}

.header::-webkit-scrollbar {
  display: none;
}

.header button {
  background: #3c3c3c;
  border: none;
  color: #ccc;
  padding: 6px 10px;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  font-size: 12px;
  font-family: inherit;
  transition: background 0.1s;
}

.header button:hover {
  background: #4c4c4c;
}

.header button:active {
  background: #5c5c5c;
}

.header button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.header button.active {
  background: #094771;
}

.header.icon-only {
  padding: 6px;
}

.main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 240px;
  background: var(--hye-panel);
  border-right: 1px solid var(--hye-border);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  transition: width 0.2s;
}

.sidebar.collapsed {
  width: 0;
  border: none;
}

.sidebar-header {
  padding: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom:padding: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--hye-border);
  font-size: 11px;
  font-weight: bold;
  color: var(--hye-muted);
  text-transform: uppercase;
}

.sidebar-actions {
  display: flex;
  gap: 4px;
}

.sidebar-actions button {
  background: none;
  border: none;
  color: #ccc;
  padding: 4px;
  cursor: pointer;
  border-radius: 3px;
}

.sidebar-actions button:hover {
  background: #2a2d2e;
}

.tree {
  padding: 8px;
  flex: 1;
  overflow-y: auto;
}

.file,.folder {
  padding: 4px 6px;
  cursor: pointer;
  border-radius: 3px;
  display: flex;
  align-items: center;
  gap: 4px;
  user-select: none;
}

.file:hover,.folder:hover {
  background: #2a2d2e;
}

.file.active {
  background: #094771;
}

.file-delete {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--hye-red);
  cursor: pointer;
  padding: 2px;
  opacity: 0;
  transition: opacity 0.1s;
}

.file:hover.file-delete {
  opacity: 1;
}

.tabs {
  display: flex;
  background: #2d2d30;
  border-bottom: 1px solid var(--hye-border);
  overflow-x: auto;
}

.tabs::-webkit-scrollbar {
  height: 3px;
}

.tabs::-webkit-scrollbar-thumb {
  background: var(--hye-border);
}

.tab {
  padding: 6px 12px;
  cursor: pointer;
  border-right: 1px solid var(--hye-border);
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  background: #2d2d30;
}

.tab:hover {
  background: #323233;
}

.tab.active {
  background: var(--hye-bg);
}

.editor-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.status-bar {
  padding: 2px 12px;
  background: var(--hye-blue);
  color: white;
  font-size: 11px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.error-bar {
  padding: 6px 12px;
  background: #5a1d1d;
  color: var(--hye-red);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.panel {
  height: 200px;
  background: var(--hye-bg);
  border-top: 1px solid var(--hye-border);
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 4px 12px;
  background: var(--hye-panel);
  border-bottom: 1px solid var(--hye-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  font-weight: bold;
  color: var(--hye-muted);
  text-transform: uppercase;
}

.console-log {
  padding: 2px 12px;
  border-bottom: 1px solid #2d2d30;
  font-size: 12px;
  font-family: inherit;
}

.console-error {
  color: var(--hye-red);
}

.console-warn {
  color: var(--hye-yellow);
}

.problem-item {
  padding: 4px 12px;
  border-bottom: 1px solid #2d2d30;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.problem-item:hover {
  background: #2a2d2e;
}

.menu-dropdown {
  position: absolute;
  top: 45px;
  right: 8px;
  background: var(--hye-panel);
  border: 1px solid var(--hye-border);
  border-radius: 4px;
  z-index: 100;
  min-width: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  max-height: 80vh;
  overflow-y: auto;
}

.menu-item {
  padding: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.menu-item:hover {
  background: #2a2d2e;
}

.menu-divider {
  height: 1px;
  background: var(--hye-border);
  margin: 4px 0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal {
  background: var(--hye-panel);
  border: 1px solid var(--hye-border);
  border-radius: 6px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
}

.modal input,.modal textarea {
  width: 100%;
  background: var(--hye-bg);
  border: 1px solid var(--hye-border);
  color: var(--hye-text);
  padding: 8px;
  border-radius: 4px;
  font-family: inherit;
  font-size: 13px;
  margin-bottom: 8px;
}

.modal input:focus,.modal textarea:focus {
  outline: none;
  border-color: var(--hye-blue);
}

@media (max-width: 768px) {
.header.hide-mobile {
    display: none;
  }
.sidebar {
    position: absolute;
    z-index: 50;
    height: 100%;
  }
}`,
    desc: 'Terminal.css styles for HYE Editor UI'
  },
  {
    name: 'Next.js Page.tsx',
    code: `import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useState } from 'react'
import styles from '@/styles/Home.module.css'

interface Props {
  posts: Post[]
}

interface Post {
  id: number
  title: string
  body: string
  userId: number
}

export default function Home({ posts }: Props) {
  const [search, setSearch] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Head>
        <title>HYE Next.js Template</title>
        <meta name="description" content="Generated by HYE Editor" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={\`\${styles.main} \${theme}\`}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h1>HYE Next.js</h1>
            <div className={styles.controls}>
              <input
                type="text"
                placeholder="Search posts..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={styles.search}
              />
              <button
                onClick={() => setTheme(theme === 'dark'? 'light' : 'dark')}
                className={styles.themeBtn}
              >
                {theme === 'dark'? 'Light' : 'Dark'}
              </button>
            </div>
          </header>

          <div className={styles.grid}>
            {filteredPosts.map(post => (
              <article key={post.id} className={styles.card}>
                <h2>{post.title}</h2>
                <p>{post.body.slice(0, 150)}...</p>
                <span className={styles.userId}>User {post.userId}</span>
              </article>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts')
  const posts: Post[] = await res.json()
  return {
    props: { posts }
  }
}`,
    desc: 'Next.js SSR page with TypeScript + search + theme'
  },
  {
    name: 'Next.js API Route.ts',
    code: `import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

type Data = {
  success: boolean
  data?: any
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { method } = req
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ success: false, error: 'No token' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string }
    req.user = decoded
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid token' })
  }

  switch (method) {
    case 'GET':
      const { data, error } = await supabase
     .from('items')
     .select('*')
     .eq('user_id', req.user.id)
     .order('created_at', { ascending: false })

      if (error) return res.status(400).json({ success: false, error: error.message })
      return res.status(200).json({ success: true, data })

    case 'POST':
      const { title, content } = req.body
      const { data: newItem, error: insertError } = await supabase
     .from('items')
     .insert({ title, content, user_id: req.user.id })
     .select()
     .single()

      if (insertError) return res.status(400).json({ success: false, error: insertError.message })
      return res.status(201).json({ success: true, data: newItem })

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      return res.status(405).json({ success: false, error: \`Method \${method} Not Allowed\` })
  }
}`,
    desc: 'Next.js API route with Supabase + JWT auth'
  },
  {
    name: 'React Native App.js',
    code: `import React, { useState, useEffect } from 'react'
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  Alert
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const App = () => {
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    loadTodos()
  }, [])

  const loadTodos = async () => {
    try {
      const stored = await AsyncStorage.getItem('todos')
      if (stored) setTodos(JSON.parse(stored))
    } catch (e) {
      Alert.alert('Error', 'Failed to load todos')
    }
  }

  const saveTodos = async (newTodos) => {
    try {
      await AsyncStorage.setItem('todos', JSON.stringify(newTodos))
      setTodos(newTodos)
    } catch (e) {
      Alert.alert('Error', 'Failed to save todos')
    }
  }

  const addTodo = () => {
    if (!input.trim()) return
    const newTodos = [...todos, { id: Date.now().toString(), text: input, done: false }]
    saveTodos(newTodos)
    setInput('')
  }

  const toggleTodo = (id) => {
    const newTodos = todos.map(t => t.id === id? {...t, done:!t.done} : t)
    saveTodos(newTodos)
  }

  const deleteTodo = (id) => {
    Alert.alert('Delete Todo', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const newTodos = todos.filter(t => t.id!== id)
          saveTodos(newTodos)
        }
      }
    ])
  }

  const bg = theme === 'dark'? '#1e1e1e' : '#fff'
  const text = theme === 'dark'? '#d4d4d4' : '#000'
  const card = theme === 'dark'? '#252526' : '#f5f5f5'

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={theme === 'dark'? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: text }]}>HYE RN Todos</Text>
        <TouchableOpacity onPress={() => setTheme(theme === 'dark'? 'light' : 'dark')}>
          <Text style={[styles.themeBtn, { color: text }]}>
            {theme === 'dark'? 'Light' : 'Dark'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { backgroundColor: card, color: text }]}
          placeholder="Add todo..."
          placeholderTextColor="#7d8590"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={addTodo}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addTodo}>
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={todos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.todo, { backgroundColor: card }]}>
            <TouchableOpacity onPress={() => toggleTodo(item.id)} style={styles.todoLeft}>
              <Text style={[styles.checkbox, item.done && styles.checked]}>
                {item.done? '✓' : '○'}
              </Text>
              <Text style={[styles.todoText, { color: text }, item.done && styles.done]}>
                {item.text}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteTodo(item.id)}>
              <Text style={styles.delete}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: text }]}>No todos yet</Text>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3e3e42'
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  themeBtn: { fontSize: 16 },
  inputRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 8
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    fontSize: 16
  },
  addBtn: {
    backgroundColor: '#007acc',
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 6
  },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  todo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 12,
    borderRadius: 6
  },
  todoLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  checkbox: { fontSize: 20, marginRight: 12 },
  checked: { color: '#4ec9b0' },
  todoText: { fontSize: 16, flex: 1 },
  done: { textDecorationLine: 'line-through', opacity: 0.6 },
  delete: { fontSize: 20, color: '#f85149', padding: 4 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16 }
})

export default App`,
    desc: 'React Native todo app with AsyncStorage + theme'
  },
  {
    name: 'Flutter main.dart',
    code: `import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

void main() {
  runApp(HyeApp());
}

class HyeApp extends StatefulWidget {
  @override
  _HyeAppState createState() => _HyeAppState();
}

class _HyeAppState extends State<HyeApp> {
  bool isDark = true;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'HYE Flutter',
      theme: isDark? ThemeData.dark() : ThemeData.light(),
      home: TodoPage(
        toggleTheme: () => setState(() => isDark =!isDark),
        isDark: isDark,
      ),
      debugShowCheckedModeBanner: false,
    );
  }
}

class Todo {
  String id;
  String text;
  bool done;

  Todo({required this.id, required this.text, this.done = false});

  Map<String, dynamic> toJson() => {'id': id, 'text': text, 'done': done};
  factory Todo.fromJson(Map<String, dynamic> json) => Todo(
    id: json['id'],
    text: json['text'],
    done: json['done'],
  );
}

class TodoPage extends StatefulWidget {
  final VoidCallback toggleTheme;
  final bool isDark;

  TodoPage({required this.toggleTheme, required this.isDark});

  @override
  _TodoPageState createState() => _TodoPageState();
}

class _TodoPageState extends State<TodoPage> {
  List<Todo> todos = [];
  TextEditingController controller = TextEditingController();

  @override
  void initState() {
    super.initState();
    loadTodos();
  }

  Future<void> loadTodos() async {
    final prefs = await SharedPreferences.getInstance();
    final String? todosJson = prefs.getString('todos');
    if (todosJson!= null) {
      final List decoded = json.decode(todosJson);
      setState(() {
        todos = decoded.map((e) => Todo.fromJson(e)).toList();
      });
    }
  }

  Future<void> saveTodos() async {
    final prefs = await SharedPreferences.getInstance();
    final String encoded = json.encode(todos.map((e) => e.toJson()).toList());
    await prefs.setString('todos', encoded);
  }

  void addTodo() {
    if (controller.text.trim().isEmpty) return;
    setState(() {
      todos.add(Todo(id: DateTime.now().toString(), text: controller.text));
      controller.clear();
    });
    saveTodos();
  }

  void toggleTodo(String id) {
    setState(() {
      final todo = todos.firstWhere((t) => t.id == id);
      todo.done =!todo.done;
    });
    saveTodos();
  }

  void deleteTodo(String id) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Delete Todo'),
        content: Text('Are you sure?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Cancel')),
          TextButton(
            onPressed: () {
              setState(() => todos.removeWhere((t) => t.id == id));
              saveTodos();
              Navigator.pop(ctx);
            },
            child: Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('HYE Flutter Todos'),
        actions: [
          IconButton(
            icon: Icon(widget.isDark? Icons.light_mode : Icons.dark_mode),
            onPressed: widget.toggleTheme,
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: controller,
                    decoration: InputDecoration(
                      hintText: 'Add todo...',
                      border: OutlineInputBorder(),
                    ),
                    onSubmitted: (_) => addTodo(),
                  ),
                ),
                SizedBox(width: 8),
                ElevatedButton(onPressed: addTodo, child: Text('Add')),
              ],
            ),
          ),
          Expanded(
            child: todos.isEmpty
           ? Center(child: Text('No todos yet'))
             : ListView.builder(
                  itemCount: todos.length,
                  itemBuilder: (ctx, i) {
                    final todo = todos[i];
                    return Card(
                      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      child: ListTile(
                        leading: Checkbox(
                          value: todo.done,
                          onChanged: (_) => toggleTodo(todo.id),
                        ),
                        title: Text(
                          todo.text,
                          style: TextStyle(
                            decoration: todo.done? TextDecoration.lineThrough : null,
                          ),
                        ),
                        trailing: IconButton(
                          icon: Icon(Icons.delete, color: Colors.red),
                          onPressed: () => deleteTodo(todo.id),
                        ),
                      ),
                    );
                  },
                ),
          ),
        ],
      ),
    );
  }
}`,
    desc: 'Flutter todo app with SharedPreferences'
  },
  {
    name: 'Docker Compose.yml',
    code: `version: '3.8'

services:
  frontend:
    build:
      context:.
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      - VITE_SUPABASE_URL=\${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=\${VITE_SUPABASE_ANON_KEY}
    depends_on:
      - api

  api:
    build:
      context:./api
      dockerfile: Dockerfile
    ports:
      - "3001:3000"
    environment:
      - SUPABASE_URL=\${SUPABASE_URL}
      - SUPABASE_KEY=\${SUPABASE_KEY}
      - JWT_SECRET=\${JWT_SECRET}
      - PORT=3000
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      -./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - frontend
      - api`,
    desc: 'Docker Compose for fullstack deployment'
  },
  {
    name: 'supabase.sql',
    code: `-- HYE Editor Database Schema

CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT,
  path TEXT NOT NULL,
  language TEXT DEFAULT 'javascript',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_templates_category ON templates(category);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own files" ON files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own files" ON files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own files" ON files FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own files" ON files FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public templates" ON templates FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert own templates" ON templates FOR INSERT WITH CHECK (auth.uid() = created_by);`,
    desc: 'Supabase PostgreSQL schema with RLS'
  },
  {
    name: 'app.config.js',
    code: `export default {
  expo: {
    name: "HYE Editor",
    slug: "hye-editor",
    version: "1.3.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#1e1e1e"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.hye.editor"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1e1e1e"
      },
      package: "com.hye.editor",
      permissions: ["READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-file-system",
      "expo-document-picker"
    ]
  }
}`,
    desc: 'Expo config for React Native builds'
  }
]