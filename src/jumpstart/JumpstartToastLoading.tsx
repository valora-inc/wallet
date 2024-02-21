import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useDispatch } from 'react-redux'
import { jumpstartLoadingDismissed } from 'src/home/actions'
import { showJumstartLoading } from 'src/home/selectors'
import GreenLoadingSpinner from 'src/icons/GreenLoadingSpinner'
import BottomToast from 'src/jumpstart/BottomToast'
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
        <View style={styles.header}>
          <GreenLoadingSpinner height={Spacing.Thick24} />
          <Text style={styles.title}>{t('jumpstart.loading.title')}</Text>
        </View>
        <Text style={styles.description}>{t('jumpstart.loading.description')}</Text>
      </View>
    </BottomToast>
  )
}

const styles = StyleSheet.create({
  container: {
    margin: Spacing.Regular16,
    marginBottom: 0,
    paddingTop: Spacing.Regular16,
    paddingHorizontal: Spacing.Regular16,
    paddingBottom: Spacing.Small12,
    borderRadius: Spacing.Regular16,
    backgroundColor: Colors.gray1,
  },
  header: {
    flexDirection: 'row',
    gap: Spacing.Smallest8,
    alignItems: 'center',
  },
  title: {
    ...typeScale.labelSemiBoldSmall,
    color: Colors.black,
  },
  description: {
    ...typeScale.bodyXSmall,
    color: Colors.black,
    marginTop: Spacing.Tiny4,
    marginLeft: Spacing.Large32,
  },
})
