<script setup>
import { hoverPreview, isInVault, openOrSwitch } from 'obsidian-community-lib'
import { inject } from '@vue/runtime-core'

function getFileTitle (path) {
  if (path.includes('/')) path = path.substring(path.lastIndexOf('/') + 1)
  if (path.endsWith('.md')) path = path.substring(0, path.length - 3)
  return path
}

const SIDE_VIEW_ID = `obsidian-sparql-sideview`

const context = inject('context')

const props = defineProps({
  linkTo: {
    type: String,
    required: true,
  },
})

async function open (event) {
  await openOrSwitch(context.app, props.linkTo, event)
}

async function hover (event) {
  const trickObsidianAPI = {
    app: context.app,
    getViewType: () => SIDE_VIEW_ID,
  }

  await hoverPreview(event, trickObsidianAPI, props.linkTo)
}

</script>

<template>
        <span
            class="internal-link"
            @click="open"
            @mouseover="hover"
        >
          <a
              :class="isInVault(context.app, linkTo)?'':'is-unresolved'"
              class="internal-link"
          >{{ getFileTitle(props.linkTo) }}</a
          >
        </span>
</template>
