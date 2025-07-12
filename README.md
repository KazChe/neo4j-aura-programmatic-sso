# Neo4j Aura with Azure SSO Integration

This application demonstrates how to connect to Neo4j Aura using Azure Single Sign-On (SSO) authentication.

## Prerequisites

- Node.js installed
- An Azure account with an App Registration
- A Neo4j Aura database instance
- Required npm packages (see package.json)

## Configuration

Before running the application, you need to configure the following parameters in `connect-aura-azure.js`:

### Azure App Registration Parameters

```javascript
const azureAppClientId = "YOUR_CLIENT_ID"; // e.g. "25930cb6-8e74-423e-a369-087403ae2a83"
const azureAppTenantId = "YOUR_TENANT_ID"; // e.g. "cffc4190-7800-41a2-9732-3dab0bedc0d7"
const azureAppRedirectUri = "YOUR_REDIRECT_URI"; // e.g. "http://localhost:3000"
```

### Neo4j Aura Parameters

```javascript
const auraDbId = "YOUR_AURA_DB_ID"; // e.g. "5314cd18"
```

## Security Note

The current configuration has these values hardcoded. TODO: move to env variables

## How It Works

1. The application uses PKCE (Proof Key for Code Exchange) for secure OAuth 2.0 authentication
2. When run, it will open your default browser for Azure login
3. After successful authentication, it will connect to your Neo4j Aura instance using the obtained token
4. A test query will be executed to verify the connection

## Running the Application

1. Install dependencies:

```bash
npm install
```

2. Run the application:

```bash
node connect-aura-azure.js
```

## Security Features

- Uses PKCE for enhanced OAuth security
- Implements Azure SSO for authentication
- Uses bearer token authentication for Neo4j Aura

## Further Learning Resources

### PKCE (Proof Key for Code Exchange)

- [Auth0's Guide to Authorization Code Flow with PKCE](https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-pkce) - Comprehensive guide explaining PKCE implementation
- [OAuth.com PKCE Playground](https://www.oauth.com/playground/authorization-code-with-pkce.html) - Interactive demo of PKCE flow
- [OAuth 2.0 Security Best Practices](https://oauth.net/2/pkce/) - Official OAuth 2.0 documentation on PKCE

### Understanding the Security Flow

1. Code Verifier Generation:
   - Random string between 43-128 characters
   - Uses A-Z, a-z, 0-9, and punctuation characters -.\_~
2. Code Challenge Creation:
   - SHA256 hash of the code verifier
   - Base64URL encoded for safe transmission
3. Security Benefits:
   - Prevents authorization code interception attacks
   - Protects against CSRF (Cross-Site Request Forgery)
   - Ensures only the original client can exchange the code for tokens

### Implementation Details

The code in this repository implements PKCE by:

- Generating a cryptographically secure code verifier
- Creating a code challenge using SHA-256 hashing
- Implementing proper base64URL encoding for URL safety
- Verifying the code challenge during token exchange

For more details about the implementation, see the code comments in `connect-aura-azure.js`.

## Azure MSAL Node.js Resources

### Official Documentation

- [MSAL Node.js SDK Documentation](https://learn.microsoft.com/en-us/javascript/api/@azure/msal-node/) - Complete API reference
- [Microsoft Identity Platform Overview](https://learn.microsoft.com/en-us/entra/identity-platform/msal-overview) - Overview of MSAL and authentication concepts
- [MSAL Node GitHub Repository](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node) - Source code and samples

### Key Features Used in This Project

1. PublicClientApplication - Used for implementing OAuth 2.0 flows
2. PKCE Authentication - Enhanced security for authorization code flow
3. Token Cache Management - Secure handling of access and refresh tokens
4. Azure AD Integration - Seamless connection with Azure Active Directory

### Code examples and useful tutorials

- [Authorization Code Flow with PKCE](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [MSAL Node Samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-node-samples)
- [Azure AD Authentication Best Practices](https://learn.microsoft.com/en-us/azure/active-directory/develop/identity-platform-integration-checklist)

## Interactive Login Flow

The application implements an interactive login flow using MSAL Node.js SDK. Here's how it works:

1. **URL Generation**

   ```javascript
   const authCodeUrlParameters = {
     scopes,
     redirectUri,
     codeChallenge,
     codeChallengeMethod: "S256",
   };
   const authCodeUrl = await pca.getAuthCodeUrl(authCodeUrlParameters);
   ```

   The code generates a secure Azure login URL with PKCE parameters.

2. **Browser Launch**

   ```javascript
   await open(authCodeUrl);
   ```

   Opens your default browser to the Azure login page.

3. **Callback Handling**
   ```javascript
   const server = http
     .createServer(async (req, res) => {
       // Handle the Azure callback with authorization code
     })
     .listen(3000);
   ```
   - Starts a local server on port 3000
   - Waits for the Azure callback after successful login
   - Exchanges the authorization code for an ID token
   - Uses the ID token to connect to Neo4j Aura

The entire flow is handled in the `getTokenInteractive()` function in `connect-aura-azure.js`. After successful authentication, the token is used by `connectToAura()` to establish a secure connection to your Neo4j Aura database.

For more details about the implementation, see the code comments in `connect-aura-azure.js`.

## MSAL Authentication Abstraction

The Microsoft Authentication Library (MSAL) significantly simplifies the OAuth2.0 implementation by abstracting complex authentication flows. Here's how:

1. **Simple Configuration**

   ```javascript
   const config = {
     auth: {
       clientId: azureAppClientId,
       authority: `${baseAzureUrl}/${azureAppTenantId}`,
     },
   };
   const pca = new PublicClientApplication(config);
   ```

   Just provide basic app credentials, and MSAL handles the rest.

2. **Automated URL Generation**

   ```javascript
   const authCodeUrl = await pca.getAuthCodeUrl(authCodeUrlParameters);
   ```

   MSAL automatically:

   - Constructs the proper OAuth2.0 authorization URL
   - Adds required protocol parameters
   - Includes PKCE challenge
   - Manages state parameters
   - Handles Azure AD endpoints

3. **Token Acquisition**
   ```javascript
   const tokenResponse = await pca.acquireTokenByCode(tokenRequest);
   ```
   MSAL manages:
   - Token exchange
   - PKCE verification
   - Token validation
   - Token caching
   - Error handling

Without MSAL, we would need to implement all these OAuth2.0 and PKCE components manually, making the code much more complex and error-prone. MSAL ensures we follow security best practices while keeping the implementation clean and maintainable.
# neo4j-aura-programmatic-sso
