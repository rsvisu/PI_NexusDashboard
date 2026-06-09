<script setup>
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import Button from "primevue/button";
import InputNumber from "primevue/inputnumber";
import Password from "primevue/password";
import Tag from "primevue/tag";
import ApiService from "@/services/api";
import { getErrorMessage } from "@/utils/apiError";

// ## Servicios:
const toast = useToast();
const confirm = useConfirm();

// ## Estado general:
const isLoading = ref(true);
const isSaving = ref(false);

// ## Estado del formulario:
const rateLimitMax = ref(10);
const apiKeySet = ref(false);
const newApiKey = ref("");
const isDeletingApiKey = ref(false);

// Último valor guardado del rate limit; lo usamos para revertir al cancelar
const savedRateLimit = ref(10);

// ## Ciclo de vida:
onMounted(async () => {
  try {
    const config = await ApiService.getConfig();
    rateLimitMax.value = config.rate_limit_max;
    savedRateLimit.value = config.rate_limit_max;
    apiKeySet.value = config.openai_api_key_set;
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: getErrorMessage(error, "No se pudo cargar la configuración"),
      life: 4000,
    });
  } finally {
    isLoading.value = false;
  }
});

// ## Funciones:
async function saveConfig() {
  isSaving.value = true;

  // Solo enviamos la API key si se ha escrito una nueva; el campo vacío significa "no cambiar"
  let apiKeyToSend;
  if (newApiKey.value) {
    apiKeyToSend = newApiKey.value;
  } else {
    apiKeyToSend = undefined;
  }

  try {
    const updated = await ApiService.updateConfig({
      rate_limit_max: rateLimitMax.value,
      openai_api_key: apiKeyToSend,
    });
    rateLimitMax.value = updated.rate_limit_max;
    savedRateLimit.value = updated.rate_limit_max;
    apiKeySet.value = updated.openai_api_key_set;
    newApiKey.value = "";
    toast.add({
      severity: "success",
      summary: "Guardado",
      detail: "Configuración actualizada",
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: getErrorMessage(error, "No se pudo guardar la configuración"),
      life: 4000,
    });
  } finally {
    isSaving.value = false;
  }
}

// Descarta los cambios sin guardar y vuelve a los valores guardados
function cancel() {
  rateLimitMax.value = savedRateLimit.value;
  newApiKey.value = "";
}

function confirmDeleteApiKey() {
  confirm.require({
    message:
      "¿Seguro que quieres eliminar la API key guardada? El asistente dejará de responder hasta que configures una nueva.",
    header: "Eliminar API key",
    rejectProps: { label: "Cancelar", severity: "secondary", text: true },
    acceptProps: { label: "Eliminar", severity: "danger" },
    accept: deleteApiKey,
  });
}

async function deleteApiKey() {
  isDeletingApiKey.value = true;
  // null borra la clave guardada
  try {
    const updated = await ApiService.updateConfig({ openai_api_key: null });
    apiKeySet.value = updated.openai_api_key_set;
    newApiKey.value = "";
    toast.add({ severity: "success", summary: "Eliminada", detail: "API key eliminada", life: 3000 });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: getErrorMessage(error, "No se pudo eliminar la API key"),
      life: 4000,
    });
  } finally {
    isDeletingApiKey.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-800">Configuración General</h1>
    </div>

    <!-- Esqueleto de carga -->
    <div v-if="isLoading" class="text-sm text-gray-500">Cargando configuración...</div>

    <!-- Contenido -->
    <template v-else>
      <div class="flex-1 overflow-y-auto">
        <div class="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-6">
          <!-- Configuración de API -->
          <div class="flex flex-col gap-2">
            <h2 class="text-lg font-semibold text-gray-800 mb-2">Configuración de API</h2>
            <div class="flex items-center gap-3">
              <label class="text-base text-gray-600">Clave de API de OpenAI</label>
              <Tag v-if="apiKeySet" value="Configurada" severity="success" />
              <Tag v-else value="Sin configurar" severity="warn" />
              <Button
                v-if="apiKeySet"
                label="Eliminar"
                severity="danger"
                text
                size="small"
                :loading="isDeletingApiKey"
                @click="confirmDeleteApiKey"
              />
            </div>
            <Password
              v-model="newApiKey"
              :feedback="false"
              toggle-mask
              placeholder="sk-..."
              class="w-full max-w-2xl"
              input-class="w-full"
            />
            <p class="text-sm text-gray-500">
              La clave se almacena cifrada en la base de datos y nunca se muestra. Déjala vacía para
              mantener la actual.
            </p>
          </div>

          <!-- Límites de Uso -->
          <div class="flex flex-col gap-2 border-t border-gray-200 pt-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-2">Límites de Uso</h2>
            <label class="text-base text-gray-600">Máximo de mensajes por IP / min</label>
            <InputNumber
              v-model="rateLimitMax"
              :min="1"
              :max="1000"
              :allow-empty="false"
              show-buttons
              class="w-full max-w-2xl"
              input-class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- Barra de acciones -->
      <div class="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-2">
        <Button label="Cancelar" severity="secondary" :disabled="isSaving" @click="cancel" />
        <Button label="Guardar" :loading="isSaving" @click="saveConfig" />
      </div>
    </template>
  </div>
</template>
