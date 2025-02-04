const getInitialLink = jest.fn()
const buildShortLink = jest.fn()
const buildLink = jest.fn()
const onLink = jest.fn()

export default function links() {
  return {
    getInitialLink,
    buildShortLink,
    buildLink,
    onLink,
  }
}
