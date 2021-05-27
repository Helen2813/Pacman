import DisplayObject from "./DisplayObject.js";

export default class PointsText extends DisplayObject {
    constructor(props = {}) {
        super(props);

        this.font = props.font ?? '20px serif';
        this.content = props.content ?? '';
        this.fill = props.fill ?? 'white';
    }

    draw (context) {
        context.beginPath();
        context.font = this.font;
        context.fillStyle = this.fill;
        context.textAlign = 'center';
        context.fillText(this.content, this.x, this.y);
    }
}