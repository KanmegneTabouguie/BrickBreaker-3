const canvas = document.getElementById('break');
const ctx = canvas.getContext('2d'); //la méthode renvoie un contexte de dessin
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);
document.addEventListener("mousemove", mouseMoveHandler);



//this variable is for the game state
let game = {    
    requestId: null,
    timeoutId: null,
    leftKey: false,
    rightKey: false,
    on: false,
    music: true,
    sfx: true
}

//paddle declaration with height and width in the canvas
let paddle = {
    height: 20,
    width: 100,
    get y() { return canvas.height - this.height; }
}

//lives declaration with with height and width in the canvas
let lives = {
    height: 20,
    width: 60,
    get y() { return canvas.height - this.height; }
}

//ball declaration 
let ball = {
    radius: 10  //nous devons garder une trace de la position de la ball
}

//brick declaration  with rows and bricks  and  size of the brick 
let brick = {
    rows: 5,
    cols: 10,
    get width() { return canvas.width / this.cols; },
    height: 30
}

//declration des images
let images = {
    background: new Image(),
    ball: new Image(),
    paddle: new Image(),
    lives: new Image()
}

//load the image when the game start
function onImageLoad(e) {
    resetGame();
    initBricks();
    resetPaddle();
    paint();
    ctx.font = '50px ArcadeClassic';
    ctx.fillStyle = 'lime'; //store a colr that will be use by the fill methode
    ctx.fillText('BEGIN', canvas.width / 2 - 120, canvas.height / 2);
};
images.background.addEventListener('load', onImageLoad); //loads the image
images.background.src = 'images/background.jpeg';//src set the function to manage the loading of these images
images.ball.src = 'images/ball.webp';
images.paddle.src = 'images/paddle.webp';
images.lives.src = 'images/lives.png';

const sounds = {
  ballLost: new Audio('Musique/sounds_ball-lost.mp3'), //audio() constructor creates and returns a new audio element to play audio
   breakout: new Audio('Musique/sounds_breakout.mp3'),
   brick: new Audio('Musique/sounds_brick.mp3'),
   gameOver: new Audio('Musique/KO-C - Deux Œufs Spaghetti [Official Video].mp3'),
   levelCompleted: new Audio('Musique/SadAs DTD-On applaudit (Lyrique Vidéo).mp3'),
   music: new Audio('Musique/sounds_music.mp3'),
   paddle: new Audio('Musique/sounds_paddle.mp3')
}



let brickField = [];


//pour lancer le jeu ,lancer les animation et le reset le jeu aussi
function play() {  
    
        cancelAnimationFrame(game.requestId); //méthode pour annuler des requêtes précédemment planifiées ett le requestid verifie la value avant de lancer l'animation
        clearTimeout(game.timeoutId);
        game.on = true;
        decreaseTimer()
        resetGame();
        resetBall();
        resetPaddle();
        initBricks();
    
        game.sfx.play && sounds.breakout.play();
        // Start music after starting sound ends.
        setTimeout(() => game.music && sounds.music.play(), 2000);
    
        animate();
    
    
}

// pour mettre le jeu en  pause
function pause() {  
    
    cancelAnimationFrame(game.requestId); //méthode pour annuler des requêtes précédemment planifiées ett le requestid verifie la value avant de lancer l'animation
    clearTimeout(game.timeoutId.pause());
    game.on = false;
    decreaseTimer().pause();
    
    game.sfx.play && sounds.breakout.pause();
    // Start music after starting sound ends.
    setTimeout(() => game.music && sounds.music.pause(), 2000);

    animate();


}

//pour relancer le jeu
function resume(){
    game.sfx.play && sounds.breakout.play();
    // Start music after starting sound ends.
    setTimeout(() => game.music && sounds.music.play(), 2000);

    animate();
}

