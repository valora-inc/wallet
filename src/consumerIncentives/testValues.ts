import 'react-native'
import { SuperchargePendingRewardV2 } from 'src/consumerIncentives/types'
import { mockAccount, mockCeurAddress, mockCusdAddress } from 'test/values'

export const ONE_CUSD_REWARD_RESPONSE_V2: SuperchargePendingRewardV2 = {
  transaction: {
    from: mockAccount,
    chainId: 42220,
    to: '0xsuperchargeContract',
    data: '0x0000000someEncodedData',
    gas: 1234,
  },
  details: {
    amount: (1e18).toString(),
    tokenAddress: mockCusdAddress,
  },
}

export const ONE_CEUR_REWARD_RESPONSE_V2: SuperchargePendingRewardV2 = {
  transaction: {
    from: mockAccount,
    chainId: 42220,
    to: '0xsuperchargeContract',
    data: '0x0000000someEncodedData',
    gas: 1234,
  },
  details: {
    amount: (1e18).toString(),
    tokenAddress: mockCeurAddress,
  },
}
