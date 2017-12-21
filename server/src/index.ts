import * as WebSocket from 'ws'
import * as http from 'http'
import * as jwt from 'jsonwebtoken'
import * as url from 'url'

import { DataBase } from './db'
import Logger from './log'
import { Users, Files } from './models'
import { saveFile, moveFile, wipeFiles } from './utils/saveFile'


const salt = process.env.SALT || 'salt'
const port = Number(process.env.SERVER_PORT) || 3000
const wipingInterval = Number(process.env.WIPE) || 3600 * 24 * 1000

const logger = new Logger(module.filename).logger

// Server config
const server = http.createServer((req, res) => {
  const headers: {} = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': false,
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Headers': 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept',
    'Content-Type': 'application/json'
  }
  req.on('error', (err) => {
    logger.error(`${err}`)
    res.statusCode = 400
    res.end()
  })
  res.on('error', (err) => {
    logger.error(`${err}`)
  })
  if (req.method === 'OPTIONS') {
    res.writeHead(200, headers)
    res.end()
  } else if (req.url === '/api/login') {
    const users = new Users()
    let body:string = ''
    req.on('data', (chunk:string) => { body += chunk })
    req.on('end', () => {
      let recive = JSON.parse(body)
      users.checkUser(recive).then(data => {
        if (data.auth) {
          res.writeHead(200, headers)
          let token = jwt.sign({ user_id: data.user_id}, salt, { expiresIn : '1 days' })
          res.end(JSON.stringify({'token': token}))
          logger.info(`To ${req.connection.remoteAddress} send token`)
          users.database.end()
        } else {
          res.writeHead(403, headers)
          res.end(JSON.stringify({'error': 'wrong email or password'}))
          logger.warn(`From ${req.connection.remoteAddress} wrong email or password`)
        }
      })
    })
   } else {
    res.writeHead(404, headers)
    res.end(JSON.stringify('Bad request'))
    logger.warn(`From ${req.connection.remoteAddress} try access to ${req.url} - disconnected`)
  }
})

server.listen(port, (err=null) => {
  if(err !== null) return console.log(err)
  logger.info(`server started on port: ${port} \tOK`)
  
})


// Websocket tune up
const wss = new WebSocket.Server({
  verifyClient: function (info, cb) {
    let auth = url.parse(info.req.url, true)
    let token = auth.query.apiKey
    if ( auth.pathname !== '/ws/upload') {
      cb(false, 404, 'Wrong path')
    } else if (!token) {
      logger.warn(`From ${info.req.connection.remoteAddress} try access to ${info.req.url} - disconnected`)
      cb(false, 401, 'Unauthorized')
    } else { 
      jwt.verify(token, salt, (err, decoded) => {
        if (err) {
          logger.warn(`From ${info.req.connection.remoteAddress} try access to ${info.req.url} - disconnected`)
          cb(false, 401, 'Unauthorized')
        } else {
          info.req['user'] = decoded.user_id
          cb(true)
        }
      })
    }
  },
  server
})

function heartbeat() {
  this.isAlive = true
}
wss.on('connection', function connection(ws, req) {
  const files = new Files()
  let data = url.parse(req.url, true)
  let fileInfo: {}
  ws.isAlive = true
  ws.on('pong', heartbeat)
  logger.info(`${req.connection.remoteAddress} connected to websocket`)
  if (data.pathname === '/ws/upload') {
    ws.on('message', (message) => {
      if (typeof message === 'string') {
        logger.info(`From ${req.connection.remoteAddress} recived ${message}`)
        let info = JSON.parse(message)
        fileInfo = info
        files.getFile(req.user, info).then((data) => {
          if (!data[0]) {
            files.addFile(req.user, info)
            .then((data) => {
              fileInfo['file_id'] = data[0].file_id
              ws.send(JSON.stringify(data[0]))
            })
            .catch((e) => logger.info(`${e}`))
          } else {
            fileInfo['file_id'] = data[0].file_id
            ws.send(JSON.stringify(data[0]))
          }
        }).catch((e) => { logger.info(`${e}`) })
      } else {
        files.changeStatus(fileInfo.file_id, 1)
        saveFile(message, fileInfo.name)
        .then(file => {
          files.recived(fileInfo.file_id, file.size)
          if (file.size === fileInfo.size) {
            files.changeStatus(fileInfo.file_id, 3)
            .then(()=> {ws.close(1000, 'OK')})
            .then(() => moveFile(fileInfo.name))
            .catch((e) => logger.error(`${e}`))
          }
        })
      }
    })
    ws.on('close', (code, reason) => {
      if (code === 1000) logger.info(`File ${fileInfo.name} upload ${reason}`)
      else logger.error(`Websocket close ${code} reason ${reason}`)
      fileInfo = {}
      files.database.end()
    })
  } else {
    logger.warn(`From ${req.connection.remoteAddress} try access to ${req.url} - disconnected`)
    ws.terminate()
    files.database.end()
  }
})


// Terminate broken connection 
const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate()

    ws.isAlive = false;
    ws.ping('', false, true);
  })
}, 30000)

// 3600 * 24 * 1000 = 24 hours
const wipe = setInterval(() => {
  let date:Date = new Date(Date.now() - wipingInterval)
  let files = new Files()
  logger.info(`Wiping started`)
  wipeFiles(date)
  .then(() => files.deleteFiles(date))
  .then(() => {
    files.database.end()
    logger.info(`Wiping finished \tOK`)
  })
  .catch(err => {
    files.database.end()
    logger.error(`Wiping error ${err}`)
  })
}, wipingInterval)