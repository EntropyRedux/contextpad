# ContextPad Testing Guide

**Version:** 0.2.0
**Last Updated:** January 9, 2026

This document contains comprehensive testing checklists and Markdown formatting examples to verify all features are working correctly.

---

## 📋 Testing Checklists

### ✅ Core Functionality Tests

#### Tab Management
- [ ] Create new tab (Ctrl+N / Ctrl+T / File menu / + button)
- [ ] Close tab (Ctrl+W / × button)
- [ ] Close tab with unsaved changes (should show confirmation)
- [ ] Switch between tabs (click / Ctrl+Tab / Ctrl+Shift+Tab)
- [ ] Jump to specific tab (Ctrl+1 through Ctrl+9)
- [ ] Active tab is visually highlighted
- [ ] Tab title shows file name or "Untitled-N"

#### Tab Reordering
- [ ] Hover on tab shows left/right arrow buttons
- [ ] Click left arrow moves tab left
- [ ] Click right arrow moves tab right
- [ ] First tab only shows right arrow
- [ ] Last tab only shows left arrow
- [ ] Tab order persists after moving

#### Tab Overflow Navigation
- [ ] Create 10+ tabs to trigger overflow
- [ ] Left scroll arrow (‹) appears when tabs overflow left
- [ ] Right scroll arrow (›) appears when tabs overflow right
- [ ] Arrows disappear when at scroll boundaries
- [ ] Clicking arrows scrolls smoothly
- [ ] Scrollbar is hidden (no visible scrollbar)

#### Dirty Indicators
- [ ] Type in editor marks tab as dirty
- [ ] Blue pulsing dot (●) appears on dirty tabs
- [ ] Dot has tooltip "Unsaved changes" on hover
- [ ] Dot disappears after saving
- [ ] Closing dirty tab shows confirmation

#### File Operations
- [ ] Open file (Ctrl+O / File menu)
- [ ] Open file sets correct title
- [ ] Open file detects language from extension
- [ ] Save file (Ctrl+S / File menu)
- [ ] Save As (Ctrl+Shift+S / File menu)
- [ ] Save sets filePath and clears dirty state
- [ ] File dialog shows correct filters

#### Recent Files
- [ ] Opening a file adds it to recent files list
- [ ] Saving a new file adds it to recent files list
- [ ] Recent files appear in File menu
- [ ] Recent files show filename only (not full path)
- [ ] Hovering recent file shows full path tooltip
- [ ] Clicking recent file opens it
- [ ] Recent files list limited to 10 items
- [ ] Recent files persist after app restart

#### Session Restore
- [ ] Open multiple tabs with content
- [ ] Close app (DO NOT close all tabs)
- [ ] Reopen app - tabs should restore
- [ ] Tab content is preserved
- [ ] Active tab is restored
- [ ] View settings are preserved

#### File Watchers
- [ ] Open a file in ContextPad
- [ ] Edit the same file in another editor (VS Code, Notepad++)
- [ ] Wait 2-3 seconds
- [ ] Dialog should appear: "File has been changed on disk"
- [ ] Click "OK" to reload - content updates
- [ ] Click "Cancel" to keep current version

#### Find & Replace
- [ ] Press Ctrl+F - Find dialog appears
- [ ] Type search term and press Enter
- [ ] Press Ctrl+H - Replace dialog appears
- [ ] Replace dialog has both Find and Replace inputs
- [ ] Case sensitive option works
- [ ] Whole word option works
- [ ] Regex option works
- [ ] Replace button replaces current match
- [ ] Replace All button replaces all matches
- [ ] Press Escape to close dialog

### ⌨️ Keyboard Shortcuts Tests

#### File Operations
- [ ] Ctrl+N - New tab
- [ ] Ctrl+T - New tab (alternative)
- [ ] Ctrl+O - Open file
- [ ] Ctrl+S - Save file
- [ ] Ctrl+Shift+S - Save As
- [ ] Ctrl+W - Close tab

#### Editing
- [ ] Ctrl+Z - Undo
- [ ] Ctrl+Y - Redo
- [ ] Ctrl+X - Cut
- [ ] Ctrl+C - Copy
- [ ] Ctrl+V - Paste
- [ ] Ctrl+F - Find
- [ ] Ctrl+H - Replace

