// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Vuetify
import { createVuetify } from 'vuetify'
const myCustomLightTheme = {
  dark: true,
  colors: {
    background: '#222222',
    surface: '#333333',
    primary: '#404040',
    'primary-darken-1': '#151515',
    secondary: '#3b88c3',
    'secondary-darken-1': '#2137b1',
    error: '#B00020',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00',
  }
}
export default createVuetify({
  // https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
  theme: {
    defaultTheme: 'myCustomLightTheme',
    themes: {
      myCustomLightTheme,
    }
  }
})
