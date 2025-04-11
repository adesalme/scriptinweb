const { ConfidentialClientApplication } = require('@azure/msal-node');
const { Client } = require('@microsoft/microsoft-graph-client');
const { PowerShell } = require('node-powershell');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const { msalConfig, authScopes, endpoints } = require('../config/auth');

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
                    redirectUri: process.env.AZURE_REDIRECT_URI || 'https://scriptinweb.chateauform.com:8443/auth/callback'
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
            if (this.demoMode) {
                console.log('Mode démonstration: URL d\'authentification simulée');
                return `${process.env.APP_URL || 'http://localhost:3000'}/auth/demo-login`;
            }
            
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
            if (this.demoMode) {
                console.log('Mode démonstration: Callback simulé');
                return {
                    accessToken: 'demo-token',
                    account: {
                        username: 'demo@example.com',
                        name: 'Demo User',
                        id: 'demo-id'
                    }
                };
            }
            
            console.log('Traitement du callback avec le code reçu');
            const tokenRequest = {
                code: code,
                scopes: ['https://management.azure.com/.default'],
                redirectUri: this.config.auth.redirectUri,
            };
            console.log('Demande de token avec les paramètres:', tokenRequest);
            const response = await this.msalClient.acquireTokenByCode(tokenRequest);
            console.log('Token acquis avec succès');
            
            return {
                ...response,
                accessToken: response.accessToken,
                expiresOn: response.expiresOn
            };
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
            if (this.demoMode) {
                console.log('Mode démonstration: Informations utilisateur simulées');
                return {
                    displayName: 'Demo User',
                    userPrincipalName: 'demo@example.com',
                    id: 'demo-id'
                };
            }
            
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
        if (this.demoMode) {
            console.log('Mode démonstration: Exécution PowerShell simulée');
            return `Demo mode: ${scriptContent}`;
        }
        
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

// Créer et exporter une instance unique du service d'authentification
const authService = new AuthService();
module.exports = authService; 