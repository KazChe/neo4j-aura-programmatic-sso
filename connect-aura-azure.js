import neo4j from "neo4j-driver";
import { PublicClientApplication } from "@azure/msal-node";
import open from "open";
import http from "http";
import url from "url";
import crypto from "crypto";

// change these parameters to match your azure app registration TODO: move to env variables
const baseAzureUrl = "https://login.microsoftonline.com";
const azureAppClientId = process.env.AZURE_APP_CLIENT_ID //|| "af137fe7-644f-4c44-bdeb-32a09667b0d7";
const azureAppTenantId = process.env.AZURE_APP_TENANT_ID //|| "54e85725-ed2a-49a4-a19e-11c8d29f9a0f";
const azureAppRedirectUri = process.env.AZURE_APP_REDIRECT_URI //|| "http://localhost:3000";

// change this to match your aura db id TODO: move to env variables
const auraDbId = process.env.AURA_DB_ID //|| "5314cd18";

// PKCE: generate verifier & challenge
const codeVerifier = crypto.randomBytes(64).toString("hex");
const base64URLEncode = (str) => str.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const codeChallenge = base64URLEncode(crypto.createHash("sha256").update(codeVerifier).digest());

// azure app registration
const config = {
  auth: {
    clientId: azureAppClientId,
    authority: `${baseAzureUrl}/${azureAppTenantId}`,
  },
};

const pca = new PublicClientApplication(config);
const redirectUri = azureAppRedirectUri;
const scopes = ["openid", "profile", "email"];

// launch local server and request token interactively
async function getTokenInteractive() {
  const authCodeUrlParameters = {
    scopes,
    redirectUri,
    codeChallenge,
    codeChallengeMethod: "S256",
  };

  const authCodeUrl = await pca.getAuthCodeUrl(authCodeUrlParameters);
  console.log(`Opening browser for login: ${authCodeUrl}`);
  await open(authCodeUrl);

  return new Promise((resolve, reject) => {
    const server = http
      .createServer(async (req, res) => {
        const query = url.parse(req.url, true).query;
        if (query.code) {
          const tokenRequest = {
            code: query.code,
            scopes,
            redirectUri,
            codeVerifier,
          };

          try {
            const tokenResponse = await pca.acquireTokenByCode(tokenRequest);
            res.end("Login successful. You may close this window.");
            server.close();
            console.log(tokenResponse);
            resolve(tokenResponse.idToken);
          } catch (err) {
            console.error("Token retrieval failed:", err);
            res.end("Error retrieving token");
            server.close();
            reject(err);
          }
        }
      })
      .listen(3000);
  });
}

async function connectToAura(idToken) {
  const AURA_URI = `neo4j+s://${auraDbId}.databases.neo4j.io`;

  // Fixed: Use neo4j.auth.bearer() instead of neo4j.authBearer()
  const driver = neo4j.driver(AURA_URI, neo4j.auth.bearer(idToken));
  const session = driver.session();

  try {
    const result = await session.run('RETURN "SSO connected!" AS message');
    console.log(result.records[0].get("message"));
  } finally {
    await session.close();
    await driver.close();
  }
}

(async () => {
  try {
    const idToken = await getTokenInteractive();
    await connectToAura(idToken);
  } catch (e) {
    console.error("Failed to authenticate and connect:", e);
  }
})();
