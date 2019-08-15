import autocropperWorker from './autocropper-worker.html'

class Autocropper {
  _node: RectangleNode
  _noiseThreshold: number
  _fills: Array<Paint>
  _imagePaint: ImagePaint
  _imagePaintIndex: number
  _cropDescription: { croppedImageBytes: Uint8Array, cropWidth: number, cropHeight: number }
  response: { status: string, data: {} | { croppedImageBytes: Uint8Array, cropWidth: number, cropHeight: number } }

  constructor(node, noiseThreshold) {
    this._node = node
    this._noiseThreshold = noiseThreshold
    this._fills = [...node.fills]
    this._imagePaint = this._getImagePaint() as ImagePaint // TODO Not sure why I need to do this
    this._imagePaintIndex = this._getImagePaintIndex()
  }

  get _image() {
    return figma.getImageByHash(this._imagePaint.imageHash)
  }

  _getWorkerHTML() {
    return autocropperWorker
  }

  _getImagePaint() {
    return this._fills.find(paint => paint.type === 'IMAGE')
  }

  _getImagePaintIndex() {
    return this._fills.findIndex(paint => paint === this._imagePaint)
  }

  _getNewPaint() {
    const newPaint = JSON.parse(JSON.stringify(this._imagePaint))
    const newImage = figma.createImage(this._cropDescription.croppedImageBytes)
    newPaint.imageHash = newImage.hash
    return newPaint
  }

  _replaceExistingImagePaint() {
    const newPaint = this._getNewPaint()
    this._fills.splice(this._imagePaintIndex, 1, newPaint);
  }

  _cropAndPaintNode() {
    this._node.fills = []
    this._node.resize(this._cropDescription.cropWidth, this._cropDescription.cropHeight)
    this._node.fills = this._fills
  }

  async crop() {
    const workerHTML = await this._getWorkerHTML()
    const imageBytes = await this._image.getBytesAsync()

    figma.showUI(workerHTML, { visible: false })
    figma.ui.postMessage({ imageBytes: imageBytes, noiseThreshold: this._noiseThreshold })

    const response = await new Promise((resolve, reject) => {
      figma.ui.onmessage = value => resolve(value)
    })

    if (response.status === 'success') {
      this._cropDescription = response.data
    } else if (response.status === 'no-remaining-image') {
      return "There was no remaining image after cropping. Aborting."
    }

    this._replaceExistingImagePaint()
    this._cropAndPaintNode()
  }

  static isValidNode(node) {
    const imagePaintCount = node.fills.filter(paint => paint.type === 'IMAGE').length
    return imagePaintCount === 1
  }
}

export default Autocropper