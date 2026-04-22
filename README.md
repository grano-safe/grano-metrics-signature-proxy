# Grano Metrics Signature Proxy

## Description

This proxy server assists in signing requests for Grano Metrics integrations. It ensures that the requests are properly signed with HMAC, timestamp, and nonce, while also providing error tracing and time synchronization.

### **Important**

`Proxy access control`: The proxy needs to be protected against unauthorized access. Only your integration server should have access to the proxy. If possible, use firewall rules to prevent external connections from accessing the proxy and making requests.

`Auditability and logs`: Keeping logs of all requests made by the integration server can be useful for auditing purposes and to detect attack attempts or anomalous behavior. The proxy server writes a log entry to STDOUT for each request.

## Requirements

`Secret key`: The secret key used to generate the HMAC must be stored securely. If the proxy and the integration server are on the same network or hosting, the key should only be accessible to the proxy to prevent leaks.

- A Linux shell or WSL

And only to build from source:

- Node.js v24 or later
- Yarn package manager v4.5.1 or later

You can install Node.js easily with [NVM](https://github.com/nvm-sh/nvm#installing-and-updating) or [FNM](https://github.com/Schniz/fnm).

In recent Node.js versions, Yarn is available through Corepack. You can enable Yarn globally by running:

```bash
corepack enable
```

If Corepack is not available, you can install it with npm:

```bash
npm i --global corepack
```

### Environment Variables

This proxy requires the following environment variables to function:

- `PORT`: The port number on which the server will run (must be a valid number).
- `METRICS_API_URL_TARGET`: The target URL for the Grano Metrics API.
- `HMAC_SECRET`: The secret key for HMAC signature generation.

Optional environment variables:

- `SENTRY_DSN`: The DSN for Sentry error tracking.
- `CUSTOM_REQUEST_TIMEOUT_MS`: Custom timeout for requests, in milliseconds. (default: 10 minutes)

> **Note:** In production, ensure that `.env` files and environment variables are stored in a secure location and not exposed to unauthorized access.

### Project Dependencies

- `axios`: For HTTP client.
- `body-parser`: To parse incoming requests.
- `chalk`: For colored console logging.
- `dayjs`: For date and time handling.
- `dotenv`: To load environment variables from `.env`.
- `express`: Web framework for Node.js.
- `ms`: For handling time durations.
- `zod`: For environment validation.
- `@sentry/node`: For Sentry error tracking.

### Development Dependencies

- `@commitlint/cli`: For commit message linting.
- `@commitlint/config-conventional`: Conventional commit message configuration.
- `@types/body-parser`: TypeScript types for `body-parser`.
- `@types/express`: TypeScript types for `express`.
- `@types/jest`: TypeScript types for `jest`.

## Setup Using a Prebuilt Binary

1. Download the latest binary for your platform:

   - Linux x64: [Official Download Here](https://gs-media.granosafe.com.br/software/grano-metrics-signature-proxy/grano-metrics-signature-proxy-linux-x64)

   Place the file in a dedicated directory of your choice.

2. Create a `.env` file in the same directory and define the required environment variables.
   You may also define them as system-wide or shell environment variables instead.

   Example:

   ```env
   PORT=3000
   METRICS_API_URL_TARGET=https://metrics-api.granosafe.com.br
   HMAC_SECRET=your_hmac_secret_key

   SENTRY_DSN=
   CUSTOM_REQUEST_TIMEOUT_MS=
   ```

3. If you use Sentry for error tracking, set the `SENTRY_DSN` variable in your `.env` file.

4. Make the binary executable and start the proxy:

   ```bash
   chmod +x grano-metrics-signature-proxy-linux-x64
   ./grano-metrics-signature-proxy-linux-x64
   ```

5. You may use [PM2](https://www.npmjs.com/package/pm2) to keep the process running and automatically restart it if needed.

## Build from source

1. Clone the repository.

   ```bash
   git clone git@github.com:grano-safe/grano-metrics-signature-proxy.git
   cd grano-metrics-signature-proxy

   ```

2. Install dependencies.

   ```bash
   yarn install

   ```

3. Create a `.env` file at the root of the project with the required environment variables.
   Alternatively, define them as system-wide or shell environment variables.

   Example:

   ```env
   PORT=3000
   METRICS_API_URL_TARGET=https://metrics-api.granosafe.com.br
   HMAC_SECRET=your_hmac_secret_key

   SENTRY_DSN=
   CUSTOM_REQUEST_TIMEOUT_MS=

   ```

4. If you're using Sentry for error tracking, add the `SENTRY_DSN` variable to your `.env` file.

5. Run the project.

   ```bash
   yarn build
   yarn start

   ```

   For development mode:

   ```bash
   yarn dev

   ```

   With Docker:

   Run the following command to build the image:

   ```bash
   docker build -t grano-metrics-signature-proxy .

   ```

   Then, run the container with:

   ```bash
   docker run --env-file .env -p 3020:3020 grano-metrics-signature-proxy

   ```

6. You may use [PM2](https://www.npmjs.com/package/pm2) to keep the process running and automatically restart it if needed.

## Functionality

### Signature Generation

The server generates a signature for each request based on the following parameters:

- `n`: A randomly generated nonce (24-byte hexadecimal string).
- `t`: The timestamp of the request.
- `d`: The body of the request.

This signature is then sent along with the request headers as:

- `x-metrics-timestamp`: The timestamp of the request.
- `x-metrics-nonce`: The generated nonce.
- `x-metrics-signature`: The HMAC signature.

### Time Synchronization

The server checks that the system time is within one minute of the UTC time using an NTP (Network Time Protocol) server. If the time is not synchronized, the server will terminate.

### Proxy Middleware

The proxy middleware forwards requests to the target Grano Metrics API, while logging the request details and response status.

### Error Handling

If an error occurs during the request or response process, the server will log the error, and in case of failure, it will return the error response to the client.

### Graceful Shutdown

The server handles graceful shutdown on receiving termination signals (SIGINT, SIGTERM), ensuring that all ongoing requests are completed before the server shuts down.

## Metrics Server Connection Check

At startup, the proxy verifies connectivity to the Metrics server by sending a GET request to `/core/v1/health/readiness`. On success, the proxy logs a confirmation message. On failure, the proxy captures the error and logs it after a 0.3-second delay.

This helps identify errors and pending configurations before the application starts receiving real traffic.

## Scripts

- `dev`: Runs the project in development mode with tsx watch.
- `build`: Builds the project for production.
- `start`: Starts the production server.
- `type:check`: Checks TypeScript types.
- `prettier`: Formats the code with Prettier.
- `eslint`: Lints the code with ESLint.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss your ideas.

## License

MIT License. See [LICENSE](./LICENSE) for details.
