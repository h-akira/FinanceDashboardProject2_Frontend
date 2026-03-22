<script setup lang="ts">
import Button from 'primevue/button'
import { useAuth } from '@/auth/auth'

const { isAuthenticated, login } = useAuth()
</script>

<template>
  <div class="home-page">
    <template v-if="!isAuthenticated">
      <div class="hero">
        <h1>Finance Dashboard</h1>
        <p class="hero-description">
          金融市場の主要指標・チャートをまとめて確認できるダッシュボードアプリケーションです。
        </p>
        <div class="hero-actions">
          <Button label="ログイン" icon="pi pi-sign-in" @click="login" />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.home-page {
  padding: 2rem 0;
}

.hero {
  text-align: center;
  padding: 4rem 1rem;
}

.hero h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.hero-description {
  font-size: 1.125rem;
  color: var(--p-text-muted-color, #6b7280);
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}
</style>
