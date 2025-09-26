<template>
  <div>
    <VCard class="height-container pa-4">
      <template #title>
        <div class="d-flex justify-space-between align-center pb-4">
          <div>
            <h2>Bull Queue Monitor</h2>
            <p class="text-body-2 text-medium-emphasis mb-0">
              Monitoreo en tiempo real de colas y trabajos
            </p>
          </div>
          <div class="d-flex align-center gap-2">
            <VSwitch
              v-model="autoRefresh"
              label="Auto-refresh"
              color="primary"
              @change="toggleAutoRefresh"
            />
            <VBtn
              color="primary"
              variant="outlined"
              @click="refreshData"
              :loading="loading"
            >
              <VIcon class="mr-2">ri-refresh-line</VIcon>
              Actualizar
            </VBtn>
          </div>
        </div>
      </template>

      <!-- Estadísticas Generales -->
      <VRow class="mb-6">
        <VCol cols="12" md="3">
          <VCard variant="tonal" color="primary">
            <VCardText class="text-center">
              <VIcon size="40" class="mb-2">ri-database-2-line</VIcon>
              <div class="text-h4 font-weight-bold">{{ stats.totalJobs }}</div>
              <div class="text-body-2">Total Jobs</div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" md="3">
          <VCard variant="tonal" color="warning">
            <VCardText class="text-center">
              <VIcon size="40" class="mb-2">ri-time-line</VIcon>
              <div class="text-h4 font-weight-bold">{{ stats.waiting }}</div>
              <div class="text-body-2">En Cola</div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" md="3">
          <VCard variant="tonal" color="info">
            <VCardText class="text-center">
              <VIcon size="40" class="mb-2">ri-play-circle-line</VIcon>
              <div class="text-h4 font-weight-bold">{{ stats.active }}</div>
              <div class="text-body-2">Activos</div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" md="3">
          <VCard variant="tonal" color="success">
            <VCardText class="text-center">
              <VIcon size="40" class="mb-2">ri-check-circle-line</VIcon>
              <div class="text-h4 font-weight-bold">{{ stats.completed }}</div>
              <div class="text-body-2">Completados</div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Filtros y Búsqueda -->
      <VRow class="mb-4">
        <VCol cols="12" md="4">
          <VSelect
            v-model="selectedStatus"
            :items="statusOptions"
            label="Filtrar por Estado"
            clearable
            @update:model-value="filterJobs"
          />
        </VCol>
        <VCol cols="12" md="4">
          <VTextField
            v-model="searchQuery"
            label="Buscar Jobs"
            prepend-inner-icon="ri-search-line"
            clearable
            @input="filterJobs"
          />
        </VCol>
        <VCol cols="12" md="4">
          <VSelect
            v-model="selectedQueue"
            :items="queueOptions"
            label="Filtrar por Cola"
            clearable
            @update:model-value="filterJobs"
          />
        </VCol>
      </VRow>

      <!-- Lista de Jobs -->
      <VCard>
        <VCardTitle>
          <div class="d-flex justify-space-between align-center">
            <span>Jobs Recientes</span>
            <VChip
              :color="getStatusColor(selectedStatus || 'all')"
              size="small"
            >
              {{ filteredJobs.length }} jobs
            </VChip>
          </div>
        </VCardTitle>

        <VDataTable
          :headers="headers"
          :items="filteredJobs"
          :loading="loading"
          class="elevation-0"
        >
          <template #item.id="{ item }">
            <VChip size="small" color="primary" variant="outlined">
              #{{ item.id }}
            </VChip>
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

          <template #item.progress="{ item }">
            <div v-if="item.status === 'active'">
              <VProgressLinear
                :model-value="item.progress || 0"
                color="primary"
                height="8"
                rounded
              />
              <span class="text-caption">{{ item.progress || 0 }}%</span>
            </div>
            <span v-else class="text-medium-emphasis">-</span>
          </template>

          <template #item.data="{ item }">
            <div class="text-truncate" style="max-width: 300px">
              <div v-if="item.data?.bookInfo">
                <strong>Book:</strong> {{ item.data.bookInfo.name }}<br>
                <strong>Cantidad:</strong> {{ formatNumber(item.data?.quantity) }}<br>
                <strong>Patrón:</strong> {{ item.data?.pattern || 'N/A' }}
              </div>
              <div v-else>
                <strong>Book ID:</strong> {{ item.data?.bookId || 'N/A' }}<br>
                <strong>Cantidad:</strong> {{ formatNumber(item.data?.quantity) }}<br>
                <strong>Patrón:</strong> {{ item.data?.pattern || 'N/A' }}
              </div>
            </div>
          </template>

          <template #item.createdAt="{ item }">
            {{ formatDate(item.createdAt) }}
          </template>

          <template #item.duration="{ item }">
            {{ calculateDuration(item) }}
          </template>

          <template #item.actions="{ item }">
            <VBtn
              size="small"
              variant="text"
              color="primary"
              @click="viewJobDetails(item)"
            >
              <VIcon>ri-eye-line</VIcon>
            </VBtn>
            <VBtn
              v-if="item.status === 'waiting' || item.status === 'delayed'"
              size="small"
              variant="text"
              color="warning"
              @click="pauseJob(item)"
            >
              <VIcon>ri-pause-line</VIcon>
            </VBtn>
            <VBtn
              v-if="item.status === 'paused'"
              size="small"
              variant="text"
              color="success"
              @click="resumeJob(item)"
            >
              <VIcon>ri-play-line</VIcon>
            </VBtn>
            <VBtn
              v-if="item.status === 'failed'"
              size="small"
              variant="text"
              color="error"
              @click="retryJob(item)"
            >
              <VIcon>ri-refresh-line</VIcon>
            </VBtn>
          </template>
        </VDataTable>
      </VCard>

      <!-- Modal de Detalles del Job -->
      <VDialog v-model="jobDetailsDialog" max-width="800">
        <VCard>
          <VCardTitle>
            <div class="d-flex justify-space-between align-center">
              <span>Detalles del Job #{{ selectedJob?.id }}</span>
              <VBtn
                icon
                variant="text"
                @click="jobDetailsDialog = false"
              >
                <VIcon>ri-close-line</VIcon>
              </VBtn>
            </div>
          </VCardTitle>

          <VCardText v-if="selectedJob">
            <VRow>
              <VCol cols="12" md="6">
                <VCard variant="outlined">
                  <VCardTitle class="text-h6">Información Básica</VCardTitle>
                  <VCardText>
                    <div class="mb-2">
                      <strong>ID:</strong> {{ selectedJob.id }}
                    </div>
                    <div class="mb-2">
                      <strong>Estado:</strong>
                      <VChip
                        :color="getStatusColor(selectedJob.status)"
                        size="small"
                        class="ml-2"
                      >
                        {{ getStatusText(selectedJob.status) }}
                      </VChip>
                    </div>
                    <div class="mb-2">
                      <strong>Progreso:</strong> {{ selectedJob.progress || 0 }}%
                    </div>
                    <div class="mb-2">
                      <strong>Creado:</strong> {{ formatDate(selectedJob.createdAt) }}
                    </div>
                    <div class="mb-2">
                      <strong>Procesado:</strong> {{ formatDate(selectedJob.processedAt) }}
                    </div>
                    <div class="mb-2">
                      <strong>Finalizado:</strong> {{ formatDate(selectedJob.finishedAt) }}
                    </div>
                  </VCardText>
                </VCard>
              </VCol>

              <VCol cols="12" md="6">
                <VCard variant="outlined">
                  <VCardTitle class="text-h6">Datos del Job</VCardTitle>
                  <VCardText>
                    <div v-if="selectedJob.data?.bookInfo">
                      <div class="mb-3">
                        <strong>Información del Book:</strong>
                        <div class="ml-3 mt-2">
                          <div><strong>ID:</strong> {{ selectedJob.data.bookInfo.id }}</div>
                          <div><strong>Nombre:</strong> {{ selectedJob.data.bookInfo.name }}</div>
                          <div><strong>Descripción:</strong> {{ selectedJob.data.bookInfo.description || 'Sin descripción' }}</div>
                          <div><strong>Patrón:</strong> {{ selectedJob.data.bookInfo.code_pattern || 'N/A' }}</div>
                          <div><strong>Total Códigos:</strong> {{ formatNumber(selectedJob.data.bookInfo.total_codes) || 'Sin límite' }}</div>
                        </div>
                      </div>
                      <div class="mb-3">
                        <strong>Parámetros del Job:</strong>
                        <div class="ml-3 mt-2">
                          <div><strong>Cantidad:</strong> {{ formatNumber(selectedJob.data?.quantity) }}</div>
                          <div><strong>Patrón:</strong> {{ selectedJob.data?.pattern || 'N/A' }}</div>
                          <div><strong>Usar Cola:</strong> {{ selectedJob.data?.useQueue ? 'Sí' : 'No' }}</div>
                        </div>
                      </div>
                    </div>
                    <div v-else>
                      <pre class="text-body-2">{{ JSON.stringify(selectedJob.data, null, 2) }}</pre>
                    </div>
                  </VCardText>
                </VCard>
              </VCol>

              <VCol cols="12" v-if="selectedJob.returnValue">
                <VCard variant="outlined">
                  <VCardTitle class="text-h6">Resultado</VCardTitle>
                  <VCardText>
                    <pre class="text-body-2">{{ JSON.stringify(selectedJob.returnValue, null, 2) }}</pre>
                  </VCardText>
                </VCard>
              </VCol>

              <VCol cols="12" v-if="selectedJob.failedReason">
                <VCard variant="outlined" color="error">
                  <VCardTitle class="text-h6">Error</VCardTitle>
                  <VCardText>
                    <pre class="text-body-2 text-error">{{ selectedJob.failedReason }}</pre>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VDialog>
    </VCard>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { notify } from '@/composables/useSnackbar'
