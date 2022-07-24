<template>
    <v-container>
        <v-row>
            <v-col>
                <h2>Budgets</h2>
            </v-col>
        </v-row>
        <v-row>
            <v-card v-for="budget in budgets" :key="budget.budgetId" color="primary" width="100%" class="mt-5">
                <template v-slot:title>
                    <v-toolbar color="primary">
                        <v-toolbar-title>{{ budget.budgetName }}</v-toolbar-title>
                        <v-spacer></v-spacer>
                        <v-btn icon color="secondary" variant="elevated" @click="importAccounts(budget.budgetId)" :disabled="isImportingAll">
                            <v-icon>mdi-application-import</v-icon>
                            <v-tooltip activator="parent" location="end">Import All Accounts</v-tooltip>
                        </v-btn>
                    </v-toolbar>
                </template>
                <template v-slot:text>
                    <Budget :budget-id="budget.budgetId" :is-importing-all="isImportingAll" :sync-product-accounts="syncProductAccounts" />
                </template>
            </v-card>
        </v-row>
    </v-container>
    <v-snackbar v-model="snackAccountImported" :timeout="timeout" color="success">
        <BudgetSuccess :import-result="importResult" />
        <template v-slot:actions>
            <v-btn color="secondary" variant="elevated" @click="snackAccountImported = false">
                Close
            </v-btn>
        </template>

    </v-snackbar>
</template>

<script>
import Budget from './Budget.vue'
import BudgetSuccess from './BudgetSuccess.vue'
const API_URL = import.meta.env.VITE_API_URL
export default {
    name: 'Budgets',
    components: { Budget, BudgetSuccess },
    props: ['syncProductAccounts'],
    created() { this.fetchData() },
    data: () => ({
        budgets: [],
        snackAccountImported: false,
        importResult: null,
        timeout: 20000,
        isImportingAll: false
    }),
    methods: {
        async fetchData() {
            const url = `${API_URL}budgets`
            this.budgets = await (await fetch(url)).json()
        },
        async importAccounts(budgetId) {
            this.isImportingAll = true
            const url = `${API_URL}budget/${budgetId}/import`
            let res = await (await fetch(url)).json()
            if (!res.errors) {
                this.importResult = res
                this.snackAccountImported = true
            }
            this.isImportingAll = false
        }
    }
}
</script>