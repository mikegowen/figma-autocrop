// TODO Define all types and fix warnings in all ts files

import Autocropper from './autocropper'

const selection = figma.currentPage.selection

selection.forEach(node => {
  if (Autocropper.isValidNode(node)) {
    const autocropper = new Autocropper(node, 200)
    autocropper.crop().then((message) => {
      figma.closePlugin(message)
    })
  } else {
    figma.closePlugin("Please only select shapes with a single image fill.")
  }
})