import { uniqueId } from 'lodash'
import { deterministicShuffle, shuffle } from './random'

describe('shuffle', () => {
  it('should run through all permutations', () => {
    const variants = new Set()
    while (variants.size < 24) {
      const shuffled = shuffle(['add', 'dapp', 'profile', 'learn'], uniqueId())
      variants.add(shuffled.join(''))
    }
    expect(variants.size).toBe(24)
  })
  it('should shuffle the same for the same seed', () => {
    const seed = uniqueId()
    const first = shuffle(['add', 'dapp', 'profile', 'learn'], seed)
    const second = shuffle(['add', 'dapp', 'profile', 'learn'], seed)
    expect(first).toEqual(second)
  })
})

describe('deterministicShuffle', () => {
  const pepper = 'somePepper'
  const sampleArray = [
    { id: 1, name: 'Alpha' },
    { id: 2, name: 'Bravo' },
    { id: 3, name: 'Charlie' },
    { id: 4, name: 'Delta' },
  ]

  it('should shuffle the array deterministically based on the pepper', () => {
    const firstRun = deterministicShuffle(sampleArray, 'id', pepper)
    const secondRun = deterministicShuffle(sampleArray, 'id', pepper)

    expect(firstRun).not.toEqual(sampleArray)
    expect(firstRun).toEqual(secondRun)
  })

  it('should produce a different order when the pepper or identifying property changes', () => {
    const result = deterministicShuffle(sampleArray, 'id', pepper)
    const resultWithDifferentPepper = deterministicShuffle(sampleArray, 'id', 'someOtherPepper')
    const resultWithDifferentId = deterministicShuffle(sampleArray, 'name', pepper)

    expect(result).not.toEqual(resultWithDifferentPepper)
    expect(result).not.toEqual(resultWithDifferentId)
    expect(resultWithDifferentPepper).not.toEqual(resultWithDifferentId)
  })

  it('should handle an empty array without throwing errors', () => {
    const result = deterministicShuffle([], 'id', pepper)

    expect(result).toEqual([])
  })
})
