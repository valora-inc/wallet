import { uniqueId } from 'lodash'
import { shuffle } from './random'

describe('shuffle', () => {
  it('should run through all permutations', () => {
    const varients = new Set()
    while (varients.size < 24) {
      const shuffled = shuffle(['add', 'dapp', 'profile', 'learn'], uniqueId())
      varients.add(shuffled.join(''))
    }
    expect(varients.size).toBe(24)
  })
  it('should shuffle the same for the same seed', () => {
    const seed = uniqueId()
    const first = shuffle(['add', 'dapp', 'profile', 'learn'], seed)
    const second = shuffle(['add', 'dapp', 'profile', 'learn'], seed)
    expect(first).toEqual(second)
  })
})
