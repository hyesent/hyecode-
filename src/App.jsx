import React, { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'
import { FilePicker } from '@capawesome/capacitor-file-picker'
import { Menu, Plus, FolderPlus, Edit3, X, Search, Wand2, FileCode, BookOpen, HelpCircle, Terminal, Copy, AlertCircle, ChevronRight, ChevronDown, LogOut, Upload } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { templates } from './templates.js'
import { syntaxHelp } from './syntaxHelp.js'
import { terms } from './terms.js'

const ROOT = 'HYE'
const FILE_EXT = ['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.md', '.txt']

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleSignup = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else setError('Check email for confirmation link')
    setLoading(false)
  }

  return (
    <div style={{height: '100vh', background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace'}}>
      <div style={{background: '#252526', padding: 24, borderRadius: 6, width: 320, border: '1px solid #3c3c3c'}}>
        <h2 style={{color: '#58a6ff', margin: '0 0 16px 0', textAlign: 'center'}}>HYE Editor Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{width: '100%', padding: 8, marginBottom: 12, background: '#1e1e1e', border: '1px solid #3c3c3c', color: '#d4d4d4', borderRadius: 3, boxSizing: 'border-box'}}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{width: '100%', padding: 8, marginBottom: 12, background: '#1e1e1e', border: '1px solid #3c3c3c', color: '#d4d4d4', borderRadius: 3, boxSizing: 'border-box'}}
            required
          />
          {error && <div style={{color: '#ff6b6b', fontSize: 12, marginBottom: 12}}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{width: '100%', padding: 10, background: '#58a6ff', border: 'none', color: '#000', borderRadius: 3, cursor: 'pointer', marginBottom: 8}}
          >
            {loading? 'Loading...' : 'Login'}
          </button>
          <button
            type="button"
            onClick={handleSignup}
            disabled={loading}
            style={{width: '100%', padding: 10, background: '#3c3c3c', border: 'none', color: '#ccc', borderRadius: 3, cursor: 'pointer'}}
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  )
}

const HyeEditorCore = ({ session }) => {
  const [files, setFiles] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [status, setStatus] = useState('ready')
  const [showConsole, setShowConsole] = useState(false)
  const [consoleLogs, setConsoleLogs] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [problems, setProblems] = useState([])
  const [dirtyFiles, setDirtyFiles] = useState(new Set())
  const [autoSave, setAutoSave] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showAskModal, setShowAskModal] = useState(false)
  const [showNewFileModal, setShowNewFileModal] = useState(false)
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [templateInput, setTemplateInput] = useState('')
  const [helpInput, setHelpInput] = useState('')
  const [askInput, setAskInput] = useState('')
  const [templateResult, setTemplateResult] = useState(null)
  const [helpResult, setHelpResult] = useState(null)
  const [askResult, setAskResult] = useState(null)
  const [templateSearch, setTemplateSearch] = useState('')
  const [helpSearch, setHelpSearch] = useState('')
  const [askSearch, setAskSearch] = useState('')
  const [renameFile, setRenameFile] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [expandedFolders, setExpandedFolders] = useState(new Set(['/']))

  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const iframeRef = useRef(null)
  const saveTimeoutRef = useRef(null)
  const isNative = Capacitor.getPlatform()!== 'web'
