import React, { useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'
import {
  PERMISSIONS,
  RESULTS as PERMISSION_RESULTS,
  PermissionStatus,
  check as checkPermission,
  request as requestPermission,
} from 'react-native-permissions'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { phoneNumberVerifiedSelector } from 'src/app/selectors'
import Dialog from 'src/components/Dialog'
import SelectRecipientButton from 'src/components/SelectRecipientButton'
import QRCode from 'src/icons/QRCode'
import Social from 'src/icons/Social'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'
import Logger from 'src/utils/Logger'
import { navigateToPhoneSettings } from 'src/utils/linking'

const CONTACTS_PERMISSION =
  Platform.OS === 'ios' ? PERMISSIONS.IOS.CONTACTS : PERMISSIONS.ANDROID.READ_CONTACTS

type Props = {
  onContactsPermissionGranted: () => void
}

export default function SelectRecipientButtons({ onContactsPermissionGranted }: Props) {
  const { t } = useTranslation()
  const phoneNumberVerified = useSelector(phoneNumberVerifiedSelector)
  const [contactsPermissionStatus, setContactsPermissionStatus] = useState<
    PermissionStatus | undefined
  >(undefined)
  const [showConnectPhoneNumberModal, setShowConnectPhoneNumberModal] = useState(false)
  const [showEnableContactsModal, setShowEnableContactsModal] = useState(false)
  const [navigateToPhoneVerification, setNavigateToPhoneVerification] = useState(false)

  useAsync(() => checkPermission(CONTACTS_PERMISSION), [], {
    onSuccess: (permissionStatus) => {
      setContactsPermissionStatus(permissionStatus)
    },
  })

  const onPressContacts = async () => {
    // always fetch permission here as it can change outside the app through
    // native settings, but this screen still remains in view (happens for
    // Android for when permission changes from denied -> granted, everything else causes an app reload)
    const currentPermission = await checkPermission(CONTACTS_PERMISSION)
    setContactsPermissionStatus(currentPermission)

    ValoraAnalytics.track(SendEvents.send_select_recipient_contacts, {
      contactsPermissionStatus: currentPermission,
      phoneNumberVerified,
    })

    if (!phoneNumberVerified) {
      setShowConnectPhoneNumberModal(true)
      return
    }

    // Based on https://github.com/zoontek/react-native-permissions#understanding-permission-flow
    switch (currentPermission) {
      case PERMISSION_RESULTS.BLOCKED: // permission not requestable
        setShowEnableContactsModal(true)
        break
      case PERMISSION_RESULTS.GRANTED: // permission already granted
        onContactsPermissionGranted()
        break
      case PERMISSION_RESULTS.DENIED: // permission is requestable
        ValoraAnalytics.track(SendEvents.request_contacts_permission_started)
        const newPermission = await requestPermission(CONTACTS_PERMISSION, {
          // rationale for Android, shows up the 2nd time a permission is requested.
          title: t('accessContacts.disclosure.title'),
          message: t('accessContacts.disclosure.body'),
          buttonPositive: t('continue'),
          buttonNegative: t('notNow') ?? undefined,
        })
        setContactsPermissionStatus(newPermission)
        ValoraAnalytics.track(SendEvents.request_contacts_permission_completed, {
          permissionStatus: newPermission,
        })
        if (newPermission === PERMISSION_RESULTS.GRANTED) {
          // permission granted
          onContactsPermissionGranted()
        } else if (newPermission === PERMISSION_RESULTS.BLOCKED && Platform.OS === 'android') {
          // we only know if permissions are requestable or not on Android after
          // doing a request. So if we get back blocked from the request, its
          // possible a native modal was never shown, so show our custom modal.
          setShowEnableContactsModal(true)
        }
        break
      case PERMISSION_RESULTS.UNAVAILABLE:
      case PERMISSION_RESULTS.LIMITED:
      default:
        // this should never happen
        const unexpectedPermission: 'unavailable' | 'limited' = currentPermission
        Logger.error(
          'SelectRecipientButtons/onPressContacts',
          `Unexpected contacts permission status: ${unexpectedPermission}`
        )
        break
    }
  }

  const onPressQR = () => {
    ValoraAnalytics.track(SendEvents.send_select_recipient_scan_qr)
    navigate(Screens.QRNavigator, { screen: Screens.QRScanner })
  }

  const onPressConnectPhoneNumber = () => {
    ValoraAnalytics.track(SendEvents.send_phone_number_modal_connect)
    setShowConnectPhoneNumberModal(false)
    // navigating directly here causes a screen freeze since the modal is fully
    // not dismissed. A state is set, which is then checked on the modal hide
    // handler to navigate
    setNavigateToPhoneVerification(true)
  }

  const onDismissConnectPhoneNumberModal = () => {
    ValoraAnalytics.track(SendEvents.send_phone_number_modal_dismiss)
    setShowConnectPhoneNumberModal(false)
  }

  const onHideConnectPhoneNumberModal = () => {
    if (navigateToPhoneVerification) {
      // reset state so the next time the modal is dismissed, this doesn't end
      // up navigating
      setNavigateToPhoneVerification(false)
      navigate(Screens.VerificationStartScreen, { hasOnboarded: true })
    }
  }

  const onPressSettings = () => {
    ValoraAnalytics.track(SendEvents.send_contacts_modal_settings)
    setShowEnableContactsModal(false)
    navigateToPhoneSettings()
  }

  const onDismissEnableContactsModal = () => {
    ValoraAnalytics.track(SendEvents.send_contacts_modal_dismiss)
    setShowEnableContactsModal(false)
  }

  return (
    <>
      <SelectRecipientButton
        testID={'SelectRecipient/QR'}
        title={t('sendSelectRecipient.qr.title')}
        subtitle={t('sendSelectRecipient.qr.subtitle')}
        onPress={onPressQR}
        icon={<QRCode />}
      />
      <SelectRecipientButton
        testID={'SelectRecipient/Contacts'}
        title={t('sendSelectRecipient.invite.title')}
        subtitle={t('sendSelectRecipient.invite.subtitle')}
        onPress={onPressContacts}
        icon={<Social />}
        showCheckmark={
          phoneNumberVerified && contactsPermissionStatus === PERMISSION_RESULTS.GRANTED
        }
      />
      <Dialog
        title={t('sendSelectRecipient.connectPhoneNumberModal.title')}
        isVisible={showConnectPhoneNumberModal}
        actionText={t('connect')}
        actionPress={onPressConnectPhoneNumber}
        secondaryActionText={t('dismiss')}
        secondaryActionPress={onDismissConnectPhoneNumberModal}
        onBackgroundPress={onDismissConnectPhoneNumberModal}
        onDialogHide={onHideConnectPhoneNumberModal}
        testID="SelectRecipient/PhoneNumberModal"
      >
        {t('sendSelectRecipient.connectPhoneNumberModal.description')}
      </Dialog>
      <Dialog
        title={t('sendSelectRecipient.enableContactsModal.title')}
        isVisible={showEnableContactsModal}
        actionText={t('settings')}
        actionPress={onPressSettings}
        secondaryActionText={t('dismiss')}
        secondaryActionPress={onDismissEnableContactsModal}
        onBackgroundPress={onDismissEnableContactsModal}
        testID="SelectRecipient/ContactsModal"
      >
        {t('sendSelectRecipient.enableContactsModal.description')}
      </Dialog>
    </>
  )
}
