/**
 * This code is based on tutorial from:
 * http://jlongster.com/Making-Sprite-based-Games-with-Canvas
 */

import './game.css'
import sprites from './images/sprites.png';
import Sprite from './sprite';
import {load, onReady} from './resources';
import isDown from './input';

document.getElementById('game-canvas').style.width = document.documentElement.clientWidth + 'px';
document.getElementById('game-canvas').style.height = document.documentElement.clientHeight + 'px';

// Create the canvas
var canvas = document.createElement("canvas");
canvas.width = document.getElementById('game-canvas').offsetWidth;
canvas.height = document.getElementById('game-canvas').offsetHeight;
document.getElementById('game-canvas').appendChild(canvas);
var ctx = canvas.getContext("2d");

var canvasBlocks = [0, 0, 0];
let middleLane = Math.max(230, canvas.width * 0.6);
canvasBlocks[0] = 0;
canvasBlocks[1] = (canvas.width - middleLane) / 2;
canvasBlocks[2] = canvasBlocks[1] + middleLane;

const SIZE_MULTIPLICATOR = Math.min(middleLane / 166.67, 1.8);
const TERRAIN_LINE_HEIGHT = 154;
const PLAYER_SPEED = 300;
const BASE_PLAYER_HEIGHT = 65;
const ENEMY_SPEED = 100;

var playerLives = 3;
var gameTime = 0;
var enemies = [];
var terrain = [];
var speedModifier = 1;
var isPaused = false;
var lastTime;

// ensure that minimal gap between objects is 1.5 times the car
// TODO měnit v průběhu pro zvýšení složitosti?
var tolerancePathHeight = BASE_PLAYER_HEIGHT * SIZE_MULTIPLICATOR * 2.5;

// A cross-browser requestAnimationFrame
// See https://hacks.mozilla.org/2011/08/animating-with-javascript-from-setinterval-to-requestanimationframe/
var requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

var roadRect = {
    top: 0,
    left: canvasBlocks[1] + 20,
    bottom: canvas.height,
    right: canvasBlocks[2] - 20
}

function main() {
    var now = Date.now();
    var dt = (now - lastTime) / 1000.0;

    update(dt);
    redraw();

    lastTime = now;
    requestAnimFrame(main);
};

// Game state
var player = {
    pos: [0, 0],
    lane: 0,
    sprite_alive: new Sprite(sprites, [352, 159], [35, 65], SIZE_MULTIPLICATOR, 16, [0]),
    sprite_immortal: new Sprite(sprites, [352, 159], [35, 65], SIZE_MULTIPLICATOR, 16, [0, 6]),
    sprite_damaged: new Sprite(sprites, [396, 178], [35, 59], SIZE_MULTIPLICATOR, 16, [0]),
    sprite_immortal_damaged: new Sprite(sprites, [396, 178], [35, 59], SIZE_MULTIPLICATOR, 16, [0, 6]),
    sprite_exploding: new Sprite(sprites, [383, 242], [45, 40],
        SIZE_MULTIPLICATOR, 10, [0, 1], null, true),
    immortal: false,
    revived: false,
    moving: 0
};

var lifeBar = {
    frame: new Sprite(sprites, [486, 1], [16, 133], SIZE_MULTIPLICATOR, 16, [0]),
    bar_1: new Sprite(sprites, [487, 228], [11, 43], SIZE_MULTIPLICATOR, 16, [0]),
    bar_2: new Sprite(sprites, [487, 185], [11, 86], SIZE_MULTIPLICATOR, 16, [0]),
    bar_3: new Sprite(sprites, [487, 142], [11, 129], SIZE_MULTIPLICATOR, 16, [0]),
    render: 'bar_3'
}

function init() {
    initTerrain();

    document.getElementById('play-again').addEventListener('click', function () {
        reset();
    });

    document.getElementById('game-canvas').addEventListener('mousedown', function (e) {
        if (e.offsetX < player.pos[0]) {
            startMovingPlayer(-1);
        }

        if (e.offsetX > player.pos[0] + getPlayerSprite().width) {
            startMovingPlayer(1);
        }
    });

    reset();
    lastTime = Date.now();
    main();
}

function initTerrain() {
    let yPos = 0;
    while (yPos < canvas.height) {
        generateNewTerrainLine(yPos);

        yPos += TERRAIN_LINE_HEIGHT;
    }
}

/**
 * Creates new terrain that is yet invisible
 */
