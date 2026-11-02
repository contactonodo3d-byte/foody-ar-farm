import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir:'./src/tests', testMatch:'**/*.e2e.ts', use:{channel:'chrome',baseURL:'http://127.0.0.1:5176',viewport:{width:390,height:844},hasTouch:true}, webServer:{command:'npm run dev -- --port 5176 --strictPort',url:'http://127.0.0.1:5176',reuseExistingServer:true} });
