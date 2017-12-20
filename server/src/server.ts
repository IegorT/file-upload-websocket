import * as http from 'http'
import * as WebSocket from 'ws'



export class Server {
  private server: http.Server
  private wss: WebSocket.Server

  constructor (port: number) {
    this.server = http.createServer( (req, res) => {
      res.writeHead(404)
      res.end()
    }).listen(port, (err=null) => {
      if(err !== null) return console.log(err)
      console.info((new Date()) + ' Server is listening on port ' + port)
    })
  }

  conn () {
    return new WebSocket.Server({server: this.server })
  }


  
}