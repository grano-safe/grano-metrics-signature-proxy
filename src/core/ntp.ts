// ? Adapted from https://github.com/moonpyk/node-ntp-client
// ? Used Buffer.alloc(48) instead Buffer(48) for security and promissified

// Copyright (c) 2013 Clément Bourgeois

// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following
// conditions:

// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

import dgram from 'dgram'

export const ntpPort = 123
export const ntpServer = 'pool.ntp.org'

/**
 * Amount of acceptable time to await for a response from the remote server.
 * Configured default to 10 seconds.
 */
export const ntpReplyTimeout = 10000

/**
 * Fetches the current NTP Time from the server and port defined.
 * @returns {Promise<Date>} Resolves with the current date from the NTP server or rejects with an error message.
 */
export const getNetworkTime = (): Promise<Date> => {
  return new Promise((resolve, reject) => {
    const client = dgram.createSocket('udp4')
    const ntpData = Buffer.alloc(48)

    // RFC 2030 -> LI = 0 (no warning, 2 bits), VN = 3 (IPv4 only, 3 bits), Mode = 3 (Client Mode, 3 bits) -> 1 byte
    // -> rtol(LI, 6) ^ rotl(VN, 3) ^ rotl(Mode, 0)
    // -> = 0x00 ^ 0x18 ^ 0x03
    ntpData[0] = 0x1b

    for (let i = 1; i < 48; i++) {
      ntpData[i] = 0
    }

    const timeout = setTimeout(() => {
      client.close()
      reject('Timeout waiting for NTP response.')
    }, ntpReplyTimeout)

    let errorFired = false

    client.on('error', (err: Error) => {
      if (errorFired) {
        return
      }

      reject(err.message)
      errorFired = true

      clearTimeout(timeout)
    })

    client.send(ntpData, 0, ntpData.length, ntpPort, ntpServer, err => {
      if (err) {
        if (errorFired) {
          return
        }
        clearTimeout(timeout)
        reject(err.message)
        errorFired = true
        client.close()
        return
      }

      client.once('message', msg => {
        clearTimeout(timeout)
        client.close()

        // Offset to get to the "Transmit Timestamp" field (time at which the reply
        // departed the server for the client, in 64-bit timestamp format."
        const offsetTransmitTime = 40
        let intpart = 0
        let fractpart = 0

        // Get the seconds part
        for (let i = 0; i <= 3; i++) {
          intpart = 256 * intpart + msg[offsetTransmitTime + i]
        }

        // Get the seconds fraction
        for (let i = 4; i <= 7; i++) {
          fractpart = 256 * fractpart + msg[offsetTransmitTime + i]
        }

        const milliseconds = intpart * 1000 + (fractpart * 1000) / 0x100000000

        // **UTC** time
        const date = new Date('Jan 01 1900 GMT')
        date.setUTCMilliseconds(date.getUTCMilliseconds() + milliseconds)

        resolve(date)
      })
    })
  })
}