#### Tab Navigation
- [ ] Ctrl+Tab - Next tab
- [ ] Ctrl+Shift+Tab - Previous tab
- [ ] Ctrl+1 to Ctrl+8 - Jump to tab 1-8
- [ ] Ctrl+9 - Jump to last tab

### 🎨 View & Settings Tests

#### View Menu
- [ ] Toggle Status Bar (shows/hides)
- [ ] Toggle Line Numbers (shows/hides in editor)
- [ ] Zoom In (Ctrl++) - Font size increases
- [ ] Zoom Out (Ctrl+-) - Font size decreases
- [ ] Reset Zoom - Font size returns to 14px

#### Settings UI
- [ ] Open Help → Settings
- [ ] Settings dialog appears
- [ ] Toggle "Show Status Bar" checkbox
- [ ] Toggle "Show Line Numbers" checkbox
- [ ] Adjust Font Size slider (8-32px)
- [ ] Changes apply immediately
- [ ] Close Settings with × button
- [ ] Settings persist after app restart

#### Status Bar
- [ ] Shows cursor line and column
- [ ] Shows detected language
- [ ] Shows "UTF-8" encoding
- [ ] Updates when cursor moves
- [ ] Updates when switching tabs
- [ ] Updates when opening different file types

### 🎯 Code Block Detection Tests

#### Markdown Code Blocks
- [ ] Open Developer Console (F12)
- [ ] Type a code block with parameters:
```javascript run
console.log('test')
```
- [ ] Check console for detection log
- [ ] Should show: `[CodeBlock Detection] Found 1 code block(s) with parameters`
- [ ] Should log language and parameters

### 🖥️ Window Controls Tests

#### Title Bar
- [ ] Drag from app icon (📝) to move window
- [ ] Drag from empty title bar space to move window
- [ ] Minimize button works
- [ ] Maximize button works
- [ ] Close button works
- [ ] Double-click title bar toggles maximize

#### Custom Title Bar
- [ ] Tab bar is part of title bar
- [ ] No native window border
- [ ] Title bar has VS Code dark theme
- [ ] Window controls (-, □, ×) are custom styled

---

## 📝 Markdown Formatting Examples

Test these in the editor to verify syntax highlighting and rendering:

### Headers

```markdown
# H1 Header
## H2 Header
### H3 Header
#### H4 Header
##### H5 Header
###### H6 Header
```

### Text Formatting

```markdown
**Bold text**
*Italic text*
***Bold and italic***
~~Strikethrough~~
`Inline code`
```

### Lists

#### Unordered Lists
```markdown
- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
- Item 3
```

#### Ordered Lists
```markdown
1. First item
2. Second item
   1. Nested item 2.1
   2. Nested item 2.2
3. Third item
```

#### Task Lists
```markdown
- [x] Completed task
- [ ] Incomplete task
- [ ] Another task
```

### Links and Images

```markdown
[Link text](https://example.com)
[Link with title](https://example.com "Title")
![Alt text](image.png)
![Image with title](image.png "Title")
```

### Blockquotes

```markdown
> This is a blockquote
> Multiple lines
> In a quote

> Nested quotes
>> Second level
>>> Third level
```

### Horizontal Rules

```markdown
---
***
___
```

### Tables

```markdown
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

| Left Aligned | Center Aligned | Right Aligned |
|:-------------|:--------------:|--------------:|
| Left         | Center         | Right         |
```

### Code Blocks

#### Inline Code
```markdown
Use `const` instead of `var` in JavaScript.
```

#### Fenced Code Blocks
````markdown
```
Plain code block
No syntax highlighting
```
````

---

## 💻 Code Syntax Highlighting Tests

Copy and paste these code blocks to test language detection and syntax highlighting:

### JavaScript

