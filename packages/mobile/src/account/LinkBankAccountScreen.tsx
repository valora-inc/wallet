import * as React from 'react'
import { StyleSheet, ScrollView, Text, View } from 'react-native'
import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import { SafeAreaView } from 'react-native-safe-area-context'
import { headerWithCloseButton } from 'src/navigator/Headers'
import fontStyles from '@celo/react-components/styles/fonts'
import colors from '@celo/react-components/styles/colors'
import VerfiedCheckmark from 'src/icons/VerfiedCheckmark'

enum KycStatus {
  Created = 'created',
  Completed = 'completed',
  Failed = 'failed',
  Pending = 'pending',
  Expired = 'expired',
}

interface Props {
  kycStatus: KycStatus | undefined
}

function LinkBankAccountScreen({ kycStatus }: Props) {
  return (
    <SafeAreaView style={styles.body}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <StepOne kycStatus={KycStatus.Completed} />
        <StepTwo disabled={!kycStatus || kycStatus !== KycStatus.Completed} />
      </ScrollView>
    </SafeAreaView>
  )
}

function StepOne({ kycStatus }: Props) {
  switch (kycStatus) {
    case KycStatus.Created:
      return null
    case KycStatus.Completed:
      return (
        <View style={styles.stepOne}>
          <View style={styles.iconContainer}>
            <VerfiedCheckmark />
          </View>
          <Text style={styles.action}>Verification Complete</Text>
          <Text style={styles.description}>
            We successfully verified your identity. We'll let you know when you can finish linking
            your bank account.
          </Text>
        </View>
      )
    case KycStatus.Failed:
      return null
    case KycStatus.Pending:
      return null
    case KycStatus.Expired:
      return null
    default:
      return (
        <View style={styles.stepOne}>
          <Text style={styles.label}>Step 1</Text>
          <Text style={styles.action}>Verify your Identity</Text>
          <Text style={styles.description}>
            Adding crypto with a bank account is easy. This step will take about 5 minutes.
          </Text>
          <Button
            text="Begin"
            onPress={() => {
              /* TODO: Start Persona Flow */
            }}
            type={BtnTypes.SECONDARY}
            size={BtnSizes.MEDIUM}
            style={styles.button}
          />
        </View>
      )
  }
}

function StepTwo({ disabled }: { disabled: boolean }) {
  return (
    <View style={styles.stepTwo}>
      <Text style={{ ...styles.label, ...(disabled && styles.greyedOut) }}>Step 2</Text>
      <Text style={{ ...styles.action, ...(disabled && styles.greyedOut) }}>
        Link a bank account
      </Text>
      <Text style={{ ...styles.description, ...(disabled && styles.greyedOut) }}>
        You're almost done! You can connect your bank acount to Valora now via Plaid.
      </Text>
      <Button
        text="Coming Soon!"
        onPress={() => {
          /* TODO: Start Plaid Flow */
        }}
        type={BtnTypes.SECONDARY}
        size={BtnSizes.MEDIUM}
        style={styles.button}
        disabled={disabled}
      />
    </View>
  )
}

LinkBankAccountScreen.navigationOptions = {
  headerWithCloseButton,
  headerTitle: 'Link Bank Account',
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    marginHorizontal: 24,
  },
  contentContainer: {
    alignItems: 'center',
  },
  stepOne: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray2,
    alignItems: 'center',
    paddingVertical: 48,
  },
  stepTwo: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  label: {
    ...fontStyles.notificationHeadline,
    textAlign: 'center',
  },
  action: {
    ...fontStyles.h2,
    textAlign: 'center',
    marginTop: 12,
  },
  description: {
    ...fontStyles.regular,
    textAlign: 'center',
    marginTop: 12,
  },
  button: {
    marginTop: 48,
  },
  greyedOut: {
    color: colors.gray4,
  },
  iconContainer: {
    marginBottom: 12,
  },
})

export default LinkBankAccountScreen
