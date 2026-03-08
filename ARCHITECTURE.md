# Sahaayak AI - AWS Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER DEVICES                             │
│  (Mobile Browsers, Desktop Browsers, Tablets)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AWS AMPLIFY HOSTING                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React Frontend (Vite Build)                             │  │
│  │  - Login UI (Phone + OTP)                                │  │
│  │  - Profile Management                                     │  │
│  │  - Scheme Browser                                         │  │
│  │  - Document Upload UI                                     │  │
│  │  - Voice Interface                                        │  │
│  │  - Offline Support (IndexedDB)                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ REST API (HTTPS)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AMAZON API GATEWAY                            │
│  - REST API Endpoints                                            │
│  - Request Validation                                            │
│  - CORS Configuration                                            │
│  - Rate Limiting                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Invoke
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AWS LAMBDA                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Node.js Backend (Express + Serverless-HTTP)            │  │
│  │                                                           │  │
│  │  Handlers:                                                │  │
│  │  - userHandler.js (Auth)                                 │  │
│  │  - profileHandler.js (CRUD Profiles)                     │  │
│  │  - applicationHandler.js (Track Applications)            │  │
│  │  - aiHandler.js (AI Services)                            │  │
│  │                                                           │  │
│  │  Services:                                                │  │
│  │  - dynamoService.js                                       │  │
│  │  - s3Service.js                                           │  │
│  │  - bedrockService.js                                      │  │
│  │  - translateService.js                                    │  │
│  │  - pollyService.js                                        │  │
│  │  - rulesEngine.js                                         │  │
│  │  - eligibilityService.js                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└──┬────────┬────────┬────────┬────────┬──────────────────────────┘
   │        │        │        │        │
   │        │        │        │        │
   ▼        ▼        ▼        ▼        ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ DDB  │ │ DDB  │ │ DDB  │ │  S3  │ │Bedrock│
│Users │ │Profil│ │ Apps │ │Upload│ │Claude │
└──────┘ └──────┘ └──────┘ └──────┘ └───┬───┘
                                         │
                              ┌──────────┴──────────┐
                              ▼                     ▼
                         ┌─────────┐         ┌─────────┐
                         │Translate│         │  Polly  │
                         │ Service │         │ (Voice) │
                         └─────────┘         └─────────┘
```

## Data Flow

### 1. User Authentication Flow
```
User → Amplify → API Gateway → Lambda (userHandler)
                                    ↓
                              DynamoDB (Users)
                                    ↓
                              JWT Token ← User
```

### 2. Profile Management Flow
```
User → Amplify → API Gateway → Lambda (profileHandler)
                                    ↓
                              DynamoDB (Profiles)
                                    ↓
                              Profile Data ← User
```

### 3. Scheme Eligibility Flow (Hybrid AI + Rules)
```
User Profile → Lambda (eligibilityService)
                    ↓
              rulesEngine.js (Deterministic Filtering)
                    ↓
              Eligible Schemes
                    ↓
              bedrockService.js (AI Explanation)
                    ↓
              Amazon Bedrock (Claude)
                    ↓
              Schemes + AI Explanation → User
```

### 4. Document Upload Flow
```
User → Amplify → API Gateway → Lambda (uploadHandler)
                                    ↓
                              S3 Pre-signed URL
                                    ↓
User → Direct Upload → S3 Bucket
                                    ↓
                              File URL → DynamoDB
```

### 5. Voice Support Flow
```
Text Input → Lambda (aiHandler)
                ↓
          Amazon Polly
                ↓
          Audio File → S3
                ↓
          Audio URL → User

Voice Input → Browser Speech Recognition
                ↓
          Text → Lambda (translateService)
                ↓
          Amazon Translate
                ↓
          Translated Text → User
```

### 6. Offline-First Sync Flow
```
User (Offline) → IndexedDB (Local Storage)
                      ↓
                 Queue Actions
                      ↓
User (Online) → Sync Service
                      ↓
                 API Gateway → Lambda
                      ↓
                 DynamoDB (Persist)
```

## AWS Services Used

| Service | Purpose | Cost Model |
|---------|---------|------------|
| **AWS Amplify** | Frontend hosting, CI/CD | Pay per build minute + data transfer |
| **API Gateway** | REST API management | Pay per million requests |
| **Lambda** | Serverless backend compute | Pay per request + compute time |
| **DynamoDB** | NoSQL database (Users, Profiles, Apps) | On-demand or provisioned capacity |
| **S3** | File storage (documents, audio) | Pay per GB stored + requests |
| **Bedrock** | AI explanations (Claude model) | Pay per token |
| **Translate** | Multilingual support | Pay per character |
| **Polly** | Text-to-speech | Pay per character |

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Security Layers                          │
├─────────────────────────────────────────────────────────────┤
│ 1. HTTPS/TLS (Amplify + API Gateway)                        │
│ 2. CORS (Restrict origins)                                   │
│ 3. JWT Token Authentication (Bearer tokens)                  │
│ 4. IAM Roles (Least privilege for Lambda)                   │
│ 5. S3 Bucket Policies (Private by default)                  │
│ 6. DynamoDB Encryption at Rest                              │
│ 7. API Gateway Rate Limiting                                │
│ 8. CloudWatch Logging & Monitoring                          │
└─────────────────────────────────────────────────────────────┘
```

## Scalability

- **Auto-scaling**: Lambda scales automatically (0 to 1000s concurrent)
- **DynamoDB**: On-demand mode scales automatically
- **S3**: Unlimited storage, auto-scales
- **API Gateway**: Handles 10,000 requests/second by default
- **Amplify**: Global CDN distribution

## High Availability

- **Multi-AZ**: DynamoDB, S3, Lambda are multi-AZ by default
- **Regional**: Deploy in multiple regions for global HA
- **Backup**: DynamoDB point-in-time recovery
- **Monitoring**: CloudWatch alarms for failures

## Performance Optimization

1. **Frontend**: Vite build optimization, code splitting
2. **API**: Lambda warm-up, connection pooling
3. **Database**: DynamoDB GSI for fast queries
4. **Storage**: S3 Transfer Acceleration for uploads
5. **CDN**: Amplify CDN for static assets
6. **Caching**: Browser caching + IndexedDB offline cache

## Disaster Recovery

- **RTO**: < 1 hour (restore from DynamoDB backup)
- **RPO**: < 5 minutes (DynamoDB point-in-time recovery)
- **Backup Strategy**: Daily automated backups
- **Multi-region**: Deploy in secondary region for DR
