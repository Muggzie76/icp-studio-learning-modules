#!/bin/bash

# ICP Studio Mainnet Deployment Script
# This script automates the process of deploying ICP Studio to the Internet Computer mainnet

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEFAULT_ADMIN_PRINCIPAL="rmmnq-lp6ph-jecfe-unios-34txb-5cwzz-h3uzu-plyvf-ac67t-ooltr-bae"
MIN_CYCLES_REQUIRED=12000000000000 # 12T cycles
OUTPUT_LOG="mainnet-deployment-$(date +%Y%m%d-%H%M%S).log"

# Start logging
exec > >(tee -a "$OUTPUT_LOG") 2>&1

echo -e "${BOLD}========================================================${NC}"
echo -e "${BOLD}           ICP Studio Mainnet Deployment Script         ${NC}"
echo -e "${BOLD}========================================================${NC}"
echo -e "Deployment started: $(date)"
echo -e "Logging to: ${BLUE}${OUTPUT_LOG}${NC}"
echo -e ""

# Function to check if a command succeeds
check_command() {
    if [ $? -ne 0 ]; then
        echo -e "${RED}✘ Error: $1${NC}"
        exit 1
    else
        echo -e "${GREEN}✓ Success: $1${NC}"
    fi
}

echo -e "${BOLD}Step 1: Pre-deployment Checks${NC}"
echo -e "----------------------------------------"

# Check if dfx is installed
echo -e "Checking if dfx is installed..."
if ! command -v dfx &> /dev/null; then
    echo -e "${RED}✘ Error: dfx is not installed. Please install the DFINITY SDK first.${NC}"
    echo -e "Run: sh -ci \"$(curl -fsSL https://sdk.dfinity.org/install.sh)\""
    exit 1
fi
echo -e "${GREEN}✓ dfx found: $(dfx --version)${NC}"

# Check identity
echo -e "Checking identity..."
CURRENT_IDENTITY=$(dfx identity whoami)
check_command "Current identity is $CURRENT_IDENTITY"

# Check if wallet is set
echo -e "Checking if wallet is configured for IC network..."
WALLET_RESULT=$(dfx identity get-wallet --network ic 2>&1)
if [[ $WALLET_RESULT == *"No identity"* || $WALLET_RESULT == *"Error"* ]]; then
    echo -e "${RED}✘ Error: Wallet not configured for identity '$CURRENT_IDENTITY'.${NC}"
    echo -e "Please run: dfx identity new-wallet --network ic"
    exit 1
fi
echo -e "${GREEN}✓ Wallet configured: $WALLET_RESULT${NC}"

# Check cycles balance
echo -e "Checking cycles balance..."
CYCLES=$(dfx wallet --network ic balance)
check_command "Retrieved cycles balance"

# Extract numeric value from cycles
CYCLES_NUMERIC=$(echo $CYCLES | tr -dc '0-9')

# Compare with minimum required
if (( CYCLES_NUMERIC < MIN_CYCLES_REQUIRED )); then
    echo -e "${RED}✘ Error: Insufficient cycles. You have $CYCLES but need at least 12T cycles.${NC}"
    echo -e "Please obtain more cycles before deployment."
    exit 1
fi
echo -e "${GREEN}✓ Sufficient cycles available: $CYCLES${NC}"

# Check if security audit is complete
echo -e "Have you completed the security audit? (y/n)"
read -p "Enter your choice: " security_audit_complete

if [[ $security_audit_complete != "y" && $security_audit_complete != "Y" ]]; then
    echo -e "${RED}✘ Deployment aborted: Security audit must be completed before mainnet deployment.${NC}"
    echo -e "Please complete the security audit checklist in docs/security-audit.md"
    exit 1
fi
echo -e "${GREEN}✓ Security audit confirmed as complete${NC}"

echo -e "\n${BOLD}Step 2: Building for Production${NC}"
echo -e "----------------------------------------"

# Clean build
echo -e "Running clean build..."
npm run clean 2>/dev/null || echo -e "${YELLOW}⚠ No clean script found, continuing...${NC}"

# Generate optimized production build
echo -e "Building for production..."
npm run build
check_command "Production build generated"

# Generate candid interfaces
echo -e "Generating Candid interfaces..."
dfx generate
check_command "Candid interfaces generated"

echo -e "\n${BOLD}Step 3: Canister Creation and Deployment${NC}"
echo -e "----------------------------------------"

# Confirm deployment
echo -e "${YELLOW}⚠ You are about to deploy ICP Studio to the IC mainnet.${NC}"
echo -e "This will use real cycles and deploy to production."
echo -e "Are you sure you want to continue? (y/n)"
read -p "Enter your choice: " deployment_confirmed

