import { KycStatus as PersonaKycStatus } from 'src/account/reducer'
import * as React from 'react'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CICOFlow } from 'src/fiatExchanges/utils'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'

export interface Props {
  personaKycStatus: PersonaKycStatus
  flow: CICOFlow
  quote: FiatConnectQuote
}

function KycLanding(_props: Props) {
  return <SafeAreaView style={styles.container} />
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
  },
})

export default KycLanding
