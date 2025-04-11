const msal = require('@azure/msal-node');

// Configuration MSAL
const msalConfig = {
    auth: {
        clientId: process.env.AZURE_CLIENT_ID,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
        redirectUri: process.env.REDIRECT_URI || 'https://scriptinweb.chateauform.com:8443/auth/callback'
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
        'openid',
        'profile',
        'email',
        'User.Read',
        'offline_access',
        'https://management.azure.com/user_impersonation',
        'https://management.azure.com/.default',
        'https://graph.microsoft.com/.default'
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