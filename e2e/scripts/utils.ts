import { Address, createPublicClient, erc20Abi, http } from 'viem'
import { celoAlfajores } from 'viem/chains'
import { REFILL_TOKENS } from './consts'

export async function checkBalance(
  address: Address,
  minBalance = 10,
  tokenSymbols: string[] = REFILL_TOKENS
) {
  const balance = (await getCeloTokensBalance(address)) ?? {}
  for (const [tokenSymbol, tokenBalance] of Object.entries(balance)) {
    if (tokenSymbols.includes(tokenSymbol) && tokenBalance < minBalance) {
      throw new Error(
        `${balance} balance of ${address} is below ${minBalance}. Please refill from the faucet https://celo.org/developers/faucet or run ./fund-e2e-accounts.ts.`
      )
    }
  }
}

export async function getCeloTokensBalance(walletAddress: Address) {
  try {
    const supportedTokenAddresses: Address[] = [
      '0x874069fa1eb16d44d622f2e0ca25eea172369bc1',
      '0x10c892a6ec43a53e45d0b916b4b7d383b1b78c0f',
      '0xf194afdf50b03e69bd7d057c1aa9e10c9954e4c9',
      '0xe4d517785d091d3c54818832db6094bcc2744545',
    ] // cUSD, cEUR, CELO, cREAL
    const supportedTokenSymbols: string[] = ['cUSD', 'cEUR', 'CELO', 'cREAL']

    const celoClient = createPublicClient({
      chain: celoAlfajores,
      transport: http(),
    })

    const results = await celoClient.multicall({
      contracts: supportedTokenAddresses.map((tokenAddress) => ({
        address: tokenAddress as Address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [walletAddress],
      })),
      allowFailure: false,
    })

    const balances: Record<string, number> = {}
    results.forEach((result, index) => {
      balances[supportedTokenSymbols[index]] = Number(BigInt(result) / BigInt(10 ** 18))
    })
    return balances
  } catch (err) {
    console.log(err)
  }
}
