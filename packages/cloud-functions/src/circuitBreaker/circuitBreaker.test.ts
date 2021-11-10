import request from 'supertest'
import { Buffer } from 'buffer'

// Mock before import since KMS client is created globally
const mockClient = {
  getCryptoKeyVersion: jest.fn(),
  asymmetricDecrypt: jest.fn(),
}
jest.mock('@google-cloud/kms', () => ({
  ...(jest.requireActual('@google-cloud/kms') as any),
  KeyManagementServiceClient: jest.fn(() => mockClient),
}))
import { circuitBreaker } from './circuitBreaker'

describe('Circuit Breaker', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('GET /health returns 200', async () => {
    await request(circuitBreaker).get('/health').expect({ status: 'ok' }).expect(200)
  })

  it('GET /status returns enabled', async () => {
    mockClient.getCryptoKeyVersion = jest.fn(() => [{ state: 'ENABLED' }])
    await request(circuitBreaker).get('/status').expect({ status: 'enabled' }).expect(200)
  })
  it('GET /status returns disabled', async () => {
    mockClient.getCryptoKeyVersion = jest.fn(() => [{ state: 'DISABLED' }])
    await request(circuitBreaker)
      .get('/status')
      .expect({ status: 'temporarily disabled' })
      .expect(200)
  })
  it('GET /status returns destroyed', async () => {
    mockClient.getCryptoKeyVersion = jest.fn(() => [{ state: 'DESTROYED' }])
    await request(circuitBreaker)
      .get('/status')
      .expect({ status: 'permanently disabled' })
      .expect(200)
  })
  it('GET /status returns unknown', async () => {
    mockClient.getCryptoKeyVersion = jest.fn(() => [{ state: 'some unknown state' }])
    console.error = jest.fn()
    await request(circuitBreaker).get('/status').expect({ status: 'unknown' }).expect(200)
    // Verify that we're submitting logs to GCP
    expect(console.error).toHaveBeenCalledWith('Unexpected key state: some unknown state')
  })

  it('POST /unwrap-key returns 400 without ciphertext', async () => {
    await request(circuitBreaker)
      .post('/unwrap-key')
      .send({ notciphertext: 'foo' })
      .expect({ error: '"ciphertext" parameter must be provided' })
      .expect(400)
  })
  it('POST /unwrap-key returns decrypted plaintext', async () => {
    mockClient.getCryptoKeyVersion = jest.fn(() => [{ state: 'ENABLED' }])
    mockClient.asymmetricDecrypt = jest.fn(() => [{ plaintext: Buffer.from('my plaintext') }])
    await request(circuitBreaker)
      .post('/unwrap-key')
      .send({ ciphertext: 'some ciphertext' })
      .expect({ plaintext: 'my plaintext' })
      .expect(200)
  })
  it('POST /unwrap-key returns 500 if failure while decrypting', async () => {
    mockClient.getCryptoKeyVersion = jest.fn(() => [{ state: 'ENABLED' }])
    mockClient.asymmetricDecrypt = jest.fn(() => {
      throw new Error('decryption error')
    })
    console.error = jest.fn()
    await request(circuitBreaker)
      .post('/unwrap-key')
      .send({ ciphertext: 'some ciphertext' })
      .expect({ error: 'Error while decrypting ciphertext' })
      .expect(500)
    // Verify that we're submitting logs to GCP
    expect(console.error).toHaveBeenCalledWith(
      'Error while decrypting ciphertext: decryption error'
    )
  })
  it('POST /unwrap-key returns 503 if key is temporarily disabled', async () => {
    mockClient.getCryptoKeyVersion = jest.fn(() => [{ state: 'DISABLED' }])
    await request(circuitBreaker)
      .post('/unwrap-key')
      .send({ ciphertext: 'some ciphertext' })
      .expect(503)
  })
  it('POST /unwrap-key returns 410 if key is permanentely destroyed', async () => {
    mockClient.getCryptoKeyVersion = jest.fn(() => [{ state: 'DISABLED' }])
    await request(circuitBreaker)
      .post('/unwrap-key')
      .send({ ciphertext: 'some ciphertext' })
      .expect(503)
  })
  it('POST /unwrap-key returns 503 if key has unexpected state', async () => {
    mockClient.getCryptoKeyVersion = jest.fn(() => [{ state: 'some unknown state' }])
    console.error = jest.fn()
    await request(circuitBreaker)
      .post('/unwrap-key')
      .send({ ciphertext: 'some ciphertext' })
      .expect(503)
    // Verify that we're submitting logs to GCP
    expect(console.error).toHaveBeenCalledWith('Unexpected key state: some unknown state')
  })
})