import { formatNumber } from '@/@core/utils/formatters'
import BullMonitorResource from '@api/resources/bullMonitor.resource.js'

// Estado reactivo
const loading = ref(false)
const autoRefresh = ref(true)
const refreshInterval = ref(null)

const stats = ref({
  totalJobs: 0,
  waiting: 0,
  active: 0,
  completed: 0,
  failed: 0
})

const jobs = ref([])
const filteredJobs = ref([])

// Filtros
const selectedStatus = ref('')
const searchQuery = ref('')
const selectedQueue = ref('')

// Modal de detalles
const jobDetailsDialog = ref(false)
const selectedJob = ref(null)

// Opciones de filtros
const statusOptions = [
  { value: '', title: 'Todos' },
  { value: 'waiting', title: 'En Cola' },
  { value: 'active', title: 'Activos' },
  { value: 'completed', title: 'Completados' },
  { value: 'failed', title: 'Fallidos' },
  { value: 'delayed', title: 'Programados' },
  { value: 'paused', title: 'Pausados' }
]

const queueOptions = [
  { value: '', title: 'Todas las Colas' },
  { value: 'code generation', title: 'Generación de Códigos' }
]

// Headers de la tabla
const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Estado', key: 'status', sortable: true },
  { title: 'Progreso', key: 'progress', sortable: false },
  { title: 'Datos', key: 'data', sortable: false },
  { title: 'Creado', key: 'createdAt', sortable: true },
  { title: 'Duración', key: 'duration', sortable: false },
  { title: 'Acciones', key: 'actions', sortable: false }
]

// Funciones
const refreshData = async () => {
  loading.value = true
  try {
    // Obtener estadísticas y jobs en paralelo
    const [statsResponse, jobsResponse] = await Promise.all([
      BullMonitorResource.getStats(),
      BullMonitorResource.getJobs({ limit: 50 })
    ])

    // Actualizar estadísticas
    stats.value = statsResponse.data.data

    // Actualizar jobs
    jobs.value = jobsResponse.data.data
    updateStats()
    filterJobs()
  } catch (error) {
    console.error('Error actualizando datos:', error)
    notify('Error al actualizar datos', 'error')
  } finally {
    loading.value = false
  }
}

const updateStats = () => {
  const statsData = {
    totalJobs: jobs.value.length,
    waiting: jobs.value.filter(j => j.status === 'waiting').length,
    active: jobs.value.filter(j => j.status === 'active').length,
    completed: jobs.value.filter(j => j.status === 'completed').length,
    failed: jobs.value.filter(j => j.status === 'failed').length
  }
  
  stats.value = statsData
}

const filterJobs = () => {
  let filtered = [...jobs.value]

  // Filtrar por estado
  if (selectedStatus.value) {
    filtered = filtered.filter(job => job.status === selectedStatus.value)
  }

  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(job => 
      job.id.toString().includes(query) ||
      JSON.stringify(job.data).toLowerCase().includes(query)
    )
  }

  // Filtrar por cola
  if (selectedQueue.value) {
    filtered = filtered.filter(job => 
      job.queue === selectedQueue.value
    )
  }

  filteredJobs.value = filtered
}

