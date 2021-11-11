import * as functions from 'firebase-functions'
import { KeyManagementServiceClient, protos } from '@google-cloud/kms'
import express from 'express'
import { CIRCUIT_BREAKER_KEY_PATH } from '../config'

type CryptoKeyVersionState = keyof typeof protos.google.cloud.kms.v1.CryptoKeyVersion.CryptoKeyVersionState

const client = new KeyManagementServiceClient()

export enum KeyStatus {
  Enabled = 'ENABLED',
  Disabled = 'DISABLED',
  Destroyed = 'DESTROYED',
  Unknown = 'UNKNOWN',
}

const BASE64_REGEXP = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/

const app = express()
app.use(express.json())

async function getKeyState(): Promise<CryptoKeyVersionState> {
  const getCryptoKeyVersionResult = await client.getCryptoKeyVersion({
    name: CIRCUIT_BREAKER_KEY_PATH,
  })
  return getCryptoKeyVersionResult[0].state as CryptoKeyVersionState
}

app.get('/health', async (req, res) => {
  return res.status(200).json({
    status: 'ok',
  })
})

app.get('/status', async (req, res) => {
  const keyState = await getKeyState()
  switch (keyState) {
    case 'ENABLED':
      return res.status(200).json({
        status: KeyStatus.Enabled,
      })
    case 'DISABLED':
      return res.status(200).json({
        status: KeyStatus.Disabled,
      })
    case 'DESTROYED':
      return res.status(200).json({
        status: KeyStatus.Destroyed,
      })
    default:
      console.error(`Unexpected key state: ${keyState}`)
      return res.status(200).json({
        status: KeyStatus.Unknown,
      })
  }
})

app.post('/unwrap-key', async (req, res) => {
  const ciphertext = req.body?.ciphertext
  if (!ciphertext) {
    return res.status(400).json({
      error: '"ciphertext" parameter must be provided',
    })
  } else if (!BASE64_REGEXP.test(ciphertext)) {
    return res.status(400).json({
      error: '"ciphertext" parameter must be a base64 encoded buffer',
    })
  }

  const keyState = await getKeyState()
  switch (keyState) {
    case 'ENABLED':
      let decryptResponse
      try {
        decryptResponse = await client.asymmetricDecrypt({
          name: CIRCUIT_BREAKER_KEY_PATH,
          ciphertext,
        })
      } catch (error) {
        console.error(`Error while decrypting ciphertext: ${error.message}`)
        return res.status(500).json({
          error: 'Error while decrypting ciphertext',
        })
      }

      const plaintext = decryptResponse[0].plaintext as Buffer
      return res.status(200).json({
        plaintext: plaintext.toString('base64'),
      })

    case 'DISABLED':
      return res.status(503).json({
        status: KeyStatus.Disabled,
      })
    case 'DESTROYED':
      return res.status(503).json({
        status: KeyStatus.Destroyed,
      })
    default:
      console.error(`Unexpected key state: ${keyState}`)
      return res.status(503).json({
        status: KeyStatus.Unknown,
      })
  }
})

export const circuitBreaker = functions.https.onRequest(app)
