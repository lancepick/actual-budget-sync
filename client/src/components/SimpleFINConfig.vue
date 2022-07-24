<template>
    <v-form v-model="valid" ref="form">
        <v-sheet class="ma-4 pa-4" rounded="rounded">
            <v-text-field v-model="token" label="SimpleFIN Token" required></v-text-field>
            <div class="d-flex">
                <v-spacer></v-spacer>
                <v-btn color="secondary" @click="save">Save</v-btn>
            </div>
        </v-sheet>
    </v-form>
</template>

<script>
const API_URL = import.meta.env.VITE_API_URL
export default {
    name: 'SimpleFINConfig',
    props: ['syncProviderId'],
    emits: ['configSaved'],
    created() { this.fetchData() },
    data: () => ({
        valid: false,
        token: null,
        accessKey: null
    }),
    methods: {
        async fetchData() {
            const url = `${API_URL}syncproviders/${this.syncProviderId}/config`
            let res = await (await fetch(url)).json()
            this.token = res.token || null
            this.accessKey = res.accessKey || null
        },
        async save() {
            const url = `${API_URL}syncproviders/${this.syncProviderId}/config`
            let res = await (await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: this.token })
            })).json()
            if (!res.errors) {
                this.$emit('configSaved')
            }
        }
    }
}
</script>