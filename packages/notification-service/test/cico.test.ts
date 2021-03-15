import express from 'express'
import request from 'supertest'
import cicoRouter, { Provider } from '../src/cico/cicoRouter'
import { saveTxHashProvider } from '../src/firebase'

const app = express()
app.use(express.json())

app.use('/cico', cicoRouter)

const mockVerify = jest.fn()

jest.mock('../src/firebase')
jest.mock('crypto', () => ({
  ...(jest.requireActual('crypto') as any),
  createVerify: jest.fn(() => ({
    update: jest.fn(),
    verify: mockVerify,
  })),
}))

describe('Moonpay cash in', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('POST /moonpay - success', async () => {
    global.Buffer.compare = () => 0
    const mockMoonpaySignature =
      't=1492774577,s=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd'
    const { status } = await request(app)
      .post('/cico/moonpay')
      .send({
        type: 'mock',
        data: {
          walletAddress: '0x123',
          cryptoTransactionId: '0x456',
        },
      })
      .set('Moonpay-Signature-V2', mockMoonpaySignature)

    expect(status).toEqual(204)
    expect(saveTxHashProvider).toHaveBeenCalledTimes(1)
    expect(saveTxHashProvider).toHaveBeenCalledWith('0x123', '0x456', Provider.Moonpay)
  })

  it('POST /moonpay - wrong signature', async () => {
    global.Buffer.compare = () => 1
    const mockMoonpaySignature =
      't=1492774577,s=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd'
    const { status } = await request(app)
      .post('/cico/moonpay')
      .send({
        type: 'mock',
        data: {
          walletAddress: '0x123',
          cryptoTransactionId: '0x456',
        },
      })
      .set('Moonpay-Signature-V2', mockMoonpaySignature)

    expect(status).toEqual(401)
    expect(saveTxHashProvider).not.toHaveBeenCalled()
  })

  it('POST /moonpay - no tx id', async () => {
    global.Buffer.compare = () => 0
    const mockMoonpaySignature =
      't=1492774577,s=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd'
    const { status } = await request(app)
      .post('/cico/moonpay')
      .send({
        type: 'mock',
        data: {
          walletAddress: '0x123',
          cryptoTransactionId: '',
        },
      })
      .set('Moonpay-Signature-V2', mockMoonpaySignature)

    expect(status).toEqual(204)
    expect(saveTxHashProvider).not.toHaveBeenCalled()
  })
})

describe('Ramp cash in', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('POST /ramp - success', async () => {
    mockVerify.mockReturnValue(true)
    const { status } = await request(app)
      .post('/cico/ramp')
      .send({
        type: 'RELEASED',
        purchase: {
          receiverAddress: '0x123',
          actions: [
            {
              newStatus: 'RELEASED',
              details: '0x456',
            },
          ],
        },
      })
      .set('X-Body-Signature', 'test signature')

    expect(status).toEqual(204)
    expect(saveTxHashProvider).toHaveBeenCalledTimes(1)
    expect(saveTxHashProvider).toHaveBeenCalledWith('0x123', '0x456', Provider.Ramp)
  })

  it('POST /ramp - wrong signature', async () => {
    mockVerify.mockReturnValue(false)
    const { status } = await request(app)
      .post('/cico/ramp')
      .send({
        type: 'RELEASED',
        purchase: {
          receiverAddress: '0x123',
          actions: [
            {
              newStatus: 'RELEASED',
              details: '0x456',
            },
          ],
        },
      })
      .set('X-Body-Signature', 'test signature')

    expect(status).toEqual(401)
    expect(saveTxHashProvider).not.toHaveBeenCalled()
  })

  it('POST /ramp - no tx hash', async () => {
    mockVerify.mockReturnValue(true)
    const { status } = await request(app)
      .post('/cico/ramp')
      .send({
        type: 'RELEASED',
        purchase: {
          receiverAddress: '0x123',
          actions: [
            {
              newStatus: 'RELEASED',
              details: undefined,
            },
          ],
        },
      })
      .set('X-Body-Signature', 'test signature')

    expect(status).toEqual(204)
    expect(saveTxHashProvider).not.toHaveBeenCalled()
  })
})
