<template>
  <v-sheet rounded="rounded">
    <v-table class="pa-3">
      <tbody>
        <tr v-for="item in importResult" :key="item.accountName">
          <td>{{ item.accountName }}</td>
          <td class="text-center">{{ item.added }} New</td>
          <td class="text-center">{{ item.updated }} Updated</td>
        </tr>
      </tbody>
    </v-table>
  </v-sheet>
</template>

<script>
export default {
  name: "BudgetSuccess",
  props: ["importResult"]
}
</script>