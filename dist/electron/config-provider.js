/**
 * Electron specific configuration provider
 * Uses Electron IPC to get config from main process
 */
export class ElectronConfigProvider {
    constructor(ipcRenderer) {
        this.cacheKey = 'zhtp_config';
        this.cache = null;
        // Accept injected ipcRenderer for testing
        if (ipcRenderer) {
            this.ipcRenderer = ipcRenderer;
        }
        else if (typeof window !== 'undefined' && typeof require !== 'undefined') {
            try {
                // Try modern electronAPI (with preload script)
                const win = window;
                if (win.electronAPI) {
                    this.ipcRenderer = win.electronAPI;
                }
                else {
                    // Fall back to direct require
                    this.ipcRenderer = require('electron').ipcRenderer;
                }
            }
            catch (e) {
                console.error('Failed to load Electron IPC:', e);
            }
        }
    }
    async getConfig() {
        // Return cached config if available
        if (this.cache) {
            return this.cache;
        }
        if (!this.ipcRenderer) {
            throw new Error('Electron IPC not available. Make sure this is running in Electron.');
        }
        try {
            // Try modern electronAPI.getConfig()
            if (this.ipcRenderer.getConfig) {
                this.cache = await this.ipcRenderer.getConfig();
            }
            // Fall back to ipcRenderer.invoke
            else if (this.ipcRenderer.invoke) {
                this.cache = await this.ipcRenderer.invoke('get-config');
            }
            else {
                throw new Error('No compatible IPC method found');
            }
            if (!this.cache) {
                throw new Error('No config returned from IPC');
            }
            return this.cache;
        }
        catch (error) {
            console.error('Failed to get config from Electron main process:', error);
            throw error;
        }
    }
    /**
     * Clear cached config to force reload from IPC
     */
    clearCache() {
        this.cache = null;
    }
}
//# sourceMappingURL=config-provider.js.map