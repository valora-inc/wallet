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
    let resultObj = {} as any
    // Check that all random results are evenly distributed - 1% difference allowed
    let lowerInclusive = 1566
    let upperExclusive = 1766
    for (let i = 0; i < 10000; i++) {
      let result = shuffleArray(array).join('-')
      if (resultObj[result]) {
        resultObj[result]++
      } else {
        resultObj[result] = 1
      }
    }
    for (let key in resultObj) {
      expect(resultObj[key]).toBeGreaterThanOrEqual(lowerInclusive)
      expect(resultObj[key]).toBeLessThan(upperExclusive)
    }
  })
})
