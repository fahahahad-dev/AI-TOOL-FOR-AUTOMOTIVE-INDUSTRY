# AI Tool for Automotive Industry

An AI-powered Monaco-based IDE for automotive-grade C/C++ development. The system provides MISRA-aware real-time code suggestions, secure project management, and full AI integration using Gemini and Ollama.

---

## 🚀 Features

- **Monaco Editor** – Open and edit C/C++ projects with syntax highlighting and formatting.  
- **Project Management** – Upload projects, manage file/folder structure (create, rename, delete).  
- **AI Assistance** – MISRA-aware code suggestions and code analysis via Gemini & Ollama.  
- **Authentication** – Google & GitHub OAuth login with NextAuth.  
- **Modular Architecture** – Feature-based folders with components, hooks, actions, and types.  
- **Backend APIs** – Node.js & Prisma for project handling, AI requests, and database operations.  

---

## 🧱 Tech Stack

| Layer       | Technology                            |
|------------|--------------------------------------|
| Framework  | Next.js 15 (App Router)               |
| Language   | TypeScript                            |
| Styling    | TailwindCSS                           |
| Editor     | Monaco Editor                         |
| Auth       | NextAuth (Google + GitHub OAuth)      |
| AI         | Gemini & Ollama (local/remote)        |
| Database   | MongoDB Atlas (via Prisma ORM)        |

---

## 📁 Project Structure

```plaintext
.
├── app/
│   ├── (auth)
│   ├── (root)
│   ├── api/
│   ├── dashboard/
│   ├── editor/
│   ├── globals.css
│   └── layout.tsx
├── components/ui/
├── hooks/
├── lib/
├── modules/
│   ├── ai/
│   ├── auth/
│   ├── dashboard/
│   └── editor/
│       ├── actions/
│       ├── components/
│       ├── hooks/
│       ├── libs/
│       └── types/
├── prisma/
├── public/
├── .env.example
└── README.md

```

## 🛠️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/im-mtayyab/FYP---AI-Tool-For-Automotive-Industry.git
cd FYP---AI-Tool-For-Automotive-Industry
```

### 2. Install dependencies
```bash
npm install
# or
yarn install
```

### 3. Set up environment variables
```bash
cp .env.example .env
```

Fill .env with your credentials: DATABASE_URL, AUTH_SECRET, OAuth IDs/secrets, OLLAMA_BASE_URL, etc.

### 4. Prisma setup
```bash
npx prisma generate
npx prisma db push
```

### 5. Run development server
```bash
npm run dev
# or
yarn dev
```