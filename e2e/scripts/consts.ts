import { providers, utils } from 'ethers'
import { Token } from './types'

export const E2E_TEST_WALLET = '0xebf95355cc5ea643179a02337f3f943fd8dd2bcb'
export const E2E_TEST_WALLET_SECURE_SEND = '0x06f4b680c6cb1aeec4a3ce12c63ea18acb136aa3'
export const E2E_TEST_WALLET_SINGLE_VERIFIED_ADDRESS = '0xdfc6be410421fcf1842aea7139d101eee549ab1b'
export const E2E_TEST_FAUCET = '0xa694b396cd6f73e4003da8f97f4b12e498b3f2ec'
export const REFILL_TOKENS = ['CELO', 'cUSD', 'cEUR']

export const CELO: Token = {
  symbol: 'CELO',
  address: utils.getAddress('0x471ece3750da237f93b8e339c536989b8978a438'),
  decimals: 18,
}
export const CUSD: Token = {
  symbol: 'cUSD',
  address: utils.getAddress('0x765de816845861e75a25fca122bb6898b8b1282a'),
  decimals: 18,
}
export const CEUR: Token = {
  symbol: 'cEUR',
  address: utils.getAddress('0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73'),
  decimals: 18,
}
export const TOKENS_BY_SYMBOL: Record<string, Token> = {
  CELO,
  cUSD: CUSD,
  cEUR: CEUR,
}

export const provider = new providers.JsonRpcProvider('https://forno.celo.org/')
