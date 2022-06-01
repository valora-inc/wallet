import Tokens from '@ubeswap/default-token-list/ubeswap.token-list.json'
import { keyBy } from 'lodash'
import { BaseTokens } from 'src/tokens/reducer'
const { tokens } = Tokens

const AlfajoresTokens: BaseTokens = keyBy(tokens, 'address')

export default AlfajoresTokens
