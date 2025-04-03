#!/usr/bin/env node

/**
 * Script to verify testnet deployment of ICP Studio canisters
 * and monitor performance and cycles consumption
 */

import { Actor, HttpAgent } from '@dfinity/agent';
import fetch from 'cross-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default configuration
const DEPLOY_INFO_PATH = path.join(__dirname, '../../../deploy-info.txt');
const IC_HOST = 'https://ic0.app';

async function main() {
  console.log('🔍 Verifying ICP Studio testnet deployment...');
  console.log('-------------------------------------------------');

  try {
    // Read deployment info from file
    let backendCanisterId, frontendCanisterId;
    try {
      if (fs.existsSync(DEPLOY_INFO_PATH)) {
        const deployInfo = fs.readFileSync(DEPLOY_INFO_PATH, 'utf8');
        const backendMatch = deployInfo.match(/Backend Canister ID: ([a-z0-9-]+)/);
        const frontendMatch = deployInfo.match(/Frontend Canister ID: ([a-z0-9-]+)/);
        
        backendCanisterId = backendMatch ? backendMatch[1] : null;
        frontendCanisterId = frontendMatch ? frontendMatch[1] : null;
        
        if (!backendCanisterId || !frontendCanisterId) {
          throw new Error('Could not find canister IDs in deploy-info.txt');
        }
        
        console.log(`✅ Found canister IDs in deployment info`);
      } else {
        // If deploy-info.txt doesn't exist, try to get canister IDs directly
        console.log("Deploy info file not found, fetching canister IDs from dfx...");
        const { stdout: backendId } = await execPromise('dfx canister --network ic id icp_studio_backend');
        const { stdout: frontendId } = await execPromise('dfx canister --network ic id icp_studio_frontend');
        
        backendCanisterId = backendId.trim();
        frontendCanisterId = frontendId.trim();
        
        if (!backendCanisterId || !frontendCanisterId) {
          throw new Error('Could not fetch canister IDs from dfx');
        }
        
        console.log(`✅ Retrieved canister IDs from dfx`);
      }
      
      console.log(`🔹 Backend Canister ID: ${backendCanisterId}`);
      console.log(`🔹 Frontend Canister ID: ${frontendCanisterId}`);
    } catch (error) {
      console.error(`❌ Error reading canister IDs: ${error.message}`);
      process.exit(1);
    }

    // Check if frontend canister is accessible
    try {
      const frontendUrl = `https://${frontendCanisterId}.ic0.app/`;
      console.log(`🌐 Checking frontend at: ${frontendUrl}`);
      
      console.time('Frontend Response Time');
      const response = await fetch(frontendUrl);
      console.timeEnd('Frontend Response Time');
      
      if (response.status === 200) {
        console.log('✅ Frontend canister is accessible');
      } else {
        throw new Error(`Received status ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Frontend canister check failed: ${error.message}`);
    }

    // Check backend canister status and cycles
    try {
      console.log(`🔌 Checking backend canister status...`);
      
      const { stdout: statusOutput } = await execPromise(`dfx canister --network ic status ${backendCanisterId}`);
      console.log("Canister status:");
      console.log(statusOutput);
      
      // Extract cycles from status output
      const cyclesMatch = statusOutput.match(/Cycles: (\d+)/);
      if (cyclesMatch) {
        const cycles = parseInt(cyclesMatch[1]);
        console.log(`💰 Current cycles balance: ${cycles}`);
        
        // Calculate cycles consumption rate if we have previous data
        try {
          if (fs.existsSync(DEPLOY_INFO_PATH)) {
            const deployInfo = fs.readFileSync(DEPLOY_INFO_PATH, 'utf8');
            const previousCyclesMatch = deployInfo.match(/Cycles Balance: (\d+)/);
            
            if (previousCyclesMatch) {
              const previousCycles = parseInt(previousCyclesMatch[1]);
              const deployDateMatch = deployInfo.match(/Deployment Date: (.*)/);
              const deployDate = deployDateMatch ? new Date(deployDateMatch[1]) : null;
              
              if (deployDate) {
                const currentDate = new Date();
                const hoursElapsed = (currentDate - deployDate) / (1000 * 60 * 60);
                
                if (hoursElapsed > 0) {
                  const cyclesConsumed = previousCycles - cycles;
                  const cyclesPerHour = cyclesConsumed / hoursElapsed;
                  
                  console.log(`⏱️ Cycles consumption rate: ~${Math.round(cyclesPerHour)} cycles/hour`);
                  console.log(`⏳ Estimated canister lifetime with current balance: ~${Math.round(cycles / cyclesPerHour)} hours`);
                }
              }
            }
          }
        } catch (error) {
          console.log(`ℹ️ Could not calculate cycles consumption rate: ${error.message}`);
        }
      }
    } catch (error) {
      console.error(`❌ Backend canister status check failed: ${error.message}`);
    }

    // Test backend canister response time
    try {
      console.log(`🧪 Testing backend canister performance...`);
      
      const agent = new HttpAgent({ host: IC_HOST });
      
      // Create an actor to interact with the backend
      const actor = Actor.createActor(
        ({ IDL }) => {
          return IDL.Service({
            'getModules': IDL.Func([], [IDL.Vec(IDL.Text)], ['query']),
          });
        },
        { agent, canisterId: backendCanisterId }
      );
      
      // Test query performance
      console.log("Measuring query response time (5 calls):");
      for (let i = 1; i <= 5; i++) {
        console.time(`Query #${i}`);
        try {
          const result = await actor.getModules();
          console.timeEnd(`Query #${i}`);
          console.log(`  - Retrieved ${result.length} modules`);
        } catch (error) {
          console.timeEnd(`Query #${i}`);
          console.log(`  - Error: ${error.message}`);
        }
      }
    } catch (error) {
      console.error(`❌ Backend performance test failed: ${error.message}`);
    }
    
    // Update deploy-info.txt with latest cycles information
    try {
      if (fs.existsSync(DEPLOY_INFO_PATH)) {
        const { stdout: cyclesOutput } = await execPromise(`dfx wallet --network ic balance`);
        const currentCycles = cyclesOutput.trim();
        
        const deployInfo = fs.readFileSync(DEPLOY_INFO_PATH, 'utf8');
        const updatedInfo = deployInfo.replace(/Cycles Balance: .*/, `Cycles Balance: ${currentCycles}`);
        
        fs.writeFileSync(DEPLOY_INFO_PATH, updatedInfo);
        console.log(`✅ Updated cycles information in deploy-info.txt`);
      }
    } catch (error) {
      console.log(`ℹ️ Could not update cycles information: ${error.message}`);
    }
    
    console.log('-------------------------------------------------');
    console.log('🚀 Testnet verification complete');
    console.log('');
    console.log('📝 Next steps:');
    console.log(`1. Access your application at: https://${frontendCanisterId}.ic0.app/`);
    console.log('2. Monitor cycles consumption regularly with this script');
    console.log('3. Add additional test users to verify functionality');
    
  } catch (error) {
    console.error(`❌ Testnet verification failed: ${error.message}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
}); 