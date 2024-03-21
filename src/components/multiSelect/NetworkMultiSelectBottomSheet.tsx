import GorhomBottomSheet from '@gorhom/bottom-sheet'
import React from 'react'
import { useTranslation } from 'react-i18next'
import MultiSelectBottomSheet, {
  ItemProps,
} from 'src/components/multiSelect/MultiSelectBottomSheet'
import { useSelector } from 'src/redux/hooks'
import { NETWORK_NAMES } from 'src/shared/conts'
import { networksIconSelector } from 'src/tokens/selectors'
import { NetworkId } from 'src/transactions/types'

interface Props {
  forwardedRef: React.RefObject<GorhomBottomSheet>
  onClose?: () => void
  onOpen?: () => void
  selectedNetworkIds: Record<NetworkId, boolean>
  setSelectedNetworkIds: (selectedNetworkIds: Record<NetworkId, boolean>) => void
}

function NetworkMultiSelectBottomSheet({
  forwardedRef,
  onClose,
  onOpen,
  selectedNetworkIds,
  setSelectedNetworkIds,
}: Props) {
  const { t } = useTranslation()
  const allNetworkIds = Object.keys(selectedNetworkIds) as NetworkId[]

  const networkIconByNetworkId = useSelector((state) => networksIconSelector(state, allNetworkIds))

  const textAndIconMap = allNetworkIds.reduce(
    (acc, networkId) => {
      acc[networkId] = {
        text: NETWORK_NAMES[networkId],
        iconUrl: networkIconByNetworkId[networkId],
      }
      return acc
    },
    {} as Record<NetworkId, Omit<ItemProps, 'onPress' | 'isSelected'>>
  )

  return (
    <MultiSelectBottomSheet
      forwardedRef={forwardedRef}
      onClose={onClose}
      onOpen={onOpen}
      selectedItems={selectedNetworkIds}
      setSelectedItems={setSelectedNetworkIds}
      textAndIconMap={textAndIconMap}
      selectAllText={t('multiSelect.allNetworks')}
      title={t('multiSelect.switchNetwork')}
    />
  )
}

export default NetworkMultiSelectBottomSheet
