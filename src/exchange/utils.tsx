import { ContractKit } from '@celo/contractkit'
import { newExchangeBrl } from '@celo/contractkit/lib/generated/ExchangeBRL'
import { ExchangeWrapper } from '@celo/contractkit/lib/wrappers/Exchange'

const CREAL_MAINNET = '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787'
const CREAL_ALFAJORES = '0xC5375c73a627105eb4DF00867717F6e301966C32'

export async function getCRealContract(contractKit: ContractKit): Promise<ExchangeWrapper> {
  const instance = newExchangeBrl(contractKit.connection.web3, CREAL_ALFAJORES)
  return new ExchangeWrapper(contractKit, instance as any)
}
