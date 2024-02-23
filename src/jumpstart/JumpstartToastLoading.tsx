import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useDispatch } from 'react-redux'
import GreenLoadingSpinner from 'src/icons/GreenLoadingSpinner'
import BottomToast from 'src/jumpstart/BottomToast'
import { showJumstartLoading } from 'src/jumpstart/selectors'
import { jumpstartLoadingDismissed } from 'src/jumpstart/slice'
import useSelector from 'src/redux/useSelector'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export default function JumpstartToastLoading() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const showToast = useSelector(showJumstartLoading)

  const handleToastDismiss = () => {
    dispatch(jumpstartLoadingDismissed())
  }

  return (
    <BottomToast showToast={showToast} onDismiss={handleToastDismiss}>
      <View style={styles.container}>
        <GreenLoadingSpinner height={ICON_HEIGHT} />
        <View style={styles.content}>
          <Text style={styles.title}>{t('jumpstart.loading.title')}</Text>
          <Text style={styles.description}>{t('jumpstart.loading.description')}</Text>
        </View>
      </View>
    </BottomToast>
  )
}

const ICON_HEIGHT = Spacing.Thick24

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.Smallest8,
    margin: Spacing.Regular16,
    marginBottom: 0,
    padding: Spacing.Regular16,
    borderRadius: Spacing.Regular16,
    backgroundColor: Colors.gray1,
  },
  content: {
    flex: 1,
    gap: Spacing.Smallest8,
  },
  title: {
    ...typeScale.labelSemiBoldSmall,
    color: Colors.black,
    lineHeight: ICON_HEIGHT,
  },
  description: {
    ...typeScale.bodyXSmall,
    color: Colors.black,
  },
})
