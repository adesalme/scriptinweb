const { Client } = require('@microsoft/microsoft-graph-client');
const { TokenCredentialAuthenticationProvider } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');
const { ClientSecretCredential } = require('@azure/identity');
const config = require('../config/config');
const UserManager = require('../models/User');
const fetch = require('node-fetch');

class AuthService {
    constructor() {
        this.credential = new ClientSecretCredential(
            config.auth.azureAd.tenantId,
            config.auth.azureAd.clientId,
            config.auth.azureAd.clientSecret
        );
        this.authProvider = new TokenCredentialAuthenticationProvider(this.credential, {
            scopes: ['https://graph.microsoft.com/.default']
        });
        this.client = Client.initWithMiddleware({
            authProvider: this.authProvider
        });
    }

    async getAuthUrl() {
        try {
            const authUrl = `https://login.microsoftonline.com/${config.auth.azureAd.tenantId}/oauth2/v2.0/authorize?` +
                `client_id=${config.auth.azureAd.clientId}` +
                `&response_type=code` +
                `&redirect_uri=${encodeURIComponent(config.auth.azureAd.redirectUri)}` +
                `&scope=openid profile email User.Read GroupMember.Read.All`;
            
            return authUrl;
        } catch (error) {
            console.error('Erreur lors de la génération de l\'URL d\'authentification:', error);
            throw new Error('Impossible de générer l\'URL d\'authentification');
        }
    }

    async handleCallback(code) {
        try {
            const tokenEndpoint = `https://login.microsoftonline.com/${config.auth.azureAd.tenantId}/oauth2/v2.0/token`;
            const params = new URLSearchParams();
            params.append('client_id', config.auth.azureAd.clientId);
            params.append('client_secret', config.auth.azureAd.clientSecret);
            params.append('code', code);
            params.append('redirect_uri', config.auth.azureAd.redirectUri);
            params.append('grant_type', 'authorization_code');
            params.append('scope', 'openid profile email User.Read GroupMember.Read.All');

            const response = await fetch(tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Erreur lors de l\'échange du code:', errorData);
                throw new Error(`Erreur lors de l'échange du code: ${errorData.error_description || 'Erreur inconnue'}`);
            }

            const data = await response.json();
            return {
                accessToken: data.access_token,
                idToken: data.id_token,
                expiresIn: data.expires_in
            };
        } catch (error) {
            console.error('Erreur lors du traitement du callback:', error);
            throw new Error('Erreur lors de l\'authentification');
        }
    }

    async getUserInfo(accessToken) {
        try {
            if (!accessToken) {
                throw new Error('Token d\'accès manquant');
            }

            const response = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Erreur lors de la récupération des informations utilisateur:', errorData);
                throw new Error(`Erreur lors de la récupération des informations utilisateur: ${errorData.error?.message || 'Erreur inconnue'}`);
            }

            const userInfo = await response.json();
            console.log('Informations utilisateur récupérées:', userInfo);

            // Vérifier si l'utilisateur existe déjà dans notre système
            let user = await UserManager.getUser(userInfo.id);
            
            if (!user) {
                // Si l'utilisateur n'existe pas, le créer
                user = await UserManager.createUser(userInfo);
                console.log('Nouvel utilisateur créé:', user);
            }

            // Mettre à jour les informations de l'utilisateur avec les données d'Azure AD
            userInfo.isAdmin = user.isAdmin;

            return userInfo;
        } catch (error) {
            console.error('Erreur dans getUserInfo:', error);
            throw new Error(`Erreur lors de la récupération des informations utilisateur: ${error.message}`);
        }
    }
}

module.exports = new AuthService(); 