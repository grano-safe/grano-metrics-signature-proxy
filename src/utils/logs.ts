import chalk from 'chalk'

import type { Request } from 'express'

import { LoggerLikeObject } from 'types/logger'

export function logRequest({
  logger,
  req,
  status,
  targetUrl,
}: {
  logger: LoggerLikeObject
  req: Request
  status: number
  targetUrl: string
}) {
  logger.info(
    chalk.cyan('[ LOG ]'),
    chalk.blue(req.protocol.toUpperCase()),
    chalk.blue(req.httpVersion),
    '-',
    req.method,
    status > 400 ? chalk.red.bold(status) : status,
    targetUrl + req.url,
    req.ip ? chalk.yellow(req.ip) : ''
  )
}

export function logProxyError({
  logger,
  req,
  targetUrl,
  error,
}: {
  logger: LoggerLikeObject
  req: Request
  targetUrl: string
  error: unknown
}) {
  logger.info(
    chalk.red.bold('[ PROXY ERROR ]'),
    '-',
    targetUrl + req.url,
    req.ip ? chalk.yellow(req.ip) : ''
  )

  logger.error(error)
}

export function logProxyNtpWarning({
  logger,
  message,
  error,
}: {
  logger: LoggerLikeObject
  message: string
  error?: unknown
}) {
  logger.info(chalk.yellow.bold('[ PROXY NTP TIME WARNING ]'), '-', chalk.yellow(message))

  if (error) {
    logger.error(error)
  }
}

export function logProxyNtpError({
  logger,
  message,
  error,
}: {
  logger: LoggerLikeObject
  message: string
  error?: unknown
}) {
  logger.info(chalk.red.bold('[ PROXY NTP TIME ERROR ]'), '-', chalk.red(message))

  if (error) {
    logger.error(error)
  }
}
