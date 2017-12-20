import { Users, Files } from './models'

const users = new Users()
const files = new Files()

// async function dropTables () {
//   files.drop()
//   users.drop()
//   users.database.end()
//   files.database.end()
// }
// (async () => await dropTables())()


async function createTables () {
  users.create()
  users.addUser('example@gmail.com', 'secret')
  files.create()
  users.database.end()
  files.database.end()
}
(async () => await createTables())()

