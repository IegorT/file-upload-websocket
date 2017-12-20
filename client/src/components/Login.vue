<template lang="pug">
  div.columns
    div.column.is-3.is-offset-5
      div.field
        label.label Email
        div.control
          input.input(type="email" placeholder="Email" v-model.trim="email")
      div.field
        label.label Password
        div.control
          input.input(type="password" placeholder="Password" v-model.trim="password")
      div.field
        div.control
          button.button.is-success(@click="sendData") Login
</template>
<script>

export default {
  data () {
    return {
      password: '',
      email: ''
    }
  },
  methods: {
    sendData () {
      this.email = ''
      this.password = ''
    }
  }
}
</script>