```javascript
// JavaScript code block
const greeting = 'Hello, World!';
const numbers = [1, 2, 3, 4, 5];

function calculateSum(arr) {
  return arr.reduce((acc, num) => acc + num, 0);
}

class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  greet() {
    console.log(`Hello, my name is ${this.name}`);
  }
}

// Arrow functions
const double = (x) => x * 2;

// Async/await
async function fetchData(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### TypeScript

```typescript
// TypeScript code block
interface User {
  id: number;
  name: string;
  email: string;
  roles?: string[];
}

type Status = 'active' | 'inactive' | 'pending';

class UserManager<T extends User> {
  private users: T[] = [];

  addUser(user: T): void {
    this.users.push(user);
  }

  getUserById(id: number): T | undefined {
    return this.users.find(user => user.id === id);
  }
}

// Generics
function identity<T>(arg: T): T {
  return arg;
}

// Enums
enum Color {
  Red = '#ff0000',
  Green = '#00ff00',
  Blue = '#0000ff'
}
```

### Python

```python
# Python code block
import math
from typing import List, Dict, Optional

def fibonacci(n: int) -> List[int]:
    """Generate Fibonacci sequence up to n terms."""
    if n <= 0:
        return []
    elif n == 1:
        return [0]

    sequence = [0, 1]
    for i in range(2, n):
        sequence.append(sequence[i-1] + sequence[i-2])

    return sequence

class Calculator:
    """Simple calculator class."""

    def __init__(self):
        self.result = 0

    def add(self, x: float, y: float) -> float:
        """Add two numbers."""
        self.result = x + y
        return self.result

    def multiply(self, x: float, y: float) -> float:
        """Multiply two numbers."""
        self.result = x * y
        return self.result

# List comprehension
squares = [x**2 for x in range(10)]

# Dictionary comprehension
char_count = {char: text.count(char) for char in set(text)}

# Lambda functions
multiply = lambda x, y: x * y
```

### Rust

```rust
// Rust code block
use std::collections::HashMap;

#[derive(Debug, Clone)]
struct Person {
    name: String,
    age: u32,
}

impl Person {
    fn new(name: &str, age: u32) -> Self {
        Person {
            name: name.to_string(),
            age,
        }
    }

    fn greet(&self) {
        println!("Hello, my name is {} and I'm {} years old", self.name, self.age);
    }
}

fn main() {
    let mut people: HashMap<u32, Person> = HashMap::new();

    people.insert(1, Person::new("Alice", 30));
    people.insert(2, Person::new("Bob", 25));

    // Pattern matching
    match people.get(&1) {
        Some(person) => person.greet(),
        None => println!("Person not found"),
    }

    // Iterators
    let ages: Vec<u32> = people.values()
        .map(|p| p.age)
        .filter(|&age| age > 25)
        .collect();
}
```

### HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sample Page</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <nav>
            <ul class="menu">
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <article>
            <h1>Welcome</h1>
            <p>This is a <strong>sample</strong> HTML document.</p>
            <img src="image.jpg" alt="Description">
        </article>
    </main>

    <script src="script.js"></script>
</body>
</html>
```

### CSS

```css
/* CSS code block */
:root {
  --primary-color: #007acc;
  --secondary-color: #2a2a2b;
  --text-color: #ffffff;
  --spacing: 16px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: var(--secondary-color);
  color: var(--text-color);
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing);
}

.button {
  display: inline-block;
  padding: 10px 20px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.button:hover {
  background-color: #005a9e;
}

@media (max-width: 768px) {
  .container {
    padding: calc(var(--spacing) / 2);
  }
}
```

### JSON

```json
{
  "name": "contextpad",
  "version": "0.2.0",
  "description": "A minimal text editor",
  "main": "index.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "jest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "zustand": "^4.5.7"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "typescript": "^4.9.5",
    "vite": "^5.4.21"
  },
  "keywords": ["editor", "markdown", "tauri"],
  "author": "Your Name",
  "license": "MIT"
}
```

### SQL

```sql
-- SQL code block
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

INSERT INTO users (username, email)
VALUES
    ('alice', 'alice@example.com'),
    ('bob', 'bob@example.com'),
    ('charlie', 'charlie@example.com');

SELECT
    u.id,
    u.username,
    COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE u.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.username
HAVING COUNT(p.id) > 5
ORDER BY post_count DESC
LIMIT 10;

UPDATE users
SET updated_at = CURRENT_TIMESTAMP
WHERE username = 'alice';
```

