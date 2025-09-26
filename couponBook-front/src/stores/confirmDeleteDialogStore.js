import { ref } from 'vue'

const isOpen = ref(false)
const title = ref('')
const message = ref('')
const buttonText = ref('Eliminar')
const buttonColor = ref('error')
let resolver = null

function openConfirmDialog({ title: t, message: m, buttonText: bt = 'Eliminar', buttonColor: bc = 'error' }) {
  title.value = t
  message.value = m
  buttonText.value = bt
  buttonColor.value = bc
  isOpen.value = true

  return new Promise(resolve => {
    resolver = resolve
  })
}

function closeConfirmDialog(result) {
  isOpen.value = false
  if (resolver) {
    resolver(result)
    resolver = null
  }
}

export function useConfirmDeleteDialog() {
  return {
    isOpen,
    title,
    message,
    buttonText,
    buttonColor,
    openConfirmDialog,
    closeConfirmDialog,
  }
}
