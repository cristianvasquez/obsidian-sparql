<script setup>
import { propertyFromUri } from "vault-triplifier";
import InternalLink from "./helpers/InternalLink.vue";
import { shrink } from "./helpers/utils.js";
import { isFileUri, isNameUri, peekTerm } from "../lib/uriUtils.js";
import { ref, inject } from "vue";
import Term from "./Term.vue";

const props = defineProps({
    header: {
        type: Array,
        required: true,
    },
    rows: {
        type: Array,
        required: true,
    },
});

const error = ref(null);
</script>

<!--Perhaps this could be prettier, see:-->
<!--https://codepen.io/team/Vue/pen/BaKbowJ-->

<template>
    <div v-if="error">
        {{ error }}
    </div>
    <table v-else>
        <thead>
            <tr>
                <th v-for="header of props.header">{{ header }}</th>
            </tr>
        </thead>
        <tr v-for="row of props.rows">
            <td v-for="term of row">
                <Term :term="term"></Term>
            </td>
        </tr>
    </table>
</template>
