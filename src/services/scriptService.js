const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

/**
 * Service de gestion des scripts PowerShell
 */
class ScriptService {
    /**
     * Récupère tous les scripts normaux
     * @returns {Promise<Array>} Liste des scripts
     */
    async getScripts() {
        try {
            const scriptsDir = config.scripts.directory;
            await fs.mkdir(scriptsDir, { recursive: true });
            const files = await fs.readdir(scriptsDir);
            return files
                .filter(file => file.endsWith('.ps1'))
                .map(file => ({
                    name: file,
                    path: path.join(scriptsDir, file),
                    isAdmin: false
                }));
        } catch (error) {
            console.error('Erreur lors de la récupération des scripts:', error);
            throw error;
        }
    }

    /**
     * Récupère tous les scripts administratifs
     * @returns {Promise<Array>} Liste des scripts administratifs
     */
    async getAdminScripts() {
        try {
            const adminScriptsDir = config.scripts.adminDirectory;
            await fs.mkdir(adminScriptsDir, { recursive: true });
            const files = await fs.readdir(adminScriptsDir);
            return files
                .filter(file => file.endsWith('.ps1'))
                .map(file => ({
                    name: file,
                    path: path.join(adminScriptsDir, file),
                    isAdmin: true
                }));
        } catch (error) {
            console.error('Erreur lors de la récupération des scripts administratifs:', error);
            throw error;
        }
    }

    /**
     * Récupère un script par son nom
     * @param {string} scriptName - Nom du script
     * @returns {Promise<Object>} Informations sur le script
     */
    async getScript(scriptName) {
        try {
            // Vérifier d'abord dans le répertoire normal
            const normalPath = path.join(config.scripts.directory, scriptName);
            try {
                await fs.access(normalPath);
                const content = await fs.readFile(normalPath, 'utf8');
                return {
                    name: scriptName,
                    path: normalPath,
                    content,
                    isAdmin: false
                };
            } catch (error) {
                // Si non trouvé, vérifier dans le répertoire admin
                const adminPath = path.join(config.scripts.adminDirectory, scriptName);
                await fs.access(adminPath);
                const content = await fs.readFile(adminPath, 'utf8');
                return {
                    name: scriptName,
                    path: adminPath,
                    content,
                    isAdmin: true
                };
            }
        } catch (error) {
            console.error(`Erreur lors de la récupération du script ${scriptName}:`, error);
            return null;
        }
    }

    /**
     * Crée un nouveau script
     * @param {Object} scriptData - Données du script
     * @returns {Promise<Object>} Script créé
     */
    async createScript(scriptData) {
        try {
            const { name, content, isAdmin } = scriptData;
            const scriptDir = isAdmin ? config.scripts.adminDirectory : config.scripts.directory;
            await fs.mkdir(scriptDir, { recursive: true });
            
            const scriptPath = path.join(scriptDir, name);
            await fs.writeFile(scriptPath, content || '', 'utf8');
            
            return {
                name,
                path: scriptPath,
                content,
                isAdmin
            };
        } catch (error) {
            console.error('Erreur lors de la création du script:', error);
            throw error;
        }
    }

    /**
     * Met à jour un script existant
     * @param {string} scriptName - Nom du script
     * @param {string} content - Nouveau contenu
     * @returns {Promise<Object>} Script mis à jour
     */
    async updateScript(scriptName, content) {
        try {
            // Vérifier d'abord dans le répertoire normal
            const normalPath = path.join(config.scripts.directory, scriptName);
            try {
                await fs.access(normalPath);
                await fs.writeFile(normalPath, content, 'utf8');
                return {
                    name: scriptName,
                    path: normalPath,
                    content,
                    isAdmin: false
                };
            } catch (error) {
                // Si non trouvé, vérifier dans le répertoire admin
                const adminPath = path.join(config.scripts.adminDirectory, scriptName);
                await fs.access(adminPath);
                await fs.writeFile(adminPath, content, 'utf8');
                return {
                    name: scriptName,
                    path: adminPath,
                    content,
                    isAdmin: true
                };
            }
        } catch (error) {
            console.error(`Erreur lors de la mise à jour du script ${scriptName}:`, error);
            throw error;
        }
    }

    /**
     * Supprime un script
     * @param {string} scriptName - Nom du script
     * @returns {Promise<boolean>} Succès de l'opération
     */
    async deleteScript(scriptName) {
        try {
            // Vérifier d'abord dans le répertoire normal
            const normalPath = path.join(config.scripts.directory, scriptName);
            try {
                await fs.access(normalPath);
                await fs.unlink(normalPath);
                return true;
            } catch (error) {
                // Si non trouvé, vérifier dans le répertoire admin
                const adminPath = path.join(config.scripts.adminDirectory, scriptName);
                await fs.access(adminPath);
                await fs.unlink(adminPath);
                return true;
            }
        } catch (error) {
            console.error(`Erreur lors de la suppression du script ${scriptName}:`, error);
            throw error;
        }
    }
}

module.exports = new ScriptService(); 