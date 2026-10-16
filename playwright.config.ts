import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./e2e',testIgnore:'composition-probe.spec.ts',timeout:60000,expect:{timeout:15000},workers:1,fullyParallel:false,use:{baseURL:process.env.E2E_BASE_URL||'http://127.0.0.1:4330',headless:true,trace:'retain-on-failure',screenshot:'only-on-failure'},reporter:[['list'],['html',{open:'never'}]]});
