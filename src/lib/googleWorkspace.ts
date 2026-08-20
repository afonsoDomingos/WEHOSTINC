// Google Workspace API Configuration and Integration
// This module handles the integration with Google Workspace for email services

export interface GoogleWorkspaceConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  resellerId?: string;
  adminEmail: string;
  domain: string;
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  givenName: string;
  familyName: string;
  picture?: string;
}

export interface GoogleEmailAccount {
  primaryEmail: string;
  name: string;
  password?: string;
  recoveryEmail?: string;
  suspended?: boolean;
  isAdmin?: boolean;
}

export interface GoogleEmailAccountResponse {
  primaryEmail: string;
  name: string;
  id: string;
  suspended: boolean;
  isAdmin: boolean;
  isDelegatedAdmin: boolean;
  lastLoginTime: string;
  creationTime: string;
  agreedToTerms: boolean;
  suspendedReason?: string;
}

export interface GoogleDomainAlias {
  domainAliasName: string;
  parentDomainName: string;
  verified: boolean;
}

export interface GoogleGroup {
  email: string;
  name: string;
  description?: string;
  adminCreated: boolean;
  directMembersCount: string;
}

// Configuration from environment variables
export function getGoogleWorkspaceConfig(): GoogleWorkspaceConfig {
  return {
    clientId: process.env.GOOGLE_WORKSPACE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_WORKSPACE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_WORKSPACE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL}/auth/google/callback`,
    resellerId: process.env.GOOGLE_WORKSPACE_RESELLER_ID,
    adminEmail: process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL || 'admin@wehosthere.com',
    domain: process.env.GOOGLE_WORKSPACE_DOMAIN || 'wehosthere.com'
  };
}

// Check if Google Workspace is configured
export function isGoogleWorkspaceConfigured(): boolean {
  const config = getGoogleWorkspaceConfig();
  return !!(config.clientId && config.clientSecret && config.adminEmail);
}

// Google Workspace API endpoints
const GOOGLE_API_BASE = 'https://www.googleapis.com/admin/directory/v1';
const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// OAuth 2.0 token management
export async function getAccessToken(): Promise<string | null> {
  const config = getGoogleWorkspaceConfig();
  if (!config.clientId || !config.clientSecret) {
    console.error('[Google Workspace] Missing credentials');
    return null;
  }

  try {
    // For service account authentication (recommended for server-side)
    const response = await fetch(OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        scope: 'https://www.googleapis.com/auth/admin.directory.user https://www.googleapis.com/auth/admin.directory.group'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Google Workspace] Token error:', error);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('[Google Workspace] Token fetch error:', error);
    return null;
  }
}

// User Management API
export async function createEmailAccount(
  userData: GoogleEmailAccount
): Promise<GoogleEmailAccountResponse | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.error('[Google Workspace] No access token');
    return null;
  }

  const config = getGoogleWorkspaceConfig();

  try {
    const response = await fetch(
      `${GOOGLE_API_BASE}/users`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          primaryEmail: userData.primaryEmail,
          name: {
            givenName: userData.name.split(' ')[0],
            familyName: userData.name.split(' ').slice(1).join(' ') || 'User'
          },
          password: userData.password || generateRandomPassword(),
          suspended: userData.suspended || false,
          isAdmin: userData.isAdmin || false
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('[Google Workspace] Create user error:', error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[Google Workspace] Create user error:', error);
    return null;
  }
}

export async function getEmailAccount(email: string): Promise<GoogleEmailAccountResponse | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.error('[Google Workspace] No access token');
    return null;
  }

  try {
    const response = await fetch(
      `${GOOGLE_API_BASE}/users/${email}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('[Google Workspace] Get user error:', error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[Google Workspace] Get user error:', error);
    return null;
  }
}

export async function updateEmailAccount(
  email: string,
  updates: Partial<GoogleEmailAccount>
): Promise<GoogleEmailAccountResponse | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.error('[Google Workspace] No access token');
    return null;
  }

  try {
    const response = await fetch(
      `${GOOGLE_API_BASE}/users/${email}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('[Google Workspace] Update user error:', error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[Google Workspace] Update user error:', error);
    return null;
  }
}

export async function deleteEmailAccount(email: string): Promise<boolean> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.error('[Google Workspace] No access token');
    return false;
  }

  try {
    const response = await fetch(
      `${GOOGLE_API_BASE}/users/${email}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );

    return response.ok;
  } catch (error) {
    console.error('[Google Workspace] Delete user error:', error);
    return false;
  }
}

export async function listEmailAccounts(
  domain?: string,
  maxResults: number = 100
): Promise<GoogleEmailAccountResponse[]> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.error('[Google Workspace] No access token');
    return [];
  }

  const config = getGoogleWorkspaceConfig();
  const targetDomain = domain || config.domain;

  try {
    const response = await fetch(
      `${GOOGLE_API_BASE}/users?domain=${targetDomain}&maxResults=${maxResults}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('[Google Workspace] List users error:', error);
      return [];
    }

    const data = await response.json();
    return data.users || [];
  } catch (error) {
    console.error('[Google Workspace] List users error:', error);
    return [];
  }
}

// Password management
export async function resetEmailPassword(email: string, newPassword?: string): Promise<boolean> {
  const password = newPassword || generateRandomPassword();
  const result = await updateEmailAccount(email, { password });
  return result !== null;
}

// Helper function to generate random password
function generateRandomPassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Domain management
export async function verifyDomain(domain: string): Promise<boolean> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.error('[Google Workspace] No access token');
    return false;
  }

  try {
    const response = await fetch(
      `${GOOGLE_API_BASE}/domains/${domain}/verify`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );

    return response.ok;
  } catch (error) {
    console.error('[Google Workspace] Verify domain error:', error);
    return false;
  }
}

export async function getDomainAliases(domain: string): Promise<GoogleDomainAlias[]> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.error('[Google Workspace] No access token');
    return [];
  }

  try {
    const response = await fetch(
      `${GOOGLE_API_BASE}/domainaliases?parentDomainName=${domain}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('[Google Workspace] Get domain aliases error:', error);
      return [];
    }

    const data = await response.json();
    return data.domainAliases || [];
  } catch (error) {
    console.error('[Google Workspace] Get domain aliases error:', error);
    return [];
  }
}

// Group management (for distribution lists)
export async function createGroup(groupData: GoogleGroup): Promise<GoogleGroup | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.error('[Google Workspace] No access token');
    return null;
  }

  try {
    const response = await fetch(
      `${GOOGLE_API_BASE}/groups`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: groupData.email,
          name: groupData.name,
          description: groupData.description
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('[Google Workspace] Create group error:', error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[Google Workspace] Create group error:', error);
    return null;
  }
}

export const googleWorkspaceManager = {
  isConfigured: isGoogleWorkspaceConfigured,
  getConfig: getGoogleWorkspaceConfig,
  
  // User management
  createAccount: createEmailAccount,
  getAccount: getEmailAccount,
  updateAccount: updateEmailAccount,
  deleteAccount: deleteEmailAccount,
  listAccounts: listEmailAccounts,
  resetPassword: resetEmailPassword,
  
  // Domain management
  verifyDomain: verifyDomain,
  getDomainAliases: getDomainAliases,
  
  // Group management
  createGroup: createGroup,
  
  // Authentication
  getAccessToken: getAccessToken
};
