import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call, select } from 'redux-saga/effects'
import { giveProfileAccess } from 'src/account/profileInfo'
import { showError, showMessage } from 'src/alert/actions'
import { SendOrigin } from 'src/analytics/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { validateRecipientAddressSuccess } from 'src/identity/actions'
import { encryptComment } from 'src/identity/commentEncryption'
import { E164NumberToAddressType } from 'src/identity/reducer'
import { e164NumberToAddressSelector } from 'src/identity/selectors'
import { sendInvite } from 'src/invite/saga'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { urlFromUriData } from 'src/qrcode/schema'
import { BarcodeTypes } from 'src/qrcode/utils'
import { recipientInfoSelector } from 'src/recipients/reducer'
import {
  Actions,
  HandleBarcodeDetectedAction,
  QrCode,
  SendPaymentOrInviteAction,
  SendPaymentOrInviteActionLegacy,
} from 'src/send/actions'
import {
  sendPaymentOrInviteSaga,
  sendPaymentOrInviteSagaLegacy,
  watchQrCodeDetections,
} from 'src/send/saga'
import { getERC20TokenContract } from 'src/tokens/saga'
import { sendAndMonitorTransaction } from 'src/transactions/saga'
import { Currency } from 'src/utils/currencies'
import {
  getConnectedAccount,
  getConnectedUnlockedAccount,
  unlockAccount,
  UnlockResult,
} from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockAccount2Invite,
  mockAccountInvite,
  mockContract,
  mockCusdAddress,
  mockE164Number,
  mockE164NumberInvite,
  mockInvitableRecipient,
  mockName,
  mockQrCodeData,
  mockQrCodeData2,
  mockQRCodeRecipient,
  mockRecipientInfo,
  mockTransactionData,
} from 'test/values'

jest.mock('src/utils/time', () => ({
  clockInSync: () => true,
}))

jest.mock('src/invite/saga', () => ({
  sendInvite: jest.fn(),
}))

const mockE164NumberToAddress: E164NumberToAddressType = {
  [mockE164NumberInvite]: [mockAccountInvite, mockAccount2Invite],
}

