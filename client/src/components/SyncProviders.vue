<template>
    <v-container>
        <v-row>
            <v-col>
                <h2>Sync Providers</h2>
            </v-col>
        </v-row>
        <v-row>
            <v-card v-for="provider in providers" :key="provider.key" color="primary" width="100%" class="mt-5">
                <template v-slot:title>
                    <v-toolbar color="primary">
                        <v-toolbar-title>{{ provider.name }}</v-toolbar-title>
                        <v-spacer></v-spacer>
                        <v-btn icon @click="provider.isConfigured = !provider.isConfigured" color="secondary"
                            variant="elevated">
                            <v-icon v-if="provider.isConfigured">mdi-cog</v-icon>
                            <v-icon v-else>mdi-table</v-icon>
                            <v-tooltip activator="parent" location="end">{{ provider.isConfigured ? 'Settings' :
                                    'Accounts'
                            }}</v-tooltip>
                        </v-btn>
                    </v-toolbar>
                </template>
                <template v-slot:text>
                    <SyncProviderAccounts v-if="provider.isConfigured" :sync-provider-id="provider.key" />
                    <SimpleFinConfig v-else :sync-provider-id="provider.key" @config-saved="configSaved(provider)" />
                </template>
            </v-card>
        </v-row>
    </v-container>
</template>

<script>
import SimpleFinConfig from './SimpleFINConfig.vue'
import SyncProviderAccounts from './SyncProviderAccounts.vue'
const API_URL = import.meta.env.VITE_API_URL
export default {
    name: 'SyncProviders',
    components: {
        SimpleFinConfig,
        SyncProviderAccounts
    },
    emits: ['configSaved'],
    data: () => ({ 
        selectedTab: null,
        providers: null,
        isLoading: true
    }),
    created() { this.fetchData() },
    methods: {
        async fetchData() {
            this.isLoading = true;
            const url = `${API_URL}syncproviders`
            let res = await (await fetch(url)).json()
            this.providers = res.map((m) => { return { key: m.syncProductId, name: m.productName, isConfigured: m.isConfigured } })

            this.selectedTab = this.providers[0].name
            this.isLoading = false;
        },
        configSaved(provider) {
            this.$emit('configSaved')
            provider.isConfigured = !provider.isConfigured
        }
    }
}
</script>