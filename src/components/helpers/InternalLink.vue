<script setup>
import { openOrSwitch, hoverPreview, isInVault } from 'obsidian-community-lib'
import { inject } from '@vue/runtime-core'
import { getTitleFromUri, getPathFromFileUri, getNameFromNameUri, isNameResolved, isNameUri } from '../../lib/uriUtils.js'

const getFileTitle = (linkToTerm) => getTitleFromUri(linkToTerm, context.app)

const getFilePath = (linkToTerm) => {
  const name = getNameFromNameUri(linkToTerm)
  if (name) return name
  
  const path = getPathFromFileUri(linkToTerm)
  if (path) {
    const fileName = path.split('/').pop()
    return fileName.endsWith('.md') ? fileName.replace(/\.md$/, '') : fileName
  }
  
  return 'Unknown'
}

const SIDE_VIEW_ID = `obsidian-sparql-sideview`

const context = inject('context')

const props = defineProps({
  linkTo: {
    type: Object, // Now expects a Term object
    required: true,
  },
})

async function open (event) {
  try {
    const filePath = getFilePath(props.linkTo)
    
    if (!filePath || typeof filePath !== 'string') {
      console.error('Invalid file path for opening:', filePath)
      return
    }
    
    // Use openOrSwitch with correct parameters: dest, event, options
    await openOrSwitch(filePath, event, { createNewFile: true })
  } catch (error) {
    console.error('Error opening file:', error)
  }
}

async function hover (event) {
  try {
    const filePath = getFilePath(props.linkTo)
    
    if (!filePath || typeof filePath !== 'string') {
      console.error('Invalid file path for hover:', filePath)
      return
    }
    
    // Use a simple mock view object for hoverPreview
    const mockView = {
      app: context.app,
      getViewType: () => 'sparql-internal-link'
    }
    
    hoverPreview(event, mockView, filePath)
  } catch (error) {
    console.error('Error showing hover preview:', error)
  }
}

const checkIsInVault = () => {
  if (isNameUri(props.linkTo)) {
    return isNameResolved(props.linkTo, context.app)
  }
  
  const filePath = getFilePath(props.linkTo)
  return filePath !== 'Unknown' && isInVault(filePath)
}

</script>

<template>
        <span
            class="internal-link"
            :class="checkIsInVault()?'':'is-unresolved'"
            @click="open"
            @mouseover="hover"
        >{{ getFileTitle(props.linkTo) }}</span>
</template>
