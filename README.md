<h1 align="center">AI ChatBot</h1>
<p align="center">
<img src="https://img.shields.io/github/downloads/yourusername/ai-chatbot/total?style=for-the-badge&label=Downloads&color=3b82f6&labelColor=1e293b">
<img src="https://img.shields.io/badge/TypeScript-3178c6?style=for-the-badge&labelColor=1e293b&logo=typescript">
<img src="https://img.shields.io/badge/React-61dafb?style=for-the-badge&labelColor=1e293b&logo=react">
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&labelColor=1e293b&logo=node.js">
<img src="https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&labelColor=1e293b&logo=postgresql">
</p>

---
### A modern, full-stack AI chatbot application with vision capabilities, multiple chat modes, and a sleek dark theme interface.
---

## ✨ Features

- 🤖 **Multi-Model Support** - Works with GPT-4, GPT-4o, GPT-4o-mini, and GPT-4.1 models
- 👁️ **Vision Capabilities** - Upload and analyze images with AI vision models
- 🎨 **Multiple Chat Modes**:
  - Brutally Honest
  - Creative
  - Concise
  - Explain Like I'm 5 (ELI5)
  - Security Audit
- 📎 **File Upload Support** - Attach images, PDFs, code files, and documents
- 🌙 **Beautiful Dark Theme** - Modern, responsive UI with smooth animations
- 💾 **Conversation Management** - Save, organize, and export your chat history
- 🔐 **Secure Authentication** - JWT-based auth with encrypted API key storage
- 📊 **Usage Analytics** - Track your token usage and costs
- 🚀 **Real-time Streaming** - Instant response streaming with typing indicators

## 🏗️ Architecture

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS + Framer Motion
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL
- **AI**: OpenAI API with vision support
- **Deployment**: Docker Compose ready

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Docker & Docker Compose (optional but recommended)
- OpenAI API key

### Option 1: Automated Setup (Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/ai-chatbot.git
   cd ai-chatbot
   ```

2. **Run the setup script**:
   ```bash
   python run.py
   ```
   
   This script will:
   - Check prerequisites (Node.js, Docker)
   - Start PostgreSQL via Docker Compose
   - Generate secure environment files
   - Install dependencies
   - Set up the database
   - Start both API and web servers

### Option 2: Manual Setup

1. **Start PostgreSQL**:
   ```bash
   docker-compose up -d postgres
   ```

2. **Set up environment files**:
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```
   
   Configure your `apps/api/.env` with your OpenAI API key and JWT secrets.

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Set up the database**:
   ```bash
   npm run prisma:generate
   npm run prisma:push
   ```

5. **Start the development servers**:
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:5173
- API: http://localhost:3000

## 📁 Project Structure

```
ai-chatbot/
├── apps/
│   ├── api/                 # Express.js backend
│   │   ├── src/
│   │   │   ├── routes/      # API routes
│   │   │   ├── middleware/  # Auth, rate limiting
│   │   │   ├── lib/         # Utilities (OpenAI, Prisma)
│   │   │   └── services/    # Business logic
│   │   ├── prisma/          # Database schema
│   │   └── package.json
│   └── web/                 # React frontend
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── pages/       # Page components
│       │   ├── lib/         # Utilities, API client
│       │   └── styles/      # Global CSS
│       └── package.json
├── docker-compose.yml       # PostgreSQL setup
├── package.json            # Root package.json (workspaces)
└── run.py                  # Automated setup script
```

## 🎨 UI Showcase

### Chat Interface
- Clean, modern dark theme with blue accents
- Smooth animations and transitions
- Responsive design for all screen sizes
- Real-time typing indicators
- Message streaming with syntax highlighting

### Chat Modes
- One-click mode switching with visual indicators
- Each mode applies a specific personality to responses
- Mode chips with intuitive icons (Flame, Sparkles, Zap, Lightbulb, Shield)

### File Upload
- Drag & drop or click to upload
- Support for images, PDFs, code files, and documents
- Visual attachment previews
- Base64 encoding for secure transmission

## 🔧 Configuration

### Environment Variables

**API (.env)**:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ai-chatbot"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"
CORS_ORIGIN="http://localhost:5173"
```

**Web (.env)**:
```env
VITE_API_URL="http://localhost:3000/api"
```

### Supported Models

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
- `POST /api/chat/conversations/:id/stream` - Stream chat response
- `POST /api/chat/conversations/:id/regenerate/:messageId/stream` - Regenerate response

### Conversations
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `DELETE /api/conversations/:id` - Delete conversation

## 🚀 Deployment

### Docker Deployment

1. **Build and run with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

2. **For production**, update the environment variables and use:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Manual Production Deployment

1. **Build the applications**:
   ```bash
   npm run build
   ```

2. **Set up production database**:
   ```bash
   npm run prisma:migrate
   ```

3. **Start the API server**:
   ```bash
   npm --workspace apps/api run start
   ```

4. **Serve the web app**:
   ```bash
   npm --workspace apps/web run preview
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

- OpenAI for the powerful AI models
- The React and TypeScript communities
- Everyone who contributes to open source

---

<p align="center">
  Made with ❤️ by the AI ChatBot team
</p>
