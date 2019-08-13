import Autocrop from './autocrop'

const selection = figma.currentPage.selection

selection.forEach(node => {
  if (Autocrop.isValidNode(node)) {
    const autocrop = new Autocrop(node, 200)
    autocrop.crop().then(() => {
      figma.closePlugin()
    })
  } else {
    figma.closePlugin("Please only select shapes with a single image fill.")
  }
})