import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
import { initWechatShare } from './utils/share'
import { inject } from "@vercel/analytics";

const app = createApp(App)
app.use(createPinia())
app.use(ElementPlus)
app.mount('#app')

initWechatShare();
inject();