import chalk from 'chalk'
import Sentry, { captureException as baseCaptureException } from '@sentry/node'

import type { ExclusiveEventHintOrCaptureContext } from '@sentry/core/build/types/utils/prepareEvent.d.ts'

import { LoggerLikeObject } from 'types/logger'

let isSentryStarted = false

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

  isSentryStarted = true

  const close = () => {
    Sentry.close()
  }

  process.on('SIGINT', close)
  process.on('SIGTERM', close)
}

export function captureException(
  exception: unknown,
  hint?: ExclusiveEventHintOrCaptureContext
) {
  if (!isSentryStarted) {
    return
  }

  baseCaptureException(exception, hint)
}
