// Implementation of deprecated flushMicrotasksQueue function from @testing-library/react-native
// https://callstack.github.io/react-native-testing-library/docs/migration-v2/#deprecated-flushmicrotasksqueue
export function flushMicrotasksQueue() {
  return new Promise((resolve) => setImmediate(resolve))
}
