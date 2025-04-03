# ICP Studio

A decentralized training platform designed to teach users key skills for Dapp development on the Internet Computer. The platform consists of 12 interactive modules, each with lessons, tasks, and quizzes. Users earn rewards upon completing each module, stored and managed on-chain via smart contracts.

## Project Structure

```
icp_studio/
├── src/
│   ├── icp_studio_backend/     # Motoko backend canister
│   └── icp_studio_frontend/    # React frontend application
├── dfx.json                    # DFINITY project configuration
├── package.json               # Node.js dependencies
└── tsconfig.json             # TypeScript configuration
```

## Features

- 12 interactive training modules
- On-chain progress tracking
- Token-based reward system
- Admin CMS for content management
- Quiz-based module completion
- Secure authentication via Internet Identity

## Prerequisites

- Node.js (v14 or higher)
- DFINITY Canister SDK (dfx)
- Internet Computer CLI
- A modern web browser

## Setup Instructions

1. Install DFINITY Canister SDK:
   ```bash
   sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"
   ```

2. Clone the repository:
   ```bash
   git clone [repository-url]
   cd icp_studio
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the local replica:
   ```bash
   dfx start --background
   ```

5. Deploy the project locally:
   ```bash
   dfx deploy
   ```

## Development

- Backend (Motoko):
  - Located in `src/icp_studio_backend/`
  - Handles module logic, user progress, and rewards
  - Uses stable variables for persistent storage

- Frontend (React):
  - Located in `src/icp_studio_frontend/`
  - Built with React and TypeScript
  - Integrates with Internet Identity for authentication

## Testing

Run the test suite:
```bash
npm test
```

## Deployment & Testing

### Local Development Deployment

To deploy and test the ICP Studio application locally, follow these steps:

1. **Make sure the DFINITY SDK is installed**

   ```bash
   sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"
   ```

2. **Use the automated deployment script**

   ```bash
   npm run local:deploy
   ```

   This script will:
   - Stop any running local replicas
   - Start a clean local replica
   - Build the project
   - Generate type declarations
   - Deploy the canisters
   - Start the development server

3. **Verify the deployment**

   ```bash
   npm run local:verify
   ```

   This will check:
   - If canister IDs are correctly generated
   - If the frontend canister is accessible
   - If the backend canister responds to queries

### Alternative Deployment Options

- **Start the local replica manually**

  ```bash
  dfx start --clean --background
  ```

- **Deploy canisters only**

  ```bash
  npm run dfx:deploy
  ```

- **Clean deployment (rebuilds canisters)**

  ```bash
  npm run dfx:deploy:clean
  ```

- **Build and run development server**

  ```bash
  npm run local:dev
  ```

### Accessing the Application

After deployment, you can access the application in two ways:

1. **Through the development server**:
   - URL: http://localhost:3000

2. **Through the canister ID**:
   - URL: http://localhost:4943/?canisterId=<frontend-canister-id>
   - You can find your canister ID in the `.env` file or through `dfx canister id icp_studio_frontend`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

Welcome to your new `icp_studio` project and to the Internet Computer development community. By default, creating a new project adds this README and some template files to your project directory. You can edit these template files to customize your project and to include your own code to speed up the development cycle.

To get started, you might want to explore the project directory structure and the default configuration file. Working with this project in your development environment will not affect any production deployment or identity tokens.

To learn more before you start working with `icp_studio`, see the following documentation available online:

- [Quick Start](https://internetcomputer.org/docs/current/developer-docs/setup/deploy-locally)
- [SDK Developer Tools](https://internetcomputer.org/docs/current/developer-docs/setup/install)
- [Motoko Programming Language Guide](https://internetcomputer.org/docs/current/motoko/main/motoko)
- [Motoko Language Quick Reference](https://internetcomputer.org/docs/current/motoko/main/language-manual)

If you want to start working on your project right away, you might want to try the following commands:

```bash
cd icp_studio/
dfx help
dfx canister --help
```

## Running the project locally

If you want to test your project locally, you can use the following commands:

```bash
# Starts the replica, running in the background
dfx start --background

# Deploys your canisters to the replica and generates your candid interface
dfx deploy
```

Once the job completes, your application will be available at `http://localhost:4943?canisterId={asset_canister_id}`.

If you have made changes to your backend canister, you can generate a new candid interface with

```bash
npm run generate
```

at any time. This is recommended before starting the frontend development server, and will be run automatically any time you run `dfx deploy`.

If you are making frontend changes, you can start a development server with

```bash
npm start
```

Which will start a server at `http://localhost:8080`, proxying API requests to the replica at port 4943.

### Note on frontend environment variables

If you are hosting frontend code somewhere without using DFX, you may need to make one of the following adjustments to ensure your project does not fetch the root key in production:

- set`DFX_NETWORK` to `ic` if you are using Webpack
- use your own preferred method to replace `process.env.DFX_NETWORK` in the autogenerated declarations
  - Setting `canisters -> {asset_canister_id} -> declarations -> env_override to a string` in `dfx.json` will replace `process.env.DFX_NETWORK` with the string in the autogenerated declarations
- Write your own `createActor` constructor
