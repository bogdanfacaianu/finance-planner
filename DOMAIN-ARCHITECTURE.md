# Domain-Driven Design Architecture

This document outlines the Domain-Driven Design (DDD) architecture implemented in the Financial Planner application.

## 🏗️ Directory Structure

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

## 🎯 Domain Boundaries

### Authentication Domain
**Responsibility**: User authentication, authorization, and session management

**Components**:
- `LoginPage` - Handles user login and password reset flows
- `AuthService` - Manages authentication state and operations

**Key Features**:
- Email/password authentication
- Password reset via email
- Session management
- Auth state change listeners
- Error mapping for user-friendly messages

### Expense Management Domain
**Responsibility**: Personal expense tracking and financial management

**Components**:
- `ExpenseForm` - Create new expense entries
- `ExpensesList` - Display, filter, and manage expenses
- `ExpenseEditModal` - Edit existing expense entries
- `ExpenseService` - Handle all expense CRUD operations

**Key Features**:
- CRUD operations for expenses
- Category-based organization
- Date-based filtering
- Expense summaries and analytics
- Data validation and error handling

## 🏛️ Architectural Layers

### 1. Domain Layer (`/domains`)
- **Pure business logic** independent of UI frameworks
- **Domain services** that encapsulate business rules
- **Type definitions** and validation rules
- **Constants** and business-specific configurations

### 2. Application Layer (`/app`)
- **Orchestrates** domain services and components
- **Manages** application state and user flows  
- **Composes** domain components into complete pages
- **Handles** cross-domain interactions

### 3. Infrastructure Layer (`/shared/infrastructure`)
- **External integrations** (Supabase, APIs)
- **Configuration** and environment setup
- **Technical concerns** separated from business logic

### 4. Presentation Layer (`/shared/ui`)
- **Reusable UI components** not tied to specific domains
- **Design system components**
- **Development utilities**

## 🔄 Data Flow

1. **UI Component** triggers action (e.g., user submits expense form)
2. **Domain Service** receives request and validates business rules
3. **Infrastructure** handles external API calls (Supabase)
4. **Domain Service** processes response and returns structured data
5. **UI Component** updates based on service response

## 🛡️ Benefits of This Architecture

### Separation of Concerns
- **Business logic** isolated from UI implementation
- **Easy testing** of domain services independently
- **Technology agnostic** domain layer

### Maintainability
- **Clear boundaries** between different responsibilities  
- **Focused modules** that are easier to understand and modify
- **Consistent patterns** across all domains

### Scalability
- **New domains** can be added without affecting existing ones
- **Domain services** can be reused across different UI components
- **Infrastructure changes** don't impact business logic

### Team Collaboration
- **Domain experts** can focus on business logic in services
- **UI developers** can work on components independently
- **Clear interfaces** between layers reduce integration issues

## 📋 Conventions

### File Naming
- **PascalCase** for components and services (e.g., `AuthService.js`)
- **camelCase** for utility files (e.g., `categories.js`)
- **Descriptive names** that indicate purpose (e.g., `ExpenseEditModal.jsx`)

### Service Layer
- **Singleton pattern** for domain services (export single instance)
- **Async/await** for all asynchronous operations
- **Consistent error handling** with domain-specific error types
- **JSDoc comments** for all public methods

### Type Definitions
- **JSDoc typedef** for complex objects
- **Enum-like objects** for constants (e.g., `AuthState`, `ExpenseErrors`)
- **Validation rules** exported as constants

### Component Organization
- **Domain-specific components** in respective domain folders
- **Shared components** in `/shared/ui/components`
- **Page components** in `/app/pages` that compose domain components

## 🚀 Getting Started

1. **Domain Services**: Start by understanding the service classes in each domain
2. **Type Definitions**: Review the type definitions to understand data structures
3. **Components**: Examine how components use domain services
4. **Page Composition**: See how pages orchestrate multiple domain components

This architecture provides a solid foundation for scaling the Financial Planner application while maintaining clean, testable, and maintainable code.