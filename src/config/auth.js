const msal = require('@azure/msal-node');

// Configuration de l'authentification Azure AD
const msalConfig = {
    auth: {
        clientId: process.env.AZURE_CLIENT_ID,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
        redirectUri: process.env.AZURE_REDIRECT_URI || 'https://scriptinweb.chateauform.com:8443/auth/callback'
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