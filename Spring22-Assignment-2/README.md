# Final Project: Big Box Push

### Getting Started:

> If you're using IDE, never mind these steps. IDE will help you with the local server and file content changing.

Open the demo exactly as you did in Assignment 1: Run a dummy web server, navigate to the URL `localhost:8000`, observe the initial animation we provide, open Chrome developer tools, and perform the steps to map your local file folder as a Chrome workspace. 

At that point you'll be safe to edit your files without your edits disappearing or changing the wrong files. Then, proceed as follows.

### Preliminary Steps - Using the Code Library

In order to use our library, `tiny-graphics.js`, you the programmer must provide additional code: Three custom JavaScript classes. Each of the three will be a subclass of a different base class from tiny-graphics.js: `Shape`, `Shader`, and `Scene`. A `Shape` defines a 3D shape to draw, a `Shader` defines some code for coloring in triangles (perhaps as though they were illuminated by light sources), and a `Scene` class tells the 3D canvas and web page what you want to happen (usually, drawing a scene by placing shapes). The three subclasses must define certain methods correctly for the library to work, or nothing will get drawn.

### How to play the Game

Loading into the localhost site will bring you to the introductory interface. Controls for players and the game interface are listed in the bottom left under Big_Box_Push. Camera Controls are listed under Movement_Controls. To begin playing the game, press "t".  

The basis of the game is sumo wrestling, where your goal is to push the opponent out of the arena. This means that this is a two player game, and therefore are two sets of controls. Player 1 uses the awsd controls for movement with jump as "e" and boost as "f". Player 2 uses the ijkl controls with the "Enter" key as boost and the "Shift" key as jump. Movement is done so that each button is a direction, so pressing "d" or "l" will move your box to the right of the screen while pressing "w" or "i" will move the box away from the screen. To use the boost, you must first be moving in a direction, pressing the boost button by itself will do nothing. In addition, the boxes have a double jump, meaning that a box can jump twice, once to leave ground, and once while in air. 

Using the controls, Player 1(the yellow cube) must attempt to push Player 2(The Red Cube) of the platform and into the abyss below. The double jump and boost allow for evadeing or additional aggression to a players movement. With enough finesse, a player could recover if their box was pushed off but they had not double jumped or boosted yet. Boosts are also unlimited, but have a small delay before a boost can be done again.

The player that falls into the abyss first loses, announcing the winner of the match in a game over screen. To play again. press "Backspace", which will take you to the introductory interface. During the match, the user may choose to end the match prematurely by pressing "y" or to restart the game itself by pressing "Backspace" ending the game prematurely will not annouce a winner.