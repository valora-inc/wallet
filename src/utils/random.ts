import crypto from 'crypto'
import seedrandom from 'seedrandom'

// https://stackoverflow.com/a/2450976/112731
// Fisher–Yates shuffle algorithm to shuffle an array
export function shuffle(array: any[], seed: string) {
  let currentIndex = array.length,
    temporaryValue,
    randomIndex

  const randomizer = seedrandom(seed)
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(randomizer() * currentIndex)
    currentIndex -= 1

    // And swap it with the current element.
    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }

  return array
}

export function calculateSha256Hash(input: string) {
  const hash = crypto.createHash('sha256')
  hash.update(input)
  return hash.digest('hex')
}

export function deterministicShuffle<T>(
  objectArray: T[],
  identifyingProperty: keyof T,
  pepper: string
): T[] {
  const map = new Map<string, T>()
  objectArray.forEach((element) => {
    const hash = calculateSha256Hash(`${element[identifyingProperty]}${pepper}`)
    map.set(hash, element)
  })

  // sort the tokens array based on hash of the identifying property and user's address
  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([_, token]) => token)
}
