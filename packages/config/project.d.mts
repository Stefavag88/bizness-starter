import type { ZodType } from 'zod';
export interface ProjectConfig {
  name:string; starterVersion:'2.0.0-dev'; schemaVersion:2; profile:'enquiries'|'newsletter'|'nurture'; articles:boolean; modules:Record<string,never>;
  locale:string; languages:{code:string;label:string}[]; siteUrl:string; environment:'local'|'staging'|'production';
  design:{theme:string;density:'comfortable'|'compact'|'spacious'}; legalReviewed:boolean; contentReviewed:boolean;
  interests:{id:string;label:string}[];
  infrastructure:{databaseId:string;sesRegion:string;sender:string;notificationEmail:string;allowedRecipients:string[];sesConfigurationSet:string;snsTopicArn:string;accessIssuer:string;accessAudience:string;adminEmails:string[];editorEmails:string[];sendingEnabled:boolean;marketingEnabled:boolean;sendIntervalMs:number};
}
export const projectSchema: ZodType<ProjectConfig>;
export function parseProject(raw:unknown):ProjectConfig;
