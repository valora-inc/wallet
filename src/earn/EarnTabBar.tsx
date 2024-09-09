import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import GradientBlock from 'src/components/GradientBlock'
import Touchable from 'src/components/Touchable'
import { EarnTabType } from 'src/earn/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { vibrateInformative } from 'src/styles/hapticFeedback'
import { Spacing } from 'src/styles/styles'

export default function EarnTabBar({
  activeTab,
  onChange,
}: {
  activeTab: EarnTabType
  onChange: (selectedTab: EarnTabType) => void
}) {
  const { t } = useTranslation()

  const items = [t('earnFlow.poolFilters.allPools'), t('earnFlow.poolFilters.myPools')]

  const handleSelectOption = (index: EarnTabType) => () => {
    onChange(index)
    vibrateInformative()
  }

  return (
    <View style={styles.container} testID="Earn/TabBar">
      {items.map((value, index) => (
        <Touchable
          testID="Earn/TabBarItem"
          key={value}
          onPress={handleSelectOption(index)}
          style={styles.touchable}
        >
          <>
            <Text
              style={[index === activeTab ? styles.itemSelected : styles.item]}
              numberOfLines={1}
            >
              {value}
            </Text>

            {index === activeTab && <GradientBlock style={styles.activeTabUnderline} />}
          </>
        </Touchable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.Regular16,
  },
  activeTabUnderline: {
    height: 2,
    marginTop: 4,
  },
  touchable: {
    flexShrink: 1,
    paddingBottom: Spacing.Tiny4,
  },
  item: {
    ...typeScale.bodyMedium,
    color: Colors.gray4,
  },
  itemSelected: {
    ...typeScale.labelMedium,
    color: Colors.black,
  },
})
