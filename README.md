# Bearilly

**Bearilly** is a learning-focused Progressive Web App (PWA) designed to support students through learning, assessment, submission, and AI-assisted educational experiences.

The project explores how modern web technologies can be combined to build a practical learning platform with authentication, database integration, form validation, and AI-powered functionality.

## 🚀 Live Application

[Visit Bearilly](https://bearilly.vercel.app)

## 📸 Screenshots

Screenshots of the application can be added here.

```text
screenshots/
├── dashboard.png
├── learning.png
└── assessment.png
```

## 🎯 Project Overview

Bearilly was built as a practical software engineering project.

The application combines:

- Learning workflows
- Assessments
- Submission functionality
- AI-assisted educational features
- User authentication
- Database integration
- Form validation
- Progressive Web App functionality

The project provided hands-on experience with modern React, TypeScript, Next.js, Supabase, and API integration.

## ✨ Features

### 📚 Learning

- Student-focused learning interface
- Structured learning content
- Responsive learning experience

### 📝 Assessment

- Assessment workflows
- User submissions
- Form handling and validation

### 🤖 AI-Assisted Learning

- AI-powered educational functionality
- OpenAI API integration
- AI-assisted interaction within the application

### 🔐 Authentication

- User authentication
- Protected application areas
- Middleware-based request handling
- Supabase authentication integration

### 📱 Progressive Web App

- PWA functionality
- Responsive interface
- Mobile-friendly experience

## 🏗️ Application Architecture

```text
User
  │
  ▼
Next.js Application
  │
  ├── UI Components
  │
  ├── App Routes
  │
  └── Middleware
          │
          ▼
  Server-side Application Logic
          │
     ┌────┴─────┐
     │          │
     ▼          ▼
  Supabase   OpenAI API
     │
 ┌───┴──────────┐
 │              │
 ▼              ▼
Authentication  Database
```

### Architecture Overview

- **Next.js** provides the application framework and routing.
- **React** powers the user interface and reusable components.
- **TypeScript** provides type-safe application development.
- **Middleware** handles request-level processing and protected routes.
- **Supabase** provides authentication and database services.
- **OpenAI API** provides AI-assisted functionality.
- **Server-side logic** handles operations that should not be exposed directly to the client.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| TypeScript | Type-safe application development |
| Next.js | Full-stack React framework |
| React | User interface |
| Tailwind CSS | Styling and responsive UI |
| Supabase | Authentication and database services |
| OpenAI API | AI-assisted functionality |
| Zod | Input validation |
| React Hook Form | Form management |
| PWA | Progressive Web App functionality |

## 📁 Project Structure

```text
src/
├── app/
├── components/
├── hooks/
├── lib/
│   └── supabase/
└── middleware.ts

public/
└── ...
```

The project uses a component-based structure with application routes, reusable UI components, custom hooks, Supabase integration, and middleware.

## 🔐 Security Considerations

Security has been considered throughout the development of Bearilly.

Current security-related practices include:

- Authentication handled through Supabase
- Input validation using Zod
- Protected application routes
- Environment variables for sensitive configuration
- API credentials kept outside the source code
- Server-side handling of sensitive operations
- Separation of client-side and server-side responsibilities

> **Note:** Security documentation should describe controls that are actually implemented in the application.

## 🧪 Testing

Testing and validation currently focus on:

- Application functionality
- Form behaviour
- Authentication flows
- User interactions
- API integrations

Future development will expand automated testing and introduce continuous integration.

## ⚙️ Local Development

### Requirements

Before running Bearilly locally, you will need:

- Node.js
- npm
- A Supabase project
- Required environment variables

### Installation

```bash
git clone https://github.com/EmoleEmma/bearilly.git
cd bearilly
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_value
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_value
OPENAI_API_KEY=your_value
```

**Never commit real API keys, passwords, tokens, or other secrets to GitHub.**

### Run the Development Server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

## 📚 What I Learned

Through Bearilly, I gained practical experience with:

- Building applications with Next.js and React
- TypeScript-based development
- Component-based architecture
- Authentication and database integration
- Form management and validation
- API integration
- Progressive Web App development
- Structuring a larger software project
- Separating client-side and server-side responsibilities

## 🚧 Future Improvements

Planned improvements include:

- Expanded automated testing
- Improved accessibility
- Additional security testing
- More robust error handling
- Improved monitoring and logging
- Additional learning features
- Continuous integration and deployment improvements

## 👨‍💻 Author

**Emmanuel Emole**

Computer Science Student | Software Engineering | Application Security

- GitHub: [EmoleEmma](https://github.com/EmoleEmma)
- LinkedIn: [Emmanuel Emole](https://www.linkedin.com/in/chibuikem-emole-b115113a)

---

⭐ If you find the project interesting, feel free to explore the repository.
