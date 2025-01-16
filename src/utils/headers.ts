import type { Response } from 'express'

export function writeHeadersToResponse({
  res,
  headers,
}: {
  res: Response
  headers: Record<string, any>
}) {
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value)
  })
}
