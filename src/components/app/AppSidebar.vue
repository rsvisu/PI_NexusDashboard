<script setup>
import { RouterLink } from "vue-router";
import { useAuthStore } from "@/stores/auth.js";
import logoFace from "@/assets/logo.svg";
import HomeIcon from '~icons/material-symbols/home-outline'
import BookIcon from '~icons/material-symbols/menu-book-outline'
import ChatIcon from '~icons/material-symbols/chat-bubble-outline'

// ## Stores:
const authStore = useAuthStore();

// ## Funciones:
async function handleLogout() {
  await authStore.logout();
}
</script>

<template>
  <aside class="w-52 shrink-0 flex flex-col bg-slate-900 text-white h-full">
    <!-- Logo -->
    <div class="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
      <img :src="logoFace" alt="Nexus" class="w-8 h-8" />
      <span class="text-lg font-semibold tracking-wide">Nexus</span>
    </div>

    <!-- Navegación -->
    <nav class="flex-1 px-3 py-4 flex flex-col gap-5 overflow-y-auto">
      <div>
        <p class="text-xs text-slate-400 uppercase px-2 mb-1">Principal</p>
        <RouterLink to="/" class="nav-link">
          <HomeIcon />
          Inicio
        </RouterLink>
        <RouterLink to="/conocimientos" class="nav-link">
          <BookIcon />
          Conocimientos
        </RouterLink>
      </div>

      <div>
        <p class="text-xs text-slate-400 uppercase px-2 mb-1">Gestión</p>
        <RouterLink to="/conversaciones" class="nav-link">
          <ChatIcon />
          Conversaciones
        </RouterLink>
      </div>
    </nav>

    <!-- Footer -->
    <div class="px-3 py-4 border-t border-slate-700 flex flex-col gap-2">
      <p v-if="authStore.user" class="text-xs text-slate-400 px-2 truncate">
        {{ authStore.user.email }}
      </p>
      <button
        class="w-full text-sm py-2 px-3 rounded-lg bg-brand text-white font-medium hover:bg-brand-dark cursor-pointer transition-colors"
        @click="handleLogout"
      >
        Cerrar sesión
      </button>
    </div>
  </aside>
</template>

<style scoped>
.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #cbd5e1;
  text-decoration: none;
  transition:
    background-color 0.15s,
    color 0.15s;
}

.nav-link:hover {
  background-color: rgb(255 255 255 / 0.07);
  color: white;
}

.nav-link.router-link-active {
  background-color: rgb(255 255 255 / 0.1);
  color: white;
  font-weight: 500;
}
</style>