describe(watchQrCodeDetections, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('navigates to the send amount screen with a valid qr code', async () => {
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: urlFromUriData(mockQrCodeData) }

    await expectSaga(watchQrCodeDetections)
      .provide([
        [select(e164NumberToAddressSelector), mockE164NumberToAddress],
        [select(recipientInfoSelector), mockRecipientInfo],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .silentRun()
    expect(navigate).toHaveBeenCalledWith(Screens.SendAmountLegacy, {
      origin: SendOrigin.AppSendFlow,
      isFromScan: true,
      recipient: {
        address: mockAccount.toLowerCase(),
        name: mockName,
        e164PhoneNumber: mockE164Number,
        contactId: undefined,
        thumbnailPath: undefined,
      },
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
      .provide([
        [select(e164NumberToAddressSelector), {}],
        [select(recipientInfoSelector), mockRecipientInfo],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .silentRun()
    expect(navigate).toHaveBeenCalledWith(Screens.SendAmountLegacy, {
      origin: SendOrigin.AppSendFlow,
      isFromScan: true,
      recipient: {
        address: mockAccount.toLowerCase(),
        e164PhoneNumber: mockE164Number,
        contactId: undefined,
        thumbnailPath: undefined,
      },
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
      .provide([
        [select(e164NumberToAddressSelector), {}],
        [select(recipientInfoSelector), mockRecipientInfo],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .silentRun()
    expect(navigate).toHaveBeenCalledWith(Screens.SendAmountLegacy, {
      origin: SendOrigin.AppSendFlow,
      isFromScan: true,
      recipient: {
        address: mockAccount.toLowerCase(),
        name: mockName,
        displayNumber: undefined,
        e164PhoneNumber: undefined,
        contactId: undefined,
        thumbnailPath: undefined,
      },
    })
  })

  it('displays an error when scanning an invalid qr code', async () => {
    const INVALID_QR = 'not-json'
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: INVALID_QR }

    await expectSaga(watchQrCodeDetections)
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
      .provide([
        [select(e164NumberToAddressSelector), mockE164NumberToAddress],
        [select(recipientInfoSelector), mockRecipientInfo],
      ])
      .dispatch(qrAction)
      .put(validateRecipientAddressSuccess(mockE164NumberInvite, mockAccount2Invite.toLowerCase()))
      .silentRun()
    expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmationLegacy, {
      origin: SendOrigin.AppSendFlow,
      transactionData: mockTransactionData,
      addressJustValidated: true,
    })
  })

  it('navigates to the payment request confirmation screen when secure send scan is successful for a request', async () => {
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: urlFromUriData(mockQrCodeData2) }
    const qrAction: HandleBarcodeDetectedAction = {
      type: Actions.BARCODE_DETECTED,
      data,
      scanIsForSecureSend: true,
      isOutgoingPaymentRequest: true,
      transactionData: mockTransactionData,
    }
    await expectSaga(watchQrCodeDetections)
      .provide([
        [select(e164NumberToAddressSelector), mockE164NumberToAddress],
        [select(recipientInfoSelector), mockRecipientInfo],
      ])
      .dispatch(qrAction)
      .put(validateRecipientAddressSuccess(mockE164NumberInvite, mockAccount2Invite.toLowerCase()))
      .silentRun()
    expect(navigate).toHaveBeenCalledWith(Screens.PaymentRequestConfirmation, {
      transactionData: mockTransactionData,
      addressJustValidated: true,
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

describe(sendPaymentOrInviteSagaLegacy, () => {
  it('fails if user cancels PIN input', async () => {
    const account = '0x000123'
    const sendPaymentOrInviteAction: SendPaymentOrInviteActionLegacy = {
      type: Actions.SEND_PAYMENT_OR_INVITE_LEGACY,
      amount: new BigNumber(10),
      currency: Currency.Dollar,
      comment: '',
      recipient: mockQRCodeRecipient,
      firebasePendingRequestUid: null,
      fromModal: false,
    }
    await expectSaga(sendPaymentOrInviteSagaLegacy, sendPaymentOrInviteAction)
      .provide([
        [call(getConnectedAccount), account],
        [matchers.call.fn(unlockAccount), UnlockResult.CANCELED],
      ])
      .put(showError(ErrorMessages.PIN_INPUT_CANCELED))
      .run()
  })

  it('uploads symmetric keys if transaction sent successfully', async () => {
    const account = '0x000123'
    const sendPaymentOrInviteAction: SendPaymentOrInviteActionLegacy = {
      type: Actions.SEND_PAYMENT_OR_INVITE_LEGACY,
      amount: new BigNumber(10),
      currency: Currency.Dollar,
      comment: '',
      recipient: mockQRCodeRecipient,
      recipientAddress: mockQRCodeRecipient.address,
      firebasePendingRequestUid: null,
      fromModal: false,
    }
    await expectSaga(sendPaymentOrInviteSagaLegacy, sendPaymentOrInviteAction)
      .withState(createMockStore({}).getState())
      .provide([
        [call(getConnectedAccount), account],
        [matchers.call.fn(unlockAccount), UnlockResult.SUCCESS],
        [select(currentAccountSelector), account],
        [call(encryptComment, 'asdf', 'asdf', 'asdf', true), 'Asdf'],
      ])
      .call.fn(giveProfileAccess)
      .run()
  })
})

describe(sendPaymentOrInviteSaga, () => {
  const amount = new BigNumber(10)
  const sendAction: SendPaymentOrInviteAction = {
    type: Actions.SEND_PAYMENT_OR_INVITE,
    amount,
    tokenAddress: mockCusdAddress,
    amountInLocalCurrency: amount.multipliedBy(1.33),
    usdAmount: amount,
    comment: '',
    recipient: mockQRCodeRecipient,
    fromModal: false,
  }

  it('sends a payment successfully', async () => {
    await expectSaga(sendPaymentOrInviteSaga, sendAction)
      .withState(createMockStore({}).getState())
      .provide([
        [call(getConnectedUnlockedAccount), mockAccount],
        [call(encryptComment, 'asdf', 'asdf', 'asdf', true), 'Asdf'],
        [call(getERC20TokenContract, mockCusdAddress), mockContract],
      ])
      .call.fn(sendAndMonitorTransaction)
      .run()

    expect(mockContract.methods.transfer).toHaveBeenCalledWith(
      mockQRCodeRecipient.address,
      amount.times(1e18).toFixed(0)
    )
  })

  it('sends an invite successfully', async () => {
    await expectSaga(sendPaymentOrInviteSaga, {
      ...sendAction,
      recipient: mockInvitableRecipient,
    })
      .withState(createMockStore({}).getState())
      .provide([[call(getConnectedUnlockedAccount), mockAccount]])
      .run()

    expect(sendInvite).toHaveBeenCalledWith(
      mockInvitableRecipient.e164PhoneNumber,
      amount,
      amount,
      mockCusdAddress,
      undefined
    )
  })

  it('fails if user cancels PIN input', async () => {
    const account = '0x000123'
    await expectSaga(sendPaymentOrInviteSaga, sendAction)
      .provide([
        [call(getConnectedAccount), account],
        [matchers.call.fn(unlockAccount), UnlockResult.CANCELED],
      ])
      .put(showError(ErrorMessages.PIN_INPUT_CANCELED))
      .run()
  })

  it('uploads symmetric keys if transaction sent successfully', async () => {
    const account = '0x000123'
    await expectSaga(sendPaymentOrInviteSaga, sendAction)
      .withState(createMockStore({}).getState())
      .provide([
        [call(getConnectedAccount), account],
        [matchers.call.fn(unlockAccount), UnlockResult.SUCCESS],
        [select(currentAccountSelector), account],
        [call(encryptComment, 'asdf', 'asdf', 'asdf', true), 'Asdf'],
        [call(getERC20TokenContract, mockCusdAddress), mockContract],
      ])
      .call.fn(giveProfileAccess)
      .run()
  })
})
