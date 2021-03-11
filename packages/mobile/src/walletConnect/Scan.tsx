// import colors from '@celo/react-components/styles/colors'
// import fontStyles from '@celo/react-components/styles/fonts'
// import { Spacing } from '@celo/react-components/styles/styles'
// import { EIP712TypedData } from '@celo/utils/src/sign-typed-data-utils'
// // import { AsyncStorage } from 'react-native';
// import AsyncStorage from '@react-native-community/async-storage'
// import WalletConnect, { CLIENT_EVENTS } from '@walletconnect/client'
// import { SessionTypes } from '@walletconnect/types'
// import BigNumber from 'bignumber.js'
// import React, { useState } from 'react'
// import { Button, StyleSheet, Text, TextInput, View } from 'react-native'
// import { SafeAreaView } from 'react-native-safe-area-context'
// import { useSelector } from 'react-redux'
// import Dialog from 'src/components/Dialog'
// import DrawerTopBar from 'src/navigator/DrawerTopBar'
// import { getPassword } from 'src/pincode/authentication'
// import { getContractKitAsync, getWalletAsync } from 'src/web3/contracts'

// enum Actions {
//   sendTransaction = 'eth_sendTransaction',
//   personalSign = 'personal_sign',
//   signTypedData = 'eth_signTypedData',
//   celoWrite = 'celo_offchainWrite',
// }

// function parsePersonalSign(req: SessionTypes.Payload): { from: string; payload: string } {
//   // @ts-ignore
//   const [payload, from] = req.payload.params
//   return { from, payload }
// }
// function parseSignTypedData(req: any): { from: string; payload: EIP712TypedData } {
//   const [from, payload] = req.payload.params
//   return { from, payload: JSON.parse(payload) }
// }

// function hexToUtf8(hex: string) {
//   return Buffer.from(hex.replace('0x', ''), 'hex').toString()
// }

// function Scan(props: any) {
//   const [uri, setUri] = useState('')
//   const [wc, setWc] = useState<WalletConnect | null>(null)
//   const [pendingRequest, setPendingRequest] = useState<SessionTypes.PayloadEvent | null>(null)
//   const [pendingSession, setPendingSession] = useState<SessionTypes.Proposal | null>(null)
//   const [proposer, setProposer] = useState<any>(null)
//   // @ts-ignore
//   const account = useSelector((state) => state.web3.account)
//   const [requestMetadata, setRequestMetadata] = useState<{ to: string } | null>(null)
//   // const { backupCompleted, route, account } = this.props
//   // const navigatedFromSettings = route.params?.navigatedFromSettings

//   // const account = useSelector(getAccount)
//   // const wallet = useSelector(getWallet)

//   // console.log('>>>', account, wallet)

//   async function handleRequest() {
//     if (!pendingRequest) {
//       return
//     }
//     // console.log('call_request eeee', 'error=', error, 'method=', method, 'params=', params)

//     const wallet = await getWalletAsync()
//     // if (!wallet.isAccountUnlocked(account)) {
//     const password = await getPassword('000008')
//     await wallet.unlockAccount(account, password, 100000)
//     // }

//     const {
//       // @ts-ignore
//       payload: { id, method },
//     } = pendingRequest

//     if (method === Actions.personalSign) {
//       const { payload, from } = parsePersonalSign(pendingRequest)
//       console.log('Trying to sign', payload)
//       const signature = await wallet.signPersonalMessage(from, payload)
//       console.log('signed', signature)

//       console.log('response', {
//         topic: pendingRequest.topic,
//         response: {
//           id: pendingRequest.payload.id,
//           jsonrpc: '2.0',
//           result: signature,
//         },
//       })
//       wc?.respond({
//         // @ts-ignore
//         topic: pendingRequest.topic,
//         response: {
//           id: pendingRequest.payload.id,
//           jsonrpc: '2.0',
//           result: signature,
//         },
//       })
//       // wc?.approveRequest({
//       //   id,
//       //   result: signature,
//       // })
//       setPendingRequest(null)
//       return
//     }

