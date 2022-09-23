import * as React from 'react'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Persona from 'src/account/Persona'
import { KycStatus as PersonaKycStatus } from 'src/account/reducer'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { postKyc } from 'src/in-house-liquidity'

export interface Props {
  personaKycStatus: PersonaKycStatus
  flow: CICOFlow
  quote: FiatConnectQuote
}

function KycLanding(props: Props) {
  const sendKYCSchema = async () => {
    // getKycSchema
    const schema = props.quote.getKycSchema()
    const provider = props.quote.getProvider()
    if (!schema) {
      // should not happen if the flow is properly user-reached
      throw new Error('expected KYC schema to send is nullish')
    }
    await postKyc({
      providerInfo: provider,
      kycSchema: schema,
    })
  }
  return (
    <SafeAreaView style={styles.container}>
      <Persona kycStatus={props.personaKycStatus} onSuccess={sendKYCSchema} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
  },
})

export default KycLanding