//animate function run in a continue mode and update the game state
function animate(now = 0) { 
    game.time.elapsed = now - game.time.start; //wasted time calculated by substracting current time from game.time.start value.
    //check if the 60fps have passed to see if we can paint another frame or animation
    if (game.time.elapsed > game.time.refreshRate) {
        game.time.start = now; 

        paint();
        update();
        detectCollision();
        detectBrickCollision();
    
        if (isLevelCompleted() || isGameOver()) return;
    }    

    game.requestId = requestAnimationFrame(animate); //start animation or sustain
}

//function enable to draw  graphic
function paint() {
//drawing code
    ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);// dessin BG
    ctx.drawImage(images.ball, ball.x, ball.y, 2 * ball.radius, 2 * ball.radius);// dessin ball et specify la location tde la ball
    ctx.drawImage(images.paddle, paddle.x, paddle.y, paddle.width, paddle.height);// dessin paddle et specify la location de la paddle et taille
    drawBricks();
    drawScore();
    drawLives();
}

//function to draw brick
function drawBricks() {
    brickField.forEach((brick) => {
      if (brick.hitsLeft) {
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
      }
    });
  }

  //function to draw score
function drawScore() {
    ctx.font = '24px ArcadeClassic';
    ctx. fillStyle = 'white';
    const { level, score } = game;
    ctx.fillText(`Level: ${level}`, 5, 23);
    ctx.fillText(`Score: ${score}`, canvas.width / 2 - 50, 23);
    
}

//function to draw lives

function drawLives() {
    if (game.lives > 2) { ctx.drawImage(images.lives, canvas.width - 150, 9, 40, 13); }
    if (game.lives > 1) { ctx.drawImage(images.lives, canvas.width - 100, 9, 40, 13); }
    if (game.lives > 0) { ctx.drawImage(images.lives, canvas.width - 50, 9, 40, 13); }
}


//detect collision on the wall and set how the ball move after the collision 

function detectCollision() {
    const hitTop = () => ball.y < 0;
    const hitLeftWall = () => ball.x < 0;
    const hitRightWall = () => ball.x + ball.radius * 2 > canvas.width;
    const hitPaddle = () => 
        ball.y + 2 * ball.radius > canvas.height - paddle.height &&
        ball.y + ball.radius < canvas.height && 
        ball.x + ball.radius > paddle.x &&
        ball.x + ball.radius < paddle.x + paddle.width;

    if (hitLeftWall()) {  //ball hit left side of the screen ,the ball move to the opposite direction
        ball.dx = -ball.dx;
        ball.x = 0;
    }        
    if (hitRightWall()) {
        ball.dx = -ball.dx;
        ball.x = canvas.width - 2 * ball.radius;
    }
    if (hitTop()) {  //bounce down
        ball.dy = -ball.dy;
        ball.y = 0;
    }
    if (hitPaddle()) {  //bounce up 
        ball.dy = -ball.dy;
        ball.y = canvas.height - paddle.height - 2 * ball.radius;
        game.sfx && sounds.paddle.play();
      
        // Bouncing ball more on one side 
        const drawingConst = 5
        const paddleMiddle = 2;
        const algo = (((ball.x - paddle.x) / paddle.width) * drawingConst);
        ball.dx = ball.dx + algo - paddleMiddle;
    }
}


//detect the collision between  the brick and  and the ball
function detectBrickCollision() {
    let directionChanged = false;
    const isBallInsideBrick = (brick) => 
        ball.x + 2 * ball.radius > brick.x &&
        ball.x < brick.x + brick.width && 
        ball.y + 2 * ball.radius > brick.y && 
        ball.y < brick.y + brick.height;
  
    brickField.forEach((brick) => {
        if (brick.hitsLeft && isBallInsideBrick(brick)) {
            sounds.brick.currentTime = 0;
            game.sfx && sounds.brick.play();
            brick.hitsLeft--;
            if (brick.hitsLeft === 1) {
                brick.color = 'darkgray';
            }
            game.score += brick.points;
    
            if (!directionChanged) {
                directionChanged = true;
                detectCollisionDirection(brick);
            }
        }
    });
}

