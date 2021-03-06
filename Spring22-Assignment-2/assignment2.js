import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

class Cube extends Shape {
    constructor() {
        super("position", "normal",);
        // Loop 3 times (for each axis), and inside loop twice (for opposing cube sides):
        this.arrays.position = Vector3.cast(
            [-1, -1, -1], [1, -1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, -1], [-1, 1, -1], [1, 1, 1], [-1, 1, 1],
            [-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1], [1, -1, 1], [1, -1, -1], [1, 1, 1], [1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1], [1, -1, -1], [-1, -1, -1], [1, 1, -1], [-1, 1, -1]);
        this.arrays.normal = Vector3.cast(
            [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0],
            [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0],
            [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]);
        // Arrange the vertices into a square shape in texture space too:
        this.indices.push(0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 8, 9, 10, 9, 11, 10, 12, 13,
            14, 13, 15, 14, 16, 17, 18, 17, 19, 18, 20, 21, 22, 21, 23, 22);
    }
}

class Cube_Outline extends Shape {
    constructor() {
        super("position", "color");
        //  TODO (Requirement 5).
        // When a set of lines is used in graphics, you should think of the list entries as
        // broken down into pairs; each pair of vertices will be drawn as a line segment.
        // Note: since the outline is rendered with Basic_shader, you need to redefine the position and color of each vertex
    }
}

class Cube_Single_Strip extends Shape {
    constructor() {
        super("position", "normal");
        // TODO (Requirement 6)
    }
}


class Base_Scene extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        this.hover = this.swarm = false;
        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            'cube': new Cube(),
            'outline': new Cube_Outline(),
        };

        // *** Materials
        this.materials = {
            plastic: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
        };
        // The white material and basic shader are used for drawing the outline.
        this.white = new Material(new defs.Basic_Shader());

        //array for colors for boxes and fill in colors for the first time
        this.colors = new Array(8);
        this.set_colors();

        // counters to check how many times we have clicked them
        this.b1_counter = 0;
        this.b2_counter = 0;
        //Position Matrices to move boxes
    }

    display(context, program_state) {
        // display():  Called once per frame of animation. Here, the base class's display only does
        // some initial setup.

        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.translation(5, -10, -30));
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        // *** Lights: *** Values of vector or point lights.
        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
    }
}

export class Assignment2 extends Base_Scene {
    /**
     * This Scene object can be added to any display canvas.
     * We isolate that code so it can be experimented with on its own.
     * This gives you a very small code sandbox for editing a simple scene, and for
     * experimenting with matrix transformations.
     */
    constructor()
    {
        super();
        const data_members = {
                roll: 0, did_b1_move: false, b1_move: 0,
                did_b1_move2: false, b1_move2: 0,
                did_b2_move: false, b2_move: 0,
                did_b2_move2: false, b2_move2: 0,
                b1: Mat4.identity(), 
                b2: Mat4.identity().times(Mat4.translation(-20,0,0)), 
                platform: Mat4.identity().times(Mat4.translation(-10,-2,0)).times(Mat4.scale(20, 1, 20)),
               // radians_per_frame: 1 / 200, meters_per_frame: 20, speed_multiplier: 1
            };
        Object.assign(this, data_members);
    }



    
    set_colors() {
        // TODO:  Create a class member variable to store your cube's colors.
        // Hint:  You might need to create a member variable at somewhere to store the colors, using `this`.
        // Hint2: You can consider add a constructor for class Assignment2, or add member variables in Base_Scene's constructor.
        for(let i = 0; i < 8; i++){
            this.colors[i] = color(Math.random(), Math.random(), Math.random(), 1);
        }

    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Change Colors", ["c"], this.set_colors);
        // Add a button for controlling the scene.
        this.key_triggered_button("Outline", ["o"], () => {
            // TODO:  Requirement 5b:  Set a flag here that will toggle your outline on and off
        });
        this.key_triggered_button("Sit still", ["m"], () => {
            // TODO:  Requirement 3d:  Set a flag here that will toggle your swaying motion on and off.
        });

        
        this.key_triggered_button("Box 1", ["x"], () => {
            // TODO:  Requirement 3d:  Set a flag here that will toggle your swaying motion on and off.
            this.colors[1] = color(Math.random(), Math.random(), Math.random(), 1);
            this.b1_counter++;
        });
        //Moving Box 1
        this.key_triggered_button("Box 1, Move Forward", ["u"], () => {this.b1_move = -1; this.did_b1_move = true;});
        this.key_triggered_button("Box 1, Move Backward", ["j"], () => {this.b1_move = 1; this.did_b1_move = true;});
        this.key_triggered_button("Box 1, Move Left", ["l"], () => {this.b1_move2 = -1; this.did_b1_move2 = true;});
        this.key_triggered_button("Box 1, Move Right", [";"], () => {this.b1_move2 = 1; this.did_b1_move2 = true;});

        this.key_triggered_button("Box 2, Move Forward", ["5"], () => {this.b2_move = -1; this.did_b2_move = true;});
        this.key_triggered_button("Box 2, Move Backward", ["6"], () => {this.b2_move = 1; this.did_b2_move = true;});
        this.key_triggered_button("Box 2, Move Left", ['7'], () => {this.b2_move2 = -1; this.did_b2_move2 = true;});
        this.key_triggered_button("Box 2, Move Right", ["8"], () => {this.b2_move2 = 1; this.did_b2_move2 = true;});

        

        this.key_triggered_button("Box 2", ["k"], () => {
            // TODO:  Requirement 3d:  Set a flag here that will toggle your swaying motion on and off.
            this.colors[0] = color(Math.random(), Math.random(), Math.random(), 1);
            this.b2_counter++;

        });
    }

