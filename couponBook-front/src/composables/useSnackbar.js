import { ref } from 'vue'

export const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
})

export const notify = (message, color = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color,
  }
}
