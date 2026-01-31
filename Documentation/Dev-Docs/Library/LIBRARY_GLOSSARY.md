# ContextPad Library Glossary

This document serves as a reference for the pre-built **Templates** (`LIBRARY_TEMPLATES.json`) and **Actions** (`LIBRARY_ACTIONS.json`) available for import.

---

## 📂 Templates Library

### AI Prompt Engineering
| Template Name | Description |
|---|---|
| **AI Persona: Senior Python Dev** | Sets the AI context to a strict, PEP8-compliant, testing-focused Python expert. |
| **AI Persona: Data Scientist** | Configures the AI to focus on EDA, feature engineering, and model metrics. |
| **AI Persona: UX Writer** | Instructions for writing clear, concise, and jargon-free microcopy. |
| **Zero-Shot Chain of Thought** | Forces the AI to think step-by-step before answering. |
| **Few-Shot Classification** | Provides examples to guide the AI in sentiment analysis tasks. |
| **Prompt: Summarize** | Structure for summarizing text into a specific number of bullet points. |
| **Prompt: Translate** | Simple template for translation tasks. |

### Software Development
| Template Name | Description |
|---|---|
| **Code Review Checklist** | A standard checklist for reviewing Pull Requests (Logic, Security, Tests). |
| **Bug Report** | Structured format for reporting issues (Repro steps, Expected vs Actual). |
| **User Story (Agile)** | Standard "As a... I want to... So that..." format with acceptance criteria. |
| **Git Commit Message** | Conventional Commits structure (`type(scope): subject`). |
| **Pull Request Template** | Summary, Changes, and Testing checklist for PR descriptions. |
| **React Component (TS)** | Boilerplate for a functional TypeScript React component with CSS modules. |
| **Python Script Header** | Standard docstring header for Python modules. |

### Data Science & Analysis
| Template Name | Description |
|---|---|
| **SQL Select Basic** | A clean `SELECT...FROM...WHERE` template. |
| **Pandas CSV Load** | Python snippet to load a CSV and print basic info (`head`, `info`, `describe`). |
| **Regex Email Pattern** | Robust regex for finding email addresses. |
| **Regex Date (ISO)** | Regex for `YYYY-MM-DD` format. |
| **Regex Phone (US)** | Regex for standard US phone numbers. |

### Web Development
| Template Name | Description |
|---|---|
| **HTML5 Boilerplate** | Standard `index.html` structure with viewport meta tag. |
| **CSS Reset (Mini)** | Lightweight CSS reset for box-sizing and margins. |

### DevOps & Config
| Template Name | Description |
|---|---|
| **Docker Node.js** | Production-ready Dockerfile for Node apps (Alpine based). |
| **Docker Python** | Slim Dockerfile for Python apps. |
| **JSON Config** | Standard config file structure. |
| **YAML Kubernetes Pod** | Basic Pod definition template. |

### Workflows & Docs
| Template Name | Description |
|---|---|
| **Meeting Minutes** | Agenda, attendees, and action items structure. |
| **Daily Standup** | Yesterday, Today, Blockers format. |
| **OKR Goal Setting** | Objective and Key Results framework. |
| **Email: Professional Intro** | Polite introduction email template. |
| **Email: Follow Up** | Gentle follow-up email. |
| **Markdown Table** | Empty Markdown table structure with headers. |
| **Mermaid Flowchart** | Basic syntax for a Top-Down flowchart. |

### MCP & AI Agents
| Template Name | Description |
|---|---|
| **MCP Server (Typescript)** | Complete scaffold for a Model Context Protocol server using `@modelcontextprotocol/sdk`. |
| **MCP Server (Python)** | Boilerplate for a Python MCP server using `fastmcp`. |
| **Agent Skill (YAML)** | Template for defining AI skills in `.agent/skills.yaml`. |
| **Agent Policy** | Template for defining AI constraints in `.agent/policy.md`. |

---

## ⚡ Actions Library

### Text Transformation
| Action Name | Description |
|---|---|
| **To Uppercase** | `UPPER()` - Converts selection to UPPERCASE. |
| **To Lowercase** | `LOWER()` - Converts selection to lowercase. |
| **To Title Case** | `TITLE()` - Capitalizes The First Letter Of Each Word. |
| **Trim Whitespace** | `TRIM()` - Removes leading/trailing spaces. |
| **Reverse Text** | `REVERSE()` - Reverses character order. |

### Coding Case Converters
| Action Name | Description |
|---|---|
| **To Snake Case** | `SNAKE()` - `hello_world` |
| **To Camel Case** | `CAMEL()` - `helloWorld` |
| **To Kebab Case** | `KEBAB()` - `hello-world` |
| **To Pascal Case** | `PASCAL()` - `HelloWorld` |
| **To Constant Case** | `CONSTANT()` - `HELLO_WORLD` |

### Line Operations
| Action Name | Description |
|---|---|
| **Sort Lines (A-Z)** | Sorts selected lines alphabetically. |
| **Sort Lines (Z-A)** | Sorts selected lines in reverse order. |
| **Sort Numeric** | Sorts lines based on numeric value (1, 2, 10 instead of 1, 10, 2). |
| **Remove Duplicates** | `UNIQUE()` - Removes duplicate lines. |
| **Numbered List** | Prefixes lines with `1.`, `2.`, etc. |
| **Bullet List** | Prefixes lines with `-`. |
| **Checklist** | Prefixes lines with `- [ ]`. |

### Formatting & Markdown
| Action Name | Description |
|---|---|
| **CSV to Table** | Converts comma-separated values to a Markdown table. |
| **TSV to Table** | Converts tab-separated values to a Markdown table. |
| **Wrap in Code Block** | Wraps selection in triple backticks. |
| **Wrap in Quotes** | Wraps selection in double quotes. |

### Insert
| Action Name | Description |
|---|---|
| **Insert Date** | Inserts current date (`YYYY-MM-DD`). |
| **Insert Time** | Inserts current time (`HH:MM:SS`). |
| **Insert UUID** | Generates a random v4 UUID. |

### Math & Encode
| Action Name | Description |
|---|---|
| **Math: Sum** | Sums all numbers found in the selection. |
| **Math: Average** | Calculates average of numbers in selection. |
| **Encode Base64** | Encodes text to Base64 string. |
| **Decode Base64** | Decodes Base64 string back to text. |
| **URL Encode** | Encodes special characters for URLs. |

### JavaScript (Advanced)
| Action Name | Description |
|---|---|
| **JS: Extract Emails** | Scans selection for email patterns and replaces text with a list of found emails. |
| **JS: Minify JSON** | Compresses JSON string (removes whitespace). |
| **JS: Format JSON** | Pretty-prints JSON with 2-space indentation. |