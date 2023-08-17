import { prismaClient } from '../../lib/prismaClient'

export default async function getActiveAccounts () {
  const query = {
    select: {
      balance_balance_addressToaddress: {
        select: {id: true},
        where: {balance: {notIn: ['0', '0x0']}},
        orderBy: {blockNumber: 'desc'},
        take: 1
      }
    }
  }

  const activeAccounts = (await prismaClient.address.findMany(query))
    .reduce((active, current) => {
      if (current.balance_balance_addressToaddress.length) {
        active++
      }
      return active
    }, 0)

  return activeAccounts
}
