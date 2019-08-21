import autocropperWorker from './autocropper-worker.html'

class Autocropper {
  _node: RectangleNode
  _noiseThreshold: number
  _fills: Array<Paint>
  _cropDescription: {
    leftCropWidth: number,
    topCropHeight: number,
    cropWidth: number,
    cropHeight: number
    imageWidth: number,
    imageHeight: number
  }

  constructor(node, noiseThreshold) {
    this._node = node
    this._noiseThreshold = noiseThreshold
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
      return "There would be no remaining image after cropping."
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