import type { ZodType } from 'zod';
import type {ProviderAnalyticsConfig} from './provider-analytics.mjs';
import type {RuntimeBudgetConfig} from './runtime-budgets.mjs';
export interface MediaOptimization { enabled:boolean; widths:number[]; quality:number }
export interface MotionConfig {enabled:boolean;durationMs:number;distancePx:number;staggerMs:number;interactionMs:number}
export const motionSchema: ZodType<MotionConfig>;
export interface ProjectConfig {
  name:string; starterVersion:'2.0.0-dev'; schemaVersion:2; profile:'enquiries'|'newsletter'|'nurture'; articles:boolean; modules:{rooms:boolean;newsletterPrompt:boolean;visitorPreferences:boolean};
  locale:string; languages:{code:string;label:string}[]; siteUrl:string; environment:'local'|'staging'|'production';
  design:{theme:string;density:'comfortable'|'compact'|'spacious';motion:MotionConfig}; legalReviewed:boolean; contentReviewed:boolean;
  interests:{id:string;label:string}[];
  media:{optimization:MediaOptimization};
  infrastructure:{providerAnalytics:ProviderAnalyticsConfig;runtimeBudget:RuntimeBudgetConfig;databaseId:string;sesRegion:string;sender:string;notificationEmail:string;allowedRecipients:string[];sesConfigurationSet:string;snsTopicArn:string;accessIssuer:string;accessAudience:string;adminEmails:string[];editorEmails:string[];sendingEnabled:boolean;marketingEnabled:boolean;sendIntervalMs:number};
}
export const projectSchema: ZodType<ProjectConfig>;
export function parseProject(raw:unknown):ProjectConfig;