const getStatusColor = (status) => {
  const colors = {
    waiting: 'warning',
    active: 'info',
    completed: 'success',
    failed: 'error',
    delayed: 'secondary',
    paused: 'warning'
  }
  return colors[status] || 'grey'
}

const getStatusIcon = (status) => {
  const icons = {
    waiting: 'ri-time-line',
    active: 'ri-play-circle-line',
    completed: 'ri-check-circle-line',
    failed: 'ri-error-warning-line',
    delayed: 'ri-timer-line',
    paused: 'ri-pause-circle-line'
  }
  return icons[status] || 'ri-question-line'
}

const getStatusText = (status) => {
  const texts = {
    waiting: 'En Cola',
    active: 'Activo',
    completed: 'Completado',
    failed: 'Fallido',
    delayed: 'Programado',
    paused: 'Pausado'
  }
  return texts[status] || status
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString('es-ES')
}

const calculateDuration = (job) => {
  if (!job.processedAt) return 'N/A'
  
  const start = new Date(job.processedAt)
  const end = job.finishedAt ? new Date(job.finishedAt) : new Date()
  const duration = Math.floor((end - start) / 1000)
  
  if (duration < 60) return `${duration}s`
  if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`
  return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`
}

const viewJobDetails = async (job) => {
  try {
    loading.value = true
    const response = await BullMonitorResource.getJobDetails(job.id)
    selectedJob.value = response.data.data
    jobDetailsDialog.value = true
  } catch (error) {
    console.error('Error obteniendo detalles del job:', error)
    notify('Error obteniendo detalles del job', 'error')
  } finally {
    loading.value = false
  }
}

const pauseJob = async (job) => {
  try {
    notify(`Pausando job #${job.id}...`, 'info')
    await BullMonitorResource.pauseJob(job.id)
    notify(`Job #${job.id} pausado correctamente`, 'success')
    refreshData() // Actualizar datos
  } catch (error) {
    console.error('Error pausando job:', error)
    notify('Error pausando job', 'error')
  }
}

const resumeJob = async (job) => {
  try {
    notify(`Reanudando job #${job.id}...`, 'info')
    await BullMonitorResource.resumeJob(job.id)
    notify(`Job #${job.id} reanudado correctamente`, 'success')
    refreshData() // Actualizar datos
  } catch (error) {
    console.error('Error reanudando job:', error)
    notify('Error reanudando job', 'error')
  }
}

const retryJob = async (job) => {
  try {
    notify(`Reintentando job #${job.id}...`, 'info')
    await BullMonitorResource.retryJob(job.id)
    notify(`Job #${job.id} reintentado correctamente`, 'success')
    refreshData() // Actualizar datos
  } catch (error) {
    console.error('Error reintentando job:', error)
    notify('Error reintentando job', 'error')
  }
}

const toggleAutoRefresh = () => {
  if (autoRefresh.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

const startAutoRefresh = () => {
  refreshInterval.value = setInterval(() => {
    refreshData()
  }, 5000) // Actualizar cada 5 segundos
}

const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

// Lifecycle
onMounted(() => {
  refreshData()
  if (autoRefresh.value) {
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.height-container {
  min-height: calc(100vh - 200px);
}

.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
