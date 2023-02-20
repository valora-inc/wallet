import BigNumber from 'bignumber.js'
import 'react-native'
import { SuperchargePendingReward } from 'src/consumerIncentives/types'
import { mockAccount, mockCeurAddress, mockCusdAddress } from 'test/values'

export const ONE_CUSD_REWARD_RESPONSE: SuperchargePendingReward = {
  transaction: {
    from: mockAccount,
    chainId: `0x${new BigNumber(42220).toString(16)}`,
    to: '0xsuperchargeContract',
    data: '0x0000000someEncodedData',
  },
  details: {
    amount: (1e18).toString(16),
    tokenAddress: mockCusdAddress,
  },
}

export const ONE_CEUR_REWARD_RESPONSE: SuperchargePendingReward = {
  transaction: {
    from: mockAccount,
    chainId: `0x${new BigNumber(42220).toString(16)}`,
    to: '0xsuperchargeContract',
    data: '0x0000000someEncodedData',
  },
  details: {
    amount: (1e18).toString(16),
    tokenAddress: mockCeurAddress,
  },
}
