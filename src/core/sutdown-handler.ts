import chalk from 'chalk'
import ms from 'ms'

import type http from 'http'

import { captureException } from 'core/error-tracing'

import type { LoggerLikeObject } from 'types/logger'

export function defineShutdownHandlers({
  logger,
  server,
}: {
  logger: LoggerLikeObject
  server: http.Server
}) {
  const shutdown = () => {
    logger.log('\n')

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

        captureException(err, {
          extra: {
            message: 'graceful shutdown error',
          },
        })

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

      captureException(null, {
        extra: {
          message: 'graceful shutdown error',
        },
      })

      process.exit(1)
    }, ms('10s'))
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}