function generateNewTerrainLine(yPos) {
    let firstBlockPicXPos = Math.min(canvasBlocks[0],
        canvasBlocks[1] - 77 * SIZE_MULTIPLICATOR);
    pickRandomTerrain([1, 2], firstBlockPicXPos, yPos);
    terrain.push({
        pos: [canvasBlocks[1], yPos],
        sprite: new Sprite(sprites, [262, 2], [169, TERRAIN_LINE_HEIGHT],
            SIZE_MULTIPLICATOR, 16, [0])
    });
    pickRandomTerrain([3, 4], canvasBlocks[2], yPos);
}

function pickRandomTerrain(possibilities, xPos, yPos) {
    let len = possibilities.length;
    let index = parseInt(Math.random() * len, 10) % len;

    if (possibilities[index] === 1) {
        terrain.push({
            pos: [xPos, yPos],
            sprite: new Sprite(sprites, [3, 134], [77, TERRAIN_LINE_HEIGHT],
                SIZE_MULTIPLICATOR, 16, [0])
        });
    }
    if (possibilities[index] === 2) {
        terrain.push({
            pos: [xPos, yPos],
            sprite: new Sprite(sprites, [92, 134], [77, TERRAIN_LINE_HEIGHT],
                SIZE_MULTIPLICATOR, 16, [0])
        });
    }
    if (possibilities[index] === 3) {
        terrain.push({
            pos: [xPos, yPos],
            sprite: new Sprite(sprites, [181, 162], [77, TERRAIN_LINE_HEIGHT],
                SIZE_MULTIPLICATOR, 16, [0])
        });
    }
    if (possibilities[index] === 4) {
        terrain.push({
            pos: [xPos, yPos],
            sprite: new Sprite(sprites, [269, 162], [77, TERRAIN_LINE_HEIGHT],
                SIZE_MULTIPLICATOR, 16, [0])
        });
    }
    if (possibilities[index] === 5) {
        terrain.push({
            pos: [xPos, yPos],
            sprite: new Sprite(sprites, [3, 294], [77, TERRAIN_LINE_HEIGHT],
                SIZE_MULTIPLICATOR, 16, [0])
        });
    }
    if (possibilities[index] === 6) {
        terrain.push({
            pos: [xPos, yPos],
            sprite: new Sprite(sprites, [92, 294], [77, TERRAIN_LINE_HEIGHT],
                SIZE_MULTIPLICATOR, 16, [0])
        });
    }
    if (possibilities[index] === 7) {
        terrain.push({
            pos: [xPos, yPos],
            sprite: new Sprite(sprites, [180, 322], [77, TERRAIN_LINE_HEIGHT],
                SIZE_MULTIPLICATOR, 16, [0])
        });
    }
    if (possibilities[index] === 8) {
        terrain.push({
            pos: [xPos, yPos],
            sprite: new Sprite(sprites, [268, 322], [77, TERRAIN_LINE_HEIGHT],
                SIZE_MULTIPLICATOR, 16, [0])
        });
    }
}

load([sprites]);
onReady(init);

// Reset game to original state
function reset() {
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game-over-overlay').style.display = 'none';

    player.lane = 1;
    player.moving = 0;
    player.pos = [canvasBlocks[0] + getObjectXPos(player.lane), getMaximumYPos()];
    player.sprite_exploding.reset();
    speedModifier = 1;
    playerLives = 3;
    gameTime = 0;
    handleLifeBar();

    enemies = [];
}

function getMaximumYPos() {
    return canvas.height - BASE_PLAYER_HEIGHT * SIZE_MULTIPLICATOR - 33;
}

function update(dt) {
    if (!isPaused && !player.revived && playerLives > 0) {
        gameTime += dt;
        speedModifier = Math.pow(1.01, gameTime);
    }

    handleInput(dt);

    if (!isPaused) {
        updateEntities(dt);

        // TODO s tímhle se dá taky pohrát na změny obtížnosti
        if (Math.random() < 0.02) {
            let xPosArray = [0, 1, 2];
            shuffleArray(xPosArray);
            tryToPlaceEnemy(xPosArray, dt);
        }
    }

    checkCollisions();
    handleLifeBar();
}

