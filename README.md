# Bearilly

**Bearilly** is a learning-focused Progressive Web App (PWA) designed to support students through learning, assessment, submission, and AI-assisted educational experiences.

The project was built to explore how a modern web application can combine structured learning workflows with authentication, database integration, form validation, and AI-powered functionality.

## 🚀 Live Application

[View Bearilly](https://bearilly.vercel.app)

## 📸 Screenshots

> Add screenshots of the most important parts of the application here.

![Dashboard](screenshots/dashboard.png)

![Learning](screenshots/learning.png)

![Assessment](screenshots/assessment.png)

---

## 🎯 Project Overview

Bearilly was developed as a practical software engineering project focused on building a modern, scalable web application.

The application combines:

- Student learning workflows
- Assessments
- Submission functionality
- AI-assisted educational features
- User authentication
- Database integration
- Form validation
- Progressive Web App functionality

The project also provided hands-on experience with modern React and TypeScript application architecture.

---

## ✨ Features

### Learning

- Student-focused learning interface
- Structured learning content
- Responsive learning experience

### Assessment

- Assessment workflows
- User submissions
- Form handling and validation

### AI-Assisted Learning

- AI-powered educational functionality
- Integration with the OpenAI API
- AI-assisted interaction within the application

### Authentication & Users

- User authentication
- Protected application areas
- Middleware-based request handling
- Supabase authentication integration

### Progressive Web App

- PWA functionality
- Responsive interface
- Mobile-friendly experience

---

## 🏗️ Application Architecture

```text
                         User
                           │
                           ▼
                    Next.js Application
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
       UI Components   App Routes     Middleware
            │              │              │
            └──────────────┼──────────────┘
                           │
                           ▼
                    Server-side Logic
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
          Supabase                 OpenAI API
              │
       ┌──────┴──────┐
       │             │
       ▼             ▼
 Authentication    Database


---

🛠️ Technology Stack

Technology	Purpose

TypeScript	Application development
Next.js	Full-stack React framework
React	User interface
Tailwind CSS	Styling and responsive UI
Supabase	Authentication and database services
OpenAI API	AI-assisted functionality
Zod	Input validation
React Hook Form	Form management
PWA	Progressive Web App functionality



---

📁 Project Structure

src/
├── app/
│   ├── ...
│
├── components/
│   ├── ...
│
├── hooks/
│   ├── ...
│
├── lib/
│   └── supabase/
│       ├── ...
│
└── middleware.ts

public/
├── ...

The application follows a component-based architecture with application routes, reusable UI components, custom hooks, Supabase integration, and middleware.


---

🔐 Security Considerations

Security was considered throughout the development of the application.

Current security-related practices include:

Authentication handled through Supabase

Input validation using Zod

Protected application routes

Environment variables for sensitive configuration

Sensitive API credentials kept outside the source code

Server-side handling of sensitive operations

Separation of client-side and server-side responsibilities


> Security controls documented here should reflect the controls actually implemented in the application.




---

🧪 Testing

Testing is an area of ongoing improvement for the project.

Current development focuses on validating:

Application functionality

Form behaviour

Authentication flows

User interactions

API integrations


Future development will introduce more automated testing and continuous integration.


---

⚙️ Local Development

Requirements

Before running Bearilly locally, make sure you have:

Node.js

npm

A Supabase project

The required environment variables


Installation

git clone YOUR_GITHUB_REPOSITORY_URL

cd bearilly

npm install

Environment Variables

Create a .env.local file in the project root.

NEXT_PUBLIC_SUPABASE_URL=your_value
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_value
OPENAI_API_KEY=your_value

Never commit real API keys, passwords, tokens, or other secrets to GitHub.

Run the Development Server

npm run dev

The application will be available at:

http://localhost:3000


---

📚 What I Learned

Building Bearilly helped me develop practical experience with:

Building applications with Next.js and TypeScript

Structuring a larger React application

Creating reusable React components

Working with Supabase

Implementing authentication and middleware

Form handling and validation

Integrating AI functionality

Building Progressive Web Applications

Managing environment variables

Working with Git and GitHub

Thinking about application security during development



---

🚧 Future Improvements

Planned improvements include:

Expanded automated testing

CI/CD pipeline

Improved application monitoring

Additional security controls

Performance optimization

Improved error handling

More comprehensive security testing

Further accessibility improvements



---

👨‍💻 Author

Emmanuel

Computer Science Student
Software Engineering | Application Security | Cloud Technologies

GitHub

LinkedIn

Portfolio
