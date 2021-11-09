import * as functions from 'firebase-functions'
import { KeyManagementServiceClient, protos } from '@google-cloud/kms'
import express from 'express'
import { CIRCUIT_BREAKER_KEY_PATH } from '../config'

type CryptoKeyVersionState = keyof typeof protos.google.cloud.kms.v1.CryptoKeyVersion.CryptoKeyVersionState

const client = new KeyManagementServiceClient()

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
        status: 'enabled',
      })
    case 'DISABLED':
      return res.status(200).json({
        status: 'temporarily disabled',
      })
    case 'DESTROYED':
      return res.status(200).json({
        status: 'permanently disabled',
      })
    default:
      console.error(`Unexpected key state: ${keyState}`)
      return res.status(200).json({
        status: 'unknown',
      })
  }
})

app.post('/unwrapKey', async (req, res) => {
  const ciphertext = req.body?.ciphertext
  if (!ciphertext) {
    res.status(400).json({
      error: '"ciphertext" parameter must be provided',
    })
    return
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
        console.error(`Error while decrypting ciphertext: ${error}`)
        return res.status(500).json({
          error: 'Error while decrypting ciphertext',
        })
      }

      const plaintext = decryptResponse[0].plaintext as string
      return res.status(200).json({
        plaintext: plaintext.toString(),
      })

    case 'DISABLED':
      return res.status(503)
    case 'DESTROYED':
      return res.status(410)
    default:
      console.error(`Unexpected key state: ${keyState}`)
      return res.status(503)
  }
})

export const circuitBreaker = functions.https.onRequest(app)
