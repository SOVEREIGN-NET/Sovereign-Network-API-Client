/**
 * Abstract configuration provider interface
 * Implemented differently for each platform
 */

import { ApiConfig } from './types';

export interface ConfigProvider {
  /**
   * Get configuration from platform-specific source
   * - Electron: IPC from main process
   * - React Native: AsyncStorage or environment
   * - Browser: API endpoint or localStorage
   */
  getConfig(): Promise<ApiConfig>;
}