//     if (method === Actions.signTypedData) {
//       const { from, payload } = parseSignTypedData(pendingRequest)
//       console.log('trying to sign', payload)
//       const signature = await wallet.signTypedData(from, payload)
//       wc?.respond({
//         // @ts-ignore
//         topic: pendingRequest.topic,
//         response: {
//           id: pendingRequest.payload.id,
//           jsonrpc: '2.0',
//           result: signature,
//         },
//       })

//       setPendingRequest(null)
//       return
//     }

//     if (method === 'eth_sendTransaction') {
//       // @ts-ignore
//       const [tx] = pendingRequest.payload.params
//       const kit = await getContractKitAsync(false)
//       const sent = await kit.sendTransaction(tx)
//       const hash = await sent.getHash()
//       console.log('hash', hash)
//       wc?.respond({
//         // @ts-ignore
//         topic: pendingRequest.topic,
//         response: {
//           id: pendingRequest.payload.id,
//           jsonrpc: '2.0',
//           result: hash,
//         },
//       })
//       setPendingRequest(null)
//       return
//     }

//     if (method === Actions.celoWrite) {
//       // @ts-ignore
//       const [path, data] = pendingRequest.payload.params
//       console.log('celoWrite', path, data)
//       await fetch(
//         'https://www.googleapis.com/upload/storage/v1/b/celo-test-alexh-bucket/o?uploadType=media&name=/account/name',
//         {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'Content-Length': 'JSON.stringify({ name: data }).length',
//             Authorization: `Beader ${'ddd'}`,
//           },
//           body: JSON.stringify({ name: data }),
//         }
//       )
//       //       curl -k -v -X POST \
//       // -H "Authorization: Bearer <your_oauth2_token>" -H "Content-Length: 8" \
//       // -H "Content-Type: text/plain" \
//       // 'https://www.googleapis.com/upload/storage/v1/b/your-bucket/o?uploadType=media&name=yourobjectname' \
//       // -d 'yourdata'
//       console.log('>>> did it!')
//       wc?.respond({
//         // @ts-ignore
//         topic: pendingRequest.topic,
//         response: {
//           id: pendingRequest.payload.id,
//           jsonrpc: '2.0',
//           result: 'Some useful URL',
//         },
//       })

//       setPendingRequest(null)
//       return
//     }

//     throw new Error(`Unknown action ${method}`)
//   }

//   function InitiateConnectionModal() {
//     return (
//       <Dialog
//         title={`Establish connection with ${pendingSession?.proposer.metadata.name}?`}
//         isVisible={!!pendingSession}
//         actionText="Allow"
//         secondaryActionText="Cancel"
//         actionPress={() => {
//           // wc?.session.
//           const response: SessionTypes.Response = {
//             metadata: {
//               name: 'Test Wallet',
//               description: 'Test Wallet',
//               url: 'https://google.com',
//               icons: ['https://walletconnect.org/walletconnect-logo.png'],
//             },
//             state: {
//               accounts: [`${account}@eip155:1`],
//             },
//           }
//           wc?.approve({ proposal: pendingSession!, response })
//           setPendingSession(null)
//         }}
//         secondaryActionPress={() => {
//           wc?.reject({ proposal: pendingSession! })
//           setPendingSession(null)
//         }}
//       >
//         <Text>
//           {pendingSession?.proposer.metadata.name} is attempting to establish a connection with your
//           device.{' '}
//         </Text>

//         <Text>
//           During your session it could ask for access to do the following actions:
//           {'\n'}
//         </Text>
//         <Text>{'\n'}</Text>
//         {pendingSession?.permissions.jsonrpc.methods.map((rpc) => (
//           <Text>{`${rpc}\n`}</Text>
//         ))}
//         <Text>{'\n'}</Text>
//         <Text>{'\n'}</Text>
//         <Text>Don't be alarmed, every action will still have to be manually approved by you.</Text>
//       </Dialog>
//     )
//   }

