# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Finance Planner** application focused on personal financial management with shared expense tracking for car rides. The project has a complete React frontend implementation with Mantine UI components, Domain-Driven Design architecture, and full Supabase backend integration.

## Technology Stack

### Frontend
- **React** (Vite template)
- **Mantine UI** for components and styling
- **React Router DOM** for navigation
- **Tabler Icons** for beautiful icons

### Backend (BaaS)
- **Supabase** for authentication, database, and API
- **PostgreSQL** with Row Level Security (RLS)

### Hosting
- **GitHub Pages** for deployment

## Common Commands

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

## Domain-Driven Design Architecture

The application follows Domain-Driven Design (DDD) principles with clear separation of concerns:

### Project Structure
```
src/
├── app/                          # Application Layer
│   └── pages/                    # Page components that compose domains
│       └── DashboardPage.jsx     # Main dashboard orchestrating expense management
│
├── domains/                      # Domain Layer (Core Business Logic)
│   ├── authentication/           # Authentication Domain
│   │   ├── components/           # Auth-specific UI components
│   │   │   └── LoginPage.jsx     # Login form and password reset
│   │   ├── services/             # Auth business logic
│   │   │   └── AuthService.js    # Authentication operations
│   │   └── types/                # Auth domain types and constants
│   │       └── index.js          # Type definitions and error constants
│   │
│   └── expense-management/       # Expense Management Domain
│       ├── components/           # Expense-specific UI components
│       │   ├── ExpenseForm.jsx   # Add new expense form
│       │   ├── ExpensesList.jsx  # List and filter expenses
│       │   └── ExpenseEditModal.jsx # Edit existing expense
│       ├── services/             # Expense business logic
│       │   └── ExpenseService.js # CRUD operations for expenses
│       ├── types/                # Expense domain types
│       │   └── index.js          # Type definitions and validation
│       └── constants/            # Expense domain constants
│           └── categories.js     # Expense categories and colors
│
└── shared/                       # Shared Infrastructure
    ├── infrastructure/           # External service integrations
    │   └── supabase.js          # Supabase client configuration
    └── ui/                      # Shared UI components
        └── components/          
            └── SupabaseDebug.jsx # Debug component for development
```

### Domain Boundaries

#### Authentication Domain
- User authentication, authorization, and session management
- Login/logout functionality
- Password reset via email
- Session state management
- Auth-specific error handling

#### Expense Management Domain
- Personal expense tracking and financial management
- CRUD operations for expenses
- Category-based organization
- Date-based filtering and search
- Expense summaries and analytics

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

-- Budgets table (future use)
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

-- Rides table (shared expenses - future use)
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

### Supabase Client Location
The Supabase client is now located at `src/shared/infrastructure/supabase.js`

## Mantine UI Configuration

### Theme Configuration
Located in `src/main.jsx` with custom financial color palette:
- **Primary Color**: Blue variations for financial theme
- **Custom Colors**: Financial, success, warning, and expense color palettes
- **Typography**: Inter font family for modern, clean appearance
- **Components**: Custom styling for buttons and cards with rounded corners

### Key Mantine Features Used
- **Form Components**: TextInput, PasswordInput, NumberInput, Select, DateInput, Textarea
- **Layout**: AppShell, Header, Container, Stack, Group, Center
- **Feedback**: Alert, Notifications, Loader, Modal
- **Data Display**: Paper, Card, Badge, Text, Title
- **Actions**: Button, ActionIcon

## Key Features Implemented

### ✅ Authentication System
- **Login/Logout**: Full authentication flow with Supabase
- **Password Reset**: Email-based password reset functionality
- **Session Management**: Automatic session handling and route protection
- **Error Handling**: User-friendly error messages and validation

### ✅ Expense Management System
- **Add Expenses**: Rich form with amount, category, date, and notes
- **View Expenses**: Filterable list with month/year/category filters
- **Edit Expenses**: Modal-based editing with full validation
- **Delete Expenses**: Confirmation dialog with success notifications
- **Categories**: Predefined expense categories with color-coding
- **Summaries**: Total calculations and expense counting

### ✅ User Experience Features
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Loading States**: Professional loading indicators throughout
- **Error Handling**: Comprehensive error messages and validation
- **Notifications**: Toast notifications for user feedback
- **Icons**: Beautiful Tabler Icons throughout the interface
- **Professional Theme**: Custom financial color scheme

## Architectural Benefits

### Domain-Driven Design
- **Clear Separation**: Business logic isolated from UI components
- **Maintainability**: Easy to locate and modify specific functionality
- **Scalability**: New domains can be added without affecting existing ones
- **Testability**: Domain services can be unit tested independently

### Service Layer Pattern
- **AuthService**: Handles all authentication operations
- **ExpenseService**: Manages all expense CRUD operations
- **Error Mapping**: Consistent error handling across domains
- **Type Safety**: Comprehensive JSDoc type definitions

## User Stories Implementation

### Completed User Stories
✅ **Authentication (3/4 stories)**
- User Login - Complete with email/password authentication
- User Logout - Complete with proper session management
- Password Reset - Complete with email-based reset flow
- ❌ User Signup - Removed (manual user creation via Supabase dashboard)

✅ **Personal Finance Management (4/4 stories)**
- Add Expense - Complete with rich form and validation
- View Expenses - Complete with filtering and search
- Edit Expense - Complete with modal-based editing
- Delete Expense - Complete with confirmation and notifications

### Future User Stories (Not Yet Implemented)
- Budget Planning (3 stories)
- Shared Expenses for Car Rides (3 stories)
- Analytics & Visualization (2 stories)
- Advanced Security & Access Control features

## Development Guidelines

### Working with Domain Services
```javascript
import { authService } from '../domains/authentication/services/AuthService'
import { expenseService } from '../domains/expense-management/services/ExpenseService'

// Always handle errors properly
const { data, error } = await expenseService.getExpenses(filters)
if (error) {
  // Handle error appropriately
}
```

### Adding New Components
- **Domain-specific components** go in respective domain folders
- **Shared components** go in `/shared/ui/components`
- **Page components** go in `/app/pages` and compose domain components

### Consistent Error Handling
- Use domain-specific error constants
- Map technical errors to user-friendly messages
- Always return structured responses: `{ data, error }`

## Security Implementation

### Authentication Security
- **JWT Tokens**: Automatic token management via Supabase
- **Row Level Security**: Database-level protection for all user data
- **Session Management**: Proper session handling and automatic refresh
- **Route Protection**: Authentication guards on protected routes

### Data Security
- **User Isolation**: Users can only access their own data
- **Input Validation**: Client and server-side validation
- **Error Sanitization**: No sensitive information in error messages
- **Environment Variables**: Secure configuration management

## Performance Features
- **Lazy Loading**: Components loaded on demand
- **Optimistic Updates**: UI updates before server confirmation where appropriate
- **Efficient Filtering**: Database-level filtering for large datasets
- **Memoization**: React patterns for preventing unnecessary re-renders

## Development Notes
- Development server runs on `http://localhost:5173/financial-planner/`
- Vite config includes base path `/financial-planner/` for GitHub Pages deployment
- All dependencies use specific versions for stability
- Domain architecture documented in `DOMAIN-ARCHITECTURE.md`
- Professional Mantine UI theme with custom financial colors