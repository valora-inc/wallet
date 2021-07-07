import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('last_blocks', (table) => {
    table.string('key').unique()
    table.integer('lastBlock')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('last_blocks')
}
