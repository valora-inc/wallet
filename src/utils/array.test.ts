import { shuffleArray } from 'src/utils/array'

describe('shuffleArray', () => {
  it('should return an array with the same length', () => {
    const array = [1, 2, 3]
    const shuffledArray = shuffleArray(array)
    expect(shuffledArray.length).toEqual(array.length)
  })

  it('should return an array with the same elements', () => {
    const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const shuffledArray = shuffleArray(array)
    expect(shuffledArray).toEqual(expect.arrayContaining(array))
  })

  it('results should be evenly distributed across many calls', () => {
    const array = [1, 2, 3]
    const resultObj = {} as any
    // Check that all random results are evenly distributed - 1% difference allowed
    const lowerInclusive = 1566
    const upperExclusive = 1766
    for (let i = 0; i < 10000; i++) {
      const result = shuffleArray(array).join('-')
      if (resultObj[result]) {
        resultObj[result]++
      } else {
        resultObj[result] = 1
      }
    }
    Object.entries(resultObj).forEach((entry) => {
      expect(entry[1]).toBeGreaterThanOrEqual(lowerInclusive)
      expect(entry[1]).toBeLessThan(upperExclusive)
    })
  })
})
