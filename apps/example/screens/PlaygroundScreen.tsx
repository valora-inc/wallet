import {
  getFees,
  navigate,
  usePrepareTransactions,
  useSendTransactions,
  useWallet,
} from '@divvi/mobile'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Address, parseEther } from 'viem'
import { RootStackScreenProps } from './types'

export default function PlaygroundScreen(_props: RootStackScreenProps<'Playground'>) {
  const { address } = useWallet()

  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState(address || '')

  const {
    prepareTransactions,
    status: prepareStatus,
    error: prepareError,
    data: prepared,
  } = usePrepareTransactions()

  const {
    sendTransactions,
    status: sendStatus,
    error: sendError,
    data: txHashes,
    reset: resetSend,
  } = useSendTransactions()

  // Debounced preparation when inputs change
  useEffect(() => {
    if (!amount || !recipient) return

    const timeout = setTimeout(async () => {
      try {
        // Clear last send status
        resetSend()
        // Prepare transaction
        await prepareTransactions({
          networkId: 'celo-mainnet',
          transactionRequests: [
            {
              to: recipient as Address,
              value: parseEther(amount),
            },
          ],
        })
      } catch (e) {
        // Error handled by hook
      }
    }, 500)

    return () => clearTimeout(timeout)
  }, [amount, recipient])

  const handleSend = async () => {
    if (prepared?.type !== 'possible') return

    await sendTransactions(prepared)
  }

  const fees = getFees(prepared)

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallet</Text>
        <Text>Address: {address}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Navigate</Text>
        {[
          { label: 'Send', onPress: () => navigate('Send') },
          { label: 'Receive', onPress: () => navigate('Receive') },
          {
            label: 'Swap',
            onPress: () => navigate('Swap', { fromTokenId: 'celo-mainnet:native' }),
          },
          { label: 'Add', onPress: () => navigate('Add') },
          {
            label: 'Add with tokenId',
            onPress: () => navigate('Add', { tokenId: 'celo-mainnet:native' }),
          },
          { label: 'Withdraw', onPress: () => navigate('Withdraw') },
          { label: 'Tab Wallet', onPress: () => navigate('TabWallet') },
          {
            label: 'Custom Screen',
            onPress: () => navigate('CustomScreen', { someParam: 'test' }),
          },
        ].map((item) => (
          <Pressable
            key={item.label}
            onPress={item.onPress}
            style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
          >
            <Text style={styles.navButtonText}>{item.label}</Text>
            <Text style={styles.navArrow}>›</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Send Transaction</Text>

        <TextInput
          style={styles.input}
          placeholder="Recipient Address (0x...)"
          value={recipient}
          onChangeText={setRecipient}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Amount in CELO"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        {/* Preparation Status */}
        {prepareStatus === 'loading' && (
          <View style={styles.status}>
            <ActivityIndicator size="small" />
            <Text>Preparing transaction...</Text>
          </View>
        )}

        {prepareError && <Text style={styles.error}>Error preparing: {prepareError.message}</Text>}

        {/* Not Enough Balance Warning */}
        {prepared?.type === 'not-enough-balance-for-gas' && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningTitle}>Insufficient Balance for Gas</Text>
            <Text style={styles.warningText}>
              You don't have enough balance to cover the gas fee. You can pay gas with any of these
              tokens: {prepared.feeCurrencies.map((fc) => fc.symbol).join(', ')}.
            </Text>
          </View>
        )}

        {/* Transaction Fee Display */}
        {prepared?.type === 'possible' && (
          <View style={styles.feeContainer}>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Estimated Fee:</Text>
              <Text style={styles.feeAmount}>
                {fees.estimatedFeeAmount?.toString()} {fees.feeCurrency.symbol}
              </Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Max Fee:</Text>
              <Text style={styles.feeAmount}>
                {fees.maxFeeAmount?.toString()} {fees.feeCurrency.symbol}
              </Text>
            </View>
          </View>
        )}

        {/* Send Button - only show when preparation is successful */}
        {prepared?.type === 'possible' && (
          <Pressable
            onPress={handleSend}
            disabled={sendStatus === 'loading'}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              sendStatus === 'loading' && styles.buttonDisabled,
            ]}
          >
            <Text style={styles.buttonText}>
              {sendStatus === 'loading' ? 'Sending...' : 'Send Transaction'}
            </Text>
            {sendStatus === 'loading' && (
              <ActivityIndicator color="#ffffff" style={styles.loader} />
            )}
          </Pressable>
        )}

        {/* Send Error */}
        {sendError && <Text style={styles.error}>Error sending: {sendError.message}</Text>}

        {/* Transaction Hashes */}
        {txHashes && (
          <View style={styles.hashesContainer}>
            <Text style={styles.hashesTitle}>
              Transaction{txHashes.length > 1 ? 's' : ''} Sent:
            </Text>
            {txHashes.map((hash) => (
              <Text key={hash} style={styles.hash} numberOfLines={1} ellipsizeMode="middle">
                {hash}
              </Text>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  error: {
    color: '#dc2626',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginLeft: 8,
  },
  feeContainer: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  feeLabel: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  feeAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  hashesContainer: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  hashesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 8,
  },
  hash: {
    fontSize: 13,
    color: '#166534',
    fontFamily: 'monospace',
  },
  warningContainer: {
    backgroundColor: '#fff7ed',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9a3412',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#9a3412',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
  },
  navButtonPressed: {
    backgroundColor: '#f1f5f9',
  },
  navButtonText: {
    fontSize: 16,
    color: '#334155',
  },
  navArrow: {
    fontSize: 20,
    color: '#64748b',
  },
})
