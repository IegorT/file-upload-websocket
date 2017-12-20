import * as winston from 'winston'

export default class Logger {
  filename : string
  transports: Array<any>
  logger: winston.LoggerInstance
  constructor (path: string) {
    if (path.match(/\.js$/)) {
      this.transports = [
        new winston.transports.Console({
          timestamp: true,
          colorize: true,
          level: 'info'
        }),
        // new winston.transports.File({
        //   filename: `./src/logs/${Date.now()}-debug.log`,
        //   level: 'debug',
        // })
      ]
    } else {
      this.transports = []
    }
    this.logger = new winston.Logger({ transports:this.transports })
  }
}
