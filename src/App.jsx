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
    content: `export default function App() {\n return (\n <div style={{minHeight: '100vh', background: 'black', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>\n <h1 style={{fontSize: '36px', fontWeight: 'bold'}}>HYE Editor 🚀</h1>\n </div>\n )\n}`,
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

// ADD THIS NEW useEffect HERE 👇 - DON'T MIX WITH THE ONE ABOVE
useEffect(() => {
  if (!user &&!isGuest) return
  
  const userId = user?.id || 'guest'
  const ws = new WebSocket(`wss://hye-api.onrender.com/ws/terminal/${userId}`)
  
  ws.onmessage = (e) => {
    if (e.data === "__HYE_SYNC__") {
      loadWorkspaceFiles(userId)
    }
  }
  
  return () => ws.close()
}, [user, isGuest])

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
  const userId = user.id
  
  setStatus('saving...')
  try {
    for (let f of files) {
      await fetch(`${API}/workspace/${userId}/save`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({path: f.path, content: f.content})
      })
    }
    setStatus('saved')
    setDirty(false)
    setTimeout(() => setStatus('ready'), 2000)
  } catch (e) {
    setErrorMsg('Save failed: ' + e.message)
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
// Add this with your other functions - NOT inside useEffect
const loadWorkspaceFiles = async (userId) => {
  try {
    const res = await fetch(`${API}/workspace/${userId}/files`)
    const data = await res.json()
    
    const loadedFiles = await Promise.all(
      data.files.map(async (f, idx) => {
        const contentRes = await fetch(`${API}/workspace/${userId}/file?path=${f.path}`)
        const contentData = await contentRes.json()
        return {
          id: Date.now() + idx,
          name: f.name,
          path: f.path,
          content: contentData.content,
          lang: f.name.split('.').pop() === 'jsx'? 'javascript' : 'plaintext'
        }
      })
    )
    
    if (loadedFiles.length > 0) {
      setFiles(loadedFiles)
      setActiveId(loadedFiles[0].id)
      setStatus('synced with terminal')
    }
  } catch (e) {
    console.log('Sync failed:', e)
  }
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
              className="tree-item"
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              {open? <ChevronDown className="tree-icon" /> : <ChevronRight className="tree-icon" />}
              {open? <FolderOpen className="tree-icon" style={{color: '#58a6ff'}} /> : <Folder className="tree-icon" style={{color: '#58a6ff'}} />}
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
            className={`tree-item ${item.id === activeId? 'active' : ''}`}
            style={{ paddingLeft: `${depth * 12 + 24}px` }}
          >
            <span style={{fontSize: '11px'}}>{icon}</span>
            <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis'}}>{name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); deleteFile(item.id) }}
              className="delete-btn"
            >
              <X style={{width: '12px', height: '12px'}} />
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
      <script type="importmap">
        {"imports": {"react": "https://esm.sh/react@18", "react-dom": "https://esm.sh/react-dom@18/client"}}
      </script>
    </head>
    <body style="margin:0; background:#000;">
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

  const tree = buildTree()
  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))

  if (authLoading) {
    return <div className="loading">Loading...</div>
  }

  if (!user &&!isGuest) {
    return (
      <div className="login">
        <div className="login-box">
          <div className="login-header">
            <Code2 style={{width: '24px', height: '24px', color: '#58a6ff'}} />
            <h1>HYE Editor</h1>
          </div>
          {errorMsg && (
            <div className="error-bar" style={{marginBottom: '16px', borderRadius: '6px', border: '1px solid #f85149'}}>
              <AlertCircle style={{width: '16px', height: '16px', flexShrink: 0}} />
              <span>{errorMsg}</span>
            </div>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input"
          />
          <button onClick={handleLogin} className="btn btn-primary">
            Login
          </button>
          <button onClick={handleSignup} className="btn">
            Sign Up
          </button>
          <button onClick={handleGuest} className="btn" style={{background: '#238636', borderColor: '#238636'}}>
            Continue as Guest
          </button>
          <p className="login-text">Guest mode saves locally only</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <button onClick={() => setSidebar(!sidebar)} className="btn btn-icon">
            <Menu style={{width: '20px', height: '20px'}} />
          </button>
          <div className="logo">
            <Code2 style={{width: '20px', height: '20px'}} />
            <span>HYE</span>
          </div>
          <div className="badge">
            {online? <Wifi style={{width: '14px', height: '14px'}} /> : <WifiOff style={{width: '14px', height: '14px'}} />}
            <span>local</span>
          </div>
          <span className="status-text">{status}</span>
        </div>

        <div className="header-right">
          <div className="search-wrap">
            <Search className="search-icon" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search files..."
              className="input"
            />
          </div>

          <button onClick={() => setView(view === 'code'? 'preview' : 'code')} className="btn">
            {view === 'code'? <><Eye style={{width: '16px', height: '16px'}} /> Preview</> : <><Code2 style={{width: '16px', height: '16px'}} /> Code</>}
          </button>

          <div className="menu-wrap">
            <button onClick={() => setMenu(!menu)} className="btn btn-icon">
              <Settings style={{width: '20px', height: '20px'}} />
            </button>

            {menu && (
              <>
                <div className="menu-overlay" onClick={() => setMenu(false)} />
                <div className="menu-dropdown">
                  <div className="menu-section" style={{display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #30363d', paddingBottom: '8px', marginBottom: '4px'}}>
                    <User style={{width: '12px', height: '12px'}} /> {user?.email || 'Guest'}
                  </div>

                                    <div className="menu-section">FIX TOOLS</div>
                  
                  <button onClick={handleLocalFix} disabled={fixing} className="menu-item">
                    <Zap style={{width: '16px', height: '16px', color: '#f0b90b'}} /> Local Fix
                  </button>
                  
                  <button onClick={handleOnlineFix} disabled={fixing} className="menu-item">
                    <Wifi style={{width: '16px', height: '16px', color: '#3fb950'}} /> Online Fix
                  </button>
                  
                  <button onClick={handleAiFix} disabled={fixing} className="menu-item">
                    <Wand2 style={{width: '16px', height: '16px', color: '#a371f7'}} /> AI Fix
                  </button>
                  
                  <button onClick={() => { setAiOpen(true); setMenu(false) }} className="menu-item">
                    <Sparkles style={{width: '16px', height: '16px', color: '#58a6ff'}} /> AI Build
                  </button>
                  
                  <div className="menu-divider"></div>
                  <div className="menu-section">FILES</div>
                  <button onClick={newFile} className="menu-item">
                    <FilePlus style={{width: '16px', height: '16px'}} /> New File
                  </button>
                  <button onClick={newFolder} className="menu-item">
                    <FolderPlus style={{width: '16px', height: '16px'}} /> New Folder
                  </button>

                  <div className="menu-divider"></div>
                  <div className="menu-section">HYE ECOSYSTEM</div>
                  <button onClick={openTerminal} className="menu-item">
                    <Terminal style={{width: '16px', height: '16px', color: '#3fb950'}} /> HYE Terminal
                  </button>
                  <button onClick={openMarketplace} className="menu-item">
                    <Store style={{width: '16px', height: '16px', color: '#a371f7'}} /> HYE Marketplace
                  </button>

                  <div className="menu-divider"></div>
                  <div className="menu-section">EXPORT</div>
                  <button onClick={exportProject} className="menu-item">
                    <Download style={{width: '16px', height: '16px'}} /> Export Project
                  </button>

                  <div className="menu-divider"></div>
                  <div className="menu-section">ACCOUNT</div>
                  <button onClick={handleLogout} className="menu-item" style={{color: '#f85149'}}>
                    <LogOut style={{width: '16px', height: '16px'}} /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {errorMsg && (
        <div className="error-bar">
          <AlertCircle style={{width: '16px', height: '16px'}} />
          <span style={{flex: 1}}>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="btn btn-icon" style={{border: 'none', padding: '2px'}}>
            <X style={{width: '12px', height: '12px'}} />
          </button>
        </div>
      )}

      {fixMethod && (
        <div className="fix-bar">
          <Zap style={{width: '16px', height: '16px'}} />
          <span>{fixMethod}</span>
        </div>
      )}

      <div className="main-wrap">
        {sidebar && (
          <aside className="sidebar">
            <div className="sidebar-header">
              <span>EXPLORER</span>
              <div className="sidebar-actions">
                <button onClick={newFile} className="btn btn-icon">
                  <FilePlus style={{width: '16px', height: '16px'}} />
                </button>
                <button onClick={newFolder} className="btn btn-icon">
                  <FolderPlus style={{width: '16px', height: '16px'}} />
                </button>
              </div>
            </div>
            <div className="sidebar-content">
              {renderTree(tree)}
            </div>
          </aside>
        )}

        <div className="editor-wrap">
          <div className="tabs">
            {files.map(f => (
              <div
                key={f.id}
                onClick={() => setActiveId(f.id)}
                className={`tab ${f.id === activeId? 'active' : ''}`}
              >
                <span>{f.name}</span>
                <button onClick={(e) => { e.stopPropagation(); deleteFile(f.id) }} className="btn btn-icon" style={{border: 'none', padding: '2px', width: '16px', height: '16px'}}>
                  <X style={{width: '12px', height: '12px'}} />
                </button>
              </div>
            ))}
          </div>

          <div className="editor-area">
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
                loading={<div style={{padding: '16px', color: '#7d8590'}}>Loading editor...</div>}
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
                className="preview-frame"
                sandbox="allow-scripts allow-same-origin"
              />
            )}
          </div>
        </div>
      </div>

      {aiOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <Sparkles style={{width: '20px', height: '20px', color: '#58a6ff'}} />
              <h3>AI Builder</h3>
            </div>
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="Describe what you want to build... e.g. 'todo app with localStorage' or 'login form with validation'"
            />
            <div className="modal-actions">
              <button
                onClick={aiBuild}
                disabled={aiLoading}
                className="btn btn-primary"
                style={{flex: 1}}
              >
                {aiLoading? 'Building...' : 'Generate'}
              </button>
              <button onClick={() => setAiOpen(false)} className="btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
