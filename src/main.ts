import { loadInitialDefinitions } from 'core/init-definitions'

const logger = console

loadInitialDefinitions({
  logger,
})

import bodyParser from 'body-parser'
import chalk from 'chalk'
import express from 'express'
import http from 'http'
import ms from 'ms'

import { loadEnvironment } from 'core/environment'
import { loadSentry } from 'core/error-tracing'
import { createProxyMiddleware } from 'core/proxy-middleware'

const { requiredEnvs, optionalEnvs } = loadEnvironment({
  logger,
})

loadSentry({
  logger,

  SENTRY_DSN: optionalEnvs.SENTRY_DSN,
})

function init() {
  const app = express()

  app.use(bodyParser.raw({ type: '*/*' }))

  app.use(
    createProxyMiddleware({
      logger,

      targetUrl: requiredEnvs.METRICS_API_URL_TARGET,
      hmacSecret: requiredEnvs.HMAC_SECRET,

      ms_timeout: optionalEnvs.CUSTOM_REQUEST_TIMEOUT_MS,
    })
  )

  const server = http.createServer(app)

  server.listen(requiredEnvs.PORT, () => {
    logger.log(
      chalk.cyan('[ INFO ]'),

      chalk.green(`Metrics Signature Proxy listening at port: ${requiredEnvs.PORT}`)
    )
  })

  const shutdown = () => {
    logger.log(
      chalk.cyan('[ INFO ]'),

      chalk.blue('Closing gracefully...')
    )

    server.close(err => {
      if (err) {
        logger.error(
          chalk.red.bold('[ ERROR ]'),

          chalk.red('graceful shutdown error')
        )

        logger.error(err)

        process.exit(1)
      }

      logger.log(
        chalk.cyan('[ INFO ]'),

        chalk.blue('Goodbye!')
      )

      process.exit(0)
    })

    setTimeout(() => {
      logger.error(
        chalk.red.bold('[ ERROR ]'),

        chalk.red('Forcing the server to close...')
      )

      process.exit(1)
    }, ms('10s'))
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

init()
