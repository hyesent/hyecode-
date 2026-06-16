export const syntaxHelp = [
  {
  'JavaScript Basics': {
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
  },

  'React Patterns': {
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
  },

  'Node Express': {
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
  },

  'Git Commands': {
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
  },

  'CSS Layout': {
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
  },

  'Python Basics': {
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
  },

  'SQL Basics': {
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
  },

  'TypeScript': {
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
  },

  'Docker': {
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
  },

  'Common Errors': {
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
]