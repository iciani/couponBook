<script setup>
import { ref, onMounted, computed } from 'vue'
import { notify } from '@/composables/useSnackbar'
import CouponAssignmentsResource from '@api/resources/couponAssignments.resource.js'
import UserResource from '@api/resources/user.resource.js'
import CouponBooksResource from '@api/resources/couponBooks.resource.js'

const loading = ref(false)
const assignments = ref([])
const users = ref([])
const selectedUserId = ref('')
const loadingUsers = ref(false)

// Variables para asignación de cupones
const assignCouponsDialog = ref(false)
const books = ref([])
const assignmentData = ref({
  bookId: '',
  quantity: 1,
  couponCode: ''
})

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Usuario', key: 'user.name', sortable: true },
  { title: 'Código', key: 'code.code', sortable: true },
  { title: 'Book', key: 'code.book.name', sortable: true },
  { title: 'Estado', key: 'status', sortable: true },
  { title: 'Asignado', key: 'assigned_at', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false },
]

const filteredAssignments = computed(() => {
  if (!selectedUserId.value) return []
  return assignments.value.filter(assignment => String(assignment.user_id) === String(selectedUserId.value))
})

const getUsers = async () => {
  try {
    loadingUsers.value = true
    const response = await UserResource.getAll()
    users.value = response.data.data
  } catch (error) {
    console.error('Error cargando usuarios:', error)
    notify('Error cargando usuarios', 'error')
  } finally {
    loadingUsers.value = false
  }
}

// Funciones para el estado del cupón
const getCouponStatusColor = (status) => {
  switch (status) {
    case 'AVAILABLE': return 'info'
    case 'ASSIGNED': return 'warning'
    case 'TEMP_LOCKED': return 'orange'
    case 'REDEEMED': return 'success'
    case 'DISABLED': return 'error'
    case 'EXPIRED': return 'grey'
    default: return 'grey'
  }
}

const getCouponStatusIcon = (status) => {
  switch (status) {
    case 'AVAILABLE': return 'ri-checkbox-circle-line'
    case 'ASSIGNED': return 'ri-user-line'
    case 'TEMP_LOCKED': return 'ri-lock-line'
    case 'REDEEMED': return 'ri-gift-line'
    case 'DISABLED': return 'ri-close-circle-line'
    case 'EXPIRED': return 'ri-time-line'
    default: return 'ri-question-line'
  }
}

const getCouponStatusText = (status) => {
  switch (status) {
    case 'AVAILABLE': return 'Disponible'
    case 'ASSIGNED': return 'Asignado'
    case 'TEMP_LOCKED': return 'Bloqueado'
    case 'REDEEMED': return 'Canjeado'
    case 'DISABLED': return 'Deshabilitado'
    case 'EXPIRED': return 'Expirado'
    default: return 'Desconocido'
  }
}

const getAssignments = async () => {
  if (!selectedUserId.value) {
    assignments.value = []
    return
  }

  try {
    loading.value = true
    const response = await CouponAssignmentsResource.getUserAssignments(selectedUserId.value)
    assignments.value = response.data.data
  } catch (error) {
    console.error('Error cargando asignaciones:', error)
    notify('Error cargando asignaciones del usuario', 'error')
    assignments.value = []
  } finally {
    loading.value = false
  }
}

const onUserChange = () => {
  if (selectedUserId.value) {
    getAssignments()
  } else {
    assignments.value = []
  }
}

const formatDate = (date) => {
  if (!date) return 'No asignado'
  return new Date(date).toLocaleDateString('es-ES')
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    notify('Código copiado al portapapeles', 'success')
  } catch (error) {
    console.error('Error copiando al portapapeles:', error)
    notify('Error copiando al portapapeles', 'error')
  }
}

const unassignCoupon = async (assignment) => {
  try {
    await CouponAssignmentsResource.unassignCoupon(assignment.id)
    notify('Cupón desasignado correctamente', 'success')
    getAssignments() // Refrescar la lista
  } catch (error) {
    console.error('Error desasignando cupón:', error)
    const errorMessage = error.response?.data?.message || 'Error desasignando cupón'
    notify(errorMessage, 'error')
  }
}

// Funciones para asignación de cupones
const openAssignCouponsDialog = async () => {
  if (!selectedUserId.value) {
    notify('Por favor selecciona un usuario primero', 'warning')
    return
  }
  
  assignmentData.value = {
    bookId: '',
    quantity: 1,
    couponCode: ''
  }
  assignCouponsDialog.value = true
  await loadBooks()
}

