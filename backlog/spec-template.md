---
id: "spec-1"
title: "User Authentication with OAuth 2.0"
description: "Implement OAuth 2.0 authentication supporting Google and GitHub providers"
status: "To Do"
priority: "high"
labels: ["backend", "security", "auth"]
estimatedHours: 16
model: "qwen2.5-coder:7b"

spec:
  enabled: true
  type: "feature"
  
  requirements:
    - "Users can authenticate via Google OAuth 2.0"
    - "Users can authenticate via GitHub OAuth 2.0"
    - "Session tokens expire after 24 hours"
    - "Failed login attempts are rate-limited (5 attempts/hour)"
    - "User profile data is synced from OAuth provider"
    - "Logout clears session securely"
  
  architecture:
    components:
      - "auth-service: Handles OAuth flow and token management"
      - "user-db: Stores user profiles and session data"
      - "session-store: Redis cache for active sessions"
      - "api-gateway: Enforces authentication on protected routes"
    integrations:
      - "Google OAuth 2.0 API"
      - "GitHub OAuth 2.0 API"
      - "Redis for session storage"
    decisions: "Use JWT tokens with Redis session blacklist. Store refresh tokens encrypted in database. Use passport.js middleware for OAuth handling."

approval:
  code:
    required: true
    autoApprove: false
    approvers: []
  docs:
    required: true
    autoApprove: false
    generate:
      worklog: true
      adr: true
      changelog: true
      readme: false

documentation:
  generated: false
  worklogPath: null
  adrPath: null
  changelogEntry: null

acceptanceCriteria:
  - "Users can successfully login with Google account"
  - "Users can successfully login with GitHub account"
  - "Session tokens are validated on every request"
  - "Expired sessions are properly rejected with 401"
  - "Rate limiting blocks excessive login attempts"
  - "User profile updates sync correctly from providers"
  - "Logout endpoint clears all session data"
  - "Error messages are user-friendly and secure"

assignee: ""
createdAt: "2026-01-19T10:00:00Z"
updatedAt: "2026-01-19T10:00:00Z"
---

# Spec: User Authentication with OAuth 2.0

## Overview
Implement a secure OAuth 2.0 authentication system supporting Google and GitHub as identity providers. This will enable users to log in without creating new accounts, improving user experience and security.

## Requirements

### Authentication Flow
1. **Google OAuth 2.0**: Users can click "Login with Google" button, get redirected to Google, and return authenticated
2. **GitHub OAuth 2.0**: Users can click "Login with GitHub" button, get redirected to GitHub, and return authenticated
3. **Session Management**: Valid sessions last 24 hours, after which users must re-authenticate
4. **Rate Limiting**: After 5 failed login attempts in 1 hour, user is temporarily blocked
5. **Profile Sync**: User data (email, name, avatar) is synced from OAuth provider and kept current
6. **Logout**: Users can logout, which clears all session data immediately

## Technical Context

### Existing System
- Express.js API running on Node.js
- PostgreSQL for user data
- Redis for caching/sessions
- JWT tokens for API authentication

### Dependencies to Use
- `passport.js` for OAuth strategy management
- `passport-google-oauth20` for Google OAuth
- `passport-github2` for GitHub OAuth
- `jsonwebtoken` for JWT generation
- `redis` client for session storage

## Architecture

### Components

#### Auth Service
- Handles OAuth callback routes
- Manages token generation and validation
- Coordinates with user database
- Manages session creation/destruction

#### User Database
- Stores user profiles with OAuth IDs
- Encrypted storage of refresh tokens
- Login attempt tracking for rate limiting
- Session metadata

#### Session Store (Redis)
- Fast session lookups
- Automatic expiration after 24 hours
- Session invalidation on logout
- Rate limiting counters

#### API Gateway
- Express middleware for route protection
- Token validation on each request
- Automatic refresh for near-expiry tokens

### Integration Points
- Google OAuth 2.0 endpoints
- GitHub OAuth 2.0 endpoints
- Existing user database
- Redis instance

### Key Architecture Decisions
1. **JWT + Redis Approach**: JWT tokens for stateless API with Redis blacklist for logout
2. **Passport.js**: Industry-standard for OAuth handling, reduces custom auth code
3. **User Sync Strategy**: Pull complete profile on login, incremental updates hourly
4. **Rate Limiting**: Per-IP + per-user limits to prevent abuse
5. **Token Refresh**: Automatic refresh when token is within 2 hours of expiry

## Acceptance Criteria
- [ ] Google login button works end-to-end
- [ ] GitHub login button works end-to-end
- [ ] Session tokens are valid for exactly 24 hours
- [ ] Expired tokens are rejected with 401 Unauthorized
- [ ] Failed attempts are rate-limited to 5/hour per IP
- [ ] User profile updates within 5 minutes of provider change
- [ ] Logout endpoint clears sessions immediately
- [ ] All error messages are user-friendly and don't expose system details
- [ ] Code includes proper logging for security auditing
- [ ] Unit tests cover token lifecycle and rate limiting

## Notes
- Get OAuth credentials from Google and GitHub developer consoles before implementation
- Ensure HTTPS is enforced in production
- Document OAuth setup for deployment
- Consider CSRF tokens for state management
