import * as mysql from 'mysql'

import Logger from './log'


const logger = new Logger(module.filename).logger
export class DataBase {
  database: mysql.Connection
  protected table: string
  private config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'qwerty123456',
    database: process.env.DB_NAME || 'test'
  }

  constructor () {
    this.database = mysql.createConnection({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: this.config.database
    })
  }
  connection () {
    this.database.connect((err:Error) => {
      if(err !== null) {
        logger.error(`${err}`)  
      } else {
        logger.info(`Database is connected:\t\tOK`)
      }
    })
  }
  query (query:string, logs: {err: string,  ok:string}, data?:Array<any> ) {
    return new Promise((resolve,  reject) => {
      this.database.query(query, data, (err, result) => {
        if(err !== null) {
          logger.error(`${logs.err}: ${err}`)
          reject(err)
        } else {
          logger.info(`${logs.ok}`)
          resolve(result)
        }
      })
    })
  }
  async createTable (query:string, table:string) {
    await this.query(query, {err: `Couldn't create ${table}`, ok: `Table ${table} created or exist`})
  }
  async dropTable (table:string) {
    const query:string = `DROP TABLE IF EXISTS ${table}`
    await this.query(query, {err: `Couldn't drop ${table}`, ok: `Table ${table} droped successful`})
  }
}

