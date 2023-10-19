import { toTransactionObject } from '@celo/connect'
import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call, select } from 'redux-saga/effects'
import { showError, showMessage } from 'src/alert/actions'
import { SendOrigin } from 'src/analytics/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { validateRecipientAddressSuccess } from 'src/identity/actions'
import { encryptComment } from 'src/identity/commentEncryption'
import { E164NumberToAddressType } from 'src/identity/reducer'
import { e164NumberToAddressSelector } from 'src/identity/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { urlFromUriData } from 'src/qrcode/schema'
import { BarcodeTypes } from 'src/qrcode/utils'
import { RecipientType } from 'src/recipients/recipient'
import { recipientInfoSelector } from 'src/recipients/reducer'
import { Actions, HandleBarcodeDetectedAction, QrCode, SendPaymentAction } from 'src/send/actions'
import { sendPaymentSaga, watchQrCodeDetections } from 'src/send/saga'
import { getDynamicConfigParams, getFeatureGate } from 'src/statsig'
import { getERC20TokenContract, getStableTokenContract } from 'src/tokens/saga'
import { addStandbyTransaction } from 'src/transactions/actions'
import { sendTransactionAsync } from 'src/transactions/contract-utils'
import { sendAndMonitorTransaction } from 'src/transactions/saga'
import { NetworkId, TokenTransactionTypeV2, TransactionStatus } from 'src/transactions/types'
import { sendPayment as viemSendPayment } from 'src/viem/saga'
import {
  UnlockResult,
  getConnectedAccount,
  getConnectedUnlockedAccount,
  unlockAccount,
} from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockAccount2Invite,
  mockAccountInvite,
  mockContract,
  mockCusdAddress,
  mockCusdTokenId,
  mockE164Number,
  mockE164NumberInvite,
  mockFeeInfo,
  mockName,
  mockQRCodeRecipient,
  mockQrCodeData,
  mockQrCodeData2,
  mockRecipientInfo,
  mockTransactionData,
} from 'test/values'

jest.mock('@celo/connect')
jest.mock('src/statsig')

const mockNewTransactionContext = jest.fn()

jest.mock('src/transactions/types', () => {
  const originalModule = jest.requireActual('src/transactions/types')

  return {
    ...originalModule,
    newTransactionContext: (tag: string, description: string) =>
      mockNewTransactionContext(tag, description),
  }
})

jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    __esModule: true,
    ...originalModule,
    default: {
      ...originalModule.default,
      networkToNetworkId: {
        celo: 'celo-alfajores',
        ethereum: 'ethereuim-sepolia',
      },
      defaultNetworkId: 'celo-alfajores',
    },
  }
})

const mockContext = { id: 'mock' }
mockNewTransactionContext.mockReturnValue(mockContext)

const mockE164NumberToAddress: E164NumberToAddressType = {
  [mockE164NumberInvite]: [mockAccountInvite, mockAccount2Invite],
}

