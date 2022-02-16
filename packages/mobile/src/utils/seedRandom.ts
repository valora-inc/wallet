import deviceInfoModule from 'react-native-device-info'
import seedrandom from 'seedrandom'

export function getRandomByUUID() {
  const rng = seedrandom(deviceInfoModule.getUniqueId())
  return rng()
}
