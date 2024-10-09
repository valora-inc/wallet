import { fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import networkConfig from 'src/web3/networkConfig'

export const baseQuery = fetchBaseQuery({
  baseUrl: networkConfig.blockchainApiUrl,
  headers: {
    Accept: 'application/json',
  },
})
