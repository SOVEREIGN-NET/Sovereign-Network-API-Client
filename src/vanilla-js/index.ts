/**
 * Vanilla JS / Browser entry point
 * Exports everything needed for browser/Node.js apps
 */

export { BrowserConfigProvider } from './config-provider';
export { ZhtpApi } from '../core/zhtp-api';
export type { FetchAdapter } from '../core/zhtp-api-core';
export type {
  Identity,
  Wallet,
  NetworkStatus,
  DaoProposal,
  DaoStats,
  Transaction,
  ApiConfig,
  ApiResponse,
  IdentityRecoveryData,
  Delegate,
  ProposalDetails,
  TreasuryRecord,
  DApp,
  SmartContract,
  ContractPermissions,
  ContractDeploymentResult,
  ContractExecutionResult,
  Asset,
  NodeStatus,
  GasInfo,
  Proof,
} from '../core/types';
export type { ConfigProvider } from '../core/config-provider';
