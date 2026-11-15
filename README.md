#  Portfolio - Next.js & Supabase Full-Stack Web App

> A modern, full-stack content publishing and community web application built with Next.js and Supabase, featuring Role-Based Access Control (Admin/User/gust), cloud media storage, customizable profiles, and a sleek Dark Mode UI.

 **Live Demo:** https://mustafa-portfolio-brown.vercel.app/

---

## Preview

| Light / Dark Mode UI | Admin Dashboard & Publishing |<img width="1273" height="633" alt="Capture2" src="https://github.com/user-attachments/assets/a20acd88-1d02-47d6-b0b9-4153de687479" />

<img width="1321" height="623" alt="Capture" src="https://github.com/user-attachments/assets/c0a7bbf4-54a5-4e02-9a4d-77dcdc9073bb" />

---

##  Key Features

-  **Authentication & Role-Based Access (RBAC):** Secure user authentication with distinct **Admin** and **User** roles and protected routes.
-  **Content Publishing & Management:** Full CRUD functionality allowing authorized users to create, edit, and manage posts seamlessly.
-  **Supabase Storage & Database:** Fast PostgreSQL database integration with Row Level Security (RLS) policies and cloud media uploads via Supabase Storage.
-  **User Profiles & Settings:** Customizable user profiles, avatars, and account preferences.
-  **Modern UI & Dark Mode:** Clean, responsive user interface crafted with Tailwind CSS, featuring smooth Dark/Light theme switching.

---

##  Tech Stack

- **Framework:** Next.js (App Router), React, TypeScript / JavaScript
- **Styling & UI:** Tailwind CSS, DaisyUI (Dark/Light Mode support)
- **Backend & BaaS:** Supabase (PostgreSQL Database, Auth, Storage, RLS)
- **Deployment:** Vercel

---

##  Quick Start

1. **Clone & Install:**
   ```bash
   git clone https://github.com/M-01IQ/Portfolio.git
   cd Portfolio
   npm install

  Environment Variables:
Create a .env.local file in the root directory and add your Supabase credentials:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

Run Development Server:

Bash
npm run str
or
npm run dev
Open http://localhost:3000 in your browser.

Author
Portfolio: https://mustafa-portfolio-brown.vercel.app/
GitHub: @M-01IQ
