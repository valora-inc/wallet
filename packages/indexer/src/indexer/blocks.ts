import { database } from '../database/db'

const TABLE_NAME = 'last_blocks'

export async function getLastBlock(key: string) {
  const row = await database(TABLE_NAME).where({ key: key }).first()
  return row?.lastBlock ?? 0
}

export async function setLastBlock(key: string, block: number) {
  return database(TABLE_NAME).insert({ key: key, lastBlock: block }).onConflict('key').merge()
}
