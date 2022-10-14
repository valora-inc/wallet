import { map } from 'lodash'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useDispatch } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Touchable from 'src/components/Touchable'
import Directions from 'src/icons/Directions'
import Phone from 'src/icons/Phone'
import QRCodeBorderless from 'src/icons/QRCodeBorderless'
import Share from 'src/icons/Share'
import Times from 'src/icons/Times'
import VerifiedIcon from 'src/icons/VerifiedIcon'
import Website from 'src/icons/Website'
import { FoodForest } from 'src/map/types'
import { formatAge, initiateDirection, initiatePhoneCall, initiateShare } from 'src/map/utils'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { navigateToURI } from 'src/utils/linking'
import Logger from 'src/utils/Logger'
import { VendorWithLocation } from 'src/vendors/types'

type Props = {
  forest: FoodForest
  close: () => void
  action: () => void
}

const FoodForestDetails = ({ forest, close, action }: Props) => {
  const {
    area,
    start,
    title,
    street,
    building_number,
    city,
    siteURI,
    tags,
    phoneNumber,
    acceptsGuilder,
    providesGuilder,
  } = forest
  const { location } = forest as VendorWithLocation
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [age, setAge] = useState<string>('')

  useEffect(() => {
    const pid = setInterval(() => {
      const [years, months, days] = formatAge(start)
      setAge(t('foodForestDetails.age', { years: years, months: months, days: days }))
    }, 1000)

    return () => {
      clearTimeout(pid)
    }
  }, [start])

  const handleOpenMap = (): void => {
    try {
      initiateDirection({ title, coordinate: location, building_number, street, city })
    } catch (error) {
      Logger.warn('Directions', error)
      dispatch(showError(ErrorMessages.FAILED_OPEN_DIRECTION))
      return
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.sheetHeader}>
        <Touchable style={styles.sheetClose} onPress={close}>
          <Times />
        </Touchable>
      </View>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.cico, acceptsGuilder && providesGuilder ? styles.cicoPartner : null]}>
          {acceptsGuilder && (
            <View style={styles.verifiedRow}>
              <VerifiedIcon />
              <Text style={styles.verified}>{t('acceptsGuilder')}</Text>
            </View>
          )}
          {providesGuilder && (
            <View style={styles.verifiedRow}>
              <VerifiedIcon />
              <Text style={styles.verified}>{t('providesGuilder')}</Text>
            </View>
          )}
        </View>
        <View style={styles.furtherDetailsRow}>
          {area && (
            <View style={styles.metric}>
              <Text style={styles.metricType}>Area</Text>
              <Text style={styles.metricValue}>{t('foodForestDetails.area', { area })}</Text>
            </View>
          )}
          {start && (
            <View style={styles.metric}>
              <Text style={styles.metricType}>Age</Text>
              <Text style={styles.metricValue}>{age}</Text>
            </View>
          )}
        </View>
        <View style={styles.contactRow}>
          {phoneNumber && (
            <TouchableOpacity onPress={() => initiatePhoneCall(phoneNumber)}>
              <Phone />
            </TouchableOpacity>
          )}
          {location && ((location.latitude !== 0 && location.longitude !== 0) || street) && (
            <TouchableOpacity onPress={handleOpenMap}>
              <Directions />
            </TouchableOpacity>
          )}
          {siteURI && (
            <TouchableOpacity onPress={() => navigateToURI(siteURI)}>
              <Website />
            </TouchableOpacity>
          )}
          {true && (
            <TouchableOpacity
              onPress={() => initiateShare({ message: `${title} Age: ${age} Area: ${area} m²` })}
            >
              <Share />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tags}>
          {map(tags, (tag) => (
            <Button
              type={BtnTypes.ONBOARDING_SECONDARY}
              size={BtnSizes.TINY}
              text={`${tag}`}
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              onPress={() => {}}
            />
          ))}
        </View>
        {/* @todo Add Send button */}
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={action}>
            <QRCodeBorderless />
          </TouchableOpacity>
        </View>
        {/* @todo Add QR scanning button, this should utilize deep linking */}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    minHeight: '30%',
    paddingBottom: 50,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    backgroundColor: 'white',
  },
  innerContainer: {
    marginHorizontal: 20,
  },
  title: {
    ...fontStyles.h2,
    textAlign: 'center',
    paddingHorizontal: 36,
    marginBottom: 16,
  },
  cico: {},
  cicoPartner: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  verified: {
    ...fontStyles.regular,
    textAlign: 'center',
    color: colors.gray5,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    paddingBottom: 16,
  },
  sheetClose: {
    padding: 13,
    position: 'absolute',
    right: 0,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: variables.contentPadding,
    borderTopColor: colors.gray3,
    borderBottomColor: colors.gray3,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  verifiedRow: {
    display: 'flex',
    flexDirection: 'row',
  },
  furtherDetailsRow: {},
  metric: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: variables.contentPadding,
  },
  metricType: {
    ...fontStyles.regular500,
  },
  metricValue: {
    ...fontStyles.regular,
    color: colors.gray5,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    marginVertical: 20,
  },
  actionButtons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
})

export default FoodForestDetails
