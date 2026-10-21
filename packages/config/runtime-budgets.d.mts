import type {ZodType} from 'zod';
export interface RuntimeBudgetConfig{policyId:'cloudflare-free-v1';dailyDispatchLimit:number|null;transactionalReserve:number;warningPercent:number;criticalPercent:number}
export interface OperationCost{sqlStatements:number;externalCalls:number;internalCalls:number}
export interface RuntimePolicy{ceilings:OperationCost;scheduledSqlAllowances:Record<'dispatch'|'campaign'|'enrollment'|'maintenance',number>;maxDispatchJobs:number;maxFanoutRecipients:number;consumerBatchSize:number;consumerConcurrency:number;cleanupLimit:number;cleanupEveryMinutes:number;telemetryStatementReserve:number}
export const runtimeBudgetSchema:ZodType<RuntimeBudgetConfig>;
export function parseRuntimeBudget(raw?:unknown):RuntimeBudgetConfig;
export function resolveRuntimePolicy(profile:string):RuntimePolicy;
