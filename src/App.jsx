import { useState, useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { createClient } from '@supabase/supabase-js'
import * as prettier from 'prettier/standalone'
import * as parserBabel from 'prettier/plugins/babel'
import * as prettierPluginEstree from 'prettier/plugins/estree'
import * as parserPostcss from 'prettier/plugins/postcss'
import { 
  Code2, Eye, Save, FolderPlus, FilePlus, Settings, Zap, 
  Download, Wifi, WifiOff, User, LogOut, Search, 
  ChevronDown, ChevronRight, Folder, FolderOpen, X, Check, 
  Terminal, Store, Sparkles, Wand2, Menu, Plus, Trash2, AlertCircle 
} from 'lucide-react'

const API = 'https://hye-api.onrender.com'
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// LEVEL 1: Local regex fixes - no network
const localFix = (codeText) => {
  let fixed = codeText
  const openBraces = (fixed.match(/{/g) || []).length
  const closeBraces = (fixed.match(/}/g) || []).length
  if (openBraces > closeBraces) fixed += '}'.repeat(openBraces - closeBraces)
  
  const openParens = (fixed.match(/\(/g) || []).length
  const closeParens = (fixed.match(/\)/g) || []).length
  if (openParens > closeParens) fixed += ')'.repeat(openParens - closeParens)
  
  fixed = fixed.replace(/([^;\s])\s*\n\s*([a-zA-Z_$])/g, '$1;\n$2')
  return fixed
}

// LEVEL 2: Offline JS lint rules - no network
const offlineLocalFix = (codeText) => {
  let fixed = codeText
  fixed = fixed.replace(/([^=!])==([^=])/g, '$1=== $2')
  fixed = fixed.replace(/([^=!])!=([^=])/g, '$1!== $2')
  
  const quotes = (fixed.match(/(?<!\\)"/g) || []).length
  if (quotes % 2!== 0) fixed += '"'
  const singleQuotes = (fixed.match(/(?<!\\)'/g) || []).length
  if (singleQuotes % 2!== 0) fixed += "'"
  const backticks = (fixed.match(/(?<!\\)`/g) || []).length
  if (backticks % 2!== 0) fixed += "`"
  
  fixed = fixed.replace(/useEffect\(\(\) => {([^}]+)},\s*\[\]\)/g, 'useEffect(() => {$1}, [])')
  fixed = fixed.replace(/console\.log\(\)/g, 'console.log("")')
  return fixed
}

export default function HyecodeEditor() {
  const [user, setUser] = useState(null)
  const [isGuest, setIsGuest] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [files, setFiles] = useState([{
    id: 1,
    name: 'App.jsx',
    path: 'App.jsx',
    content: `export default function App() {\n return (\n <div className="min-h-screen bg-black text-white flex items-center justify-center">\n <h1 className="text-4xl font-bold">HYE Editor 🚀</h1>\n </div>\n )\n}`,
    lang: 'javascript'
  }])
  const [activeId, setActiveId] = useState(1)
  const [view, setView] = useState('code')
  const [sidebar, setSidebar] = useState(true)
  const [menu, setMenu] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [status, setStatus] = useState('ready')
  const [online, setOnline] = useState(navigator.onLine)
  const [dirty, setDirty] = useState(false)
  const [search, setSearch] = useState('')
  const [folders, setFolders] = useState({})
  const [fixing, setFixing] = useState(false)
  const [fixMethod, setFixMethod] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  
  const editorRef = useRef(null)
  const saveTimeout = useRef(null)
  const activeFile = files.find(f => f.id === activeId)

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user?? null)
      setAuthLoading(false)
      if (session?.user) loadCloudFiles(session.user.id)
      else loadLocalFiles()
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user?? null)
      if (session?.user) loadCloudFiles(session.user.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadLocalFiles = () => {
    const saved = localStorage.getItem('hye_editor_files')
    if (saved) {
      const data = JSON.parse(saved)
      setFiles(data)
      setActiveId(data[0]?.id || 1)
    }
    setStatus('local')
  }

  const loadCloudFiles = async (userId) => {
    setStatus('loading cloud...')
    try {
      const { data: fileData } = await supabase
     .from('files')
     .select('*')
     .eq('user_id', userId)
     .order('created_at', { ascending: true })

      if (fileData && fileData.length > 0) {
        setFiles(fileData)
        setActiveId(fileData[0].id)
        setStatus('cloud synced')
      } else {
        setStatus('ready')
      }
    } catch (e) {
      setErrorMsg('Cloud load failed: ' + e.message)
      setStatus('cloud error')
      loadLocalFiles()
    }
  }

  const saveToCloud = async () => {
    if (!user || isGuest ||!online) return
    
    setStatus('saving...')
    try {
      for (let f of files) {
        await supabase.from('files').upsert({
          id: f.id,
          user_id: user.id,
          name: f.name,
          path: f.path,
          content: f.content,
          lang: f.lang
        })
      }
      setStatus('saved')
      setDirty(false)
      setErrorMsg('')
      setTimeout(() => setStatus('ready'), 2000)
    } catch (e) {
      setErrorMsg('Save failed: ' + e.message)
      setStatus('save failed')
    }
  }

  useEffect(() => {
    if (dirty) {
      clearTimeout(saveTimeout.current)
      saveTimeout.current = setTimeout(() => {
        localStorage.setItem('hye_editor_files', JSON.stringify(files))
        if (user &&!isGuest) saveToCloud()
        else {
          setDirty(false)
          setStatus('saved')
          setTimeout(() => setStatus('ready'), 2000)
        }
      }, 1500)
    }
  }, [files, dirty, user, isGuest])

  const handleLogin = async () => {
    setAuthLoading(true)
    setErrorMsg('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setErrorMsg('Login failed: ' + error.message)
    setAuthLoading(false)
  }

  const handleSignup = async () => {
    setAuthLoading(true)
    setErrorMsg('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setErrorMsg('Signup failed: ' + error.message)
    else setErrorMsg('Check your email to confirm!')
    setAuthLoading(false)
  }

  const handleGuest = () => {
    setIsGuest(true)
    setUser({ email: 'Guest' })
    loadLocalFiles()
  }

  const handleLogout = async () => {
    if (!isGuest) await supabase.auth.signOut()
    setUser(null)
    setIsGuest(false)
    setFiles([{
      id: 1,
      name: 'App.jsx',
      path: 'App.jsx',
      content: `export default function App() {\n return <div>New Session</div>\n}`,
      lang: 'javascript'
    }])
    setActiveId(1)
  }

  const updateContent = (content) => {
    setFiles(files.map(f => f.id === activeId? {...f, content } : f))
    setDirty(true)
    setStatus('unsaved')
  }

  const newFile = () => {
    const name = prompt('File name:') || `file${files.length + 1}.jsx`
    const ext = name.split('.').pop()
    const langMap = { jsx: 'javascript', js: 'javascript', ts: 'typescript', css: 'css', html: 'html', json: 'json' }
    const newF = {
      id: Date.now(),
      name,
      path: name,
      content: ext === 'jsx'? 'export default function NewFile() {\n return <div>New</div>\n}' : '',
      lang: langMap[ext] || 'plaintext'
    }
    setFiles([...files, newF])
    setActiveId(newF.id)
    setMenu(false)
  }

  const deleteFile = (id) => {
    if (files.length === 1) return alert('Cannot delete last file')
    const newFiles = files.filter(f => f.id!== id)
    setFiles(newFiles)
    if (id === activeId) setActiveId(newFiles[0].id)
  }

  const newFolder = () => {
    const name = prompt('Folder name:')
    if (name) {
      const newF = {
        id: Date.now(),
        name: 'index.jsx',
        path: `${name}/index.jsx`,
        content: `// ${name}\nexport default function ${name}() {\n return <div>${name}</div>\n}`,
        lang: 'javascript'
      }
      setFiles([...files, newF])
      setActiveId(newF.id)
    }
    setMenu(false)
  }

  // BUTTON 1: Local Fix - instant, no network
  const handleLocalFix = () => {
    if (!activeFile) return
    setFixing(true)
    setErrorMsg('')
    setFixMethod('⚡ Local Fix Running...')
    
    try {
      let fixed = localFix(activeFile.content)
      fixed = offlineLocalFix(fixed)
      updateContent(fixed)
      setFixMethod('⚡ Local Fix Complete')
    } catch (e) {
      setErrorMsg('Local Fix Error: ' + e.message)
    }
    
    setFixing(false)
    setTimeout(() => {
      setFixMethod('')
      setErrorMsg('')
    }, 3000)
    setMenu(false)
  }

  // BUTTON 2: Online Fix - calls /fix endpoint, not AI
  const handleOnlineFix = async () => {
    if (!activeFile) return
    setFixing(true)
    setErrorMsg('')
    setFixMethod('🌐 Online Fix Running...')
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const res = await fetch(`${API}/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ code: activeFile.content })
      })
      
      clearTimeout(timeoutId)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      
      const data = await res.json()
      updateContent(data.fixed || data.code || activeFile.content)
      setFixMethod('🌐 Online Fix Complete')
    } catch (e) {
      if (e.name === 'AbortError') {
        setErrorMsg('Backend timeout - Visit hye-api.onrender.com to wake it')
      } else if (e.message.includes('Failed to fetch') || e.message.includes('No address')) {
        setErrorMsg('Backend offline - Render sleeping or wrong URL')
      } else {
        setErrorMsg('Online Fix Error: ' + e.message)
      }
      setFixMethod('❌ Online Fix Failed')
    }
    
    setFixing(false)
    setTimeout(() => {
      setFixMethod('')
      setErrorMsg('')
    }, 4000)
    setMenu(false)
  }

  // BUTTON 3: AI Fix
  const handleAiFix = async () => {
    if (!activeFile) return
    setFixing(true)
    setErrorMsg('')
    setFixMethod('🤖 AI Fixing...')
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      
      const res = await fetch(`${API}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: `Fix all syntax and logic errors. Return only fixed code:\n\n${activeFile.content}`,
          mode: 'fix',
          user_id: user?.id || 'guest'
        })
      })
      
      clearTimeout(timeoutId)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      
      const data = await res.json()
      let fixed = data.response || data.text || activeFile.content
      fixed = fixed.replace(/```[\w]*\n?([\s\S]*?)```/g, '$1').trim()
      updateContent(fixed)
      setFixMethod('🤖 AI Fixed')
    } catch (e) {
      if (e.name === 'AbortError') {
        setErrorMsg('AI timeout - Backend waking up. Retry in 30s')
      } else if (e.message.includes('No address') || e.message.includes('Failed to fetch')) {
        setErrorMsg('AI Error: Backend offline. Visit hye-api.onrender.com first')
      } else {
        setErrorMsg('AI Error: ' + e.message)
      }
      setFixMethod('❌ AI Fix Failed')
    }
    
    setFixing(false)
    setTimeout(() => {
      setFixMethod('')
      setErrorMsg('')
    }, 4000)
    setMenu(false)
  }

  // BUTTON 4: AI Build
  const aiBuild = async () => {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    setStatus('AI building...')
    setErrorMsg('')
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000)
      
      const res = await fetch(`${API}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: aiPrompt,
          mode: 'build',
          code: activeFile?.content || '',
          user_id: user?.id || 'guest'
        })
      })
      
      clearTimeout(timeoutId)
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      
      const data = await res.json()
      const text = data.response || data.text || ''
      
      const fileRegex = /FILE:\s*(.+?)\n```[\w]*\n([\s\S]*?)```/g
      const newFiles = []
      let match
      
      while ((match = fileRegex.exec(text))!== null) {
        const path = match[1].trim()
        const content = match[2].trim()
        const name = path.split('/').pop()
        newFiles.push({
          id: Date.now() + Math.random(),
          name,
          path,
          content,
          lang: name.split('.').pop() === 'jsx'? 'javascript' : 'plaintext'
        })
      }
      
      if (newFiles.length > 0) {
        setFiles([...files,...newFiles])
        setActiveId(newFiles[0].id)
        setStatus(`Created ${newFiles.length} files`)
      } else {
        updateContent(text)
        setStatus('AI generated')
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        setErrorMsg('AI timeout - Backend waking up. Retry in 30s')
      } else if (e.message.includes('No address') || e.message.includes('Failed to fetch')) {
        setErrorMsg('AI Error: Backend offline. Visit hye-api.onrender.com first')
      } else {
        setErrorMsg('AI Error: ' + e.message)
      }
      setStatus('AI failed')
    }
    
    setAiLoading(false)
    setAiOpen(false)
    setAiPrompt('')
    setTimeout(() => setStatus('ready'), 3000)
  }

  const exportProject = () => {
    const zip = files.map(f => `// ${f.path}\n${f.content}`).join('\n\n---\n\n')
    const blob = new Blob([zip], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'hye-project.txt'
    a.click()
    setMenu(false)
  }

  const openTerminal = () => {
    window.open(`hye://terminal?user=${user?.id || 'guest'}`, '_blank')
    setMenu(false)
  }

  const openMarketplace = () => {
    window.open(`hye://marketplace`, '_blank')
    setMenu(false)
  }

  const buildTree = () => {
    const tree = {}
    files.forEach(f => {
      const parts = f.path.split('/')
      let curr = tree
      parts.forEach((part, i) => {
        if (i === parts.length - 1) {
          curr[part] = {...f, isFile: true }
        } else {
          if (!curr[part]) curr[part] = { isFolder: true, children: {} }
          curr = curr[part].children
        }
      })
    })
    return tree
  }

  const renderTree = (node, path = '', depth = 0) => {
    return Object.entries(node).map(([name, item]) => {
      const fullPath = path? `${path}/${name}` : name
      if (item.isFolder) {
        const open = folders[fullPath]!== false
        return (
          <div key={fullPath}>
            <div
              onClick={() => setFolders({...folders, [fullPath]:!open })}
              className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-800 cursor-pointer text-sm"
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              {open? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {open? <FolderOpen className="w-4 h-4 text-blue-400" /> : <Folder className="w-4 h-4 text-blue-400" />}
              <span>{name}</span>
            </div>
            {open && renderTree(item.children, fullPath, depth + 1)}
          </div>
        )
      } else {
        const icon = item.name.endsWith('.jsx')? '⚛️' : item.name.endsWith('.css')? '🎨' : '📄'
        return (
          <div
            key={item.id}
            onClick={() => setActiveId(item.id)}
            className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer text-sm group ${
              item.id === activeId? 'bg-blue-600' : 'hover:bg-gray-800'
            }`}
            style={{ paddingLeft: `${depth * 12 + 24}px` }}
          >
            <span className="text-xs">{icon}</span>
            <span className="truncate flex-1">{name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); deleteFile(item.id) }}
              className="opacity-0 group-hover:opacity-100 hover:bg-gray-700 rounded p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )
      }
    })
  }

  const previewCode = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdn.tailwindcss.com"></script>
      <script type="importmap">
        {"imports": {"react": "https://esm.sh/react@18", "react-dom": "https://esm.sh/react-dom@18/client"}}
      </script>
    </head>
    <body class="bg-black">
      <div id="root"></div>
      <script type="module">
        import React from 'react'
        import { createRoot } from 'react-dom'
        ${activeFile?.content || ''}
        createRoot(document.getElementById('root')).render(React.createElement(App))
      </script>
    </body>
    </html>
  `

  const tree = buildTree(files)
  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))

  if (authLoading) {
    return <div className="h-screen w-screen bg-black text-white flex items-center justify-center">Loading...</div>
  }

  if (!user &&!isGuest) {
    return (
      <div className="h-screen w-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8 w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6 justify-center">
            <Code2 className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold">HYE Editor</h1>
          </div>
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded text-sm text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-3 mb-3 text-sm focus:outline-none focus:border-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-3 mb-4 text-sm focus:outline-none focus:border-blue-500"
          />
          <button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded mb-2 text-sm font-medium">
            Login
          </button>
          <button onClick={handleSignup} className="w-full bg-gray-800 hover:bg-gray-700 py-2 rounded mb-2 text-sm font-medium">
            Sign Up
          </button>
          <button onClick={handleGuest} className="w-full bg-green-600 hover:bg-green-700 py-2 rounded text-sm font-medium">
            Continue as Guest
          </button>
          <p className="text-xs text-gray-500 mt-4 text-center">Guest mode saves locally only</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
      <div className="h-12 bg-[#1a1a1a] border-b border-gray-800 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebar(!sidebar)} className="p-1.5 hover:bg-gray-800 rounded">
            <Menu className="w-5 h-5" />
          </button>
          <Code2 className="w-5 h-5 text-blue-500" />
          <span className="font-bold">HYE</span>
          {online? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
          <span className="text-xs text-gray-400">{status}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2 top-2 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search files..."
              className="bg-[#0a0a0a] border border-gray-800 rounded pl-8 pr-3 py-1.5 text-sm w-40 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button onClick={() => setView(view === 'code'? 'preview' : 'code')} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm flex items-center gap-2">
            {view === 'code'? <><Eye className="w-4 h-4" /> Preview</> : <><Code2 className="w-4 h-4" /> Code</>}
          </button>

          <div className="relative">
            <button onClick={() => setMenu(!menu)} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded">
              <Settings className="w-5 h-5" />
            </button>

            {menu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                <div className="absolute right-0 top-10 bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-2xl py-2 w-64 z-20 max-h-96 overflow-y-auto">
                  <div className="px-3 py-2 text-xs text-gray-500 font-bold border-b border-gray-800 flex items-center gap-2">
                    <User className="w-3 h-3" /> {user?.email || 'Guest'}
                  </div>

                  <div className="px-3 py-2 text-xs text-gray-500 font-bold">FIX TOOLS</div>
                  
                  <button onClick={handleLocalFix} disabled={fixing} className="w-full px-3 py-2 hover:bg-gray-800 text-left text-sm flex items-center gap-2 disabled:opacity-50">
                    <Zap className="w-4 h-4 text-yellow-400" /> Local Fix
                  </button>
                  
                  <button onClick={handleOnlineFix} disabled={fixing} className="w-full px-3 py-2 hover:bg-gray-800 text-left text-sm flex items-center gap-2 disabled:opacity-50">
                    <Wifi className="w-4 h-4 text-green-400" /> Online Fix
                  </button>
                  
                  <button onClick={handleAiFix} disabled={fixing} className="w-full px-3 py-2 hover:bg-gray-800 text-left text-sm flex items-center gap-2 disabled:opacity-50">
                    <Wand2 className="w-4 h-4 text-purple-400" /> AI Fix
                  </button>
                  
                  <button onClick={() => { setAiOpen(true); setMenu(false) }} className="w-full px-3 py-2 hover:bg-gray-800 text-left text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" /> AI Build
                  </button>
                  
                  <div className="px-3 py-2 text-xs text-gray-500 font-bold border-t border-gray-800 mt-1">FILES</div>
                  <button onClick={newFile} className="w-full px-3 py-2 hover:bg-gray-800 text-left text-sm flex items-center gap-2">
                    <FilePlus className="w-4 h-4" /> New File
                  </button>
                  <button onClick={newFolder} className="w-full px-3 py-2 hover:bg-gray-800 text-left text-sm flex items-center gap-2">
                    <FolderPlus className="w-4 h-4" /> New Folder
                  </button>

                  <div className="px-3 py-2 text-xs text-gray-500 font-bold border-t border-gray-800 mt-1">HYE ECOSYSTEM</div>
                  <button onClick={openTerminal} className="w-full px-3 py-2 hover:bg-gray-800 text-left text-sm flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-green-400" /> HYE Terminal
                  </button>
                  <button onClick={openMarketplace} className="w-full px-3 py-2 hover:bg-gray-800 text-left text-sm flex items-center gap-2">
                    <Store className="w-4 h-4 text-purple-400" /> HYE Marketplace
                  </button>

                  <div className="px-3 py-2 text-xs text-gray-500 font-bold border-t border-gray-800 mt-1">EXPORT</div>
                  <button onClick={exportProject} className="w-full px-3 py-2 hover:bg-gray-800 text-left text-sm flex items-center gap-2">
                    <Download className="w-4 h-4" /> Export Project
                  </button>

                  <div className="px-3 py-2 text-xs text-gray-500 font-bold border-t border-gray-800 mt-1">ACCOUNT</div>
                  <button onClick={handleLogout} className="w-full px-3 py-2 hover:bg-gray-800 text-left text-sm flex items-center gap-2 text-red-400">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-900/30 border-b border-red-800 px-4 py-2 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span className="flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="hover:bg-red-800 rounded p-1">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {fixMethod && (
        <div className="bg-blue-900/30 border-b border-blue-800 px-4 py-2 text-sm text-blue-400 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          <span>{fixMethod}</span>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {sidebar && (
          <div className="w-64 bg-[#1a1a1a] border-r border-gray-800 flex flex-col">
            <div className="p-2 border-b border-gray-800 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400">EXPLORER</span>
              <div className="flex gap-1">
                <button onClick={newFile} className="p-1 hover:bg-gray-800 rounded">
                  <FilePlus className="w-4 h-4" />
                </button>
                <button onClick={newFolder} className="p-1 hover:bg-gray-800 rounded">
                  <FolderPlus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {renderTree(tree)}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-10 bg-[#1a1a1a] border-b border-gray-800 flex items-center overflow-x-auto shrink-0">
            {files.map(f => (
              <div
                key={f.id}
                onClick={() => setActiveId(f.id)}
                className={`flex items-center gap-2 px-4 h-full border-r border-gray-800 cursor-pointer text-sm whitespace-nowrap ${
                  f.id === activeId? 'bg-[#0a0a0a] text-white' : 'text-gray-400 hover:text-white hover:bg-[#252525]'
                }`}
              >
                <span>{f.name}</span>
                <button onClick={(e) => { e.stopPropagation(); deleteFile(f.id) }} className="hover:bg-gray-700 rounded p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex-1 bg-[#0a0a0a] overflow-hidden">
            {view === 'code'? (
              <Editor
                height="600px"
                width="100%"
                path={activeFile?.name}
                                language={activeFile?.lang || 'javascript'}
                value={activeFile?.content || ''}
                onChange={updateContent}
                onMount={(editor) => {
                  editorRef.current = editor
                  setTimeout(() => editor.layout(), 100)
                }}
                theme="vs-dark"
                loading={<div className="p-4 text-gray-400">Loading editor...</div>}
                options={{
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono, Menlo, monospace',
                  minimap: { enabled: false },
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  tabSize: 2,
                  renderWhitespace: 'selection'
                }}
              />
            ) : (
              <iframe
                srcDoc={previewCode}
                className="w-full h-full bg-white"
                sandbox="allow-scripts allow-same-origin"
              />
            )}
          </div>
        </div>
      </div>

      {/* AI Modal */}
      {aiOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold">AI Builder</h3>
            </div>
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="Describe what you want to build... e.g. 'todo app with localStorage' or 'login form with validation'"
              className="w-full h-32 bg-[#0a0a0a] border border-gray-800 rounded p-3 text-sm resize-none focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={aiBuild}
                disabled={aiLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 py-2 rounded text-sm font-medium"
              >
                {aiLoading? 'Building...' : 'Generate'}
              </button>
              <button onClick={() => setAiOpen(false)} className="px-4 bg-gray-800 hover:bg-gray-700 py-2 rounded text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
