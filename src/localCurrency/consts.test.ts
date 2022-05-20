import { LocalCurrencyCode, LocalCurrencySymbol } from 'src/localCurrency/consts'

describe('Local currency consts', () => {
  it('each currency has a symbol', () => {
    for (const code of Object.values(LocalCurrencyCode)) {
      expect(LocalCurrencySymbol[code]).toBeTruthy()
    }
  })
})
