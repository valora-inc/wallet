module.exports = {
  ...jest.requireActual('src/web3/utils'),
  getSupportedNetworkIds: jest.fn().mockReturnValue(['celo-alfajores', 'ethereum-sepolia']),
}
