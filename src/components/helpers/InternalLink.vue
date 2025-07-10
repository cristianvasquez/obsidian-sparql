<script setup>
import { openOrSwitch, hoverPreview, isInVault } from 'obsidian-community-lib'
import { inject } from '@vue/runtime-core'
import { getTitleFromInternalUri, getPathFromInternalUri, getNameFromInternalUri } from '../../lib/uriUtils.js'

function getFileTitle (linkToTerm) {
  // Use our utility that works with Term objects
  return getTitleFromInternalUri(linkToTerm)
}

function getFilePath (linkToTerm) {
  try {
    // Try to get name from URI first (for urn:name: URIs)
    const name = getNameFromInternalUri(linkToTerm)
    if (name && typeof name === 'string') {
      return name
    }
    
    // Try to get path from URI (for urn:resource: or file:// URIs)
    const path = getPathFromInternalUri(linkToTerm, context.app)
    if (path && typeof path === 'string') {
      // If it's a full file system path, convert to vault-relative path
      if (path.startsWith('/')) {
        // Extract just the filename for vault-relative path
        const filename = path.substring(path.lastIndexOf('/') + 1)
        const cleanName = filename.endsWith('.md') ? filename.substring(0, filename.length - 3) : filename
        return cleanName
      }
      return path
    }
    
    // Last fallback - shouldn't happen for internal URIs
    return 'Unknown'
  } catch (error) {
    console.error('Error in getFilePath:', error)
    return 'Unknown'
  }
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

function checkIsInVault() {
  try {
    const filePath = getFilePath(props.linkTo)
    
    if (!filePath || typeof filePath !== 'string') {
      return false
    }
    
    // Use isInVault with correct parameters: noteName, sourcePath
    return isInVault(filePath)
  } catch (error) {
    console.error('Error checking if file is in vault:', error)
    return false
  }
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
