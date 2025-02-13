/* eslint-disable require-yield */
import { mockAccount } from 'test/values'
import {
  UnlockResult as InternalUnlockResult,
  unlockAccount as unlockAccountSaga,
} from '../web3/saga'
import { walletAddressSelector } from '../web3/selectors'
import { unlockAccount } from './unlockAccount'

jest.mock('../web3/selectors', () => ({
  ...jest.requireActual('../web3/selectors'),
  walletAddressSelector: jest.fn(),
}))
jest.mock('../web3/saga', () => ({
  ...jest.requireActual('../web3/saga'),
  unlockAccount: jest.fn(),
}))

const mockWalletSelector = jest.mocked(walletAddressSelector)
const mockUnlockSaga = jest.mocked(unlockAccountSaga)

describe('unlockAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Set default mock values
    mockWalletSelector.mockReturnValue(mockAccount)
    mockUnlockSaga.mockImplementation(function* () {
      return InternalUnlockResult.SUCCESS
    })
  })

  it('should return success when unlock is successful', async () => {
    mockUnlockSaga.mockImplementation(function* () {
      return InternalUnlockResult.SUCCESS
    })

    const result = await unlockAccount()
    expect(result).toBe('success')
    expect(mockUnlockSaga).toHaveBeenCalledWith(mockAccount)
  })

  it('should return failure when unlock fails', async () => {
    mockUnlockSaga.mockImplementation(function* () {
      return InternalUnlockResult.FAILURE
    })

    const result = await unlockAccount()
    expect(result).toBe('failure')
    expect(mockUnlockSaga).toHaveBeenCalledWith(mockAccount)
  })

  it('should return canceled when unlock is canceled', async () => {
    mockUnlockSaga.mockImplementation(function* () {
      return InternalUnlockResult.CANCELED
    })

    const result = await unlockAccount()
    expect(result).toBe('canceled')
    expect(mockUnlockSaga).toHaveBeenCalledWith(mockAccount)
  })

  it('should return failure when saga throws an error', async () => {
    mockUnlockSaga.mockImplementation(function* () {
      throw new Error('Some error')
    })

    const result = await unlockAccount()
    expect(result).toBe('failure')
    expect(mockUnlockSaga).toHaveBeenCalledWith(mockAccount)
  })

  it('should return failure when no wallet address is found', async () => {
    mockWalletSelector.mockReturnValue(null)

    const result = await unlockAccount()
    expect(result).toBe('failure')
    expect(mockUnlockSaga).not.toHaveBeenCalled()
  })
})
