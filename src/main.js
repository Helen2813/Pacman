import Game from './Game.js'
import Sprite from './Sprite.js'
import { loadImage, loadJSON } from "./Loader.js";
import Cinematic from "./Cinematic.js";
import haveCollision from './Additional.js';
import DisplayObject from "./DisplayObject.js";

const scale = 2;

export default async function main () {
    const game = new Game({
        background: 'black',
    })

    document.body.append(game.canvas)

    const image = await loadImage('/sets/spritesheet.png')
    const atlas = await loadJSON('/sets/atlas.json')

    const maze = new Sprite({
        image,
        x: 0,
        y: 0,
        width: atlas.maze.width * scale,
        height: atlas.maze.height * scale,
        frame: atlas.maze
    })

    let foods = atlas.maze.foods
        .map(food => ({
            ...food,
            x: food.x * scale,
            y: food.y * scale,
            width: food.width * scale,
            height: food.height * scale,
        }))
        .map(food => new Sprite({
            image,
            frame: atlas.food,
            ...food,
        }))

    const pacman = new Cinematic({
        image,
        x: atlas.position.pacman.x * scale,
        y: atlas.position.pacman.y * scale,
        width: 13 * scale,
        height: 13 * scale,
        animations: atlas.pacman,
        speedX: 1,
    })

    pacman.start('right');
    const ghosts = ['red', 'pink', 'turquoise', 'banana']
        .map(color => {
            const ghost = new Cinematic({
                image,
                x: atlas.position[color].x * scale,
                y: atlas.position[color].y * scale,
                width: 13 * scale,
                height: 13 * scale,
                animations: atlas[`${color}Ghost`],
            })
            ghost.start(atlas.position[color].direction)

            return ghost;
        })

    const walls = atlas.maze.walls.map(wall => new DisplayObject({
        x: wall.x * scale,
        y: wall.y * scale,
        width: wall.width * scale,
        height: wall.height * scale,
        debug: true
    }))

    game.stage.add(pacman);
    game.canvas.width = maze.width;
    game.canvas.height = maze.height;
    game.stage.add(maze);
    foods.forEach(food => game.stage.add(food));
    ghosts.forEach(ghost => game.stage.add(ghost));
    walls.forEach(wall => game.stage.add(wall));

    game.update = () => {
        const eated = [];
        for (const food of foods) {
            if (haveCollision(pacman, food)) {
                eated.push(food);
                game.stage.remove(food);
            }
        }
        foods = foods.filter(food => !eated.includes(food));

        changeDirection(pacman);

        const wall = getWallCollision(pacman.getNextposition());

        if (wall) {
            pacman.start(`whait${pacman.animation.name}`);
            pacman.speedX = 0;
            pacman.speedY = 0;
        }
    }

    document.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft') {
            pacman.nextDirection = 'left';
        } else if (event.key === 'ArrowRight') {
            pacman.nextDirection = 'right';
        } else if (event.key === 'ArrowUp') {
            pacman.nextDirection = 'up';
        } else if (event.key === 'ArrowDown') {
            pacman.nextDirection = 'down';
    }})

    function getWallCollision (obj) {
        for (const wall of walls) {
            if (haveCollision(wall, obj)) return wall;
        }

        return null;
    }

    function changeDirection (sprite) {
        if (sprite.nextDirection === 'up') {
            sprite.y -= 10;
            if (!getWallCollision(sprite)) {
                sprite.nextDirection = '';
                sprite.start('up');
                sprite.speedX = 0;
                sprite.speedY = -1;
            }
            sprite.y += 10;
        } else if (sprite.nextDirection === 'down') {
            sprite.y += 10;
            if (!getWallCollision(sprite)) {
                sprite.nextDirection = '';
                sprite.start('down');
                sprite.speedX = 0;
                sprite.speedY = 1;
            }
            sprite.y -= 10;
        } else if (sprite.nextDirection === 'left') {
            sprite.x -= 10;
            if (!getWallCollision(sprite)) {
                sprite.nextDirection = '';
                sprite.start('left');
                sprite.speedX = -1;
                sprite.speedY = 0;
            }
            sprite.x += 10;
        } else if (sprite.nextDirection === 'right') {
            sprite.x += 10;
            if (!getWallCollision(sprite)) {
                sprite.nextDirection = '';
                sprite.start('right');
                sprite.speedX = 1;
                sprite.speedY = 0;
            }
            sprite.x -= 10;
        }
    }
}