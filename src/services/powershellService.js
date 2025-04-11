const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const fs = require('fs');

class PowerShellService {
    constructor() {
        this.isWindows = process.platform === 'win32';
        this.isPwshAvailable = this._checkPwshAvailable();
    }

    _checkPwshAvailable() {
        try {
            require('child_process').execSync(this.isWindows ? 'where pwsh' : 'which pwsh');
            return true;
        } catch (error) {
            return false;
        }
    }

    async executeCommand(command) {
        return new Promise((resolve, reject) => {
            const pwsh = spawn(this.isWindows ? 'pwsh.exe' : 'pwsh', ['-Command', command]);
            let output = '';
            let error = '';

            pwsh.stdout.on('data', (data) => {
                output += data.toString();
            });

            pwsh.stderr.on('data', (data) => {
                error += data.toString();
            });

            pwsh.on('close', (code) => {
                if (code !== 0) {
                    reject(error || 'Erreur lors de l\'exécution de la commande');
                } else {
                    resolve(output);
                }
            });
        });
    }

    async executeScript(scriptContent) {
        const tempFile = path.join(os.tmpdir(), `script_${Date.now()}.ps1`);
        await fs.promises.writeFile(tempFile, scriptContent);
        
        try {
            const output = await this.executeCommand(`. "${tempFile}"`);
            await fs.promises.unlink(tempFile);
            return output;
        } catch (error) {
            await fs.promises.unlink(tempFile);
            throw error;
        }
    }

    cleanOutput(output) {
        if (!output) return '';
        return output
            .replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '')
            .replace(/\[[\d;]*[a-zA-Z]/g, '')
            .replace(/\[\?1[hl]/g, '')
            .replace(/\r\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    requiresInteractiveAuth(scriptContent) {
        const interactiveAuthPatterns = [
            'Connect-AzAccount -Interactive',
            'Connect-ExchangeOnline -Interactive',
            'Connect-MgGraph -Interactive',
            'Connect-AzAccount -UseDeviceAuthentication',
            'Connect-ExchangeOnline -UseDeviceAuthentication',
            'Connect-MgGraph -UseDeviceAuthentication'
        ];

        return interactiveAuthPatterns.some(pattern => 
            scriptContent.toLowerCase().includes(pattern.toLowerCase())
        );
    }
}

module.exports = new PowerShellService(); 