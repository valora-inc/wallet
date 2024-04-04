const getInitialLink = jest.fn()
const buildShortLink = jest.fn()
const buildLink = jest.fn()

export default function links() {
  return {
    getInitialLink,
    buildShortLink,
    buildLink,
  }
}
