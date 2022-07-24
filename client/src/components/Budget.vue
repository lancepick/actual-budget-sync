<template>
  <v-container v-if="isLoading">
    <v-row>
      <v-col class="text-center">
        <v-progress-circular :size="100" :width="8" color="secondary" indeterminate>
        </v-progress-circular>
      </v-col>
    </v-row>
  </v-container>
  <BudgetAccount v-for="account of budgetAccounts" :budget-account-id="account.budgetAccountId"
    :account-name="account.accountName" :last-sync="account.lastSync"
    :sync-product-account-id="account.syncProductAccountId" :sync-product-accounts="syncProductAccounts" :is-importing-all="isImportingAll" />
</template>

<script>
import BudgetAccount from './BudgetAccount.vue'

const API_URL = import.meta.env.VITE_API_URL
export default {
  name: "Budget",
  props: ["budgetId", "isImportingAll", "syncProductAccounts"],
  created() { this.fetchData(); },
  data: () => ({
    budgetAccounts: [],
    isLoading: true
  }),
  methods: {
    async fetchData() {
      this.isLoading = true;
      const accountUrl = `${API_URL}budgets/${this.budgetId}`;
      this.budgetAccounts = await (await fetch(accountUrl)).json();
      this.isLoading = false;
    }
  },
  components: { BudgetAccount }
}
</script>