/**
 * Randomize array element order in-place.
 * Using Durstenfeld shuffle algorithm.
 */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function tryToPlaceEnemy(xPosArray, dt) {
    let enemy = pickNewEnemy();
    let yPos = -enemy.size[1] * SIZE_MULTIPLICATOR;
    let deltaT = calculateEnemyArrival(enemy, yPos);
    let found = enemiesUnderTolerance(dt, tolerancePathHeight, deltaT);

    for (let i = 0; i < 3; i++) {
        let xPos = xPosArray[i];

        if (checkPathExists(found, xPos)) {
            if (blockPlacingObstacleIfCarFound(xPos, enemy.obstacle)) {
                continue;
            }

            enemies.push({
                pos: [canvasBlocks[0] + getObjectXPos(xPos), yPos],
                lane: xPos,
                sprite: new Sprite(sprites, enemy.pos, enemy.size,
                    SIZE_MULTIPLICATOR, 16, [0, 1]),
                obstacle: enemy.obstacle
            });
            return;
        }
    }
}

/**
 * TODO bylo by super nastavovat rozdílné rychlosti, ale potom je potřeba řešit
 * kolize nepřátel mezi sebou
 */
function pickNewEnemy() {
    let pick = parseInt(Math.random() * 10, 10) % 10;
    if (pick >= 0 && pick <= 2) {
        return {pos: [440, 176], size: [36, 56], obstacle: false}
    }
    if (pick >= 3 && pick <= 5) {
        return {pos: [352, 227], size: [27, 45], obstacle: false}
    }
    if (pick >= 6 && pick <= 7) {
        return {pos: [439, 0], size: [37, 81], obstacle: false}
    }
    if (pick === 8) {
        return {pos: [439, 88], size: [37, 81], obstacle: false}
    }
    if (pick >= 9) {
        return {pos: [356, 276], size: [25, 18], obstacle: true}
    }
}

/**
 * Calculates number of intervals before object arrives at the player.
 * t = s / v
 *
 * TODO pro zjednodušení je enemyDeltaConstantTime konstantní v každém bodě, i když se
 *      dt lehce mění. Předělat na přesný výpočet?
 */
function calculateEnemyArrival(enemy, yPos) {
    let distance = player.pos[1] + getPlayerSprite().height - yPos;
    return distance / enemyDeltaConstantTime(enemy);
}

function checkPathExists(found, xPos) {
    if (found[xPos]) {
        return false;
    }

    if (xPos === 0 || xPos === 2) {
        return !found[1];
    }

    return !found[0] || !found[2];
}

function enemiesUnderTolerance(dt, tolerance, deltaT) {
    let found = [false, false, false];

    enemies.forEach(function (enemy) {
        let enemyEndPosition = enemy.pos[1] + deltaT * enemyDeltaConstantTime(enemy);
        if (Math.abs(player.pos[1] + getPlayerSprite().height - enemyEndPosition) < tolerance) {
            found[enemy.lane] = true;
        }
    });

    return found;
}

/**
 * If there is a car in the lane, don't place obstacle there.
 * Hack to solve different speeds.
 */
function blockPlacingObstacleIfCarFound(xPos, isObstacle) {
    let found = false;
    if (isObstacle) {
        enemies.forEach(function (enemy) {
            if (enemy.lane === xPos) {
                found = true;
            }
        });
    }

    return found;
}

function handleInput(dt) {
    if (isDown('DOWN') || isDown('s')) {
        player.pos[1] += PLAYER_SPEED * dt;
    }

    if (isDown('UP') || isDown('w')) {
        player.pos[1] -= PLAYER_SPEED * dt;
    }

    if (isDown('LEFT') || isDown('a')) {
        player.pos[0] -= PLAYER_SPEED * dt;
    }

    if (isDown('RIGHT') || isDown('d')) {
        player.pos[0] += PLAYER_SPEED * dt;
    }

    if (isDown('SPACE')) {
        isPaused = !isPaused;
    }

    if (player.pos[0] < roadRect.left) {
        player.pos[0] = roadRect.left;
    }
    if (player.pos[0] + getPlayerSprite().width > roadRect.right) {
        player.pos[0] = roadRect.right - getPlayerSprite().width;
    }
    if (player.pos[1] > getMaximumYPos()) {
        player.pos[1] = getMaximumYPos();
    }
    if (player.pos[1] < 0) {
        player.pos[1] = 0
    }
}

function startMovingPlayer(direction) {
    if (player.moving !== 0) {
        return;
    }

    if (direction === -1 && player.lane > 0) {
        player.lane--;
        player.moving = -1;
    }

    if (direction === 1 && player.lane < 2) {
        player.lane++;
        player.moving = 1;
    }
}

function movePlayer(dt) {
    if (player.moving === 0) {
        return;
    }

    let moveTo = getObjectXPos(player.lane);
    player.pos[0] += player.moving * PLAYER_SPEED * dt;

    if (player.moving === 1) {
        if (player.pos[0] > moveTo) {
            player.pos[0] = moveTo;
            player.moving = 0;
        }
    }

    if (player.moving === -1) {
        if (player.pos[0] < moveTo) {
            player.pos[0] = moveTo;
            player.moving = 0;
        }
    }
}

