
# Financial Planner Project Plan

## 🚩 Step 1: Define Project Scope

Initial scope includes:
- Authentication (Supabase Auth)
- Personal finance tracking (expenses, budgeting)
- Shared car ride expenses
- Security (RLS via Supabase)

---

## 🚩 Step 2: Technical Stack

### Frontend
- **React** (Vite or CRA)
- **Tailwind CSS**

### Backend (BAAS)
- **Supabase**
  - Authentication
  - PostgreSQL (RLS)

### Hosting
- **GitHub Pages**

### Future integrations
- Backend service (Render), Supabase JWT Auth

---

## 🚩 Step 3: Repository Structure

```
financial-planner/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   │   └── supabase.js
│   └── App.jsx
├── .env
├── package.json
└── README.md
```

---

## 🚩 Step 4: Practical Setup Steps

### ① Create GitHub Repository
- Name: `financial-planner`
- Visibility: Private

### ② Initialize React Project
```bash
npm create vite@latest financial-planner -- --template react
cd financial-planner
npm install
```

### ③ Install Dependencies
Use the following explicitly defined versions for stability and compatibility:

```bash
npm install @supabase/supabase-js@2.43.4 react-router-dom@6.23.1
npm install -D tailwindcss@3.4.3 postcss@8.4.38 autoprefixer@10.4.19
npx tailwindcss init -p
```

### ④ Set up Supabase Client

File: `services/supabase.js`
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

`.env`
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_public_anon_key
```

### ⑤ Setup Supabase Project
- Create tables: `expenses`, `budgets`, `rides` with RLS policies

Example RLS:
```sql
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User data only" ON expenses USING (auth.uid() = user_id);
```

### Database Schema Setup (Explicit)

Run these SQL statements precisely as provided:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

---

## 🚩 Step 5: Initial Frontend Development

### Pages
- Login.jsx, Signup.jsx, Dashboard.jsx, Expenses.jsx, Budget.jsx, Rides.jsx

### Routing (`App.jsx`):
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </BrowserRouter>
  )
}
```

### Authentication Example:
```jsx
import { supabase } from '../services/supabase'

async function handleLogin(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    console.error('Error logging in:', error)
  }
}
```

---

## 🚩 Step 6: Deploy on GitHub Pages

```bash
npm install gh-pages --save-dev
```

Update `package.json`:
```json
"scripts": {
  "deploy": "vite build && gh-pages -d dist"
},
```

Deploy:
```bash
npm run deploy
```

---

## 🚩 Step 7: Future Plans

- Backend microservice (Render, Supabase JWT auth)
- External API integrations (Monzo, Open Banking)

---

## 🚩 Step 8: Maintenance & Security

- Keep dependencies updated
- Verify RLS policies
- Regularly audit security

### RLS Policy Verification (Explicit)
Periodically verify RLS policies explicitly with these SQL commands:

```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

Ensure each table (`expenses`, `budgets`, `rides`) has clearly defined RLS policies.

---

## 📌 README Example

```markdown
# Financial Planner App

React + Supabase (RLS/Auth)

## Features
- Expense and budget tracking
- Shared car-ride expenses
- Secure authentication

## Setup Instructions
1. Clone repo
2. `npm install`
3. Set Supabase credentials in `.env`
4. Run: `npm run dev`
5. Deploy: `npm run deploy`

## Technologies
- React (Vite)
- Supabase (Postgres/Auth/RLS)
- GitHub Pages
```
