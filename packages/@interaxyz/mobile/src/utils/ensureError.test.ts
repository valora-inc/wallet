import { ensureError } from 'src/utils/ensureError'

describe('ensureError', () => {
  it('returns the same error', () => {
    const error = new Error('test')
    expect(ensureError(error)).toBe(error)
  })
  it('returns a new error with the stringified value for strings', () => {
    const error = ensureError('test')
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Non \'Error\' value thrown. Stringified value: "test"')
  })
  it('returns a new error with the stringified value for numbers', () => {
    const error = ensureError(1)
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe("Non 'Error' value thrown. Stringified value: 1")
  })
  it('returns a new error with the stringified value for objects', () => {
    const error = ensureError({ test: 1 })
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Non \'Error\' value thrown. Stringified value: {"test":1}')
  })
  it('returns a new error for a value that cannot be stringified', () => {
    const circularObject = { a: {}, b: {} }
    circularObject.a = { b: circularObject }
    const error = ensureError(circularObject)
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe(
      `Non 'Error' value thrown. Stringified value: [Unable to stringify the thrown value]`
    )
  })
})
