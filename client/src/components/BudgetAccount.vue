<template>
    <v-sheet class="ma-4 pa-4" rounded="rounded" elevation="4">
        <div class="d-flex">
            <h2>{{ accountName }}</h2>
            <v-spacer></v-spacer>
            <v-btn icon class="mb-4 mt-n2" @click="importAccount" color="secondary" :disabled="isImporting">
                <v-icon>mdi-application-import</v-icon>
                <v-tooltip activator="parent" location="end">Import Account</v-tooltip>
            </v-btn>
        </div>
        <v-select v-model="selected" :items="syncProductAccounts" item-title="displayName" :hint="selectHint"
            persistent-hint return-object item-value="syncProductAccountId" label="Select" single-line
            density="compact"></v-select>
        <v-snackbar v-model="snackAccountUpdated" :timeout="timeout">
            Updated ActualBudget account <strong>{{ accountName }}</strong> to sync with
            <strong>{{ selectedName }}</strong>
        </v-snackbar>
    </v-sheet>
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
import BudgetSuccess from './BudgetSuccess.vue'
const API_URL = import.meta.env.VITE_API_URL
export default {
    name: 'BudgetAccount',
    components: { BudgetSuccess },
    props: ['budgetAccountId', 'accountName', 'lastSync', 'syncProductAccountId', 'syncProductAccounts', 'isImportingAll'],
    data() {
        return {
            selected: null,
            snackAccountUpdated: false,
            snackAccountImported: false,
            timeout: 15000,
            importResult: null,
            isImportingSingle: false
        }
    },
    computed: {
        selectedName() {
            if (this.selected) {
                return this.selected.displayName
            }
        },
        selectHint() {
            return `Sync Account - Last Synced: ${this.lastSync || 'Never'}`
        },
        isImporting() {
            return this.isImportingSingle || this.isImportingAll
        }
    },
    created() {
        this.selected = this.syncProductAccounts.find(f => f.syncProductAccountId == this.syncProductAccountId)
    },
    watch: {
        async selected(newVal, oldVal) {
            if ((!!oldVal || !!newVal) && (!!newVal && newVal.syncProductAccountId != this.syncProductAccountId)) {
                const url = `${API_URL}budgetAccount/${this.budgetAccountId}/${this.selected.syncProductAccountId}`
                let res = await (await fetch(url)).json()
                if (!res.errors) {
                    this.snackbar = true
                }
            }
        }
    },
    methods: {
        async importAccount() {
            this.isImportingSingle = true
            const url = `${API_URL}budgetAccount/${this.budgetAccountId}/import`
            let res = await (await fetch(url)).json()
            if (!res.errors) {
                this.snackAccountImported = true
                this.importResult = res
            }
            this.isImportingSingle = false
        }
    }

}
</script>