function updateEntities(dt) {
    getPlayerSprite().update(dt);

    let minY = 0;
    for (let i = 0; i < terrain.length; i++) {
        terrain[i].pos[1] += ENEMY_SPEED * dt * speedModifier * 3;

        if (terrain[i].pos[1] < minY) {
            minY = terrain[i].pos[1];
        }

        if (terrain[i].pos[1] >= canvas.height) {
            terrain.splice(i, 1);
            i--;
        }
    }

    if (minY >= 0) {
        generateNewTerrainLine(-TERRAIN_LINE_HEIGHT * SIZE_MULTIPLICATOR);
    }

    for (let i = 0; i < enemies.length; i++) {
        enemies[i].pos[1] += enemyDelta(enemies[i], dt);

        if (enemies[i].pos[1] >= canvas.height) {
            enemies.splice(i, 1);
            i--;
        }
    }

    movePlayer(dt);
}

function enemyDelta(enemy, dt) {
    let modif = 1;
    if (enemy.obstacle) {
        modif = 3;
    }

    return ENEMY_SPEED * dt * speedModifier * modif;
}

function enemyDeltaConstantTime(enemy) {
    let modif = 1;
    if (enemy.obstacle) {
        modif = 3;
    }

    return ENEMY_SPEED * modif;
}

function checkCollisions() {
    if (playerLives === 0) {
        return;
    }

    for (let i = 0; i < enemies.length; i++) {
        let enemy = enemies[i];
        if (checkCollision(player.pos[0], player.pos[1],
                player.pos[0] + getPlayerSprite().width,
                player.pos[1] + getPlayerSprite().height,
                enemy.pos[0], enemy.pos[1],
                enemy.pos[0] + enemy.sprite.width, enemy.pos[1] + enemy.sprite.height)) {
            enemies.splice(i, 1);
            i--;
            if (!player.immortal) {
                playerLives--;
                revive();
            }
        }
    }
}

function revive() {
    if (playerLives === 0) {
        return;
    }

    player.immortal = true;
    player.revived = true;
    speedModifier = Math.max(1, speedModifier / 3);

    setTimeout(function () {
        player.immortal = false;
        player.revived = false;
    }, 3000);
}

function checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    return w1 >= x2 && x1 < w2 && h1 >= y2 && y1 < h2;
}

function handleLifeBar() {
    lifeBar.render = 'bar_' + playerLives;
}

function redraw() {
    renderEntities(terrain);
    if (playerLives > 0 || !getPlayerSprite().done) {
        renderSprite(player.pos, getPlayerSprite());
    } else {
        document.getElementById('game-over').style.display = 'block';
        document.getElementById('game-over-overlay').style.display = 'block';
    }
    renderEntities(enemies);

    renderLifeBar();
    renderScore();
}

function getPlayerSprite() {
    if (playerLives === 0) {
        return player.sprite_exploding;
    }

    if (player.immortal) {
        if (playerLives === 1) {
            return player.sprite_immortal_damaged;
        }
        return player.sprite_immortal;
    }

    if (playerLives === 1) {
        return player.sprite_damaged;
    }
    return player.sprite_alive;
}

function renderEntities(list) {
    for (var i = 0; i < list.length; i++) {
        renderSprite(list[i].pos, list[i].sprite);
    }
}

function renderSprite(pos, sprite) {
    ctx.save();
    ctx.translate(pos[0], pos[1]);
    sprite.render(ctx);
    ctx.restore();
}

function renderScore() {
    var elem = document.getElementById("game-score");
    var fillWithTime = "&nbsp;&nbsp;" + Math.floor(gameTime * 100) / 100;
    elem.innerHTML = fillWithTime;
}

function renderLifeBar() {
    if (playerLives > 0) {
        renderSprite([canvas.width - 42 + canvas.width / 60,
                19 + canvas.width / 60 + 43 * SIZE_MULTIPLICATOR * (3 - playerLives)],
            lifeBar[lifeBar.render])
    }
    renderSprite([canvas.width - 40, 20], lifeBar.frame);
}

/**
 * There are only 3 discrete positions for X.
 * It's easier to maintain it in <0, 2> interval and calculate it here.
 */
function getObjectXPos(xPos) {
    let laneWidth = (roadRect.right - roadRect.left) / 3;
    let margin = 1.1;
    return roadRect.left + laneWidth * xPos * margin;
}
