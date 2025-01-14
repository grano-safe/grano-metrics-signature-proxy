process.env.TZ = 'UTC'

import dotenv from 'dotenv'

dotenv.config()

import crypto from 'node:crypto'

import axios, { AxiosError } from 'axios'
import bodyParser from 'body-parser'
import chalk from 'chalk'
import dayjs from 'dayjs'
import express, { Request, Response } from 'express'
import z from 'zod'

const logger = console

const nonceLength = 24 // 48 hexadecimal characters require 24 bytes

const envsSchema = z
  .object({
    PORT: z.string(),
    METRICS_API_URL_TARGET: z.string(),
    HMAC_SECRET: z.string(),
  })
  .required()

function loadConfig() {
  const parsed = envsSchema.safeParse(process.env)

  if (!parsed.success) {
    logger.error(chalk.red.bold('ENV Error - Missing env definitions'))

    logger.table(
      Object.entries(parsed.error.flatten().fieldErrors).map(([env, error]) => ({
        env,
        error,
      }))
    )

    process.exit(1)
  }

  return {
    PORT: process.env.PORT,
    METRICS_API_URL_TARGET: process.env.METRICS_API_URL_TARGET,
    HMAC_SECRET: process.env.HMAC_SECRET,
  }
}

function logRequest(req, status, targetUrl) {
  logger.info(
    chalk.cyan('[ LOG ]'),
    chalk.blue(req.protocol.toUpperCase()),
    chalk.blue(req.httpVersion),
    '-',
    status > 400 ? chalk.red.bold(status) : status,
    targetUrl + req.url,
    req.ip ? chalk.yellow(req.ip) : ''
  )
}

function createProxyMiddleware({
  targetUrl,
  hmacSecret,
}: {
  targetUrl: string
  hmacSecret: string
}) {
  return async (req: Request, res: Response) => {
    const timestamp = dayjs().valueOf()
    const nonce = crypto.randomBytes(nonceLength).toString('hex')

    const hmacPayload = `n:${nonce};t:${timestamp};d:${req.body}`
    const signature = crypto
      .createHmac('sha3-512', hmacSecret)
      .update(hmacPayload)
      .digest('hex')

    req.headers['x-metrics-timestamp'] = String(timestamp)
    req.headers['x-metrics-nonce'] = nonce
    req.headers['x-metrics-signature'] = signature

    try {
      const response = await axios({
        method: req.method,
        url: targetUrl + req.url,
        headers: { ...req.headers, host: null },
        data: req.body,
      })

      Object.entries(response.headers).forEach(([key, value]) => {
        res.setHeader(key, value)
      })

      logRequest(req, response.status, targetUrl)

      res.status(response.status).send(response.data)
    } catch (error) {
      const rs = error as AxiosError

      Object.entries(rs.response.headers).forEach(([key, value]) => {
        res.setHeader(key, value)
      })

      logRequest(req, rs.response.status, targetUrl)

      res.status(rs.response.status).send(rs.response.data)
    }
  }
}

async function init() {
  const { PORT, METRICS_API_URL_TARGET, HMAC_SECRET } = loadConfig()

  const app = express()

  app.use(bodyParser.raw({ type: '*/*' }))

  app.use(
    createProxyMiddleware({ targetUrl: METRICS_API_URL_TARGET, hmacSecret: HMAC_SECRET })
  )

  await app.listen(PORT, () => {
    logger.log(
      chalk.cyan('[ INFO ]'),
      chalk.green(`Metrics Signature Proxy listening at port: ${PORT}`)
    )
  })
}

init()
