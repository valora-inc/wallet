import * as functions from 'firebase-functions'
import { initDatabase, knexDb } from '../database/db'

export const fetchAccountsForWalletAddress = functions.https.onRequest(async (req, res) => {
  try {
    res.set('Access-Control-Allow-Origin', '*')
    const walletAddress = req.query.walletAddress as string
    if (!walletAddress) {
      res.status(400).end()
      return
    }
    await initDatabase()
    const accountAddresses = await knexDb('account_wallet_mappings')
      .whereRaw('LOWER("walletAddress") = ?', [walletAddress.toLowerCase()])
      .pluck('accountAddress')

    res.status(200).send(accountAddresses)
  } catch (error) {
    console.error('Error fetching address mapping: ', JSON.stringify(error))
    console.info('Request query: ', JSON.stringify(req.query))
    res.status(400).end()
  }
})
