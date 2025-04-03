#!/usr/bin/env node

/**
 * Script to verify deployment of ICP Studio canisters
 * This performs a series of health checks to ensure the deployment is working correctly
 */

import { Actor, HttpAgent } from '@dfinity/agent';
import fetch from 'cross-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default configuration
const DEFAULT_HOST = 'http://localhost:4943';
const ENV_FILE_PATH = path.join(__dirname, '../../../.env');

async function main() {
  console.log('🔍 Verifying ICP Studio deployment...');
  console.log('-------------------------------------------------');

  try {
    // Read canister IDs from .env file
    let backendCanisterId, frontendCanisterId;
    try {
      const envContents = fs.readFileSync(ENV_FILE_PATH, 'utf8');
      const backendMatch = envContents.match(/CANISTER_ID_ICP_STUDIO_BACKEND=([a-z0-9-]+)/);
      const frontendMatch = envContents.match(/CANISTER_ID_ICP_STUDIO_FRONTEND=([a-z0-9-]+)/);
      
      backendCanisterId = backendMatch ? backendMatch[1] : null;
      frontendCanisterId = frontendMatch ? frontendMatch[1] : null;
      
      if (!backendCanisterId || !frontendCanisterId) {
        throw new Error('Could not find canister IDs in .env file');
      }
      
      console.log(`✅ Found canister IDs in .env file`);
      console.log(`🔹 Backend Canister ID: ${backendCanisterId}`);
      console.log(`🔹 Frontend Canister ID: ${frontendCanisterId}`);
    } catch (error) {
      console.error(`❌ Error reading canister IDs: ${error.message}`);
      process.exit(1);
    }

    // Check if frontend canister is accessible
    try {
      const frontendUrl = `${DEFAULT_HOST}/?canisterId=${frontendCanisterId}`;
      console.log(`🌐 Checking frontend at: ${frontendUrl}`);
      
      const response = await fetch(frontendUrl);
      if (response.status === 200) {
        console.log('✅ Frontend canister is accessible');
      } else {
        throw new Error(`Received status ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Frontend canister check failed: ${error.message}`);
      console.log('💡 Is the local replica running? Try "dfx start --background"');
    }

    // Check if backend canister responds to a simple query
    try {
      console.log(`🔌 Checking backend canister...`);
      
      const agent = new HttpAgent({ host: DEFAULT_HOST });
      // In local development, we need to fetch the root key
      await agent.fetchRootKey();
      
      // We'll try to call the getModules method which should exist
      const actor = Actor.createActor(
        // This is a simplified interface - in production code, we would use the actual interface
        ({ IDL }) => {
          return IDL.Service({
            'getModules': IDL.Func([], [IDL.Vec(IDL.Text)], ['query']),
          });
        },
        { agent, canisterId: backendCanisterId }
      );
      
      const result = await actor.getModules();
      console.log(`✅ Backend canister responded to query`);
      console.log(`📊 Found ${result.length} modules`);
    } catch (error) {
      console.error(`❌ Backend canister check failed: ${error.message}`);
    }
    
    console.log('-------------------------------------------------');
    console.log('🚀 Deployment verification complete');
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. Explore the frontend at http://localhost:3000');
    console.log(`2. Or access via canisters at ${DEFAULT_HOST}/?canisterId=${frontendCanisterId}`);
    console.log('3. Create test users and modules to verify functionality');
    
  } catch (error) {
    console.error(`❌ Deployment verification failed: ${error.message}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
}); 