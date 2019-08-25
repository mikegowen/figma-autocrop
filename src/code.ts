import Autocropper from './autocropper'

const selection = figma.currentPage.selection

selection.forEach(node => {
  if (Autocropper.isValidNode(node)) {
    const autocropper = new Autocropper(node, 50, 90)
    autocropper.crop().then((closeMessage) => {
      figma.closePlugin(closeMessage) // TODO Multiple selections is broken
    })
  } else {
    figma.closePlugin("Please only select shapes with a single image fill.")
  }
})