//   function ConfirmActionModal() {
//     if (!pendingRequest) {
//       return null
//     }

//     console.log('Confirming Action', pendingRequest.payload)

//     let body
//     // @ts-ignore
//     if (pendingRequest.payload.method === Actions.personalSign) {
//       const { payload } = parsePersonalSign(pendingRequest)
//       body = (
//         <View>
//           <View>
//             {/* <Text>{wc?.peerMeta?.name} is requesting you sign the following payload:</Text> */}
//           </View>
//           <View style={{ backgroundColor: colors.goldFaint, padding: 12, marginVertical: 12 }}>
//             <Text>{hexToUtf8(payload)}</Text>
//           </View>
//         </View>
//       )
//     }

//     // @ts-ignore
//     if (pendingRequest.payload.method === Actions.signTypedData) {
//       const { payload } = parseSignTypedData(pendingRequest)
//       body = (
//         <View>
//           <View>
//             {/* <Text>{wc?.peerMeta?.name} is requesting you sign the following payload:</Text> */}
//           </View>

//           <View style={{ backgroundColor: colors.goldFaint, padding: 12, marginVertical: 12 }}>
//             <Text>{JSON.stringify(payload, null, 2)}</Text>
//           </View>
//         </View>
//       )
//     }

//     // note this is hard coded to handle CELO transfers right now
//     // @ts-ignore
//     if (pendingRequest.payload.method === Actions.sendTransaction) {
//       console.log('>> sendTransaction', JSON.stringify(pendingRequest.payload))
//       // @ts-ignore
//       const [tx] = pendingRequest.payload.params
//       const value = new BigNumber(tx.value).toNumber()
//       body = (
//         <View>
//           <View>
//             <Text>{proposer.metadata.name} is requesting transfer the following:</Text>
//           </View>

//           <Text style={{ paddingTop: 36 }}>Value (CELO): {value}</Text>
//           <Text>To: {requestMetadata ? `${requestMetadata.to} (${tx.to})` : tx.to}</Text>
//         </View>
//       )
//     }

//     // @ts-ignore
//     console.log(pendingRequest.payload.method)
//     // @ts-ignore
//     if (pendingRequest.payload.method === Actions.celoWrite) {
//       console.log('>> celoWrite', JSON.stringify(pendingRequest.payload))
//       // @ts-ignore
//       const [path, data] = pendingRequest.payload.params
//       body = (
//         <View>
//           <View>
//             <Text>
//               {proposer.metadata.name} wants to write the following to your storage path {path}:
//             </Text>
//           </View>

//           <View style={{ backgroundColor: colors.goldFaint, padding: 12, marginVertical: 12 }}>
//             <Text>{JSON.stringify(data, null, 2)}</Text>
//           </View>
//         </View>
//       )
//     }

//     return (
//       <Dialog
//         title="Approve Action"
//         isVisible={!!pendingRequest}
//         actionText="Approve"
//         actionPress={handleRequest}
//         secondaryActionText="Cancel"
//         secondaryActionPress={() => setPendingRequest(null)}
//         testID="ConfirmActionModal"
//       >
//         {body}

//         <View style={{ paddingTop: 48 }}>
//           <Text style={{ color: colors.gray5 }}>
//             Worried about this request? Get in touch with Valora Support
//           </Text>
//         </View>
//       </Dialog>
//     )
//   }

//   const initiate = async () => {
//     // Create connector

//     console.log('WalletConnect initiating')
//     const client = await WalletConnect.init({
//       relayProvider: 'wss://staging.walletconnect.org',
//       storage: {
//         // @ts-ignore
//         getEntries: () => {
//           console.log('getEntries')
//         },
//         // @ts-ignore
//         getItem: async (key) => {
//           const item = await AsyncStorage.getItem(key)
//           console.log('getItem', key, item)

