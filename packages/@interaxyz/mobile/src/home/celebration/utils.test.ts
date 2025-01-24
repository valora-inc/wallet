import { isSameNftContract } from 'src/home/celebration/utils'
import { NetworkId } from 'src/transactions/types'

describe('isSameNftContract', () => {
  it('returns true when NFTs have the same network ID and contract address', () => {
    const nft1 = { networkId: NetworkId['celo-alfajores'], contractAddress: '0xTEST' }
    const nft2 = { networkId: NetworkId['celo-alfajores'], contractAddress: '0xTEST' }
    expect(isSameNftContract(nft1, nft2)).toBe(true)
  })

  it('returns false when both NFTs are undefined or null', () => {
    expect(isSameNftContract(undefined, null)).toBe(false)
  })

  it('returns false when one NFT is undefined or null', () => {
    const nft1 = { networkId: NetworkId['celo-alfajores'], contractAddress: '0xTEST' }
    expect(isSameNftContract(nft1, undefined)).toBe(false)
    expect(isSameNftContract(null, nft1)).toBe(false)
  })

  it('returns false when NFTs have different networkIds', () => {
    const nft1 = { networkId: NetworkId['celo-alfajores'], contractAddress: '0xTEST' }
    const nft2 = { networkId: NetworkId['ethereum-sepolia'], contractAddress: '0xTEST' }
    expect(isSameNftContract(nft1, nft2)).toBe(false)
  })

  it('returns false when NFTs have different contract addresses', () => {
    const nft1 = { networkId: NetworkId['celo-alfajores'], contractAddress: '0xTEST' }
    const nft2 = { networkId: NetworkId['celo-alfajores'], contractAddress: '0xOTHER' }
    expect(isSameNftContract(nft1, nft2)).toBe(false)
  })
})
