import React, { useState, useEffect, useRef, Component } from 'react'
import { Capacitor, registerPlugin } from '@capacitor/core'
import Editor from '@monaco-editor/react'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import JSZip from 'jszip'
import {
  Menu, Plus, FolderPlus, Edit3, X, Search, Wand2, FileCode,
  BookOpen, HelpCircle, Terminal, Copy, AlertCircle, ChevronRight,
  ChevronDown, Upload, FolderOpen, FolderTree,
  File, Bot, MoreVertical, Play, Save, ArrowUp, ArrowDown,
  Trash2, RotateCcw, ChevronUp, Clock, Check,
  PlayCircle,
  Replace, Command, Bug, FileSearch, Monitor, Smartphone, Tablet, ExternalLink, RefreshCw, CheckCircle2, Settings, Cloud, Download, Wifi, ShieldCheck, Link2, Unplug
} from 'lucide-react'
import { templates } from './templates.js'
import { syntaxHelp } from './syntaxHelp.js'
import { terms } from './terms.js'
import { registerHyecodeIntelliSense } from './intellisense.js'

const FILE_EXT = ['.js','.jsx','.mjs','.cjs','.ts','.tsx','.mts','.cts','.html','.htm','.env','.gitignore','.dockerignore','.editorconfig','.prettierrc','.eslintrc','.babelrc','.npmrc','.nvmrc','.htaccess','.css','.scss','.sass','.less','.json','.jsonc','.md','.mdx','.txt','.xml','.svg','.yaml','.yml','.toml','.ini','.py','.pyw','.ipynb','.java','.kt','.kts','.c','.h','.cc','.cpp','.cxx','.hpp','.cs','.go','.rs','.php','.rb','.swift','.dart','.sql','.sh','.bash','.zsh','.ps1','.bat','.cmd','.lua','.r','.R','.pl','.ex','.exs','.erl','.hrl','.clj','.cljs','.scala','.sc','.groovy','.gradle','.vue','.svelte','.astro','.graphql','.gql','.proto','.dockerfile','.makefile','.mk','.tf','.hcl','.sol','.wasm','.asm','.s','.v','.vhd','.vhdl']
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`
const languageForFile = (name = '') => {
  const lower = name.toLowerCase(); const ext = lower.includes('.') ? `.${lower.split('.').pop()}` : lower
  const map = {'.js':'javascript','.jsx':'javascript','.mjs':'javascript','.cjs':'javascript','.ts':'typescript','.tsx':'typescript','.mts':'typescript','.cts':'typescript','.html':'html','.htm':'html','.css':'css','.scss':'scss','.sass':'scss','.less':'less','.json':'json','.jsonc':'json','.md':'markdown','.mdx':'markdown','.xml':'xml','.svg':'xml','.yaml':'yaml','.yml':'yaml','.toml':'ini','.py':'python','.pyw':'python','.java':'java','.kt':'kotlin','.kts':'kotlin','.c':'c','.h':'c','.cc':'cpp','.cpp':'cpp','.cxx':'cpp','.hpp':'cpp','.cs':'csharp','.go':'go','.rs':'rust','.php':'php','.rb':'ruby','.swift':'swift','.dart':'dart','.sql':'sql','.sh':'shell','.bash':'shell','.zsh':'shell','.ps1':'powershell','.bat':'bat','.cmd':'bat','.lua':'lua','.r':'r','.ex':'elixir','.exs':'elixir','.erl':'erlang','.clj':'clojure','.scala':'scala','.groovy':'groovy','.gradle':'groovy','.vue':'html','.svelte':'html','.astro':'html','.graphql':'graphql','.gql':'graphql','.proto':'protobuf','.tf':'hcl','.hcl':'hcl','.sol':'sol','.dockerfile':'dockerfile','.makefile':'makefile','.mk':'makefile','.dockerfile':'dockerfile'}
  return map[ext] || (lower === 'dockerfile' ? 'dockerfile' : lower === 'makefile' ? 'makefile' : 'plaintext')
}
const GitHubMark = ({ size = 16, style = {}, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', ...style }} {...props}>
    <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.54v-2.08c-3.1.67-3.76-1.32-3.76-1.32-.5-1.29-1.23-1.63-1.23-1.63-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15.99 1.7 2.6 1.21 3.23.92.1-.72.39-1.21.7-1.49-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.21 1.15-2.99-.12-.28-.5-1.42.11-2.95 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.11-1.44 3.05-1.14 3.05-1.14.61 1.53.23 2.67.11 2.95.72.78 1.15 1.77 1.15 2.99 0 4.29-2.61 5.24-5.1 5.51.4.35.75 1.03.75 2.08v3.06c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
  </svg>
)

const LocalLlama = registerPlugin('LocalLlama')
const ProjectFolder = registerPlugin('ProjectFolder')
const safeStorage = { get(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)) } catch { return fallback } }, set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)) } catch {} } }
const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null, resetKey: 0 } }
  static getDerivedStateFromError(error) { return { hasError: true, error } }
  componentDidCatch(error, errorInfo) { console.error('Hyecode:', error, errorInfo) }
  reset = () => this.setState(state => ({ hasError: false, error: null, resetKey: state.resetKey + 1 }))
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100dvh', background: '#050505', color: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'monospace' }}>
          <div style={{ maxWidth: 560, width: '100%', border: '1px solid #472323', background: '#100b0b', borderRadius: 14, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#ff8178' }}><AlertCircle size={22} /><h2 style={{ margin: 0, fontSize: 17 }}>Application Error</h2></div>
            <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 180, overflow: 'auto', background: '#080808', padding: 12, borderRadius: 8, color: '#ffaaa4', fontSize: 11 }}>{this.state.error?.message}</pre>
            <button className="btn-main" onClick={this.reset}>Try again</button>
          </div>
        </div>
      )
    }
    return <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>
  }
}

const ProblemsNavIcon = ({ size = 22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3.25 22 20.5H2L12 3.25Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M12 9v5.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="17.2" r=".9" fill="currentColor"/></svg>

const BrandSplash = () => (
  <div role="presentation" style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 50% 42%, #101a35 0%, #070a15 46%, #05070f 78%)', padding: 24 }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transform: 'translateY(-2vh)' }}>
      <img src="/hyecode-mark.png" alt="" style={{ display: 'block', width: 'min(54vw, 230px)', height: 'auto', maxHeight: '22vh', objectFit: 'contain', marginBottom: 18 }} />
      <div style={{ fontSize: 'clamp(30px, 8vw, 42px)', fontWeight: 800, letterSpacing: '-1.6px', lineHeight: 1.1, color: '#f4f7ff' }}>Hye <span style={{ color: '#4cbeff' }}>code</span></div>
      <div style={{ marginTop: 11, color: '#a4b0c8', fontSize: 13, letterSpacing: '.35px' }}>Seamless mobile coding</div>
    </div>
  </div>
)

const HyeEditorCore = () => {
  const [showBrandSplash, setShowBrandSplash] = useState(true)
  const [files, setFiles] = useState([])
  const [openFiles, setOpenFiles] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [status, setStatus] = useState('ready · local mode')
  const [isTyping, setIsTyping] = useState(false)
  const [showMinimap, setShowMinimap] = useState(false)
  const [wordWrap, setWordWrap] = useState(() => safeStorage.get('hye_word_wrap', false))
  const [workspacePath, setWorkspacePath] = useState('')
  const [activeOverlay, setActiveOverlay] = useState(null)
  const [botTab, setBotTab] = useState('offline')
  const [aiSettingsTab, setAiSettingsTab] = useState('local')
  const [cloudProvider, setCloudProvider] = useState(() => safeStorage.get('hye_cloud_provider', 'openrouter'))
  const [cloudBaseUrl, setCloudBaseUrl] = useState(() => safeStorage.get('hye_cloud_base_url', 'https://openrouter.ai/api/v1'))
  const [cloudModel, setCloudModel] = useState(() => safeStorage.get('hye_cloud_model', ''))
  const [cloudKey, setCloudKey] = useState('')
  const [cloudConnected, setCloudConnected] = useState(false)
  const [githubToken, setGithubToken] = useState('')
  const [githubConnected, setGithubConnected] = useState(false)
  const [githubUser, setGithubUser] = useState(null)
  const [githubRepos, setGithubRepos] = useState([])
  const [githubBusy, setGithubBusy] = useState(false)
  const [githubRepoQuery, setGithubRepoQuery] = useState('')
  const [clonePath, setClonePath] = useState('/storage/emulated/0/HyecodeProjects')
  const [localModelStatus, setLocalModelStatus] = useState(() => safeStorage.get('hye_local_model_status', 'not-installed'))
  const [localModelProgress, setLocalModelProgress] = useState(0)
  const [localModelNote, setLocalModelNote] = useState('No model installed')
  const [localModelUrl, setLocalModelUrl] = useState(() => safeStorage.get('hye_local_model_url', ''))
  const [localModelFileName, setLocalModelFileName] = useState(() => safeStorage.get('hye_local_model_filename', 'hyecode-coder.gguf'))
  const [localModelSha256, setLocalModelSha256] = useState(() => safeStorage.get('hye_local_model_sha256', ''))
  const [localModelDownloadId, setLocalModelDownloadId] = useState(() => safeStorage.get('hye_local_model_download_id', ''))
  const [localModelBusy, setLocalModelBusy] = useState(false)
  const [localModelLoaded, setLocalModelLoaded] = useState(false)
  const localDownloadMonitorRef = useRef(false)
  const [projectInput, setProjectInput] = useState('')
  const [newItemName, setNewItemName] = useState('')
  const [newItemType, setNewItemType] = useState('file')
  const [selectedFolder, setSelectedFolder] = useState('')
  const [expandedFolders, setExpandedFolders] = useState(() => new Set(['']))
  const [localSearch, setLocalSearch] = useState('')
  const [treeSearch, setTreeSearch] = useState('')
  const [contextItemId, setContextItemId] = useState(null)
  const [askInput, setAskInput] = useState('')
  const [helpInput, setHelpInput] = useState('')
  const [templateInput, setTemplateInput] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [previewErrors, setPreviewErrors] = useState([])
  const [projectHistory, setProjectHistory] = useState(() => safeStorage.get('hye_history', []))
  const [showPermissionNotice, setShowPermissionNotice] = useState(() => !safeStorage.get('hye_permission_notice_dismissed', false) && !window.Capacitor?.isNativePlatform?.())
  const [recoveryAvailable, setRecoveryAvailable] = useState(() => { const saved = safeStorage.get('hye_recovery', null); return Boolean(saved?.files?.some(file => file.dirty)) })
  const [globalSearch, setGlobalSearch] = useState('')
  const [globalReplace, setGlobalReplace] = useState('')
  const [globalCaseSensitive, setGlobalCaseSensitive] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState('')
  const [previewViewport, setPreviewViewport] = useState('responsive')
  const [problemFilter, setProblemFilter] = useState('all')

  const [debugEntries, setDebugEntries] = useState([])
  const [consoleFilter, setConsoleFilter] = useState('all')
  const [consoleSearch, setConsoleSearch] = useState('')
  const [consoleInput, setConsoleInput] = useState('')
  const [consoleBusy, setConsoleBusy] = useState(false)
  const [preserveConsole, setPreserveConsole] = useState(true)
  const [previewRunning, setPreviewRunning] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [debugTab, setDebugTab] = useState('console')
  const [expandedEntryIds, setExpandedEntryIds] = useState(() => new Set())

  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const intelliSenseRef = useRef(null)
  const filesRef = useRef(files)
  const iframeRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const previewSessionRef = useRef('')
  const debugEntriesRef = useRef([])

  useEffect(() => {
    const splashTimer = window.setTimeout(() => setShowBrandSplash(false), 1450)
    return () => window.clearTimeout(splashTimer)
  }, [])

  useEffect(() => { debugEntriesRef.current = debugEntries }, [debugEntries])
  useEffect(() => { filesRef.current = files }, [files])
  useEffect(() => {
    if (!monacoRef.current || !intelliSenseRef.current) return
    intelliSenseRef.current.syncWorkspaceModels()
  }, [files, activeId])
  useEffect(() => { safeStorage.set('hye_word_wrap', wordWrap) }, [wordWrap])
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let active = true
    const recoverModelState = async () => {
      if (localModelDownloadId) {
        monitorLocalDownload(localModelDownloadId, localModelFileName, localModelSha256)
        return
      }
      if (localModelStatus === 'installed') {
        try {
          const verified = await LocalLlama.validateModel({ fileName: localModelFileName, sha256: '' })
          if (active) setLocalModelNote(`Verified model available · ${(Number(verified.sizeBytes) / 1024 / 1024).toFixed(1)} MB`)
        } catch {
          if (active) { setLocalModelStatus('not-installed'); setLocalModelLoaded(false); setLocalModelNote('No verified model file found. Download the model to install it.'); safeStorage.set('hye_local_model_status', 'not-installed') }
        }
      }
    }
    recoverModelState()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!workspacePath || !files.length) return
    const timer = window.setTimeout(() => {
      safeStorage.set('hye_recovery', { workspacePath, files, openFiles, activeId, savedAt: Date.now() })
      setRecoveryAvailable(files.some(file => file.dirty))
    }, 650)
    return () => window.clearTimeout(timer)
  }, [files, workspacePath, openFiles, activeId])

  useEffect(() => {
    const onKeys = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); saveDirtyFiles(); return }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'p') { event.preventDefault(); setPaletteQuery(''); setActiveOverlay('palette') }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'f') { event.preventDefault(); setGlobalSearch(''); setGlobalReplace(''); setActiveOverlay('search') }
    }
    window.addEventListener('keydown', onKeys)
    return () => window.removeEventListener('keydown', onKeys)
  }, [])

  const addDebugEntry = (kind, message, extra = {}) => {
    const entry = { id: uid(), kind, message: typeof message === 'string' ? message : safeFormat(message), time: new Date().toLocaleTimeString(), timestamp: Date.now(), ...extra }
    setDebugEntries(previous => [...previous, entry].slice(-1500))
    if (kind === 'error' || kind === 'exception') setPreviewErrors(previous => [...previous, entry.message])
  }

  const handleEditorFocus = () => setIsTyping(true)
  const handleEditorBlur = () => setIsTyping(false)
  const handleEditorChange = (val) => {
    setFiles(previous => previous.map(file => file.id === activeId ? { ...file, content: val ?? '' , dirty: true } : file))
    setIsTyping(true)
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000)
  }

  const loadWorkspace = async (path) => {
    const cleanPath = path.trim().replace(/\\/g, '/').replace(/\/+$/, '')
    if (!cleanPath) { setStatus('Choose a folder path first'); return }
    setStatus('Opening workspace…')
    const scanWarnings = []
    const normalizePath = value => (value || '').replace(/\\/g, '/').replace(/\/+$/, '')
    const binaryExtensions = new Set([
      '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.bmp', '.tif', '.tiff',
      '.mp3', '.wav', '.ogg', '.mp4', '.mov', '.avi', '.mkv', '.pdf', '.zip', '.gz', '.7z',
      '.rar', '.tar', '.exe', '.dll', '.so', '.class', '.jar', '.pyc', '.wasm', '.woff',
      '.woff2', '.ttf', '.otf', '.eot', '.sqlite', '.db', '.bin', '.apk', '.aab'
    ])
    const scan = async (currentPath, visited = new Set()) => {
      const normalizedCurrent = normalizePath(currentPath)
      if (visited.has(normalizedCurrent)) return []
      visited.add(normalizedCurrent)
      let listing
      try {
        listing = await Filesystem.readdir({ path: normalizedCurrent, directory: Directory.ExternalStorage })
      } catch (error) {
        scanWarnings.push(`Could not read folder ${normalizedCurrent}: ${error?.message || 'access denied'}`)
        addDebugEntry('warn', `Could not read folder ${normalizedCurrent}: ${error?.message || error}`)
        return []
      }
      const result = []
      const entries = [...(listing?.files || [])].sort((a, b) => {
        const aDir = a.type === 'directory' ? 0 : 1
        const bDir = b.type === 'directory' ? 0 : 1
        return aDir - bDir || String(a.name).localeCompare(String(b.name))
      })
      for (const entry of entries) {
        if (!entry?.name || entry.name === '.' || entry.name === '..') continue
        const fullPath = `${normalizedCurrent}/${entry.name}`.replace(/\/{2,}/g, '/')
        if (entry.type === 'directory') {
          result.push({ id: `dir-${uid()}`, name: entry.name, path: fullPath, type: 'directory', content: '', unreadable: false })
          result.push(...await scan(fullPath, visited))
          continue
        }
        const lowerName = entry.name.toLowerCase()
        const dot = lowerName.lastIndexOf('.')
        const extension = dot >= 0 ? lowerName.slice(dot) : ''
        const isKnownBinary = binaryExtensions.has(extension)
        let content = ''
        let unreadable = false
        let binary = isKnownBinary
        if (!isKnownBinary) {
          try {
            const readResult = await Filesystem.readFile({ path: fullPath, directory: Directory.ExternalStorage, encoding: Encoding.UTF8 })
            content = typeof readResult?.data === 'string' ? readResult.data : ''
            if (content.includes('\u0000')) { content = ''; binary = true }
          } catch (error) {
            unreadable = true
            scanWarnings.push(`Could not read file ${fullPath}: ${error?.message || 'read failed'}`)
            addDebugEntry('warn', `Could not read file ${fullPath}: ${error?.message || error}`)
          }
        }
        result.push({ id: uid(), name: entry.name, path: fullPath, type: 'file', content, dirty: false, binary, unreadable })
      }
      return result
    }
    try {
      const loaded = await scan(cleanPath)
      setFiles(loaded)
      const firstFile = loaded.find(file => file.type === 'file' && !file.binary && !file.unreadable)
      setActiveId(firstFile?.id || null)
      setOpenFiles(firstFile ? [firstFile.id] : [])
      setWorkspacePath(cleanPath)
      setSelectedFolder(cleanPath)
      const normalizedRoot = normalizePath(cleanPath)
      // Expand every discovered directory so nested files and empty folders are visible immediately.
      const autoExpand = new Set(['', normalizedRoot])
      loaded.forEach(item => {
        if (item.type === 'directory') autoExpand.add(normalizePath(item.path))
      })
      setExpandedFolders(autoExpand)
      const newHistory = [cleanPath, ...projectHistory.filter(item => item !== cleanPath)].slice(0, 5)
      setProjectHistory(newHistory)
      safeStorage.set('hye_history', newHistory)
      setActiveOverlay(null)
      const fileCount = loaded.filter(item => item.type === 'file').length
      const folderCount = loaded.filter(item => item.type === 'directory').length
      setStatus(scanWarnings.length
        ? `Workspace loaded · ${fileCount} files · ${folderCount} folders · ${scanWarnings.length} warning(s)`
        : `Workspace ready · ${fileCount} files · ${folderCount} folders`)
    } catch (error) {
      setStatus(`Workspace error: ${error.message || 'Unable to read this path'}`)
      addDebugEntry('error', `Workspace could not be opened: ${error.message || error}`)
    }
  }


  const pickProjectFolder = async () => {
    if (!Capacitor.isNativePlatform()) {
      setStatus('Folder picking is available in the Android app. Use Open Path in the browser.')
      return
    }
    try {
      const result = await ProjectFolder.pickFolder()
      if (result?.path) {
        setProjectInput(result.path)
        await loadWorkspace(result.path)
      }
    } catch (error) {
      const message = error?.message || ''
      if (!/cancel|canceled|cancelled/i.test(message)) setStatus('Could not open that folder. Try choosing a folder in shared device storage.')
    }
  }

  const openTab = (id) => { setActiveId(id); setOpenFiles(previous => previous.includes(id) ? previous : [...previous, id]) }
  const closeTab = (id, event) => {
    event?.stopPropagation()
    const remaining = openFiles.filter(fileId => fileId !== id)
    setOpenFiles(remaining)
    if (activeId === id) setActiveId(remaining.length ? remaining[remaining.length - 1] : null)
  }
  const closeAllSaved = () => {
    const unsaved = openFiles.filter(id => files.find(file => file.id === id)?.dirty)
    setOpenFiles(unsaved)
    setActiveId(unsaved[0] || null)
    setActiveOverlay(null)
  }
  const closeAll = () => { setOpenFiles([]); setActiveId(null); setActiveOverlay(null) }

  const safeFormat = (value) => {
    if (typeof value === 'string') return value
    if (value instanceof Error) return `${value.name}: ${value.message}`
    try {
      const seen = new WeakSet()
      return JSON.stringify(value, (_key, item) => {
        if (typeof item === 'bigint') return `${item}n`
        if (item && typeof item === 'object') { if (seen.has(item)) return '[Circular]'; seen.add(item) }
        if (typeof item === 'function') return `[Function ${item.name || 'anonymous'}]`
        return item
      }, 2) ?? String(value)
    } catch { return String(value) }
  }

  const runPreview = () => {
    const activeFile = files.find(file => file.id === activeId)
    if (!activeFile || !activeFile.path.toLowerCase().endsWith('.html')) {
      addDebugEntry('warn', 'Open an HTML file to run the preview.')
      setActiveOverlay('console')
      return
    }

    let html = activeFile.content || ''
    const cssLinks = [...html.matchAll(/<link\b[^>]*href=["']([^"']+\.css(?:\?[^"']*)?)["'][^>]*>/gi)]
    cssLinks.forEach(match => {
      const href = match[1].split('?')[0]
      const cssFile = files.find(file => file.type === 'file' && (file.path === href || file.path.endsWith(`/${href.split('/').pop()}`) || file.name === href.split('/').pop()))
      if (cssFile) html = html.replace(match[0], `<style data-hye-source="${cssFile.name}">\n${cssFile.content}\n</style>`)
      else addDebugEntry('warn', `Stylesheet not found in workspace: ${href}`)
    })

    const runId = uid()
    previewSessionRef.current = runId
    setPreviewRunning(true)
    if (!preserveConsole) setDebugEntries([])
    setPreviewErrors([])
    setStatus('Running HTML preview…')

    const bridge = `
