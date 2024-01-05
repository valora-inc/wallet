import addressNew from './addressNew'
import recentRecipient from './recentRecipient'

// Uses an existing wallet with multiple balances
describe('Ordered Send Tests', () => {
  describe('Address (New flow) cEUR', addressNew)
  describe('Recent Recipient (New flow) cUSD', recentRecipient)
})
