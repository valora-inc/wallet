import { getTorusPrivateKey } from 'src/keylessBackup/web3auth'
import Web3Auth from '@web3auth/node-sdk'
import jwtDecode from 'jwt-decode'

describe('web3auth', () => {
  it('getTorusPrivateKey', async () => {
    // fixme wont work past 3:10PM May 31 without mocking web3auth
    const jwt =
      'eyJhbGciOiJSUzI1NiIsImtpZCI6IjYwODNkZDU5ODE2NzNmNjYxZmRlOWRhZTY0NmI2ZjAzODBhMDE0NWMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIxMDY3NzI0NTc2OTEwLTdrNHU5ODF2M2pwbGY1dTk3MGpkbnQ0bXBtOHE5MWU3LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMTA2NzcyNDU3NjkxMC1qN2FxcTg5Z2ZlNWMzMGxuZDl1OGprdDc4Mzdmc3BybS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjEwNzE1MDU3Nzc5MjM5MTcwNTQ2MSIsImVtYWlsIjoiY2hhcmxpZS52YWxvcmEyQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiQ2hhcmxpZSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQWNIVHRjV192Sks2bEpQLTFGenRxbjRLZ2tCTHZmbU5HVWNYMXdSZVNmVT1zOTYtYyIsImdpdmVuX25hbWUiOiJDaGFybGllIiwibG9jYWxlIjoiZW4iLCJpYXQiOjE2ODU1NTIzMDUsImV4cCI6MTY4NTU1NTkwNX0.ff2bbaDQiDxcSUG8XKBaxz22zPjk5MeXlQwy1MqCHZgD6kcnbOzF5OIQYdRw8-Ue2ANAyLyloEYUxgk6jIMGuVUqImfi0gxiAVqwyS-W_FGNbsRt9R_b3qpQf54FkHukAAu84CjZtxIb0XkrXKboQH7uKFG94q7_JsOjwbVIGWcAhHgt6mHu-W9xg6zPVw-J71tnUwEpaCvxVLxto6nBN9p7D9T6Nt-_zDe5mSUKUURLGfrk2giCxA89WNUUMsO-sAi6Sz4UOxRAmcq3ksO_pITCrd5AEozkqqyDXqi9WCmS079RSwzfoNE6sjPx3H6bx1hYxIs1QiF9st0UFYKpAg'
    const verifier = 'valora-google-verifier'
    const privateKey = await getTorusPrivateKey({ jwt, verifier })
    expect(privateKey).toBeTruthy()
  }, 60000)

  it('able to get torus private key from nodejs sdk', async () => {
    const testnetClientId =
      'BDmvH-WIJ0vFMRhJD9OnjAxQAb5Kq05h_oEO3EbWebzEUYxEegc4qC6SnBNmm3EGeIUrHyr1KHf621_0HSITWsU'
    const web3Auth = new Web3Auth({
      web3AuthNetwork: 'testnet',
      clientId: testnetClientId,
      chainConfig: {
        chainNamespace: 'eip155',
        chainId: '44787',
        rpcTarget: 'https://alfajores-forno.celo-testnet.org/',
      },
      enableLogging: true,
    })
    web3Auth.init()
    const jwt =
      'eyJhbGciOiJSUzI1NiIsImtpZCI6IjYwODNkZDU5ODE2NzNmNjYxZmRlOWRhZTY0NmI2ZjAzODBhMDE0NWMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIxMDY3NzI0NTc2OTEwLTdrNHU5ODF2M2pwbGY1dTk3MGpkbnQ0bXBtOHE5MWU3LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMTA2NzcyNDU3NjkxMC1qN2FxcTg5Z2ZlNWMzMGxuZDl1OGprdDc4Mzdmc3BybS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjEwNzE1MDU3Nzc5MjM5MTcwNTQ2MSIsImVtYWlsIjoiY2hhcmxpZS52YWxvcmEyQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiQ2hhcmxpZSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQWNIVHRjV192Sks2bEpQLTFGenRxbjRLZ2tCTHZmbU5HVWNYMXdSZVNmVT1zOTYtYyIsImdpdmVuX25hbWUiOiJDaGFybGllIiwibG9jYWxlIjoiZW4iLCJpYXQiOjE2ODU1NjcxMzEsImV4cCI6MTY4NTU3MDczMX0.LjPM0Y8Sd7e3bCzMF5IIG0y2H5W0o3w_G3BWW9myvjrLxD5VFeE8xRvZBQwy7LNeQviU9r5saZOa8Iv5wgLxLQmO_0QXZ-h5LFemomM9s61W6-hXKV8w8Dtj8X2gf-0EbLF105IX3OIihnxVAI0LRlCM-LSQnI2GXMu6MrzzxR5z4cDOtQjgTahwwVkmXEwt9CVtCvl2BzUVGi2hZwhdAKM1j4O6TktjZKp0LdBlzTL1LafccpteqKuzP2Qly7XRoNQE_4OOBNOpA1yGRoQhg3EEQLn8TtDEsBkHW1DP-GZ5yKYGtq8x_DJ04yecz8nVWieM0MemEGJgtLGNJeqSkA'
    const { email: verifierId } = jwtDecode<{ email: string }>(jwt)
    const provider = await web3Auth.connect({
      verifier: 'valora-google-verifier',
      verifierId,
      idToken: jwt,
    })
    if (!provider) {
      throw new Error('provider is undefined')
    }
    const privateKey = await provider.request({ method: 'eth_private_key' })
    expect(privateKey).toBeTruthy()
  })
})
