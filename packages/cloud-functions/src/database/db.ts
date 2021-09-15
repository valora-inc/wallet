import { Knex, knex } from 'knex'
import { DB_DATA } from '../config'

export let knexDb: Knex
export async function initDatabase() {
  knexDb = knex({
    client: 'pg',
    connection: DB_DATA,
  })

  console.info('Database initialized successfully')
  return knexDb
}