const loadBooks = async () => {
  try {
    const response = await CouponBooksResource.getAll()
    books.value = response.data.data
  } catch (error) {
    console.error('Error cargando books:', error)
    notify('Error cargando books', 'error')
  }
}

const assignRandomCoupons = async () => {
  if (!assignmentData.value.bookId || !assignmentData.value.quantity) {
    notify('Por favor selecciona un book y especifica la cantidad', 'warning')
    return
  }

  loading.value = true
  try {
    const response = await CouponAssignmentsResource.assignRandomCoupons({
      bookId: assignmentData.value.bookId,
      userId: selectedUserId.value,
      quantity: assignmentData.value.quantity
    })

    notify(`Se asignaron ${response.data.data.totalAssigned} cupones correctamente`, 'success')
    await getAssignments()
    assignmentData.value = { bookId: '', quantity: 1, couponCode: '' }
    assignCouponsDialog.value = false
  } catch (error) {
    console.error('Error asignando cupones:', error)
    const errorMessage = error.response?.data?.message || 'Error asignando cupones'
    notify(errorMessage, 'error')
  } finally {
    loading.value = false
  }
}

const assignSpecificCoupon = async () => {
  if (!assignmentData.value.couponCode) {
    notify('Por favor ingresa el código del cupón', 'warning')
    return
  }

  loading.value = true
  try {
    const response = await CouponAssignmentsResource.assignSpecificCoupon({
      code: assignmentData.value.couponCode,
      userId: selectedUserId.value
    })

    notify(`Cupón ${assignmentData.value.couponCode} asignado correctamente`, 'success')
    await getAssignments()
    assignmentData.value = { bookId: '', quantity: 1, couponCode: '' }
    assignCouponsDialog.value = false
  } catch (error) {
    console.error('Error asignando cupón específico:', error)
    const errorMessage = error.response?.data?.message || 'Error asignando cupón'
    notify(errorMessage, 'error')
  } finally {
    loading.value = false
  }
}

const closeAssignCouponsDialog = () => {
  assignCouponsDialog.value = false
  assignmentData.value = { bookId: '', quantity: 1, couponCode: '' }
}

onMounted(() => {
  getUsers()
})
</script>

