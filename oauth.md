# 🔐 Modern OAuth 2.0 Implementation (2026 Standards)

This guide replaces the deprecated `gapi` (Google API Client Library for JavaScript) with the modern **Google Identity Services (GIS)** and secure backend verification.

## 1. Frontend Integration (Google Identity Services)

Avoid using the old `gapi.auth2`. Instead, use the HTML API or the JS API for "Sign In with Google".

### Step A: Load the Library
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

### Step B: Initialize & Render Button (JS API)
```javascript
google.accounts.id.initialize({
  client_id: "YOUR_GOOGLE_CLIENT_ID",
  callback: handleCredentialResponse, // Sends token to backend
  context: "signin",
});

google.accounts.id.renderButton(
  document.getElementById("googleBtn"),
  { theme: "outline", size: "large" }
);
```

### Step C: Handle Response
```javascript
function handleCredentialResponse(response) {
  // response.credential is the ID Token (JWT)
  fetch("https://api.eduflow.com/api/v1/auth/google-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential: response.credential }),
  });
}
```

## 2. Backend Verification (Node.js)

Verify the token using `google-auth-library` or `googleapis`. **Never trust a token sent from the client without verification.**

```typescript
import { google } from "googleapis";

const client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);

async function verifyToken(idToken: string) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: CLIENT_ID,
  });
  return ticket.getPayload(); // Contains email, name, picture
}
```

## 3. Deprecated Patterns (DO NOT USE)
- ❌ `gapi.auth2.getAuthInstance()` -> **REPLACED BY GIS**
- ❌ `gapi.client.setApiKey()` for Auth -> **USE OAUTH2 TOKENS**
- ❌ `initTokenClient` for simple Sign-In -> **USE `accounts.id.initialize`**
  - *Note: `initTokenClient` is still used for AUTHORIZATION (accessing specific APIs like Calendar/Drive), but not for AUTHENTICATION (Sign-In).*

> [!IMPORTANT]
> Always use `httpOnly` secure cookies to store the session token returned by the server after OAuth verification.
