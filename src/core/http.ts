import axios from 'axios'
import ms from 'ms'

export function createHttpClient({
  baseURL,
  ms_timeout,
}: {
  baseURL: string
  ms_timeout?: number
}) {
  const client = axios.create({
    baseURL,

    timeout: ms_timeout || ms('10m'),
  })

  return client
}
