# ICP Studio Mainnet Deployment Plan

This document outlines the comprehensive plan for deploying ICP Studio to the Internet Computer mainnet. It includes all necessary steps, checks, and procedures to ensure a successful launch.

## Table of Contents

1. [Pre-Deployment Preparations](#pre-deployment-preparations)
2. [Cycle Management](#cycle-management)
3. [Deployment Process](#deployment-process)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Monitoring](#monitoring)
6. [Rollback Procedures](#rollback-procedures)
7. [Schedule and Timeline](#schedule-and-timeline)

## Pre-Deployment Preparations

### Security Audit

- [ ] Complete a thorough security audit of all canister code
- [ ] Verify access control mechanisms for admin functions
- [ ] Check for any potential vulnerabilities in authentication flows
- [ ] Review all critical functions for logical errors
- [ ] Ensure proper input validation for all public functions
- [ ] Verify that all admin-only functions are properly secured

### Code Freeze and Finalization

- [ ] Freeze code changes 48 hours before planned deployment
- [ ] Tag final release version in git repository
- [ ] Create deployment branch
- [ ] Run comprehensive test suite one final time
- [ ] Verify all dependencies are at correct versions

### Environment and Configuration

- [ ] Prepare production configuration variables
- [ ] Set up the correct admin principal IDs
- [ ] Configure module order and prerequisite relationships
- [ ] Verify default admin principal (rmmnq-lp6ph-jecfe-unios-34txb-5cwzz-h3uzu-plyvf-ac67t-ooltr-bae)
- [ ] Update URLs in configuration to use production endpoints

## Cycle Management

### Cycle Calculation

Estimated cycles required for deployment and operation:

| Canister | Initial Deployment | Monthly Operation | 1-Year Operation |
|----------|-------------------:|------------------:|----------------:|
| Backend  | 10T                | 3T                | 36T             |
| Frontend | 2T                 | 0.5T              | 6T              |
| **Total**| **12T**            | **3.5T**          | **42T**         |

Note: T = trillion cycles. Actual consumption may vary based on usage patterns.

### Securing Cycles

- [ ] Acquire at least 20T cycles for initial deployment (provides ~2 months of buffer)
- [ ] Set up cycle wallet with multi-signature protection
- [ ] Establish cycle top-up schedule (monthly)
- [ ] Create monitoring alerts for low cycle balance (threshold: 5T)
- [ ] Document procedure for emergency cycle top-up

## Deployment Process

### Fixed Canister IDs

ICP Studio uses the following fixed canister IDs for deployment:

- **Backend Canister ID**: `cgcmi-laaaa-aaaad-aalsq-cai`
- **Frontend Canister ID**: `orpwc-cqaaa-aaaam-qdktq-cai`

These canister IDs are already registered on the IC mainnet and should be used for all deployments and verifications.

### Step 1: Identity and Wallet Setup

```bash
# Verify identity is configured
dfx identity whoami

# Check if the wallet is configured
dfx identity get-wallet --network ic

# If not, create a new wallet
dfx identity new-wallet --network ic
```

### Step 2: Build for Production

```bash
# Generate optimized production build
npm run build

# Generate candid interfaces
dfx generate
```

### Step 3: Verify Canister Access

```bash
# Verify access to the backend canister
dfx canister --network ic status cgcmi-laaaa-aaaad-aalsq-cai

# Verify access to the frontend canister
dfx canister --network ic status orpwc-cqaaa-aaaam-qdktq-cai
```

### Step 4: Install Code

```bash
# Install backend code (upgrade mode)
dfx canister --network ic install icp_studio_backend --mode upgrade --wasm-path .dfx/ic/canisters/icp_studio_backend/icp_studio_backend.wasm.gz

# Install frontend code (upgrade mode)
dfx canister --network ic install icp_studio_frontend --mode upgrade --wasm-path .dfx/ic/canisters/icp_studio_frontend/icp_studio_frontend.wasm.gz
```

### Step 5: Initialize Backend State (First Deployment Only)

```bash
# Check if initialization is needed
dfx canister --network ic call cgcmi-laaaa-aaaad-aalsq-cai isUserAdmin '(principal "rmmnq-lp6ph-jecfe-unios-34txb-5cwzz-h3uzu-plyvf-ac67t-ooltr-bae")'

# If the above returns an error, initialize the backend
dfx canister --network ic call cgcmi-laaaa-aaaad-aalsq-cai initialize '(principal "rmmnq-lp6ph-jecfe-unios-34txb-5cwzz-h3uzu-plyvf-ac67t-ooltr-bae")'

# Verify admin was set correctly
dfx canister --network ic call cgcmi-laaaa-aaaad-aalsq-cai isUserAdmin '(principal "rmmnq-lp6ph-jecfe-unios-34txb-5cwzz-h3uzu-plyvf-ac67t-ooltr-bae")'
```

### Step 6: Set Canister Settings

```bash
# Set controllers for each canister (optional for additional security)
dfx canister --network ic update-settings --controller <CONTROLLER_PRINCIPAL> cgcmi-laaaa-aaaad-aalsq-cai
dfx canister --network ic update-settings --controller <CONTROLLER_PRINCIPAL> orpwc-cqaaa-aaaam-qdktq-cai

# Configure freezing threshold (in seconds)
dfx canister --network ic update-settings --freezing-threshold '2592000' cgcmi-laaaa-aaaad-aalsq-cai  # 30 days
dfx canister --network ic update-settings --freezing-threshold '2592000' orpwc-cqaaa-aaaam-qdktq-cai  # 30 days
```

## Post-Deployment Verification

### Basic Functionality Tests

- [ ] Navigate to frontend URL (https://orpwc-cqaaa-aaaam-qdktq-cai.ic0.app/)
- [ ] Verify the application loads correctly
- [ ] Test user authentication with Internet Identity
- [ ] Verify admin access with the default admin principal
- [ ] Test creating a test module
- [ ] Test user registration
- [ ] Verify module listing functionality
- [ ] Test quiz completion and token rewards

### Performance Testing

- [ ] Measure frontend loading time
- [ ] Test backend response times for key operations:
  - [ ] Module listing
  - [ ] Content loading
  - [ ] Quiz submission
  - [ ] User profile retrieval
- [ ] Verify cycle consumption rates align with estimates

## Monitoring

### Initial Monitoring Period

For the first 48 hours after deployment, perform intensive monitoring:

- [ ] Check cycles consumption every 4 hours
- [ ] Review any error logs or failed requests
- [ ] Monitor user registrations and module completions
- [ ] Watch for any unusual patterns in system usage

### Ongoing Monitoring

- [ ] Set up automated monitoring for canister cycles
- [ ] Configure alerts for critical errors
- [ ] Establish regular reporting schedule (weekly)
- [ ] Document response procedures for common issues

## Rollback Procedures

### Criteria for Rollback

- Critical functionality is broken (authentication, module access, quiz submission)
- Data corruption is detected
- Security vulnerability is discovered
- Cycle consumption exceeds expected rates by >50%

### Rollback Process

1. **Assessment**: Evaluate the severity and impact of the issue
2. **Communication**: Notify stakeholders about the planned rollback
3. **Execution**: Perform the rollback procedure

```bash
# Reinstall the previous version
dfx canister --network ic install cgcmi-laaaa-aaaad-aalsq-cai --mode reinstall --wasm-path ./previous_versions/icp_studio_backend_<VERSION>.wasm
dfx canister --network ic install orpwc-cqaaa-aaaam-qdktq-cai --mode reinstall --wasm-path ./previous_versions/icp_studio_frontend_<VERSION>.wasm

# Reinitialize the backend if necessary
dfx canister --network ic call cgcmi-laaaa-aaaad-aalsq-cai initialize '(principal "rmmnq-lp6ph-jecfe-unios-34txb-5cwzz-h3uzu-plyvf-ac67t-ooltr-bae")'
```

4. **Verification**: Verify basic functionality after rollback
5. **Root Cause Analysis**: Identify and fix the issue before attempting redeployment

## Schedule and Timeline

### Two Weeks Before Launch

- [ ] Complete final security audit
- [ ] Finalize all content and modules
- [ ] Conduct final user acceptance testing

### One Week Before Launch

- [ ] Acquire all necessary cycles
- [ ] Prepare deployment scripts
- [ ] Run full deployment rehearsal on testnet
- [ ] Verify rollback procedures

### Launch Day

- [ ] Freeze code repository
- [ ] Execute deployment process
- [ ] Run post-deployment verification
- [ ] Begin intensive monitoring period

### Post-Launch (First Week)

- [ ] Daily monitoring and performance assessment
- [ ] Address any issues or bugs identified
- [ ] Collect initial user feedback
- [ ] Make minor adjustments as needed

### Post-Launch (First Month)

- [ ] Weekly performance reviews
- [ ] Cycle consumption tracking and projections
- [ ] User growth monitoring
- [ ] Plan for first update (if necessary)

---

## Approval and Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Manager |  |  |  |
| Lead Developer |  |  |  |
| Security Auditor |  |  |  |
| Operations Lead |  |  |  |

---

This deployment plan is a living document and may be updated as necessary based on testing results, security findings, or changing requirements. 