### Go

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

type User struct {
    ID       int
    Username string
    Email    string
}

func (u *User) String() string {
    return fmt.Sprintf("User{ID: %d, Username: %s, Email: %s}",
        u.ID, u.Username, u.Email)
}

func processUser(user User, wg *sync.WaitGroup, ch chan<- string) {
    defer wg.Done()

    time.Sleep(100 * time.Millisecond)
    ch <- fmt.Sprintf("Processed: %s", user.Username)
}

func main() {
    users := []User{
        {1, "alice", "alice@example.com"},
        {2, "bob", "bob@example.com"},
        {3, "charlie", "charlie@example.com"},
    }

    var wg sync.WaitGroup
    ch := make(chan string, len(users))

    for _, user := range users {
        wg.Add(1)
        go processUser(user, &wg, ch)
    }

    wg.Wait()
    close(ch)

    for msg := range ch {
        fmt.Println(msg)
    }
}
```

### YAML

```yaml
# YAML configuration
version: '3.8'

services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./html:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    environment:
      - NGINX_HOST=example.com
      - NGINX_PORT=80
    depends_on:
      - api
    restart: unless-stopped

  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DB_HOST: db
      DB_PORT: 5432
    volumes:
      - ./api:/app
      - /app/node_modules

  db:
    image: postgres:14
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### Shell/Bash

```bash
#!/bin/bash
# Shell script example

set -e

# Variables
APP_NAME="contextpad"
VERSION="0.2.0"
BUILD_DIR="dist"

# Functions
function print_info() {
    echo "[INFO] $1"
}

function build_app() {
    print_info "Building $APP_NAME v$VERSION..."

    if [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR"
    fi

    mkdir -p "$BUILD_DIR"
    npm run build

    print_info "Build completed successfully!"
}

function deploy_app() {
    local environment=$1
    print_info "Deploying to $environment..."

    case $environment in
        production)
            rsync -avz "$BUILD_DIR/" user@server:/var/www/app/
            ;;
        staging)
            rsync -avz "$BUILD_DIR/" user@staging:/var/www/app/
            ;;
        *)
            echo "Unknown environment: $environment"
            exit 1
            ;;
    esac
}

# Main
build_app
deploy_app "${1:-staging}"
```

---

## 🧪 Advanced Testing Scenarios

### Stress Testing
- [ ] Open 50+ tabs - app remains responsive
- [ ] Open large file (>1MB) - loads without freezing
- [ ] Type rapidly in editor - no input lag
- [ ] Switch between tabs rapidly - smooth transitions

### Edge Cases
- [ ] Close last tab - new "Untitled-1" is created
- [ ] Save file with no extension - works
- [ ] Open binary file - shows error gracefully
- [ ] Open non-existent recent file - shows error
- [ ] Disk full when saving - shows error

### Multi-Window (Future Feature)
- [ ] Open second window (not yet implemented)
- [ ] Tabs are independent per window
- [ ] Settings sync across windows

---

## ✅ Sign-Off Checklist

After completing all tests, verify:

- [ ] All core features working
- [ ] No console errors (check DevTools F12)
- [ ] No memory leaks (monitor Task Manager)
- [ ] All keyboard shortcuts functional
- [ ] Settings persist correctly
- [ ] Recent files work correctly
- [ ] File watchers detect changes
- [ ] Syntax highlighting works for all languages
- [ ] Tab reordering works smoothly
- [ ] Window can be dragged from title bar
- [ ] App can be minimized/maximized/closed

---

## 📊 Test Results Template

```markdown
## Test Session: [Date]
**Tester:** [Your Name]
**Version:** 0.2.0
**Platform:** Windows/Mac/Linux

### Results Summary
- Total Tests: XX
- Passed: XX
- Failed: XX
- Skipped: XX

### Failed Tests
1. [Test Name] - [Description of failure]
2. [Test Name] - [Description of failure]

### Notes
- [Any additional observations]
- [Performance notes]
- [Suggestions for improvement]
```

---

**Happy Testing! 🎉**
