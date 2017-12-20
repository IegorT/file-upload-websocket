<template lang="pug">
  div.container.is-widescreen
    div.hero.notification
      div.navbar
        div.navbar-end(v-show="!isAuth")
          div.control.nav-item
            input.input(type="email" placeholder="Email" v-model.trim="email")
          div.control.nav-item
            input.input(type="password" placeholder="Password" v-model.trim="password")
          a.nav-item.level-item.button(@click="logIn") LogIn
        div.navbar-end(v-show="isAuth")
          a.nav-item.level-item.button(@click="logOut") Logout
    div.section(v-show="isAuth")
      div.columns
          div.column.is-6.is-offset-3
            div.card
              header.card-header
                div.file
                  label.file-label
                    input.file-input(type="file" name="file"  @change="fileChange($event.target.files)")
                    span.file-cta
                      span.file-label Choose a file…
              div.card-content(v-if="file")
                table.table.is-striped.is-fullwidth
                  thead
                    tr 
                      th File name
                      th Flle size, Mb
                      th File type
                  tbody
                    tr
                      td {{ file.name }}
                      td {{ file.size / 1000000 }}
                      td {{ file.type }}
                progress.progress.is-large.is-success(max="100" :value="start")
                span Sended: {{ start < file.size ? start : file.size }} / {{ file.size }}
              footer.card-footer(v-if="!fileSended && file")
                a.card-footer-item.button.is-primary.is-medium(@click="sendData" :disabled="upload === true") Send
                a.card-footer-item.button.is-danger.is-medium(@click="cancel" :disabled="upload === false") Cancel
</template>
<script>
import { getToken, setToken, delToken } from '../utils/storage.js'
import { login } from '../utils/fetch.js'
export default {
  data () {
    return {
      password: '',
      email: '',
      isAuth: !!getToken(),
      webSocket: null,
      ws: '',
      http: '',
      file: null,
      fileId: '',
      chunk: process.env.CHUNK || 10000000,
      upload: false,
      start: 0,
      interval: null,
      fileSended: false
    }
  },
  methods: {
    async sendData () {
      let json = JSON.stringify({
        'name': this.file.name,
        'lastModified': this.file.lastModified,
        'size': this.file.size,
        'type': this.file.type
      })

      this.webSocket = new WebSocket(`${this.ws}?apiKey=${getToken()}`)
      this.webSocket.onopen = (e) => {
        if (e.currentTarget.readyState === 1) {
          this.webSocket.send(json)
        } else {
          console.error(e)
        }
      }
      this.webSocket.onmessage = (e) => {
        let json = JSON.parse(e.data)
        if (json.status === 3) {
          this.webSocket.close(1000, 'Already uploaded')
        } else if (json.file_id) {
          console.log(json)
          this.fileId = json.file_id
          this.start = json.recived
          this.upload = true
          // let start = Number(this.start)
          // this.webSocket.send(this.file.slice(start, this.file.size))
          // this.interval = setInterval(() => {
          //   this.start = this.file.size - this.webSocket.bufferedAmount
          //   if (this.start === this.file.size) {
          //     this.fileSended = true
          //     clearInterval(this.interval)
          //   }
          // }, 100)
          let end = this.start + this.chunk
          while (this.start < this.file.size) {
            if (!this.upload) break
            this.webSocket.send(this.file.slice(this.start, end))
            this.start = end
            end += this.chunk
          }
        }
        this.webSocket.onclose = (e) => {
          this.upload = false
          this.fileSended = false
          console.log(e.reason)
        }
      }
    },
    logOut () {
      delToken()
      this.isAuth = false
    },
    fileChange (e) {
      this.start = 0
      this.upload = false
      this.fileSended = false
      this.file = e[0]
    },
    cancel () {
      this.webSocket.close(1000, 'Cancel')
      // clearInterval(this.interval)
      this.fileSended = false
      this.upload = false
    },
    async logIn () {
      let json = JSON.stringify({
        email: this.email,
        password: this.password
      })
      let token = await login(`${this.http}/login`, json)
      if (token) {
        setToken(token)
        this.isAuth = true
      }
      this.email = ''
      this.password = ''
    }
  },
  mounted () {
    this.ws = window.location.protocol === 'https:' ? 'wss://' : 'ws://' + (process.env.SERVER || 'localhost:3000/ws/upload')
    this.http = window.location.protocol === 'https:' ? 'https://' : 'http://' + (process.env.WEB_SOCKET || 'localhost:3000/api')
  },
  destroyed () {
    this.webSocket.close()
  }
}
</script>
<style scoped>
</style>