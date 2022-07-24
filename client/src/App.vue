<template>
  <v-app>
    <v-app-bar app>
      ActualBudget Sync Admin
    </v-app-bar>
    <v-main>
      <SyncProviders @config-saved="getProductAccounts" />
      <Budgets class="mt-8" :sync-product-accounts="syncProductAccounts" />
    </v-main>
  </v-app>
</template>

<script>
import Budgets from './components/Budgets.vue'
import SyncProviders from './components/SyncProviders.vue'

const API_URL = import.meta.env.VITE_API_URL
export default {
  name: 'App',

  components: {
    Budgets,
    SyncProviders
  },
  created() { this.getProductAccounts() },
  data: () => ({
    syncProductAccounts: [],
  }),
  methods: {
    async getProductAccounts() {
      const syncUrl = `${API_URL}syncProductAccounts`;
      this.syncProductAccounts = (await (await fetch(syncUrl)).json()).map(m => { m.displayName = `${m.productName} - ${m.accountName} ($${m.balance})`; return m; });
    }
  },
}
</script>
