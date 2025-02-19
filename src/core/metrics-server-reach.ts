import ms from 'ms'
import chalk from 'chalk'

import type { AxiosError, AxiosInstance } from 'axios'

import { LoggerLikeObject } from 'types/logger'
import { captureException } from 'core/error-tracing'

export async function checkMetricsServerConnectionHealth({
  httpClient,
  logger,
}: {
  httpClient: AxiosInstance
  logger: LoggerLikeObject
}) {
  httpClient
    .get('/core/v1/health/readiness')
    .then(() => {
      logger.info(chalk.cyan('[ INFO ]'), chalk.green('Metrics server is reachable!'))
    })
    .catch((err: AxiosError) => {
      const verboseMessage =
        'The proxy attempted to verify that the Metrics server is reachable, but was unsuccessful. Requests are likely to fail.'

      captureException(err, {
        extra: {
          message: `[ PROXY ERROR ] - ${verboseMessage}`,
          errorInformation:
            err.cause ||
            (err.response.data as any)?.message ||
            err.message ||
            err.code ||
            'No error information.',
        },
      })

      setTimeout(() => {
        logger.error(
          chalk.red.bold('[ PROXY ERROR ]'),
          '-',
          verboseMessage,
          '\n',
          chalk.red(
            `-> ${err.cause || (err.response.data as any)?.message || err.message || err.code || 'No error information.'}`
          )
        )
      }, ms('0.3s'))
    })
}
