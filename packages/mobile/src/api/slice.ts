import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { SuperchargePendingReward } from 'src/consumerIncentives/types'
import config from 'src/geth/networkConfig'
import useSelector from 'src/redux/useSelector'
import { walletAddressSelector } from 'src/web3/selectors'

export const cloudFunctionsApi = createApi({
  reducerPath: 'cloudFunctionsApi',
  baseQuery: fetchBaseQuery({ baseUrl: config.cloudFunctionsBaseUrl }),
  tagTypes: ['Supercharge'],
  endpoints: (builder) => ({
    fetchSuperchargeRewards: builder.query<SuperchargePendingReward[], string>({
      query: (address) => `fetchAvailableSuperchargeRewards?address=${address}`,
      transformResponse: (response: { availableRewards: SuperchargePendingReward[] }) =>
        response?.availableRewards,
      providesTags: ['Supercharge'],
    }),
  }),
})

const { useFetchSuperchargeRewardsQuery } = cloudFunctionsApi

export function useFetchSuperchargeRewards() {
  const address = useSelector(walletAddressSelector)
  const { data, isLoading, isError } = useFetchSuperchargeRewardsQuery(address ?? '', {
    refetchOnMountOrArgChange: true,
  })
  return { superchargeRewards: data ?? [], isLoading, isError }
}
