export default class DisplayObject {
    constructor(props = {}) {
        this.visible = props.visible || true
        this.x = props.x || 0
        this.y = props.y || 0

        this.width = props.width || 10
        this.height = props.height || 10

        this.debug = props.debug ?? false
    }

    draw (context) {
        if (this.debug) {
            context.beginPath()
            context.rect(this.x, this.y, this.width, this.height)
            context.fillStyle = 'rgba(0, 255, 0, 0.3)'
            context.fill()

            context.beginPath()
            context.rect(this.x, this.y, this.width, this.height)
            context.strokeStyle = 'green'
            context.stroke()
        }
    }

    update () {

    }
}