import autocropperWorkerHTML from './autocropper-worker.html'

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
    return autocropperWorkerHTML
  }

  get _imagePaint() {
    return this._fills.find(paint => paint.type === 'IMAGE') as ImagePaint
  }

  get _imagePaintIndex() {
    return this._fills.findIndex(paint => paint === this._imagePaint)
  }

  _getNewPaint() {
    this._originalImagePaint = JSON.parse(JSON.stringify(this._imagePaint)) // TODO Move this out of here
    const newPaint = JSON.parse(JSON.stringify(this._imagePaint))

    newPaint.scaleMode = 'CROP'
    newPaint.imageTransform = [
      [
        this._cropDescription.cropWidth / this._cropDescription.imageWidth, // % horiz scaling
        0,
        this._cropDescription.leftCropWidth / this._cropDescription.imageWidth // % horiz moving
      ],
      [
        0,
        this._cropDescription.cropHeight / this._cropDescription.imageHeight, // % vert scaling
        this._cropDescription.topCropHeight / this._cropDescription.imageHeight, // % vert moving
      ]
    ]

    return newPaint
  }

  _replaceExistingImagePaint() {
    this._newPaint = this._getNewPaint()
    this._fills.splice(this._imagePaintIndex, 1, this._newPaint);
  }

  _cropAndPaintNode() {
    const widthTransform = this._originalImagePaint.imageTransform[0][0]
    const heightTransform = this._originalImagePaint.imageTransform[1][1]
    const widthScaleFactor = this._cropDescription.imageWidth / (this._node.width / widthTransform)
    const heightScaleFactor = this._cropDescription.imageHeight / (this._node.height / heightTransform)

    this._node.fills = []
    this._node.resize(
      this._cropDescription.cropWidth / widthScaleFactor,
      this._cropDescription.cropHeight / heightScaleFactor
    )
    this._node.fills = this._fills
  }

  async crop() {
    const autocropperWorkerHTML = await this._getWorkerHTML()
    const imageBytes = await this._image.getBytesAsync()

    figma.showUI(autocropperWorkerHTML, { visible: false })
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

    return response
  }

  static isValidNode(node) {
    const imagePaintCount = node.fills.filter(paint => paint.type === 'IMAGE').length
    return imagePaintCount === 1
  }
}

export default Autocropper