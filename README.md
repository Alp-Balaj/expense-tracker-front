# Expense Tracker - Frontend

This project was built to resolve personal issues in tracking expenses.

## Tech Stack

- React (v19) 
- Vite
- TypeScript
#### UI & Styling
- Shadcn / UI components ([Shadcn](https://ui.shadcn.com/))
- [Tailwind CSS](https://tailwindcss.com/) / Utility classes
#### Forms & Routing
- React Router
- React Hook Form
#### Data & Tables
- Axios
- TanStack Table

## Features

- [User authentication](#authentication) (login & registration)
- Expense, Income, Savings and Future planning management
- Account, Category and Currency management
- Date-based filtering and summaries
- Costumizable table columns
- Responsive UI
- Report generation
- Integration with a REST API backend

## Project Structure
```bash
src/
├── Authorization/     # Authorization and Authentication Logic
├── Components/        # Reusable UI components
├── Enums/             # General Enums
├── Hooks/             # Custom React hooks
├── Models/            # Entity models
├── Pages/             # Application pages
├── Services/          # API communication layer
├── App.tsx
└── main.tsx
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- mkcert (https certificate generator, for cookie usage when running locally)

### Installation

```bash
git clone https://github.com/your-username/expense-tracker-frontend.git
cd expense-tracker-frontend
npm install
mkecrt localhost {ip} ::1
```

### Environment Variables

Create a `.env` (see `.env.example` for reference) file in the root directory:

```ts
VITE_API_BASE_URL = https://{your back end API url}
```

The frontend expects the backend API is running seperately.

### Running the App
```bash
npm run dev
```

## Backend Dependency

This frontend is designed to work with a seperate backend service written in .Net 8.0. You're more than welcome to write your own backend server to run this app.

If instead you choose to use the backend service I developed you can check that out here:
- ***https://github.com/Alp-Balaj/ExpenseTracker***

Make sure the backend is running before using this application.


### Authentication

The application uses a token-based authentication system to securely manage user sessions
and provide user-specific data access.

- **Access tokens (JWT)** are used to authorize API requests and retrieve personalized data
  from a shared database.
- **Refresh tokens** are used to maintain long-lived user sessions without requiring
  frequent re-authentication.
- Access tokens are automatically attached to API requests via a centralized API layer.
- Protected routes are accessible only to authenticated users.
