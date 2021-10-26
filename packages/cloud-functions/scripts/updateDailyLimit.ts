import * as admin from 'firebase-admin'
import yargs from 'yargs/yargs'

// Daily limit to set for existing addresses,
// see also onWriteUserAddress which sets it for new addresses
const DAILY_LIMIT = Number.MAX_VALUE

const argv = yargs(process.argv.slice(2))
  .usage('$0 [options]', 'Update the daily limit for all addresses in firebase')
  .option('env', {
    alias: 'e',
    demandOption: true,
    describe: 'choose an environment',
    choices: ['alfajores', 'mainnet'],
  })
  .options('serviceAccountKey', {
    alias: 's',
    describe: 'path to service account key',
    type: 'string',
  })
  .help('help').argv

const app = admin.initializeApp({
  credential: argv.serviceAccountKey
    ? admin.credential.cert(argv.serviceAccountKey)
    : admin.credential.applicationDefault(),
  databaseURL: `https://celo-mobile-${argv.env}.firebaseio.com`,
})

// Update users iteratively to avoid bumping into Firebase limits https://firebase.google.com/docs/database/usage/limits#writes
// This does 2 requests per iteration: 1 read + 1 write (updating 500 records)
async function updateUsers(lastKey: string = '', iteration: number = 0, records: number = 0) {
  console.log(`Updating users: lastKey=${lastKey} iteration=${iteration} records=${records}`)
  const snapshots = await admin
    .database()
    .ref('/registrations')
    .orderByKey()
    .startAt(lastKey)
    .limitToFirst(500)
    .once('value')

  const batchUpdate: Record<string, number> = {}
  let nextKey: string | undefined = undefined
  let counter = 0

  snapshots.forEach((snapshot) => {
    const address = snapshot.key

    if (address !== lastKey) {
      counter++
      batchUpdate[`/registrations/${address}/dailyLimitCusd`] = DAILY_LIMIT

      nextKey = address ?? undefined
    }

    return false
  })

  await admin.database().ref('/').update(batchUpdate)

  if (nextKey) {
    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
      updateUsers(nextKey, iteration + 1, counter + records)
    })
  } else {
    console.log(`Finished: ${iteration} iterations, ${counter + records} records updated.`)
    // Allows the node process to exit otherwise it keeps its database connection
    app.delete()
  }
}

// Start at address '0', an empty string doesn't work
updateUsers('0')
