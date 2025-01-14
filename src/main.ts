process.env.TZ = 'UTC'

import dotenv from 'dotenv'

dotenv.config()

import chalk from 'chalk'
import express from 'express'
import bodyParser from 'body-parser'
import axios, { AxiosError } from 'axios'
import dayjs from 'dayjs'
import crypto from 'node:crypto'
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

async function bootstrap() {
  const PORT = process.env.PORT
  const METRICS_API_URL_TARGET = process.env.METRICS_API_URL_TARGET
  const HMAC_SECRET = process.env.HMAC_SECRET

  const envError = envsSchema.safeParse(process.env).error || null

  if (envError) {
    logger.error(chalk.red.bold('ENV Error - Missing env definitions'))

    logger.table(
      Object.entries(envError.flatten().fieldErrors).map(([env, error]) => ({
        env,
        error,
      }))
    )

    process.exit(1)
  }

  const app = express()

  app.use(bodyParser.raw({ type: '*/*' }))

  app.use(async (req, res) => {
    const makeProxy = async () => {
      const timestamp = dayjs().valueOf()
      const nonce = crypto.randomBytes(nonceLength).toString('hex')

      const hmacPayload = `n:${nonce};t:${timestamp};d:${req.body}`

      const signature = crypto
        .createHmac('sha3-512', HMAC_SECRET)
        .update(hmacPayload)
        .digest('hex')

      req.headers['x-metrics-timestamp'] = String(timestamp)
      req.headers['x-metrics-nonce'] = nonce
      req.headers['x-metrics-signature'] = signature

      const headers = {
        ...req.headers,
      }

      const response = await axios({
        method: req.method,
        url: METRICS_API_URL_TARGET + req.url,
        headers: headers,
        data: req.body,
      })

      Object.entries(response.headers).forEach(([key, value]) => {
        res.setHeader(key, value)
      })

      logger.info(
        chalk.cyan('[ LOG ]'),
        chalk.blue(req.protocol.toUpperCase()),
        chalk.blue(req.httpVersion),
        '-',
        response.status > 400 ? chalk.red.bold(response.status) : response.status,
        METRICS_API_URL_TARGET + req.url,
        req.ip ? chalk.yellow(req.ip) : ''
      )

      res.status(response.status).send(response.data)
    }

    try {
      await makeProxy()
    } catch (response) {
      const rs = response as AxiosError

      Object.entries(rs.response.headers).forEach(([key, value]) => {
        res.setHeader(key, value)
      })

      res.status(rs.status).send(rs.response.data)
    }
  })

  await app.listen(PORT, () => {
    logger.log(
      chalk.cyan('[ INFO ]'),
      chalk.green(`Metrics Signature Proxy listening at port: ${PORT}`)
    )
  })
}

bootstrap()
