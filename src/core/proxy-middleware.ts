import crypto from 'node:crypto'

import dayjs from 'dayjs'
import type { AxiosError } from 'axios'
import type { Request, Response } from 'express'

import { createHttpClient } from 'core/http'
import { captureException } from 'core/error-tracing'
import { checkMetricsServerConnectionHealth } from 'core/metrics-server-reach'

import { signatureNonceLength } from 'constants/security'
import { writeHeadersToResponse } from 'utils/headers'
import { logProxyError, logRequest } from 'utils/logs'

import { LoggerLikeObject } from 'types/logger'

export function createProxyMiddleware({
  logger,
  targetUrl,
  hmacSecret,
  ms_timeout,
}: {
  logger: LoggerLikeObject
  targetUrl: string
  hmacSecret: string
  ms_timeout: number | null
}) {
  const httpClient = createHttpClient({
    baseURL: targetUrl,
    ms_timeout,
  })

  checkMetricsServerConnectionHealth({
    httpClient,
    logger,
  })

  return async (req: Request, res: Response) => {
    const timestamp = dayjs().valueOf()
    const nonce = crypto.randomBytes(signatureNonceLength).toString('hex')

    const hmacPayload = `n:${nonce};t:${timestamp};d:${req.body}`
    const signature = crypto
      .createHmac('sha3-512', hmacSecret)
      .update(hmacPayload)
      .digest('hex')

    req.headers['x-metrics-timestamp'] = String(timestamp)
    req.headers['x-metrics-nonce'] = nonce
    req.headers['x-metrics-signature'] = signature

    try {
      const response = await httpClient({
        method: req.method,
        url: req.url,
        headers: { ...req.headers, host: null },
        data: req.body,
      })

      writeHeadersToResponse({
        headers: response.headers,
        res,
      })

      logRequest({
        logger,
        req,
        status: response.status,
        targetUrl,
      })

      res.status(response.status).send(response.data)
    } catch (error) {
      const rs = error as AxiosError | undefined

      if (!rs?.response) {
        logProxyError({
          logger,
          req,
          targetUrl,
          error,
        })

        captureException(error, {
          extra: {
            message: 'Proxy Internal Error',
            url: targetUrl + req.url,
          },
        })

        return
      }

      writeHeadersToResponse({
        headers: rs.response.headers,
        res,
      })

      logRequest({
        logger,
        req,
        status: rs.response.status,
        targetUrl,
      })

      res.status(rs.response.status).send(rs.response.data)
    }
  }
}
