import { passwordHash, fileHash } from './utils/hashed'
import { DataBase } from './db'
import Logger from './log'
import { resolve } from 'dns';

const logger = new Logger(module.filename).logger
export class Users extends DataBase {
  table = 'users'

  create () {
    const query:string = `CREATE TABLE IF NOT EXISTS ${this.table}(\
    user_id INT AUTO_INCREMENT NOT NULL ,\
    email  VARCHAR(255) NOT NULL UNIQUE,\
    password VARCHAR(255) NOT NULL,\
    salt VARCHAR(255) NOT NULL,\
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id))`
    this.createTable(query, this.table)
  }
  async addUser (email:string, password: string) {
    let hash = passwordHash(password)
    const query:string = `INSERT INTO ${this.table} (\`email\`, \`password\`, \`salt\`) VALUES (?, ?, ?) `
    await this.query(query, {err: `Couldn't insert ${query} into table ${this.table}`, ok: `Insert ${email} into ${this.table}`}, [email, hash.hash, hash.salt])
  }
  async takeUser (email:string) {
    const query:string = 'SELECT \`user_id\`, \`password\`, \`salt\` FROM users WHERE email=? LIMIT 1'
    return await this.query(query, {err: `Couldn't get user by ${query}`, ok: `Selected ${email} by email`}, [email])
  }
  async checkUser (forCheck:{email:string, password:string}) {
    let check = await this.takeUser(forCheck.email)
    let hash = passwordHash(forCheck.password, check[0].salt)
    return {user_id: check[0].user_id, auth: check[0].password === hash.hash}
  }
  drop () {
    this.dropTable(this.table)
  }
}

export class Files extends DataBase {
  table = 'files'

  create () {
    const query: string = `CREATE TABLE IF NOT EXISTS ${this.table}\
    (file_id INT AUTO_INCREMENT,\
    user INT NOT NULL, name VARCHAR(255) NOT NULL,\
    size BIGINT NOT NULL, type VARCHAR(255) NOT NULL, last_modified VARCHAR(255) NOT NULL,\
    hash VARCHAR(255) NOT NULL,\
    status TINYINT DEFAULT 0, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\
    last_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\
    recived BIGINT DEFAULT 0, PRIMARY KEY (file_id),\
    FOREIGN KEY (user) REFERENCES users(user_id))`
    this.createTable(query, this.table)
  }

  async addFile (user:number, info: {name:string, size:number, lastModified: number, type:string}) {
    const query: string = `INSERT INTO ${this.table} (\`user\`, \`name\`, \`size\`, \`type\`, \`last_modified\`, \`hash\`) VALUES (?, ?, ?, ?, ?, ?)`
    await this.query(query, {err: `Couldn't  ${query} into table ${this.table}`, ok: `Insert ${JSON.stringify(info)} into ${this.table}`},[user, info.name, info.size, info.type, info.lastModified, fileHash(info)])
    return await this.getFile(user, info)
  }

  async getFile (user:number, info: {name:string, size:number, lastModified: number, type:string}) {
    const query: string = `SELECT file_id, status, recived FROM ${this.table} WHERE user = ? AND name = ? AND size = ? AND type = ? AND last_modified = ? LIMIT 1`
    return await this.query(query, {
      err: `Couldn't get file by ${query}`,
      ok: `${JSON.stringify(info)} OK`
    },[user, info.name, info.size, info.type, info.lastModified])
  }

  async deleteFiles (time: Date) {
    let mysqlTime = time.toISOString().slice(0, 19).replace('T', ' ')
    const query: string = `DELETE FROM ${this.table} WHERE TIME_TO_SEC(last_change) < TIME_TO_SEC(?) AND status < 3`
    return await this.query(query, {
      err: `Couldn't delete files by ${query}`,
      ok: `Files deleted ${JSON.stringify(time)}`
    },[mysqlTime])
  }

  async changeStatus (file_id: number, status: number) {
    const query: string = `UPDATE ${this.table} SET status = ? WHERE file_id = ?`
    await this.query(query, {err: `Couldn't update ${query} into table ${this.table}`, ok: `Update status ${this.table}`}, [status, file_id])
  }

  async recived (file_id: number, byte: number) {
    const query: string = `UPDATE ${this.table} SET recived = ? WHERE  file_id = ?`
    await this.query(query, {err: `Couldn't ${query} into table ${this.table}`, ok: `Insert into ${this.table}`},[byte, file_id])
  }


  drop () {
    this.dropTable(this.table)
  }
}
