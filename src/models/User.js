const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

class UserManager {
    constructor() {
        this.usersFile = path.join(__dirname, '../../data/users.json');
        this.users = [];
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            // Créer le dossier data s'il n'existe pas
            await fs.mkdir(path.dirname(this.usersFile), { recursive: true });
            
            // Charger les utilisateurs existants
            try {
                const data = await fs.readFile(this.usersFile, 'utf8');
                this.users = JSON.parse(data);
            } catch (error) {
                // Si le fichier n'existe pas, créer un tableau vide
                this.users = [];
                await this.saveUsers();
            }
            
            this.initialized = true;
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du gestionnaire d\'utilisateurs:', error);
            throw error;
        }
    }

    async saveUsers() {
        await fs.writeFile(this.usersFile, JSON.stringify(this.users, null, 2));
    }

    async createUser(userInfo) {
        await this.init();
        
        // Vérifier si c'est le premier utilisateur
        const isFirstUser = this.users.length === 0;
        
        const newUser = {
            id: userInfo.id,
            displayName: userInfo.displayName,
            email: userInfo.userPrincipalName,
            isAdmin: isFirstUser, // Le premier utilisateur est automatiquement admin
            createdAt: new Date().toISOString()
        };
        
        this.users.push(newUser);
        await this.saveUsers();
        return newUser;
    }

    async getUser(id) {
        await this.init();
        return this.users.find(user => user.id === id);
    }

    async updateUser(id, updates) {
        await this.init();
        const index = this.users.findIndex(user => user.id === id);
        if (index !== -1) {
            this.users[index] = { ...this.users[index], ...updates };
            await this.saveUsers();
            return this.users[index];
        }
        return null;
    }

    async getAllUsers() {
        await this.init();
        return this.users;
    }

    async setAdmin(id, isAdmin) {
        await this.init();
        const user = await this.updateUser(id, { isAdmin });
        return user;
    }
}

module.exports = new UserManager(); 