describe(watchQrCodeDetections, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    jest.mocked(getDynamicConfigParams).mockReturnValueOnce({
      showSend: [NetworkId['celo-alfajores']],
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('navigates to the send amount screen with a valid qr code', async () => {
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: urlFromUriData(mockQrCodeData) }

    await expectSaga(watchQrCodeDetections)
      .withState(createMockStore({}).getState())
      .provide([
        [select(e164NumberToAddressSelector), mockE164NumberToAddress],
        [select(recipientInfoSelector), mockRecipientInfo],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .silentRun()
    expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
      origin: SendOrigin.AppSendFlow,
      isFromScan: true,
      recipient: {
        address: mockAccount.toLowerCase(),
        name: mockName,
        e164PhoneNumber: mockE164Number,
        contactId: undefined,
        thumbnailPath: undefined,
        recipientType: RecipientType.Address,
      },
      forceTokenId: false,
    })
  })

  it('navigates to the send amount screen with a qr code with an empty display name', async () => {
    const data: QrCode = {
      type: BarcodeTypes.QR_CODE,
      data: urlFromUriData({
        address: mockQrCodeData.address,
        e164PhoneNumber: mockQrCodeData.e164PhoneNumber,
      }),
    }

    await expectSaga(watchQrCodeDetections)
      .withState(createMockStore({}).getState())
      .provide([
        [select(e164NumberToAddressSelector), {}],
        [select(recipientInfoSelector), mockRecipientInfo],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .silentRun()
    expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
      origin: SendOrigin.AppSendFlow,
      isFromScan: true,
      recipient: {
        address: mockAccount.toLowerCase(),
        e164PhoneNumber: mockE164Number,
        contactId: undefined,
        thumbnailPath: undefined,
        recipientType: RecipientType.Address,
      },
      forceTokenId: false,
    })
  })

  it('navigates to the send amount screen with a qr code with an empty phone number', async () => {
    const data: QrCode = {
      type: BarcodeTypes.QR_CODE,
      data: urlFromUriData({
        address: mockQrCodeData.address,
        displayName: mockQrCodeData.displayName,
      }),
    }

    await expectSaga(watchQrCodeDetections)
      .withState(createMockStore({}).getState())
      .provide([
        [select(e164NumberToAddressSelector), {}],
        [select(recipientInfoSelector), mockRecipientInfo],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .silentRun()
    expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
      origin: SendOrigin.AppSendFlow,
      isFromScan: true,
      recipient: {
        address: mockAccount.toLowerCase(),
        name: mockName,
        displayNumber: undefined,
        e164PhoneNumber: undefined,
        contactId: undefined,
        thumbnailPath: undefined,
        recipientType: RecipientType.Address,
      },
      forceTokenId: false,
    })
  })

  it('displays an error when scanning an invalid qr code', async () => {
    const INVALID_QR = 'not-json'
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: INVALID_QR }

    await expectSaga(watchQrCodeDetections)
      .withState(createMockStore({}).getState())
      .provide([
        [select(e164NumberToAddressSelector), {}],
        [select(recipientInfoSelector), mockRecipientInfo],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .put(showError(ErrorMessages.QR_FAILED_INVALID_ADDRESS))
      .silentRun()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('displays an error when scanning a qr code with an invalid address', async () => {
    const INVALID_QR_ADDRESS = {
      address: 'not-an-address',
      e164PhoneNumber: '+>19999907599',
      displayName: 'Joe',
    }
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: urlFromUriData(INVALID_QR_ADDRESS) }

    await expectSaga(watchQrCodeDetections)
      .withState(createMockStore({}).getState())
      .provide([
        [select(e164NumberToAddressSelector), {}],
        [select(recipientInfoSelector), mockRecipientInfo],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .put(showError(ErrorMessages.QR_FAILED_INVALID_ADDRESS))
      .silentRun()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('navigates to the send confirmation screen when secure send scan is successful for a send', async () => {
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: urlFromUriData(mockQrCodeData2) }
    const qrAction: HandleBarcodeDetectedAction = {
      type: Actions.BARCODE_DETECTED,
      data,
      scanIsForSecureSend: true,
      transactionData: mockTransactionData,
    }
    await expectSaga(watchQrCodeDetections)
      .withState(createMockStore({}).getState())
      .provide([
        [select(e164NumberToAddressSelector), mockE164NumberToAddress],
        [select(recipientInfoSelector), mockRecipientInfo],
      ])
      .dispatch(qrAction)
      .put(validateRecipientAddressSuccess(mockE164NumberInvite, mockAccount2Invite.toLowerCase()))
      .silentRun()
    expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmation, {
      origin: SendOrigin.AppSendFlow,
      transactionData: mockTransactionData,
      isFromScan: true,
    })
  })

  it("displays an error when QR code scanned for secure send doesn't map to the recipient", async () => {
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: urlFromUriData(mockQrCodeData) }
    const qrAction: HandleBarcodeDetectedAction = {
      type: Actions.BARCODE_DETECTED,
      data,
      scanIsForSecureSend: true,
      transactionData: mockTransactionData,
    }
    await expectSaga(watchQrCodeDetections)
      .withState(createMockStore({}).getState())
      .provide([
        [select(e164NumberToAddressSelector), mockE164NumberToAddress],
        [select(recipientInfoSelector), mockRecipientInfo],
      ])
      .dispatch(qrAction)
      .put(showMessage(ErrorMessages.QR_FAILED_INVALID_RECIPIENT))
      .silentRun()
    expect(navigate).not.toHaveBeenCalled()
  })
})

describe(sendPaymentSaga, () => {
  const amount = new BigNumber(10)
  const sendAction: SendPaymentAction = {
    type: Actions.SEND_PAYMENT,
    amount,
    tokenId: mockCusdTokenId,
    usdAmount: amount,
    comment: '',
    recipient: mockQRCodeRecipient,
    fromModal: false,
    feeInfo: mockFeeInfo,
  }

  beforeAll(() => {
    ;(toTransactionObject as jest.Mock).mockImplementation(() => jest.fn())
  })

  beforeEach(() => {
    jest.mocked(getFeatureGate).mockReturnValue(false)
    jest.clearAllMocks()
  })

  it('sends a payment successfully with contract kit', async () => {
    await expectSaga(sendPaymentSaga, sendAction)
      .withState(createMockStore({}).getState())
      .provide([
        [call(getConnectedUnlockedAccount), mockAccount],
        [call(encryptComment, 'asdf', 'asdf', 'asdf', true), 'Asdf'],
        [call(getERC20TokenContract, mockCusdAddress), mockContract],
        [call(getStableTokenContract, mockCusdAddress), mockContract],
        [matchers.call.fn(sendTransactionAsync), undefined],
      ])
      .put(
        addStandbyTransaction({
          context: mockContext,
          networkId: NetworkId['celo-alfajores'],
          type: TokenTransactionTypeV2.Sent,
          comment: sendAction.comment,
          status: TransactionStatus.Pending,
          value: amount.negated().toString(),
          tokenAddress: mockCusdAddress,
          tokenId: mockCusdTokenId,
          timestamp: Math.floor(Date.now() / 1000),
          address: mockQRCodeRecipient.address,
        })
      )
      .call.fn(sendAndMonitorTransaction)
      .run()

    expect(mockContract.methods.transferWithComment).toHaveBeenCalledWith(
      mockQRCodeRecipient.address,
      amount.times(1e18).toFixed(0),
      expect.any(String)
    )
  })

  it('sends a payment successfully with viem', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    await expectSaga(sendPaymentSaga, sendAction)
      .withState(createMockStore({}).getState())
      .provide([
        [call(getConnectedUnlockedAccount), mockAccount],
        [matchers.call.fn(viemSendPayment), undefined],
      ])
      .call(viemSendPayment, {
        context: { id: 'mock' },
        recipientAddress: sendAction.recipient.address,
        amount: sendAction.amount,
        tokenId: sendAction.tokenId,
        comment: sendAction.comment,
        feeInfo: sendAction.feeInfo,
      })
      .not.call.fn(sendAndMonitorTransaction)
      .run()

    expect(mockContract.methods.transferWithComment).not.toHaveBeenCalled()
    expect(mockContract.methods.transfer).not.toHaveBeenCalled()
  })

  it('fails if user cancels PIN input', async () => {
    const account = '0x000123'
    await expectSaga(sendPaymentSaga, sendAction)
      .provide([
        [call(getConnectedAccount), account],
        [matchers.call.fn(unlockAccount), UnlockResult.CANCELED],
      ])
      .put(showError(ErrorMessages.PIN_INPUT_CANCELED))
      .run()
  })

  it('uploads symmetric keys if transaction sent successfully', async () => {
    const account = '0x000123'
    await expectSaga(sendPaymentSaga, sendAction)
      .provide([
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(currentAccountSelector), account],
        [call(encryptComment, 'asdf', 'asdf', 'asdf', true), 'Asdf'],
        [call(getERC20TokenContract, mockCusdAddress), mockContract],
        [call(getStableTokenContract, mockCusdAddress), mockContract],
      ])
      .run()
  })
})
