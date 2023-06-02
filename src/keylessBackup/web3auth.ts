import Web3Auth from '@web3auth/node-sdk'
import { CHAIN_ID, DEFAULT_FORNO_URL, WEB3AUTH_CONFIG } from 'src/config'
import jwtDecode from 'jwt-decode'
import Logger from 'src/utils/Logger'

const TAG = 'keylessBackup/web3auth'

// TODO consider getting network from statsig dynamic config (need to make sure the keys are the same for different networks first though)

let web3auth: Web3Auth | undefined = undefined

/**
 * Get a Torus private key from a JWT.
 *
 * Largely copies web3auth's "customauth" library for the browser, cherry-picking stuff specific to our use case and
 *  working around browser-specific stuff. An alternative would be to use customauth-react-native-sdk, but this wraps
 *  native SDK's and did not appear to work.
 *
 * @param verifier - string name of web3auth custom verifier
 * @param jwt - idToken from Sign in with Google flow works. must have issuer expected by the verifier
 * @param network - web3auth network to use
 */
export async function getTorusPrivateKey({
  verifier,
  jwt,
}: {
  verifier: 'valora-google-verifier' | 'android-google-verifier'
  jwt: string
}) {
  try {
    if (!web3auth) {
      web3auth = new Web3Auth({
        web3AuthNetwork: WEB3AUTH_CONFIG.network, // TODO get from statsig dynamic config instead? need to see if different networks return different keys first
        clientId: WEB3AUTH_CONFIG.clientId,
        chainConfig: {
          chainNamespace: 'eip155',
          chainId: CHAIN_ID,
          rpcTarget: DEFAULT_FORNO_URL,
        },
      })
      web3auth.init()
    }
    const { email: verifierId } = jwtDecode<{ email: string }>(jwt)
    const provider = await web3auth.connect({
      verifier,
      verifierId,
      idToken: jwt,
    })
    if (!provider) {
      throw new Error('Unable to connect to web3auth provider')
    }
    return await provider.request({ method: 'eth_private_key' })
  } catch (error) {
    Logger.error(TAG, 'Error getting private key from web3auth', error)
  }
}
