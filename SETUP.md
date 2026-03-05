# PropConnect — Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or bun

---

## 1. Install dependencies

```bash
cd "whatsapp broker"
npm install
```

---

## 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:
- `DATABASE_URL` — your PostgreSQL connection string
- `JWT_SECRET` — random string (min 32 chars)
- `JWT_REFRESH_SECRET` — another random string

For local dev, you can leave SMS/AWS/Razorpay fields blank.
OTP is logged to console in development mode.

---

## 3. Set up database

```bash
# Push schema to database
npm run db:push

# Generate Prisma client
npm run db:generate

# Seed with sample data
npm run db:seed
```

---

## 4. Run development server

```bash
npm run dev
```

Open [Build Real Estate Deal Exchange App and Act as a senior app developers with 15+ years of experience building scalable growth-driven platforms at global technology companies. Design and develop a high-performance, end-to-end encrypted web application and mobile responsive app for real estate brokers, developer, property oweners and investors to exchange property information and close deals efficiently.

⸻

1. Product Vision

Build a secure, WhatsApp-like theme, communication and deal-sharing platform tailored for the real estate ecosystem. The app must prioritize:
	•	Simplicity (intuitive UI similar to WhatsApp)
	•	End-to-end encryption for trust and confidentiality
	•	High scalability (architecture capable of handling millions of users)
	•	Fast performance with optimized API and database design
	•	Growth-driven distribution mechanisms for broker network expansion

⸻

2. User Roles
	•	Super Admin
	•	Admin
	•	Real Estate Developers
	•	Investors
	•	Brokers

Each user must have a profile with:
	•	Contact details
	•	Company details
	•	Active subscription plan
	•	Deal usage count
	•	Verification status

⸻

3. Core Architecture Requirements
	•	End-to-end encrypted messaging system
	•	Scalable cloud infrastructure (microservices-based architecture preferred)
	•	Optimized request handling (CDN + caching + queue system)
	•	Secure authentication (OTP + JWT/session management)
	•	Role-based access control
	•	Admin-controlled publishing workflow for developer projects
	•	High-availability database with indexing optimized for property matchmaking

⸻

4. Admin Panel

Create a powerful web-based admin dashboard with:
	•	User management (activate, suspend, verify users)
	•	Subscription plan control
	•	Deal usage tracking
	•	Approval system for developer project listings (only approved projects go live)
	•	Analytics dashboard (active users, listings, deal flow, conversions)
	•	Revenue and subscription reports
	•	Content moderation tools

⸻

Functional Modules

⸻

Module 1: Property Listing & Deal Matchmaking

A. Listing System

Allow users to list:
	•	Land for projects
	•	Farmlands
	•	Weekend homes
	•	Villas
	•	Industrial land
	•	Warehouses
	•	Godowns
	•	Farmhouses
	•	Apartments
	•	Bungalows
	•	Barter deal properties

Each listing must include:
	•	Standardized property card layout
	•	Image poster (auto-generated template option)
	•	Basic property details (location, price, size, deal type, description)
	•	Contact button
	•	Share button (direct WhatsApp share capability)

B. Smart Search & Matchmaking
	•	Search bar with filters (location, price range, type of property, deal type)
	•	AI-based matching engine
	•	Match recommendations based on user preferences and past behavior

When a perfect match is found:
	•	Auto-trigger WhatsApp message draft
	•	In-app push notification
	•	“Express Interest” button

C. Shareable Landing Pages
	•	Auto-generated responsive landing pages for each property
	•	Shareable on social media platforms
	•	Overlay with broker contact details
	•	Lead capture form integrated with CRM

⸻

Module 2: Digital Content & AI Tools
	•	Sharing of posters and Instagram-style video reels
	•	In-app media gallery
	•	AI-powered property card generation
	•	AI poster creation using listing data
	•	Branded templates for developers and brokers
	•	One-click social media sharing

⸻

Module 3: Lead Management & CRM
	•	Built-in CRM linked to:
	•	Specific deals
	•	Property listings
	•	Developer projects
	•	Lead status tracking (New, Follow-up, Negotiation, Closed, Lost)
	•	Reminder and follow-up system
	•	Lead assignment to brokers
	•	Activity logs
	•	Deal performance dashboard

⸻

Module 4: Messaging & Network Requests
	•	WhatsApp-like chat interface
	•	End-to-end encrypted messaging
	•	File sharing (images, documents, brochures)
	•	Deal request feature
	•	Property inquiry request system
	•	Push notifications
	•	Network connection requests between users

⸻

5. Growth & Distribution Features
	•	Referral system for brokers
	•	Invite via WhatsApp
	•	Incentive-based deal credits
	•	Viral property sharing links
	•	Broker ranking system
	•	Deal success badges
	•	Limited-time boosted listings

⸻

6. Subscription & Monetization Model

Freemium Model:
	•	Free Tier:
	•	Access to browse listings
	•	Up to 5 deal interactions free
	•	After 5 deals:
	•	Mandatory subscription upgrade
	•	Paid Plans:
	•	Monthly and yearly plans
	•	Higher deal limits
	•	Premium listing boost
	•	Advanced analytics
	•	CRM enhancements

Admin must be able to:
	•	Create/edit subscription plans
	•	Modify deal limits
	•	Offer promotional plans

⸻

7. Performance & Scalability Goals
	•	Architecture designed for 1M+ users
	•	Low-latency search response
	•	Optimized matchmaking engine
	•	Scalable cloud storage for media
	•	Horizontal scaling capability
	•	Background job processing for notifications and AI content generation

⸻

8. Security & Trust Layer
	•	End-to-end encryption for chats
	•	Secure storage of user data
	•	Activity monitoring and fraud detection
	•	Verified badges for trusted brokers and developers
	•	Data privacy compliance

⸻

Deliverables
	•	Complete product requirement document (PRD)
	•	UI/UX wireframes (WhatsApp-inspired simplicity)
	•	Backend architecture blueprint
	•	Database schema
	•	Admin panel design
	•	Growth strategy integration plan
	•	Deployment roadmap
	•	Monetization framework

Build this as a scalable, secure, growth-oriented real estate deal network platform optimized for high user adoption among brokers and developers.
Show less
](http://localhost:3000)

---

## Test Credentials (after seeding)

| Role | Phone | OTP |
|------|-------|-----|
| Super Admin | +91 99999 99999 | logged to console |
| Broker (Pro) | +91 98765 43210 | logged to console |
| Developer | +91 98765 43211 | logged to console |

In dev mode, OTP is returned in the API response and logged to server console.

---

## Key URLs

| URL | Description |
|-----|-------------|
| `/` | Landing page |
| `/login` | Phone OTP login |
| `/onboarding` | Role setup (new users) |
| `/feed` | Property listings feed |
| `/listings` | Search & filter listings |
| `/listings/new` | Create new listing |
| `/messages` | Chat inbox |
| `/crm` | Lead pipeline (Kanban) |
| `/profile` | User profile & settings |
| `/admin` | Admin dashboard |
| `/admin/users` | User management |
| `/admin/listings` | Listing approvals |
| `/p/:slug` | Public listing page (shareable) |

---

## Architecture Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS (WhatsApp theme) |
| Database | PostgreSQL + Prisma ORM |
| Auth | Custom JWT + OTP |
| Real-time | Socket.io (chat) |
| Payments | Razorpay |
| Storage | AWS S3 + CloudFront |
| Email | SendGrid |
| SMS/OTP | MSG91 |
| AI | OpenAI GPT-4o |

---

## Production Checklist

- [ ] Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Configure AWS S3 bucket and CloudFront
- [ ] Set up MSG91 for OTP delivery
- [ ] Configure Razorpay for payments
- [ ] Enable PostgreSQL SSL (`?sslmode=require` in DATABASE_URL)
- [ ] Set `NEXT_PUBLIC_APP_URL` to your domain
- [ ] Configure Cloudflare WAF
- [ ] Run `npm run build` and check for errors
- [ ] Set up automated DB backups
- [ ] Configure monitoring (Datadog/Grafana)

---

## Key Files Reference

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── (auth)/login/         # OTP login
│   ├── (auth)/onboarding/    # Role + profile setup
│   ├── (app)/
│   │   ├── layout.tsx        # Bottom nav + top bar
│   │   ├── feed/             # Property feed (AI matched)
│   │   ├── listings/         # Browse + create listings
│   │   ├── messages/         # WhatsApp-style chat
│   │   ├── crm/              # Kanban lead pipeline
│   │   └── profile/          # Profile + subscription
│   ├── admin/                # Admin dashboard + panels
│   ├── p/[slug]/             # Public listing landing page
│   └── api/                  # REST API endpoints
├── components/
│   └── PropertyCard.tsx      # Reusable listing card
├── lib/
│   ├── auth.ts               # JWT + OTP + deal credits
│   ├── db.ts                 # Prisma singleton
│   └── utils.ts              # Helpers + formatters
├── middleware.ts              # Route protection + JWT check
└── types/index.ts             # TypeScript types
prisma/
├── schema.prisma             # Full database schema
└── seed.ts                   # Sample data seed
```
