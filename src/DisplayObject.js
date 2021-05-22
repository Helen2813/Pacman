export default class DisplayObject {
    constructor(props = {}) {
        this.visible = props.visible || true
        this.x = props.x || 0
        this.y = props.y || 0

        this.width = props.width || 10
        this.height = props.height || 10
    }

    draw () {}

    update () {

    }
}