if [[ $deployment_confirmed != "y" && $deployment_confirmed != "Y" ]]; then
    echo -e "${YELLOW}Deployment cancelled by user.${NC}"
    exit 0
fi

# Create canisters
echo -e "Creating canisters on mainnet..."
dfx canister --network ic create icp_studio_backend
check_command "Backend canister created"

dfx canister --network ic create icp_studio_frontend
check_command "Frontend canister created"

# Record canister IDs
BACKEND_ID=$(dfx canister --network ic id icp_studio_backend)
FRONTEND_ID=$(dfx canister --network ic id icp_studio_frontend)

echo -e "Canister IDs:"
echo -e "  Backend: ${BLUE}$BACKEND_ID${NC}"
echo -e "  Frontend: ${BLUE}$FRONTEND_ID${NC}"

# Store canister IDs for future reference
echo "Deployment Date: $(date)" > deploy-info.txt
echo "Backend Canister ID: $BACKEND_ID" >> deploy-info.txt
echo "Frontend Canister ID: $FRONTEND_ID" >> deploy-info.txt
echo "Cycles Balance: $CYCLES" >> deploy-info.txt

# Deploy code
echo -e "Installing backend code..."
dfx canister --network ic install icp_studio_backend
check_command "Backend code installed"

echo -e "Installing frontend code..."
dfx canister --network ic install icp_studio_frontend
check_command "Frontend code installed"

echo -e "\n${BOLD}Step 4: Post-Deployment Initialization${NC}"
echo -e "----------------------------------------"

# Initialize the backend
echo -e "Initializing backend with default admin..."
dfx canister --network ic call icp_studio_backend initialize "(principal \"$DEFAULT_ADMIN_PRINCIPAL\")"
check_command "Backend initialized with default admin"

# Verify admin was set correctly
echo -e "Verifying admin was set correctly..."
ADMIN_CHECK=$(dfx canister --network ic call icp_studio_backend isUserAdmin "(principal \"$DEFAULT_ADMIN_PRINCIPAL\")")
if [[ $ADMIN_CHECK != "(true)" ]]; then
    echo -e "${RED}✘ Error: Admin verification failed. Expected '(true)' but got '$ADMIN_CHECK'${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Admin verification successful${NC}"

echo -e "\n${BOLD}Step 5: Canister Settings Configuration${NC}"
echo -e "----------------------------------------"

# Configure freezing threshold
echo -e "Setting freezing threshold (30 days)..."
dfx canister --network ic update-settings --freezing-threshold 2592000 icp_studio_backend
check_command "Backend freezing threshold set"

dfx canister --network ic update-settings --freezing-threshold 2592000 icp_studio_frontend
check_command "Frontend freezing threshold set"

echo -e "\n${BOLD}Step 6: Post-Deployment Verification${NC}"
echo -e "----------------------------------------"

# Verify canisters are running
echo -e "Verifying backend canister status..."
dfx canister --network ic status icp_studio_backend
check_command "Backend canister is running"

echo -e "Verifying frontend canister status..."
dfx canister --network ic status icp_studio_frontend
check_command "Frontend canister is running"

# Fetch frontend URL
echo -e "Attempting to fetch frontend URL..."
curl -s -o /dev/null -w "%{http_code}" "https://$FRONTEND_ID.ic0.app/"
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠ Could not verify frontend accessibility. This might be normal if propagation is not complete.${NC}"
else
    echo -e "${GREEN}✓ Frontend is accessible${NC}"
fi

echo -e "\n${BOLD}Step 7: Deployment Summary${NC}"
echo -e "----------------------------------------"

echo -e "Deployment completed successfully at $(date)!"
echo -e "ICP Studio has been deployed to the mainnet."
echo -e ""
echo -e "📊 Canister IDs:"
echo -e "  - Backend: ${BLUE}$BACKEND_ID${NC}"
echo -e "  - Frontend: ${BLUE}$FRONTEND_ID${NC}"
echo -e ""
echo -e "🌐 Access URLs:"
echo -e "  - Frontend: ${BLUE}https://$FRONTEND_ID.ic0.app/${NC}"
echo -e "  - Backend: ${BLUE}https://$BACKEND_ID.ic0.app/${NC}"
echo -e ""
echo -e "💰 Cycles Balance: $CYCLES"
echo -e ""
echo -e "Deployment log saved to: ${BLUE}$OUTPUT_LOG${NC}"
echo -e "Deployment info saved to: ${BLUE}deploy-info.txt${NC}"
echo -e ""
echo -e "${YELLOW}Important Next Steps:${NC}"
echo -e "1. Monitor cycles consumption over the next 48 hours"
echo -e "2. Verify all functionality works correctly in production"
echo -e "3. Set up regular cycle top-ups (recommended: monthly)"
echo -e ""
echo -e "${BOLD}========================================================${NC}" 