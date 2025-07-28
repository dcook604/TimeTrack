# Timetracker - Employee Time Management System

A comprehensive time tracking and vacation management system for Canadian businesses, built with Next.js, TypeScript, and PostgreSQL.

## 🚀 Features

- **Time Tracking**: Weekly timesheet creation and management
- **Vacation Management**: Request and approve time off
- **Role-Based Access**: Employee, Manager, and Admin roles
- **Email Notifications**: Automated notifications for approvals
- **Canadian Compliance**: Built for Canadian labor laws and provinces

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT with HTTP-only cookies
- **UI Components**: Radix UI with custom styling
- **Email**: Nodemailer for notifications

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd Timetracker
npm install
```

### 2. Database Setup

#### Option 1: Automated Setup (Recommended)
```bash
# Install PostgreSQL
npm run postgres:install

# Set up database and user
npm run postgres:setup

# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed
```

#### Option 2: Manual Setup
```bash
# Set up PostgreSQL database
npm run db:setup

# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed
```

### 3. Environment Configuration

Create a `.env` file based on `.env.example`:

```env
# Database
DATABASE_URL="postgresql://timetracker:timetracker123@localhost:5432/timetracker"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@timetracker.com"

# Context7 Configuration (for MCP)
CONTEXT7_API_KEY="your-context7-api-key-here"
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 🔐 Default Users

After seeding the database, you can log in with:

- **Admin**: `admin@timetracker.local` / `admin123`
- **Manager**: `manager@timetracker.local` / `manager123`

## 📚 Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [MCP Setup](./MCP_SETUP.md) - Model Context Protocol configuration
- [Database Schema](./prisma/schema.prisma) - Database structure

## 🏗️ Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── api/            # API routes
│   ├── login/          # Authentication pages
│   └── register/       # Registration pages
├── components/         # React components
│   ├── dashboard/      # Dashboard components
│   ├── layout/         # Layout components
│   ├── timesheets/     # Timesheet components
│   ├── vacation/       # Vacation components
│   └── ui/            # Reusable UI components
├── contexts/          # React contexts
├── lib/              # Utility libraries
└── types/            # TypeScript type definitions
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:setup` - Set up database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed sample data
- `npm run db:studio` - Open Prisma Studio
- `npm run db:reset` - Reset database and seed

## 🤖 MCP Integration

This project includes Model Context Protocol (MCP) integration with Context7 and Coolify for enhanced AI assistance.

### Setup MCP Configuration

1. **Copy the template file:**
   ```bash
   cp mcp.example.json mcp.json
   ```

2. **Configure your tokens:**
   - Get your Context7 API key from [Context7](https://context7.com)
   - Get your Coolify token from your Coolify dashboard
   - Update the values in `mcp.json`

3. **Example configuration:**
   ```json
   {
     "mcpServers": {
       "context7": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-context7"],
         "env": {
           "CONTEXT7_API_KEY": "your-context7-api-key"
         }
       },
       "coolify": {
         "command": "npx",
         "args": ["-y", "coolify-mcp-server"],
         "env": {
           "COOLIFY_BASE_URL": "http://your-coolify-instance:8000/",
           "COOLIFY_TOKEN": "your-coolify-token"
         },
         "disabled": false,
         "autoApprove": []
       }
     }
   }
   ```

**Note:** `mcp.json` is not tracked in Git for security reasons. See [MCP_SETUP.md](./MCP_SETUP.md) for detailed configuration instructions.

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch
```

## 📦 Deployment

### Docker (Recommended for Coolify)

The application is configured for Docker deployment with production-ready optimizations.

#### Local Testing

```bash
# Test Docker build
npm run docker:test

# Build Docker image
npm run docker:build

# Run with docker-compose (includes PostgreSQL)
docker-compose up --build
```

#### Production Deployment

For production deployment to Coolify:

1. **Prerequisites**: Ensure you have a PostgreSQL database
2. **Environment Variables**: Set all required environment variables
3. **Deploy**: Follow the complete guide in [DEPLOYMENT.md](./DEPLOYMENT.md)

### Vercel (Alternative)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Docker

```bash
# Build Docker image
docker build -t timetracker .

# Run container
docker run -p 3000:3000 timetracker
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the [API Documentation](./API_DOCUMENTATION.md)
- Review the [MCP Setup Guide](./MCP_SETUP.md)
- Open an issue on GitHub

## 🗺️ Roadmap

- [ ] Real-time notifications
- [ ] Mobile app
- [ ] Advanced reporting
- [ ] Integration with payroll systems
- [ ] Multi-language support

