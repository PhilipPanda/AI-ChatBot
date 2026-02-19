<p align="center">
  <img src="github/images/banner.png" alt="AI ChatBot" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-1E293B?style=for-the-badge&logo=react&logoColor=white&labelColor=3B82F6" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-1E293B?style=for-the-badge&logo=typescript&logoColor=white&labelColor=3B82F6" />
  <img src="https://img.shields.io/badge/Node.js-18+-1E293B?style=for-the-badge&logo=node.js&logoColor=white&labelColor=3B82F6" />
  <img src="https://img.shields.io/badge/Express-4.21-1E293B?style=for-the-badge&logo=express&logoColor=white&labelColor=3B82F6" />
  <img src="https://img.shields.io/badge/PostgreSQL-14+-1E293B?style=for-the-badge&logo=postgresql&logoColor=white&labelColor=3B82F6" />
  <img src="https://img.shields.io/badge/OpenAI_API-✓-1E293B?style=for-the-badge&logo=openai&logoColor=white&labelColor=3B82F6" />
</p>

---

<p align="center">
  <strong>A modern, full-stack AI chatbot application with vision capabilities, multiple chat modes, and a sleek dark theme interface.</strong>
</p>

---

## ✨ Features

- **Multi-Model Support** — Works with GPT-4, GPT-4o, GPT-4o-mini, and GPT-4.1 models with streaming responses
- **Vision Capabilities** — Upload and analyze images with AI vision models (base64 encoded)
- **Multiple Chat Modes** — Brutally Honest, Creative, Concise, Explain Like I'm 5 (ELI5), and Security Audit modes
- **File Upload Support** — Attach images, PDFs, code files, and documents with inline preview
- **Beautiful Dark Theme** — Modern, responsive UI with smooth animations and blue accent colors
- **Conversation Management** — Save, organize, search, and export your chat history
- **Secure Authentication** — JWT-based auth with encrypted API key storage and refresh tokens
- **Usage Analytics** — Track your token usage and costs with detailed analytics dashboard
- **Real-time Streaming** — Instant response streaming with typing indicators and syntax highlighting
- **Responsive Design** — Works seamlessly on desktop, tablet, and mobile devices

## 📸 Showcase

<p align="center">
  <img src="github/images/showcase.png" alt="AI ChatBot Screenshot" width="900" />
</p>

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org/))
- **PostgreSQL** 14+ or **Docker** & Docker Compose
- **OpenAI API key** with access to GPT models

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/ai-chatbot.git
cd ai-chatbot

