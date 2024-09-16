// TODO remove once we update to use latest Torus/Web3Auth API https://linear.app/valora/issue/ACT-876
// just here to avoid side effects from importing Torus dependencies while testing (doing so unmocks fetch, even for unrelated tests)
export default jest.fn()
