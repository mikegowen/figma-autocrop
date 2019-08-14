import autocropperWorker from './autocropper-worker.html'

class Autocropper {
  node: RectangleNode
  noiseThreshold: number
  fills: Array<Paint>
  imagePaint: ImagePaint
  imagePaintIndex: number
  cropDescription: { croppedImageBytes: Uint8Array, cropWidth: number, cropHeight: number }

  constructor(node, noiseThreshold) {
    this.node = node
    this.noiseThreshold = noiseThreshold
    this.fills = [...node.fills]
    this.imagePaint = this._getImagePaint() as ImagePaint // TODO Not sure why I need to do this
    this.imagePaintIndex = this._getImagePaintIndex()
  }

  get image() {
    return figma.getImageByHash(this.imagePaint.imageHash)
  }

  async _getWorkerHTML() {
    return autocropperWorker
  }

  _getImagePaint() {
    return this.fills.find(paint => paint.type === 'IMAGE')
  }

  _getImagePaintIndex() {
    return this.fills.findIndex(paint => paint === this.imagePaint)
  }

  _getNewPaint() {
    const newPaint = JSON.parse(JSON.stringify(this.imagePaint))
    const newImage = figma.createImage(this.cropDescription.croppedImageBytes)
    newPaint.imageHash = newImage.hash
    return newPaint
  }

  _replaceExistingImagePaint() { // TODO Not pure
    const newPaint = this._getNewPaint()
    this.fills.splice(this.imagePaintIndex, 1, newPaint);
  }

  _cropAndPaintNode() { // TODO Not pure
    this.node.fills = []
    this.node.resize(this.cropDescription.cropWidth, this.cropDescription.cropHeight)
    this.node.fills = this.fills
  }

  async crop() {
    const workerHTML = await this._getWorkerHTML()
    const imageBytes = await this.image.getBytesAsync()

    figma.showUI(workerHTML, { visible: false })
    figma.ui.postMessage({ imageBytes: imageBytes, noiseThreshold: this.noiseThreshold })

    this.cropDescription = await new Promise((resolve, reject) => {
      figma.ui.onmessage = value => resolve(value)
    })

    this._replaceExistingImagePaint()
    this._cropAndPaintNode()
  }

  static isValidNode(node) {
    const imagePaintCount = node.fills.filter(paint => paint.type === 'IMAGE').length
    return imagePaintCount === 1
  }
}

export default Autocropper