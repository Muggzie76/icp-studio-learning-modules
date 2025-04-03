#!/usr/bin/env node

/**
 * ICP Studio Mainnet Verification Script
 * 
 * This script verifies the health and performance of deployed mainnet canisters.
 * It performs several checks:
 * 1. Canister accessibility
 * 2. Basic functionality
 * 3. Performance metrics
 * 4. Cycles consumption
 */

const fetch = require('node-fetch');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// ANSI color codes for output formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

// Configuration
const CONFIG = {
  network: 'ic',
  numApiCalls: 10, // Number of API calls to make for performance testing
  cycleCheckIntervalHours: 2, // Hours between cycle checks
  deployInfoPath: path.join(__dirname, '..', '..', '..', '..', 'deploy-info.txt')
};

// Prepare log file
const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}
const LOG_FILE = path.join(LOG_DIR, `mainnet-verification-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);

// Helper functions
function log(message, consoleOnly = false) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  
  if (!consoleOnly) {
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
  }
}

function logSection(title) {
  const line = '═'.repeat(50);
  log(`\n${colors.bright}${line}`);
  log(`  ${title}`);
  log(`${line}${colors.reset}\n`);
}

function formatTime(ms) {
  return `${ms.toFixed(2)}ms`;
}

async function getCanisterIds() {
  try {
    if (fs.existsSync(CONFIG.deployInfoPath)) {
      const deployInfo = fs.readFileSync(CONFIG.deployInfoPath, 'utf8');
      const backendMatch = deployInfo.match(/Backend Canister ID: ([\w-]+)/);
      const frontendMatch = deployInfo.match(/Frontend Canister ID: ([\w-]+)/);
      
      if (backendMatch && frontendMatch) {
        return {
          backend: backendMatch[1],
          frontend: frontendMatch[1]
        };
      }
    }
    
    // If deploy-info.txt doesn't exist or doesn't contain the expected information,
    // get canister IDs from dfx
    log(`${colors.yellow}⚠ Could not find canister IDs in deploy-info.txt. Using dfx to retrieve them.${colors.reset}`);
    const backendId = execSync(`dfx canister --network ${CONFIG.network} id icp_studio_backend`).toString().trim();
    const frontendId = execSync(`dfx canister --network ${CONFIG.network} id icp_studio_frontend`).toString().trim();
    
    return { backend: backendId, frontend: frontendId };
  } catch (error) {
    log(`${colors.red}✘ Error getting canister IDs: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

async function checkCanisterStatus(canisterId, name) {
  try {
    log(`Checking ${name} canister status...`);
    const status = execSync(`dfx canister --network ${CONFIG.network} status ${canisterId}`).toString();
    
    // Extract cycles information
    const cyclesMatch = status.match(/Cycles: (\d+)/);
    const cycles = cyclesMatch ? cyclesMatch[1] : 'Unknown';
    
    // Extract status information
    const runningMatch = status.match(/Status: ([\w\s]+)/);
    const statusText = runningMatch ? runningMatch[1].trim() : 'Unknown';
    
    log(`${colors.blue}${name} canister:${colors.reset}`);
    log(`  Status: ${statusText === 'Running' ? colors.green : colors.yellow}${statusText}${colors.reset}`);
    log(`  Cycles: ${formatCycles(cycles)}`);
    log(`  ID: ${canisterId}`);
    
    return {
      canisterId,
      status: statusText,
      cycles
    };
  } catch (error) {
    log(`${colors.red}✘ Error checking ${name} canister status: ${error.message}${colors.reset}`);
    return {
      canisterId,
      status: 'Error',
      cycles: 'Unknown',
      error: error.message
    };
  }
}

function formatCycles(cycles) {
  if (cycles === 'Unknown') return `${colors.yellow}Unknown${colors.reset}`;
  
  const cyclesNum = parseInt(cycles, 10);
  if (isNaN(cyclesNum)) return `${colors.yellow}${cycles}${colors.reset}`;
  
  // Format with T, B, M, or K suffix
  if (cyclesNum >= 1e12) {
    return `${colors.green}${(cyclesNum / 1e12).toFixed(2)}T${colors.reset}`;
  } else if (cyclesNum >= 1e9) {
    return `${colors.green}${(cyclesNum / 1e9).toFixed(2)}B${colors.reset}`;
  } else if (cyclesNum >= 1e6) {
    return `${colors.green}${(cyclesNum / 1e6).toFixed(2)}M${colors.reset}`;
  } else if (cyclesNum >= 1e3) {
    return `${colors.green}${(cyclesNum / 1e3).toFixed(2)}K${colors.reset}`;
  }
  
  return `${colors.green}${cyclesNum}${colors.reset}`;
}

async function checkFrontendAccessibility(canisterId) {
  try {
    log(`Checking frontend accessibility...`);
    const frontendUrl = `https://${canisterId}.ic0.app/`;
    log(`Attempting to access: ${frontendUrl}`);
    
    const startTime = performance.now();
    const response = await fetch(frontendUrl);
    const endTime = performance.now();
    
    if (response.ok) {
      const responseTime = endTime - startTime;
      log(`${colors.green}✓ Frontend is accessible (HTTP ${response.status})${colors.reset}`);
      log(`  Response time: ${formatTime(responseTime)}`);
      
      return {
        accessible: true,
        status: response.status,
        responseTime
      };
    } else {
      log(`${colors.red}✘ Frontend returned HTTP ${response.status}${colors.reset}`);
      return {
        accessible: false,
        status: response.status,
        error: `HTTP ${response.status}`
      };
    }
  } catch (error) {
    log(`${colors.red}✘ Error accessing frontend: ${error.message}${colors.reset}`);
    return {
      accessible: false,
      error: error.message
    };
  }
}

async function testBackendPerformance(canisterId) {
  log(`Testing backend performance...`);
  
  try {
    // Test getAvailableModules function (should be publicly accessible)
    const results = [];
    
    for (let i = 0; i < CONFIG.numApiCalls; i++) {
      log(`Executing API call ${i + 1}/${CONFIG.numApiCalls}...`, true);
      
      const startTime = performance.now();
      const output = execSync(
        `dfx canister --network ${CONFIG.network} call ${canisterId} getAvailableModules`
      ).toString();
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;
      results.push(executionTime);
      
      log(`  Call ${i + 1}: ${formatTime(executionTime)}`, true);
      
      // Small delay between calls
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Calculate statistics
    const avg = results.reduce((sum, time) => sum + time, 0) / results.length;
    const min = Math.min(...results);
    const max = Math.max(...results);
    
    log(`${colors.green}✓ Backend performance test completed${colors.reset}`);
    log(`  Average response time: ${formatTime(avg)}`);
    log(`  Minimum response time: ${formatTime(min)}`);
    log(`  Maximum response time: ${formatTime(max)}`);
    
    return {
      success: true,
      averageTime: avg,
      minTime: min,
      maxTime: max
    };
  } catch (error) {
    log(`${colors.red}✘ Error testing backend performance: ${error.message}${colors.reset}`);
    return {
      success: false,
      error: error.message
    };
  }
}

async function calculateCyclesConsumptionRate(backendId) {
  try {
    // Check current cycles
    log(`Calculating cycles consumption rate...`);
    
    const currentStatus = execSync(`dfx canister --network ${CONFIG.network} status ${backendId}`).toString();
    const cyclesMatch = currentStatus.match(/Cycles: (\d+)/);
    const currentCycles = cyclesMatch ? parseInt(cyclesMatch[1], 10) : null;
    
    if (!currentCycles) {
      log(`${colors.yellow}⚠ Could not determine current cycles balance${colors.reset}`);
      return {
        success: false,
        error: 'Could not determine current cycles balance'
      };
    }
    
    // Store the measurement for future comparison
    const measurementFile = path.join(LOG_DIR, 'cycles-measurements.json');
    let measurements = [];
    
    if (fs.existsSync(measurementFile)) {
      try {
        measurements = JSON.parse(fs.readFileSync(measurementFile, 'utf8'));
      } catch (err) {
        log(`${colors.yellow}⚠ Error reading previous measurements: ${err.message}${colors.reset}`);
      }
    }
    
    // Add current measurement
    const timestamp = Date.now();
    measurements.push({
      timestamp,
      cycles: currentCycles,
      canisterId: backendId
    });
    
    // Keep only recent measurements (last 30 days)
    const thirtyDaysAgo = timestamp - (30 * 24 * 60 * 60 * 1000);
    measurements = measurements.filter(m => m.timestamp >= thirtyDaysAgo);
    
    // Save updated measurements
    fs.writeFileSync(measurementFile, JSON.stringify(measurements, null, 2));
    
    // Find a previous measurement to compare with
    // Preferably one that's close to CONFIG.cycleCheckIntervalHours ago
    const targetTime = timestamp - (CONFIG.cycleCheckIntervalHours * 60 * 60 * 1000);
    let bestMatch = null;
    let smallestDiff = Infinity;
    
    for (const m of measurements) {
      if (m.timestamp < timestamp) {
        const diff = Math.abs(m.timestamp - targetTime);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          bestMatch = m;
        }
      }
    }
    
    if (bestMatch) {
      const hoursDiff = (timestamp - bestMatch.timestamp) / (60 * 60 * 1000);
      const cyclesDiff = bestMatch.cycles - currentCycles;
      
      if (cyclesDiff > 0) {
        const hourlyRate = cyclesDiff / hoursDiff;
        const dailyRate = hourlyRate * 24;
        const monthlyRate = dailyRate * 30;
        const yearlyCost = monthlyRate * 12;
        
        log(`${colors.blue}Cycles consumption analysis:${colors.reset}`);
        log(`  Current balance: ${formatCycles(currentCycles.toString())}`);
        log(`  Previous balance: ${formatCycles(bestMatch.cycles.toString())} (${hoursDiff.toFixed(1)} hours ago)`);
        log(`  Consumption rate:`);
        log(`    Hourly: ${formatCycles(hourlyRate.toFixed(0))}`);
        log(`    Daily: ${formatCycles(dailyRate.toFixed(0))}`);
        log(`    Monthly: ${formatCycles(monthlyRate.toFixed(0))}`);
        log(`  Approximate yearly cost: ${formatCycles(yearlyCost.toFixed(0))}`);
        
        const remainingDays = currentCycles / dailyRate;
        log(`  Estimated remaining time: ${remainingDays.toFixed(1)} days`);
        
        return {
          success: true,
          currentCycles,
          previousCycles: bestMatch.cycles,
          hourlyRate,
          dailyRate,
          monthlyRate,
          yearlyCost,
          remainingDays
        };
      } else {
        log(`${colors.yellow}⚠ No cycles consumption detected or cycles were added since last check${colors.reset}`);
        return {
          success: false,
          error: 'No cycles consumption detected or cycles were added'
        };
      }
    } else {
      log(`${colors.yellow}⚠ No previous measurement found for comparison${colors.reset}`);
      log(`  Current balance: ${formatCycles(currentCycles.toString())}`);
      log(`  A baseline measurement has been recorded for future comparison`);
      
      return {
        success: false,
        error: 'No previous measurement found for comparison'
      };
    }
  } catch (error) {
    log(`${colors.red}✘ Error calculating cycles consumption: ${error.message}${colors.reset}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Main function
async function main() {
  try {
    logSection('ICP Studio Mainnet Verification');
    log(`Verification started: ${new Date().toISOString()}`);
    log(`Log file: ${LOG_FILE}`);
    
    // Get canister IDs
    const canisterIds = await getCanisterIds();
    log(`Canister IDs retrieved:`);
    log(`  Backend: ${canisterIds.backend}`);
    log(`  Frontend: ${canisterIds.frontend}`);
    
    // Check canister status
    logSection('Canister Status Check');
    const backendStatus = await checkCanisterStatus(canisterIds.backend, 'Backend');
    const frontendStatus = await checkCanisterStatus(canisterIds.frontend, 'Frontend');
    
    // Check frontend accessibility
    logSection('Frontend Accessibility Check');
    const frontendAccessibility = await checkFrontendAccessibility(canisterIds.frontend);
    
    // Test backend performance
    logSection('Backend Performance Test');
    const performanceResults = await testBackendPerformance(canisterIds.backend);
    
    // Calculate cycles consumption rate
    logSection('Cycles Consumption Analysis');
    const cyclesAnalysis = await calculateCyclesConsumptionRate(canisterIds.backend);
    
    // Generate verification summary
    logSection('Verification Summary');
    log(`Backend Status: ${backendStatus.status === 'Running' ? colors.green + 'Running' + colors.reset : colors.red + backendStatus.status + colors.reset}`);
    log(`Frontend Status: ${frontendStatus.status === 'Running' ? colors.green + 'Running' + colors.reset : colors.red + frontendStatus.status + colors.reset}`);
    log(`Frontend Accessibility: ${frontendAccessibility.accessible ? colors.green + 'Accessible' + colors.reset : colors.red + 'Not Accessible' + colors.reset}`);
    log(`Backend Performance: ${performanceResults.success ? colors.green + 'Test Passed' + colors.reset : colors.red + 'Test Failed' + colors.reset}`);
    
    if (performanceResults.success) {
      log(`  Average Response Time: ${formatTime(performanceResults.averageTime)}`);
    }
    
    log(`\nCycles Information:`);
    log(`  Backend: ${formatCycles(backendStatus.cycles)}`);
    log(`  Frontend: ${formatCycles(frontendStatus.cycles)}`);
    
    if (cyclesAnalysis.success) {
      log(`  Daily Consumption Rate: ${formatCycles(cyclesAnalysis.dailyRate.toFixed(0))}`);
      log(`  Estimated Runtime Remaining: ${cyclesAnalysis.remainingDays.toFixed(1)} days`);
    }
    
    log(`\nVerification completed at: ${new Date().toISOString()}`);
    log(`Full log available at: ${LOG_FILE}`);
    
  } catch (error) {
    log(`${colors.red}✘ Verification failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
}); 