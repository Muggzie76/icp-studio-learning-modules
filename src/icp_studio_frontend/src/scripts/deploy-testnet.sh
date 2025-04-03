#!/bin/bash

# Script for deploying ICP Studio to the testnet for testing

echo "🚀 Starting testnet deployment process for ICP Studio"
echo "-------------------------------------------------"

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ Error: dfx is not installed. Please install the DFINITY SDK first."
    echo "Run: sh -ci \"$(curl -fsSL https://sdk.dfinity.org/install.sh)\""
    exit 1
fi

# Check if user has cycles
echo "🔍 Checking wallet and cycles..."
WALLET_RESULT=$(dfx identity get-wallet --network ic)
if [ $? -ne 0 ]; then
    echo "❌ Error: Could not find wallet. Please run 'dfx identity get-wallet --network ic' first."
    exit 1
fi

CYCLES=$(dfx wallet --network ic balance)
if [ $? -ne 0 ]; then
    echo "❌ Error: Could not check cycles balance. Please ensure your wallet is set up correctly."
    exit 1
fi

echo "💰 Current cycles balance: $CYCLES"

# Minimum cycles needed (this is an estimate - adjust as needed)
MIN_CYCLES=10000000000000
CYCLES_NUMERIC=$(echo $CYCLES | tr -dc '0-9')

if (( CYCLES_NUMERIC < MIN_CYCLES )); then
    echo "❌ Error: Insufficient cycles. You need at least 10T cycles for testnet deployment."
    echo "Get more cycles from the faucet or by converting ICP."
    exit 1
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Generate type declarations
echo "📝 Generating type declarations..."
dfx generate

# Deploy canisters to testnet
echo "📦 Deploying canisters to testnet..."
dfx deploy --network ic

# Check deployment status
if [ $? -eq 0 ]; then
    # Get canister IDs
    BACKEND_ID=$(dfx canister --network ic id icp_studio_backend)
    FRONTEND_ID=$(dfx canister --network ic id icp_studio_frontend)
    
    echo "✅ Deployment successful!"
    echo "-------------------------------------------------"
    echo "🔹 Backend Canister ID: $BACKEND_ID"
    echo "🔹 Frontend Canister ID: $FRONTEND_ID"
    echo "-------------------------------------------------"
    echo "🌐 Testnet frontend URL: https://$FRONTEND_ID.ic0.app/"
    echo "🌐 Testnet backend URL: https://$BACKEND_ID.ic0.app/"
    
    # Save deployment info to a file for reference
    echo "Saving deployment info to deploy-info.txt..."
    echo "Deployment Date: $(date)" > deploy-info.txt
    echo "Backend Canister ID: $BACKEND_ID" >> deploy-info.txt
    echo "Frontend Canister ID: $FRONTEND_ID" >> deploy-info.txt
    echo "Cycles Balance: $CYCLES" >> deploy-info.txt
    
    # Verify canisters are running
    echo "🧪 Verifying canisters..."
    dfx canister --network ic status icp_studio_backend
    dfx canister --network ic status icp_studio_frontend
    
    echo "-------------------------------------------------"
    echo "🚀 Testnet deployment complete!"
    echo "You can now access your application at: https://$FRONTEND_ID.ic0.app/"
    echo "Run 'npm run testnet:verify' to check deployment connectivity."
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi 