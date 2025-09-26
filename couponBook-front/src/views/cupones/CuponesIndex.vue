<template>
  <div>
    <VCard class="height-container pa-4">
      <template #title>
        <div class="d-flex justify-space-between pb-10">
          <h2>Códigos de Cupones</h2>
          <VBtn
            size="small"
            color="primary"
            @click="refreshData"
            :loading="loading"
          >
            <VIcon class="mr-2">ri-refresh-line</VIcon>
            Actualizar
          </VBtn>
        </div>
      </template>

      <!-- Filtros -->
      <VRow class="mb-4">
        <VCol cols="12" md="4">
          <VSelect
            v-model="filters.bookId"
            :items="bookOptions"
            label="Filtrar por Book"
            clearable
            @update:model-value="applyFilters"
          />
        </VCol>
        <VCol cols="12" md="4">
          <VSelect
            v-model="filters.status"
            :items="statusOptions"
            label="Filtrar por Estado"
            clearable
            @update:model-value="applyFilters"
          />
        </VCol>
        <VCol cols="12" md="4">
          <VTextField
            v-model="filters.search"
            label="Buscar Código"
            prepend-inner-icon="ri-search-line"
            clearable
            @input="applyFilters"
          />
        </VCol>
      </VRow>

      <VDataTable
        :headers="headers"
        :items="codes"
        class="mt-4"
        :loading="loading"
        :items-per-page="pagination.limit"
        :server-items-length="pagination.totalCount"
        @update:options="onTableUpdate"
        :page="pagination.currentPage"
        hide-default-footer
      >
        <template #item.id="{ item }">
          <VChip size="small" color="primary" variant="outlined">
            #{{ item.id }}
          </VChip>
        </template>

        <template #item.code="{ item }">
          <div class="d-flex align-center">
            <code class="text-body-2 font-weight-bold">{{ item.code }}</code>
            <VBtn
              size="x-small"
              variant="text"
              icon
              @click="copyToClipboard(item.code)"
              class="ml-2"
            >
              <VIcon size="16">ri-file-copy-line</VIcon>
            </VBtn>
          </div>
        </template>

        <template #item.status="{ item }">
          <VChip
            :color="getStatusColor(item.status)"
            size="small"
          >
            <VIcon
              :icon="getStatusIcon(item.status)"
              class="mr-1"
              size="14"
            />
            {{ getStatusText(item.status) }}
          </VChip>
        </template>

        <template #item.book_id="{ item }">
          <VChip size="small" color="info" variant="outlined">
            Book #{{ item.book_id }}
          </VChip>
        </template>

        <template #item.redeemed_count="{ item }">
          <VChip 
            size="small" 
            :color="item.redeemed_count > 0 ? 'success' : 'default'" 
            variant="outlined"
          >
            {{ item.redeemed_count }} veces
          </VChip>
        </template>

        <template #item.created_at="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>

        <template #item.updated_at="{ item }">
          {{ formatDate(item.updatedAt) }}
        </template>

        <template #item.actions="{ item }">
          <VBtn
            size="small"
            variant="text"
            color="primary"
            @click="viewCodeDetails(item)"
          >
            <VIcon>ri-eye-line</VIcon>
          </VBtn>
          <VBtn
            v-if="item.status === 'AVAILABLE'"
            size="small"
            variant="text"
            color="secondary"
            @click="openAssignCouponDialog(item)"
            title="Asignar a Usuario"
          >
            <VIcon>ri-user-add-line</VIcon>
          </VBtn>
        </template>
      </VDataTable>

      <!-- Información de paginación -->
      <div class="d-flex justify-space-between align-center mt-4">
        <div class="text-body-2 text-medium-emphasis">
          Mostrando {{ codes.length }} de {{ pagination.totalCount }} códigos
          (Página {{ pagination.currentPage }} de {{ pagination.totalPages }})
        </div>
        <div class="d-flex align-center gap-2">
          <VBtn
            :disabled="!pagination.hasPrevPage"
            size="small"
            variant="outlined"
            @click="goToPage(pagination.currentPage - 1)"
          >
            <VIcon class="mr-1">ri-arrow-left-line</VIcon>
            Anterior
          </VBtn>
          <VBtn
            :disabled="!pagination.hasNextPage"
            size="small"
            variant="outlined"
            @click="goToPage(pagination.currentPage + 1)"
          >
            Siguiente
            <VIcon class="ml-1">ri-arrow-right-line</VIcon>
          </VBtn>
        </div>
      </div>
    </VCard>

    <!-- Modal de Detalles del Código -->
    <VDialog v-model="codeDetailsDialog" max-width="800">
      <VCard>
        <VCardTitle>
          <div class="d-flex justify-space-between align-center">
            <span>Detalles del Código</span>
            <VBtn
              icon
              variant="text"
              @click="codeDetailsDialog = false"
            >
              <VIcon>ri-close-line</VIcon>
            </VBtn>
          </div>
        </VCardTitle>

        <VCardText v-if="selectedCode">
          <VRow>
            <VCol cols="12" md="6">
              <VCard variant="outlined">
                <VCardTitle class="text-h6">Información Básica</VCardTitle>
                <VCardText>
                  <div class="mb-2">
                    <strong>ID:</strong> {{ selectedCode.id }}
                  </div>
                  <div class="mb-2">
                    <div class="d-flex align-center mt-1">
                      <strong>Código:</strong>
                      <code class="text-h6">{{ selectedCode.code }}</code>
                      <VBtn
                        size="small"
                        variant="text"
                        icon
                        @click="copyToClipboard(selectedCode.code)"
                        class="ml-2"
                      >
                        <VIcon>ri-file-copy-line</VIcon>
                      </VBtn>
                    </div>
                  </div>
                  <div class="mb-2">
                    <strong>Estado:</strong>
                    <VChip
                      :color="getStatusColor(selectedCode.status)"
                      size="small"
                      class="ml-2"
                    >
                      {{ getStatusText(selectedCode.status) }}
                    </VChip>
                  </div>
                  <div class="mb-2">
                    <strong>Book ID:</strong> {{ selectedCode.book_id }}
                  </div>
                  <div class="mb-2">
                    <strong>Redenciones:</strong>
                    <VChip
                      :color="selectedCode.redeemed_count > 0 ? 'success' : 'default'"
                      size="small"
                      class="ml-2"
                    >
                      {{ selectedCode.redeemed_count }} veces
                    </VChip>
                  </div>
                </VCardText>
              </VCard>
            </VCol>

            <VCol cols="12" md="6">
              <VCard variant="outlined">
                <VCardTitle class="text-h6">Fechas</VCardTitle>
                <VCardText>
                  <div class="mb-2">
                    <strong>Creado:</strong> {{ formatDate(selectedCode.createdAt) }}
                  </div>
                  <div class="mb-2">
                    <strong>Actualizado:</strong> {{ formatDate(selectedCode.updatedAt) }}
                  </div>
                  <div v-if="selectedCode.usedAt" class="mb-2">
                    <strong>Usado:</strong> {{ formatDate(selectedCode.usedAt) }}
                  </div>
                </VCardText>
              </VCard>
            </VCol>

            <VCol cols="12" v-if="selectedCode.assigned_to_user_id">
              <VCard variant="outlined">
                <VCardTitle class="text-h6">Asignación</VCardTitle>
                <VCardText>
                  <div class="mb-2">
                    <strong>Asignado a usuario ID:</strong> {{ selectedCode.assigned_to_user_id }}
                  </div>
                  <div v-if="selectedCode.assigned_at" class="mb-2">
                    <strong>Fecha de asignación:</strong> {{ formatDate(selectedCode.assigned_at) }}
                  </div>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Modal de Asignación de Cupón -->
    <VDialog v-model="assignCouponDialog" max-width="500">
      <VCard>
        <VCardTitle>
          <div class="d-flex justify-space-between align-center">
            <span>Asignar Cupón</span>
            <VBtn
              icon
              variant="text"
              @click="closeAssignCouponDialog"
            >
              <VIcon>ri-close-line</VIcon>
            </VBtn>
          </div>
        </VCardTitle>

        <VCardText>
          <div class="mb-4">
            <h4>Cupón a Asignar</h4>
            <VCard variant="outlined" class="pa-3">
              <div><strong>Código:</strong> <code>{{ selectedCoupon?.code }}</code></div>
              <div><strong>Book:</strong> {{ selectedCoupon?.book?.name }}</div>
              <div><strong>Estado:</strong> 
                <VChip
                  :color="selectedCoupon?.status === 'AVAILABLE' ? 'success' : 'warning'"
                  size="small"
                  class="ml-2"
                >
                  {{ selectedCoupon?.status === 'AVAILABLE' ? 'Disponible' : 'No disponible' }}
                </VChip>
              </div>
            </VCard>
          </div>

          <VSelect
            v-model="selectedUserId"
            :items="users"
            item-title="name"
            item-value="id"
            label="Seleccionar Usuario"
            :disabled="!selectedCoupon || selectedCoupon.status !== 'AVAILABLE'"
            class="mb-4"
          >
            <template #item="{ props, item }">
              <VListItem v-bind="props">
                <template #title>{{ item.raw.name }}</template>
                <template #subtitle>{{ item.raw.email }}</template>
              </VListItem>
            </template>
          </VSelect>
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn
            color="grey"
            @click="closeAssignCouponDialog"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="primary"
            :loading="loading"
            :disabled="!selectedUserId || !selectedCoupon || selectedCoupon.status !== 'AVAILABLE'"
            @click="assignCouponToUser"
          >
            <VIcon class="mr-2">ri-user-add-line</VIcon>
            Asignar Cupón
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { notify } from '@/composables/useSnackbar'
import CouponCodesResource from '@api/resources/couponCodes.resource.js'
import CouponBooksResource from '@api/resources/couponBooks.resource.js'
import CouponAssignmentsResource from '@api/resources/couponAssignments.resource.js'
import UserResource from '@api/resources/user.resource.js'

// Estado reactivo
const loading = ref(false)
const codes = ref([])
const books = ref([])

// Variables para asignación de cupones
const assignCouponDialog = ref(false)
const selectedCoupon = ref(null)
const users = ref([])
const selectedUserId = ref('')
const selectedCode = ref(null)
const codeDetailsDialog = ref(false)

// Paginación
const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  limit: 20,
  hasNextPage: false,
  hasPrevPage: false
})

// Filtros
const filters = ref({
  bookId: '',
  status: '',
  search: ''
})

// Opciones de filtros
const statusOptions = [
  { value: '', title: 'Todos' },
  { value: 'AVAILABLE', title: 'Disponible' },
  { value: 'USED', title: 'Usado' },
  { value: 'EXPIRED', title: 'Expirado' },
  { value: 'CANCELLED', title: 'Cancelado' }
]

const bookOptions = computed(() => {
  return books.value.map(book => ({
    value: book.id,
    title: `${book.name} (ID: ${book.id})`
  }))
})

// Headers de la tabla
const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Código', key: 'code', sortable: true },
  { title: 'Estado', key: 'status', sortable: true },
  { title: 'Book ID', key: 'book_id', sortable: true },
  { title: 'Redenciones', key: 'redeemed_count', sortable: true },
  { title: 'Creado', key: 'created_at', sortable: true },
  { title: 'Actualizado', key: 'updated_at', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false }
]

// Función para manejar actualizaciones de la tabla
const onTableUpdate = (options) => {
  if (options.page !== undefined) {
    pagination.value.currentPage = options.page
  }
  if (options.itemsPerPage !== undefined) {
    pagination.value.limit = options.itemsPerPage
  }
  loadCodes()
}

// Funciones
const loadCodes = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.currentPage,
      limit: pagination.value.limit
    }

    // Agregar filtros a los parámetros
    if (filters.value.bookId) {
      params.bookId = filters.value.bookId
    }
    if (filters.value.status) {
      params.status = filters.value.status
    }
    if (filters.value.search) {
      params.search = filters.value.search
    }

    const codesResponse = await CouponCodesResource.list(params)
    
    codes.value = codesResponse.data.data
    pagination.value = {
      ...pagination.value,
      ...codesResponse.data.pagination
    }
    
  } catch (error) {
    notify(`Error al cargar códigos: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

const loadBooks = async () => {
  try {
    const booksResponse = await CouponBooksResource.list()
    books.value = booksResponse.data.data
  } catch (error) {
    notify(`Error al cargar books: ${error.message}`, 'error')
  }
}

const refreshData = async () => {
  pagination.value.currentPage = 1
  await Promise.all([loadCodes(), loadBooks()])
  notify('Datos actualizados correctamente', 'success')
}

const applyFilters = () => {
  pagination.value.currentPage = 1
  loadCodes()
}

const goToPage = (page) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.currentPage = page
    loadCodes()
  }
}

const getStatusColor = (status) => {
  const colors = {
    AVAILABLE: 'success',
    USED: 'info',
    EXPIRED: 'warning',
    CANCELLED: 'error'
  }
  return colors[status] || 'grey'
}

const getStatusIcon = (status) => {
  const icons = {
    AVAILABLE: 'ri-check-circle-line',
    USED: 'ri-check-double-line',
    EXPIRED: 'ri-time-line',
    CANCELLED: 'ri-close-circle-line'
  }
  return icons[status] || 'ri-question-line'
}

const getStatusText = (status) => {
  const texts = {
    AVAILABLE: 'Disponible',
    USED: 'Usado',
    EXPIRED: 'Expirado',
    CANCELLED: 'Cancelado'
  }
  return texts[status] || status
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString('es-ES')
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    notify('Código copiado al portapapeles', 'success')
  } catch (error) {
    console.error('Error copiando al portapapeles:', error)
    notify('Error copiando código', 'error')
  }
}

const viewCodeDetails = (code) => {
  selectedCode.value = code
  codeDetailsDialog.value = true
}


// Funciones para asignación de cupones
const openAssignCouponDialog = async (coupon) => {
  selectedCoupon.value = coupon
  selectedUserId.value = ''
  assignCouponDialog.value = true
  await loadUsers()
}

const loadUsers = async () => {
  try {
    const response = await UserResource.getAll()
    users.value = response.data.data
  } catch (error) {
    console.error('Error cargando usuarios:', error)
    notify('Error cargando usuarios', 'error')
  }
}

const assignCouponToUser = async () => {
  if (!selectedUserId.value) {
    notify('Por favor selecciona un usuario', 'warning')
    return
  }

  loading.value = true
  try {
    const response = await CouponAssignmentsResource.assignSpecificCoupon({
      code: selectedCoupon.value.code,
      userId: selectedUserId.value
    })

    notify(`Cupón ${selectedCoupon.value.code} asignado correctamente`, 'success')
    assignCouponDialog.value = false
    selectedCoupon.value = null
    selectedUserId.value = ''
    await loadCodes() // Recargar la lista de cupones
  } catch (error) {
    console.error('Error asignando cupón:', error.response?.data?.error)
    const errorMessage = error.response?.data?.error || 'Error asignando cupón'
    notify(errorMessage, 'error')
  } finally {
    loading.value = false
  }
}

const closeAssignCouponDialog = () => {
  assignCouponDialog.value = false
  selectedCoupon.value = null
  selectedUserId.value = ''
}

// Lifecycle
onMounted(() => {
  loadBooks()
  loadCodes()
})
</script>

<style scoped>
.height-container {
  min-height: calc(100vh - 200px);
}

code {
  background-color: rgba(var(--v-theme-surface-variant), 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}
</style>