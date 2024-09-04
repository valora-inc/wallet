import { ErrorMessages } from 'src/app/ErrorMessages'
import { isTxPossiblyPending } from 'src/transactions/send'

describe('isTxPossiblyPending', () => {
  it('returns false when err is invalid', () => {
    const result = isTxPossiblyPending(null)
    expect(result).toBe(false)
  })
  it('returns true when timeout error', () => {
    const result = isTxPossiblyPending(new Error(ErrorMessages.TRANSACTION_TIMEOUT))
    expect(result).toBe(true)
  })
  it('returns true when known tx error', () => {
    const result = isTxPossiblyPending(new Error('known transaction error!!!'))
    expect(result).toBe(true)
  })
  it('returns true when nonce too low', () => {
    const result = isTxPossiblyPending(new Error('nonce too low error!!!'))
    expect(result).toBe(true)
  })
  it('returns true when failed to check for tx receipt', () => {
    const result = isTxPossiblyPending(new Error('Failed to check for transaction receipt:\n{}')) // error message copied from user's logs
    expect(result).toBe(true)
  })
  it('returns false when error is unrelated', () => {
    const result = isTxPossiblyPending(new Error('some unrelated error!!!'))
    expect(result).toBe(false)
  })
})
