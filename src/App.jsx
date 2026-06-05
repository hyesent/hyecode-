import { useState, useRef, useEffect } from 'react'
import { Editor } from '@monaco-editor/react'
import { Search, Wand2, FileCode, Shield, Plus, X, MoreVertical, Download, Trash2, Eye, Code2, Sparkles, FolderPlus, Package, Edit, LogOut, User, Wifi, WifiOff, Copy, ChevronRight, ChevronDown, Folder, FolderOpen, Save, Check } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import * as prettier from 'prettier/standalone'
import * as parserBabel from 'prettier/plugins/babel'
import * as prettierPluginEstree from 'prettier/plugins/estree'
import * as parserPostcss from 'prettier/plugins/postcss'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)



export default function App() {
  const [user, setUser] = useState(null)
  const [isGuest, setIsGuest] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)

  const [projects, setProjects] = useState([])
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [activeFileId, setActiveFileId] = useState(null)
  const [view, setView] = useState('code')
  const [searchTerm, setSearchTerm] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [showExplorer, setShowExplorer] = useState(false)
  const [showAIInput, setShowAIInput] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [contextMenu, setContextMenu] = useState(null)
  const [fixing, setFixing] = useState(false)
  const [fixMethod, setFixMethod] = useState('')
  const [expandedFolders, setExpandedFolders] = useState({})

  const [isDirty, setIsDirty] = useState(false)
  const [saveStatus, setSaveStatus] = useState('saved')
  const [showClosePrompt, setShowClosePrompt] = useState(false)
  const [pendingCloseFileId, setPendingCloseFileId] = useState(null)

  const pressTimer = useRef(null)
  const editorRef = useRef(null)
  const saveTimerRef = useRef(null)
  const activeProject = projects.find(p => p.id === activeProjectId)
  const activeFile = activeProject?.files.find(f => f.id === activeFileId)

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({data: {session}}) => {
      setUser(session?.user?? null)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user?? null)
    })
  }, [])

  useEffect(() => {
    if (user &&!isGuest) loadFromCloud()
    else loadFromLocal()
  }, [user, isGuest])

  const loadFromLocal = () => {
    const saved = localStorage.getItem('hyecode_projects_guest')
    if (saved) {
      const data = JSON.parse(saved)
      setProjects(data)
      if (data.length > 0) {
        setActiveProjectId(data[0].id)
        setActiveFileId(data[0].files[0].id)
      }
    } else {
      createDefaultProject()
    }
  }

  const loadFromCloud = async () => {
    const {data: projData} = await supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', {ascending: true})
    const {data: fileData} = await supabase.from('files').select('*').eq('user_id', user.id).order('created_at', {ascending: true})

    if (projData && projData.length > 0) {
      const merged = projData.map(p => ({
      ...p,
        files: fileData.filter(f => f.project_id === p.id)
      }))
      setProjects(merged)
      setActiveProjectId(merged[0].id)
      setActiveFileId(merged[0].files[0].id)
      setSaveStatus('saved')
    } else {
      createDefaultProject(true)
    }
  }

  const saveToStorage = async (newProjects) => {
    setProjects(newProjects)
    localStorage.setItem('hyecode_projects_guest', JSON.stringify(newProjects))

    if (user && online &&!isGuest) {
      setSaveStatus('saving')
      try {
        for (let p of newProjects) {
          await supabase.from('projects').upsert({...p, user_id: user.id})
          for (let f of p.files) {
            await supabase.from('files').upsert({...f, user_id: user.id, project_id: p.id})
          }
        }
        setSaveStatus('saved')
        setIsDirty(false)
      } catch (e) {
        setSaveStatus('unsaved')
      }
    }
  }

  const createDefaultProject = async (toCloud = false) => {
    const newId = Date.now()
    const defaultProj = {
      id: newId,
      name: 'My First Project',
      files: [{
        id: Date.now() + 1,
        name: 'App.jsx',
        code: `export default function App() {\n return <div className="p-10 text-center text-2xl text-white">Hello HyecodeEditor 🚀</div>\n}`,
        created: Date.now(),
        modified: Date.now()
      }],
      created: Date.now()
    }
    saveToStorage([defaultProj])
    setActiveProjectId(newId)
    setActiveFileId(defaultProj.files[0].id)
  }

  const handleLogin = async () => {
    setLoading(true)
    const {error} = await supabase.auth.signInWithPassword({email, password})
    if (error) alert(error.message)
    setLoading(false)
  }

  const handleSignup = async () => {
    setLoading(true)
    const {error} = await supabase.auth.signUp({email, password})
    if (error) alert(error.message)
    setLoading(false)
  }

  const handleGuestLogin = () => {
    setIsGuest(true)
    setUser({email: 'Guest User'})
  }

  const handleLogout = async () => {
    if (!isGuest) await supabase.auth.signOut()
    setProjects([])
    setActiveProjectId(null)
    setActiveFileId(null)
    setShowMenu(false)
    setUser(null)
    setIsGuest(false)
  }

  function handleEditorDidMount(editor) {
    editorRef.current = editor
  }

  const selectAll = () => {
    editorRef.current?.getAction('editor.action.selectAll').run()
    setShowMenu(false)
  }

  const formatCode = async () => {
    if (!activeFile) return
    setShowMenu(false)
    try {
      const isCss = activeFile.name.endsWith('.css')
      const formatted = await prettier.format(activeFile.code, {
        parser: isCss? 'css' : 'babel',
        plugins: isCss? [parserPostcss] : [parserBabel, prettierPluginEstree],
        semi: true,
        singleQuote: true,
        tabWidth: 2,
        trailingComma: 'es5'
      })
      updateCode(formatted)
      setFixMethod('✨ Formatted')
      setTimeout(() => setFixMethod(''), 2000)
    } catch (e) {
      alert('Format error: ' + e.message)
    }
  }

  const updateCode = (newCode) => {
    const newProjects = projects.map(p =>
      p.id === activeProjectId? {
      ...p,
        files: p.files.map(f => f.id === activeFileId? {...f, code: newCode, modified: Date.now()} : f)
      } : p
    )
    setProjects(newProjects)
    setIsDirty(true)
    setSaveStatus('unsaved')

    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveToStorage(newProjects)
    }, 2000)

    localStorage.setItem('hyecode_projects_guest', JSON.stringify(newProjects))
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    if (editorRef.current && e.target.value) {
      editorRef.current.getAction('actions.find').run()
    }
  }

  const createNewProject = () => {
    if (!newProjectName.trim()) return
    const newId = Date.now()
    const newProject = {
      id: newId,
      name: newProjectName,
      files: [{
        id: Date.now() + 1,
        name: 'App.jsx',
        code: `export default function App() {\n return <div className="p-10 text-white">New Project</div>\n}`,
        created: Date.now(),
        modified: Date.now()
      }],
      created: Date.now()
    }
    const newProjects = [...projects, newProject]
    saveToStorage(newProjects)
    setActiveProjectId(newId)
    setActiveFileId(newProject.files[0].id)
    setShowNewProject(false)
    setNewProjectName('')
    setShowMenu(false)
    setView('code')
  }

  const createNewFile = (name = `file${activeProject?.files.length + 1}.jsx`, code = `export default function File() {\n return <div className="text-white">New</div>\n}`) => {
    if (!activeProject) return alert('Create a project first')
    const newId = Date.now()
    const newFile = { id: newId, name, code, created: Date.now(), modified: Date.now() }
    const newProjects = projects.map(p =>
      p.id === activeProjectId? {...p, files: [...p.files, newFile]} : p
    )
    saveToStorage(newProjects)
    setActiveFileId(newId)
    setShowMenu(false)
    setShowExplorer(false)
  }

  const createNewFolder = () => {
    const folderName = prompt('Folder name?')
    if (folderName) createNewFile(`${folderName}/index.jsx`, `// ${folderName} folder\n`)
  }

  const renameFile = (id) => {
    const newName = prompt('New file name:')
    if (newName) {
      const newProjects = projects.map(p =>
        p.id === activeProjectId? {
        ...p,
          files: p.files.map(f => f.id === id? {...f, name: newName} : f)
        } : p
      )
      saveToStorage(newProjects)
    }
    setContextMenu(null)
  }

  const handleCloseFile = (id) => {
    if (isDirty && id === activeFileId) {
      setPendingCloseFileId(id)
      setShowClosePrompt(true)
    } else {
      deleteFile(id)
    }
  }

  const deleteFile = (id) => {
    if (activeProject.files.length === 1) return alert('Cannot delete last file')
    const newFiles = activeProject.files.filter(f => f.id!== id)
    const newProjects = projects.map(p => p.id === activeProjectId? {...p, files: newFiles} : p)
    saveToStorage(newProjects)
    if (id === activeFileId) setActiveFileId(newFiles[0].id)
    setContextMenu(null)
    setShowClosePrompt(false)
    setPendingCloseFileId(null)
  }

  const handlePressStart = (fileId, e) => {
    pressTimer.current = setTimeout(() => {
      setContextMenu({
        fileId,
        x: e.clientX || e.touches[0].clientX,
        y: e.clientY || e.touches[0].clientY
      })
    }, 500)
  }

  const handlePressEnd = () => {
    clearTimeout(pressTimer.current)
  }

  const parseAIResponseToFiles = (aiResponse) => {
    const fileRegex = /FILE:\s*(.+?)\n```(?:\w+)?\n([\s\S]*?)```/g
    const files = []
    let match

    while ((match = fileRegex.exec(aiResponse))!== null) {
      const filePath = match[1].trim()
      const code = match[2].trim()
      const fileName = filePath.split('/').pop()

      files.push({
        id: Date.now() + Math.random(),
        name: fileName,
        path: filePath,
        code: code || `// ${fileName} - TODO`,
        language: fileName.split('.').pop(),
        created: Date.now(),
        modified: Date.now()
      })
    }
    return files
  }

  // HYECODE FIX 2: This already correct - calls /api/ai
  const handleAIBuild = async () => {
    if (!aiPrompt.trim()) return
    setFixing(true)
    setFixMethod('🤖 AI Building...')

    try {
      const systemInstructions = `
You are Hyecode AI. Respond with files in this EXACT format:

FILE: src/App.jsx
\`\`\`jsx
// code here
\`\`\`

FILE: src/index.css
\`\`\`css
/* code here */
\`\`\`

RULES: Start every file with FILE: path/name.ext. Wrap code in \`\`\` blocks.
`
      const finalPrompt = `${systemInstructions}\n\nUser request: ${aiPrompt}`

      const res = await fetch('/api/ai', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalPrompt })
      })

      // HYECODE FIX 3: Add error check before.json()
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Backend error ${res.status}: ${errText}`)
      }

      const data = await res.json()
      const aiText = Array.isArray(data)? data[0]?.generated_text : data.generated_text || ""
      const newFiles = parseAIResponseToFiles(aiText)

      if (newFiles.length > 0) {
        const newProjects = projects.map(p =>
          p.id === activeProjectId? {...p, files: [...p.files,...newFiles]} : p
        )
        saveToStorage(newProjects)
        setActiveFileId(newFiles[0].id)
        setFixMethod(`🤖 Created ${newFiles.length} files`)
      } else {
        updateCode(aiText)
        setFixMethod('🤖 AI Generated')
      }
    } catch (e) {
      console.error('AI Build Error:', e)
      alert(`AI Build failed: ${e.message}`)
      setFixMethod('❌ AI Failed')
    }

    setShowAIInput(false)
    setAiPrompt('')
    setFixing(false)
    setTimeout(() => setFixMethod(''), 3000)
  }

  const localFix = (codeText) => {
    let fixed = codeText
    const openBraces = (fixed.match(/{/g) || []).length
    const closeBraces = (fixed.match(/}/g) || []).length
    if (openBraces > closeBraces) fixed += '}'.repeat(openBraces - closeBraces)
    fixed = fixed.replace(/([^;\s])\s*\n\s*([a-zA-Z_$])/g, '$1;\n$2')
    return fixed
  }

  const offlineLocalFix = (codeText) => {
    let fixed = codeText
    fixed = fixed.replace(/([^;\n])\n(\s*[}\]])/g, '$1;\n$2')
    fixed = fixed.replace(/==([^=])/g, '===$1')
    fixed = fixed.replace(/!=([^=])/g, '!==$1')
    const quotes = (fixed.match(/"/g) || []).length
    if (quotes % 2!== 0) fixed += '"'
    const singleQuotes = (fixed.match(/'/g) || []).length
    if (singleQuotes % 2!== 0) fixed += "'"
    const backticks = (fixed.match(/`/g) || []).length
    if (backticks % 2!== 0) fixed += "`"
    fixed = fixed.replace(/useEffect\(\(\) => {([^}]+)},\s*\[\]\)/g, 'useEffect(() => {$1}, [])')
    return fixed
  }

  // HYECODE FIX 4: Remove HF_TOKEN. Call backend instead
  const huggingFaceFix = async (codeText) => {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `Fix all syntax errors and ESLint issues. Return only corrected code, no explanations:\n\n${codeText}`
      })
    })
    if (!response.ok) return codeText
    const result = await response.json()
    const text = result[0]?.generated_text || result.generated_text || codeText
    return text.replace(/.*```(?:jsx|javascript)?\n?([\s\S]*?)```.*/s, '$1').trim() || codeText
  }

  const handleFixAll = async () => {
    if (!activeFile) return
    setFixing(true)
    setShowMenu(false)
    let fixedCode = activeFile.code

    fixedCode = localFix(fixedCode)
    setFixMethod('⚡ Local Fix')
    await new Promise(r => setTimeout(r, 300))

    fixedCode = offlineLocalFix(fixedCode)
    setFixMethod('💻 Offline Fix')
    await new Promise(r => setTimeout(r, 300))

    try {
      const isCss = activeFile.name.endsWith('.css')
      fixedCode = await prettier.format(fixedCode, {
        parser: isCss? 'css' : 'babel',
        plugins: isCss? [parserPostcss] : [parserBabel, prettierPluginEstree],
        semi: true,
        singleQuote: true,
        tabWidth: 2
      })
      setFixMethod('✨ Formatted')
    } catch {}

    // HYECODE FIX 5: Remove token check. Always try backend if online
    if (online) {
      try {
        setFixMethod('🤖 AI Fixing...')
        fixedCode = await huggingFaceFix(fixedCode)
        setFixMethod('🤖 AI Fixed')
      } catch {
        setFixMethod('💻 Offline Fix Complete')
      }
    }

    updateCode(fixedCode)
    setFixing(false)
    setTimeout(() => setFixMethod(''), 3000)
  }

  const exportPWA = () => {
    alert('PWA Export: Run vite build, then Chrome shows "Install" button. Creates APK-like app!')
    setShowMenu(false)
  }

  const clearAllData = () => {
    if (confirm('⚠️ Delete ALL projects permanently?')) {
      localStorage.clear()
      window.location.reload()
    }
    setShowMenu(false)
  }

  const exportBackup = () => {
    const dataStr = JSON.stringify(projects, null, 2)
    const blob = new Blob([dataStr], {type: 'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'hyecode_backup.json'
    a.click()
    setShowMenu(false)
  }

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({...prev, [path]:!prev[path]}))
  }

  const buildFileTree = (files) => {
    const tree = {}
    files.forEach(file => {
      const path = file.path || file.name
      const parts = path.split('/')
      let current = tree
      parts.forEach((part, i) => {
        if (i === parts.length - 1) {
          current[part] = {...file, isFile: true }
        } else {
          if (!current[part]) current[part] = { isFolder: true, children: {} }
          current = current[part].children
        }
      })
    })
    return tree
  }

  const renderTree = (node, path = '', depth = 0) => {
    return Object.entries(node).map(([name, item]) => {
      const fullPath = path? `${path}/${name}` : name
      if (item.isFolder) {
        const isOpen = expandedFolders[fullPath]!== false
        return (
          <div key={fullPath}>
            <div
              onClick={() => toggleFolder(fullPath)}
              className="flex items-center gap-1 px-2 py-1 hover:bg-gray-800 cursor-pointer text-sm text-gray-300"
              style={{paddingLeft: `${depth * 12 + 8}px`}}
            >
              {isOpen? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {isOpen? <FolderOpen className="w-4 h-4 text-blue-400" /> : <Folder className="w-4 h-4 text-blue-400" />}
              <span>{name}</span>
            </div>
            {isOpen && renderTree(item.children, fullPath, depth + 1)}
          </div>
        )
      } else {
        const getFileIcon = (fileName) => {
          if (fileName.endsWith('.jsx') || fileName.endsWith('.tsx')) return '⚛️'
          if (fileName.endsWith('.css')) return '🎨'
          if (fileName.endsWith('.json')) return '{}'
          if (fileName.endsWith('.html')) return '🌐'
          if (fileName.endsWith('.js')) return '📜'
          return '📄'
        }
        return (
          <div
            key={item.id}
            onClick={() => {setActiveFileId(item.id); setShowExplorer(false)}}
            className={`flex items-center gap-2 px-2 py-1 cursor-pointer text-sm ${
              item.id === activeFileId? 'bg-[#37373d] text-white' : 'text-gray-400 hover:bg-[#2a2d2e] hover:text-white'
            }`}
            style={{paddingLeft: `${depth * 12 + 24}px`}}
          >
            <span className="text-xs">{getFileIcon(name)}</span>
            <span className="truncate">{name}</span>
          </div>
        )
      }
    })
  }

  const previewHTML = `
    <!DOCTYPE html>
    <html>
    <head><script src="https://cdn.tailwindcss.com"></script></head>
    <body class="bg-gray-950">
      <div id="root"></div>
      <script type="module">
        import React from 'https://esm.sh/react@18'
        import { createRoot } from 'https://esm.sh/react-dom@18/client'
        ${activeFile?.code || ''}
        createRoot(document.getElementById('root')).render(React.createElement(App))
      </script>
    </body>
    </html>
  `

  if (!user) {
    return (
      <div className="h-screen w-screen bg-gray-950 text-white flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-gray-900 border-gray-700 rounded-lg p-8 w-full max-w-sm">
            <div className="flex items-center gap-2 mb-6 justify-center">
              <FileCode className="w-6 h-6 text-blue-500" />
              <h1 className="text-2xl font-bold">HyecodeEditor</h1>
            </div>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-800 border-gray-700 rounded p-3 mb-3 text-sm focus:outline-none focus:border-blue-500" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-800 border-gray-700 rounded p-3 mb-4 text-sm focus:outline-none focus:border-blue-500" />
            <button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded mb-2 text-sm font-medium disabled:opacity-50">Login</button>
            <button onClick={handleSignup} disabled={loading} className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded mb-2 text-sm font-medium disabled:opacity-50">Sign Up</button>
            <button onClick={handleGuestLogin} className="w-full bg-green-600 hover:bg-green-700 py-2 rounded text-sm font-medium">Continue as Guest</button>
            <p className="text-xs text-gray-500 mt-4 text-center">Guest saves to device only</p>
          </div>
        </div>
        <div className="border-t border-gray-800 px-4 py-2 text-xs text-gray-500 flex items-center justify-center shrink-0">
          <span>© 2026 hyesent.dev</span>
        </div>
      </div>
    )
  }

  const fileTree = activeProject? buildFileTree(activeProject.files) : {}

  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex-col overflow-hidden">
      <div className="p-3 border-b border-gray-800 flex items-center justify-between shrink-0 relative z-20 bg-gray-950">
        <div className="flex items-center gap-2">
          <FileCode className="w-5 h-5 text-blue-500" />
          <button
            onClick={() => setShowExplorer(!showExplorer)}
            className="flex items-center gap-2 hover:bg-gray-800 px-2 py-1 rounded"
          >
            <h1 className="text-lg font-bold">{activeProject?.name}</h1>
            <ChevronDown className={`w-4 h-4 transition-transform ${showExplorer? 'rotate-180' : ''}`} />
          </button>
          {online? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
          {saveStatus === 'saving' && <span className="text-xs text-yellow-400 flex items-center gap-1"><Save className="w-3 h-3 animate-spin" />Saving...</span>}
          {saveStatus === 'saved' &&!isDirty && <span className="text-xs text-green-400 flex items-center gap-1"><Check className="w-3 h-3" />Saved</span>}
          {saveStatus === 'unsaved' && <span className="text-xs text-orange-400">● Unsaved</span>}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearch}
              className="bg-gray-900 border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-sm w-32 sm:w-40 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="bg-gray-800 hover:bg-gray-700 p-1.5 rounded-lg">
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                <div className="absolute right-0 top-10 bg-gray-900 border-gray-700 rounded-lg shadow-xl py-2 w-64 z-30 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 text-xs text-gray-400 font-bold border-b border-gray-700 mb-1 flex items-center gap-2">
                    <User className="w-3 h-3" /> {user.email}
                  </div>
                  <button onClick={() => {setView(view === 'code'? 'preview' : 'code'); setShowMenu(false)}} className="w-full px-4 py-2 hover:bg-gray-800 text-left text-sm flex items-center gap-2">
                    {view === 'code'? <Eye className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
                    {view === 'code'? 'Preview' : 'Code'}
                  </button>
                  <button onClick={formatCode} className="w-full px-4 py-2 hover:bg-gray-800 text-left text-sm flex items-center gap-2 text-purple-400">
                    <Sparkles className="w-4 h-4" /> Format Code
                  </button>
                  <button onClick={handleFixAll} disabled={fixing} className="w-full px-4 py-2 hover:bg-gray-800 text-left text-sm flex items-center gap-2 text-blue-400 disabled:opacity-50">
                    <Wand2 className="w-4 h-4" /> {fixing? 'Fixing...' : 'Fix All'}
                  </button>
                  <div className="border-t border-gray-700 my-1"></div>
                  <div className="px-4 py-2 text-xs text-gray-400 font-bold">PROJECTS</div>
                  {projects.map(p => (
                    <button key={p.id} onClick={() => {setActiveProjectId(p.id); setActiveFileId(p.files[0].id); setShowMenu(false); setView('code')}} className={`w-full px-4 py-1.5 hover:bg-gray-800 text-left text-sm ${p.id === activeProjectId? 'bg-gray-800 text-blue-400' : ''}`}>
                      📁 {p.name}
                    </button>
                  ))}
                  <div className="border-t border-gray-700 my-1"></div>
                  <button onClick={() => {setShowNewProject(true); setShowMenu(false)}} className="w-full px-4 py-2 hover:bg-gray-800 text-left text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4" /> New Project
                  </button>
                  <button onClick={() => createNewFile()} className="w-full px-4 py-2 hover:bg-gray-800 text-left text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4" /> New File
                  </button>
                  <button onClick={createNewFolder} className="w-full px-4 py-2 hover:bg-gray-800 text-left text-sm flex items-center gap-2">
                    <FolderPlus className="w-4 h-4" /> New Folder
                  </button>
                  <div className="border-t border-gray-700 my-1"></div>
                  <button onClick={selectAll} className="w-full px-4 py-2 hover:bg-gray-800 text-left text-sm flex items-center gap-2">
                    <Copy className="w-4 h-4" /> Select All
                  </button>
                  <button onClick={() => {setShowAIInput(true); setShowMenu(false)}} className="w-full px-4 py-2 hover:bg-blue-900 text-left text-sm flex items-center gap-2 text-blue-400">
                    <Sparkles className="w-4 h-4" /> AI Build
                  </button>
                  <button onClick={exportPWA} className="w-full px-4 py-2 hover:bg-green-900 text-left text-sm flex items-center gap-2 text-green-400">
                    <Package className="w-4 h-4" /> Export PWA → APK/EXE
                  </button>
                  <div className="border-t border-gray-700 my-1"></div>
                  <button onClick={exportBackup} className="w-full px-4 py-2 hover:bg-gray-800 text-left text-sm flex items-center gap-2">
                    <Download className="w-4 h-4" /> Export Backup
                  </button>
                  <button onClick={clearAllData} className="w-full px-4 py-2 hover:bg-red-900 text-left text-sm flex items-center gap-2 text-red-400">
                    <Trash2 className="w-4 h-4" /> Clear All Data
                  </button>
                  <div className="border-t border-gray-700 my-1"></div>
                  <button onClick={handleLogout} className="w-full px-4 py-2 hover:bg-red-900 text-left text-sm flex items-center gap-2 text-red-400">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showExplorer && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowExplorer(false)}></div>
          <div className="absolute left-2 top-16 bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-80 max-h-96 z-30 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-gray-800 flex items-center justify-between bg-gray-950">
              <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                <FolderOpen className="w-4 h-4" /> EXPLORER
              </span>
              <div className="flex gap-1">
                                <button onClick={() => createNewFile()} className="p-1 hover:bg-gray-800 rounded">
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button onClick={createNewFolder} className="p-1 hover:bg-gray-800 rounded">
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setShowExplorer(false)} className="p-1 hover:bg-gray-800 rounded">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="px-3 py-2 text-xs text-gray-500 font-bold border-b border-gray-800">
              {activeProject?.name.toUpperCase()}
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {renderTree(fileTree)}
            </div>
          </div>
        </>
      )}

      {showNewProject && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border-gray-700 rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-3">New Project</h3>
            <input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="Project name..." className="w-full bg-gray-800 border-gray-700 rounded p-2 text-sm mb-3 focus:outline-none focus:border-blue-500" />
            <div className="flex gap-2">
              <button onClick={createNewProject} className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded text-sm font-medium">Create</button>
              <button onClick={() => setShowNewProject(false)} className="px-4 bg-gray-700 hover:bg-gray-600 py-2 rounded text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showAIInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border-gray-700 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" /> AI Build
            </h3>
            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Build me login form + CSS... or 'create react vite boilerplate'" className="w-full h-32 bg-gray-800 border-gray-700 rounded p-3 text-sm resize-none focus:outline-none focus:border-blue-500" />
            <div className="flex gap-2 mt-3">
              <button onClick={handleAIBuild} className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded text-sm font-medium">Generate</button>
              <button onClick={() => setShowAIInput(false)} className="px-4 bg-gray-700 hover:bg-gray-600 py-2 rounded text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showClosePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border-gray-700 rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Save className="w-5 h-5 text-yellow-400" /> Unsaved Changes
            </h3>
            <p className="text-sm text-gray-300 mb-4">Do you want to save changes to {activeProject?.files.find(f => f.id === pendingCloseFileId)?.name}?</p>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  saveToStorage(projects)
                  deleteFile(pendingCloseFileId)
                }} 
                className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded text-sm font-medium"
              >
                Save
              </button>
              <button 
                onClick={() => deleteFile(pendingCloseFileId)} 
                className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded text-sm font-medium"
              >
                Don't Save
              </button>
              <button 
                onClick={() => {setShowClosePrompt(false); setPendingCloseFileId(null)}} 
                className="px-4 bg-gray-700 hover:bg-gray-600 py-2 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {fixMethod && (
        <div className="bg-green-950 border-b border-green-900 px-4 py-1.5 text-xs flex items-center gap-2 shrink-0">
          <Shield className="w-3 h-3 text-green-400" />
          <span className="text-green-400">{fixMethod}</span>
        </div>
      )}

      {view === 'code' && (
        <div className="bg-gray-900 border-b border-gray-800 flex items-center overflow-x-auto shrink-0">
          {activeProject?.files.map(file => (
            <div
              key={file.id}
              onClick={() => setActiveFileId(file.id)}
              onMouseDown={(e) => handlePressStart(file.id, e)}
              onMouseUp={handlePressEnd}
              onMouseLeave={handlePressEnd}
              onTouchStart={(e) => handlePressStart(file.id, e)}
              onTouchEnd={handlePressEnd}
              className={`group flex items-center gap-2 px-4 py-2 cursor-pointer border-r border-gray-800 text-sm whitespace-nowrap select-none ${
                file.id === activeFileId? 'bg-gray-950 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
              }`}
            >
              <span>{file.name}</span>
              <button onClick={(e) => {e.stopPropagation(); handleCloseFile(file.id)}} className="ml-1 opacity-0 group-hover:opacity-100 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {contextMenu && (
        <div className="fixed bg-gray-800 border-gray-700 rounded-lg shadow-xl py-1 z-50" style={{left: contextMenu.x, top: contextMenu.y}} onClick={() => setContextMenu(null)}>
          <button onClick={() => renameFile(contextMenu.fileId)} className="w-full px-4 py-2 hover:bg-gray-700 text-left text-sm flex items-center gap-2">
            <Edit className="w-3 h-3" /> Rename
          </button>
          <button onClick={() => handleCloseFile(contextMenu.fileId)} className="w-full px-4 py-2 hover:bg-red-900 text-left text-sm flex items-center gap-2 text-red-400">
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-hidden">
        {view === 'code'? (
          <div className="h-full w-full border-4 border-black-500">
            <Editor
              height="calc(100vh - 180px)"
              width="100%"
              path={activeFile?.name}
              language={activeFile?.name.endsWith('.css')? 'css' : activeFile?.name.endsWith('.html')? 'html' : activeFile?.name.endsWith('.json')? 'json' : 'javascript'}
              value={activeFile?.code || ''}
              onChange={updateCode}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                wordWrap: 'on'
              }}
            />
          </div>
        ) : (
          <iframe srcDoc={previewHTML} className="w-full h-full bg-white" sandbox="allow-scripts" />
        )}
      </div>
    </div>
  )
}