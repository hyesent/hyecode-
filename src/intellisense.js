/* Lightweight, offline IntelliSense for Hyecode's Monaco editor.
 * This is intentionally dependency-free: it indexes source text already loaded in the workspace.
 * It is not a TypeScript compiler or a substitute for a language server.
 */
const SUPPORTED = ['javascript', 'typescript', 'html', 'css', 'scss', 'json', 'python']

const escapeRegExp = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const normalizePath = value => String(value || '').replace(/\\/g, '/').replace(/\/+/g, '/').replace(/\/$/, '')
const basename = value => normalizePath(value).split('/').pop() || value
const isCodeFile = file => file?.type === 'file' && typeof file.content === 'string'
const languageForName = name => {
  const ext = String(name || '').toLowerCase().split('.').pop()
  if (['ts', 'tsx', 'mts', 'cts'].includes(ext)) return 'typescript'
  if (['html', 'htm'].includes(ext)) return 'html'
  if (['css'].includes(ext)) return 'css'
  if (['scss', 'sass'].includes(ext)) return 'scss'
  if (['json', 'jsonc'].includes(ext)) return 'json'
  if (['py', 'pyw'].includes(ext)) return 'python'
  return 'javascript'
}

function getSymbols(content = '', language = 'javascript') {
  const text = String(content)
  const found = new Map()
  const add = (name, kind, line, detail = '') => {
    if (!name || !/^[\w$]+$/.test(name) || found.has(name)) return
    found.set(name, { name, kind, line, detail })
  }
  const patterns = [
    [/\b(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([\w$]+)/g, 'Function'],
    [/\b(?:export\s+)?(?:abstract\s+)?class\s+([\w$]+)/g, 'Class'],
    [/\b(?:export\s+)?(?:interface|type|enum)\s+([\w$]+)/g, 'Type'],
    [/\b(?:const|let|var)\s+([\w$]+)\s*(?::[^=;\n]+)?\s*=/g, 'Variable'],
    [/\b(?:const|let|var)\s*\{([^}]+)\}\s*=\s*require\(/g, 'Import'],
    [/\bimport\s+([\w$]+)\s+from\s+['"]/g, 'Import'],
    [/\bimport\s+\{([^}]+)\}\s+from\s+['"]/g, 'Import'],
    [/\bdef\s+([\w$]+)\s*\(/g, 'Function'],
    [/\b(?:async\s+)?function\s*\*?\s*([\w$]+)\s*\(/g, 'Function'],
    [/\b([\w$]+)\s*\([^()]*\)\s*\{/g, 'Function'],
  ]
  for (const [pattern, kind] of patterns) {
    let match
    while ((match = pattern.exec(text))) {
      const names = kind === 'Import' && match[1].includes(',') ? match[1].split(',').map(item => item.trim().split(/\s+as\s+/).pop()) : [match[1]]
      for (const name of names) {
        const clean = String(name).trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop().replace(/^\*\s+as\s+/, '')
        add(clean, kind, text.slice(0, match.index).split('\n').length, `${kind} · ${language}`)
      }
    }
  }
  // Include imported aliases and common CSS selectors as useful local symbols.
  if (['javascript', 'typescript'].includes(language)) {
    const re = /\bimport\s*\{([^}]+)\}\s*from\s*['"][^'"]+['"]/g
    let match
    while ((match = re.exec(text))) for (const part of match[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop()
      add(name, 'Import', text.slice(0, match.index).split('\n').length, 'Imported symbol')
    }
  }
  return [...found.values()]
}

function modelUriFor(monaco, file) {
  // Stable URI per workspace file so Monaco can navigate to indexed files.
  return monaco.Uri.parse(`file:///hyecode/${encodeURIComponent(String(file.id || file.path || file.name))}`)
}

function offsetAt(text, lineNumber, column) {
  const lines = text.split('\n')
  let offset = 0
  for (let i = 0; i < Math.max(0, lineNumber - 1); i++) offset += (lines[i] || '').length + 1
  return offset + Math.max(0, column - 1)
}

export function registerHyecodeIntelliSense(monaco, { getFiles, getActiveFile, setActiveFile }) {
  const disposables = []
  const push = disposable => { if (disposable?.dispose) disposables.push(disposable) }
  const completionKind = monaco.languages.CompletionItemKind
  const snippets = {
    javascript: [
      ['console.log', 'console.log($1);', 'Log a value'], ['function', 'function name($1) {\n  $0\n}', 'Function declaration'],
      ['arrow', 'const name = ($1) => {\n  $0\n};', 'Arrow function'], ['useState', 'const [value, setValue] = useState($1);', 'React state hook'],
      ['useEffect', 'useEffect(() => {\n  $0\n}, []);', 'React effect hook'], ['trycatch', 'try {\n  $0\n} catch (error) {\n  console.error(error);\n}', 'Try/catch block'],
      ['fetch', 'const response = await fetch(url);\nconst data = await response.json();', 'Fetch JSON'], ['map', 'items.map((item) => ($0));', 'Array map'],
      ['filter', 'items.filter((item) => $0);', 'Array filter'], ['async', 'async function name($1) {\n  $0\n}', 'Async function'],
    ],
    typescript: [['interface', 'interface Name {\n  $0\n}', 'TypeScript interface'], ['type', 'type Name = $0;', 'Type alias'], ['useState', 'const [value, setValue] = useState<$1>(initialValue);', 'Typed React state']],
    html: [['html5', '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>$1</title>\n</head>\n<body>\n  $0\n</body>\n</html>', 'HTML5 document'], ['meta viewport', '<meta name="viewport" content="width=device-width, initial-scale=1.0">', 'Responsive viewport']],
    css: [['flex-center', 'display: flex;\njustify-content: center;\nalign-items: center;', 'Center with flexbox'], ['grid', 'display: grid;\ngrid-template-columns: repeat(auto-fit, minmax(220px, 1fr));\ngap: 1rem;', 'Responsive grid']],
    scss: [['flex-center', 'display: flex;\njustify-content: center;\nalign-items: center;', 'Center with flexbox']],
    python: [['def', 'def function_name($1):\n    $0', 'Function definition'], ['main', 'if __name__ == "__main__":\n    $0', 'Python entry point'], ['tryexcept', 'try:\n    $0\nexcept Exception as error:\n    print(error)', 'Try/except']],
    json: [['object', '{\n  "$1": $0\n}', 'JSON object']],
  }

  const allFiles = () => (getFiles() || []).filter(isCodeFile)
  const fileForUri = uri => allFiles().find(file => modelUriFor(monaco, file).toString() === uri.toString())
  const sourceEntries = () => allFiles().map(file => ({ file, symbols: getSymbols(file.content, file.language || '') }))
  const wordAt = (model, position) => {
    const word = model.getWordAtPosition(position)
    return word ? { name: word.word, range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn) } : null
  }

  // Keep non-active workspace files available as Monaco models for cross-file navigation.
  const syncWorkspaceModels = () => {
    const active = getActiveFile()
    const keep = new Set()
    for (const file of allFiles()) {
      const uri = modelUriFor(monaco, file)
      keep.add(uri.toString())
      let model = monaco.editor.getModel(uri)
      if (!model) {
        try { model = monaco.editor.createModel(file.content || '', file.language || languageForName(file.name), uri) } catch { model = monaco.editor.getModel(uri) }
      } else if (file.id !== active?.id && model.getValue() !== (file.content || '')) {
        model.setValue(file.content || '')
      }
    }
    for (const model of monaco.editor.getModels()) {
      if (model.uri.path.startsWith('/hyecode/') && !keep.has(model.uri.toString())) model.dispose()
    }
  }
  syncWorkspaceModels()

  for (const language of SUPPORTED) {
    push(monaco.languages.registerCompletionItemProvider(language, {
      triggerCharacters: ['.', '/', '"', "'", '<', '@'],
      provideCompletionItems(model, position) {
        const word = model.getWordUntilPosition(position)
        const range = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn)
        const suggestions = (snippets[language] || []).map(([label, insertText, detail]) => ({
          label, kind: completionKind.Snippet, insertText, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail, range,
        }))
        const active = fileForUri(model.uri) || getActiveFile()
        const prefix = model.getValueInRange(new monaco.Range(position.lineNumber, 1, position.lineNumber, position.column))
        const currentWord = word.word || ''
        const isImportLine = /\b(?:from|import)\s*['"][^'"]*$/.test(prefix) || /<[^>]+\s(?:src|href)=['"][^'"]*$/.test(prefix)
        if (isImportLine) {
          for (const file of allFiles()) {
            if (file.id === active?.id) continue
            const label = basename(file.path || file.name)
            suggestions.push({ label, kind: completionKind.File, detail: `Workspace file · ${file.path || file.name}`, insertText: label, range, sortText: `0_${label}` })
          }
        }
        const seen = new Set()
        for (const entry of sourceEntries()) {
          for (const symbol of entry.symbols) {
            if (seen.has(symbol.name) || symbol.name === currentWord) continue
            seen.add(symbol.name)
            const isCurrent = entry.file.id === active?.id
            suggestions.push({
              label: symbol.name, kind: symbol.kind === 'Function' ? completionKind.Function : symbol.kind === 'Class' ? completionKind.Class : symbol.kind === 'Type' ? completionKind.Struct : completionKind.Variable,
              detail: `${symbol.detail || symbol.kind}${isCurrent ? ' · current file' : ` · ${entry.file.path || entry.file.name}`}`,
              insertText: symbol.name, range, sortText: `${isCurrent ? '0' : '1'}_${symbol.name}`,
            })
          }
        }
        return { suggestions }
      },
    }))

    push(monaco.languages.registerDefinitionProvider(language, {
      provideDefinition(model, position) {
        const word = wordAt(model, position)
        if (!word) return null
        const candidates = sourceEntries().flatMap(entry => entry.symbols.filter(symbol => symbol.name === word.name).map(symbol => ({ ...entry, symbol })))
        const current = candidates.find(entry => entry.file.id === (fileForUri(model.uri) || getActiveFile())?.id)
        const match = current || candidates.find(entry => entry.file.id !== (fileForUri(model.uri) || getActiveFile())?.id)
        if (!match) return null
        const targetModel = monaco.editor.getModel(modelUriFor(monaco, match.file))
        if (!targetModel) return null
        const line = Math.max(1, match.symbol.line)
        const text = targetModel.getLineContent(line)
        const column = Math.max(1, text.indexOf(word.name) + 1)
        if (match.file.id !== (fileForUri(model.uri) || getActiveFile())?.id) setActiveFile?.(match.file)
        return { uri: targetModel.uri, range: new monaco.Range(line, column, line, column + word.name.length) }
      },
    }))

    push(monaco.languages.registerReferenceProvider(language, {
      provideReferences(model, position) {
        const word = wordAt(model, position)
        if (!word) return []
        const results = []
        for (const file of allFiles()) {
          const target = monaco.editor.getModel(modelUriFor(monaco, file))
          if (!target) continue
          const regex = new RegExp(`\\b${escapeRegExp(word.name)}\\b`, 'g')
          let match
          while ((match = regex.exec(target.getValue()))) {
            const before = target.getValue().slice(0, match.index)
            const lineNumber = before.split('\n').length
            const column = match.index - before.lastIndexOf('\n')
            results.push({ uri: target.uri, range: new monaco.Range(lineNumber, column, lineNumber, column + word.name.length) })
          }
        }
        return results
      },
    }))

    push(monaco.languages.registerHoverProvider(language, {
      provideHover(model, position) {
        const word = wordAt(model, position)
        if (!word) return null
        const match = sourceEntries().flatMap(entry => entry.symbols.map(symbol => ({ ...entry, symbol }))).find(entry => entry.symbol.name === word.name)
        if (!match) return null
        return { range: word.range, contents: [{ value: `**${match.symbol.kind}: \`${word.name}\`**` }, { value: `${match.file.path || match.file.name}:${match.symbol.line}` }, { value: match.symbol.detail || 'Workspace symbol (text-based analysis)' }] }
      },
    }))
  }

  // Basic workspace-wide rename for identifiers. This is text-based and intentionally conservative.
  for (const language of ['javascript', 'typescript']) push(monaco.languages.registerRenameProvider(language, {
    provideRenameEdits(model, position, newName) {
      if (!/^[A-Za-z_$][\w$]*$/.test(newName)) return { edits: [], rejectReason: 'Use a valid identifier.' }
      const word = wordAt(model, position)
      if (!word) return { edits: [], rejectReason: 'Place the cursor on an identifier.' }
      const edits = []
      for (const file of allFiles()) {
        const target = monaco.editor.getModel(modelUriFor(monaco, file))
        if (!target) continue
        const regex = new RegExp(`\\b${escapeRegExp(word.name)}\\b`, 'g')
        let match
        const value = target.getValue()
        while ((match = regex.exec(value))) {
          const before = value.slice(0, match.index)
          const lineNumber = before.split('\n').length
          const column = match.index - before.lastIndexOf('\n')
          edits.push({ resource: target.uri, versionId: target.getVersionId(), textEdit: { range: new monaco.Range(lineNumber, column, lineNumber, column + word.name.length), text: newName } })
        }
      }
      return { edits }
    },
    resolveRenameLocation(model, position) {
      const word = wordAt(model, position)
      return word ? { range: word.range, text: word.name } : { rejectReason: 'Place the cursor on an identifier.' }
    },
  }))

  return { syncWorkspaceModels, dispose() { for (const item of disposables) item.dispose() } }
}
