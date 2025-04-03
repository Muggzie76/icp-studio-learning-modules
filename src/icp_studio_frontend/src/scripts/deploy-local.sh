#!/bin/bash

# Script for deploying ICP Studio locally for testing

echo "🚀 Starting local deployment process for ICP Studio"
echo "-------------------------------------------------"

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ Error: dfx is not installed. Please install the DFINITY SDK first."
    echo "Run: sh -ci \"$(curl -fsSL https://sdk.dfinity.org/install.sh)\""
    exit 1
fi

# Stop any running replicas
echo "🛑 Stopping any running dfx instances..."
dfx stop || true

# Start a clean local replica
echo "🏁 Starting a fresh local replica..."
dfx start --clean --background

# Wait for the replica to start
echo "⏳ Waiting for the replica to start..."
sleep 5

# Build the project
echo "🔨 Building project..."
npm run build

# Generate type declarations
echo "📝 Generating type declarations..."
dfx generate

# Deploy canisters
echo "📦 Deploying canisters..."
dfx deploy

# Check deployment status
if [ $? -eq 0 ]; then
    # Get canister IDs
    BACKEND_ID=$(dfx canister id icp_studio_backend)
    FRONTEND_ID=$(dfx canister id icp_studio_frontend)
    
    echo "✅ Deployment successful!"
    echo "-------------------------------------------------"
    echo "🔹 Backend Canister ID: $BACKEND_ID"
    echo "🔹 Frontend Canister ID: $FRONTEND_ID"
    echo "-------------------------------------------------"
    echo "🌐 Local frontend URL: http://localhost:4943/?canisterId=$FRONTEND_ID"
    echo "🌐 Local backend URL: http://localhost:4943/?canisterId=$BACKEND_ID"
    
    # Start local development server
    echo "🚀 Starting development server..."
    echo "Once the server starts, you can access the application at: http://localhost:3000"
    npm run start
else
    echo "❌ Deployment failed. Please check the error messages above."
    # Stop the replica on failure
    dfx stop
    exit 1
fi 