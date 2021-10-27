import { Knex, knex } from 'knex'

interface DBConnectionArgs {
  host: string
  database: string
  user: string
  password: string
}

export async function initDatabase(connectionArgs: DBConnectionArgs): Promise<Knex> {
  const knexDb = knex({
    client: 'pg',
    connection: connectionArgs,
  })

  // Checking connection
  try {
    await knexDb.raw('select 1')
    console.info('Database initialized successfully')
  } catch (e) {
    console.error(`Database couldn't be initialized successfully ${(e as Error)?.message}`)
    throw e
  }

  return knexDb
}
