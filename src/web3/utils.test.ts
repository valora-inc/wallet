import { applyChainIdWorkaround } from 'src/web3/utils'

describe('applyChainIdWorkaround', () => {
  it('should work with tx.chainId', () => {
    const preTx = {
      chainId: 42220,
    }
    let tx = applyChainIdWorkaround(preTx, 0)
    expect(tx.chainId).toEqual('0xa4ec')
  })

  it('applyChainIdWorkaround should work with chainId param', async () => {
    const preTx = {}
    let tx = applyChainIdWorkaround(preTx, 42220)
    expect(tx.chainId).toEqual('0xa4ec')
  })
})