//           if (item) {
//             return JSON.parse(item)
//           }
//           return item
//         },
//         // @ts-ignore
//         getKeys: () => {
//           console.log('getKeys')
//         }, //  AsyncStorage.getAllKeys,
//         // @ts-ignore
//         setItem: (key, value) => {
//           console.log('setitem', key, value)
//           return AsyncStorage.setItem(key, JSON.stringify(value))
//         },
//         // @ts-ignore
//         removeItem: () => {}, // AsyncStorage.removeItem,
//       },
//     })
//     console.log('WalletConnect initiated', client)

//     client.on(CLIENT_EVENTS.session.proposal, async (proposal: SessionTypes.Proposal) => {
//       // user should be prompted to approve the proposed session permissions displaying also dapp metadata
//       const { proposer, permissions } = proposal
//       console.log('WalletConnect proposal', proposal, permissions)
//       setProposer(proposer)
//       setPendingSession(proposal)
//     })

//     client.on(CLIENT_EVENTS.session.created, async (session: SessionTypes.Created) => {
//       // session created succesfully
//     })

//     console.log('PAIRING', uri)
//     await client.pair({ uri })
//     console.log('PAIRED', uri)

//     // const connector = new WalletConnect({
//     //   uri,
//     //   clientMeta: {
//     //     description: 'A mobile payments app that works worldwide',
//     //     url: 'https://valoraapp.com',
//     //     icons: ['https://walletconnect.org/walletconnect-logo.png'],
//     //     name: 'Valora',
//     //   },
//     // })
//     setWc(client)

//     client.on(CLIENT_EVENTS.session.payload, async (payloadEvent: SessionTypes.PayloadEvent) => {
//       console.log('WalletConnect payload', payloadEvent)
//       setPendingRequest(payloadEvent)

//       // @ts-ignore
//       if (payloadEvent.payload.method === Actions.sendTransaction) {
//         // @ts-ignore
//         const to = payloadEvent.payload.params[0].to
//         const wrapper = new OffchainDataWrapper(account, await getContractKitAsync(true))
//         const name = new PublicNameAccessor(wrapper)
//         const offchainReadResult = await name.readAsResult(to)
//         if (offchainReadResult.ok) {
//           setRequestMetadata({ to: offchainReadResult.result.name })
//         }
//       }
//     })

//     // connector.on('session_request', (error, payload) => {
//     //   console.log('session_request', error, JSON.stringify(payload, null, 2))
//     //   const [session] = payload.params
//     //   setPendingSession(session)
//     // })
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <DrawerTopBar />
//       <InitiateConnectionModal />
//       <ConfirmActionModal />
//       <TextInput
//         style={{
//           width: '100%',
//           borderColor: 'green',
//           borderWidth: 1,
//           borderStyle: 'solid',
//           padding: 12,
//         }}
//         value={uri}
//         onChangeText={(newQr) => setUri(newQr)}
//       ></TextInput>
//       <Button title="Initiate" onPress={initiate} />
//     </SafeAreaView>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.light,
//   },
//   introContainer: {
//     flex: 1,
//     paddingHorizontal: Spacing.Thick24,
//     justifyContent: 'center',
//   },
//   postSetupContentContainer: {
//     flex: 1,
//   },
//   postSetupContainer: {
//     flex: 1,
//     paddingTop: Spacing.Thick24,
//     paddingHorizontal: Spacing.Regular16,
//   },
//   postSetupTitle: {
//     ...fontStyles.h2,
//     marginBottom: Spacing.Smallest8,
//   },
//   h1: {
//     ...fontStyles.h1,
//     paddingBottom: Spacing.Regular16,
//     paddingTop: Spacing.Regular16,
//   },
//   body: {
//     ...fontStyles.large,
//     paddingBottom: Spacing.Regular16,
//   },
//   postSetupBody: {
//     ...fontStyles.regular,
//     marginVertical: Spacing.Regular16,
//     flexGrow: 1,
//   },
//   postSetupCTA: {
//     alignSelf: 'center',
//     paddingVertical: Spacing.Regular16,
//     marginBottom: Spacing.Regular16,
//   },
// })

// export default Scan

export function Hello() {}
