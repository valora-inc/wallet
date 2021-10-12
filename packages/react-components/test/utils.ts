beforeAll(() => {
  // @ts-ignore This avoids an error, see: https://github.com/software-mansion/react-native-reanimated/issues/1380
  global.__reanimatedWorkletInit = jest.fn()
})

// Implementation of deprecated flushMicrotasksQueue function from @testing-library/react-native
// https://callstack.github.io/react-native-testing-library/docs/migration-v2/#deprecated-flushmicrotasksqueue
export function flushMicrotasksQueue() {
  return new Promise((resolve) => setImmediate(resolve))
}