useEffect(() => {
  const wakeBackend = async () => {
    try {
      setStatus('waking AI...')
      await fetch('https://hye-api.onrender.com/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'ping',
          type: 'ask'
        })
      })
      setStatus('AI ready')
      setTimeout(() => setStatus('ready'), 2000)
    } catch (e) {
      setStatus('AI sleeping - will wake on first use')
    }
  }
  wakeBackend()
}, [])
  useEffect(() => {
    initFiles()
    return () => clearTimeout(saveTimeoutRef.current)
  }, [])

  useEffect(() => {
    if (activeId && autoSave) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => saveFile(activeId), 2000)
    }
  }, [files, activeId])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const initFiles = async () => {
    try {
      await Filesystem.mkdir({ path: ROOT, directory: Directory.Documents, recursive: true })
      await loadFiles()
    } catch (e) {
      const defaultFiles = [
        { id: 1, name: 'App.jsx', path: '/App.jsx', content: `import React from "react"\nexport default function App() {\n return <div>Hello HYE</div>\n}` },
        { id: 2, name: 'index.html', path: '/index.html', content: `<!DOCTYPE html>\n<html><body><div id="root"></div></body></html>` }
      ]
      setFiles(defaultFiles)
      setActiveId(1)
    }
  }

  const loadFiles = async () => {
    try {
      const scan = async (path = '') => {
        const items = await Filesystem.readdir({ path: ROOT + path, directory: Directory.Documents })
        const result = []
        for (const item of items.files) {
          const fullPath = path + '/' + item.name
          if (item.type === 'directory') {
            result.push(...await scan(fullPath))
          } else if (FILE_EXT.some(ext => item.name.endsWith(ext))) {
            const content = await Filesystem.readFile({ path: ROOT + fullPath, directory: Directory.Documents, encoding: Encoding.UTF8 })
            result.push({ id: Date.now() + Math.random(), name: item.name, path: fullPath, content: content.data })
          }
        }
        return result
      }
      const loaded = await scan()
      if (loaded.length > 0) {
        setFiles(loaded)
        setActiveId(loaded[0].id)
      } else {
        throw new Error('No files')
      }
    } catch (e) {
      const defaultFiles = [
        { id: 1, name: 'App.jsx', path: '/App.jsx', content: `import React from "react"\nexport default function App() {\n return <div>Hello HYE</div>\n}` }
      ]
      setFiles(defaultFiles)
      setActiveId(1)
    }
  }

  const saveFile = async (fileId) => {
    const file = files.find(f => f.id === fileId)
    if (!file) return
    try {
      await Filesystem.writeFile({
        path: ROOT + file.path,
        data: file.content,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
        recursive: true
      })
      setDirtyFiles(prev => { const n = new Set(prev); n.delete(fileId); return n })
      setStatus('saved')
      setTimeout(() => setStatus('ready'), 1000)
    } catch (e) {
      setStatus('save failed')
    }
  }

  const createFile = async () => {
    if (!newItemName.trim()) return
    const name = newItemName.match(/\.(jsx?|html|css|json|md|txt)$/)? newItemName : `${newItemName}.jsx`
    const path = '/' + name
    const newFile = { id: Date.now(), name, path, content: '' }
    setFiles([...files, newFile])
    setActiveId(newFile.id)
    await saveFile(newFile.id)
    setNewItemName('')
    setShowNewFileModal(false)
  }

  const createFolder = async () => {
    if (!newItemName.trim()) return
    try {
      await Filesystem.mkdir({ path: ROOT + '/' + newItemName, directory: Directory.Documents, recursive: true })
      setStatus('folder created')
      setNewItemName('')
      setShowNewFolderModal(false)
    } catch (e) {
      setStatus('folder failed')
    }
  }

  const importFiles = async () => {
    try {
      setStatus('picking files...')
      const result = await FilePicker.pickFiles({
        types: ['text/*'],
        multiple: true,
        readData: true
      })

      if (!result.files.length) return setStatus('no files picked')

      const newFiles = []
      for (const file of result.files) {
        const content = atob(file.data)
        const path = '/' + file.name
        const newFile = {
          id: Date.now() + Math.random(),
          name: file.name,
          path: path,
          content: content
        }
        newFiles.push(newFile)

        await Filesystem.writeFile({
          path: ROOT + path,
          data: content,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
          recursive: true
        })
      }

      setFiles([...files,...newFiles])
      if (newFiles[0]) setActiveId(newFiles[0].id)
      setStatus(`imported ${newFiles.length} files`)
    } catch (e) {
      if (e.message!== 'pickFiles canceled.') {
        setStatus('import failed')
        console.error(e)
      }
    }
  }

  const deleteFile = async (fileId) => {
    const file = files.find(f => f.id === fileId)
    if (!file) return
    try {
      await Filesystem.deleteFile({ path: ROOT + file.path, directory: Directory.Documents })
      const newFiles = files.filter(f => f.id!== fileId)
      setFiles(newFiles)
      if (activeId === fileId && newFiles.length > 0) setActiveId(newFiles[0].id)
    } catch (e) {
      setStatus('delete failed')
    }
  }

  const startRename = (file) => {
    setRenameFile(file)
    setRenameValue(file.name)
  }

  const confirmRename = async () => {
    if (!renameFile ||!renameValue.trim()) return
    const oldPath = renameFile.path
    const newPath = oldPath.substring(0, oldPath.lastIndexOf('/') + 1) + renameValue
    try {
      await Filesystem.rename({ from: ROOT + oldPath, to: ROOT + newPath, directory: Directory.Documents })
      setFiles(files.map(f => f.id === renameFile.id? {...f, name: renameValue, path: newPath } : f))
      setRenameFile(null)
      setRenameValue('')
    } catch (e) {
      setStatus('rename failed')
    }
  }

  const handleChange = (value) => {
    setFiles(files.map(f => f.id === activeId? {...f, content: value } : f))
    setDirtyFiles(prev => new Set(prev).add(activeId))
  }

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types']
    })

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    })

    files.forEach(f => {
      if (f.name.endsWith('.js') || f.name.endsWith('.jsx')) {
        monaco.languages.typescript.javascriptDefaults.addExtraLib(
          f.content,
          `file://${f.path}`
        )
      }
    })

    monaco.languages.registerCompletionItemProvider('javascript', {
      triggerCharacters: ['.', '"', "'", '`', '/', '@', '<'],
      provideCompletionItems: (model, position) => {
        const suggestions = []
        templates.forEach(t => {
          suggestions.push({
            label: t.name,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: t.code,
            documentation: 'HYE Template',
            range: null
          })
        })
        return { suggestions }
      }
    })

    monaco.editor.defineTheme('hye-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'regexp', foreground: 'D16969' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'class', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
        { token: 'constant', foreground: '4FC1FF' }
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2a2d2e',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41',
        'editorIndentGuide.background': '#404040',
        'editorIndentGuide.activeBackground': '#707070'
      }
    })

    editor.onDidChangeModelContent(() => {
      const model = editor.getModel()
      if (model) {
        const markers = monaco.editor.getModelMarkers({ resource: model.uri })
        setProblems(markers.map(m => ({
          line: m.startLineNumber,
          message: m.message,
          severity: m.severity === 8? 'error' : 'warning',
          file: activeFile?.path
        })))
      }
    })

    monaco.editor.setTheme('hye-dark')
  }

  const insertCode = (code) => {
    const editor = editorRef.current
    if (editor) {
      const selection = editor.getSelection()
      editor.executeEdits('', [{ range: selection, text: code }])
      editor.focus()
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setStatus('copied')
    setTimeout(() => setStatus('ready'), 1000)
  }

  const searchTemplateAI = async () => {
  if (!templateInput.trim()) return
  setStatus('HYE AI generating...')
  setTemplateResult(null)
  try {
    const res = await fetch('https://hye-api.onrender.com/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `Generate React code template for: ${templateInput}. Return only code.`,
        type: 'template'
      })
    })
    const data = await res.json()
    setTemplateResult({
      name: `AI: ${templateInput}`,
      code: data.code || '// AI returned no code',
      desc: data.explanation || `AI generated`,
      source: 'ai'
    })
    setStatus('ready')
  } catch (e) {
    setTemplateResult({ name: 'Error', code: `// AI failed: ${e.message}`, desc: 'Check backend' })
    setStatus('error')
  }
}

