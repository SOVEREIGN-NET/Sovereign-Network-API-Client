/**
 * Electron specific configuration provider
 * Uses Electron IPC to get config from main process
 */
import { ConfigProvider } from '../core/config-provider';
import { ApiConfig } from '../core/types';
export declare class ElectronConfigProvider implements ConfigProvider {
    private ipcRenderer;
    private cacheKey;
    private cache;
    constructor(ipcRenderer?: any);
    getConfig(): Promise<ApiConfig>;
    /**
     * Clear cached config to force reload from IPC
     */
    clearCache(): void;
}
//# sourceMappingURL=config-provider.d.ts.map