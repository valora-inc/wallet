import React from 'react'
import { useSelector } from 'react-redux'
import { E2E_TEST_STATSIG_ID, STATSIG_API_KEY, STATSIG_ENV, isE2EEnv } from 'src/config'
import { statsigUserSelector } from 'src/statsig/selectors'
import { StatsigProvider } from 'statsig-react-native'

interface Props {
  loading?: React.ReactNode
  children: React.ReactNode
}

export default function Provider({ children }: Props) {
  const user = useSelector(statsigUserSelector)
  const overrideStableID = isE2EEnv ? E2E_TEST_STATSIG_ID : 'stableId'

  return (
    <StatsigProvider
      sdkKey={STATSIG_API_KEY}
      user={user}
      options={{ overrideStableID, environment: STATSIG_ENV, localMode: isE2EEnv }}
      waitForInitialization={false}
      mountKey="statsig"
    >
      {children}
    </StatsigProvider>
  )
}
