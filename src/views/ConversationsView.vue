<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import EyeIcon from '~icons/material-symbols/visibility-outline'
import TrashIcon from '~icons/material-symbols/delete-outline'

const router = useRouter()

const conversations = ref([])
const search = ref('')
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold text-gray-800 mb-6">Conversaciones</h1>

    <!-- Buscador -->
    <div class="mb-4">
      <InputText v-model="search" placeholder="Buscar en conversaciones..." class="w-full" />
    </div>

    <!-- Tabla -->
    <DataTable
      :value="conversations"
      :global-filter-fields="['conversation_token', 'first_message']"
      :globalFilter="search"
      paginator
      :rows="10"
      :rows-per-page-options="[10, 25, 50]"
      empty-message="No hay conversaciones todavía."
      class="shadow-sm"
    >
      <Column field="conversation_token" header="ID Sesión">
        <template #body="{ data }">
          <span class="font-mono text-xs text-gray-500">{{ data.conversation_token.slice(0, 8) }}…</span>
        </template>
      </Column>

      <Column field="started_at" header="Fecha y hora">
        <template #body="{ data }">
          {{ new Date(data.started_at).toLocaleString('es-ES') }}
        </template>
      </Column>

      <Column field="first_message" header="Primer mensaje">
        <template #body="{ data }">
          <span class="text-gray-700">{{ data.first_message ?? '—' }}</span>
        </template>
      </Column>

      <Column field="message_count" header="Mensajes" style="width: 100px; text-align: center" />

      <Column header="Acciones" style="width: 100px">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button severity="secondary" text rounded @click="router.push(`/conversaciones/${data.id}`)">
              <template #icon><EyeIcon /></template>
            </Button>
            <Button severity="danger" text rounded>
              <template #icon><TrashIcon /></template>
            </Button>
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
