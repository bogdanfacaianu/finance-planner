# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Finance Planner** application focused on personal financial management with shared expense tracking for car rides. The project has a complete React frontend implementation with routing, authentication pages, and is ready for Supabase backend integration.

## Technology Stack

### Frontend
- **React** (Vite template)
- **Tailwind CSS** for styling
- **React Router DOM** for navigation

### Backend (BaaS)
- **Supabase** for authentication, database, and API
- **PostgreSQL** with Row Level Security (RLS)

### Hosting
- **GitHub Pages** for deployment

## Common Commands

### Initial Setup
```bash
npm create vite@latest financial-planner -- --template react
cd financial-planner
npm install
```

### Install Dependencies (Specific Versions)
```bash
npm install @supabase/supabase-js@2.43.4 react-router-dom@6.23.1
npm install -D tailwindcss@3.4.3 postcss@8.4.38 autoprefixer@10.4.19
npx tailwindcss init -p
```

### Development
```bash
npm run dev          # Start development server (http://localhost:5173/financial-planner/)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Deployment
```bash
npm run deploy       # Deploy to GitHub Pages (builds and deploys)
```

## Project Structure

```
financial-planner/
├── public/
│   └── vite.svg
├── src/
│   ├── components/    # Reusable UI components (empty, ready for components)
│   ├── pages/        # Main application pages
│   │   ├── Login.jsx      # Login page with Tailwind styling
│   │   ├── Signup.jsx     # Signup page with Tailwind styling
│   │   └── Dashboard.jsx  # Main dashboard page
│   ├── services/     # API and external service integrations
│   │   └── supabase.js   # Supabase client configuration
│   ├── App.jsx       # Main application component with routing
│   ├── App.css       # Application styles (minimal)
│   ├── index.css     # Tailwind CSS imports
│   └── main.jsx      # React entry point
├── .env             # Environment variables (Supabase keys - needs configuration)
├── .gitignore       # Git ignore file
├── eslint.config.js # ESLint configuration
├── index.html       # HTML template
├── package.json     # Dependencies and scripts
├── postcss.config.js # PostCSS configuration for Tailwind
├── tailwind.config.js # Tailwind CSS configuration
├── vite.config.js   # Vite configuration with GitHub Pages base path
├── CLAUDE.md        # This file
├── README.md        # Project documentation
├── financial_planner_project_plan.md # Implementation plan
└── user-stories.txt # User stories and requirements
```

## Database Schema

### Tables and RLS Setup
Run these SQL commands in Supabase SQL editor:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User data only" ON expenses USING (auth.uid() = user_id);

-- Budgets table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  category TEXT NOT NULL,
  monthly_limit NUMERIC NOT NULL,
  month INT NOT NULL,
  year INT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User data only" ON budgets USING (auth.uid() = user_id);

-- Rides table (shared expenses)
CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session TEXT CHECK(session IN ('MORNING', 'AFTERNOON')) NOT NULL,
  participants JSONB NOT NULL,
  total_cost NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users" ON rides FOR ALL USING (auth.role() = 'authenticated');
```

### Verify RLS Policies
```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

## Supabase Configuration

### Environment Variables (.env)
```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**⚠️ Important Setup**: 
1. Copy `.env.example` to `.env`: `cp .env.example .env`
2. Create a Supabase project at https://supabase.com
3. Get your project URL and anon key from Settings → API
4. Replace the values in `.env` with your actual keys
5. The `.env` file is git-ignored for security - never commit real credentials

### Supabase Client Setup (services/supabase.js)
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## Key Features

### Core Financial Management
- Expense tracking with categories, amounts, dates, and notes
- Monthly budget planning with spending limits and alerts
- Visual reports and analytics for spending patterns

### Shared Expense Tracking
- Car ride expense sharing system
- Support for morning/afternoon sessions with multiple participants
- Monthly shared expense reports with cost breakdown per participant
- Visual breakdowns (bar charts) for ride cost distribution

### Authentication & Security
- Supabase Auth for signup/login/logout/password reset
- User-specific data access with RLS policies
- JWT token-based authentication
- Privacy controls ensuring users only access their own data

## User Stories Reference

The `user-stories.txt` file contains 23 detailed user stories covering:
- Authentication (4 stories)
- Personal Finance Management (4 stories) 
- Budget Planning (3 stories)
- Shared Expenses for Car Rides (3 stories)
- Security & Access Control (3 stories)
- Analytics & Visualization (2 stories)
- Future Enhancements (4 stories)

## Implementation Plan Reference

The `financial_planner_project_plan.md` file contains step-by-step implementation details including:
- Complete technical setup instructions
- Database schema with exact SQL commands
- Authentication implementation examples
- Deployment configuration
- Security verification procedures

## Current Implementation Status

### ✅ Completed
- React project with Vite setup
- Tailwind CSS integration and configuration
- React Router DOM setup with 3 routes (/, /login, /signup)
- Basic page components (Login, Signup, Dashboard) with Tailwind styling
- Supabase client configuration (ready for backend connection)
- GitHub Pages deployment configuration
- Project structure and dependencies

### 🚧 Next Steps
1. **Supabase Setup**: Create project and configure environment variables
2. **Authentication**: Implement login/signup functionality using Supabase Auth
3. **Database**: Run the provided SQL schema in Supabase
4. **Feature Development**: Build expense tracking, budget management, and shared rides features
5. **UI Components**: Create reusable components for forms, tables, charts

### 📝 Development Notes
- Development server runs on `http://localhost:5173/financial-planner/`
- Vite config includes base path `/financial-planner/` for GitHub Pages deployment
- All dependencies are installed with specific versions for stability
- Tailwind CSS is configured and ready for styling
- Components directory is empty and ready for reusable UI components

## Security Notes

- Use only Supabase public anon key in frontend
- Rely on RLS policies for data protection
- Regularly audit and verify RLS policies
- Keep dependencies updated for security patches
- Never commit real Supabase credentials to the repository