import { normalize } from 'viem/ens'

const test1 = '0x0000000000000000000000000000000000007E57'
const test2 = '0x0000000000000000000000000000000000007E55'

describe('qwe', () => {
  it('qwe', () => {
    const a = normalize(test1)
    console.log({ a })
  })
})
