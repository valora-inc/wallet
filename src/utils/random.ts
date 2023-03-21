import seedrandom from 'seedrandom'

// https://stackoverflow.com/a/2450976/112731
// Fisher–Yates shuffle algorithm to shuffle an array
export function shuffle(array: any[], seed: string) {
  let currentIndex = array.length,
    temporaryValue,
    randomIndex

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(seedrandom(seed)() * currentIndex)
    currentIndex -= 1

    // And swap it with the current element.
    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }

  return array
}