//moving direction of the ball after collision with the brick 
function detectCollisionDirection(brick) {
    const hitFromLeft = () => ball.x + 2 * ball.radius - ball.dx <= brick.x;//the ball was to the left of the brick  and now collid with the left side 
    const hitFromRight = () => ball.x - ball.dx >= brick.x + brick.width;//the ball was to the right of the brick and now collid with the right side 

    if (hitFromLeft() || hitFromRight()) {
      ball.dx = -ball.dx;
    } else { // Hit from above or below
      ball.dy = -ball.dy;
    }
}


//this function enable the reset of the game and set all the value of the game to original 
function resetGame() {
    game.speed = 15; //control the speed at which the ball move across the screen
    game.score = 0;
    game.level = 1;
    game.lives = 3;
    game.time = { start: performance.now(), elapsed: 0, refreshRate: 60 };//refreshrate number of time per second that the game loop should run 
    timer = 1000;
}

//this function enable the reset of the ball and set all the value of the ball to original 
function resetBall() {
    ball.x = canvas.width / 2;  //set x coordinate to the center
    ball.y = canvas.height - paddle.height - 2 * ball.radius; //set y cordinate to the top of the paddle
    ball.dx = game.speed * (Math.random() * 2 - 1);  // Random direction movement
    ball.dy = -game.speed; // Up movement
}

//this function enable the reset of the paddle and set all the value of the paddle to original 
function resetPaddle() {
    paddle.x = (canvas.width - paddle.width) / 2;
    paddle.dx = game.speed + 7; //paddle move faster than the ball and easy to catch the ball when fall down
}

//function enable to identify how the brick will be display on the canvas  and initiating some value for the brick 

function initBricks() {
    brickField = []; //empty array to hold the brick objects
    const topMargin = 30;
    const colors = ['green', 'red', 'yellow'];

    for(let row = 0; row < brick.rows; row++) {
        for(let col = 0; col < brick.cols; col++) {
            brickField.push({   //add a new brick object to the brickfield array
                x: col * brick.width,
                y: row * brick.height + topMargin,
                height: brick.height, 
                width: brick.width,
                color: colors[row],
                points: (5 - row) * 2,
                hitsLeft: row === 0 ? 2 : 1  //if the row is the first row, the brick will have two hits left
            });
        }
    }
}

//function to verify if the condition to move the next level is complete if completed move to next level if level is not complete the function returns false
function isLevelCompleted() {
    const levelComplete = brickField.every((b) => b.hitsLeft === 0);

    if (levelComplete) {
        initNextLevel();
        resetBall();
        resetPaddle();
        initBricks();
        game.timeoutId = setTimeout(() => {
            animate();
            sounds.music.play();
        }, 3000);

        return true;
    }
    return false;
}

//function to initialize the next level of the game after the previous has being completed

function initNextLevel() {
    game.level++;//increment the game level
    game.speed++; //increase game speed
    sounds.music.pause();
    game.sfx && sounds.levelCompleted.play();
    ctx.font = '50px ArcadeClassic';
    ctx.fillStyle = 'yellow';
    ctx.fillText(`Perfect Next LEVEL ${game.level}!`, canvas.width / 2 - 80, canvas.height / 2);
}



//function to check if the game canbe set the over 
function isGameOver() {
    const isBallLost = () => ball.y - ball.radius > canvas.height;

    if (isBallLost()) {
        game.lives -= 1;
        game.sfx && sounds.ballLost.play();
        if (game.lives === 0) {
            gameOver();
            return true;  //return true if gameover and donot request the next animation
        }
        resetBall();
        resetPaddle();
    }
    return false;
}

//function to stop the game and display message for game over

