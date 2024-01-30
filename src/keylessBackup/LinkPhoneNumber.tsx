import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import TextButton from 'src/components/TextButton'

import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export enum ChosenRestoreType {
  Cloud = 'Cloud',
  Mnemonic = 'Mnemonic',
}

type Props = NativeStackScreenProps<StackParamList, Screens.LinkPhoneNumber>

export default function LinkPhoneNumber({ navigation }: Props) {
  const { t } = useTranslation()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <BackButton />,
      headerStyle: {
        backgroundColor: 'transparent',
      },
    })
  }, [navigation])

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View>
        <View style={styles.viewContainer}>
          <View style={styles.screenTextContainer}>
            <Text style={styles.screenTitle}>{t('linkPhoneNumber.title')}</Text>
            <Text style={styles.screenDescription}>{t('linkPhoneNumber.description')}</Text>
          </View>
        </View>
        <View
          style={{
            padding: Spacing.Thick24,
            alignItems: 'center',
          }}
        >
          <Button
            text={t('linkPhoneNumber.startButtonLabel')}
            onPress={() => navigate(Screens.VerificationStartScreen, { hideOnboardingStep: true })}
            style={{ marginBottom: Spacing.Thick24, width: '100%' }}
            type={BtnTypes.PRIMARY}
            size={BtnSizes.FULL}
            testID="LinkPhoneNumberButton"
          />
          <TextButton
            testID="LinkePhoneNumberLater"
            style={{ color: colors.primary }}
            onPress={() => navigateHome()}
          >
            {t('linkPhoneNumber.later')}
          </TextButton>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    alignItems: 'center',
    backgroundColor: colors.gray1,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  screenDescription: {
    ...typeScale.bodyMedium,
    textAlign: 'center',
  },
  screenTitle: {
    ...typeScale.titleSmall,
    marginTop: Spacing.Thick24,
    textAlign: 'center',
  },
  screenTextContainer: {
    gap: Spacing.Regular16,
  },
  viewContainer: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.Thick24,
    paddingHorizontal: Spacing.Thick24,
  },
})
