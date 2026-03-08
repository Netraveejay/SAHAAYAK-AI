# Sahaayak AI

Sahaayak AI is an AI-powered platform that helps citizens discover government welfare schemes they are eligible for. The system simplifies complex eligibility rules and improves accessibility through multilingual support, voice assistance, and AI-powered recommendations.

The platform is built using **React (frontend)** and **AWS serverless architecture**, with **Amazon Bedrock** providing the AI layer for intelligent scheme matching.

---

## Problem

India has **1000+ government welfare schemes**, but millions of eligible citizens never receive benefits because:

- Citizens are unaware that schemes exist
- Eligibility rules are difficult to understand
- Government portals are mostly in English
- Agents charge money to help fill applications
- Many citizens have low digital literacy

Sahaayak AI solves this by allowing users to **describe themselves in simple language or voice**, and the AI system automatically finds schemes they qualify for.

---

## Features

### User Login
- Mobile number login with OTP verification
- Secure authentication

### Family Profiles
- One user can create and manage **multiple profiles**
- Supports adding profiles for family members

### AI-Powered Scheme Recommendation
- AI analyzes user profiles
- Matches eligibility criteria across multiple schemes
- Returns only **relevant and eligible schemes**

### Multilingual Support
Supports multiple languages:

- English
- Hindi (हिंदी)
- Tamil (தமிழ்)

This makes the platform accessible to users in their **native language**.

### Voice Assistance

Voice features improve accessibility for low-literacy users.

**Speaker Button**
- Reads page content aloud using browser speech synthesis

**Mic Button**
- Accepts voice input
- Converts speech to text

### Document Upload

Users can upload important documents such as:

- Aadhaar
- PAN
- Other supporting files

Documents are securely stored in cloud storage.

### Accessible UI

The interface is designed for first-time digital users:

- Large buttons
- Simple navigation
- Mobile responsive layout
- Clear instructions

---

## Tech Stack

### Frontend
- React 18
- React Router
- Vite

### Backend
- Node.js
- Express.js

### AWS Cloud Infrastructure

Sahaayak AI uses AWS managed services to build a scalable serverless system.

- **Amazon Bedrock**  
  Provides foundation models for AI-powered scheme analysis and recommendations.

- **AWS Amplify**  
  Used to host and deploy the frontend React application.

- **Amazon API Gateway**  
  Manages API communication between the frontend and backend services.

- **AWS Lambda**  
  Runs backend logic for authentication, profile management, and scheme matching.

- **Amazon DynamoDB**  
  Stores user accounts, profiles, and scheme information.

- **Amazon S3**  
  Stores uploaded documents securely.

---

## AI Layer (Amazon Bedrock)

Amazon Bedrock powers the intelligence of Sahaayak AI.

The AI system:

- Interprets user profiles
- Analyzes eligibility criteria
- Matches citizens with relevant schemes
- Generates simplified explanations

Example:

User input:
"I am a 60-year-old farmer with low income."

AI response:
"You may be eligible for:
- PM-Kisan Scheme
- Senior Citizen Pension
- Farmer Subsidy Program"

This allows users to discover schemes instantly without manually searching through government portals.

---

## System Architecture

User Interaction Flow:

User → React Frontend (AWS Amplify)  
→ API Gateway  
→ AWS Lambda  
→ Amazon Bedrock (AI Processing)  
→ DynamoDB / S3 (Data Storage)

This architecture ensures:

- Scalability
- Secure data handling
- High availability
- AI-driven recommendations

---

## Running the Project Locally (Development Mode)

### Prerequisites

- Node.js 18+
- npm

---

### Backend

```bash
cd sahaayak-ai/backend
npm install
npm start
Backend runs at:

http://localhost:5000
Frontend

Open a new terminal:

cd sahaayak-ai/frontend
npm install
npm run dev

Frontend runs at:

http://localhost:3004
Demo Flow

Open the web application

Login using your mobile number

Add a profile with personal details

AI analyzes the profile

Eligible government schemes are recommended

User can upload required documents

Impact

Sahaayak AI helps:

Rural citizens

Elderly people

Low digital literacy users

Families unaware of welfare schemes

The platform bridges the information gap between citizens and government welfare programs, helping people access benefits they deserve.
