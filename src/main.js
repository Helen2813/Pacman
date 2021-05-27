import Game from './Game.js'
import Sprite from './Sprite.js'
import { loadImage, loadJSON } from "./Loader.js";
import Cinematic from "./Cinematic.js";
import { getRandomFrom, haveCollision } from './Additional.js';
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
            ghost.start(atlas.position[color].direction);
            ghost.nextDirection = atlas.position[color].direction;

            return ghost;
        })

    const walls = atlas.maze.walls.map(wall => new DisplayObject({
        x: wall.x * scale,
        y: wall.y * scale,
        width: wall.width * scale,
        height: wall.height * scale,
        // debug: true
    }));

    const leftPortal = new DisplayObject({
        x: atlas.position.leftPortal.x * scale,
        y: atlas.position.leftPortal.y * scale,
        width: atlas.position.leftPortal.width * scale,
        height: atlas.position.leftPortal.height * scale,
    });

    const rightPortal = new DisplayObject({
        x: atlas.position.rightPortal.x * scale,
        y: atlas.position.rightPortal.y * scale,
        width: atlas.position.rightPortal.width * scale,
        height: atlas.position.rightPortal.height * scale,
    });

    let tablets = atlas.position.tablets
        .map(tablet => new Sprite({
            image,
            frame: atlas.tablet,
            x: tablet.x * scale,
            y: tablet.y * scale,
            width: tablet.width * scale,
            height: tablet.height * scale,
        }));

    game.stage.add(pacman);
    game.canvas.width = maze.width;
    game.canvas.height = maze.height;
    game.stage.add(maze);
    game.stage.add(leftPortal);
    game.stage.add(rightPortal);
    foods.forEach(food => game.stage.add(food));
    ghosts.forEach(ghost => game.stage.add(ghost));
    walls.forEach(wall => game.stage.add(wall));
    tablets.forEach(tablet => game.stage.add(tablet));

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
        ghosts.forEach(changeDirection);

        for (let ghost of ghosts) {
            const wall = getWallCollision(ghost.getNextposition());

            if (wall) {
               ghost.speedX = 0;
               ghost.speedY = 0;
            }

            if (ghost.speedX === 0 && ghost.speedY === 0) {
                if (ghost.animation.name === 'up') {
                    ghost.nextDirection = getRandomFrom('left', 'right', 'down');
                } else if (ghost.animation.name === 'down') {
                    ghost.nextDirection = getRandomFrom('left', 'right', 'up');
                } else if (ghost.animation.name === 'right') {
                    ghost.nextDirection = getRandomFrom('left', 'down', 'up');
                } else if (ghost.animation.name === 'left') {
                    ghost.nextDirection = getRandomFrom('right', 'down', 'up');
                }
            }

            if (pacman.play && haveCollision(pacman, ghost)) {
                    pacman.speedY = 0;
                    pacman.speedX = 0;
                    pacman.start('die', {
                        onEnd () {
                            pacman.play = false;
                            pacman.stop();
                            game.stage.remove(pacman);
                        }
                    });
            }
        }
    // }

        const wall = getWallCollision(pacman.getNextposition());

        if (wall) {
            pacman.start(`wait${pacman.animation.name}`);
            pacman.speedX = 0;
            pacman.speedY = 0;
        }

        if (haveCollision(pacman, leftPortal)) {
            pacman.x = atlas.position.rightPortal.x * scale - pacman.width - 1;
        }

        if (haveCollision(pacman, rightPortal)) {
            pacman.x = atlas.position.leftPortal.x * scale + pacman.width + 1;
        }

        for (let i = 0; i < tablets.length; i++) {
            const tablet = tablets[i];

            if (haveCollision(pacman, tablet)) {
                tablets.splice(i, 1);
                game.stage.remove(tablet);

                ghosts.forEach(ghost => {
                    ghost.animations = atlas.blueGhost;
                    ghost.start(ghost.animation.name);
                })
                break;
            }
        }
    }

    document.addEventListener('keydown', event => {
        if (!pacman.play) return;

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
        if (!sprite.nextDirection) return;

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