import Autocropper from './autocropper'

async function cropNode(node) {
  const autocropper = new Autocropper(node, 50, 90)
  const status = await autocropper.crop()
  return status
}

async function cropNodes(nodes) {
  let status = {}

  for(const node of nodes) {
    if (Autocropper.isValidNode(node)) {
      status = await cropNode(node)
      if (status != 'success') {
        return status
      }
    } else {
      status = 'multiple-image-fill'
      return status
    }
  }
}

cropNodes(figma.currentPage.selection).then(status => {
  let closeMessage = ''

  switch (status) { // TODO Can all of this be done with Error objects?
    // TODO Pass node name to help user find issue
    case 'multiple-image-fill':
      closeMessage = 'Please only select shapes with a single image fill.'
      break
    case 'no-remaining-image':
      closeMessage = 'One or more seelcted items would have no image left if cropped.'
      break 
    case 'nothing-to-crop':
      closeMessage = 'One more selected items doesn\'t have anything to crop.'
      break
  }

  figma.closePlugin(closeMessage)
}