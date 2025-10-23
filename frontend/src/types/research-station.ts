export type StationType = 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface StationConfig {
  maxRecordsPerDay: number;
  maxAnalysts: number;
  maxModels: number;
  storageLimit: string;
  realTimeAnalysis: boolean;
  predictiveMetrics: boolean;
  customPolicies: boolean;
  apiAccess: boolean;
  supportResponseTime: string;
  dedicatedAnalyst: boolean;
  trainingHours: number;
}

export interface AnalystProfile {
  id: string;
  name: string;
  email: string;
  role: 'ANALYST' | 'LEAD_ANALYST' | 'ADMIN';
  stations: string[]; // Research station IDs
}

export interface AIModelProfile {
  id: string;
  name: string;
  provider: string;
  type: string;
  version: string;
  capabilities: string[];
  stationId: string;
}

export interface MonitoringConfig {
  auditFrequency: number; // minutes
  alertThresholds: {
    cries: number; // 0-1
    driftTolerance: number; // 0-1
    ethicsScore: number; // 0-1
  };
  interventionRules: {
    autoPause: boolean;
    notifyStakeholders: boolean;
    requireApproval: boolean;
  };
}

export interface ResearchStation {
  id: string;
  name: string;
  type: StationType;
  config: StationConfig;
  analysts: AnalystProfile[];
  models: AIModelProfile[];
  monitoringConfig: MonitoringConfig;
  orgId: string;
  createdAt: Date;
  updatedAt: Date;
}