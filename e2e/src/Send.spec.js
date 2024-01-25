import SecureSend from './usecases/SecureSend'
import Send from './usecases/Send'

describe('Given', () => {
  describe.skip('Send', Send)
  describe('SecureSend with CPV', SecureSend)
})
