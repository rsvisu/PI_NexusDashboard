<script setup>
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import Button from "primevue/button";
import InputNumber from "primevue/inputnumber";
import Password from "primevue/password";
import Textarea from "primevue/textarea";
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
// Saludo editable; "" significa "usar el default" del backend
const greeting = ref("");
// Límite de mensajes editable; null significa "usar el default" del backend
const rateLimitMax = ref(null);
// De la API key solo sabemos si hay una guardada; nunca la recibimos
const apiKeySet = ref(false);
// Clave nueva que escribe el admin; vacía = no cambiarla
const newApiKey = ref("");
const isDeletingApiKey = ref(false);

// Defaults del backend; se muestran como placeholder cuando el campo está vacío
const defaults = ref({ rate_limit_max: null, greeting: "" });

// Última config recibida del backend; base para revertir al cancelar
const loadedConfig = ref(null);

// ## Funciones:
/**
 * Vuelca una respuesta de config del backend en los refs del formulario.
 * @param {object} config - Respuesta de GET/PATCH /api/config
 */
function applyConfig(config) {
  loadedConfig.value = config;
  defaults.value = config.defaults;
  apiKeySet.value = config.openai_api_key_set;
  // El number se mapea tal cual: null del backend = InputNumber vacío
  rateLimitMax.value = config.rate_limit_max;
  // El textarea no admite null, así que lo convertimos a ""
  greeting.value = config.greeting === null ? "" : config.greeting;
  // Descartamos cualquier API key a medio escribir
  newApiKey.value = "";
}

// ## Ciclo de vida:
onMounted(async () => {
  try {
    const config = await ApiService.getConfig();
    applyConfig(config);
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

/**
 * Guarda la config editable y refresca el formulario con lo que devuelve el backend.
 * Traduce el "vacío" del formulario al null que el backend trata como "usar el default".
 */
async function saveConfig() {
  isSaving.value = true;

  // Saludo vacío => null para que el backend aplique el default
  const greetingToSend = greeting.value.trim() === "" ? null : greeting.value;
  // La API key solo se manda si se ha escrito una nueva; vacía => undefined (no tocar)
  const apiKeyToSend = newApiKey.value === "" ? undefined : newApiKey.value;

  try {
    const updated = await ApiService.updateConfig({
      rate_limit_max: rateLimitMax.value,
      greeting: greetingToSend,
      openai_api_key: apiKeyToSend,
    });
    // El backend responde con la config ya guardada; la reutilizamos para refrescar el formulario
    applyConfig(updated);
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

// Descarta los cambios sin guardar volviendo a la última config recibida del backend
function cancel() {
  applyConfig(loadedConfig.value);
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

/**
 * Borra la API key guardada de inmediato, sin esperar al botón Guardar.
 */
async function deleteApiKey() {
  isDeletingApiKey.value = true;
  // null borra la clave guardada
  try {
    const updated = await ApiService.updateConfig({ openai_api_key: null });
    apiKeySet.value = updated.openai_api_key_set;
    // Sincronizamos loadedConfig para que un Cancelar posterior no resucite la clave borrada
    loadedConfig.value = updated;
    newApiKey.value = "";
    toast.add({
      severity: "success",
      summary: "Eliminada",
      detail: "API key eliminada",
      life: 3000,
    });
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

          <!-- Mensaje de bienvenida -->
          <div class="flex flex-col gap-2 border-t border-gray-200 pt-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-2">Mensaje de bienvenida</h2>
            <label class="text-base text-gray-600">Saludo inicial del asistente</label>
            <Textarea
              v-model="greeting"
              rows="3"
              auto-resize
              maxlength="500"
              :placeholder="defaults.greeting"
              class="w-full max-w-2xl"
            />
            <p class="text-sm text-gray-500">
              Es el primer mensaje que ve el usuario al abrir el chat. Máximo 500 caracteres. Déjalo
              vacío para usar el saludo por defecto.
            </p>
          </div>

          <!-- Límites de uso -->
          <div class="flex flex-col gap-2 border-t border-gray-200 pt-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-2">Límites de uso</h2>
            <label class="text-base text-gray-600"
              >Máximo de mensajes por IP / min (recomendado: {{ defaults.rate_limit_max }})</label
            >
            <InputNumber
              v-model="rateLimitMax"
              :min="1"
              :max="1000"
              :placeholder="String(defaults.rate_limit_max)"
              show-buttons
              class="w-full max-w-2xl"
              input-class="w-full"
            />
            <p class="text-sm text-gray-500">Déjalo vacío para usar el valor por defecto.</p>
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