    draw_box(context, program_state, model_transform, box_color) {
        // TODO:  Helper function for requirement 3 (see hint).
        //        This should make changes to the model_transform matrix, draw the next box, and return the newest model_transform.
        // Hint:  You can add more parameters for this function, like the desired color, index of the box, etc.

        /*
        const blue = hex_color("#1a9ffa");
        model_transform = model_transform.times(Mat4.translation(0,0,0);
        this.shapes.cube.draw(context, program_state, model_transform, this.materials.plastic.override({color:blue}));
         */
        /*
        //first box
        if (box_index == 0){
            const blue = hex_color("#1a9ffa");
            this.shapes.cube.draw(context, program_state, model_transform, this.materials.plastic.override({color:blue}));
        }


        //second box
        if(box_index == 1){
            const red = hex_color("#FF0000");
            model_transform = model_transform.times(Mat4.translation(-20,0 ,0 ));
            this.shapes.cube.draw(context, program_state, model_transform, this.materials.plastic.override({color:red}));
        }

        //stage
        if(box_index == 2){
            const brown = hex_color("#D2B48C");
            model_transform = model_transform.times(Mat4.translation(10,-2 ,0 ))
                .times(Mat4.scale(20, 1, 20));
            this.shapes.cube.draw(context, program_state, model_transform, this.materials.plastic.override({color:brown}));
        }

        */

       // const box_color = this.colors[box_index];
        //model_transform = model_transform.times(Mat4.translation(this.I_move));
        this.shapes.cube.draw(context, program_state, model_transform, this.materials.plastic.override({color:box_color}));

        /*
        //first box
        if (box_index == 0){
            const blue = hex_color("#1a9ffa");
            this.shapes.cube.draw(context, program_state, model_transform, this.materials.plastic.override({color:box_color}));
        }


        //second box
        if(box_index == 1){
            const red = hex_color("#FF0000");
            this.shapes.cube.draw(context, program_state, model_transform, this.materials.plastic.override({color:box_color}));
        }

        //stage
        if(box_index == 2){
            const brown = hex_color("#D2B48C");
            this.shapes.cube.draw(context, program_state, model_transform, this.materials.plastic.override({color:brown}));
        }

        */

        return model_transform;
    }

    display(context, program_state) {
        super.display(context, program_state);
        const blue = hex_color("#1a9ffa");
        let model_transform = Mat4.identity();
        let box1_transform = this.b1;
        let box2_transform = this.b2;
        let stage_transform = this.platform;


        // Example for drawing a cube, you can remove this line if needed
        // this.shapes.cube.draw(context, program_state, model_transform, this.materials.plastic.override({color:blue}));

        //model_transform = this.draw_box(context, program_state, model_transform, 1);


        /*
        model_transform = this.draw_box(context, program_state, model_transform, 0);
        model_transform = this.draw_box(context, program_state, model_transform, 1);
        model_transform = this.draw_box(context, program_state, model_transform, 2);
        */
            const brown = hex_color("#D2B48C");

        //Box 1 Move
        if(this.did_b1_move)
        {
            box1_transform = box1_transform.times(Mat4.translation(0,0, this.b1_move));
            this.did_b1_move = false;
            this.b1_move = 0;
        }

        if(this.did_b1_move2)
        {
            box1_transform = box1_transform.times(Mat4.translation(this.b1_move2,0, 0));
            this.did_b1_move2 = false;
            this.b1_move2 = 0;
        }

        if(this.did_b2_move)
        {
            box2_transform = box2_transform.times(Mat4.translation(0,0, this.b2_move));
            this.did_b2_move = false;
            this.b2_move = 0;
        }

        if(this.did_b2_move2)
        {
            box2_transform = box2_transform.times(Mat4.translation(this.b2_move2,0, 0));
            this.did_b2_move2 = false;
            this.b2_move2 = 0;
        }
        
        

        box1_transform = this.draw_box(context, program_state, box1_transform, this.colors[0]);
        box2_transform = this.draw_box(context, program_state, box2_transform, this.colors[1]);
        stage_transform = this.draw_box(context, program_state, stage_transform, brown);

        this.b1 = box1_transform;
        this.b2 = box2_transform;

        console.log("box 1 counter: ", this.b1_counter);
        console.log("box 2 counter: ", this.b2_counter);

        


        // TODO:  Draw your entire scene here.  Use this.draw_box( graphics_state, model_transform ) to call your helper.
    }
}
