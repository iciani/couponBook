<script setup>
import BaseDialog from '@/components/BaseDialog.vue'
import { notify } from '@/composables/useSnackbar'
import { useConfirmDeleteDialog } from '@/stores/confirmDeleteDialogStore'
import CouponBooksResource from '@api/resources/couponBooks.resource.js'
import CouponCodesResource from '@api/resources/couponCodes.resource.js'
import { ref, computed, onMounted, onUnmounted } from 'vue'

const { openConfirmDialog } = useConfirmDeleteDialog()

const items = ref([])
const loadingIds = ref([])
const dialog = ref(false)
const loading = ref(false)
const show = ref(false)
const action = ref("")


// Modal para generar códigos
const generateCodesDialog = ref(false)
const generateCodesLoading = ref(false)
const selectedBook = ref(null)
const codesToGenerate = ref({
  quantity: 1,
  pattern: ''
})

// Función para calcular la capacidad de un patrón
const calculatePatternCapacity = (pattern) => {
  const digits = (pattern.match(/#/g) || []).length
  const uppercase = (pattern.match(/\$/g) || []).length
  const lowercase = (pattern.match(/\*/g) || []).length
  
  const capacity = Math.pow(10, digits) * Math.pow(26, uppercase) * Math.pow(26, lowercase)
  
  return {
    capacity,
    digits,
    uppercase,
    lowercase,
    pattern: pattern
  }
}

// Función para generar un patrón con capacidad suficiente
const generateSufficientPattern = (basePattern, requiredQuantity) => {
  const baseCapacity = calculatePatternCapacity(basePattern)
  
  // Si la capacidad base es suficiente, usar el patrón original
  if (baseCapacity.capacity >= requiredQuantity) {
    return {
      pattern: basePattern,
      capacity: baseCapacity.capacity,
      isAdjusted: false
    }
  }
  
  // Calcular cuántos caracteres adicionales necesitamos
  const requiredCapacity = requiredQuantity * 1.2 // 20% de margen
  const currentCapacity = baseCapacity.capacity
  
  // Calcular el factor de multiplicación necesario
  const multiplier = Math.ceil(requiredCapacity / currentCapacity)
  
  // Generar nuevo patrón con más caracteres aleatorios
  let newPattern = basePattern
  let newCapacity = currentCapacity
  
  // Agregar dígitos si es necesario
  while (newCapacity < requiredCapacity) {
    newPattern += '#'
    newCapacity *= 10
  }
  
  return {
    pattern: newPattern,
    capacity: newCapacity,
    isAdjusted: true,
    originalPattern: basePattern
  }
}

// Función para formatear números grandes
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// Función para formatear fechas para el backend
const formatDateForBackend = (date) => {
  if (!date) return null
  if (typeof date === 'string') return date
  return date.toISOString() // Formato completo YYYY-MM-DDTHH:mm:ss.sssZ
}

// Función para formatear fechas para mostrar en el campo (dd/mm/aaaa)
const formatDateForDisplay = (date) => {
  if (!date) return ''
  if (typeof date === 'string') {
    // Si es string, convertir a Date primero
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return ''
    return formatDateToDDMMYYYY(dateObj)
  }
  if (date instanceof Date) {
    if (isNaN(date.getTime())) return ''
    return formatDateToDDMMYYYY(date)
  }
  return ''
}

// Función para formatear fechas para el VDatePicker
const formatDateForPicker = (date) => {
  if (!date) return null
  if (typeof date === 'string') return new Date(date)
  return date
}

// Función auxiliar para formatear fecha a dd/mm/aaaa
const formatDateToDDMMYYYY = (date) => {
  if (!date) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

// Estado del job
const currentJob = ref(null)
const jobStatus = ref(null)
const jobPolling = ref(null)

// Estado de los date pickers
const showStartDatePicker = ref(false)
const showEndDatePicker = ref(false)

// Patrón ajustado automáticamente según la cantidad
const adjustedPattern = computed(() => {
  if (!codesToGenerate.value.quantity || !codesToGenerate.value.pattern) {
    return null
  }
  
  return generateSufficientPattern(codesToGenerate.value.pattern, codesToGenerate.value.quantity)
})

// Información de capacidad del patrón
const patternInfo = computed(() => {
  if (!codesToGenerate.value.pattern) {
    return null
  }
  
  const baseCapacity = calculatePatternCapacity(codesToGenerate.value.pattern)
  const adjusted = adjustedPattern.value
  
  return {
    base: baseCapacity,
    adjusted: adjusted,
    isSufficient: baseCapacity.capacity >= codesToGenerate.value.quantity,
    needsAdjustment: adjusted?.isAdjusted || false
  }
})

// Validación del límite del book
const bookLimitInfo = computed(() => {
  if (!selectedBook.value || !codesToGenerate.value.quantity) {
    return null
  }
  
  const requestedQuantity = codesToGenerate.value.quantity
  const bookLimit = selectedBook.value.total_codes
  const existingCodes = selectedBook.value.codes_count || 0
  const availableSlots = bookLimit ? bookLimit - existingCodes : Infinity
  
  return {
    requestedQuantity,
    bookLimit,
    existingCodes,
    availableSlots,
    isWithinLimit: requestedQuantity <= availableSlots,
    exceedsLimit: requestedQuantity > availableSlots,
    canGenerate: requestedQuantity > 0 && requestedQuantity <= availableSlots
  }
})

const book = ref({
  name: '',
  code_pattern: '',
  total_codes: null,
  allow_multiple_redemptions_per_user: false,
  per_user_max_assigned_codes: null,
  per_user_max_redemptions: null,
  start_at: '',
  end_at: '',
  status: 'ACTIVE',
})

const headers = [
  { title: "Nombre", key: "name" },
  { title: "Patrón de Código", key: "code_pattern", align: "center", sortable: false },
  { title: "Códigos Generados", key: "codes_count", align: "center" },
  { title: "Máx. Códigos", key: "total_codes", align: "center" },
  { title: "Estado", key: "status", align: "center" },
  { title: "Acciones", key: "actions", sortable: false },
]

const isShow = computed(() => {
  return action.value === "Ver"
})  

const getBooks = async () => {
  try {
    loading.value = true
    const response = await CouponBooksResource.getAll()
    items.value = response.data.data
  } catch (error) {
    console.error('Error al cargar books:', error)
    notify('Error al cargar books. Verifique la conexión con el servidor.', 'error')
    items.value = []
  } finally {
    loading.value = false
  }
}

const createBook = async () => {
  loading.value = true

  // Validar campos obligatorios
  if (!book.value.name || book.value.name.trim() === '') {
    notify('El nombre del book es obligatorio', 'error')
    loading.value = false
    return
  }

  // Validar total_codes si se proporciona
  if (book.value.total_codes !== null && book.value.total_codes !== '' && (isNaN(book.value.total_codes) || book.value.total_codes < 0)) {
    notify('El total de códigos debe ser un número mayor o igual a 0', 'error')
    loading.value = false
    return
  }

  try {
    const bookData = {
      name: book.value.name.trim(),
      code_pattern: book.value.code_pattern || null,
      total_codes: book.value.total_codes || null,
      allow_multiple_redemptions_per_user: book.value.allow_multiple_redemptions_per_user || false,
      per_user_max_assigned_codes: book.value.per_user_max_assigned_codes || null,
      per_user_max_redemptions: book.value.per_user_max_redemptions || null,
      start_at: formatDateForBackend(book.value.start_at),
      end_at: formatDateForBackend(book.value.end_at),
    }
    
    const response = await CouponBooksResource.create(bookData)
    
    notify('Book creado correctamente.', 'success')
    closeDialog()
    getBooks()
  } catch (error) {
    console.error('Error creando book:', error)
    
    // Manejar errores de validación específicos
    if (error.response?.data?.errors) {
      const validationErrors = error.response.data.errors
      const errorMessages = validationErrors.map(err => err.message).join(', ')
      notify(`Error de validación: ${errorMessages}`, 'error')
    } else {
      const errorMessage = error.response?.data?.message || 'Error creando book.'
      notify(errorMessage, 'error')
    }
  } finally {
    loading.value = false
  }
}

const save = async () => {
  if (action.value === 'Crear') {
    await createBook()
  } else if (action.value === 'Editar') {
    await updateBook()
  }
}

const closeDialog = () => {
  dialog.value = false
  resetModel()
}

const updateBook = async () => {
  const id = book.value.id

  if (!id) {
    notify('Error: ID del book no encontrado', 'error')
    return
  }

  // Validar campos obligatorios
  if (!book.value.name || book.value.name.trim() === '') {
    notify('El nombre del book es obligatorio', 'error')
    return
  }

  // Validar total_codes si se proporciona
  if (book.value.total_codes !== null && book.value.total_codes !== '' && (isNaN(book.value.total_codes) || book.value.total_codes < 0)) {
    notify('El total de códigos debe ser un número mayor o igual a 0', 'error')
    return
  }

  loadingIds.value.push(id)

  try {
    const bookData = {
      name: book.value.name.trim(),
      code_pattern: book.value.code_pattern || null,
      total_codes: book.value.total_codes || null,
      allow_multiple_redemptions_per_user: book.value.allow_multiple_redemptions_per_user || false,
      per_user_max_assigned_codes: book.value.per_user_max_assigned_codes || null,
      per_user_max_redemptions: book.value.per_user_max_redemptions || null,
      start_at: formatDateForBackend(book.value.start_at),
      end_at: formatDateForBackend(book.value.end_at),
      status: book.value.status,
    }

    await CouponBooksResource.update(id, bookData)
    notify('Book actualizado correctamente.', 'success')
    closeDialog()
    getBooks()
  } catch (error) {
    console.error('Error actualizando book:', error)
    
    // Manejar errores de validación específicos
    if (error.response?.data?.errors) {
      const validationErrors = error.response.data.errors
      const errorMessages = validationErrors.map(err => err.message).join(', ')
      notify(`Error de validación: ${errorMessages}`, 'error')
    } else {
      const errorMessage = error.response?.data?.message || 'Error actualizando book.'
      notify(errorMessage, 'error')
    }
  } finally {
    loadingIds.value = loadingIds.value.filter(i => i !== id)
  }
}

const showBook = async item => {
  // Mapear campos del backend al frontend
  book.value = {
    id: item.id,
    name: item.name,
    code_pattern: item.code_pattern,
    total_codes: item.total_codes,
    allow_multiple_redemptions_per_user: item.allow_multiple_redemptions_per_user,
    per_user_max_assigned_codes: item.per_user_max_assigned_codes,
    per_user_max_redemptions: item.per_user_max_redemptions,
    start_at: item.start_at ? new Date(item.start_at) : null,
    end_at: item.end_at ? new Date(item.end_at) : null,
    status: item.status,
  }
  action.value = "Ver"
  dialog.value = true
}

const pauseBook = async item => {
  const confirmed = await openConfirmDialog({
    title: '¿Pausar book?',
    message: `¿Estás seguro de que querés pausar "${item.name}"?`,
    buttonText: 'Pausar',
    buttonColor: 'warning',
  })

  if (!confirmed) return

  loadingIds.value.push(item.id)
  try {
    await CouponBooksResource.pause(item.id)
    getBooks()
    notify('Book pausado correctamente.', 'success')
  } catch (error) {
    notify('Error pausando book.', 'error')
  } finally {
    loadingIds.value = loadingIds.value.filter(i => i !== item.id)
  }
}

const archiveBook = async item => {
  const confirmed = await openConfirmDialog({
    title: '¿Archivar book?',
    message: `¿Estás seguro de que querés archivar "${item.name}"?`,
    buttonText: 'Archivar',
    buttonColor: 'error',
  })

  if (!confirmed) return

  loadingIds.value.push(item.id)
  try {
    await CouponBooksResource.archive(item.id)
    getBooks()
    notify('Book archivado correctamente.', 'success')
  } catch (error) {
    notify('Error archivando book.', 'error')
  } finally {
    loadingIds.value = loadingIds.value.filter(i => i !== item.id)
  }
}

const reactivateBook = async item => {
  const confirmed = await openConfirmDialog({
    title: '¿Reactivar book?',
    message: `¿Estás seguro de que querés reactivar "${item.name}"?`,
    buttonText: 'Reactivar',
    buttonColor: 'success',
  })

  if (!confirmed) return

  loadingIds.value.push(item.id)
  try {
    await CouponBooksResource.reactivate(item.id)
    getBooks()
    notify('Book reactivado correctamente.', 'success')
  } catch (error) {
    notify('Error reactivando book.', 'error')
  } finally {
    loadingIds.value = loadingIds.value.filter(i => i !== item.id)
  }
}

const openDialog = (item = null) => {
  
  if (item) {
    // Mapear campos del backend al frontend
    book.value = {
      id: item.id,
      name: item.name,
      code_pattern: item.code_pattern,
      total_codes: item.total_codes,
      allow_multiple_redemptions_per_user: item.allow_multiple_redemptions_per_user,
      per_user_max_assigned_codes: item.per_user_max_assigned_codes,
      per_user_max_redemptions: item.per_user_max_redemptions,
      start_at: item.start_at ? new Date(item.start_at) : null,
      end_at: item.end_at ? new Date(item.end_at) : null,
      status: item.status,
    }
    action.value = "Editar"

  } else {
    resetModel()
    action.value = "Crear"
  }

  dialog.value = true
}

const resetModel = () => {
  book.value = {
    name: '',
    code_pattern: '',
    total_codes: null,
    allow_multiple_redemptions_per_user: false,
    per_user_max_assigned_codes: null,
    per_user_max_redemptions: null,
    start_at: null,
    end_at: null,
    status: 'ACTIVE',
  }
}

const openGenerateCodesDialog = (item) => {
  selectedBook.value = item
  codesToGenerate.value = {
    quantity: 1,
    pattern: item.code_pattern || ''
  }
  
  // Resetear estado del job si existe
  if (currentJob.value) {
    stopJobPolling()
    currentJob.value = null
    jobStatus.value = null
  }
  
  generateCodesDialog.value = true
}

const generateCodes = async () => {
  if (!selectedBook.value) return

  // Validar límite del book
  if (bookLimitInfo.value && bookLimitInfo.value.exceedsLimit) {
    notify(`No se pueden generar ${formatNumber(codesToGenerate.value.quantity)} códigos. Límite disponible: ${formatNumber(bookLimitInfo.value.availableSlots)}`, 'error')
    return
  }

  generateCodesLoading.value = true

  try {
    // Usar el patrón ajustado automáticamente
    const finalPattern = adjustedPattern.value?.pattern || codesToGenerate.value.pattern
    
    const data = {
      bookId: selectedBook.value.id,
      quantity: parseInt(codesToGenerate.value.quantity),
      pattern: finalPattern || undefined,
      useQueue: true
    }

    const response = await CouponCodesResource.generateCodes(data)
    generateCodesDialog.value = false
    
    // Siempre es un job encolado
    currentJob.value = response.data.data
    notify(`Job encolado: ${response.data.message}`, 'info')
    startJobPolling()
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Error generando códigos'
    notify(errorMessage, 'error')
  } finally {
    generateCodesLoading.value = false
  }
}

const startJobPolling = () => {
  if (!currentJob.value) return

  jobPolling.value = setInterval(async () => {
    try {
      const response = await CouponCodesResource.getJobStatus(currentJob.value.jobId)
      jobStatus.value = response.data.data
      
      if (jobStatus.value.state === 'completed') {
        notify(`Job completado: Se generaron ${jobStatus.value.returnValue.generatedCount} códigos`, 'success')
        stopJobPolling()
        generateCodesDialog.value = false
        getBooks() // Refrescar la lista
      } else if (jobStatus.value.state === 'failed') {
        notify(`Job falló: ${jobStatus.value.failedReason}`, 'error')
        stopJobPolling()
      }
    } catch (error) {
      console.error('Error consultando estado del job:', error)
    }
  }, 2000)
}

const stopJobPolling = () => {
  if (jobPolling.value) {
    clearInterval(jobPolling.value)
    jobPolling.value = null
  }
  currentJob.value = null
  jobStatus.value = null
}

const closeGenerateCodesDialog = () => {
  stopJobPolling()
  generateCodesDialog.value = false
  codesToGenerate.value = {
    quantity: 1,
    pattern: ''
  }
}

const formatDuration = (endTime, startTime) => {
  if (!endTime || !startTime) return 'N/A'
  const duration = new Date(endTime) - new Date(startTime)
  const seconds = Math.floor(duration / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

onMounted(() => {
  getBooks()
})

onUnmounted(() => {
  stopJobPolling() // Limpiar polling al desmontar el componente
})
</script>

<template>
  <div>
    <VCard class="height-container pa-4">
      <template #title>
        <div class="d-flex justify-space-between pb-10">
          <h2>Coupon Books</h2>
          <div class="d-flex gap-2">
            <VBtn
              size="small"
              color="secondary"
              variant="outlined"
              :loading="loading"
              @click="getBooks"
              title="Actualizar datos"
            >
              <VIcon class="mr-1">ri-refresh-line</VIcon>
              Actualizar
            </VBtn>
            <VBtn
              size="small"
              color="primary"
              @click="openDialog(null)"
            >
              Crear Book
            </VBtn>
          </div>
        </div>
      </template>

      <VDataTable
        :headers="headers"
        :items="items"
        class="mt-4"
        :loading="loading.value"
      >
        <template #item.codes_count="{ item }">
          <div class="text-center">
            <div class="text-h6">{{ formatNumber(item.codes_count || 0) }}</div>
            <div class="text-caption text-medium-emphasis">
              códigos generados
            </div>
          </div>
        </template>

        <template #item.total_codes="{ item }">
          <div class="text-center">
            <div class="text-h6">{{ item.total_codes ? formatNumber(item.total_codes) : '∞' }}</div>
          </div>
        </template>

        <template #item.status="{ item }">
          <VChip
            :color="item.status === 'ACTIVE' ? 'success' : item.status === 'PAUSED' ? 'warning' : 'error'"
            size="small"
          >
            {{ item.status }}
          </VChip>
        </template>

        <template #item.actions="{ item }">
          <VIcon
            class="mr-2"
            @click="showBook(item)"
            title="Ver detalles"
          >
            ri-eye-line
          </VIcon>
          <VIcon
            class="mr-2"
            @click="openDialog(item)"
            title="Editar"
          >
            ri-edit-2-line
          </VIcon>
          <VIcon
            v-if="item.status === 'ACTIVE'"
            color="primary"
            class="mr-2"
            @click="openGenerateCodesDialog(item)"
            title="Generar códigos"
          >
            ri-add-circle-line
          </VIcon>
          <VIcon
            v-if="item.status === 'ACTIVE'"
            color="warning"
            class="mr-2"
            @click="pauseBook(item)"
            title="Pausar"
          >
            ri-pause-line
          </VIcon>
          <VIcon
            v-if="item.status === 'PAUSED'"
            color="success"
            class="mr-2"
            @click="reactivateBook(item)"
            title="Reactivar"
          >
            ri-play-line
          </VIcon>
          <VIcon
            v-if="item.status === 'PAUSED'"
            color="error"
            class="mr-2"
            @click="archiveBook(item)"
            title="Archivar"
          >
            ri-archive-line
          </VIcon>
        </template>
      </VDataTable>
    </VCard>

    <BaseDialog v-model="dialog" maxWidth="800">
      <template #title>
        {{ `${action} Book` }}
      </template> 

      <template #message>
        {{ !isShow ? 'Ingrese los datos del book' : null }}
      </template>

      <template #default>
        <VForm @submit.prevent="() => {}">
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="book.name"
                :disabled="isShow"
                label="Nombre"
                placeholder="Nombre del book"
                required
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="book.code_pattern"
                :disabled="isShow"
                label="Patrón de Código"
                placeholder="Ej: BOOK-{RANDOM}"
              />
            </VCol>
          </VRow>
          
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="book.total_codes"
                :disabled="isShow"
                label="Total de Códigos"
                type="number"
                placeholder="0"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="book.status"
                :disabled="isShow"
                label="Estado"
                :items="[
                  { value: 'ACTIVE', title: 'Activo' },
                  { value: 'PAUSED', title: 'Pausado' },
                  { value: 'ARCHIVED', title: 'Archivado' }
                ]"
              />
            </VCol>
          </VRow>

          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VMenu
                v-model="showStartDatePicker"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template #activator="{ props }">
                  <VTextField
                    v-bind="props"
                    :model-value="formatDateForDisplay(book.start_at)"
                    :disabled="isShow"
                    label="Fecha de Inicio"
                    prepend-inner-icon="ri-calendar-line"
                    :hint="book.start_at ? 'Fecha de inicio configurada' : 'Opcional - Sin fecha de inicio'"
                    persistent-hint
                    readonly
                    @click="showStartDatePicker = true"
                  />
                </template>
                <VDatePicker
                  :model-value="formatDateForPicker(book.start_at)"
                  :disabled="isShow"
                  locale="es"
                  :format="(date) => formatDateToDDMMYYYY(date)"
                  @update:model-value="(date) => { book.start_at = date; showStartDatePicker = false }"
                />
              </VMenu>
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VMenu
                v-model="showEndDatePicker"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template #activator="{ props }">
                  <VTextField
                    v-bind="props"
                    :model-value="formatDateForDisplay(book.end_at)"
                    :disabled="isShow"
                    label="Fecha de Fin"
                    prepend-inner-icon="ri-calendar-line"
                    :hint="book.end_at ? 'Fecha de fin configurada' : 'Opcional - Sin fecha de fin'"
                    persistent-hint
                    readonly
                    @click="showEndDatePicker = true"
                  />
                </template>
                <VDatePicker
                  :model-value="formatDateForPicker(book.end_at)"
                  :disabled="isShow"
                  locale="es"
                  :format="(date) => formatDateToDDMMYYYY(date)"
                  @update:model-value="(date) => { book.end_at = date; showEndDatePicker = false }"
                />
              </VMenu>
            </VCol>
          </VRow>

          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="book.per_user_max_assigned_codes"
                :disabled="isShow"
                label="Máx. Códigos por Usuario"
                type="number"
                placeholder="0"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="book.per_user_max_redemptions"
                :disabled="isShow"
                label="Máx. Canjes por Usuario"
                type="number"
                placeholder="0"
              />
            </VCol>
          </VRow>

          <VRow>
            <VCol
              cols="12"
              md="12"
            >
              <VSwitch
                v-model="book.allow_multiple_redemptions_per_user"
                :disabled="isShow"
                label="Permitir múltiples canjes por usuario"
              />
            </VCol>
          </VRow>
        </VForm>
      </template>

      <template #actions>
        <VSpacer />
        <VBtn
          color="grey"
          @click="closeDialog"
        >
          Cerrar
        </VBtn>
        <VBtn
          v-if="!isShow"
          color="primary"
          variant="flat"
          :loading="loading"
          :disabled="loading"
          @click="save"
        >
          Guardar
        </VBtn>
      </template>
    </BaseDialog>


    <!-- Modal para generar códigos -->
    <BaseDialog v-model="generateCodesDialog" maxWidth="800">
      <template #title>
        Generar Códigos - {{ selectedBook?.name }}
      </template>

      <template #message>
        Generar códigos de cupones para este book
      </template>

      <template #default>
        <VForm @submit.prevent="generateCodes">
          <VRow>
            <VCol cols="12" md="6">
              <VTextField
                v-model.number="codesToGenerate.quantity"
                label="Cantidad de códigos"
                type="number"
                min="1"
                :max="bookLimitInfo?.availableSlots || 999999"
                required
                :hint="bookLimitInfo ? `Disponible: ${formatNumber(bookLimitInfo.availableSlots)} de ${formatNumber(bookLimitInfo.bookLimit || '∞')}` : 'Sin límite'"
                persistent-hint
                :error="bookLimitInfo?.exceedsLimit || false"
                :error-messages="bookLimitInfo?.exceedsLimit ? [`Excede el límite disponible por ${formatNumber(bookLimitInfo.requestedQuantity - bookLimitInfo.availableSlots)} códigos`] : []"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField
                v-model="codesToGenerate.pattern"
                label="Patrón de código"
                :placeholder="selectedBook?.code_pattern || 'Ej: CODE-####'"
                :hint="selectedBook?.code_pattern ? `Patrón del book: ${selectedBook.code_pattern}` : 'Usar patrón del book'"
                persistent-hint
              />
            </VCol>
          </VRow>
          
          <!-- Información de límite del book -->
          <VRow v-if="bookLimitInfo">
            <VCol cols="12">
              <VAlert
                :type="bookLimitInfo.isWithinLimit ? 'info' : 'error'"
                variant="tonal"
                class="mb-4"
              >
                <template #title>
                  {{ bookLimitInfo.isWithinLimit ? 'Límite del Book' : 'Límite Excedido' }}
                </template>
                
                <div class="text-body-2">
                  <div class="mb-2">
                    <strong>Book:</strong> {{ selectedBook?.name }}
                    <br>
                    <strong>Límite total:</strong> {{ formatNumber(bookLimitInfo.bookLimit || '∞') }} códigos
                    <br>
                    <strong>Códigos existentes:</strong> {{ formatNumber(bookLimitInfo.existingCodes) }} códigos
                    <br>
                    <strong>Disponible:</strong> {{ formatNumber(bookLimitInfo.availableSlots) }} códigos
                  </div>
                  
                  <div class="text-caption">
                    <strong>Solicitados:</strong> {{ formatNumber(bookLimitInfo.requestedQuantity) }} códigos
                    <span v-if="bookLimitInfo.isWithinLimit" class="text-success">
                      ✓ Dentro del límite disponible
                    </span>
                    <span v-else class="text-error">
                      ✗ Excede el límite por {{ formatNumber(bookLimitInfo.requestedQuantity - bookLimitInfo.availableSlots) }} códigos
                    </span>
                  </div>
                </div>
              </VAlert>
            </VCol>
          </VRow>
          
          <!-- Información de capacidad del patrón -->
          <VRow v-if="patternInfo">
            <VCol cols="12">
              <VAlert
                :type="patternInfo.isSufficient ? 'success' : 'warning'"
                variant="tonal"
                class="mb-4"
              >
                <template #title>
                  {{ patternInfo.isSufficient ? 'Patrón Suficiente' : 'Patrón Insuficiente' }}
                </template>
                
                <div class="text-body-2">
                  <div class="mb-2">
                    <strong>Patrón base:</strong> {{ codesToGenerate.pattern }}
                    <br>
                    <strong>Capacidad:</strong> {{ formatNumber(patternInfo.base.capacity) }} códigos únicos
                  </div>
                  
                  <div v-if="patternInfo.needsAdjustment" class="mb-2">
                    <strong>Patrón ajustado:</strong> {{ patternInfo.adjusted.pattern }}
                    <br>
                    <strong>Nueva capacidad:</strong> {{ formatNumber(patternInfo.adjusted.capacity) }} códigos únicos
                    <br>
                    <em class="text-caption">Se agregaron {{ patternInfo.adjusted.pattern.length - codesToGenerate.pattern.length }} caracteres aleatorios</em>
                  </div>
                  
                  <div class="text-caption">
                    <strong>Solicitados:</strong> {{ formatNumber(codesToGenerate.quantity) }} códigos
                    <span v-if="patternInfo.isSufficient" class="text-success">
                      ✓ El patrón base es suficiente
                    </span>
                    <span v-else class="text-warning">
                      ⚠ Se ajustará automáticamente el patrón
                    </span>
                  </div>
                </div>
              </VAlert>
            </VCol>
          </VRow>

          <VRow v-if="selectedBook?.total_codes">
            <VCol cols="12">
              <VAlert
                type="info"
                variant="tonal"
                class="mb-0"
              >
                <template #text>
                  <div class="text-body-2">
                    <strong>Información del Book:</strong><br>
                    • Códigos existentes: {{ formatNumber(selectedBook.codes_count || 0) }}<br>
                    • Máximo permitido: {{ formatNumber(selectedBook.total_codes) }}<br>
                    • Códigos disponibles: {{ formatNumber((selectedBook.total_codes || 0) - (selectedBook.codes_count || 0)) }}
                  </div>
                </template>
              </VAlert>
            </VCol>
          </VRow>

          <!-- Progreso del job -->
          <VRow v-if="currentJob && jobStatus">
            <VCol cols="12">
              <VAlert
                :type="jobStatus.state === 'failed' ? 'error' : jobStatus.state === 'completed' ? 'success' : 'info'"
                variant="tonal"
                class="mb-0"
              >
                <template #text>
                  <div class="text-body-2">
                    <strong>Estado del Job:</strong><br>
                    • ID: {{ currentJob.jobId }}<br>
                    • Estado: {{ jobStatus.state }}<br>
                    <div v-if="jobStatus.state === 'active'">
                      • Progreso: {{ jobStatus.progress }}%<br>
                      <VProgressLinear
                        :model-value="jobStatus.progress"
                        color="primary"
                        height="8"
                        class="mt-2"
                      />
                    </div>
                    <div v-if="jobStatus.state === 'completed'">
                      • Códigos generados: {{ jobStatus.returnValue?.generatedCount || 'N/A' }}<br>
                      • Tiempo total: {{ formatDuration(jobStatus.finishedAt, jobStatus.createdAt) }}
                    </div>
                    <div v-if="jobStatus.state === 'failed'">
                      • Error: {{ jobStatus.failedReason }}
                    </div>
                  </div>
                </template>
              </VAlert>
            </VCol>
          </VRow>

          <VRow>
            <VCol cols="12">
              <VAlert
                type="warning"
                variant="tonal"
                class="mb-0"
              >
                <template #text>
                  <div class="text-body-2">
                    <strong>Patrones soportados:</strong><br>
                    • <code>#</code> = Números (0-9)<br>
                    • <code>$</code> = Letras mayúsculas (A-Z)<br>
                    • <code>*</code> = Letras minúsculas (a-z)<br>
                    <strong>Ejemplo:</strong> <code>CODE-####</code> genera códigos como <code>CODE-1234</code><br>
                    <strong>Nota:</strong> La generación de códigos se procesa en segundo plano
                  </div>
                </template>
              </VAlert>
            </VCol>
          </VRow>
        </VForm>
      </template>

      <template #actions>
        <VSpacer />
        <VBtn
          color="grey"
          @click="closeGenerateCodesDialog"
        >
          Cancelar
        </VBtn>
        <VBtn
          color="primary"
          variant="flat"
          :loading="generateCodesLoading || (currentJob && jobStatus?.state === 'active')"
          :disabled="generateCodesLoading || !codesToGenerate.quantity || codesToGenerate.quantity <= 0 || (currentJob && jobStatus?.state === 'active') || (bookLimitInfo?.exceedsLimit || false)"
          @click="generateCodes"
        >
          {{ currentJob && jobStatus?.state === 'active' ? 'Generando...' : 'Generar Códigos' }}
        </VBtn>
      </template>
    </BaseDialog>
  </div>
</template>
