import type {ZodType} from 'zod';
export interface ProviderAnalyticsConfig{enabled:boolean;accountId?:string;queueId?:string;includeAccountTotals:boolean}
export interface ProviderAnalyticsBinding extends ProviderAnalyticsConfig{workerName:string;databaseId:string}
export const providerAnalyticsSchema:ZodType<ProviderAnalyticsConfig>;
export const providerBindingSchema:ZodType<ProviderAnalyticsBinding>;
