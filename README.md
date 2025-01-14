# Grano Metrics Signature Proxy

## Overview

This project is a proxy server designed to assist with signing requests for Grano Metrics integrations. It validates and signs incoming requests using HMAC and forwards them to the target API.

## Features

- Signs requests with HMAC SHA3-512.
- Appends a unique nonce and timestamp to each request.
- Logs detailed request information.
- Forwards responses from the target API, including headers and status codes.
- Supports environment variable configuration via `.env` files.

## Prerequisites

- Linux bash/WSL
- Node.js v20 or later
- Yarn package manager v4.5.1 or later

You can install Node.js easily with [NVM](https://github.com/nvm-sh/nvm#installing-and-updating) or [FNM](https://github.com/Schniz/fnm).

In the latest versions, yarn comes with node via corepack. You can enable yarn globally by running:

```bash
corepack enable
```

## Installation

1. Clone the repository

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Set up the `.env` file:
   Create a `.env` file in the project root with the following variables:
   ```env
   PORT=3000
   METRICS_API_URL_TARGET=https://target-api.com
   HMAC_SECRET=your-secret-key
   ```
   > **Note:** In production, ensure that `.env` files and environment variables are stored in a secure location and not exposed to unauthorized access.

## Scripts

- **Prepare the environment (git hooks):**
  ```bash
  yarn prepare
  ```
- **Start the server in development mode:**
  ```bash
  yarn dev
  ```
- **Build for production:**
  ```bash
  yarn build
  ```
- **Run tests:**
  ```bash
  yarn test
  ```
- **Check types:**
  ```bash
  yarn type:check
  ```
- **Lint and format code:**
  ```bash
  yarn eslint && yarn prettier
  ```

## Usage (Dev)

1. Start the server:
   ```bash
   yarn dev
   ```
2. The proxy will listen for incoming requests on the specified `PORT`.

3. Incoming requests will be signed with the following headers added:

   - `x-metrics-timestamp`: Timestamp of the request.
   - `x-metrics-nonce`: Unique 24-byte nonce.
   - `x-metrics-signature`: HMAC signature of the payload.

4. Requests will be forwarded to the `METRICS_API_URL_TARGET`.

## Development Workflow

### Logging

Logs include request details such as method, status code, URL, and client IP. Errors during forwarding are also logged.

### Customization

Modify the `createProxyMiddleware` function in `src/main.ts` to customize the proxy's behavior.

## Deployment

To deploy the proxy:

1. Build the project:
   ```bash
   yarn build
   ```
2. Deploy the compiled files in the `dist` directory to your production server with:

   ```bash
   node dist/index.js
   ```

   You can use [PM2](https://www.npmjs.com/package/pm2) for resilience in unstable systems.

   If you want the server to start together with the system, run the command below and follow the instructions listed:

   ```bash
   pm2 startup
   ```

3. Set the environment variables on your production server.

## You can use Docker too

```bash
docker build -t grano-metrics-signature-proxy .
```

```bash
docker run -p 3020:3020 --env-file .env grano-metrics-signature-proxy
```

## Troubleshooting

### Common Issues

- **Missing Environment Variables:** Ensure all required variables are defined in the `.env` file or in the system path/global envs.
- **Port Conflicts:** Ensure the `PORT` specified in the `.env` file is not in use.

### Debugging

Use `console.log` or a debugger to inspect runtime behavior. Logs are output to the console for all incoming requests.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss your ideas.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