const searchHelpAI = async () => {
  if (!helpInput.trim()) return
  setStatus('HYE AI generating...')
  setHelpResult(null)
  try {
    const res = await fetch('https://hye-api.onrender.com/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `Give syntax example for: ${helpInput}. Return code + comment.`,
        type: 'help'
      })
    })
    const data = await res.json()
    setHelpResult({
      name: `AI: ${helpInput}`,
      code: data.code || '// AI returned no code',
      desc: data.explanation || `AI syntax help`,
      source: 'ai'
    })
    setStatus('ready')
  } catch (e) {
    setHelpResult({ name: 'Error', code: `// AI failed: ${e.message}`, desc: 'Check backend' })
    setStatus('error')
  }
}

const searchAskAI = async () => {
  if (!askInput.trim()) return
  setStatus('HYE AI thinking...')
  setAskResult(null)
  try {
    const res = await fetch('https://hye-api.onrender.com/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `Explain ${askInput} in React. Short + 1 code example.`,
        type: 'ask'
      })
    })
    const data = await res.json()
    setAskResult({
      name: `AI: ${askInput}`,
      code: data.code || `// ${data.result}`,
      desc: data.explanation || data.result || 'AI explanation',
      source: 'ai'
    })
    setStatus('ready')
  } catch (e) {
    setAskResult({ name: 'Error', code: `// AI failed: ${e.message}`, desc: 'Check backend' })
    setStatus('error')
  }
              }

  const runPreview = () => {
    const htmlFile = files.find(f => f.name === 'index.html')
    if (!htmlFile) return setStatus('no index.html')
    const appFile = files.find(f => f.name === 'App.jsx')
    if (!appFile) return setStatus('no App.jsx')

    const html = htmlFile.content.replace(
      '</body>',
      `<script type="module">
        import React from 'https://esm.sh/react@18.2.0'
        import ReactDOM from 'https://esm.sh/react-dom@18.2.0/client'
        const originalConsole = console.log
        console.log = (...args) => {
          window.parent.postMessage({type: 'console', method: 'log', args: args.map(a => typeof a === 'object'? JSON.stringify(a) : String(a))}, '*')
          originalConsole(...args)
        }
        ${appFile.content.replace('export default', 'const App =')}
        const root = ReactDOM.createRoot(document.getElementById('root'))
        root.render(React.createElement(App))
      </script></body>`
    )
    if (iframeRef.current) iframeRef.current.srcdoc = html
    setShowPreview(true)
    setShowConsole(true)
  }

  useEffect(() => {
    const handler = (e) => {
      if (e.data.type === 'console') {
        setConsoleLogs(prev => [...prev, { method: e.data.method, args: e.data.args, time: new Date().toLocaleTimeString() }])
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const localFix = () => {
    const editor = editorRef.current
    if (!editor) return
    const action = editor.getAction('editor.action.quickFix')
    if (action) action.run()
  }

  const offlineFix = () => {
    const model = editorRef.current?.getModel()
    if (!model) return
    const markers = monacoRef.current.editor.getModelMarkers({ resource: model.uri })
    markers.forEach(marker => {
      const fixes = monacoRef.current.languages.getCodeActions(model, model.getFullModelRange(), {
        type: 'quickfix',
        markers: [marker]
      })
      if (fixes.length > 0) fixes[0].run()
    })
  }

  const buildTree = () => {
    const tree = {}
    files.forEach(f => {
      const parts = f.path.split('/').filter(Boolean)
      let current = tree
      parts.forEach((part, i) => {
        if (i === parts.length - 1) {
          current[part] = {...f, isFile: true }
        } else {
          current[part] = current[part] || { isFolder: true, children: {} }
          current = current[part].children
        }
      })
    })
    return tree
  }

  const toggleFolder = (path) => {
    setExpandedFolders(prev => {
      const n = new Set(prev)
      n.has(path)? n.delete(path) : n.add(path)
      return n
    })
  }

  const renderTree = (node, path = '') => {
    return Object.entries(node).map(([name, item]) => {
      const fullPath = path + '/' + name
      if (item.isFile) {
        return (
          <div key={item.id} className={`tree-item ${activeId === item.id? 'active' : ''}`} onClick={() => setActiveId(item.id)}>
            {name} {dirtyFiles.has(item.id) && '•'}
          </div>
        )
      }
      const expanded = expandedFolders.has(fullPath)
      return (
        <div key={fullPath}>
          <div className="tree-folder" onClick={() => toggleFolder(fullPath)}>
            {expanded? <ChevronDown size={14} /> : <ChevronRight size={14} />} {name}
          </div>
          {expanded && <div className="tree-children">{renderTree(item.children, fullPath)}</div>}
        </div>
      )
    })
  }

  const activeFile = files.find(f => f.id === activeId)

  return (
    <div className="hye-editor">
      <style>{`
    .hye-editor { height: 100vh; display: flex; flex-direction: column; background: #1e1e1e; color: #d4d4d4; font-family: 'JetBrains Mono', monospace; font-size: 13px; }
    .top-bar { height: 35px; background: #252526; border-bottom: 1px solid #3c3c3c; display: flex; align-items: center; padding: 0 8px; gap: 8px; }
    .top-bar button { background: #3c3c3c; border: none; color: #ccc; padding: 4px 8px; cursor: pointer; border-radius: 3px; display: flex; align-items: center; gap: 4px; }
    .top-bar button:hover { background: #4c4c4c; }
    .menu-dropdown { position: absolute; top: 35px; left: 8px; background: #252526; border: 1px solid #3c3c3c; border-radius: 4px; min-width: 200px; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
    .menu-item { padding: 8px 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
    .menu-item:hover { background: #094771; }
    .menu-divider { height: 1px; background: #3c3c3c; margin: 4px 0; }
    .main { flex: 1; display: flex; overflow: hidden; }
    .sidebar { width: 220px; background: #252526; border-right: 1px solid #3c3c3c; display: flex; flex-direction: column; }
    .sidebar.collapsed { width: 0; overflow: hidden; }
    .sidebar-header { padding: 8px; border-bottom: 1px solid #3c3c3c; display: flex; justify-content: space-between; align-items: center; }
    .sidebar-actions button { background: none; border: none; color: #ccc; cursor: pointer; padding: 2px; }
    .tree { flex: 1; overflow-y: auto; padding: 4px; }
    .tree-item,.tree-folder { padding: 4px 8px; cursor: pointer; user-select: none; display: flex; align-items: center; gap: 4px; }
    .tree-item:hover,.tree-folder:hover { background: #2a2d2e; }
    .tree-item.active { background: #094771; }
    .tree-children { margin-left: 16px; }
    .editor-area { flex: 1; display: flex; flex-direction: column; }
    .tabs { height: 35px; background: #252526; border-bottom: 1px solid #3c3c3c; display: flex; overflow-x: auto; }
    .tab { padding: 0 12px; display: flex; align-items: center; gap: 6px; cursor: pointer; border-right: 1px solid #3c3c3c; white-space: nowrap; }
    .tab:hover { background: #2a2d2e; }
    .tab.active { background: #1e1e1e; }
    .panel { height: 200px; background: #1e1e1e; border-top: 1px solid #3c3c3c; overflow-y: auto; }
    .panel-header { padding: 4px 8px; background: #252526; border-bottom: 1px solid #3c3c3c; font-size: 11px; display: flex; justify-content: space-between; align-items: center; }
    .console-log { padding: 2px 8px; font-family: monospace; font-size: 12px; border-bottom: 1px solid #2a2d2e; }
    .console-error { color: #ff6b6b; }
    .console-warn { color: #ffd700; }
    .problem-item { padding: 4px 8px; cursor: pointer; font-size: 12px; border-bottom: 1px solid #2a2d2e; }
    .problem-item:hover { background: #2a2d2e; }
    .status-bar { height: 22px; background: #58a6ff; color: #000; display: flex; align-items: center; padding: 0 8px; font-size: 12px; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .modal { background: #252526; border: 1px solid #3c3c3c; border-radius: 6px; width: 90%; max-width: 600px; max-height: 80vh; display: flex; flex-direction: column; }
    .modal-header { padding: 12px; border-bottom: 1px solid #3c3c3c; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { margin: 0; font-size: 14px; }
    .modal-close { background: none; border: none; color: #ccc; cursor: pointer; padding: 4px; }
    .modal-search { padding: 12px; border-bottom: 1px solid #3c3c3c; display: flex; gap: 8px; }
    .modal-search input { flex: 1; background: #1e1e1e; border: 1px solid #3c3c3c; color: #d4d4d4; padding: 6px 8px; border-radius: 3px; }
    .modal-search button { background: #58a6ff; border: none; color: #000; padding: 6px 12px; cursor: pointer; border-radius: 3px; display: flex; align-items: center; gap: 4px; }
    .modal-result { padding: 12px; overflow-y: auto; }
    .modal-result-header { margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
    .modal-result-desc { color: #7d8590; font-size: 12px; margin-bottom: 12px; }
    .modal-result pre { background: #1e1e1e; padding: 12px; border-radius: 3px; overflow-x: auto; font-size: 12px; margin: 0 0 12px 0; }
    .modal-actions { display: flex; gap: 8px; }
    .modal-actions button { flex: 1; background: #3c3c3c; border: none; color: #ccc; padding: 8px; cursor: pointer; border-radius: 3px; display: flex; align-items: center; justify-content: center; gap: 4px; }
    .modal-actions button.primary { background: #58a6ff; color: #000; }
    .modal input { background: #1e1e1e; border: 1px solid #3c3c3c; color: #d4d4d4; padding: 6px 8px; border-radius: 3px; width: 100%; box-sizing: border-box; }
      `}</style>

      <div className="top-bar">
        <button onClick={() => setMenuOpen(!menuOpen)}><Menu size={16} /> HYE</button>
        <button onClick={runPreview}>▶ Run</button>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>Explorer</button>
        <div style={{marginLeft: 'auto', fontSize: 11, display: 'flex', alignItems: 'center', gap: 12}}>
          <span>{session?.user?.email}</span>
          <span>{status}</span>
        </div>
      </div>

      {menuOpen && (
        <div className="menu-dropdown" onMouseLeave={() => setMenuOpen(false)}>
          <div className="menu-item" onClick={() => saveFile(activeId)}><FileCode size={16} /> Save</div>
          <div className="menu-item" onClick={localFix}><Wand2 size={16} /> Local Fix</div>
          <div className="menu-item" onClick={offlineFix}><Wand2 size={16} /> Offline Fix</div>
          <div className="menu-divider" />
          <div className="menu-item" onClick={() => { setShowNewFileModal(true); setMenuOpen(false) }}><Plus size={16} /> New File</div>
          <div className="menu-item" onClick={() => { setShowNewFolderModal(true); setMenuOpen(false) }}><FolderPlus size={16} /> New Folder</div>
          <div className="menu-item" onClick={() => { importFiles(); setMenuOpen(false) }}><Upload size={16} /> Import Files</div>
          <div className="menu-item" onClick={() => { if (activeFile) startRename(activeFile); setMenuOpen(false) }}><Edit3 size={16} /> Rename File</div>
          <div className="menu-divider" />
          <div className="menu-item" onClick={() => { setShowTemplateModal(true); setMenuOpen(false) }}><FileCode size={16} /> Templates</div>
          <div className="menu-item" onClick={() => { setShowHelpModal(true); setMenuOpen(false) }}><BookOpen size={16} /> HYE-HELP</div>
          <div className="menu-item" onClick={() => { setShowAskModal(true); setMenuOpen(false) }}><HelpCircle size={16} /> HYE-ASK</div>
          <div className="menu-divider" />
          <a className="menu-item" href="https://your-terminal-url.com" target="_blank" style={{textDecoration: 'none', color: '#d4d4d4'}}><Terminal size={16} /> HYE Terminal</a>
          <div className="menu-divider" />
          <div className="menu-item" onClick={() => { setShowConsole(!showConsole); setMenuOpen(false) }}>Console: {showConsole? 'On' : 'Off'}</div>
          <div className="menu-item" onClick={() => { setAutoSave(!autoSave); setMenuOpen(false) }}>Auto-save: {autoSave? 'On' : 'Off'}</div>
          <div className="menu-divider" />
          <div className="menu-item" onClick={handleLogout}><LogOut size={16} /> Logout</div>
        </div>
      )}

      <div className="main">
        <div className={`sidebar ${!sidebarOpen? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <span style={{fontSize: 11, fontWeight: 'bold', color: '#7d8590'}}>EXPLORER</span>
            <div className="sidebar-actions">
              <button onClick={() => setShowNewFileModal(true)} title="New File"><Plus size={14} /></button>
              <button onClick={() => setShowNewFolderModal(true)} title="New Folder"><FolderPlus size={14} /></button>
              <button onClick={importFiles} title="Import Files"><Upload size={14} /></button>
            </div>
          </div>
          <div className="tree">{renderTree(buildTree())}</div>
        </div>

        <div className="editor-area">
          <div className="tabs">
            {files.map(f => (
              <div key={f.id} className={`tab ${activeId === f.id? 'active' : ''}`} onClick={() => setActiveId(f.id)}>

                {f.name}
                {dirtyFiles.has(f.id) && '•'}
                {files.length > 1 && <X size={12} onClick={(e) => { e.stopPropagation(); deleteFile(f.id) }} />}

                {f.name} {dirtyFiles.has(f.id) && '•'} {files.length > 1 && <X size={12} onClick={(e) => { e.stopPropagation(); deleteFile(f.id) }} />}

              </div>
            ))}
          </div>

          {showPreview? (
            <iframe ref={iframeRef} style={{flex: 1, border: 'none', background: '#1e1e1e'}} sandbox="allow-scripts allow-same-origin" />
          ) : (
            <Editor
              height="600px"
              language="javascript"
              value={activeFile?.content || ''}
              onChange={handleChange}
              onMount={handleEditorMount}
              theme="hye-dark"
              options={{
                fontFamily: 'JetBrains Mono,monospace',
                fontSize: 14,
                minimap: { enabled: true },
                wordWrap: 'off',
                tabSize: 2,
                folding: true,
                foldingStrategy: 'indentation',
                showFoldingControls: 'always',
                bracketPairColorization: { enabled: true, independentColorPoolPerBracketType: true },
                guides: { bracketPairs: true, bracketPairsHorizontal: 'active' },
                renderValidationDecorations: 'on',
                autoClosingBrackets: 'always',
                autoClosingQuotes: 'always',
                autoIndent: 'full',
                formatOnPaste: true,
                formatOnType: true,
                inlineSuggest: { enabled: true },
                quickSuggestions: { other: true, comments: false, strings: true },
                tabCompletion: 'on',
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: 'on',
                scrollBeyondLastLine: true,
                multiCursorModifier: 'alt',
                automaticLayout: true
              }}
            />
          )}

          {showConsole && (
            <div className="panel">
              <div className="panel-header">
                CONSOLE
                <button onClick={() => setShowConsole(false)} style={{background: 'none', border: 'none', color: '#ccc', cursor: 'pointer'}}><X size={14} /></button>
              </div>
              {consoleLogs.length === 0? (
                <div style={{padding: 12, color: '#7d8590', fontSize: 12}}>Console output appears here...</div>
              ) : consoleLogs.map((log, i) => (
                <div key={i} className={`console-log console-${log.method}`}>
                  [{log.time}] {log.args.join(' ')}
                </div>
              ))}
            </div>
          )}

          {problems.length > 0 &&!showConsole && (
            <div className="panel">
              <div className="panel-header">PROBLEMS ({problems.length})</div>
              {problems.map((p, i) => (
                <div key={i} className="problem-item" onClick={() => {
                  const file = files.find(f => f.path === p.file)
                  if (file) {
                    setActiveId(file.id)
                    setTimeout(() => {
                      editorRef.current?.revealLineInCenter(p.line)
                      editorRef.current?.setPosition({lineNumber: p.line, column: 1})
                    }, 100)
                  }
                }}>
                  <AlertCircle size={12} style={{display: 'inline', marginRight: 6, color: p.severity === 'error'? '#ff6b6b' : '#ffd700'}} />
                  {p.file}:{p.line} - {p.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="status-bar">
        {isNative? 'device' : 'cloud'} | {status} {dirtyFiles.size > 0 && '| unsaved'} | Ln {editorRef.current?.getPosition()?.lineNumber || 1}, Col {editorRef.current?.getPosition()?.column || 1}
      </div>

      {renameFile && (
        <div className="modal-overlay" onClick={() => setRenameFile(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{marginTop: 0}}>Rename File</h3>
            <input
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmRename()}
              autoFocus
            />
            <div style={{display: 'flex', gap: 8, marginTop: 12}}>
              <button onClick={confirmRename} style={{flex: 1, padding: 8, background: '#58a6ff', border: 'none', borderRadius: 4, color: '#000', cursor: 'pointer'}}>
                Rename
              </button>
              <button onClick={() => setRenameFile(null)} style={{padding: 8, background: '#3c3c3c', border: 'none', borderRadius: 4, color: '#ccc', cursor: 'pointer'}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewFileModal && (
        <div className="modal-overlay" onClick={() => setShowNewFileModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{marginTop: 0}}>New File</h3>
            <input
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              placeholder="App.jsx"
              onKeyDown={e => e.key === 'Enter' && createFile()}
              autoFocus
            />
            <div style={{display: 'flex', gap: 8, marginTop: 12}}>
              <button onClick={createFile} style={{flex: 1, padding: 8, background: '#58a6ff', border: 'none', borderRadius: 4, color: '#000', cursor: 'pointer'}}>
                Create
              </button>
              <button onClick={() => setShowNewFileModal(false)} style={{padding: 8, background: '#3c3c3c', border: 'none', borderRadius: 4, color: '#ccc', cursor: 'pointer'}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewFolderModal && (
        <div className="modal-overlay" onClick={() => setShowNewFolderModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{marginTop: 0}}>New Folder</h3>
            <input
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              placeholder="components"
              onKeyDown={e => e.key === 'Enter' && createFolder()}
              autoFocus
            />
            <div style={{display: 'flex', gap: 8, marginTop: 12}}>
              <button onClick={createFolder} style={{flex: 1, padding: 8, background: '#58a6ff', border: 'none', borderRadius: 4, color: '#000', cursor: 'pointer'}}>
                Create
              </button>
              <button onClick={() => setShowNewFolderModal(false)} style={{padding: 8, background: '#3c3c3c', border: 'none', borderRadius: 4, color: '#ccc', cursor: 'pointer'}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => { setShowTemplateModal(false); setTemplateResult(null); setTemplateInput(''); setTemplateSearch('') }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Templates</h3>
              <button className="modal-close" onClick={() => { setShowTemplateModal(false); setTemplateResult(null); setTemplateInput(''); setTemplateSearch('') }}><X size={16} /></button>
            </div>

            <div className="modal-search">
              <input
                placeholder="Ask AI: e.g. dashboard with charts..."
                value={templateInput}
                onChange={e => setTemplateInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchTemplateAI()}
              />
              <button onClick={searchTemplateAI}><Search size={16} /> AI</button>
            </div>

            {templateResult && (
              <div className="modal-result">
                <div className="modal-result-header">
                  <strong>{templateResult.name}</strong>
                  <span style={{fontSize: 11, color: '#58a6ff'}}>{templateResult.source === 'ai'? 'AI' : 'Local'}</span>
                </div>
                <div className="modal-result-desc">{templateResult.desc}</div>
                <pre>{templateResult.code}</pre>
                <div className="modal-actions">
                  <button className="primary" onClick={() => { insertCode(templateResult.code); setShowTemplateModal(false) }}>
                    <FileCode size={14} /> Insert
                  </button>
                  <button onClick={() => copyToClipboard(templateResult.code)}>
                    <Copy size={14} /> Copy
                  </button>
                </div>
              </div>
            )}

            <div className="menu-divider" style={{margin: '12px 0'}} />
            <input 
              placeholder="Filter local templates..." 
              value={templateSearch}
              onChange={e => setTemplateSearch(e.target.value)}
              style={{width: '100%', marginBottom: 8}}
            />
            <div style={{maxHeight: '250px', overflowY: 'auto'}}>
              {templates
                .filter(t => t.name.toLowerCase().includes(templateSearch.toLowerCase()))
                .map((t, i) => (
                  <div key={i} className="menu-item" onClick={() => { insertCode(t.code); setShowTemplateModal(false) }}>
                    <FileCode size={14} /> {t.name}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {showHelpModal && (
        <div className="modal-overlay" onClick={() => { setShowHelpModal(false); setHelpResult(null); setHelpInput(''); setHelpSearch('') }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>HYE-HELP</h3>
              <button className="modal-close" onClick={() => { setShowHelpModal(false); setHelpResult(null); setHelpInput(''); setHelpSearch('') }}><X size={16} /></button>
            </div>
            
            <div className="modal-search">
              <input
                placeholder="Ask AI: e.g. async await error handling..."
                value={helpInput}
                onChange={e => setHelpInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchHelpAI()}
              />
              <button onClick={searchHelpAI}><Search size={16} /> AI</button>
            </div>

            {helpResult && (
              <div className="modal-result">
                <div className="modal-result-header">
                  <strong>{helpResult.name}</strong>
                  <span style={{fontSize: 11, color: '#58a6ff'}}>{helpResult.source === 'ai'? 'AI' : 'Local'}</span>
                </div>
                <div className="modal-result-desc">{helpResult.desc}</div>
                <pre>{helpResult.code}</pre>
                <div className="modal-actions">
                  <button className="primary" onClick={() => { insertCode(helpResult.code); setShowHelpModal(false) }}>
                    <FileCode size={14} /> Insert
                  </button>
                  <button onClick={() => copyToClipboard(helpResult.code)}>
                    <Copy size={14} /> Copy
                  </button>
                </div>
              </div>
            )}

            <div className="menu-divider" style={{margin: '12px 0'}} />
            <input 
              placeholder="Filter local help..." 
              value={helpSearch}
              onChange={e => setHelpSearch(e.target.value)}
              style={{width: '100%', marginBottom: 8}}
            />
            <div style={{maxHeight: '250px', overflowY: 'auto'}}>
              {syntaxHelp
                .filter(h => h.name.toLowerCase().includes(helpSearch.toLowerCase()))
                .map((h, i) => (
                  <div key={i} className="menu-item" onClick={() => { insertCode(h.code); setShowHelpModal(false) }}>
                    <BookOpen size={14} /> {h.name}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {showAskModal && (
        <div className="modal-overlay" onClick={() => { setShowAskModal(false); setAskResult(null); setAskInput(''); setAskSearch('') }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>HYE-ASK</h3>
              <button className="modal-close" onClick={() => { setShowAskModal(false); setAskResult(null); setAskInput(''); setAskSearch('') }}><X size={16} /></button>
            </div>
            
            <div className="modal-search">
              <input
                placeholder="Ask AI: e.g. how does useCallback work..."
                value={askInput}
                onChange={e => setAskInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchAskAI()}
              />
              <button onClick={searchAskAI}><Search size={16} /> AI</button>
            </div>

            {askResult && (
              <div className="modal-result">
                <div className="modal-result-header">
                  <strong>{askResult.name}</strong>
                  <span style={{fontSize: 11, color: '#58a6ff'}}>{askResult.source === 'ai'? 'AI' : 'Local'}</span>
                </div>
                <div className="modal-result-desc">{askResult.desc}</div>
                <pre>{askResult.code}</pre>
                <div className="modal-actions">
                  <button onClick={() => copyToClipboard(askResult.desc)}>
                    <Copy size={14} /> Copy Explanation
                  </button>
                </div>
              </div>
            )}

            <div className="menu-divider" style={{margin: '12px 0'}} />
            <input 
              placeholder="Filter local terms..." 
              value={askSearch}
              onChange={e => setAskSearch(e.target.value)}
              style={{width: '100%', marginBottom: 8}}
            />
            <div style={{maxHeight: '250px', overflowY: 'auto'}}>
              {terms
                .filter(t => t.name.toLowerCase().includes(askSearch.toLowerCase()))
                .map((t, i) => (
                  <div key={i} className="menu-item" onClick={() => {
                    setAskResult({ name: t.name, code: `// ${t.name}\n// ${t.desc}`, desc: t.desc, source: 'local' })
                  }}>
                    <HelpCircle size={14} /> {t.name}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const handler = (e) => {
      setHasError(true)
      setError(e.error || e.reason)
    }
    window.addEventListener('error', handler)
    window.addEventListener('unhandledrejection', handler)
    return () => {
      window.removeEventListener('error', handler)
      window.removeEventListener('unhandledrejection', handler)
    }
  }, [])

  if (hasError) {
    return (
      <div style={{padding: 20, background: '#1e1e1e', color: '#ff6b6b', height: '100vh'}}>
        <h2>HYE Editor Crashed</h2>
        <pre style={{whiteSpace: 'pre-wrap'}}>{error?.toString()}</pre>
        <button onClick={() => window.location.reload()} style={{padding: 8, background: '#58a6ff', border: 'none', color: '#000', cursor: 'pointer'}}>
          Reload Editor
        </button>
      </div>
    )
  }
  return children
}

const HyeEditor = () => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div style={{height: '100vh', background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#58a6ff'}}>Loading HYE...</div>
  }

  return (
    <ErrorBoundary>
      {session? <HyeEditorCore session={session} /> : <LoginScreen />}
    </ErrorBoundary>
  )
}

export default HyeEditor
