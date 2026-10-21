export const syntaxHelp = [
  {
    name: 'JavaScript Basics',
    desc: 'Core JS syntax: variables, types, loops, functions, arrays, objects',
    code: {
      'variable': `// let - can change, block scoped
let count = 0;
count = 1;

// const - cannot reassign, block scoped  
const API_URL = "https://api.com";
API_URL = "new"; // Error

// var - old, function scoped, avoid
var old = true;`,

      'data types': `// Primitive types
const str = "text";           // string
const num = 42;               // number
const bool = true;            // boolean
const empty = null;           // null
let undef;                    // undefined
const sym = Symbol();         // symbol
const big = 9007199254740991n; // bigint

// Reference types
const arr = [1, 2, 3];        // array
const obj = { a: 1 };         // object
const fn = () => {};          // function`,

      'operators': `// Arithmetic
5 + 3   // 8
5 - 3   // 2
5 * 3   // 15
5 / 3   // 1.666...
5 % 3   // 2 remainder
5 ** 3  // 125 power

// Comparison
5 == "5"   // true loose
5 === "5"  // false strict
5 != "5"   // false
5 !== "5"  // true
5 > 3      // true
5 >= 5     // true

// Logical
true && false  // false AND
true || false  // true OR
!true          // false NOT`,

      'if else': `const age = 20;

if (age >= 18) {
  console.log("Adult");
} else if (age >= 13) {
  console.log("Teen");
} else {
  console.log("Kid");
}

// Ternary
const status = age >= 18 ? "Adult" : "Kid";`,

      'switch': `const day = "Mon";

switch (day) {
  case "Mon":
    console.log("Start week");
    break;
  case "Fri":
    console.log("End week");
    break;
  default:
    console.log("Mid week");
}`,

      'for loop': `// Basic for
for (let i = 0; i < 5; i++) {
  console.log(i); // 0 1 2 3 4
}

// For..of arrays
const arr = ["a", "b", "c"];
for (const item of arr) {
  console.log(item);
}

// For..in objects
const obj = { a: 1, b: 2 };
for (const key in obj) {
  console.log(key, obj[key]);
}`,

      'while loop': `let i = 0;
while (i < 5) {
  console.log(i);
  i++;
}

// Do while runs once minimum
do {
  console.log("once");
} while (false);`,

      'function': `// Declaration
function add(a, b) {
  return a + b;
}

// Expression
const add = function(a, b) {
  return a + b;
};

// Arrow
const add = (a, b) => a + b;

// Default params
const greet = (name = "Guest") => \`Hi \${name}\`;`,

      'array methods': `const arr = [1, 2, 3, 4, 5];

// map - transform
arr.map(x => x * 2); // [2,4,6,8,10]

// filter - select
arr.filter(x => x > 3); // [4,5]

// reduce - combine
arr.reduce((sum, x) => sum + x, 0); // 15

// find - first match
arr.find(x => x > 3); // 4

// forEach - loop
arr.forEach(x => console.log(x));

// includes - check exists
arr.includes(3); // true

// slice - copy part
arr.slice(1, 3); // [2,3]

// splice - change original
arr.splice(1, 2); // removes 2 items at index 1`,

      'object methods': `const obj = { a: 1, b: 2 };

// Keys
Object.keys(obj); // ["a", "b"]

// Values  
Object.values(obj); // [1, 2]

// Entries
Object.entries(obj); // [["a",1], ["b",2]]

// Assign merge
Object.assign({}, obj, { c: 3 });

// Destructure
const { a, b } = obj;`,

      'string methods': `const str = "Hello World";

// length
str.length; // 11

// slice
str.slice(0, 5); // "Hello"

// split
str.split(" "); // ["Hello", "World"]

// replace
str.replace("World", "HYE"); // "Hello HYE"

// includes
str.includes("World"); // true

// trim
"  hi  ".trim(); // "hi"

// toUpperCase
str.toUpperCase(); // "HELLO WORLD"`,

      'destructuring': `// Array
const [first, second] = [1, 2, 3];

// Object
const { name, age } = { name: "John", age: 20 };

// Rename
const { name: userName } = person;

// Default
const { count = 0 } = obj;

// Rest
const [head, ...tail] = [1, 2, 3];`,

      'spread operator': `// Arrays
const arr1 = [1, 2];
const arr2 = [...arr1, 3, 4]; // [1,2,3,4]

// Objects
const obj1 = { a: 1 };
const obj2 = { ...obj1, b: 2 }; // {a:1, b:2}

// Function args
const nums = [1, 2, 3];
Math.max(...nums); // 3`,

      'template literal': `const name = "HYE";
const msg = \`Hello \${name}\`; // "Hello HYE"

// Multiline
const html = \`
  <div>
    <h1>\${name}</h1>
  </div>
\`;`,

      'try catch': `try {
  const data = JSON.parse(json);
} catch (error) {
  console.error(error.message);
} finally {
  console.log("Always runs");
}

// Async
async function get() {
  try {
    const res = await fetch(url);
    return res.json();
  } catch (e) {
    return null;
  }
}`,

      'promise': `// Create
const p = new Promise((resolve, reject) => {
  setTimeout(() => resolve("done"), 1000);
});

// Use
p.then(data => console.log(data))
 .catch(err => console.error(err));

// Async await
const data = await p;`,

      'fetch': `// GET
const res = await fetch("/api/users");
const data = await res.json();

// POST
await fetch("/api/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "John" })
});`,

      'async await': `async function getUser() {
  const res = await fetch("/api/user");
  const user = await res.json();
  return user;
}

// Call
getUser().then(user => console.log(user));

// Error handling
async function safe() {
  try {
    return await getUser();
  } catch (e) {
    return null;
  }
}`,

      'class': `class User {
  constructor(name) {
    this.name = name;
  }
  
  greet() {
    return \`Hi \${this.name}\`;
  }
  
  static create(name) {
    return new User(name);
  }
}

const user = new User("John");
user.greet(); // "Hi John"`,

      'module import': `// Named export
export const add = (a, b) => a + b;

// Default export
export default Component;

// Import named
import { add } from "./utils";

// Import default
import App from "./App";

// Import all
import * as utils from "./utils";`,

      'callback': `// Function passed to another
[1,2,3].map(x => x * 2);

// Custom
function load(url, callback) {
  fetch(url).then(res => callback(res));
}

load("/api", data => console.log(data));`,

      'closure': `// Function remembers outer scope
function counter() {
  let count = 0;
  return () => count++;
}

const inc = counter();
inc(); // 1
inc(); // 2`,

      'this keyword': `const obj = {
  name: "HYE",
  greet() {
    console.log(this.name); // "HYE"
  }
};

// Arrow functions do not have own this
const obj2 = {
  name: "HYE",
  greet: () => console.log(this.name) // undefined
};`,

      'event listener': `const btn = document.querySelector("button");

btn.addEventListener("click", (e) => {
  e.preventDefault();
  console.log("Clicked");
});

// Remove
btn.removeEventListener("click", handler);`,

      'localStorage': `// Set
localStorage.setItem("user", JSON.stringify({ id: 1 }));

// Get
const user = JSON.parse(localStorage.getItem("user"));

// Remove
localStorage.removeItem("user");

// Clear all
localStorage.clear();`,

      'JSON': `// Parse string to object
const obj = JSON.parse('{"a":1}');

// Stringify object
const str = JSON.stringify({ a: 1 });`
    }
  },

  {
    name: 'React Patterns',
    desc: 'React hooks, components, props, state, effects, and patterns',
    code: {
      'component': `// Function component
function Button({ text, onClick }) {
  return <button onClick={onClick}>{text}</button>;
}

// Usage
<Button text="Click" onClick={() => alert("Hi")} />`,

      'useState': `import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}`,

      'useEffect': `import { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState(null);
  
  // Run once on mount
  useEffect(() => {
    fetch("/api").then(r => r.json()).then(setData);
  }, []);
  
  // Cleanup
  useEffect(() => {
    const id = setInterval(() => {}, 1000);
    return () => clearInterval(id);
  }, []);
}`,

      'useRef': `import { useRef } from "react";

function Input() {
  const inputRef = useRef(null);
  
  const focus = () => inputRef.current.focus();
  
  return (
    <>
      <input ref={inputRef} />
      <button onClick={focus}>Focus</button>
    </>
  );
}`,

      'useContext': `import { createContext, useContext } from "react";

const ThemeContext = createContext();

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Child />
    </ThemeContext.Provider>
  );
}

function Child() {
  const theme = useContext(ThemeContext);
  return <div>{theme}</div>;
}`,

      'props': `// Parent passes props
<User name="John" age={20} />

// Child receives props
function User({ name, age }) {
  return <div>{name} is {age}</div>;
}

// Children prop
function Card({ children }) {
  return <div className="card">{children}</div>;
}`,

      'conditional render': `function App({ isLoggedIn }) {
  // If else
  if (!isLoggedIn) return <Login />;
  
  // Ternary
  return (
    <div>
      {isLoggedIn ? <User /> : <Login />}
      {isAdmin && <AdminPanel />}
    </div>
  );
}`,

      'list render': `function List({ items }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}`,

      'form controlled': `function Form() {
  const [name, setName] = useState("");
  
  const submit = (e) => {
    e.preventDefault();
    console.log(name);
  };
  
  return (
    <form onSubmit={submit}>
      <input 
        value={name} 
        onChange={e => setName(e.target.value)} 
      />
    </form>
  );
}`,

      'custom hook': `// Hook starts with use
function useFetch(url) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch(url).then(r => r.json()).then(setData);
  }, [url]);
  
  return data;
}

// Usage
function App() {
  const users = useFetch("/api/users");
  return <div>{users?.length}</div>;
}`,

      'memo': `import { memo } from "react";

// Only re-renders if props change
const Button = memo(({ onClick, text }) => {
  return <button onClick={onClick}>{text}</button>;
});`,

      'useCallback': `import { useCallback } from "react";

function App() {
  const [count, setCount] = useState(0);
  
  // Function memoized, does not recreate
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);
  
  return <Button onClick={handleClick} />;
}`,

      'useMemo': `import { useMemo } from "react";

function App({ items }) {
  // Expensive calc only runs when items change
  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price, 0);
  }, [items]);
  
  return <div>Total: {total}</div>;
}`,

      'portal': `import { createPortal } from "react-dom";

function Modal({ children }) {
  return createPortal(
    <div className="modal">{children}</div>,
    document.body
  );
}`,

      'forwardRef': `import { forwardRef } from "react";

const Input = forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});

// Usage
function App() {
  const ref = useRef();
  return <Input ref={ref} />;
}`,

      'lazy suspense': `import { lazy, Suspense } from "react";

const Page = lazy(() => import("./Page"));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Page />
    </Suspense>
  );
}`,

      'error boundary': `class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error, info) {
    console.error(error);
  }
  
  render() {
    if (this.state.hasError) return <h1>Error</h1>;
    return this.props.children;
  }
}`
    }
  },

  {
    name: 'Node Express',
    desc: 'Express.js server setup, routes, middleware, auth, database',
    code: {
      'server setup': `const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.listen(PORT, () => {
  console.log(\`Server on \${PORT}\`);
});`,

      'route': `// GET
app.get("/users", (req, res) => {
  res.json([{ id: 1, name: "John" }]);
});

// POST
app.post("/users", (req, res) => {
  const { name } = req.body;
  res.status(201).json({ id: 2, name });
});

// Params
app.get("/users/:id", (req, res) => {
  const { id } = req.params;
  res.json({ id });
});

// Query
app.get("/search", (req, res) => {
  const { q } = req.query;
  res.json({ q });
});`,

      'middleware': `// Logger middleware
const logger = (req, res, next) => {
  console.log(req.method, req.url);
  next();
};

app.use(logger);

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).send("No token");
  next();
};

app.get("/admin", auth, (req, res) => {
  res.send("Admin");
});`,

      'error handler': `// 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error middleware - 4 args
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});`,

      'cors': `const cors = require("cors");

app.use(cors({
  origin: "https://app.com",
  credentials: true
}));`,

      'env vars': `// Install: npm i dotenv
require("dotenv").config();

const PORT = process.env.PORT || 3000;
const DB_URL = process.env.DATABASE_URL;`,

      'file upload': `const multer = require("multer");
const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ filename: req.file.filename });
});`,

      'jwt auth': `const jwt = require("jsonwebtoken");

// Create token
const token = jwt.sign(
  { id: user.id }, 
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

// Verify token
const verify = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).send("No token");
  
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).send("Invalid token");
  }
};`,

      'hash password': `const bcrypt = require("bcrypt");

// Hash
const hash = await bcrypt.hash("password", 10);

// Compare
const match = await bcrypt.compare("password", hash);`,

      'database': `// Postgres with pg
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get("/users", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM users");
  res.json(rows);
});`,

      'supabase': `const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.get("/users", async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("*");
  if (error) return res.status(400).json(error);
  res.json(data);
});`
    }
  },

  {
    name: 'Git Commands',
    desc: 'Essential Git CLI commands for version control',
    code: {
      'init': `git init`,
      'clone': `git clone https://github.com/user/repo.git`,
      'status': `git status`,
      'add': `git add .  // all files
git add file.js  // one file`,
      'commit': `git commit -m "Fix bug"`,
      'push': `git push origin main`,
      'pull': `git pull origin main`,
      'branch': `git branch  // list
git branch feature  // create
git branch -d feature  // delete`,
      'checkout': `git checkout main  // switch
git checkout -b feature  // create + switch`,
      'merge': `git merge feature`,
      'rebase': `git rebase main`,
      'log': `git log --oneline`,
      'diff': `git diff`,
      'reset': `git reset --hard HEAD~1  // undo last commit`,
      'stash': `git stash  // save changes
git stash pop  // restore`,
      'remote': `git remote -v
git remote add origin https://github.com/user/repo.git`,
      'tag': `git tag v1.0.0
git push origin v1.0.0`
    }
  },

  {
    name: 'CSS Layout',
    desc: 'Flexbox, Grid, positioning, centering, responsive design',
    code: {
      'flexbox': `// Container
display: flex;
flex-direction: row; /* row | column */
justify-content: center; /* main axis */
align-items: center; /* cross axis */
gap: 10px;
flex-wrap: wrap;

// Items
flex: 1; /* grow shrink basis */
align-self: center;`,

      'grid': `// Container
display: grid;
grid-template-columns: 1fr 1fr;
grid-template-rows: auto;
gap: 20px;

// Items
grid-column: 1 / 3; /* span 2 cols */
grid-row: 1;`,

      'position': `position: static; /* default */
position: relative; /* offset from normal */
position: absolute; /* relative to parent */
position: fixed; /* relative to screen */
position: sticky; /* sticks on scroll */

top: 0;
left: 10px;
z-index: 100;`,

      'center div': `// Flex
.parent {
  display: flex;
  justify-content: center;
  align-items: center;
}

// Grid
.parent {
  display: grid;
  place-items: center;
}

// Absolute
.child {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}`,

      'responsive': `@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
}`,

      'variables': `:root {
  --hye-blue: #007acc;
  --hye-bg: #1e1e1e;
}

button {
  background: var(--hye-blue);
}`
    }
  },

  {
    name: 'Python Basics',
    desc: 'Python syntax: variables, loops, functions, classes, files',
    code: {
      'print': `print("Hello")
print(f"Name: {name}")`,
      'variables': `x = 5
name = "HYE"
arr = [1, 2, 3]`,
      'if': `if x > 5:
    print("big")
elif x > 0:
    print("positive")
else:
    print("zero or negative")`,
      'for': `for i in range(5):
    print(i)
    
for item in arr:
    print(item)`,
      'while': `i = 0
while i < 5:
    print(i)
    i += 1`,
      'function': `def add(a, b):
    return a + b`,
      'lambda': `add = lambda a, b: a + b`,
      'list': `arr = [1, 2, 3]
arr.append(4)
arr[0]  # 1`,
      'dict': `user = {"name": "John", "age": 20}
user["name"]  # "John"`,
      'try except': `try:
    x = 1 / 0
except ZeroDivisionError:
    print("Cannot divide by zero")
finally:
    print("Always runs")`,
      'class': `class User:
    def __init__(self, name):
        self.name = name
    
    def greet(self):
        return f"Hi {self.name}"`,
      'import': `import math
from math import sqrt
import numpy as np`,
      'file': `with open("file.txt", "r") as f:
    data = f.read()`,
      'list comp': `squares = [x*x for x in range(10)]`,
      'f-string': `name = "HYE"
print(f"Hello {name}")`
    }
  },

  {
    name: 'SQL Basics',
    desc: 'SQL queries: SELECT, INSERT, UPDATE, DELETE, JOIN, WHERE',
    code: {
      'select': `SELECT * FROM users;
SELECT name, age FROM users WHERE age > 18;`,
      'insert': `INSERT INTO users (name, age) VALUES ('John', 20);`,
      'update': `UPDATE users SET age = 21 WHERE id = 1;`,
      'delete': `DELETE FROM users WHERE id = 1;`,
      'create table': `CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  age INT,
  created_at TIMESTAMP DEFAULT NOW()
);`,
      'join': `SELECT orders.id, users.name 
FROM orders 
JOIN users ON orders.user_id = users.id;`,
      'where': `WHERE age > 18 AND city = 'Lagos'`,
      'order by': `ORDER BY created_at DESC`,
      'limit': `LIMIT 10 OFFSET 20`,
      'group by': `SELECT city, COUNT(*) FROM users GROUP BY city`,
      'aggregate': `SELECT COUNT(*), AVG(age), MAX(age) FROM users`,
      'like': `WHERE name LIKE 'J%'`,
      'in': `WHERE id IN (1, 2, 3)`,
      'index': `CREATE INDEX idx_email ON users(email);`
    }
  },

  {
    name: 'TypeScript',
    desc: 'TS types, interfaces, generics, utilities, enums',
    code: {
      'type': `type User = {
  id: number;
  name: string;
  age?: number; // optional
};`,
      'interface': `interface User {
  id: number;
  name: string;
}

interface Admin extends User {
  role: string;
}`,
      'union': `let id: string | number;
id = "abc";
id = 123;`,
      'generic': `function identity<T>(arg: T): T {
  return arg;
}

const arr: Array<number> = [1, 2, 3];`,
      'utility': `type PartialUser = Partial<User>;
type ReadonlyUser = Readonly<User>;
type UserName = Pick<User, "name">;`,
      'as': `const el = document.getElementById("app") as HTMLDivElement;`,
      'enum': `enum Color {
  Red,
  Blue
}

const c = Color.Red;`
    }
  },

  {
    name: 'Docker',
    desc: 'Dockerfile, build, run, compose commands',
    code: {
      'Dockerfile': `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]`,
      'build': `docker build -t myapp .`,
      'run': `docker run -p 3000:3000 myapp`,
      'compose': `version: '3'
services:
  app:
    build: .
    ports:
      - "3000:3000"
  db:
    image: postgres
    environment:
      POSTGRES_PASSWORD: pass`,
      'commands': `docker ps  // list running
docker stop id  // stop
docker logs id  // view logs
docker exec -it id sh  // enter container`
    }
  },

  {
    name: 'Common Errors',
    desc: 'JS/React error messages and how to fix them',
    code: {
      'undefined is not a function': `You called something that is not a function.
Check: typeof myVar === "function"`,
      'Cannot read property of undefined': `You accessed .key on undefined.
Fix: obj?.key or check if obj exists first`,
      'Unexpected token': `Syntax error. Missing bracket, comma, or quote.
Check line number in error.`,
      'Module not found': `Import path wrong or package not installed.
Run: npm install package-name`,
      'EADDRINUSE': `Port already used. Kill process or use different port.
lsof -ti:3000 | xargs kill`,
      'CORS error': `Server needs cors middleware.
app.use(cors())`,
      'React hooks rule': `Hooks only at top level of function component.
Not inside if, loop, or nested function.`,
      'Keys prop': `Lists need key prop.
{items.map(item => <li key={item.id}>)}`
    }
  }
,
  {"name": "Python quick start", "desc": "Python uses indentation for blocks, def for functions, and f-strings for interpolation.", "code": {"hello world": "def greet(name):\n    return f\"Hello, {name}!\"\n\nprint(greet(\"Hyecode\"))", "key concepts": "Python uses indentation for blocks, def for functions, and f-strings for interpolation. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Java quick start", "desc": "Java is a statically typed, class-based language that runs on the JVM.", "code": {"hello world": "public class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello, Hyecode!\");\n  }\n}", "key concepts": "Java is a statically typed, class-based language that runs on the JVM. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Kotlin quick start", "desc": "Kotlin supports concise functions, nullable types and Android development.", "code": {"hello world": "fun greet(name: String): String = \"Hello, $name\"\n\nfun main() { println(greet(\"Hyecode\")) }", "key concepts": "Kotlin supports concise functions, nullable types and Android development. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "C quick start", "desc": "C is a compiled procedural language with explicit memory and type management.", "code": {"hello world": "#include <stdio.h>\n\nint main(void) {\n  printf(\"Hello, Hyecode!\\n\");\n  return 0;\n}", "key concepts": "C is a compiled procedural language with explicit memory and type management. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "C++ quick start", "desc": "C++ supports procedural, object-oriented and generic programming.", "code": {"hello world": "#include <iostream>\n#include <string>\n\nint main() {\n  std::string name = \"Hyecode\";\n  std::cout << \"Hello, \" << name << \"!\\n\";\n  return 0;\n}", "key concepts": "C++ supports procedural, object-oriented and generic programming. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "C# quick start", "desc": "C# is a strongly typed language commonly used with .NET and Unity.", "code": {"hello world": "using System;\n\nclass Program {\n  static void Main() {\n    Console.WriteLine(\"Hello, Hyecode!\");\n  }\n}", "key concepts": "C# is a strongly typed language commonly used with .NET and Unity. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Go quick start", "desc": "Go emphasizes simple syntax, compiled binaries and built-in concurrency.", "code": {"hello world": "package main\nimport \"fmt\"\n\nfunc main() {\n  fmt.Println(\"Hello, Hyecode!\")\n}", "key concepts": "Go emphasizes simple syntax, compiled binaries and built-in concurrency. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Rust quick start", "desc": "Rust emphasizes memory safety and performance through ownership and borrowing.", "code": {"hello world": "fn main() {\n    let name = \"Hyecode\";\n    println!(\"Hello, {}!\", name);\n}", "key concepts": "Rust emphasizes memory safety and performance through ownership and borrowing. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "PHP quick start", "desc": "PHP is widely used for server-rendered websites and backend APIs.", "code": {"hello world": "<?php\n$name = \"Hyecode\";\necho \"Hello, {$name}!\";\n", "key concepts": "PHP is widely used for server-rendered websites and backend APIs. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Ruby quick start", "desc": "Ruby favors readable syntax and is used in scripting and web development.", "code": {"hello world": "def greet(name)\n  \"Hello, #{name}!\"\nend\n\nputs greet(\"Hyecode\")", "key concepts": "Ruby favors readable syntax and is used in scripting and web development. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Swift quick start", "desc": "Swift is used for Apple platform development.", "code": {"hello world": "func greet(_ name: String) -> String {\n    return \"Hello, \\(name)!\"\n}\nprint(greet(\"Hyecode\"))", "key concepts": "Swift is used for Apple platform development. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Dart quick start", "desc": "Dart is used by Flutter for cross-platform application development.", "code": {"hello world": "String greet(String name) => \"Hello, $name!\";\n\nvoid main() {\n  print(greet(\"Hyecode\"));\n}", "key concepts": "Dart is used by Flutter for cross-platform application development. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "SQL quick start", "desc": "SQL queries and manages relational data; exact syntax varies by database.", "code": {"hello world": "SELECT name, language\nFROM projects\nWHERE active = TRUE\nORDER BY name;", "key concepts": "SQL queries and manages relational data; exact syntax varies by database. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Bash quick start", "desc": "Bash automates command-line tasks. Quote variables and handle failures explicitly.", "code": {"hello world": "#!/usr/bin/env bash\nset -euo pipefail\nname=\"Hyecode\"\nprintf \"Hello, %s!\\n\" \"$name\"", "key concepts": "Bash automates command-line tasks. Quote variables and handle failures explicitly. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "PowerShell quick start", "desc": "PowerShell is an object-oriented shell and scripting language.", "code": {"hello world": "$name = \"Hyecode\"\nWrite-Output \"Hello, $name!\"", "key concepts": "PowerShell is an object-oriented shell and scripting language. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Lua quick start", "desc": "Lua is a lightweight embeddable scripting language.", "code": {"hello world": "local function greet(name)\n  return \"Hello, \" .. name .. \"!\"\nend\nprint(greet(\"Hyecode\"))", "key concepts": "Lua is a lightweight embeddable scripting language. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "R quick start", "desc": "R is commonly used for statistics, data analysis and visualization.", "code": {"hello world": "name <- \"Hyecode\"\ngreet <- function(x) paste(\"Hello,\", x)\nprint(greet(name))", "key concepts": "R is commonly used for statistics, data analysis and visualization. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Ruby on Rails quick start", "desc": "Rails is a Ruby web framework using conventions and MVC architecture.", "code": {"hello world": "class WelcomeController < ApplicationController\n  def index\n    render plain: \"Hello, Hyecode!\"\n  end\nend", "key concepts": "Rails is a Ruby web framework using conventions and MVC architecture. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Scala quick start", "desc": "Scala combines object-oriented and functional programming on the JVM.", "code": {"hello world": "object Main {\n  def main(args: Array[String]): Unit = {\n    println(\"Hello, Hyecode!\")\n  }\n}", "key concepts": "Scala combines object-oriented and functional programming on the JVM. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Elixir quick start", "desc": "Elixir runs on the BEAM virtual machine and is designed for concurrent systems.", "code": {"hello world": "defmodule Hello do\n  def greet(name), do: \"Hello, #{name}!\"\nend\n\nIO.puts(Hello.greet(\"Hyecode\"))", "key concepts": "Elixir runs on the BEAM virtual machine and is designed for concurrent systems. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Clojure quick start", "desc": "Clojure is a Lisp dialect emphasizing functional programming and immutable data.", "code": {"hello world": "(defn greet [name]\n  (str \"Hello, \" name \"!\"))\n(println (greet \"Hyecode\"))", "key concepts": "Clojure is a Lisp dialect emphasizing functional programming and immutable data. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Perl quick start", "desc": "Perl is a scripting language often used for text processing and automation.", "code": {"hello world": "use strict;\nuse warnings;\nmy $name = \"Hyecode\";\nprint \"Hello, $name!\\n\";", "key concepts": "Perl is a scripting language often used for text processing and automation. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Haskell quick start", "desc": "Haskell is a statically typed, purely functional programming language.", "code": {"hello world": "greet :: String -> String\ngreet name = \"Hello, \" ++ name ++ \"!\"\n\nmain :: IO ()\nmain = putStrLn (greet \"Hyecode\")", "key concepts": "Haskell is a statically typed, purely functional programming language. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Julia quick start", "desc": "Julia is designed for high-performance numerical and scientific computing.", "code": {"hello world": "greet(name) = \"Hello, $(name)!\"\nprintln(greet(\"Hyecode\"))", "key concepts": "Julia is designed for high-performance numerical and scientific computing. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "MATLAB quick start", "desc": "MATLAB is used for numerical computing, simulations and engineering.", "code": {"hello world": "name = \"Hyecode\";\nfprintf(\"Hello, %s!\\n\", name);", "key concepts": "MATLAB is used for numerical computing, simulations and engineering. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Solidity quick start", "desc": "Solidity is used to write smart contracts for Ethereum-compatible blockchains.", "code": {"hello world": "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\ncontract Greeting {\n  function greet() public pure returns (string memory) {\n    return \"Hello, Hyecode!\";\n  }\n}", "key concepts": "Solidity is used to write smart contracts for Ethereum-compatible blockchains. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Groovy quick start", "desc": "Groovy runs on the JVM and is commonly seen in Gradle build scripts.", "code": {"hello world": "def greet(String name) { \"Hello, ${name}!\" }\nprintln greet(\"Hyecode\")", "key concepts": "Groovy runs on the JVM and is commonly seen in Gradle build scripts. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Assembly (x86-style) quick start", "desc": "Assembly is processor-specific; registers, calling conventions and syscalls vary.", "code": {"hello world": "; Assembly syntax varies by CPU and assembler\nsection .data\n  message db \"Hello, Hyecode!\", 10\n  length equ $ - message", "key concepts": "Assembly is processor-specific; registers, calling conventions and syscalls vary. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "GraphQL quick start", "desc": "GraphQL is a query language for APIs, not a general-purpose programming language.", "code": {"hello world": "query ProjectById($id: ID!) {\n  project(id: $id) {\n    name\n    language\n  }\n}", "key concepts": "GraphQL is a query language for APIs, not a general-purpose programming language. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Protocol Buffers quick start", "desc": "Protocol Buffers define structured data schemas used for serialization and RPC.", "code": {"hello world": "syntax = \"proto3\";\n\nmessage Project {\n  string name = 1;\n  string language = 2;\n}", "key concepts": "Protocol Buffers define structured data schemas used for serialization and RPC. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Terraform HCL quick start", "desc": "HCL is a declarative configuration language often used with Terraform.", "code": {"hello world": "resource \"local_file\" \"hello\" {\n  filename = \"hello.txt\"\n  content  = \"Hello, Hyecode!\"\n}", "key concepts": "HCL is a declarative configuration language often used with Terraform. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "VHDL quick start", "desc": "VHDL describes digital hardware; simulation and synthesis semantics differ from software.", "code": {"hello world": "-- A simple VHDL entity outline\nentity hello is\n  port (enable : in bit; output_bit : out bit);\nend entity;", "key concepts": "VHDL describes digital hardware; simulation and synthesis semantics differ from software. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Verilog quick start", "desc": "Verilog is a hardware description language used to model digital circuits.", "code": {"hello world": "module hello(input wire enable, output wire signal_out);\n  assign signal_out = enable;\nendmodule", "key concepts": "Verilog is a hardware description language used to model digital circuits. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "F# quick start", "desc": "F# is a functional-first language in the .NET ecosystem.", "code": {"hello world": "let greet name = $\"Hello, {name}!\"\nprintfn \"%s\" (greet \"Hyecode\")", "key concepts": "F# is a functional-first language in the .NET ecosystem. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "OCaml quick start", "desc": "OCaml is a statically typed functional language with pattern matching.", "code": {"hello world": "let greet name = \"Hello, \" ^ name ^ \"!\"\nlet () = print_endline (greet \"Hyecode\")", "key concepts": "OCaml is a statically typed functional language with pattern matching. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Erlang quick start", "desc": "Erlang is designed for concurrent, fault-tolerant distributed systems.", "code": {"hello world": "-module(hello).\n-export([greet/1]).\n\ngreet(Name) -> io_lib:format(\"Hello, ~s!\", [Name]).", "key concepts": "Erlang is designed for concurrent, fault-tolerant distributed systems. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Fortran quick start", "desc": "Fortran remains important in numerical and scientific computing.", "code": {"hello world": "program hello\n  print *, \"Hello, Hyecode!\"\nend program hello", "key concepts": "Fortran remains important in numerical and scientific computing. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "COBOL quick start", "desc": "COBOL is a business-oriented language still found in some legacy systems.", "code": {"hello world": "IDENTIFICATION DIVISION.\nPROGRAM-ID. HELLO.\nPROCEDURE DIVISION.\n    DISPLAY \"Hello, Hyecode!\".\n    STOP RUN.", "key concepts": "COBOL is a business-oriented language still found in some legacy systems. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "Objective-C quick start", "desc": "Objective-C is used in legacy Apple codebases and interoperates with C.", "code": {"hello world": "#import <Foundation/Foundation.h>\nint main(void) {\n  @autoreleasepool { NSLog(@\"Hello, Hyecode!\"); }\n  return 0;\n}", "key concepts": "Objective-C is used in legacy Apple codebases and interoperates with C. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "XML quick start", "desc": "XML represents structured data with nested, named elements.", "code": {"hello world": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<project>\n  <name>Hyecode</name>\n</project>", "key concepts": "XML represents structured data with nested, named elements. Start with the example, then consult the language version and toolchain used by your project."}},
  {"name": "YAML quick start", "desc": "YAML is a human-readable data serialization format; indentation is significant.", "code": {"hello world": "project:\n  name: Hyecode\n  languages:\n    - JavaScript\n    - Python", "key concepts": "YAML is a human-readable data serialization format; indentation is significant. Start with the example, then consult the language version and toolchain used by your project."}}
  ,{ name: 'Debugging checklist', desc: 'A practical, dependency-free checklist for finding bugs before asking an AI model.', code: { 'reproduce': `1. Write down the exact steps that cause the issue.
2. Record the expected result and actual result.
3. Check the first error in the console, not only the last one.`, 'isolate': `Temporarily remove unrelated code until the smallest failing example remains. Check recent edits, null/undefined values, async timing, and file paths.`, 'verify': `After fixing the cause, repeat the original steps and test one nearby edge case. Do not treat a code suggestion as tested until you run it.` } },
  { name: 'Using cloud AI safely', desc: 'Understand what leaves your phone when using a cloud provider.', code: { 'what is sent': `Hyecode sends your prompt and, when a file is open, a bounded excerpt of the active file to the selected provider. Other project files are not automatically included by this feature.`, 'protect secrets': `Remove API keys, passwords, access tokens, private URLs, and customer data before sending code to a cloud model.`, 'billing and privacy': `Use your own provider key. The provider may charge you and its own privacy and retention terms apply. Disconnecting clears the key from this app session.` } },
  { name: 'Mobile editor tips', desc: 'Keyboard and navigation tips for coding on a phone.', code: { 'completion': `Use the editor completion menu for language suggestions and built-in snippets. Snippets are convenience starters, not a full language server.`, 'save': `Use the Save action or Ctrl/Cmd+S when a hardware keyboard is connected. Watch the status message for save errors.`, 'performance': `Large files and local AI models use memory. If editing becomes slow, close unused tabs or unload the local model when finished.` } },
  { name: 'HTTP request basics', desc: 'A concise guide to methods, status codes, JSON, and safe error handling.', code: { 'methods': `GET reads data; POST submits or creates data; PUT replaces a resource; PATCH changes part of a resource; DELETE requests removal.`, 'status codes': `2xx usually means success; 4xx points to a request or permission problem; 5xx usually indicates a server-side failure. Check the response body for details.`, 'fetch': `fetch() does not reject just because the server returns 404 or 500. Check response.ok before reading data and catch network failures.` } }
]
