import Autocropper from './autocropper'

figma.currentPage.selection.forEach(node => {
  if (Autocropper.isValidNode(node)) {
    const autocropper = new Autocropper(node, 50, 90)
    autocropper.crop().then((closeMessage) => {
      figma.closePlugin(closeMessage) // TODO Multiple selections is broken
    })
  } else {
    figma.closePlugin("Please only select shapes with a single image fill.")
  }
})