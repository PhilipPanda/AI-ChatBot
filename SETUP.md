# AI ChatBot - Setup Instructions

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Docker & Docker Compose (optional but recommended)
- OpenAI API key

### Option 1: Automated Setup (Recommended)

1. **Clone and navigate to the project**:
   ```bash
   git clone <repository-url>
   cd ai-chatbot
   ```

2. **Run the setup script**:
   ```bash
   python run.py
   ```
   
   This script will automatically:
   - Check prerequisites (Node.js, Docker)
   - Start PostgreSQL via Docker Compose
   - Generate secure environment files
   - Install all dependencies
   - Set up the database schema
   - Start both API and web development servers

### Option 2: Manual Setup

1. **Start PostgreSQL using Docker**:
   ```bash
   docker-compose up -d postgres
   ```

2. **Set up environment files**:
   ```bash
   # API environment
   cp apps/api/.env.example apps/api/.env
   
   # Web environment  
   cp apps/web/.env.example apps/web/.env
   ```
   
   Edit `apps/api/.env` and add your OpenAI API key:
   ```env
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/ai-chatbot"
   JWT_SECRET="your-jwt-secret-here"
   JWT_REFRESH_SECRET="your-jwt-refresh-secret-here"
   OPENAI_API_KEY="your-openai-api-key-here"
   CORS_ORIGIN="http://localhost:5173"
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Set up the database**:
   ```bash
   npm run prisma:generate
   npm run prisma:push
   ```

5. **Start development servers**:
   ```bash
   npm run dev
   ```

## Access the Application

Once running, you can access:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000

## Development Scripts

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

## Project Structure

```
ai-chatbot/
├── apps/
│   ├── api/                 # Express.js backend
│   │   ├── src/            # Source code
│   │   ├── prisma/         # Database schema
│   │   ├── package.json
│   │   └── .env.example    # Environment template
│   └── web/                 # React frontend
│       ├── src/            # Source code
│       ├── public/         # Static assets
│       ├── package.json
│       └── .env.example    # Environment template
├── docker-compose.yml       # PostgreSQL setup
├── package.json            # Root package.json (workspaces)
├── run.py                  # Automated setup script
└── README.md               # This file
```

## Environment Variables

### API (.env)
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/ai-chatbot"

# Authentication
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# CORS
CORS_ORIGIN="http://localhost:5173"

# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Web (.env)
```env
VITE_API_URL="http://localhost:3000/api"
```

## Features

- 🤖 Multi-model AI chat (GPT-4, GPT-4o, GPT-4o-mini, GPT-4.1)
- 👁️ Image upload and vision analysis
- 🎨 Multiple chat modes (Creative, Concise, ELI5, etc.)
- 📎 File upload support (PDFs, code, documents)
- 🌙 Beautiful dark theme UI
- 💾 Conversation management
- 🔐 Secure authentication
- 📊 Usage analytics
- 🚀 Real-time streaming

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running: `docker-compose ps`
- Check DATABASE_URL in apps/api/.env
- Verify database exists: `docker-compose exec postgres psql -U postgres -l`

### Port Conflicts
- Default ports: API (3000), Web (5173), PostgreSQL (5432)
- Change ports in docker-compose.yml if needed

### API Key Issues
- Verify OpenAI API key is valid and has credits
- Check OPENAI_API_KEY in apps/api/.env

### Build Issues
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear build cache: `npm run build -- --clean`

## Production Deployment

For production deployment:

1. **Set production environment variables**
2. **Build applications**: `npm run build`
3. **Use production Docker setup** or deploy to your preferred platform
4. **Set up reverse proxy** (nginx, Caddy, etc.)
5. **Configure SSL certificates**

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review logs for error messages
3. Ensure all prerequisites are installed
4. Verify environment variables are correctly set

---

Made with ❤️ for the AI community
