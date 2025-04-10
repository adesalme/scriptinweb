const { ConfidentialClientApplication } = require('@azure/msal-node');
const { Client } = require('@microsoft/microsoft-graph-client');
const { PowerShell } = require('node-powershell');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const { msalConfig, authScopes } = require('../config/auth');

class AuthService {
    constructor() {
        // Vérifier si les informations d'authentification Azure sont configurées
        const hasAzureConfig = process.env.AZURE_CLIENT_ID && 
                             process.env.AZURE_CLIENT_SECRET && 
                             process.env.AZURE_TENANT_ID;
        
        if (hasAzureConfig) {
            this.config = {
                auth: {
                    clientId: process.env.AZURE_CLIENT_ID,
                    clientSecret: process.env.AZURE_CLIENT_SECRET,
                    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
                    redirectUri: process.env.REDIRECT_URI || 'https://scriptinweb.chateauform.com:8443/auth/callback'
                }
            };
            
            this.msalClient = new ConfidentialClientApplication(this.config);
            this.demoMode = false;
            console.log('Mode d\'authentification Azure activé');
            console.log('Configuration:', {
                clientId: this.config.auth.clientId,
                authority: this.config.auth.authority,
                redirectUri: this.config.auth.redirectUri
            });
        } else {
            this.demoMode = true;
            console.log('Mode démonstration activé (sans authentification Azure)');
        }
    }

    // Générer l'URL de connexion
    async getAuthUrl() {
        try {
            const state = this.generateState();
            const authCodeUrlParameters = {
                scopes: authScopes.userScopes,
                redirectUri: this.config.auth.redirectUri,
                state: state
            };
            console.log('Génération de l\'URL d\'authentification avec les paramètres:', authCodeUrlParameters);
            const url = await this.msalClient.getAuthCodeUrl(authCodeUrlParameters);
            console.log('URL d\'authentification générée:', url);
            return url;
        } catch (error) {
            console.error('Erreur lors de la génération de l\'URL d\'authentification:', error);
            throw error;
        }
    }

    // Gérer le callback de l'authentification
    async handleCallback(code) {
        try {
            console.log('Traitement du callback avec le code reçu');
            const tokenRequest = {
                code: code,
                scopes: authScopes.userScopes,
                redirectUri: this.config.auth.redirectUri,
            };
            console.log('Demande de token avec les paramètres:', tokenRequest);
            const response = await this.msalClient.acquireTokenByCode(tokenRequest);
            console.log('Token acquis avec succès');
            return response;
        } catch (error) {
            console.error('Erreur lors de l\'acquisition du token:', error);
            throw error;
        }
    }

    // Générer un état aléatoire pour la sécurité
    generateState() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    // Obtenir les informations de l'utilisateur
    async getUserInfo(accessToken) {
        try {
            console.log('Récupération des informations utilisateur avec le token');
            const client = Client.init({
                authProvider: (done) => {
                    done(null, accessToken);
                }
            });

            const user = await client.api('/me').get();
            console.log('Informations utilisateur récupérées:', user);
            return user;
        } catch (error) {
            console.error('Erreur lors de la récupération des informations utilisateur:', error);
            throw error;
        }
    }

    // Exécuter un script PowerShell
    async executePowerShellWithToken(scriptContent, service) {
        let ps = null;
        try {
            console.log('Démarrage de l\'exécution PowerShell...');
            
            ps = new PowerShell({
                executionPolicy: 'Bypass',
                noProfile: true,
                pwsh: true
            });

            const setupCommands = [
                '$env:NO_COLOR="1"',
                '$PSStyle.OutputRendering="PlainText"',
                '$ProgressPreference="SilentlyContinue"',
                '$ErrorActionPreference="Stop"',
                '$VerbosePreference="Continue"',
                'Write-Verbose "Configuration PowerShell terminée"'
            ].join(';\n');

            console.log('Configuration PowerShell terminée');

            const commands = [
                setupCommands,
                scriptContent
            ];

            console.log('Exécution des commandes PowerShell...');
            
            const result = await ps.invoke(commands.join(';\n'));
            
            console.log('Commandes PowerShell exécutées avec succès');
            
            const cleanOutput = (result.raw || '')
                .replace(/\r\n/g, '\n')
                .replace(/\n{3,}/g, '\n\n')
                .replace(/\[[\d;]*[a-zA-Z]/g, '')
                .replace(/\[\?1[hl]/g, '')
                .trim();
            
            return cleanOutput || 'Aucune sortie';
        } catch (error) {
            console.error('PowerShell execution error:', error);
            if (error.message) {
                console.error('Message d\'erreur:', error.message);
            }
            if (error.stack) {
                console.error('Stack trace:', error.stack);
            }
            throw error;
        } finally {
            if (ps) {
                try {
                    await ps.dispose();
                    console.log('Session PowerShell fermée');
                } catch (disposeError) {
                    console.error('Erreur lors de la fermeture de la session PowerShell:', disposeError);
                }
            }
        }
    }
}

// Fonction pour vérifier si nous sommes en mode démonstration
const isDemoMode = () => process.env.DEMO_MODE === 'true';

// Fonction pour obtenir l'URL de redirection
const getRedirectUri = () => process.env.AZURE_REDIRECT_URI;

// Fonction pour obtenir l'URL de l'application
const getAppUrl = () => process.env.APP_URL;

// Fonction pour obtenir le nom de l'application
const getAppName = () => process.env.APP_NAME;

// Fonction pour obtenir la description de l'application
const getAppDescription = () => process.env.APP_DESCRIPTION;

// Fonction pour obtenir l'URL de connexion
const getLoginUrl = () => {
    if (isDemoMode()) {
        return `${getAppUrl()}/auth/demo-login`;
    }
    return msalConfig.auth.authority;
};

// Fonction pour obtenir le token
const getToken = async (code) => {
    if (isDemoMode()) {
        return {
            accessToken: 'demo-token',
            account: {
                username: 'demo@example.com',
                name: 'Demo User',
                id: 'demo-id'
            }
        };
    }
    const response = await msalClient.acquireTokenByCode({
        code,
        scopes: tokenRequest.scopes,
        redirectUri: getRedirectUri()
    });
    return response;
};

// Fonction pour exécuter une commande PowerShell
const executePowerShellCommand = async (command) => {
    if (isDemoMode()) {
        return {
            stdout: `Demo mode: ${command}`,
            stderr: ''
        };
    }
    try {
        const { stdout, stderr } = await execAsync(`pwsh -Command "${command}"`);
        return { stdout, stderr };
    } catch (error) {
        return {
            stdout: '',
            stderr: error.message
        };
    }
};

module.exports = {
    isDemoMode,
    getRedirectUri,
    getAppUrl,
    getAppName,
    getAppDescription,
    getLoginUrl,
    getToken,
    executePowerShellCommand
}; 