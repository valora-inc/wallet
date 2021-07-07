import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('escrow', (table) => {
    table.string('action')
    table.string('from')
    table.string('identifier')
    table.string('token')
    table.decimal('value', 32, 0)
    table.string('paymentId')
    table.integer('blockNumber')
    table.string('blockHash')
    table.string('transactionHash')
    table.integer('logIndex')

    table.unique(['transactionHash', 'blockHash', 'logIndex'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('escrow')
}
