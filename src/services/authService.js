const { ConfidentialClientApplication } = require('@azure/msal-node');
const { PowerShell } = require('node-powershell');
const { msalConfig, authScopes } = require('../config/auth');

class AuthService {
    constructor() {
        // Vérifier si nous sommes en mode démonstration
        this.demoMode = process.env.DEMO_MODE === 'true';
        
        if (!this.demoMode) {
            this.config = {
                auth: {
                    clientId: process.env.AZURE_CLIENT_ID,
                    clientSecret: process.env.AZURE_CLIENT_SECRET,
                    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
                    redirectUri: process.env.AZURE_REDIRECT_URI || 'http://localhost:3000/auth/callback'
                }
            };
            
            this.msalClient = new ConfidentialClientApplication(this.config);
            console.log('Mode d\'authentification Azure activé');
        } else {
            console.log('Mode démonstration activé (sans authentification Azure)');
        }
    }

    // Générer l'URL de connexion
    async getAuthUrl() {
        if (this.demoMode) {
            return '/auth/demo-login';
        }
        
        const state = this.generateState();
        const authCodeUrlParameters = {
            scopes: authScopes.userScopes,
            redirectUri: this.config.auth.redirectUri,
            state: state
        };
        
        return await this.msalClient.getAuthCodeUrl(authCodeUrlParameters);
    }

    // Gérer le callback de l'authentification
    async handleCallback(code) {
        if (this.demoMode) {
            return {
                accessToken: 'demo-token',
                expiresOn: new Date(Date.now() + 3600000).toISOString()
            };
        }
        
        const tokenRequest = {
            code: code,
            scopes: ['https://management.azure.com/.default'],
            redirectUri: this.config.auth.redirectUri,
        };
        
        const response = await this.msalClient.acquireTokenByCode(tokenRequest);
        
        return {
            accessToken: response.accessToken,
            expiresOn: response.expiresOn
        };
    }

    // Générer un état aléatoire pour la sécurité
    generateState() {
        return Math.random().toString(36).substring(2, 15);
    }

    // Obtenir les informations de l'utilisateur
    async getUserInfo(accessToken) {
        if (this.demoMode) {
            return {
                displayName: 'Demo User',
                userPrincipalName: 'demo@example.com',
                id: 'demo-id'
            };
        }
        
        // Dans une version simplifiée, on peut retourner des informations basiques
        return {
            displayName: 'Utilisateur Azure',
            userPrincipalName: 'user@example.com',
            id: 'user-id'
        };
    }

    // Nettoyer la sortie des caractères de contrôle ANSI
    cleanOutput(output) {
        if (!output) return '';
        return output
            .replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '') // Supprime les séquences ANSI
            .replace(/\[[\d;]*[a-zA-Z]/g, '') // Supprime les codes de couleur
            .replace(/\[\?1[hl]/g, '') // Supprime les codes de curseur
            .replace(/\r\n/g, '\n') // Normalise les retours à la ligne
            .replace(/\n{3,}/g, '\n\n') // Réduit les lignes vides multiples
            .trim(); // Supprime les espaces en début et fin
    }

    // Exécuter un script PowerShell
    async executePowerShellWithToken(scriptContent, service, accessToken) {
        if (this.demoMode) {
            return `Mode démonstration: Exécution simulée du script\n${scriptContent}`;
        }
        
        // Vérifier si le script nécessite une authentification
        const requiresAuth = this.scriptRequiresAuth(scriptContent, service);
        
        let ps = null;
        try {
            ps = new PowerShell({
                executionPolicy: 'Bypass',
                noProfile: true
            });

            let commands = [];
            
            // Configuration de base
            commands.push('$ErrorActionPreference = "Stop"');
            commands.push('$ProgressPreference = "SilentlyContinue"');
            commands.push('$VerbosePreference = "SilentlyContinue"');
            commands.push('$DebugPreference = "SilentlyContinue"');
            commands.push('$InformationPreference = "SilentlyContinue"');
            commands.push('$Host.UI.RawUI.WindowTitle = "PowerShell"');

            // Ajouter le token d'accès uniquement si nécessaire
            if (requiresAuth && accessToken) {
                commands.push(`$env:AZURE_ACCESS_TOKEN = '${accessToken}'`);
            }

            // Ajouter le script à exécuter
            commands.push(scriptContent);

            // Exécuter toutes les commandes en une fois
            const result = await ps.invoke(commands.join('; '));
            return this.cleanOutput(result.raw);

        } catch (error) {
            console.error('Erreur PowerShell:', error);
            throw error;
        } finally {
            if (ps) {
                await ps.dispose();
            }
        }
    }

    // Vérifier si un script nécessite une authentification
    scriptRequiresAuth(scriptContent, service) {
        // Liste des commandes qui nécessitent une authentification
        const authCommands = [
            'Connect-AzAccount',
            'Connect-AzureAD',
            'Connect-ExchangeOnline',
            'Connect-MgGraph',
            'Connect-MicrosoftTeams',
            'Connect-PnPOnline',
            'Connect-SPOService',
            'Connect-SPOnline'
        ];
        
        // Vérifier si le script contient des commandes d'authentification
        for (const cmd of authCommands) {
            if (scriptContent.includes(cmd)) {
                return true;
            }
        }
        
        // Vérifier le service spécifié
        if (service === 'azure' || service === 'exchange' || service === 'graph') {
            return true;
        }
        
        return false;
    }
}

// Créer et exporter une instance unique du service d'authentification
const authService = new AuthService();
module.exports = authService; 