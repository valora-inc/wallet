import Tokens from '@ubeswap/default-token-list/ubeswap.token-list.json'
import { keyBy, sortBy } from 'lodash'
import { BaseTokens } from 'src/tokens/reducer'
const { tokens } = Tokens

const AlfajoresTokens: BaseTokens = keyBy(tokens, 'address')

AlfajoresTokens['0xfakekguilder'] = {
  address: '0x00400FcbF0816bebB94654259de7273f4A05c762',
  name: 'Kolektivo Guilder',
  symbol: 'kG',
  decimals: 18,
  logoURI: 'https://pbs.twimg.com/profile_images/1527245286250250240/c1RTFDkW_400x400.jpg',
}

export default AlfajoresTokens
