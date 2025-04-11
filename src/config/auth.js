const msal = require('@azure/msal-node');

// Configuration de l'authentification Azure AD
const msalConfig = {
    auth: {
        clientId: process.env.AZURE_CLIENT_ID,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
        redirectUri: process.env.AZURE_REDIRECT_URI || `http${process.env.SSL_ENABLED === 'true' ? 's' : ''}://localhost:${process.env.SSL_ENABLED === 'true' ? '8443' : '3000'}/auth/callback`
    },
    system: {
        loggerOptions: {
            loggerCallback: (loglevel, message, containsPii) => {
                console.log(`MSAL (${loglevel}): ${message}`);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    }
};

// Configuration des scopes d'authentification
const authScopes = {
    userScopes: [
        // Scopes d'authentification de base
        'email',
        'offline_access',
        'openid',
        'profile',
        'User.Read'
    ]
};

// Configuration des endpoints
const endpoints = {
    exchangeOnline: 'https://outlook.office365.com',
    azureManagement: 'https://management.azure.com'
};

module.exports = {
    msalConfig,
    authScopes,
    endpoints
}; 