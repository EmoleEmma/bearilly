# Bearilly

A learning-focused Progressive Web App designed to support
students through learning, assessment, submission, and
AI-assisted educational features.

## 🚀 Live Application

[View Bearilly](https://bearilly.vercel.app) 

## 📸 Screenshots

![Dashboard](screenshots/dashboard.png)

![Learning](screenshots/learning.png)

![Assessment](screenshots/assessment.png)

## 🎯 Project Overview

Bearilly was built to explore how modern web applications
can combine learning workflows, assessments, submissions,
and AI-assisted functionality in a single platform.

The project focuses on building a practical, scalable
application using modern TypeScript and React technologies.

## ✨ Features

- Student learning interface
- Learning content management
- Assessment functionality
- Submission workflows
- AI-assisted learning features
- Responsive user interface
- Progressive Web App capabilities
- Form validation
- Authentication and user management

## 🏗️ Architecture

```text
User
  │
  ▼
Next.js Application
  │
  ├── UI Components
  │
  ├── Application Routes
  │
  ├── Middleware
  │
  └── Server-side Logic
          │
          ▼
       Supabase
          │
          ├── Authentication
          └── Database
          
          │
          ▼
       OpenAI API
🛠️ Technology Stack

Technology
Purpose
TypeScript
Application development
Next.js
Web application framework
React
User interface
Tailwind CSS
Styling
Supabase
Database and authentication
OpenAI API
AI-assisted functionality
Validation
React Hook Form
Form management
PWA
Progressive web application

📁 Project Structure
src/
├── app/
├── components/
├── hooks/
├── lib/
│   └── supabase/
└── middleware.ts

🔐 Security Considerations
Authentication handled through Supabase
Input validation using Supabase
Protected application routes
Environment variables used for sensitive configuration
Server-side handling of sensitive operations

🧪 Testing
Describe the tests currently implemented here.

⚙️ Local Development
Requirements
Node.js
npm
Supabase project
Required environment variables

Installation
git clone https://github.com/EmoleEmma/bearilly.git

cd bearilly

npm install

Environment Variables
Create a .env.local file:
NEXT_PUBLIC_SUPABASE_URL=your_value
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_value
OPENAI_API_KEY=your_value

Never commit real credentials.
Run the application
npm run dev
Open:
http://localhost:3000

📚 What I Learned
Building applications with Next.js and TypeScript
Structuring a larger React application
Working with Supabase
Authentication and middleware
Form validation
Integrating AI functionality
Building Progressive Web Applications

🚧 Future Improvements
Automated testing
CI/CD pipeline
Improved monitoring
Additional security controls
Performance optimization

👨‍💻 Author
Emmanuel
Computer Science Student | Software Engineering | Application Security

.[GitHub](https://github.com/EmoleEmma)
.[LinkIn](https://www.linkedin.com/in/chibuikem-emole-b115113a2) 
