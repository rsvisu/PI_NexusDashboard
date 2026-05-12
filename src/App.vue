<script setup>
import AppSidebar from "@/components/app/AppSidebar.vue";
</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <AppSidebar />
    <main class="flex-1 flex flex-col overflow-hidden p-8">
      <RouterView />
    </main>
  </div>
</template>
