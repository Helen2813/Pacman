import Game from './Game.js'
import Sprite from './Sprite.js'
import { loadImage, loadJSON } from "./Loader.js";
import Cinematic from "./Cinematic.js";
import { getRandomFrom, haveCollision } from './Additional.js';
import DisplayObject from "./DisplayObject.js";
import Group from "./Group.js";
import PointsText from "./Text.js";

const scale = 2.7;

export default async function main () {
    const game = new Game({
        background: 'black',
        width: 610,
        height: 800,
    });

    const party = new Group();
    party.offsetY = 50;
    game.stage.add(party);

    const state = new PointsText({
        x: game.canvas.width / 2,
        y: -5 * scale,
        content: '0 points',
        fill: 'white',
    });
    state.points = 0;

    party.add(state);

    document.body.append(game.canvas)

    const image = await loadImage('./sets/spritesheet.png')
    const atlas = await loadJSON('./sets/atlas.json')

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
            ghost.isBlue = false;

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

    party.add(pacman);
    party.add(maze);
    party.add(leftPortal);
    party.add(rightPortal);
    foods.forEach(food => party.add(food));
    ghosts.forEach(ghost => party.add(ghost));
    walls.forEach(wall => party.add(wall));
    tablets.forEach(tablet => party.add(tablet));

    game.update = () => {
        const eated = [];
        for (const food of foods) {
            if (haveCollision(pacman, food)) {
                eated.push(food);
                party.remove(food);
                state.points += 100;
                state.content = `${state.points} points`;
            }
        }
        foods = foods.filter(food => !eated.includes(food));

        changeDirection(pacman);
        ghosts.forEach(changeDirection);

        for (let ghost of ghosts) {
            if (!ghost.play) return;

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

            if (pacman.play && ghost.play && haveCollision(pacman, ghost)) {
                if (ghost.isBlue) {
                    ghost.play = false;
                    ghost.speedY = 0;
                    ghost.speedX = 0;
                    party.remove(ghost);
                    ghosts.splice(ghosts.indexOf(ghost), 1);

                    state.points += 5000;
                    state.content = `${state.points} points`;
                } else {
                    pacman.speedY = 0;
                    pacman.speedX = 0;
                    pacman.start('die', {
                        onEnd () {
                            pacman.play = false;
                            pacman.stop();
                            party.remove(pacman);
                        }
                    });
                }
            }
            if (haveCollision(ghost, leftPortal)) {
                ghost.x = atlas.position.rightPortal.x * scale - ghost.width - 1;
            }

            if (haveCollision(ghost, rightPortal)) {
                ghost.x = atlas.position.leftPortal.x * scale + ghost.width + 1;
            }
        }

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
                party.remove(tablet);

                ghosts.forEach(ghost => {
                    ghost.originalAnimations = ghost.animations;
                    ghost.animations = atlas.blueGhost;
                    ghost.isBlue = true;
                    ghost.start(ghost.animation.name);
                })

                setTimeout(() => {
                    ghosts.forEach(ghost => {
                        ghost.animations = ghost.originalAnimations;
                        ghost.isBlue = false;
                        ghost.start(ghost.animation.name);
                    })
                }, 5000);
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