function gameOver() {
    game.on = false;
    sounds.music.pause();
    sounds.currentTime = 0;  
    game.sfx && sounds.gameOver.play();
    ctx.font = '50px ArcadeClassic';
    ctx.fillStyle = 'red';
    ctx.fillText('GAME OVER ', canvas.width / 2 - 100, canvas.height / 2);
    timer = 1000;
    
// Get the user's name using a prompt
let name = prompt('Enter your name');

    let newScore = {
        name: name,
       score: game.score,
       date: new Date().toISOString()
       
}
// Retrieve the existing list of scores from local storage
let scores = JSON.parse(localStorage.getItem('scores')) || [];

// Add the new score object to the list of scores
scores.push(newScore);

// Sort the scores by highest to lowest
scores.sort(function(a, b) {
    return b.score - a.score;
  });

// Store the updated list of scores in local storage
localStorage.setItem('scores', JSON.stringify(scores));

// Get a reference to the HTML element where the scores will be displayed
let scoresList = document.getElementById('scores-list');

// Clear any existing scores from the scores list
scoresList.innerHTML = '';

// Retrieve the list of scores from local storage
scores = JSON.parse(localStorage.getItem('scores')) || [];

// Iterate over the list of scores and create HTML elements to display them
scores.forEach(function(score) {
  // Create a new list item element
  let listItem = document.createElement('li');

  // Set the text content of the list item to the score information
  listItem.textContent = `Score: ${score.score}, Date: ${score.date} ,name: ${score.name}`;

  // Append the list item to the scores list element
  scoresList.appendChild(listItem);
});
  }




//function for update through out the running of the game for the position of the ball and paddle based on user input

function update() {
    ball.x += ball.dx; //increase position of the ball
    ball.y += ball.dy;

    if (game.rightKey) {
        paddle.x += paddle.dx;
        if (paddle.x + paddle.width > canvas.width){
            paddle.x = canvas.width - paddle.width;
        }
    }
    if (game.leftKey) {
        paddle.x -= paddle.dx;
        if (paddle.x < 0){
            paddle.x = 0;
        }
    }

    
}


function initSounds() {
    sounds.music.loop = true; //bg musique loop continuously whilw the game is running
    for (const [key] of Object.entries(sounds)) {
        sounds[key].volume = 0.5;
    }
}



let timer = 1000

function decreaseTimer(){
    setTimeout(decreaseTimer , 1000)//
    if (timer > 0) { //check if timer greater than 0 and decrement 
        timer--
        document.querySelector('#timer').innerHTML = timer
    }   
}



function keyDownHandler(e) {
    //if the game not running spacebar is press to play
    if (!game.on && e.key === ' ') {
        play();
    }
    //change the state of music to on or off depending on their state
    if (game.on && (e.key === 'm' || e.key === 'M')) {
        game.music = !game.music;
        game.music ? sounds.music.play() : sounds.music.pause();
    }
    if (game.on && (e.key === 's' || e.key === 'S')) {
        game.sfx = !game.sfx;
    }
    if (e.key === 'ArrowUp') {
        volumeUp();
    }
    if (e.key === 'ArrowDown') {
        volumeDown();
    }
    if (e.key === 'ArrowRight') {
        game.rightKey = true;
    } else if (e.key === 'ArrowLeft') {
        game.leftKey = true;
    }
}

//if arrow left or right is release,the state of game key properties to false

function keyUpHandler(e) {
    if (e.key === 'ArrowRight') {
        game.rightKey = false;
    } else if (e.key === 'ArrowLeft') {
        game.leftKey = false;
    }
}

function mouseMoveHandler(e) {
    const mouseX = e.clientX - canvas.offsetLeft;    
    const isInsideCourt = () => mouseX > 0 && mouseX < canvas.width;

    if(isInsideCourt()) {
        paddle.x = mouseX - paddle.width / 2;
    }
}




//function volume decrease
function volumeDown() {
    if (sounds.music.volume >= 0.1) {
        for (const [key] of Object.entries(sounds)) {
            sounds[key].volume -= 0.1;
        }
    }
}

//function volume increase 
function volumeUp() {
    if (sounds.music.volume <= 0.9) {
        for (const [key] of Object.entries(sounds)) {
            sounds[key].volume += 0.1;
        }
    }
}

initSounds();



