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

  console.info('Database initialized successfully')
  return knexDb
}