<script>
(() => {
  const RUN_ID = ${JSON.stringify(runId)};
  const send = (kind, args, extra = {}) => {
    try { parent.postMessage({ __hyeDebug: true, runId: RUN_ID, kind, args: Array.from(args || []).map(format), ...extra }, '*'); } catch (_) {}
  };
  function format(value) {
    if (typeof value === 'string') return value;
    if (value instanceof Error) return value.name + ': ' + value.message;
    if (typeof value === 'function') return '[Function ' + (value.name || 'anonymous') + ']';
    try { const seen = new WeakSet(); return JSON.stringify(value, (key, item) => { if (typeof item === 'bigint') return String(item) + 'n'; if (item && typeof item === 'object') { if (seen.has(item)) return '[Circular]'; seen.add(item); } if (typeof item === 'function') return '[Function ' + (item.name || 'anonymous') + ']'; return item; }, 2) ?? String(value); } catch (_) { return String(value); }
  }
  ['log','info','warn','error','debug','table','dir','assert','count','time','timeEnd','group','groupCollapsed','groupEnd','trace'].forEach(level => {
    const original = console[level] ? console[level].bind(console) : () => {};
    console[level] = (...args) => {
      try { original(...args); } catch (_) {}
      let kind = level === 'warn' ? 'warn' : (level === 'error' || level === 'assert') ? 'error' : level === 'info' ? 'info' : level === 'debug' ? 'debug' : 'log';
      if (level === 'assert' && args[0]) return;
      send(kind, level === 'assert' ? args.slice(1) : args, { level });
    };
  });
  window.addEventListener('error', event => {
    const target = event.target;
    if (target && target !== window && target.tagName) { const src = target.src || target.href || ''; send('resource', [target.tagName.toLowerCase() + ' failed to load' + (src ? ': ' + src : '')], { source: src, line: 0, column: 0 }); return; }
    send('exception', [event.message || 'Script error'], { source: event.filename || '', line: event.lineno || 0, column: event.colno || 0, stack: event.error && event.error.stack || '' });
  }, true);
  window.addEventListener('unhandledrejection', event => send('exception', [event.reason && (event.reason.stack || event.reason.message) || String(event.reason)], { stack: event.reason && event.reason.stack || '' }));
  window.addEventListener('message', event => {
    if (event.source !== parent || !event.data || event.data.__hyeCommand !== true || event.data.runId !== RUN_ID) return;
    if (event.data.command === 'evaluate') {
      try {
        const result = (0, eval)(String(event.data.expression));
        Promise.resolve(result).then(value => send('result', [value], { requestId: event.data.requestId })).catch(error => send('eval-error', [error && (error.stack || error.message) || String(error)], { requestId: event.data.requestId }));
      } catch (error) { send('eval-error', [error && (error.stack || error.message) || String(error)], { requestId: event.data.requestId }); }
    }
  });
  send('system', ['Preview started']);
})();
</script>`

    if (/<head\b[^>]*>/i.test(html)) html = html.replace(/<head\b[^>]*>/i, match => `${match}${bridge}`)
    else if (/<html\b[^>]*>/i.test(html)) html = html.replace(/<html\b[^>]*>/i, match => `${match}<head>${bridge}</head>`)
    else html = `<!doctype html><html><head>${bridge}</head><body>${html}</body></html>`

    setPreviewHtml(html)
    setActiveOverlay('preview')
  }

 useEffect(() => {
    const handler = (event) => {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return
      const data = event.data
      if (!data || data.__hyeDebug !== true || data.runId !== previewSessionRef.current) return
      const args = Array.isArray(data.args) ? data.args : []
      const message = args.map(value => typeof value === 'string' ? value : safeFormat(value)).join(' ')
      if (data.kind === 'exception') {
        const location = data.source ? ` (${data.source}${data.line ? `:${data.line}` : ''}${data.column ? `:${data.column}` : ''})` : ''
        addDebugEntry('exception', `${message || 'Uncaught exception'}${location}`, { stack: data.stack || '', source: data.source || '', line: data.line || 0, column: data.column || 0 })
        setStatus('Preview has runtime errors')
      } else if (data.kind === 'eval-error') {
        setConsoleBusy(false)
        addDebugEntry('error', message || 'Expression evaluation failed', { requestId: data.requestId, stack: message })
      } else if (data.kind === 'result') {
        setConsoleBusy(false)
        addDebugEntry('result', message || 'undefined', { requestId: data.requestId })
      } else if (data.kind === 'resource') {
        addDebugEntry('resource', message || 'Resource failed to load', { source: data.source || '' })
        setStatus('Preview resource issue detected')
      } else {
        addDebugEntry(data.kind || 'log', message || (data.kind === 'system' ? 'Preview event' : ''), { level: data.level || '', source: data.source || '', line: data.line || 0, column: data.column || 0, stack: data.stack || '' })
        if (data.kind === 'system') setStatus('Preview running')
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  useEffect(() => {
    const onFrameLoad = () => setPreviewRunning(true)
    const frame = iframeRef.current
    frame?.addEventListener('load', onFrameLoad)
    return () => frame?.removeEventListener('load', onFrameLoad)
  }, [activeOverlay])

  const sendConsoleCommand = (event) => {
    event.preventDefault()
    const expression = consoleInput.trim()
    if (!expression || !iframeRef.current?.contentWindow || !previewSessionRef.current) {
      if (expression) addDebugEntry('warn', 'Run an HTML preview before evaluating expressions.')
      return
    }
    addDebugEntry('command', `› ${expression}`)
    setConsoleInput('')
    setConsoleBusy(true)
    const requestId = uid()
    iframeRef.current.contentWindow.postMessage({ __hyeCommand: true, command: 'evaluate', expression, requestId, runId: previewSessionRef.current }, '*')
    window.setTimeout(() => setConsoleBusy(false), 5000)
  }

  const clearConsole = () => { setDebugEntries([]); setPreviewErrors([]); setExpandedEntryIds(new Set()) }
  const filteredEntries = debugEntries.filter(entry => {
    const matchesFilter = consoleFilter === 'all' || entry.kind === consoleFilter || (consoleFilter === 'errors' && ['error', 'exception'].includes(entry.kind))
    const matchesSearch = !consoleSearch.trim() || `${entry.message} ${entry.stack || ''} ${entry.source || ''}`.toLowerCase().includes(consoleSearch.toLowerCase())
    return matchesFilter && matchesSearch
  })
  const counts = {
    errors: debugEntries.filter(entry => ['error', 'exception'].includes(entry.kind)).length,
    warnings: debugEntries.filter(entry => entry.kind === 'warn').length,
    logs: debugEntries.filter(entry => ['log', 'info', 'debug', 'result'].includes(entry.kind)).length
  }

  const searchAI = async (type) => {
    const tab = type === 'templates' ? 'templates' : type
    const input = tab === 'ask' ? askInput : tab === 'help' ? helpInput : templateInput
    if (!input.trim() || aiBusy) return
    const currentFile = files.find(file => file.id === activeId)
    const projectContext = currentFile
      ? `\n\nCurrent editor file: ${currentFile.name}\nLanguage: ${languageForFile(currentFile.name)}\n\nCurrent file content (may be incomplete):\n\`\`\`${languageForFile(currentFile.name)}\n${String(currentFile.content || '').slice(0, 14000)}\n\`\`\``
      : '\n\nNo file is currently open.'
    const prompt = (tab === 'ask'
      ? `${input}\nContext: answer as a practical programming tutor. Explain clearly and include code when useful.`
      : tab === 'help'
        ? `Provide syntax help, explain how it works, and give a clear code example for: ${input}`
        : `Generate a useful code template for: ${input}. Return code and a brief explanation.`) + projectContext
    // Cloud AI is opt-in and uses the user's own provider credentials. Only the active file is included.
    if (!cloudConnected || !cloudKey.trim() || !cloudModel.trim()) {
      setAiResult({ name: 'Connect Cloud AI', source: 'local', type: tab, result: 'Cloud AI is not connected. Open the settings icon, choose Cloud, and configure a provider using your own API key. You can continue using Offline Help without connecting any service.' })
      setStatus('Cloud AI not connected')
      return
    }
    setAiBusy(true); setStatus('Contacting your AI provider…'); setAiResult(null)
    try {
      const base = cloudBaseUrl.trim().replace(/\/+$/, '')
      const systemMessage = 'You are a concise, careful programming assistant inside Hyecode, a mobile code editor. If you provide code, separate it clearly from the explanation. Do not claim to have executed code unless a tool actually did so.'
      const isAnthropic = cloudProvider === 'anthropic'
      const endpoint = isAnthropic ? `${base}/messages` : `${base}/chat/completions`
      const headers = isAnthropic
        ? { 'Content-Type': 'application/json', 'x-api-key': cloudKey.trim(), 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }
        : { 'Content-Type': 'application/json', Authorization: `Bearer ${cloudKey.trim()}` }
      const body = isAnthropic
        ? { model: cloudModel.trim(), max_tokens: 2048, system: systemMessage, messages: [{ role: 'user', content: prompt }] }
        : { model: cloudModel.trim(), messages: [{ role: 'system', content: systemMessage }, { role: 'user', content: prompt }], temperature: 0.2 }
      const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout ? AbortSignal.timeout(60000) : undefined })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error?.message || data?.message || `Provider returned HTTP ${response.status}`)
      const answer = isAnthropic
        ? (data?.content || []).filter(part => part.type === 'text').map(part => part.text).join('\n')
        : (typeof data?.choices?.[0]?.message?.content === 'string' ? data.choices[0].message.content : (data?.choices?.[0]?.message?.content || []).map(part => part.text || '').join('\n'))
      if (!answer) throw new Error('The provider returned an empty response')
      const codeMatch = String(answer).match(/```(?:[\w#+.-]+)?\s*\n([\s\S]*?)```/)
      const providerNames = { openrouter: 'OpenRouter', openai: 'OpenAI API', gemini: 'Google Gemini', groq: 'Groq', anthropic: 'Anthropic', custom: 'Custom provider' }
      setAiResult({ name: `${providerNames[cloudProvider] || 'Connected AI'} · ${cloudModel}`, result: String(answer).replace(/```[\w#+.-]*\s*\n[\s\S]*?```/g, '').trim(), code: codeMatch?.[1] || '', source: 'ai', type: tab })
      setStatus('Cloud AI response ready')
    } catch (error) {
      setAiResult({ name: 'Cloud AI request failed', source: 'local', type: tab, result: `${error.message || 'Could not reach the provider'}. Check the provider URL, model ID, API key, network connection, and provider CORS support. Offline Help remains available.` })
      setStatus('Cloud AI unavailable')
    } finally { setAiBusy(false) }
  }

  const saveCloudSettings = () => {
    const base = cloudBaseUrl.trim().replace(/\/+$/, '')
    if (!/^https:\/\//i.test(base)) { setStatus('Provider URL must use HTTPS'); return }
    if (!cloudKey.trim() || !cloudModel.trim()) { setStatus('Enter an API key and model ID'); return }
    safeStorage.set('hye_cloud_provider', cloudProvider)
    safeStorage.set('hye_cloud_base_url', base)
    safeStorage.set('hye_cloud_model', cloudModel.trim())
    setCloudBaseUrl(base); setCloudConnected(true); setActiveOverlay('bot'); setBotTab('cloud')
    setStatus('Cloud provider configured for this session')
  }

  const disconnectCloud = () => { setCloudKey(''); setCloudConnected(false); setStatus('Cloud AI disconnected. API key cleared from memory.') }

  const connectGitHub = async () => {
    const token = githubToken.trim()
    if (!token) { setStatus('Enter a GitHub fine-grained or classic personal access token'); return }
    setGithubBusy(true)
    try {
      const response = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } })
      if (!response.ok) throw new Error(response.status === 401 ? 'GitHub token was rejected' : `GitHub returned HTTP ${response.status}`)
      const user = await response.json()
      setGithubUser(user); setGithubConnected(true); setGithubToken(token)
      const repoResponse = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100&visibility=all', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } })
      if (!repoResponse.ok) throw new Error(`Connected, but repositories could not be loaded (HTTP ${repoResponse.status})`)
      setGithubRepos(await repoResponse.json())
      setStatus(`Connected to GitHub as ${user.login}`)
    } catch (error) { setGithubConnected(false); setGithubUser(null); setGithubRepos([]); setStatus(`GitHub connection failed: ${error.message}`) }
    finally { setGithubBusy(false) }
  }

  const refreshGitHubRepos = async () => {
    if (!githubToken) return
    setGithubBusy(true)
    try {
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100&visibility=all', { headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setGithubRepos(await response.json()); setStatus('GitHub repositories refreshed')
    } catch (error) { setStatus(`Could not refresh repositories: ${error.message}`) }
    finally { setGithubBusy(false) }
  }

  const cloneGitHubRepo = async (repo) => {
    if (!repo || !githubToken) return
    const rootPath = `${clonePath.trim().replace(/\/+$/, '')}/${repo.name}`
    if (!clonePath.trim()) { setStatus('Choose a destination path first'); return }
    setGithubBusy(true); setStatus(`Downloading ${repo.full_name}…`)
    try {
      const response = await fetch(`https://api.github.com/repos/${repo.full_name}/zipball/${encodeURIComponent(repo.default_branch || 'HEAD')}`, { headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } })
      if (!response.ok) throw new Error(`Repository download failed (HTTP ${response.status})`)
      const zip = await JSZip.loadAsync(await response.arrayBuffer())
      const entries = Object.values(zip.files).filter(file => !file.dir)
      if (!entries.length) throw new Error('The repository archive contains no files')
      let written = 0
      for (const entry of entries) {
        const parts = entry.name.split('/'); const relative = parts.slice(1).join('/')
        if (!relative || relative.split('/').some(part => part === '..')) continue
        // Keep source/config/docs, skip common generated and dependency directories.
        if (/(^|\/)(node_modules|\.git|dist|build|\.next|vendor)\//.test(relative)) continue
        const content = await entry.async('uint8array')
        const path = `${rootPath}/${relative}`
        await Filesystem.writeFile({ path, directory: Directory.ExternalStorage, data: await bytesToBase64(content), recursive: true })
        written++
      }
      await loadWorkspace(rootPath)
      setStatus(`Downloaded ${repo.full_name} into ${rootPath} (${written} files). This is an archive-based checkout; Git commit/push/branch operations are not enabled yet.`)
    } catch (error) { setStatus(`Clone/download failed: ${error.message}`) }
    finally { setGithubBusy(false) }
  }

  const bytesToBase64 = async (bytes) => {
    let binary = ''; const chunk = 0x8000
    for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
    return btoa(binary)
  }

  const disconnectGitHub = () => { setGithubToken(''); setGithubConnected(false); setGithubUser(null); setGithubRepos([]); setStatus('GitHub disconnected; token cleared from app memory') }

  const monitorLocalDownload = async (downloadId, fileName, expectedHash = '') => {
    if (!Capacitor.isNativePlatform() || localDownloadMonitorRef.current) return
    localDownloadMonitorRef.current = true
    setLocalModelBusy(true)
    setLocalModelNote('Android download manager is handling the model download.')
    try {
      while (true) {
        const state = await LocalLlama.getDownloadStatus({ downloadId })
        const total = Number(state.totalBytes || 0)
        const received = Number(state.bytesDownloaded || 0)
        if (total > 0) setLocalModelProgress(Math.min(99, Math.floor(received / total * 100)))
        else if (received > 0) setLocalModelNote(`Downloaded ${formatBytes(received)} · total size is being discovered`)
        if (state.status === 'completed') {
          setLocalModelNote('Download complete. Verifying the GGUF file and checksum…')
          const verified = await LocalLlama.validateModel({ fileName, sha256: expectedHash.trim() })
          setLocalModelProgress(100)
          setLocalModelStatus('installed')
          setLocalModelNote(`Verified · ${formatBytes(verified.sizeBytes)} · SHA-256 ${verified.sha256.slice(0, 16)}…`)
          safeStorage.set('hye_local_model_status', 'installed')
          safeStorage.set('hye_local_model_hash', verified.sha256)
          safeStorage.set('hye_local_model_download_id', '')
          setLocalModelDownloadId('')
          setStatus('Local AI model downloaded and verified')
          return
        }
        if (state.status === 'failed' || state.status === 'missing') throw new Error(state.message || `Android download ${state.status}. Check the URL and network, then retry.`)
        await new Promise(resolve => setTimeout(resolve, 1200))
      }
    } catch (error) {
      setLocalModelStatus('not-installed')
      setLocalModelNote(error.message || 'Model download or verification failed')
      setStatus(`Local model: ${error.message || 'download failed'}`)
    } finally {
      localDownloadMonitorRef.current = false
      setLocalModelBusy(false)
    }
  }

  const startLocalModelDownload = async () => {
    const url = localModelUrl.trim()
    const fileName = localModelFileName.trim()
    if (!Capacitor.isNativePlatform()) { setLocalModelNote('Model downloads and inference require the Android APK.'); return }
    if (!/^https:\/\//i.test(url)) { setLocalModelNote('Enter a direct HTTPS URL to the .gguf file, not the Hugging Face repository page.'); return }
    if (!fileName.toLowerCase().endsWith('.gguf')) { setLocalModelNote('The model filename must end in .gguf'); return }
    if (localModelSha256.trim() && !/^[a-f0-9]{64}$/i.test(localModelSha256.trim())) { setLocalModelNote('SHA-256 must contain exactly 64 hexadecimal characters, or be left empty.'); return }
    safeStorage.set('hye_local_model_url', url)
    safeStorage.set('hye_local_model_filename', fileName)
    safeStorage.set('hye_local_model_sha256', localModelSha256.trim())
    if (localModelLoaded) { try { await LocalLlama.unloadModel(); setLocalModelLoaded(false) } catch (error) { setLocalModelNote(error.message || 'Unload the current model before replacing it'); return } }
    setLocalModelBusy(true); setLocalModelStatus('downloading'); safeStorage.set('hye_local_model_status', 'downloading'); setLocalModelProgress(0)
    setLocalModelNote('Starting Android DownloadManager…')
    try {
      const result = await LocalLlama.startDownload({ url, fileName })
      setLocalModelDownloadId(result.downloadId)
      safeStorage.set('hye_local_model_download_id', result.downloadId)
      await monitorLocalDownload(result.downloadId, fileName, localModelSha256)
    } catch (error) {
      setLocalModelStatus('not-installed'); safeStorage.set('hye_local_model_status', 'not-installed'); setLocalModelNote(error.message || 'Could not start download'); setLocalModelBusy(false)
    }
  }

  const cancelLocalModelDownload = async () => {
    if (!localModelDownloadId) return
    try { await LocalLlama.cancelDownload({ downloadId: localModelDownloadId }) } catch {}
    setLocalModelDownloadId(''); safeStorage.set('hye_local_model_download_id', '')
    setLocalModelBusy(false); setLocalModelStatus('not-installed'); safeStorage.set('hye_local_model_status', 'not-installed'); setLocalModelProgress(0)
    setLocalModelNote('Download cancelled. You can safely retry.')
  }

  const loadLocalModel = async () => {
    if (!Capacitor.isNativePlatform()) { setLocalModelNote('Local inference is available in the Android APK, not in a browser preview.'); return }
    setLocalModelBusy(true); setLocalModelNote('Loading the model into memory. This can take a little while on mobile.')
    try {
      const result = await LocalLlama.loadModel({ fileName: localModelFileName.trim() })
      setLocalModelLoaded(true); setLocalModelNote(`${result.fileName} is loaded and ready for offline coding help.`)
      setStatus('Local AI ready')
    } catch (error) { setLocalModelLoaded(false); setLocalModelNote(error.message || 'Model could not be loaded. Check available RAM and model compatibility.') }
    finally { setLocalModelBusy(false) }
  }

  const askLocalModel = async () => {
    if (!askInput.trim() || aiBusy) return
    if (!localModelLoaded) { setLocalModelNote('Load the installed model before asking a question.'); setStatus('Load the local model first'); return }
    setAiBusy(true); setAiResult(null); setStatus('Generating on this device…')
    try {
      const currentFile = files.find(file => file.id === activeId)
      const activeContext = currentFile ? `\n\nActive file: ${currentFile.name} (${languageForFile(currentFile.name)})\n\`\`\`${languageForFile(currentFile.name)}\n${String(currentFile.content || '').slice(0, 10000)}\n\`\`\`` : ''
      const result = await LocalLlama.generate({ prompt: `${askInput.trim()}${activeContext}

If code is requested, provide a complete practical solution and explain important assumptions. Work offline and do not claim to have run or tested code.` })
      const answer = String(result.text || '').trim()
      const codeMatch = answer.match(/```(?:[\w#+.-]+)?\s*\n([\s\S]*?)```/)
      setAiResult({ name: 'Hyecode Local AI', result: answer.replace(/```[\w#+.-]*\s*\n[\s\S]*?```/g, '').trim(), code: codeMatch?.[1] || '', source: 'ai', type: 'ask' })
      setStatus('Local AI response ready · offline')
    } catch (error) { setAiResult({ name: 'Local AI error', result: error.message || 'Generation failed', source: 'local', type: 'ask' }); setStatus('Local AI generation failed') }
    finally { setAiBusy(false) }
  }

  const deleteLocalModel = async () => {
    if (!Capacitor.isNativePlatform()) return
    setLocalModelBusy(true)
    try {
      await LocalLlama.deleteModel({ fileName: localModelFileName.trim() })
      setLocalModelLoaded(false); setLocalModelStatus('not-installed'); setLocalModelProgress(0)
      setLocalModelNote('Model deleted from device storage. You can download it again at any time.')
      safeStorage.set('hye_local_model_status', 'not-installed'); safeStorage.set('hye_local_model_hash', '')
      setStatus('Local model deleted')
    } catch (error) { setLocalModelNote(error.message || 'Could not delete model') }
    finally { setLocalModelBusy(false) }
  }

  const chooseLocalModel = () => { setActiveOverlay('aiSettings'); setAiSettingsTab('local') }
  const formatBytes = (value) => { const bytes = Number(value || 0); if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`; if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`; return `${(bytes / 1024 ** 3).toFixed(2)} GB` }

  const insertCode = (code) => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection()
      editorRef.current.executeEdits('hye-ai-insert', [{ range: selection, text: String(code || '') }])
      editorRef.current.focus()
      setActiveOverlay(null)
    }
  }

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    monaco.editor.defineTheme('pure-black', {
      base: 'vs-dark', inherit: true,
      rules: [{ token: 'comment', foreground: '6A9955' }],
      colors: { 'editor.background': '#000000', 'editor.lineHighlightBackground': '#111111', 'editorLineNumber.foreground': '#333333', 'editorLineNumber.activeForeground': '#888888' }
    })
    monaco.editor.setTheme('pure-black')
    editor.onDidFocusEditorText(handleEditorFocus)
    editor.onDidBlurEditorText(handleEditorBlur)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => { saveDirtyFiles() })
    intelliSenseRef.current?.dispose()
    intelliSenseRef.current = registerHyecodeIntelliSense(monaco, {
      getFiles: () => filesRef.current,
      getActiveFile: () => filesRef.current.find(file => file.id === activeId) || null,
      setActiveFile: file => {
        setActiveId(file.id)
        setOpenFiles(previous => previous.includes(file.id) ? previous : [...previous, file.id])
      },
    })
  }

  const saveDirtyFiles = async () => {
    const dirty = filesRef.current.filter(file => file.type === 'file' && file.dirty)
    if (!dirty.length) { setStatus('All files saved'); return }
    if (!workspacePath) { setStatus('Open a workspace before saving'); return }
    try {
      for (const file of dirty) await Filesystem.writeFile({ path: file.path, directory: Directory.ExternalStorage, data: file.content, encoding: Encoding.UTF8, recursive: true })
      setFiles(previous => previous.map(file => ({ ...file, dirty: false })))
      setStatus(`Saved ${dirty.length} file${dirty.length === 1 ? '' : 's'}`)
      safeStorage.set('hye_recovery', null)
      setRecoveryAvailable(false)
    } catch (error) {
      addDebugEntry('error', `Save failed: ${error.message}`)
      setStatus(`Save failed: ${error.message}`)
    }
  }

  const closePermissionNotice = () => {
    safeStorage.set('hye_permission_notice_dismissed', true)
    setShowPermissionNotice(false)
  }

  const recoverWorkspace = () => {
    const snapshot = safeStorage.get('hye_recovery', null)
    if (!snapshot?.files?.length) { setRecoveryAvailable(false); return }
    setFiles(snapshot.files)
    setWorkspacePath(snapshot.workspacePath || '')
    setOpenFiles(snapshot.openFiles || [])
    setActiveId(snapshot.activeId || snapshot.openFiles?.[0] || null)
    setSelectedFolder(snapshot.workspacePath || '')
    setExpandedFolders(new Set(['', snapshot.workspacePath || '', ...snapshot.files.filter(file => file.type === 'directory').map(file => file.path)]))
    setActiveOverlay(null)
    setRecoveryAvailable(false)
    setStatus('Recovered local editing session. Save to write changes.')
  }

  const buildProblems = () => {
    const problems = []
    const markers = monacoRef.current?.editor?.getModelMarkers?.({}) || []
    markers.forEach((marker, index) => {
      const uri = marker.resource?.path || ''
      const basename = decodeURIComponent(uri.split('/').pop() || '')
      const file = files.find(item => item.type === 'file' && (item.name === basename || uri.includes(encodeURIComponent(item.name))))
      problems.push({ id: `monaco-${index}-${marker.startLineNumber}`, severity: marker.severity === 8 ? 'error' : marker.severity === 4 ? 'warning' : 'info', message: marker.message, fileId: file?.id, fileName: file?.name || basename || 'Editor', line: marker.startLineNumber || 1, column: marker.startColumn || 1, source: marker.source || 'Monaco' })
    })
    files.filter(file => file.type === 'file').forEach(file => {
      const content = file.content || ''
      const ext = file.name.toLowerCase().split('.').pop()
      if (['html','htm'].includes(ext)) {
        const openTags = (content.match(/<(?!\/|!|\?|area\b|base\b|br\b|col\b|embed\b|hr\b|img\b|input\b|link\b|meta\b|param\b|source\b|track\b|wbr\b)[a-z][^>]*?(?<!\/)>/gi) || []).length
        const closeTags = (content.match(/<\/\s*[a-z][^>]*>/gi) || []).length
        if (openTags > closeTags + 1) problems.push({ id: `html-tags-${file.id}`, severity: 'warning', message: 'Some opening HTML tags may be missing closing tags.', fileId: file.id, fileName: file.name, line: 1, column: 1, source: 'HYE HTML check' })
      }
      if (['css','scss','sass','less'].includes(ext)) {
        let depth = 0; let line = 1; let firstExtra = 0
        for (const ch of content) { if (ch === '{') depth++; if (ch === '}') { depth--; if (depth < 0 && !firstExtra) firstExtra = line } if (ch === '\n') line++ }
        if (depth !== 0) problems.push({ id: `css-braces-${file.id}`, severity: 'error', message: depth > 0 ? `${depth} opening brace(s) missing closing brace.` : 'Extra closing braces.', fileId: file.id, fileName: file.name, line: firstExtra || line, column: 1, source: 'HYE CSS check' })
      }
    })
    debugEntries.filter(entry => ['error','exception','resource'].includes(entry.kind)).forEach(entry => problems.push({ id: `runtime-${entry.id}`, severity: entry.kind === 'resource' ? 'warning' : 'error', message: entry.message, fileName: entry.source ? entry.source.split('/').pop() : 'Preview / Runtime', line: entry.line || 1, column: entry.column || 1, source: entry.kind === 'resource' ? 'Resource loading' : 'Runtime' }))
    const seen = new Set()
    return problems.filter(problem => { const key = `${problem.fileName}:${problem.line}:${problem.message}`; if (seen.has(key)) return false; seen.add(key); return true })
  }

  const allProblems = buildProblems()
  const visibleProblems = allProblems.filter(problem => problemFilter === 'all' || problem.severity === problemFilter)

  const projectSearchResults = (() => {
    const query = globalCaseSensitive ? globalSearch : globalSearch.toLowerCase()
    if (!query) return []
    const results = []
    files.filter(file => file.type === 'file').forEach(file => {
      const content = file.content || ''; const lines = content.split('\n')
      lines.forEach((line, index) => {
        const haystack = globalCaseSensitive ? line : line.toLowerCase()
        let start = 0; let at = haystack.indexOf(query, start)
        while (at !== -1 && results.length < 500) { results.push({ id: `${file.id}-${index}-${at}`, fileId: file.id, fileName: file.name, line: index + 1, column: at + 1, text: line.trim().slice(0, 240) }); start = at + Math.max(query.length, 1); at = haystack.indexOf(query, start) }
      })
    })
    return results
  })()

  const replaceAcrossProject = () => {
    if (!globalSearch) return
    const needle = globalCaseSensitive ? globalSearch : globalSearch.toLowerCase()
    let changed = 0
    setFiles(previous => previous.map(file => {
      if (file.type !== 'file') return file
      const source = file.content || ''
      let output = source
      if (globalCaseSensitive) output = source.split(globalSearch).join(globalReplace)
      else output = source.replace(new RegExp(escapeRegExp(globalSearch), 'gi'), () => globalReplace)
      if (output !== source) { changed++; return { ...file, content: output, dirty: true } }
      return file
    }))
    setStatus(`Replaced matches in ${changed} file${changed === 1 ? '' : 's'}; save to write changes.`)
  }

  const formatActiveFile = () => {
    if (!activeFile) { setStatus('Open a file before formatting'); return }
    const editor = editorRef.current
    const before = activeFile.content || ''
    if (editor) editor.trigger('hye-format', 'editor.action.formatDocument', null)
    window.setTimeout(() => {
      const current = editor?.getValue?.() ?? before
      if (current === before) {
        const formatted = before.split('\n').map(line => line.replace(/[\t ]+$/g, '')).join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s*$/, '') + (before.length ? '\n' : '')
        setFiles(previous => previous.map(file => file.id === activeFile.id ? { ...file, content: formatted, dirty: formatted !== file.content || file.dirty } : file))
      }
      setStatus('Formatting applied.')
    }, 120)
  }

  const applyOfflineFixes = () => {
    if (!activeFile) { setStatus('Open a file before running offline fixes'); return }
    const original = activeFile.content || ''
    const fixed = original.split('\n').map(line => line.replace(/[\t ]+$/g, '')).join('\n').replace(/\n{3,}/g, '\n\n')
    setFiles(previous => previous.map(file => file.id === activeFile.id ? { ...file, content: fixed, dirty: fixed !== original || file.dirty } : file))
    setStatus(fixed === original ? 'No safe whitespace fixes were needed.' : 'Applied safe offline fixes.')
      }
  const runPaletteCommand = (command) => {
    setActiveOverlay(null)
    if (command.id === 'save') saveDirtyFiles()
    else if (command.id === 'search') { setGlobalSearch(''); setGlobalReplace(''); setActiveOverlay('search') }
    else if (command.id === 'problems') setActiveOverlay('problems')
    else if (command.id === 'console') setActiveOverlay('console')
    else if (command.id === 'explorer') setActiveOverlay('tree')
    else if (command.id === 'preview') runPreview()
    else if (command.id === 'format') formatActiveFile()
    else if (command.id === 'newfile') { setNewItemType('file'); setNewItemName(''); setActiveOverlay('newItem') }
    else if (command.id === 'ai') setActiveOverlay('bot')
  }

  const getParentPath = (path) => path?.replace(/\\/g, '/').replace(/\/$/, '').split('/').slice(0, -1).join('/') || workspacePath
  const createItem = async () => {
    const name = newItemName.trim().replace(/^\/+/, '')
    if (!name || !workspacePath) { setStatus('Open a project and enter a name first'); return }
    const parent = selectedFolder || workspacePath
    const path = `${parent.replace(/\/$/, '')}/${name}`
    const isFolder = newItemType === 'folder'
    try {
      if (isFolder) await Filesystem.mkdir({ path, directory: Directory.ExternalStorage, recursive: true })
      else await Filesystem.writeFile({ path, directory: Directory.ExternalStorage, data: '', encoding: Encoding.UTF8, recursive: true })
      const item = { id: isFolder ? `dir-${uid()}` : uid(), name: name.split('/').pop(), path, type: isFolder ? 'directory' : 'file', content: '', dirty: false }
      setFiles(previous => [...previous, item])
      setExpandedFolders(previous => new Set([...previous, parent, path]))
      setSelectedFolder(isFolder ? path : parent)
      if (!isFolder) { setActiveId(item.id); setOpenFiles(previous => previous.includes(item.id) ? previous : [...previous, item.id]) }
      setNewItemName(''); setActiveOverlay('tree'); setStatus(`${isFolder ? 'Created folder' : 'Created file'} ${item.name}`)
    } catch (error) { addDebugEntry('error', `Create failed: ${error.message}`); setStatus(`Create failed: ${error.message}`) }
  }
  const importFiles = async () => {
    if (!workspacePath) { setStatus('Open a project before importing files'); setActiveOverlay('project'); return }
    const input = document.createElement('input'); input.type = 'file'; input.multiple = true; input.accept = '*/*'
    input.onchange = async () => {
      const picked = Array.from(input.files || [])
      if (!picked.length) return
      const target = selectedFolder || workspacePath
      const additions = []
      for (const pickedFile of picked) {
        try {
          const content = await pickedFile.text(); const path = `${target.replace(/\/$/, '')}/${pickedFile.name}`
          await Filesystem.writeFile({ path, directory: Directory.ExternalStorage, data: content, encoding: Encoding.UTF8, recursive: true })
          additions.push({ id: uid(), name: pickedFile.name, path, type: 'file', content, dirty: false })
        } catch (error) { addDebugEntry('error', `Could not import ${pickedFile.name}: ${error.message}`) }
      }
      if (additions.length) { setFiles(previous => [...previous.filter(f => !additions.some(a => a.path === f.path)), ...additions]); setStatus(`Imported ${additions.length} files`) }
      else setStatus('No files imported')
    }
    input.click()
  }
  const deleteItem = async (item) => {
    if (!item) return
    if (!window.confirm(`Delete ${item.type === 'directory' ? 'folder and contents' : 'file'} “${item.name}”?`)) return
    try {
      if (item.type === 'directory') await Filesystem.rmdir({ path: item.path, directory: Directory.ExternalStorage, recursive: true })
      else await Filesystem.deleteFile({ path: item.path, directory: Directory.ExternalStorage })
      const prefix = `${item.path.replace(/\\/g, '/').replace(/\/$/, '')}/`
      const removed = files.filter(file => file.id === item.id || file.path.startsWith(prefix))
      setFiles(previous => previous.filter(file => !removed.some(r => r.id === file.id)))
      setOpenFiles(previous => previous.filter(id => !removed.some(r => r.id === id)))
      if (removed.some(file => file.id === activeId)) setActiveId(null)
      if (selectedFolder === item.path || selectedFolder.startsWith(prefix)) setSelectedFolder(workspacePath)
      setStatus(`Deleted ${item.name}`)
    } catch (error) { addDebugEntry('error', `Delete failed: ${error.message}`); setStatus(`Delete failed: ${error.message}`) }
  }
  const renameItem = async (item) => {
    if (!item) return
    const nextName = window.prompt(`Rename ${item.name}`, item.name)?.trim()
    if (!nextName || nextName === item.name || nextName.includes('/')) return
    const nextPath = `${item.path.slice(0, item.path.lastIndexOf('/') + 1)}${nextName}`
    try {
      await Filesystem.rename({ from: item.path, to: nextPath, directory: Directory.ExternalStorage })
      const oldPrefix = `${item.path.replace(/\\/g, '/').replace(/\/$/, '')}/`; const nextPrefix = `${nextPath.replace(/\\/g, '/').replace(/\/$/, '')}/`
      setFiles(previous => previous.map(file => file.id === item.id ? { ...file, name: nextName, path: nextPath } : file.path.startsWith(oldPrefix) ? { ...file, path: file.path.replace(item.path, nextPath) } : file))
      if (selectedFolder === item.path) setSelectedFolder(nextPath)
      setStatus(`Renamed to ${nextName}`)
    } catch (error) { addDebugEntry('error', `Rename failed: ${error.message}`); setStatus(`Rename failed: ${error.message}`) }
  }
  
  // FIXED: renderFileTree uses strict path matching
  const renderFileTree = () => {
    if (!files.length) return <div style={{ padding: 16, color: '#8b949e', fontSize: 12, lineHeight: 1.6 }}>No files or folders were discovered. Check the project path and Hyecode storage permissions, then reopen the workspace.</div>
    
    const normalized = (path) => (path || '').replace(/\\/g, '/').replace(/\/$/, '')
    const root = normalized(workspacePath)
    const query = treeSearch.trim().toLowerCase()
    
    const getParent = (item) => {
      const path = normalized(item.path)
      const index = path.lastIndexOf('/')
      return index < 0 ? '' : path.slice(0, index)
    }

    // Keep matching entries and their parent folders visible during search.
    let items = files
    if (query) {
      const matches = files.filter(item => item.name.toLowerCase().includes(query) || normalized(item.path).toLowerCase().includes(query))
      const visiblePaths = new Set(matches.map(item => normalized(item.path)))
      matches.forEach(item => {
        let parent = getParent(item)
        while (parent && parent !== root && parent.startsWith(`${root}/`)) {
          visiblePaths.add(parent)
          parent = parent.slice(0, parent.lastIndexOf('/'))
        }
      })
      items = files.filter(item => visiblePaths.has(normalized(item.path)))
    }

    // Only render direct children of the workspace root here; descendants are rendered recursively.
    const roots = items.filter(item => getParent(item) === root)
    
    // Sort roots: folders first, then alphabetically
    roots.sort((a,b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'directory' ? -1 : 1))

    const flatList = []
    
    const appendItem = (item, depth) => {
      flatList.push({ item, depth })
      if (item.type === 'directory' && (query || expandedFolders.has(normalized(item.path)))) {
        const children = items.filter(child => getParent(child) === normalized(item.path))
        children.sort((a,b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'directory' ? -1 : 1))
        children.forEach(child => appendItem(child, depth + 1))
      }
    }
    
    roots.forEach(item => appendItem(item, 0))
    if (!flatList.length) return <div style={{ padding: 16, color: '#8b949e', fontSize: 12 }}>No matching files or folders.</div>

    return flatList.map(({ item, depth }) => (
      <div key={item.id} className={`tree-item ${activeId === item.id ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 5, paddingLeft: 8 + depth * 13, minHeight: 34 }}>
        {item.type === 'directory' ? (
          <button type="button" aria-label={expandedFolders.has(normalized(item.path)) ? `Collapse ${item.name}` : `Expand ${item.name}`} title="Expand/collapse" className="tree-toggle" style={{ padding: 2, border: 0, background: 'transparent', color: '#ccc' }} onClick={() => { setSelectedFolder(item.path); setExpandedFolders(prev => { const next = new Set(prev); const k = normalized(item.path); next.has(k) ? next.delete(k) : next.add(k); return next; }) }}>
            {expandedFolders.has(normalized(item.path)) ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        ) : <span style={{ width: 17, flexShrink: 0 }} />}
        
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', cursor: 'pointer' }} onClick={() => { 
          if (item.type === 'directory') { 
            setSelectedFolder(item.path); 
            setExpandedFolders(prev => new Set([...prev, normalized(item.path)])); 
          } else { 
            if (item.binary || item.unreadable) { setStatus(item.binary ? `${item.name} is a binary file and cannot be edited as text.` : `Cannot read ${item.name}. Check storage permissions.`); return }
            openTab(item.id); 
            setSelectedFolder(getParentPath(item.path)); 
            setActiveOverlay(null); 
          } 
        }}>
          {item.type === 'directory' ? <FolderOpen size={14} /> : <FileCode size={14} />}
          <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', fontSize: 12 }}>{item.name}{item.dirty ? ' •' : ''}</span>
        </div>
        <div className="tree-actions" style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
          {item.type === 'directory' && <button type="button" className="tree-action tree-action-create" aria-label={`Create inside ${item.name}`} title="Create inside" onClick={() => { setSelectedFolder(item.path); setNewItemType('file'); setNewItemName(''); setActiveOverlay('newItem') }}><Plus size={13} /></button>}
          <button type="button" className="tree-action tree-action-rename" aria-label={`Rename ${item.name}`} title="Rename" onClick={() => renameItem(item)}><Edit3 size={13} /></button>
          <button type="button" className="tree-action tree-action-delete" aria-label={`Delete ${item.name}`} title="Delete" onClick={() => deleteItem(item)}><Trash2 size={13} /></button>
        </div>
      </div>
    ))
    }

  const selectLocalItem = (type, item) => {
    if (!item) return
    const name = item.name || item.title || 'Local reference'
    const code = item.code || item.snippet || ''
    const desc = item.desc || item.description || item.explanation || ''
    setAiResult({ name, code, desc, result: desc, source: 'local', type })
  }
  const localItems = (botTab === 'ask' ? terms : botTab === 'help' ? syntaxHelp : templates).filter(item => `${item.name || ''} ${item.desc || ''} ${item.code || ''}`.toLowerCase().includes(localSearch.toLowerCase()))

  const activeFile = files.find(file => file.id === activeId)
  const treeFiles = files.filter(file => file.type === 'file')

  if (!workspacePath) {
    return (
      <div className="app-container">
        <div className="empty-state">
          <h2>Hyecode</h2>
          <p>Local editor ready. Open a project when you're ready.</p>
          <button className="btn-main" onClick={() => setActiveOverlay('project')}>Open Project</button>
          <button className="pill" style={{ marginTop: 10 }} onClick={() => setActiveOverlay('console')}><Terminal size={14} /> Debug Console</button><button className="pill" style={{ marginTop: 10 }} onClick={() => { setGlobalSearch(''); setActiveOverlay('search') }}><FileSearch size={14} /> Search Project</button>
          <div className="history-list">
            <div style={{ padding: '8px 12px', fontSize: 11, color: '#666', borderBottom: '1px solid #222' }}>RECENT HISTORY</div>
            {projectHistory.length ? projectHistory.map((path, index) => <div key={`${path}-${index}`} className="history-item" onClick={() => loadWorkspace(path)}><FolderOpen size={13} style={{ verticalAlign: 'middle', marginRight: 7 }} />{path}</div>) : <div style={{ padding: 12, color: '#666', fontSize: 12 }}>No recent projects</div>}
          </div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 16 }}>{status}</div>
        </div>

        {activeOverlay === 'project' && <div className="overlay center-modal" onClick={() => setActiveOverlay(null)}><div className="modal-content" onClick={event => event.stopPropagation()}><div className="modal-header"><h3>Open Project</h3><X size={18} onClick={() => setActiveOverlay(null)} /></div><div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}><input value={projectInput} onChange={event => setProjectInput(event.target.value)} placeholder="Project folder path" /><button className="btn-main" onClick={() => loadWorkspace(projectInput)}>Open Path</button><div className="project-open-actions"><button className="pill" onClick={pickProjectFolder}><FolderOpen size={14}/> Open Folder</button><button className="pill" onClick={() => setActiveOverlay('github')}><GitHubMark size={14}/> Git / GitHub</button></div>{projectHistory.map(path => <button className="pill" key={path} onClick={() => { setProjectInput(path); loadWorkspace(path) }}><Clock size={13} /> {path}</button>)}</div></div></div>}
        {activeOverlay === 'console' && <DebugConsolePanel entries={filteredEntries} allEntries={debugEntries} counts={counts} filter={consoleFilter} setFilter={setConsoleFilter} search={consoleSearch} setSearch={setConsoleSearch} input={consoleInput} setInput={setConsoleInput} onSubmit={sendConsoleCommand} onClear={clearConsole} busy={consoleBusy} preserve={preserveConsole} setPreserve={setPreserveConsole} tab={debugTab} setTab={setDebugTab} expanded={expandedEntryIds} setExpanded={setExpandedEntryIds} onClose={() => setActiveOverlay(null)} running={previewRunning} />}
        {showPermissionNotice && <div className="overlay center-modal" style={{ zIndex: 5000, background: 'rgba(0,0,0,.82)' }}><div className="modal-content" style={{ width: 'min(92vw, 460px)', border: '1px solid #3a3d43' }}><div className="modal-header"><h3>Allow storage access</h3><span style={{ color: '#8b949e', fontSize: 10 }}>FIRST-TIME SETUP</span></div><div style={{ padding: 18, color: '#c4c8ce', fontSize: 12, lineHeight: 1.7 }}><div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14, color: '#8cc8ff' }}><FolderOpen size={34}/></div><p style={{ marginTop: 0 }}>Hyecode needs Android file-management access to open, create, edit, rename and save project files in shared storage.</p><p style={{ color: '#8b949e' }}>On Android 11 and newer, allow <strong>All files access</strong> in the system prompt. If you skipped it, open Settings → Apps → Hyecode → Special app access → All files access and enable it. Android may label storage permissions differently on older versions.</p><p style={{ color: '#e3b341', fontSize: 11 }}>Android controls this permission. Project operations may fail until access is enabled.</p><button className="btn-main" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={closePermissionNotice}>Continue</button></div></div></div>}
        {!showPermissionNotice && recoveryAvailable && <div className="overlay center-modal" style={{ zIndex: 4900 }}><div className="modal-content" style={{ width: 'min(92vw, 460px)' }}><div className="modal-header"><h3>Recover unsaved work?</h3><X size={18} onClick={() => { setRecoveryAvailable(false); safeStorage.set('hye_recovery', null) }}/></div><div style={{ padding: 16, color: '#aaa', fontSize: 12, lineHeight: 1.6 }}>A local recovery snapshot with unsaved edits was found on this device. Restore it into the editor, review the files, and save them when ready.</div><div style={{ padding: 16, display: 'flex', gap: 8 }}><button className="btn-main" onClick={recoverWorkspace}>Recover session</button><button className="pill" onClick={() => { setRecoveryAvailable(false); safeStorage.set('hye_recovery', null) }}>Discard snapshot</button></div></div></div>}
        {showBrandSplash && <BrandSplash />}
      </div>
    )
  }

  return (
    <div className="app-container hye-editor-shell">
      <style>{`
        .hye-editor-shell{height:100dvh;min-height:0;display:flex;flex-direction:column;position:relative;overflow:hidden;box-sizing:border-box}
        .hye-editor-shell>.header{flex:0 0 auto}
        .hye-editor-shell>.header.hidden{display:none!important}
        .hye-editor-shell>.action-bar{position:relative;top:auto;z-index:20;flex:0 0 auto;display:flex;align-items:center;gap:6px;min-height:42px;overflow-x:auto;overflow-y:hidden;white-space:nowrap;box-sizing:border-box}
        .hye-editor-shell>.recent-bar{flex:0 0 auto;min-height:36px;box-sizing:border-box}
        .hye-editor-shell>.editor-wrapper{flex:1 1 auto;min-height:0;min-width:0;position:relative;overflow:hidden}
        .hye-editor-shell .floating-nav{position:fixed;left:50%;bottom:max(8px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:1000}
        .hye-editor-shell .side-drawer-content{max-height:100dvh;min-height:0}
        .hye-editor-shell .tree-item button{opacity:.9;cursor:pointer;touch-action:manipulation}
        .hye-editor-shell .tree-item button:active{opacity:1}
        .hye-editor-shell .tree-actions{align-items:center;opacity:.92}
        .hye-editor-shell .tree-action{width:30px;height:30px;min-width:30px;display:inline-flex;align-items:center;justify-content:center;padding:0;border:1px solid #303640;border-radius:7px;background:#11151b;color:#aab3c0;transition:background .15s,border-color .15s,color .15s;}
        .hye-editor-shell .tree-action-create:hover{background:#14251c;border-color:#286542;color:#7ee787}
        .hye-editor-shell .tree-action-rename:hover{background:#172337;border-color:#315c8b;color:#8cc8ff}
        .hye-editor-shell .tree-action-delete{color:#ff8d86;border-color:#503034;background:#1b1012}
        .hye-editor-shell .tree-action-delete:hover{background:#351619;border-color:#9b3d45;color:#ffb1ab}
        .hye-editor-shell .tree-toggle{width:24px;height:28px;display:inline-flex;align-items:center;justify-content:center;border-radius:5px}
        .hye-editor-shell .tree-toggle:hover{background:#20252d}
        .hye-editor-shell .tree-item.active{background:rgba(56,139,253,.11)}
        @media (hover:none){.hye-editor-shell .tree-actions{opacity:1}.hye-editor-shell .tree-action{width:32px;height:32px;min-width:32px}}
      `}</style>
      
      <div className={`header ${activeFile || isTyping ? 'hidden' : ''}`}>
        <div className="header-left">Hyecode</div>
        <div className="header-center"><button className="active">Monaco</button><button onClick={() => addDebugEntry('info', 'Custom editor mode is not enabled in this build.')}>Custom</button></div>
        <button className="header-right" onClick={() => setActiveOverlay('project')}>Local workspace</button>
      </div>

      <div className="action-bar">
        <div className={`pill ${showMinimap ? 'active' : ''}`} onClick={() => setShowMinimap(!showMinimap)}><Menu size={14} /> Minimap</div>
        <div className={`pill ${wordWrap ? 'active' : ''}`} role="button" tabIndex={0} aria-pressed={wordWrap} onClick={() => setWordWrap(value => !value)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setWordWrap(value => !value) } }} title="Toggle wrapping of long code lines">Word Wrap: {wordWrap ? 'On' : 'Off'}</div>
        <div className="pill" onClick={saveDirtyFiles} title="Save files · Ctrl/Cmd+S"><Save size={14} /> Save</div>
        <div className="pill" onClick={() => editorRef.current?.trigger('hye', 'editor.action.marker.next', null)} title="Next problem"><ArrowDown size={14} /></div>
        <div className="pill" onClick={() => editorRef.current?.trigger('hye', 'editor.action.marker.prev', null)} title="Previous problem"><ArrowUp size={14} /></div>
        <span className="action-bar-divider" aria-hidden="true" />
        <button type="button" className="pill intellisense-action" disabled={!activeFile} onClick={() => { if (!editorRef.current) { setStatus('Open a file before navigating to a definition'); return }; editorRef.current.focus(); editorRef.current.trigger('hye-actionbar', 'editor.action.revealDefinition', null) }} title="Go to Definition"><ExternalLink size={14} /> <span>Go to Definition</span></button>
        <button type="button" className="pill intellisense-action" disabled={!activeFile} onClick={() => { if (!editorRef.current) { setStatus('Open a file before finding references'); return }; editorRef.current.focus(); editorRef.current.trigger('hye-actionbar', 'editor.action.goToReferences', null) }} title="Find References"><FileSearch size={14} /> <span>Find References</span></button>
        <button type="button" className="pill intellisense-action" disabled={!activeFile} onClick={() => { if (!editorRef.current) { setStatus('Open a file before renaming a symbol'); return }; editorRef.current.focus(); editorRef.current.trigger('hye-actionbar', 'editor.action.rename', null) }} title="Rename Symbol"><Edit3 size={14} /> <span>Rename Symbol</span></button>
        <span className="action-bar-divider" aria-hidden="true" />
        <div className="pill" onClick={() => { setGlobalSearch(''); setGlobalReplace(''); setActiveOverlay('search') }} title="Search"><FileSearch size={14} /> Search</div>
        <div className="pill" onClick={() => setActiveOverlay('problems')} title="Problems"><ProblemsNavIcon size={14} /> Problems {allProblems.length ? `(${allProblems.length})` : ''}</div>
        {activeFile?.name.toLowerCase().endsWith('.html') && <div className="pill btn" onClick={runPreview}><Play size={14} /> Run</div>}
        <div className="pill" onClick={() => setActiveOverlay('console')} title="Console"><Terminal size={14} /> Console{counts.errors ? ` · ${counts.errors}` : ''}</div>
        <div className="pill" onClick={formatActiveFile} title="Format"><Wand2 size={14} /> Format</div>
        <div className="pill" onClick={() => { setPaletteQuery(''); setActiveOverlay('palette') }} title="Commands"><Command size={14} /> Commands</div>
        <button className="pill" onClick={() => setActiveOverlay('github')} title="Connect GitHub"><GitHubMark size={14} /> GitHub {githubConnected ? `· ${githubUser?.login || 'Connected'}` : 'Connect'}</button>
        {previewErrors.length > 0 && <div className="pill danger" onClick={() => setActiveOverlay('error')}><AlertCircle size={14} /> {previewErrors.length} Errors</div>}
      </div>

      <div className="recent-bar"><div className="recent-scroll">{openFiles.map(id => { const file = files.find(item => item.id === id); if (!file) return null; return <div key={id} className={`recent-pill ${activeId === id ? 'active' : ''}`} onClick={() => openTab(id)}>{file.name}{file.dirty ? ' •' : ''}<X size={12} onClick={event => closeTab(id, event)} /></div> })}</div><div className="dots-menu" onClick={() => setActiveOverlay('tabs')}><MoreVertical size={16} /></div></div>

      <div className="editor-wrapper">{activeFile ? <Editor path={`file:///hyecode/${encodeURIComponent(String(activeFile.id || activeFile.path || activeFile.name))}`} language={languageForFile(activeFile.name)} value={activeFile.content} onChange={handleEditorChange} onMount={handleEditorMount} theme="pure-black" options={{ minimap: { enabled: showMinimap }, fontSize: 12, lineHeight: 1.4, wordWrap: wordWrap ? 'on' : 'off', scrollBeyondLastLine: false, automaticLayout: true, padding: { top: 10 }, readOnly: false, quickSuggestions: { other: true, comments: false, strings: true }, suggestOnTriggerCharacters: true, tabCompletion: 'on', parameterHints: { enabled: true }, bracketPairColorization: { enabled: true }, guides: { bracketPairs: true, indentation: true }, folding: true, formatOnPaste: true, scrollbar: { horizontal: 'auto', vertical: 'auto', alwaysConsumeMouseWheel: false } }} /> : <div className="empty-state"><p>Select a file to start coding</p></div>}</div>

      <div className="floating-nav">
        <button onClick={() => setActiveOverlay('tree')} title="Explorer"><FolderTree size={22} /></button>
        <button onClick={() => setActiveOverlay('tools')} title="Tools"><Wand2 size={22} /></button>
        <button onClick={() => setActiveOverlay('file')} title="Files"><File size={22} /></button>
        <button onClick={() => setActiveOverlay('bot')} title="AI assistance"><Bot size={22} /></button>
        <button onClick={() => setActiveOverlay('problems')} title="Problems" style={{ color: activeOverlay === 'problems' ? '#ff8178' : undefined, position: 'relative' }}><ProblemsNavIcon size={22} />{allProblems.length > 0 && <span style={{ position: 'absolute', top: 1, right: 0, minWidth: 14, height: 14, borderRadius: 8, fontSize: 9, lineHeight: '14px', background: '#f85149', color: '#fff' }}>{allProblems.length > 99 ? '99+' : allProblems.length}</span>}</button>
        <button onClick={() => setActiveOverlay('console')} title="Console" style={{ color: activeOverlay === 'console' ? '#58a6ff' : undefined }}><Terminal size={22} /></button>
      </div>

      {activeOverlay === 'tree' && <div className="overlay side-drawer" onClick={() => setActiveOverlay(null)}><div className="side-drawer-content" onClick={event => event.stopPropagation()} style={{ display: 'flex', flexDirection: 'column' }}><div style={{ padding: 12, borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}><span style={{ fontSize: 12, fontWeight: 'bold' }}>EXPLORER</span><div style={{ display: 'flex', gap: 8 }}><button title="New file" style={iconButtonStyle} onClick={() => { setNewItemType('file'); setNewItemName(''); setActiveOverlay('newItem') }}><Plus size={15} /></button><button title="New folder" style={iconButtonStyle} onClick={() => { setNewItemType('folder'); setNewItemName(''); setActiveOverlay('newItem') }}><FolderPlus size={15} /></button><button title="Import" style={iconButtonStyle} onClick={importFiles}><Upload size={15} /></button><X size={16} onClick={() => setActiveOverlay(null)} /></div></div><div style={{ padding: '8px 10px', borderBottom: '1px solid #222' }}><input value={treeSearch} onChange={event => setTreeSearch(event.target.value)} placeholder="Filter files and folders…" style={{ width: '100%', boxSizing: 'border-box' }} /></div><div style={{ flex: 1, overflowY: 'auto', padding: '5px 0' }}>{renderFileTree()}</div><div style={{ padding: 10, borderTop: '1px solid #292d33', fontSize: 10, color: '#737984', overflowWrap: 'anywhere' }}>{workspacePath}</div></div></div>}

            {activeOverlay === 'tools' && <div className="overlay center-modal" onClick={() => setActiveOverlay(null)}><div className="modal-content" onClick={event => event.stopPropagation()}><div className="modal-header"><h3>Fixing Tools</h3><X size={18} onClick={() => setActiveOverlay(null)} /></div><div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}><div className="pill" onClick={() => { applyOfflineFixes(); setActiveOverlay(null) }}><CheckCircle2 size={14} /> Local Fix</div><div className="pill" onClick={() => { applyOfflineFixes(); setActiveOverlay(null) }}><CheckCircle2 size={14} /> Offline Fix</div><div className="pill" onClick={() => { formatActiveFile(); setActiveOverlay(null) }}><Wand2 size={14} /> Format Document</div><div className="pill" onClick={() => { setActiveOverlay('problems') }}><ProblemsNavIcon size={14} /> Inspect Problems</div></div></div></div>}

      {/* FIXED: FILE OPS - Added New Project and Close Project */}
      {activeOverlay === 'file' && <div className="overlay center-modal" onClick={() => setActiveOverlay(null)}><div className="modal-content" onClick={event => event.stopPropagation()}><div className="modal-header"><h3>File Operations</h3><X size={18} onClick={() => setActiveOverlay(null)} /></div><div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="pill" onClick={() => { setActiveOverlay('project') }}><FolderOpen size={14} /> Open / New Project</div>
        <div className="pill" onClick={() => { setFiles([]); setOpenFiles([]); setActiveId(null); setWorkspacePath(''); setSelectedFolder(''); setActiveOverlay(null); setStatus('Project closed') }}><X size={14} /> Close Project</div>
        <div style={{ height: 1, background: '#333', margin: '4px 0' }} />
        <div className="pill" onClick={() => { setNewItemType('file'); setActiveOverlay('newItem') }}><Plus size={14} /> New File</div>
        <div className="pill" onClick={() => { setNewItemType('folder'); setActiveOverlay('newItem') }}><FolderPlus size={14} /> New Folder</div>
        <div className="pill" onClick={importFiles}><Upload size={14} /> Import Files</div>
        <div className="pill" onClick={() => setActiveOverlay('rename')}><Edit3 size={14} /> Rename Active File</div>
      </div></div></div>}

      {activeOverlay === 'newItem' && <div className="overlay center-modal" onClick={() => setActiveOverlay(null)}><div className="modal-content" onClick={event => event.stopPropagation()}><div className="modal-header"><h3>New {newItemType === 'file' ? 'File' : 'Folder'}</h3><X size={18} onClick={() => setActiveOverlay(null)} /></div><div style={{ padding: 16 }}><input value={newItemName} onChange={event => setNewItemName(event.target.value)} placeholder={newItemType === 'file' ? 'index.html' : 'components'} /><button className="btn-main" style={{ marginTop: 12 }} onClick={createItem}>Create</button></div></div></div>}

      {activeOverlay === 'rename' && <div className="overlay center-modal" onClick={() => setActiveOverlay(null)}><div className="modal-content" onClick={event => event.stopPropagation()}><div className="modal-header"><h3>Rename Active File</h3><X size={18} onClick={() => setActiveOverlay(null)} /></div><div style={{ padding: 16 }}><input value={newItemName} onChange={event => setNewItemName(event.target.value)} placeholder={activeFile?.name || 'filename.html'} /><button className="btn-main" style={{ marginTop: 12 }} onClick={async () => { if (!activeFile || !newItemName.trim()) return; const nextName = newItemName.trim(); const nextPath = `${activeFile.path.slice(0, activeFile.path.lastIndexOf('/') + 1)}${nextName}`; try { await Filesystem.rename({ from: activeFile.path, to: nextPath, directory: Directory.ExternalStorage }); setFiles(previous => previous.map(file => file.id === activeFile.id ? { ...file, name: nextName, path: nextPath, dirty: false } : file)); setNewItemName(''); setActiveOverlay(null); setStatus(`Renamed to ${nextName}`) } catch (error) { addDebugEntry('error', `Rename failed: ${error.message}`); setStatus(`Rename failed: ${error.message}`) } }}>Rename</button></div></div></div>}

      {activeOverlay === 'bot' && (botTab === 'offline' || ['ask','help','templates'].includes(botTab)) && <div className="overlay center-modal" onClick={() => setActiveOverlay(null)}><div className="modal-content" style={{ height: 'min(86dvh, 850px)', display: 'flex', flexDirection: 'column' }} onClick={event => event.stopPropagation()}><div className="modal-header"><h3>ASSISTANCE</h3><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><button className="icon-button ai-settings-trigger" type="button" aria-label="AI provider settings" title="AI provider settings" onClick={() => { setAiSettingsTab('local'); setActiveOverlay('aiSettings') }}><Settings size={17}/></button><X size={18} onClick={() => setActiveOverlay(null)} /></div></div><div className="bot-nav"><button className={botTab === 'offline' || ['ask','help','templates'].includes(botTab) ? 'active' : ''} onClick={() => { setBotTab('ask'); setAiResult(null); setLocalSearch('') }}>OFFLINE HELP</button><button className={botTab === 'local' ? 'active' : ''} onClick={() => setBotTab('local')}>LOCAL AI</button><button className={botTab === 'cloud' ? 'active' : ''} onClick={() => setBotTab('cloud')}>CLOUD AI</button></div>{(botTab === 'offline' || ['ask','help','templates'].includes(botTab)) && <div className="bot-nav"><button className={botTab === 'ask' ? 'active' : ''} onClick={() => { setBotTab('ask'); setAiResult(null); setLocalSearch('') }}>TERMS</button><button className={botTab === 'help' ? 'active' : ''} onClick={() => { setBotTab('help'); setAiResult(null); setLocalSearch('') }}>HELP</button><button className={botTab === 'templates' ? 'active' : ''} onClick={() => { setBotTab('templates'); setAiResult(null); setLocalSearch('') }}>TEMPLATES</button></div>}
      {(botTab === 'ask' || botTab === 'help' || botTab === 'templates') && <div style={{padding:'10px 12px',borderBottom:'1px solid #292d33',fontSize:11,color:'#8c96a5'}}>Offline library · no account or internet required. Search and open saved references below.</div>}{(botTab === 'ask' || botTab === 'help' || botTab === 'templates') && <><div style={{ padding: 12, borderBottom: '1px solid #292d33', display: 'flex', gap: 8 }}><Search size={16} style={{ flexShrink: 0, marginTop: 8, color: '#777' }} /><input value={localSearch} onChange={event => setLocalSearch(event.target.value)} placeholder={botTab === 'templates' ? 'Search saved templates…' : botTab === 'help' ? 'Search offline syntax help…' : 'Search saved references…'} style={{ flex: 1, minWidth: 0 }} /></div><div style={{ padding: 12, flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>{aiResult && <div style={{ background: '#111418', border: `1px solid ${aiResult.source === 'ai' ? '#23558c' : '#39332a'}`, padding: 12, borderRadius: 8 }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}><strong style={{ fontSize: 12 }}>{aiResult.name}</strong><span style={{ fontSize: 9, color: aiResult.source === 'ai' ? '#79b8ff' : '#d6ad65', flexShrink: 0 }}>{aiResult.source === 'ai' ? 'ONLINE AI' : 'OFFLINE'}</span></div>{(aiResult.result || aiResult.desc) && <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontFamily: 'inherit', lineHeight: 1.55, fontSize: 11, color: '#ddd', maxHeight: 220, overflow: 'auto', margin: '8px 0' }}>{aiResult.result || aiResult.desc}</pre>}{aiResult.code && <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 11, color: '#c8e1ff', background: '#080a0d', padding: 10, borderRadius: 6, maxHeight: 260, overflow: 'auto', margin: '8px 0' }}>{aiResult.code}</pre>}{aiResult.desc && aiResult.result && aiResult.desc !== aiResult.result && aiResult.source === 'local' && <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontFamily: 'inherit', fontSize: 11, color: '#aaa', margin: '8px 0' }}>{aiResult.desc}</pre>}<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>{(aiResult.code || aiResult.result || aiResult.desc) && <button className="pill" onClick={async () => { try { await navigator.clipboard.writeText([aiResult.result, aiResult.desc !== aiResult.result ? aiResult.desc : '', aiResult.code].filter(Boolean).join('\n\n')); setStatus('AI response copied') } catch { setStatus('Clipboard unavailable') } }}><Copy size={13} /> Copy response</button>}{aiResult.code && <button className="btn-main" onClick={() => insertCode(aiResult.code)}>Insert code</button>}</div></div>}<div style={{ fontSize: 10, color: '#777', padding: '4px 0' }}>SAVED OFFLINE LIBRARY · {localItems.length} MATCHES</div>{localItems.map((item, index) => <button key={`${item.name}-${index}`} className="tree-item" onClick={() => selectLocalItem(botTab, item)} style={{ textAlign: 'left', border: '1px solid #25282e', borderRadius: 7, padding: 10, display: 'flex', alignItems: 'center', gap: 8, color: '#ddd', background: '#0d0f12' }}>{botTab === 'templates' ? <FileCode size={15} /> : botTab === 'help' ? <BookOpen size={15} /> : <HelpCircle size={15} />}<span style={{ flex: 1 }}>{item.name}</span><ChevronRight size={14} /></button>)}{localItems.length === 0 && <div style={{ padding: 12, color: '#777', fontSize: 11 }}>No saved items match this search. Try a shorter term or clear the search.</div>}</div></>}</div></div>}

      {activeOverlay === 'bot' && (botTab === 'local' || botTab === 'cloud') && <div style={{position:'fixed', inset:0, zIndex:3000, pointerEvents:'none'}} />}
      {activeOverlay === 'bot' && botTab === 'local' && <div className="overlay center-modal ai-overlay" onClick={() => setActiveOverlay(null)}><div className="modal-content" onClick={event => event.stopPropagation()} style={{maxHeight:'88dvh',display:'flex',flexDirection:'column'}}><div className="modal-header"><h3>LOCAL AI</h3><button className="icon-button" aria-label="Local model settings" onClick={chooseLocalModel}><Settings size={16}/></button></div><div style={{padding:16,display:'grid',gap:12,overflowY:'auto'}}><div style={{border:'1px solid #303640',borderRadius:10,padding:14}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}><strong>On-device coding model</strong><span style={{fontSize:10,color:localModelLoaded?'#7ee787':localModelStatus==='installed'?'#79b8ff':'#d5b36a'}}>{localModelLoaded?'READY · OFFLINE':localModelStatus==='installed'?'INSTALLED':'NOT INSTALLED'}</span></div><p style={{fontSize:12,color:'#9aa4b2',lineHeight:1.6}}>After installation, prompts run on this phone without sending code to a cloud provider. Model quality and speed depend on the model and available memory.</p><p style={{fontSize:11,color:'#8c95a3',lineHeight:1.55,overflowWrap:'anywhere'}}>{localModelNote}</p>{localModelStatus==='installed'&&<button className="btn-main" style={{width:'100%',marginBottom:8}} disabled={localModelBusy||localModelLoaded} onClick={loadLocalModel}>{localModelBusy?'Working…':localModelLoaded?'Model loaded':'Load model into memory'}</button>}</div><form onSubmit={event=>{event.preventDefault();askLocalModel()}} style={{display:'grid',gap:8}}><textarea value={askInput} onChange={event=>setAskInput(event.target.value)} rows={4} placeholder="Ask for code, debugging help, or an explanation…" style={{width:'100%',boxSizing:'border-box',resize:'vertical'}}/><button className="btn-main" type="submit" disabled={aiBusy||localModelBusy||!askInput.trim()||!localModelLoaded}>{aiBusy?'Generating on device…':'Ask local model'}</button></form>{aiResult&&<div style={{border:'1px solid #303640',borderRadius:9,padding:12,maxHeight:300,overflowY:'auto'}}><strong style={{fontSize:12}}>{aiResult.name}</strong><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontSize:11,lineHeight:1.6,color:'#cbd3df'}}>{aiResult.result}</pre>{aiResult.code&&<pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontSize:11,color:'#b7dcff'}}>{aiResult.code}</pre>}{aiResult.code&&<button className="pill" onClick={()=>insertCode(aiResult.code)}>Insert code</button>}</div>}<button className="pill" onClick={chooseLocalModel}><Download size={14}/> Manage model download and storage <ChevronRight size={14}/></button></div></div></div>}
      {activeOverlay === 'bot' && botTab === 'cloud' && <div className="overlay center-modal ai-overlay" onClick={() => setActiveOverlay(null)}><div className="modal-content" onClick={event => event.stopPropagation()}><div className="modal-header"><h3>CLOUD AI</h3><button className="icon-button ai-settings-trigger" type="button" aria-label="AI provider settings" title="AI provider settings" onClick={() => { setAiSettingsTab('cloud'); setActiveOverlay('aiSettings') }}><Settings size={16}/></button></div><div style={{padding:16,display:'grid',gap:10}}><div style={{fontSize:12,color:'#aeb7c4',lineHeight:1.6}}>Connect a compatible OpenAI-style API using your own provider key. Hyecode does not pay for requests. Your provider may charge for requests. Some providers may not work inside the app; if connection fails, try another compatible provider.</div><div className="pill" onClick={() => { setAiSettingsTab('cloud'); setActiveOverlay('aiSettings') }}><Cloud size={15}/> {cloudConnected ? `Configured · ${cloudModel}` : 'Configure provider'} <ChevronRight size={14}/></div><div style={{fontSize:11,color:'#737d8b'}}>Your API key stays in memory while this session is open. You will need to enter it again after restarting HyeCode.</div><form onSubmit={event=>{event.preventDefault();searchAI('ask')}} style={{display:'grid',gap:8,marginTop:4}}><textarea value={askInput} onChange={event=>setAskInput(event.target.value)} rows={3} placeholder="Ask your connected cloud model about code…" style={{width:'100%',boxSizing:'border-box',resize:'vertical'}}/><button className="btn-main" type="submit" disabled={aiBusy||!askInput.trim()||!cloudConnected}>{aiBusy?'Working…':'Ask connected model'}</button></form>{aiResult && <div style={{border:'1px solid #303640',borderRadius:8,padding:10,maxHeight:250,overflowY:'auto'}}><strong style={{fontSize:12}}>{aiResult.name}</strong><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontSize:11,lineHeight:1.55,color:'#cbd3df'}}>{aiResult.result}</pre>{aiResult.code&&<pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontSize:11,color:'#b7dcff'}}>{aiResult.code}</pre>}{aiResult.code&&<button className="pill" onClick={()=>insertCode(aiResult.code)}>Insert code</button>}</div>}</div></div></div>}
      {activeOverlay === 'aiSettings' && <div className="overlay ai-overlay ai-settings-page" onClick={() => setActiveOverlay('bot')} style={{zIndex:3200,alignItems:'stretch',justifyContent:'stretch',padding:0}}><div className="modal-content ai-provider-hub" onClick={event => event.stopPropagation()} style={{width:'100%',height:'100dvh',maxHeight:'100dvh',borderRadius:0,display:'flex',flexDirection:'column',boxSizing:'border-box'}}><div className="modal-header"><div><h3 style={{margin:0}}>AI PROVIDER HUB</h3><div style={{fontSize:10,color:'#8c98a8',marginTop:4}}>Choose how Hyecode assists you</div></div><button className="icon-button" aria-label="Back to AI" onClick={() => setActiveOverlay('bot')}><X size={18}/></button></div><div className="bot-nav"><button className={aiSettingsTab==='local'?'active':''} onClick={()=>setAiSettingsTab('local')}>LOCAL</button><button className={aiSettingsTab==='cloud'?'active':''} onClick={()=>setAiSettingsTab('cloud')}>CLOUD</button></div><div style={{padding:16,overflowY:'auto',display:'grid',gap:12}}>{aiSettingsTab==='local' ? <><h4 style={{margin:'0 0 4px'}}>On-device model</h4><div style={{fontSize:12,color:'#aeb7c4',lineHeight:1.65}}>Choose a direct HTTPS link to a GGUF model file hosted on Hugging Face or another trusted host. The file is stored outside the APK in Hyecode's app-specific model folder. Android DownloadManager handles long downloads and retries across many network interruptions. A valid GGUF header is checked after download; SHA-256 verification is optional but recommended when you publish a model.</div><label style={{fontSize:11,color:'#9aa4b2'}}>Direct model file URL<input value={localModelUrl} onChange={e=>setLocalModelUrl(e.target.value)} placeholder="https://huggingface.co/owner/repo/resolve/main/model.gguf" inputMode="url" autoCapitalize="none" style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:6}}/></label><label style={{fontSize:11,color:'#9aa4b2'}}>Model filename<input value={localModelFileName} onChange={e=>setLocalModelFileName(e.target.value)} placeholder="hyecode-coder.gguf" autoCapitalize="none" style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:6}}/></label><label style={{fontSize:11,color:'#9aa4b2'}}>Expected SHA-256 (optional)<input value={localModelSha256} onChange={e=>setLocalModelSha256(e.target.value)} placeholder="64 hexadecimal characters" autoCapitalize="none" style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:6}}/></label><div style={{border:'1px solid #303640',borderRadius:9,padding:12}}><div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center'}}><strong>Model status</strong><span style={{fontSize:10,color:localModelLoaded?'#7ee787':localModelStatus==='installed'?'#79b8ff':localModelStatus==='downloading'?'#e3b341':'#aeb7c4'}}>{localModelLoaded?'LOADED':localModelStatus.toUpperCase()}</span></div>{localModelBusy&&<div style={{height:5,background:'#242830',borderRadius:9,overflow:'hidden',marginTop:10}}><div style={{height:'100%',width:`${localModelProgress}%`,background:'#62b9ff',transition:'width .2s'}}/></div>}<div style={{fontSize:11,color:'#8e98a7',marginTop:8,lineHeight:1.6}}>{localModelBusy&&localModelProgress>0?`${localModelProgress}% downloaded`:localModelNote}</div></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{localModelStatus==='downloading'||localModelDownloadId?<button className="pill" onClick={cancelLocalModelDownload} disabled={!localModelDownloadId}>Cancel download</button>:<button className="btn-main" onClick={startLocalModelDownload} disabled={localModelBusy||localModelLoaded||!localModelUrl.trim()}><Download size={14}/> {localModelStatus==='installed'?'Download again':'Download model'}</button>}{localModelStatus==='installed'&&<button className="pill" onClick={loadLocalModel} disabled={localModelBusy||localModelLoaded}>Load model</button>}{localModelStatus==='installed'&&<button className="pill" onClick={deleteLocalModel} disabled={localModelBusy}>Delete model</button>}{localModelLoaded&&<button className="pill" onClick={async()=>{try{await LocalLlama.unloadModel();setLocalModelLoaded(false);setLocalModelNote('Model unloaded from memory. The downloaded file is kept.')}catch(e){setLocalModelNote(e.message)}}} disabled={localModelBusy}>Unload from memory</button>}</div><div style={{fontSize:11,color:'#d5b36a',lineHeight:1.55}}>For the smoothest experience, choose a small quantized model. Larger models need more free storage and memory and may not load on this phone. Download models only from sources you trust.</div></> : <><h4 style={{margin:'0 0 4px'}}>Your cloud provider</h4><div style={{fontSize:11,color:'#9aa4b2'}}>Choose a provider</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(135px,1fr))',gap:8}}>{[{id:'openrouter',name:'OpenRouter',desc:'Many models · compatible API',base:'https://openrouter.ai/api/v1'},{id:'openai',name:'OpenAI API',desc:'OpenAI models',base:'https://api.openai.com/v1'},{id:'gemini',name:'Google Gemini',desc:'Gemini via compatible API',base:'https://generativelanguage.googleapis.com/v1beta/openai'},{id:'groq',name:'Groq',desc:'Fast hosted inference',base:'https://api.groq.com/openai/v1'},{id:'anthropic',name:'Anthropic',desc:'Claude · Messages API',base:'https://api.anthropic.com/v1'},{id:'custom',name:'Custom API',desc:'OpenAI-compatible endpoint',base:''}].map(provider=><button key={provider.id} type="button" onClick={()=>{setCloudProvider(provider.id);setCloudBaseUrl(provider.base)}} style={{textAlign:'left',padding:10,borderRadius:9,border:cloudProvider===provider.id?'1px solid #4cbeff':'1px solid #303640',background:cloudProvider===provider.id?'#102337':'#111419',color:'#e6edf3',cursor:'pointer'}}><strong style={{fontSize:12,display:'block'}}>{provider.name}</strong><span style={{fontSize:10,color:'#98a4b4',display:'block',marginTop:4}}>{provider.desc}</span></button>)}<div style={{position:'relative',padding:10,borderRadius:9,border:'1px solid #343943',background:'#0c0d10',opacity:.62}}><strong style={{fontSize:12,display:'block'}}>GitHub Copilot</strong><span style={{position:'absolute',right:6,top:6,fontSize:8,fontWeight:800,color:'#111',background:'#e3b341',padding:'3px 5px',borderRadius:4}}>COMING SOON</span><span style={{fontSize:10,color:'#98a4b4',display:'block',marginTop:4}}>Not connected yet</span></div></div><label style={{fontSize:11,color:'#9aa4b2'}}>API base URL<input value={cloudBaseUrl} onChange={e=>setCloudBaseUrl(e.target.value)} placeholder="https://provider.example/v1" style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:6}}/></label><label style={{fontSize:11,color:'#9aa4b2'}}>Model ID<input value={cloudModel} onChange={e=>setCloudModel(e.target.value)} placeholder="e.g. provider/model-name" style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:6}}/></label><label style={{fontSize:11,color:'#9aa4b2'}}>API key (session only)<input type="password" autoComplete="off" value={cloudKey} onChange={e=>setCloudKey(e.target.value)} placeholder={cloudConnected?'Re-enter key to change connection':'Paste your provider API key'} style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:6}}/></label><div style={{border:'1px solid #3b3320',background:'#17140d',borderRadius:8,padding:10,fontSize:11,color:'#e3b341',lineHeight:1.6}}><strong style={{display:'block',marginBottom:4}}>Connection and privacy notes</strong>Your API key is kept in memory for this session and sent directly to the selected provider; Hyecode does not pay for requests. The provider may charge you. Model IDs and access permissions come from your provider account. Gemini and Groq use OpenAI-compatible chat endpoints; Anthropic uses its separate Messages API and may be blocked by browser CORS policy. Custom endpoints must support the OpenAI chat-completions format. Review code for secrets before sending it. GitHub Copilot is only a Coming Soon placeholder.</div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button className="btn-main" onClick={saveCloudSettings}><CheckCircle2 size={14}/> Save connection</button><button className="pill" onClick={disconnectCloud}><Unplug size={14}/> Disconnect</button></div></>}</div></div></div>}
      {activeOverlay === 'github' && <div className="overlay center-modal" onClick={() => setActiveOverlay(null)}><div className="modal-content" onClick={event => event.stopPropagation()} style={{width:'min(95vw,620px)',maxHeight:'90dvh',display:'flex',flexDirection:'column'}}><div className="modal-header"><h3><GitHubMark size={17} style={{verticalAlign:'middle',marginRight:7}}/>GITHUB</h3><X size={18} onClick={()=>setActiveOverlay(null)}/></div>{!githubConnected ? <div style={{padding:16,display:'grid',gap:10,overflowY:'auto'}}><p style={{fontSize:12,color:'#aeb7c4',lineHeight:1.65,marginTop:0}}>Connect with a GitHub access token that can read the repositories you want to open. HyeCode keeps the token in memory for this session and asks you to reconnect after restarting.</p><input type="password" autoComplete="off" value={githubToken} onChange={e=>setGithubToken(e.target.value)} placeholder="GitHub personal access token"/><button className="btn-main" onClick={connectGitHub} disabled={githubBusy}>{githubBusy?'Connecting…':'Connect GitHub'}</button><div style={{fontSize:11,color:'#8b949e'}}>Your token controls which repositories HyeCode can access. Keep it private, especially on a shared device.</div></div> : <><div style={{padding:12,borderBottom:'1px solid #292d33',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}><div style={{flex:1,minWidth:120,fontSize:12}}><strong>{githubUser?.login}</strong><span style={{color:'#7b8796'}}> · {githubRepos.length} repositories</span></div><button className="pill" onClick={refreshGitHubRepos} disabled={githubBusy}><RefreshCw size={13}/> Refresh</button><button className="pill" onClick={disconnectGitHub}><Unplug size={13}/> Disconnect</button></div><div style={{padding:12,display:'grid',gap:8,borderBottom:'1px solid #292d33'}}><label style={{fontSize:11,color:'#9aa4b2'}}>Import destination parent path<input value={clonePath} onChange={e=>setClonePath(e.target.value)} style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:5}}/></label><input value={githubRepoQuery} onChange={e=>setGithubRepoQuery(e.target.value)} placeholder="Filter repositories…"/></div><div style={{padding:10,overflowY:'auto',minHeight:100,flex:1}}>{githubRepos.filter(repo=>`${repo.full_name} ${repo.description||''}`.toLowerCase().includes(githubRepoQuery.toLowerCase())).map(repo=><div key={repo.id} style={{display:'flex',gap:8,alignItems:'center',padding:'10px 2px',borderBottom:'1px solid #202329'}}><div style={{flex:1,minWidth:0}}><strong style={{fontSize:12,overflowWrap:'anywhere'}}>{repo.full_name}</strong><div style={{fontSize:10,color:'#7e8998',marginTop:4}}>{repo.private?'Private':'Public'} · {repo.default_branch} · {repo.language||'Unknown language'}</div></div><button className="pill" onClick={()=>cloneGitHubRepo(repo)} disabled={githubBusy}><Download size={13}/> Download & Open</button></div>)}{!githubRepos.length&&<div style={{padding:20,color:'#7e8998',fontSize:12}}>No repositories found. Refresh or check token permissions.</div>}</div><div style={{padding:10,borderTop:'1px solid #292d33',fontSize:10,color:'#d7b46a'}}>This imports the repository files as a ZIP snapshot. It does not include Git history or sync changes back to GitHub.</div></>}</div></div>}

      {activeOverlay === 'problems' && <div className="overlay" style={{ zIndex: 2700, alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setActiveOverlay(null)}><section onClick={event => event.stopPropagation()} style={{ width: '100%', maxHeight: '82dvh', minHeight: 300, display: 'flex', flexDirection: 'column', background: '#090a0c', color: '#d4d4d4', border: '1px solid #292d33', borderRadius: '16px 16px 0 0', overflow: 'hidden', boxShadow: '0 -18px 60px rgba(0,0,0,.55)' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 15px', borderBottom: '1px solid #25282e' }}><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><ProblemsNavIcon size={20}/><div><strong style={{ fontSize: 13 }}>PROBLEMS</strong></div></div><button style={iconButtonStyle} onClick={() => setActiveOverlay(null)}><X size={16}/></button></div><div style={{ flex: 1, overflowY: 'auto' }}>{visibleProblems.map(problem => <button key={problem.id} onClick={() => { const target = files.find(file => file.id === problem.fileId || file.name === problem.fileName); if (target) { openTab(target.id); setActiveOverlay(null); window.setTimeout(() => { editorRef.current?.setPosition({ lineNumber: Math.max(1, problem.line || 1), column: Math.max(1, problem.column || 1) }); editorRef.current?.focus() }, 100) } }} style={{ width: '100%', textAlign: 'left', display: 'flex', gap: 10, alignItems: 'flex-start', padding: '11px 14px', border: 0, borderBottom: '1px solid #1a1d22', background: 'transparent', color: '#d5d9df', cursor: 'pointer' }}><span style={{ color: problem.severity === 'error' ? '#ff6b6b' : '#e3b341', fontSize: 10, fontWeight: 700, width: 47, flexShrink: 0 }}>{problem.severity.toUpperCase()}</span><span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontSize: 12, overflowWrap: 'anywhere' }}>{problem.message}</span><span style={{ display: 'block', fontSize: 10, color: '#777', marginTop: 5 }}>{problem.fileName} · {problem.line}:{problem.column}</span></span></button>)}{!visibleProblems.length && <div style={{ padding: 30, textAlign: 'center', color: '#7ee787', fontSize: 12 }}><CheckCircle2 size={22} style={{ display: 'block', margin: '0 auto 10px' }}/>No problems detected.</div>}</div></section></div>}

      {activeOverlay === 'search' && <div className="overlay center-modal" style={{ zIndex: 2800 }} onClick={() => setActiveOverlay(null)}><div className="modal-content" onClick={event => event.stopPropagation()} style={{ width: 'min(94vw, 720px)', maxHeight: '88dvh', display: 'flex', flexDirection: 'column' }}><div className="modal-header"><h3>Search & Replace</h3><X size={18} onClick={() => setActiveOverlay(null)}/></div><div style={{ padding: 12, display: 'grid', gap: 8, borderBottom: '1px solid #292d33' }}><input value={globalSearch} onChange={event => setGlobalSearch(event.target.value)} placeholder="Find..." autoFocus/><input value={globalReplace} onChange={event => setGlobalReplace(event.target.value)} placeholder="Replace with..."/><div style={{ display: 'flex', gap: 8 }}><button className="btn-main" onClick={replaceAcrossProject} disabled={!globalSearch}>Replace all</button></div></div><div style={{ overflowY: 'auto', minHeight: 100, flex: 1 }}>{projectSearchResults.map(result => <button key={result.id} onClick={() => { openTab(result.fileId); setActiveOverlay(null); window.setTimeout(() => { editorRef.current?.setPosition({ lineNumber: result.line, column: result.column }); editorRef.current?.revealPositionInCenter({ lineNumber: result.line, column: result.column }); }, 100) }} style={{ width: '100%', textAlign: 'left', border: 0, borderBottom: '1px solid #222', background: 'transparent', color: '#ddd', padding: '9px 12px', cursor: 'pointer' }}><div style={{ fontSize: 10, color: '#8bbfff', marginBottom: 4 }}>{result.fileName}:{result.line}</div><div style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>{result.text}</div></button>)}</div></div></div>}

      {activeOverlay === 'palette' && <div className="overlay center-modal" style={{ zIndex: 2900 }} onClick={() => setActiveOverlay(null)}><div className="modal-content" onClick={event => event.stopPropagation()} style={{ width: 'min(92vw, 560px)', maxHeight: '75dvh', display: 'flex', flexDirection: 'column' }}><div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: 12, borderBottom: '1px solid #292d33' }}><Command size={17}/><input autoFocus value={paletteQuery} onChange={event => setPaletteQuery(event.target.value)} placeholder="Type a command…" style={{ flex: 1 }}/><X size={16} onClick={() => setActiveOverlay(null)} style={{ cursor: 'pointer' }}/></div><div style={{ overflowY: 'auto' }}>{[{id:'save',label:'Save files'},{id:'search',label:'Search in project'},{id:'problems',label:'Open Problems panel'},{id:'console',label:'Open Console'},{id:'explorer',label:'Open Explorer'},{id:'preview',label:'Run HTML preview'},{id:'format',label:'Format active file'},{id:'newfile',label:'Create new file'},{id:'ai',label:'Open HYE Workspace'}].filter(command => command.label.toLowerCase().includes(paletteQuery.toLowerCase())).map(command => <button key={command.id} onClick={() => runPaletteCommand(command)} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', border: 0, borderBottom: '1px solid #202329', background: 'transparent', color: '#ddd', cursor: 'pointer' }}><span style={{ fontSize: 12 }}>{command.label}</span></button>)}</div></div></div>}

      {showPermissionNotice && <div className="overlay center-modal" style={{ zIndex: 5000, background: 'rgba(0,0,0,.82)' }}><div className="modal-content" style={{ width: 'min(92vw, 460px)', border: '1px solid #3a3d43' }}><div className="modal-header"><h3>Allow storage access</h3></div><div style={{ padding: 18, color: '#c4c8ce', fontSize: 12, lineHeight: 1.7 }}><p>Hyecode needs Android file-management access to open, create, edit, rename and save project files in shared storage.</p><p style={{ color: '#8b949e' }}>On Android 11 and newer, allow <strong>All files access</strong> in the system prompt. If you skipped it, open Settings → Apps → Hyecode → Special app access → All files access and enable it. Android may label storage permissions differently on older versions.</p><button className="btn-main" style={{ width: '100%', marginTop: 8 }} onClick={closePermissionNotice}>Continue</button></div></div></div>}

      {!showPermissionNotice && recoveryAvailable && !workspacePath && <div className="overlay center-modal" style={{ zIndex: 4900 }}><div className="modal-content" style={{ width: 'min(92vw, 460px)' }}><div className="modal-header"><h3>Recover unsaved work?</h3><X size={18} onClick={() => { setRecoveryAvailable(false); safeStorage.set('hye_recovery', null) }}/></div><div style={{ padding: 16, color: '#aaa', fontSize: 12 }}>A recovery snapshot was found on this device.</div><div style={{ padding: 16, display: 'flex', gap: 8 }}><button className="btn-main" onClick={recoverWorkspace}>Recover session</button><button className="pill" onClick={() => { setRecoveryAvailable(false); safeStorage.set('hye_recovery', null) }}>Discard</button></div></div></div>}

      {activeOverlay === 'error' && <div className="overlay center-modal" onClick={() => setActiveOverlay(null)}><div className="modal-content" onClick={event => event.stopPropagation()}><div className="modal-header"><h3 style={{ color: '#f85149' }}>{previewErrors.length} Errors</h3><X size={18} onClick={() => setActiveOverlay(null)} /></div><div style={{ padding: 16, overflowY: 'auto' }}>{previewErrors.map((error, index) => <div key={`${error}-${index}`} style={{ marginBottom: 12, padding: 12, background: 'rgba(248,81,73,.1)', borderLeft: '3px solid #f85149', fontSize: 12, color: '#ffa198' }}>{error}</div>)}</div></div></div>}

         {activeOverlay === 'tabs' && <div className="overlay center-modal" onClick={() => setActiveOverlay(null)}><div className="modal-content" onClick={event => event.stopPropagation()} style={{ maxWidth: 300 }}><div className="modal-header"><h3>Tab Options</h3><X size={18} onClick={() => setActiveOverlay(null)} /></div><div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}><div className="pill" onClick={closeAllSaved}>Close All Saved</div><div className="pill danger" onClick={closeAll}>Close All</div></div></div></div>}

      {activeOverlay === 'console' && <DebugConsolePanel entries={filteredEntries} allEntries={debugEntries} counts={counts} filter={consoleFilter} setFilter={setConsoleFilter} search={consoleSearch} setSearch={setConsoleSearch} input={consoleInput} setInput={setConsoleInput} onSubmit={sendConsoleCommand} onClear={clearConsole} busy={consoleBusy} preserve={preserveConsole} setPreserve={setPreserveConsole} tab={debugTab} setTab={setDebugTab} expanded={expandedEntryIds} setExpanded={setExpandedEntryIds} onClose={() => setActiveOverlay(null)} running={previewRunning} />}

      <div className="overlay" style={{ display: activeOverlay === 'preview' ? 'flex' : 'none', flexDirection: 'column', position: 'fixed', inset: 0, zIndex: 2000, background: '#000' }}><div style={{ padding: 12, background: '#111', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><PlayCircle size={16} /> Preview</span><X size={20} onClick={() => { setActiveOverlay(null); setStatus('Preview closed') }} style={{ cursor: 'pointer' }} /></div><div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', background: '#17191d' }}><iframe ref={iframeRef} title="Preview" srcDoc={previewHtml} style={{ flex: 1, width: '100%', minHeight: '100%', border: 'none', background: '#fff' }} sandbox="allow-scripts" /></div></div>

      <div style={{ position: 'fixed', left: 8, bottom: 4, zIndex: 5, fontSize: 10, color: '#555', pointerEvents: 'none' }}>{status}</div>

      {showBrandSplash && <BrandSplash />}

    </div>
  )
}

const DebugConsolePanel = ({ entries, allEntries, counts, filter, setFilter, search, setSearch, input, setInput, onSubmit, onClear, busy, preserve, setPreserve, tab, setTab, expanded, setExpanded, onClose, running }) => {
  const endRef = useRef(null)
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [entries.length])
  const toggleExpanded = (id) => setExpanded(previous => { const next = new Set(previous); next.has(id) ? next.delete(id) : next.add(id); return next })
  const typeColor = (kind) => ({ error: '#ff6b6b', exception: '#ff6b6b', warn: '#e3b341', info: '#79c0ff', debug: '#a5a5a5', command: '#d2a8ff', result: '#7ee787', system: '#58a6ff' }[kind] || '#c9d1d9')
  return (
    <div className="overlay" style={{ zIndex: 2600, alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <section onClick={event => event.stopPropagation()} style={{ width: '100%', height: 'min(78dvh, 720px)', minHeight: 300, display: 'flex', flexDirection: 'column', background: '#08090b', color: '#d4d4d4', border: '1px solid #292d33', borderBottom: 0, borderRadius: '16px 16px 0 0', boxShadow: '0 -18px 60px rgba(0,0,0,.55)', fontFamily: 'JetBrains Mono, ui-monospace, monospace', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '12px 14px', borderBottom: '1px solid #25282e', background: '#0d0f12' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Terminal size={18} color="#58a6ff" /><div><div style={{ fontSize: 13, fontWeight: 700 }}>DEBUG CONSOLE</div></div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><button title="Clear" onClick={onClear} style={iconButtonStyle}><Trash2 size={15} /></button><button title="Close" onClick={onClose} style={iconButtonStyle}><X size={17} /></button></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderBottom: '1px solid #202329', overflowX: 'auto' }}>
        {[['console', 'Console'], ['errors', `Errors ${counts.errors}`], ['warn', `Warnings ${counts.warnings}`], ['log', `Logs ${counts.logs}`]].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} style={{ ...smallTabStyle, color: filter === value ? '#58a6ff' : '#858b95', borderColor: filter === value ? '#23558c' : 'transparent', background: filter === value ? '#101d2b' : 'transparent' }}>{label}</button>)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid #202329' }}><Search size={14} color="#737984" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Filter console messages…" style={consoleInputStyle} /></div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {entries.length === 0 ? <div style={{ padding: '30px 18px', color: '#656b75', fontSize: 12, textAlign: 'center' }}>No messages yet.</div> : entries.map(entry => <div key={entry.id} style={{ borderBottom: '1px solid #171a1f', background: ['error', 'exception'].includes(entry.kind) ? 'rgba(248,81,73,.055)' : entry.kind === 'warn' ? 'rgba(227,179,65,.035)' : 'transparent' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px', fontSize: 11, lineHeight: 1.5 }}>
            <span style={{ color: '#606773', flexShrink: 0, fontSize: 10, paddingTop: 1 }}>{entry.time}</span>
            <span style={{ color: typeColor(entry.kind), fontWeight: 700, minWidth: 50, flexShrink: 0 }}>{entry.kind.toUpperCase()}</span>
            <div style={{ flex: 1, minWidth: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: typeColor(entry.kind) }}>{entry.message || '(empty message)'}</div>
            {(entry.stack || entry.message.length > 100) && <button onClick={() => toggleExpanded(entry.id)} style={{ ...iconButtonStyle, padding: 3 }}>{expanded.has(entry.id) ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</button>}
          </div>
          {expanded.has(entry.id) && <pre style={{ margin: '0 12px 10px 90px', padding: 10, background: '#050607', color: '#9da7b3', fontSize: 10, lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', borderRadius: 5 }}>{entry.stack || entry.message}</pre>}
        </div>)}
        <div ref={endRef} />
      </div>
      <form onSubmit={onSubmit} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderTop: '1px solid #292d33', background: '#0d0f12' }}>
        <span style={{ color: '#7ee787', fontSize: 16 }}>›</span><input value={input} onChange={event => setInput(event.target.value)} placeholder="Evaluate..." style={{ ...consoleInputStyle, flex: '1 1 0%', width: 0, minWidth: 0, fontSize: 12 }} /><button type="submit" disabled={busy} className="btn-main" style={{ flex: '0 0 auto', width: 'auto', padding: '8px 12px', minWidth: 65 }}>{busy ? 'Running…' : 'Run'}</button>
      </form>
      </section>
    </div>
  )
}

const iconButtonStyle = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #292d33', background: '#111418', color: '#9da5b1', borderRadius: 6, padding: 6, cursor: 'pointer' }
const smallTabStyle = { border: '1px solid transparent', borderRadius: 6, padding: '6px 9px', fontSize: 10, whiteSpace: 'nowrap', cursor: 'pointer' }
const consoleInputStyle = { flex: '1 1 0%', width: 0, minWidth: 0, outline: 'none', border: '1px solid #292d33', borderRadius: 6, padding: '9px 10px', background: '#070809', color: '#e6edf3', fontFamily: 'inherit', fontSize: 11, boxSizing: 'border-box' }

const HyeEditor = () => <ErrorBoundary><HyeEditorCore /></ErrorBoundary>

export default HyeEditor
