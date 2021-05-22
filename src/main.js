import Game from './Game.js'
import Sprite from './Sprite.js'
import { loadImage, loadJSON } from "./Loader.js";
import Cinematic from "./Cinematic.js";

export default async function main () {
    const game = new Game({
        width: 500,
        height: 500,
        background: 'black',
    })

    document.body.append(game.canvas)

    const image = await loadImage('/sets/spritesheet.png')
    const atlas = await loadJSON('/sets/atlas.json')

    // const maze = new Sprite({
    //     image,
    //     x: 0,
    //     y: 0,
    //     width: 224,
    //     height: 255,
    //     frame: {
    //         x: 0,
    //         y: 0,
    //         width: 224,
    //         height: 255,
    //     }
    // })

    // game.stage.add(maze)
    const pacman = new Cinematic({
        image,
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        animations: atlas.pacman
    })

    const redGhost = new Cinematic({
        image,
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        animations: atlas.redGhost
    })
    pacman.start('right');
    redGhost.start('right');

    game.stage.add(pacman);
    game.stage.add(redGhost);
}