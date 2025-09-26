import { createVuetify } from 'vuetify'
import { VBtn } from 'vuetify/components/VBtn'
import defaults from './defaults'
import { icons } from './icons'
import { themes } from './theme'

// Styles
import '@core/scss/template/libs/vuetify/index.scss'
import 'vuetify/styles'

// Locale español
import { es } from 'vuetify/locale'

export default function (app) {
  const vuetify = createVuetify({
    aliases: {
      IconBtn: VBtn,
    },
    defaults,
    icons,
    locale: {
      locale: 'es',
      messages: { es },
    },
    theme: {
      defaultTheme: 'light',
      themes,
    },
  })

  app.use(vuetify)
}
