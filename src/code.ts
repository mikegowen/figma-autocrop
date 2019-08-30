import Autocropper from './autocropper'
import errorsHTML from './errors.html'

async function cropNodes(nodes) {
  let errors = []

  for(const node of nodes) {
    let error = {}
    error.node = node.name

    if (Autocropper.isValidNode(node)) {
      const autocropper = new Autocropper(node, 50, 90)
      const response = await autocropper.crop()

      if (response.status != 'success') {
        error.status = response.status
        errors.push(error)
      }
    } else {
      error.status = 'multiple-image-fill'
      errors.push(error)
    }
  }

  return errors
}

cropNodes(figma.currentPage.selection).then(results => {
  const errorMessagesHTML = results.map(result => {
    switch (result.status) {
      case 'multiple-image-fill':
        return `<li class='type--pos-small-normal'>Layer <span class='type--pos-small-bold'>${result.node}</span> contains more than 1 image fill.</li>`
        break
      case 'no-remaining-image':
        return `<li class='type--pos-small-normal'>Layer <span class='type--pos-small-bold'>${result.node}</span> would have no image remaining after being cropped.</li>`
        break 
      case 'nothing-to-crop':
        return `<li class='type--pos-small-normal'>Layer <span class='type--pos-small-bold'>${result.node}</span> doesn\'t have anything to crop.</li>`
        break
    }
  })

  figma.showUI(errorsHTML, { visible: true, width: 420, height: 120 })
  figma.ui.postMessage({ errorMessagesHTML: errorMessagesHTML })

  figma.ui.onmessage = () => figma.closePlugin()
}