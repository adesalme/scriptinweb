const path = require('path');
require('dotenv').config();

const config = {
    app: {
        port: process.env.SSL_ENABLED === 'true' ? (process.env.HTTPS_PORT || 8443) : (process.env.PORT || 3000),
        host: process.env.HOST || 'localhost',
        env: process.env.NODE_ENV || 'development',
        sslEnabled: process.env.SSL_ENABLED === 'true'
    },
    session: {
        secret: process.env.SESSION_SECRET || 'your-session-secret',
        store: {
            path: process.env.SESSION_STORE_PATH || './sessions',
            ttl: 86400 // 24 heures
        },
        cookie: {
            secure: process.env.SSL_ENABLED === 'true',
            maxAge: 24 * 60 * 60 * 1000 // 24 heures
        }
    },
    ssl: {
        certPath: process.env.SSL_CERT_PATH,
        keyPath: process.env.SSL_KEY_PATH
    },
    scripts: {
        directory: path.join(__dirname, '../../', process.env.SCRIPTS_DIR || 'scripts'),
        adminDirectory: path.join(__dirname, '../../', process.env.SCRIPTS_DIR || 'scripts/admin')
    },
    auth: {
        azureAd: {
            clientId: process.env.AZURE_AD_CLIENT_ID,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
            tenantId: process.env.AZURE_AD_TENANT_ID,
            redirectUri: process.env.AZURE_AD_REDIRECT_URI
        }
    }
};

module.exports = config; 