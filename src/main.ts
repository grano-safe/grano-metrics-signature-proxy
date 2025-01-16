import { loadInitialDefinitions } from 'core/init-definitions'

const logger = console

loadInitialDefinitions({
  logger,
})

import bodyParser from 'body-parser'
import chalk from 'chalk'
import express from 'express'
import http from 'http'

import { loadEnvironment } from 'core/environment'
import { loadSentry } from 'core/error-tracing'
import { createProxyMiddleware } from 'core/proxy-middleware'
import { defineShutdownHandlers } from 'core/sutdown-handler'

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

  defineShutdownHandlers({
    logger,
    server,
  })
}

init()