<template>
  <div>
    <VCard class="height-container pa-4">
      <template #title>
        <div class="d-flex justify-space-between align-center pb-4">
          <h2>Asignaciones de Cupones</h2>
        </div>
      </template>

      <!-- Filtro por Usuario -->
      <VRow class="mb-4">
        <VCol cols="12">
          <div class="d-flex align-center gap-4">
            <VSelect
              v-model="selectedUserId"
              :items="users"
              item-title="name"
              item-value="id"
              label="Seleccionar Usuario"
              placeholder="Selecciona un usuario para ver sus asignaciones"
              :loading="loadingUsers"
              clearable
              style="min-width: 300px;"
              @update:model-value="onUserChange"
            >
              <template #prepend-inner>
                <VIcon>ri-user-line</VIcon>
              </template>
            </VSelect>
            
            <div class="d-flex gap-2">
              <VChip
                v-if="selectedUserId"
                color="primary"
                variant="tonal"
              >
                {{ users.find(u => u.id === parseInt(selectedUserId))?.name || 'Usuario' }}
              </VChip>
              <VChip
                v-if="filteredAssignments.length > 0"
                color="success"
                variant="tonal"
              >
                {{ filteredAssignments.length }} asignación(es)
              </VChip>
            </div>
            
            <!-- Botón de Asignación -->
            <VBtn
              v-if="selectedUserId"
              color="primary"
              variant="elevated"
              @click="openAssignCouponsDialog"
              :loading="loading"
            >
              <VIcon class="mr-2">ri-gift-line</VIcon>
              Asignar Cupones
            </VBtn>
          </div>
        </VCol>
      </VRow>

      <!-- Tabla de Asignaciones -->
      <div v-if="selectedUserId" class="mt-2">
        <VDataTable
          :headers="headers"
          :items="filteredAssignments"
          :loading="loading"
          :items-per-page="10"
          class="elevation-1"
        >
        <template #item.user.name="{ item }">
          <div class="d-flex align-center">
            <VIcon class="mr-2">ri-user-line</VIcon>
            {{ item.user?.name || users.find(u => u.id === item.user_id)?.name || 'N/A' }}
          </div>
        </template>

        <template #item.code.code="{ item }">
          <div class="d-flex align-center">
            <code class="text-primary">{{ item.code?.code || 'N/A' }}</code>
            <VBtn
              v-if="item.code?.code"
              size="x-small"
              variant="text"
              icon
              @click="copyToClipboard(item.code.code)"
              class="ml-2"
            >
              <VIcon size="16">ri-file-copy-line</VIcon>
            </VBtn>
          </div>
        </template>

        <template #item.code.book.name="{ item }">
          <div class="d-flex align-center">
            <VIcon class="mr-2">ri-book-line</VIcon>
            {{ item.code?.book?.name || 'N/A' }}
          </div>
        </template>

        <template #item.status="{ item }">
          <VChip
            :color="getCouponStatusColor(item.code?.status)"
            size="small"
          >
            <VIcon
              :icon="getCouponStatusIcon(item.code?.status)"
              class="mr-1"
              size="14"
            />
            {{ getCouponStatusText(item.code?.status) }}
          </VChip>
        </template>

        <template #item.assigned_at="{ item }">
          <div class="d-flex align-center">
            <VIcon class="mr-2">ri-calendar-line</VIcon>
            {{ formatDate(item.assigned_at) }}
          </div>
        </template>

        <template #item.actions="{ item }">
          <VBtn
            v-if="item.code?.status === 'ASSIGNED'"
            color="error"
            size="small"
            variant="outlined"
            @click="unassignCoupon(item)"
          >
            <VIcon class="mr-1">ri-user-unfollow-line</VIcon>
            Desasignar
          </VBtn>
        </template>

        <template #no-data>
          <div class="text-center pa-8">
            <VIcon size="64" color="grey">ri-gift-line</VIcon>
            <p class="text-h6 mt-2">No hay asignaciones</p>
            <p class="text-body-2 text-medium-emphasis">
              Este usuario no tiene cupones asignados
            </p>
          </div>
        </template>
        </VDataTable>
      </div>

      <!-- Estado inicial -->
      <div v-else class="text-center pa-8">
        <VIcon size="64" color="grey">ri-search-line</VIcon>
        <p class="text-h6 mt-2">Selecciona un Usuario</p>
        <p class="text-body-2 text-medium-emphasis">
          Elige un usuario del filtro para ver sus asignaciones de cupones
        </p>
      </div>
    </VCard>

    <!-- Modal de Asignación de Cupones -->
    <VDialog v-model="assignCouponsDialog" max-width="800">
      <VCard>
        <VCardTitle>
          <div class="d-flex justify-space-between align-center">
            <span>Asignar Cupones a {{ users.find(u => u.id === parseInt(selectedUserId))?.name }}</span>
            <VBtn
              icon
              variant="text"
              @click="closeAssignCouponsDialog"
            >
              <VIcon>ri-close-line</VIcon>
            </VBtn>
          </div>
        </VCardTitle>

        <VCardText>
          <VRow>
            <!-- Asignación Aleatoria -->
            <VCol cols="12" md="6">
              <VCard variant="outlined">
                <VCardTitle class="text-h6">Asignación Aleatoria</VCardTitle>
                <VCardText>
                  <VSelect
                    v-model="assignmentData.bookId"
                    :items="books"
                    item-title="name"
                    item-value="id"
                    label="Seleccionar Book"
                    class="mb-3"
                  />
                  <VTextField
                    v-model="assignmentData.quantity"
                    label="Cantidad de cupones"
                    type="number"
                    min="1"
                    class="mb-3"
                  />
                  <VBtn
                    color="primary"
                    :loading="loading"
                    :disabled="!assignmentData.bookId || !assignmentData.quantity"
                    @click="assignRandomCoupons"
                    block
                  >
                    <VIcon class="mr-2">ri-gift-line</VIcon>
                    Asignar Cupones Aleatorios
                  </VBtn>
                </VCardText>
              </VCard>
            </VCol>

            <!-- Asignación Específica -->
            <VCol cols="12" md="6">
              <VCard variant="outlined">
                <VCardTitle class="text-h6">Asignación Específica</VCardTitle>
                <VCardText>
                  <VTextField
                    v-model="assignmentData.couponCode"
                    label="Código del cupón"
                    placeholder="Ej: SPRING-1234"
                    class="mb-3"
                  />
                  <VBtn
                    color="secondary"
                    :loading="loading"
                    :disabled="!assignmentData.couponCode"
                    @click="assignSpecificCoupon"
                    block
                  >
                    <VIcon class="mr-2">ri-user-add-line</VIcon>
                    Asignar Cupón Específico
                  </VBtn>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>
