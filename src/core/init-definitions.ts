import chalk from 'chalk'
import dayjs from 'dayjs'
import dotenv from 'dotenv'

import { LoggerLikeObject } from 'types/logger'

import { getNetworkTime } from 'core/ntp'

import { logProxyNtpError, logProxyNtpWarning } from 'utils/logs'
import { systemTymeIsMoreThanOneMinuteFromReference } from 'utils/time'

export function loadInitialDefinitions({ logger }: { logger: LoggerLikeObject }) {
  logger.info(chalk.cyan('[ INFO ]'), 'Initializing service definitions...')

  process.env.TZ = 'UTC'

  dotenv.config()

  const checkTime = async () => {
    try {
      logger.info(chalk.cyan('[ INFO ]'), 'Time checking is underway...')

      const date = await getNetworkTime()

      const now = dayjs()

      if (
        systemTymeIsMoreThanOneMinuteFromReference({
          now,
          ref: date,
        })
      ) {
        logProxyNtpError({
          logger,

          message: `The system time is out of sync with UTC.

            UTC Time: ${date.toISOString()}
            System Time: ${now.toISOString()}
          `,
        })

        process.exit(1)
      }

      logger.info(chalk.cyan('[ INFO ]'), chalk.green('Time verification complete.'))
    } catch (error) {
      logProxyNtpWarning({
        logger,

        message:
          'Unable to get current time for verification. The system time may be incorrect.',

        error,
      })
    }
  }

  checkTime()
}
