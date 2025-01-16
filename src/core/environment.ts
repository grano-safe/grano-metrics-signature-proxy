import z from 'zod'
import chalk from 'chalk'

import { LoggerLikeObject } from 'types/logger'

const requiredEnvsSchema = z
  .object({
    PORT: z.string().regex(/^\d+$/, 'PORT must be a valid number'),
    METRICS_API_URL_TARGET: z.string(),
    HMAC_SECRET: z.string(),
  })
  .required()

const optionalEnvsSchema = z
  .object({
    SENTRY_DSN: z.string(),
    CUSTOM_REQUEST_TIMEOUT_MS: z.preprocess(
      val => (val ? parseInt(String(val), 10) : null),
      z.number().positive().nullable()
    ),
  })
  .partial()

export function loadEnvironment({ logger }: { logger: LoggerLikeObject }) {
  const parsedRequiredEnvs = requiredEnvsSchema.safeParse(process.env)

  if (!parsedRequiredEnvs.success) {
    logger.error(chalk.red.bold('ENV Error - Missing env definitions'))

    logger.table(
      Object.entries(parsedRequiredEnvs.error.flatten().fieldErrors).map(
        ([env, error]) => ({
          env,
          error,
        })
      )
    )

    process.exit(1)
  }

  const parsedOptionalEnvs = optionalEnvsSchema.safeParse(process.env)

  if (!parsedOptionalEnvs.success) {
    logger.error(chalk.red.bold('ENV Error - Incorrect env definitions'))

    logger.table(
      Object.entries(parsedOptionalEnvs.error.flatten().fieldErrors).map(
        ([env, error]) => ({
          env,
          error,
        })
      )
    )

    process.exit(1)
  }

  logger.info(chalk.cyan('[ INFO ]'), 'Service definitions successfully loaded.')

  return {
    requiredEnvs: parsedRequiredEnvs.data as Required<z.infer<typeof requiredEnvsSchema>>,
    optionalEnvs: parsedOptionalEnvs.data,
  }
}
