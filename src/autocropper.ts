import autocropperWorker from './autocropper-worker.html'

class Autocropper {
  constructor(node, noiseThreshold, colorPercentage) {
    this._node = node
    this._noiseThreshold = noiseThreshold
    this._colorPercentage = colorPercentage
    this._fills = [...node.fills]
  }

  get _image() {
    return figma.getImageByHash(this._imagePaint.imageHash)
  }

  _getWorkerHTML() {
    return autocropperWorker
  }

  get _imagePaint() {
    return this._fills.find(paint => paint.type === 'IMAGE') as ImagePaint
  }

  get _imagePaintIndex() {
    return this._fills.findIndex(paint => paint === this._imagePaint)
  }

  _getNewPaint() {
    const newPaint = JSON.parse(JSON.stringify(this._imagePaint))
    newPaint.scaleMode = 'CROP'
    newPaint.imageTransform = [
      [
        this._cropDescription.cropWidth / this._cropDescription.imageWidth,
        0,
        this._cropDescription.leftCropWidth / this._cropDescription.imageWidth
      ],
      [
        0,
        this._cropDescription.cropHeight / this._cropDescription.imageHeight,
        this._cropDescription.topCropHeight / this._cropDescription.imageHeight,
      ]
    ]
    return newPaint
  }

  _replaceExistingImagePaint() {
    const newPaint = this._getNewPaint()
    this._fills.splice(this._imagePaintIndex, 1, newPaint);
  }

  _cropAndPaintNode() { // TODO Don't resize if nothing cropped
    const scaleFactor = this._cropDescription.imageHeight / this._node.height
    this._node.fills = []
    this._node.resize(this._cropDescription.cropWidth / scaleFactor, this._cropDescription.cropHeight / scaleFactor)
    this._node.fills = this._fills
  }

  async crop() {
    const workerHTML = await this._getWorkerHTML()
    const imageBytes = await this._image.getBytesAsync()

    figma.showUI(workerHTML, { visible: false })
    figma.ui.postMessage(
      {
        imageBytes: imageBytes,
        noiseThreshold: this._noiseThreshold,
        colorPercentage: this._colorPercentage
      }
    )

    const response = await new Promise((resolve, reject) => {
      figma.ui.onmessage = value => resolve(value)
    })

    if (response.status === 'success') {
      this._cropDescription = response.data
      this._replaceExistingImagePaint()
      this._cropAndPaintNode()
    }

    return response.status
  }

  static isValidNode(node) {
    const imagePaintCount = node.fills.filter(paint => paint.type === 'IMAGE').length
    return imagePaintCount === 1
  }
}

export default Autocropper