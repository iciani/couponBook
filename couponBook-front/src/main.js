import App from '@/App.vue'
import { useAuthStore } from '@/stores/auth'
import { registerPlugins } from '@core/utils/plugins'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { useValidationRules } from '@/composables/useValidationRules'

// Styles
import '@/styles/tailwind.css'
import '@core/scss/template/index.scss'
import '@layouts/styles/index.scss'
import '@styles/styles.scss'

const app = createApp(App)

const pinia = createPinia()

registerPlugins(app)

app.use(pinia)

useAuthStore(pinia).initAuth()

app.provide('validationRules', useValidationRules())

// Mount vue app
app.mount('#app')