# Run the automated setup script
python run.py
```

This script will automatically:
- Check prerequisites (Node.js, Docker)
- Start PostgreSQL via Docker Compose
- Generate secure environment files with random secrets
- Install all npm dependencies
- Set up the database schema
- Start both API and web development servers

### Option 2: Manual Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/ai-chatbot.git
cd ai-chatbot

# Start PostgreSQL using Docker
docker-compose up -d postgres

# Set up environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Install dependencies
npm install

# Set up the database
npm run prisma:generate
npm run prisma:push

# Start development servers
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000

## 🏗️ Architecture

```
ai-chatbot/
├── apps/
│   ├── api/                 # Express.js backend
│   │   ├── src/
│   │   │   ├── routes/      # API routes (auth, chat, conversations)
│   │   │   ├── middleware/  # Auth, rate limiting, error handling
│   │   │   ├── lib/         # Utilities (OpenAI, Prisma, crypto)
│   │   │   ├── services/    # Business logic (usage, tokens)
│   │   │   ├── config/      # Environment configuration
│   │   │   └── utils/       # Helper functions (JWT, NDJSON)
│   │   ├── prisma/          # Database schema and migrations
│   │   ├── package.json
│   │   └── .env.example
│   └── web/                 # React frontend
│       ├── src/
│       │   ├── components/  # React components (ChatComposer, MessageBubble, etc.)
│       │   ├── pages/       # Page components (ChatPage, SettingsPage, etc.)
│       │   ├── lib/         # Utilities, API client, types
│       │   ├── hooks/       # Custom React hooks (useAuth)
│       │   └── styles/      # Global CSS and design tokens
│       ├── public/          # Static assets
│       ├── package.json
│       ├── vite.config.ts
│       └── .env.example
├── docker-compose.yml       # PostgreSQL setup
├── package.json            # Root package.json (workspaces)
├── tsconfig.base.json      # TypeScript configuration
├── run.py                  # Automated setup script
└── README.md               # This file
```

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + TypeScript 5.7 + Vite 6 |
| **Backend** | Node.js 18 + Express 4.21 + TypeScript |
| **Database** | PostgreSQL 14 + Prisma ORM |
| **Authentication** | JWT with refresh tokens + bcrypt |
| **AI Integration** | OpenAI API (GPT-4, GPT-4o, Vision) |
| **UI/UX** | TailwindCSS + Framer Motion + Lucide React |
| **Markdown** | React Markdown + Highlight.js + rehype/remark |
| **State Management** | React Query + Local State |
| **Rate Limiting** | Express Rate Limit |
| **Security** | Helmet + CORS + Content Security Policy |

## 🎨 Chat Modes

AI ChatBot includes multiple personality modes to customize responses:

| Mode | Description | Icon |
|------|-------------|------|
| **Brutally Honest** | Direct, unfiltered responses | 🔥 |
| **Creative** | Imaginative and artistic responses | ✨ |
| **Concise** | Short, to-the-point answers | ⚡ |
| **ELI5** | Explain Like I'm 5 - simple explanations | 💡 |
| **Security Audit** | Security-focused analysis | 🛡️ |

Switch between modes instantly using the mode chips in the chat composer.

## 📎 File Upload Support

Upload and interact with various file types:

- **Images** (PNG, JPG, GIF, WebP, SVG) - Vision analysis with AI
- **Documents** (PDF) - Content extraction and analysis
- **Code Files** (JS, TS, Python, HTML, CSS, JSON, CSV, MD) - Syntax highlighting and analysis
- **Text Files** - Direct content processing

Files are converted to base64 and sent securely to the API for processing.

## 🔧 Configuration

### Environment Variables

**API (.env)**:
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/ai-chatbot"

# Authentication
JWT_SECRET="your-jwt-secret-here"
JWT_REFRESH_SECRET="your-jwt-refresh-secret-here"

# OpenAI
OPENAI_API_KEY="your-openai-api-key-here"

# CORS
CORS_ORIGIN="http://localhost:5173"

# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Web (.env)**:
```env
VITE_API_URL="http://localhost:3000/api"
```

### Supported AI Models

- `gpt-4o` - Best for vision and general use
- `gpt-4o-mini` - Faster, cost-effective option
- `gpt-4.1` - Advanced reasoning
- `gpt-4.1-mini` - Balanced performance

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token

### Chat
- `POST /api/chat/conversations/:id/stream` - Stream chat response with attachments
- `POST /api/chat/conversations/:id/regenerate/:messageId/stream` - Regenerate response

### Conversations
- `GET /api/conversations` - List conversations with pagination
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/:id/messages` - Get conversation history
- `DELETE /api/conversations/:id` - Delete conversation
- `GET /api/conversations/:id/export` - Export conversation (JSON/CSV)

### User & Settings
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

### Analytics
- `GET /api/analytics/usage` - Get usage analytics

## 🚀 Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# For production
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Production Deployment

```bash
# Build the applications
npm run build

# Set up production database
npm run prisma:migrate

# Start the API server
npm --workspace apps/api run start

# Serve the web app
npm --workspace apps/web run preview
```

## 🔒 Security

AI ChatBot follows security best practices:

- **JWT Authentication** - Secure token-based auth with refresh tokens
- **API Key Encryption** - OpenAI API keys stored encrypted in database
- **Rate Limiting** - Configurable rate limits to prevent abuse
- **Input Validation** - Zod schema validation for all API inputs
- **CORS Protection** - Configured CORS for cross-origin requests
- **Helmet Security** - Security headers and CSP policies
- **SQL Injection Prevention** - Prisma ORM with parameterized queries
- **File Upload Security** - Base64 encoding with MIME type validation

## ⌨️ Development Scripts

```bash
# Development
npm run dev              # Start both API and web servers
npm run dev:api          # Start API server only
npm run dev:web          # Start web server only

# Building
npm run build            # Build both applications
npm run build:api        # Build API only
npm run build:web        # Build web only

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:push      # Push schema to database
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio

# Production
npm run start            # Start production API server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for the powerful AI models and vision capabilities
- The React, TypeScript, and Node.js communities
- Prisma team for the excellent ORM
- Everyone who contributes to open source

---

<p align="center">
  Built with ❤️ by the AI ChatBot team
</p>
