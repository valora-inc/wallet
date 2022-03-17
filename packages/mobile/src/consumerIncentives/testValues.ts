import 'react-native'
import { SuperchargePendingReward } from 'src/consumerIncentives/types'
import { mockCusdAddress } from 'test/values'

export const ONE_CUSD_REWARD_RESPONSE: SuperchargePendingReward[] = [
  {
    contractAddress: '0xdistributorContract',
    tokenAddress: mockCusdAddress,
    amount: (1e18).toString(16),
    index: 0,
    proof: [],
    createdAt: 1645591363099,
  },
]
