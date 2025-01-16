import chalk from 'chalk'
import Sentry from '@sentry/node'

import { LoggerLikeObject } from 'types/logger'

export function loadSentry({
  SENTRY_DSN,
  logger,
}: {
  SENTRY_DSN?: string
  logger: LoggerLikeObject
}) {
  if (!SENTRY_DSN) {
    logger.info(chalk.cyan('[ INFO ]'), 'Sentry load skipped. DSN env not found.')

    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  })

  logger.info(chalk.cyan('[ INFO ]'), chalk.green('Sentry initialized.'))

  const close = () => {
    Sentry.close()
  }

  process.on('SIGINT', close)
  process.on('SIGTERM', close)
}
