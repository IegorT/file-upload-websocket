import Vue from 'vue'
import Router from 'vue-router'
import Upload from '@/components/Upload'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Upload',
      component: Upload
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
