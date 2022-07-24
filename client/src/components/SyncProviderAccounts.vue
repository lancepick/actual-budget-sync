<template>
    <v-container v-if="isLoading">
        <v-row>
            <v-col class="text-center">
                <v-progress-circular :size="100" :width="8" color="secondary" indeterminate>
                </v-progress-circular>
            </v-col>
        </v-row>
    </v-container>
    <v-table v-else>
        <thead>
            <tr>
                <th class="text-left">
                    Account
                </th>
                <th class="text-right">
                    Balance
                </th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="account of accounts" :key="account.syncProductAccountId">
                <td>{{ account.accountName }}</td>
                <td class="text-right">{{ account.balance }}</td>
            </tr>
        </tbody>
    </v-table>
</template>

<script>
const API_URL = import.meta.env.VITE_API_URL
export default {
    name: 'SyncProviderAccounts',
    props: ['syncProviderId'],
    created() { this.fetchData() },
    data: () => ({
        accounts: [],
        isLoading: true
    }),
    methods: {
        async fetchData() {
            this.isLoading = true
            const url = `${API_URL}syncproviders/${this.syncProviderId}/accounts`
            this.accounts = await (await fetch(url)).json()
            this.isLoading = false
        }
    }
}
</script>