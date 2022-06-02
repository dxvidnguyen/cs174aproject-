import {defs, tiny} from './examples/common.js';

// Pull these names into this module's scope for convenience:
const {vec3, unsafe3, vec4, color, Mat4, Light, Shape, Material, Shader, Texture, Scene, hex_color} = tiny;

const {Cube, Axis_Arrows, Textured_Phong} = defs

export class Body {
    // **Body** can store and update the properties of a 3D body that incrementally
    // moves from its previous place due to velocities.  It conforms to the
    // approach outlined in the "Fix Your Timestep!" blog post by Glenn Fiedler.
    constructor(shape, material, size) {
        Object.assign(this,
            {shape, material, size})
    }
    
    // (within some margin of distance).
    static intersect_cube(p, margin = 0) {
        return p.every(value => value >= -1 - margin && value <= 1 + margin)
    }

    static intersect_sphere(p, margin = 0) {
        return p.dot(p) < 1 + margin;
    }

    emplace(location_matrix, linear_velocity, angular_velocity, spin_axis = vec3(0, 0, 0).randomized(1).normalized()) {                               // emplace(): assign the body's initial values, or overwrite them.
        this.center = location_matrix.times(vec4(0, 0, 0, 1)).to3();
        this.rotation = Mat4.translation(...this.center.times(-1)).times(location_matrix);
        this.previous = {center: this.center.copy(), rotation: this.rotation.copy()};
        // drawn_location gets replaced with an interpolated quantity:
        this.drawn_location = location_matrix;
        this.temp_matrix = Mat4.identity();
        return Object.assign(this, {linear_velocity, angular_velocity, spin_axis})
    }

    advance(time_amount) {
        // advance(): Perform an integration (the simplistic Forward Euler method) to
        // advance all the linear and angular velocities one time-step forward.
        this.previous = {center: this.center.copy(), rotation: this.rotation.copy()};
        // Apply the velocities scaled proportionally to real time (time_amount):
        // Linear velocity first, then angular:
        this.center = this.center.plus(this.linear_velocity.times(time_amount));
        this.rotation.pre_multiply(Mat4.rotation(time_amount * this.angular_velocity, ...this.spin_axis));
    }

    // The following are our various functions for testing a single point,
    // p, against some analytically-known geometric volume formula

    blend_rotation(alpha) {
        // blend_rotation(): Just naively do a linear blend of the rotations, which looks
        // ok sometimes but otherwise produces shear matrices, a wrong result.

        // TODO:  Replace this function with proper quaternion blending, and perhaps
        // store this.rotation in quaternion form instead for compactness.
        return this.rotation.map((x, i) => vec4(...this.previous.rotation[i]).mix(x, alpha));
    }

    blend_state(alpha) {
        // blend_state(): Compute the final matrix we'll draw using the previous two physical
        // locations the object occupied.  We'll interpolate between these two states as
        // described at the end of the "Fix Your Timestep!" blog post.
        this.drawn_location = Mat4.translation(...this.previous.center.mix(this.center, alpha))
            .times(this.blend_rotation(alpha))
            .times(Mat4.scale(...this.size));
    }

    check_if_colliding(b, collider) {
        // check_if_colliding(): Collision detection function.
        // DISCLAIMER:  The collision method shown below is not used by anyone; it's just very quick
        // to code.  Making every collision body an ellipsoid is kind of a hack, and looping
        // through a list of discrete sphere points to see if the ellipsoids intersect is *really* a
        // hack (there are perfectly good analytic expressions that can test if two ellipsoids
        // intersect without discretizing them into points).
        if (this == b)
            return false;
        // Nothing collides with itself.
        // Convert sphere b to the frame where a is a unit sphere:
        const T = this.inverse.times(b.drawn_location, this.temp_matrix);

        const {intersect_test, points, leeway} = collider;
        // For each vertex in that b, shift to the coordinate frame of
        // a_inv*b.  Check if in that coordinate frame it penetrates
        // the unit sphere at the origin.  Leave some leeway.
        return points.arrays.position.some(p =>
            intersect_test(T.times(p.to4(1)).to3(), leeway));
    }
}

export class Simulation extends Scene {
    // **Simulation** manages the stepping of simulation time.  Subclass it when making
    // a Scene that is a physics demo.  This technique is careful to totally decouple
    // the simulation from the frame rate (see below).
    constructor() {
        super();
        Object.assign(this, {time_accumulator: 0, time_scale: 1, t: 0, dt: 1 / 20, bodies: [], steps_taken: 0});
    }

    simulate(frame_time) {
        // simulate(): Carefully advance time according to Glenn Fiedler's
        // "Fix Your Timestep" blog post.
        // This line gives ourselves a way to trick the simulator into thinking
        // that the display framerate is running fast or slow:
        frame_time = this.time_scale * frame_time;

        // Avoid the spiral of death; limit the amount of time we will spend
        // computing during this timestep if display lags:
        this.time_accumulator += Math.min(frame_time, 0.1);
        // Repeatedly step the simulation until we're caught up with this frame:
        while (Math.abs(this.time_accumulator) >= this.dt) {
            // Single step of the simulation for all bodies:
            this.update_state(this.dt);
            for (let b of this.bodies)
                b.advance(this.dt);
            // Following the advice of the article, de-couple
            // our simulation time from our frame rate:
            this.t += Math.sign(frame_time) * this.dt;
            this.time_accumulator -= Math.sign(frame_time) * this.dt;
            this.steps_taken++;
        }
        // Store an interpolation factor for how close our frame fell in between
        // the two latest simulation time steps, so we can correctly blend the
        // two latest states and display the result.
        let alpha = this.time_accumulator / this.dt;
        for (let b of this.bodies) b.blend_state(alpha);
    }

    display(context, program_state) {
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
        // display(): advance the time and state of our whole simulation.
        if (program_state.animate)
            this.simulate(program_state.animation_delta_time);
        // Draw each shape at its current location:
        for (let b of this.bodies)
            b.shape.draw(context, program_state, b.drawn_location, b.material);
    }

    update_state(dt)      // update_state(): Your subclass of Simulation has to override this abstract function.
    {
        throw "Override this"
    }
}

export class Big_Box_Push extends Simulation {
    constructor() {
        super();
        this.shapes = {cube:new defs.Cube()};
        const shader = new defs.Fake_Bump_Map(1);
        this.material = new Material(shader, {
            color:  hex_color("#83a832"),
            ambient: .4
        })

        this.scene_material = new Material(shader, {
            color: hex_color("#ffffff"),
            ambient: .4
        }
            
        )



        this.start_scene = {
            start: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1,
                texture: new Texture("assets/start.jpg", "NEAREST")
            }),
            end_of_game: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1,
                texture: new Texture("assets/gameover.jpg", "NEAREST")
            }),
        }






        this.collider = {intersect_test: Body.intersect_cube, points: new defs.Cube(), leeway: .01}
        // test material
        // this.intersect_material = this.material.override({color: color(0.1, 0.1, 0.1, 1)})
        
        // player input directions -1 to 1 on every axis
        this.directions = [vec3(0,0,0), vec3(0,0,0)];
        
        // player boost values
        this.boost = [1, 1];
        
        // player accelerations
        this.accs = [vec3(0, 0, 0), vec3(0, 0, 0)];

        // player spawns

        this.spawn_points= [vec3(-9, -7.5, 0), vec3(9, -7.5, 0)];

        // jump mechanics
        this.flying = [false, false];
        this.double_jumped = [false, false];
        // friction
        this.friction_coefficient = 0.9;
        // movement speed
        this.speed = 2.25;

        //initial setup
        this.set_camera = false;
        this.added_bodies = false;

        //colors for boxes
        this.box_colors = new Array(2);
        this.box_colors[0] = "#FFFF00";
        this.box_colors[1] = "#FF0000";


        //flags for start and end game
        this.playgame = false;
        this.before_game = true;
        this.brandnew = true;
        this.not_started = true;
        this.end_game = false;


    }
    make_control_panel(){
        super.make_control_panel();

        //start and end game
        this.live_string(box => {
            box.textContent = "Start / End Game";
        });
        this.new_line();
        this.key_triggered_button("Start Game", ["t"], () => {this.playgame = true});
        this.key_triggered_button("End Game", ["y"], () => {this.end_game = true});

        this.new_line();



        // p1 controls
        this.live_string(box => {
            box.textContent = "P1 Controls";
        });
        this.new_line();
        this.key_triggered_button("P1 Left", ["a"], () => {if(this.directions[0][0] == 0)
                                                              this.directions[0][0] = -1;
                                                          else if(this.directions[0][0] == 1)
                                                              this.directions[0][0] = 0;}
                                  ,undefined, () => {this.directions[0][0] = 0;});
        this.key_triggered_button("P1 Right", ["d"], () => {if(this.directions[0][0] == 0)
                                                                this.directions[0][0] = 1;
                                                          else if(this.directions[0][0] == -1)
                                                              this.directions[0][0] = 0;}
                                  ,undefined, () => {this.directions[0][0] = 0;});
        this.key_triggered_button("P1 Forward", ["w"], () => {if(this.directions[0][2] == 0)
                                                                this.directions[0][2] = -1;
                                                          else if(this.directions[0][2] == 1)
                                                              this.directions[0][2] = 0;}
                                  ,undefined, () => {this.directions[0][2] = 0;});
        this.key_triggered_button("P1 Backward", ["s"], () => {if(this.directions[0][2] == 0)
                                                            this.directions[0][2] = 1;
                                                          else if(this.directions[0][2] == -1)
                                                              this.directions[0][2] = 0;}
                                  ,undefined, () => {this.directions[0][2] = 0;});
        this.key_triggered_button("P1 Jump", ["Control"], () => {if(this.directions[0][1] == 0 && !this.double_jumped[0])
                                                            this.directions[0][1] = 1;
                                                              }
                                  ,undefined, () => {this.directions[0][1] = 0;});
        this.key_triggered_button("P1 Boost", ["f"], () => {if(this.boost[0] <= 1)
                                                                this.boost[0] = 5});
        this.new_line();
        //p2 controls
        this.live_string(box => {
            box.textContent = "P2 Controls";
        });
        this.new_line();
        this.key_triggered_button("P2 Left", ["j"], () => {if(this.directions[1][0] == 0)
                                                              this.directions[1][0] = -1;
                                                          else if(this.directions[1][0] == 1)
                                                              this.directions[1][0] = 0;}
                                  ,undefined, () => {this.directions[1][0] = 0;});
        this.key_triggered_button("P2 Right", ["l"], () => {if(this.directions[1][0] == 0)
                                                                this.directions[1][0] = 1;
                                                          else if(this.directions[1][0] == -1)
                                                              this.directions[1][0] = 0;}
                                  ,undefined, () => {this.directions[1][0] = 0;});
        this.key_triggered_button("P2 Forward", ["i"], () => {if(this.directions[1][2] == 0)
                                                                this.directions[1][2] = -1;
                                                          else if(this.directions[1][2] == 1)
                                                              this.directions[1][2] = 0;}
                                  ,undefined, () => {this.directions[1][2] = 0;});
        this.key_triggered_button("P2 Backward", ["k"], () => {if(this.directions[1][2] == 0)
                                                            this.directions[1][2] = 1;
                                                          else if(this.directions[1][2] == -1)
                                                              this.directions[1][2] = 0;}
                                  ,undefined, () => {this.directions[1][2] = 0;});


        this.key_triggered_button("P2 Boost", ["h"], () => {if(this.boost[1] <= 1)
                                                                this.boost[1] = 5});
        this.key_triggered_button("P2 Jump", ["Shift"], () => {if(this.directions[1][1] == 0 && !this.double_jumped[1])
                                                            this.directions[1][1] = 1;
                                                              }
                                  ,undefined, () => {this.directions[1][1] = 0;});
    }
    
    // limit x so that lx <= x <= ux
    limit(x, lx, ux)
    {
        if(x < lx)
            return lx;
        else if (x > ux)
            return ux;
        return x;
    }
    
    update_state(dt) {
        // update_state():  Override the base time-stepping code to say what this particular
        // scene should do to its bodies every frame -- including applying forces.
        
        // add initial bodies
        if(!this.added_bodies)
        {
            //Adding Platform body
            this.bodies.push(new Body(this.shapes.cube, this.scene_material, vec3(20, 2, 20))
                             .emplace(Mat4.translation(0, 0, 0), vec3(0, 0.1, 0).normalized().times(2), 0, vec3(0, 0, 1)));
            //Player bodies
            for (var i = 0; i < 2; i++){
                this.bodies.push(new Body(this.shapes.cube, this.material.override({color: hex_color(this.box_colors[i])}), vec3(2, 2, 2))
                    .emplace(Mat4.translation(-10 + 20* i, 0, 0), vec3(0, 0.1, 0).normalized().times(2), 0, vec3(0, 0, 1)));
            }

            this.added_bodies = true;
        }
        //use player input to move bodies
        for (var i = 0; i < 2; i++) {
            let b = this.bodies[i+1];
            // Gravity by magic number
            this.bodies[0].linear_velocity[1] = 0;
            this.bodies[0].center[1] = -12;
            this.accs[i][1] += dt * -2;
            // If about to fall through floor, move center to surface, set y-vel = 0
            //If the box moves out of bounds, return to center
            if (b.center[0] > 18 || b.center[0] < -18)
            {
                b.center = this.spawn_points[i];
                b.linear_velocity = vec3(0, -0.1, 0);
            }
            if (b.center[2] > 18 || b.center[2] < -18)
            {
                b.center = this.spawn_points[i];
                b.linear_velocity = vec3(0, -0.1, 0);
            }
            if (b.center[1] < -8 && b.linear_velocity[1] < 0)
            {
                b.linear_velocity[1] = 0;
                b.center[1] = -8;
                this.flying[i] = false;
                this.double_jumped[i] = false;
            }
            else if(b.center[1] > -8)
                this.flying[i] = true;
            // iterate through velocity direction
            for(var j = 0; j < 3; j++)
            {
                // move based on direction and boost
                var dv = this.directions[i][j] * this.boost[i];
                
                // option: movement based on force vs instant velocity
                // this.accs[i][j] += dv * dt;
                
                // set instant velocity to speed based on boost and direction
                if(j != 1 && dv != 0)
                    b.linear_velocity[j] = dv * this.speed;
                
                // friction
                if(j != 1 && b.center[1] <= -7)
                    this.accs[i][j] -= this.friction_coefficient * b.linear_velocity[j] * dt;

                // limit acceleration
                this.accs[i][j] = this.limit(this.accs[i][j], -5 * dt, 5 * dt);
                b.linear_velocity[j] += this.accs[i][j];

                //jump mechanics
                if(j == 1 && this.directions[i][j] == 1)
                {
                    if(this.flying[i])
                    {
                        this.double_jumped[i] = true;
                        b.linear_velocity[j] = 0;
                    }
                    b.linear_velocity[j] += 5;
                    this.directions[i][j] = 0;
                }
                // option: limit velocity
                // b.linear_velocity[j] = this.limit(b.linear_velocity[j], -5, 5);

                // set acc to 0
                this.accs[i][j] = 0;
            }
            // decrease boost
            if(this.boost[i] > 1)
                this.boost[i] -= 0.15;
            else if(this.boost[i] <= 1)
                this.boost[i] = 1;
            
            // for collision
            b.inverse = Mat4.inverse(b.drawn_location);
        }

        // one pass collision funtion
        let player_body_start = 1;
        let a = this.bodies[player_body_start];
        let b = this.bodies[player_body_start+1];
        if(a.check_if_colliding(b, this.collider))
        {
            // vec from b.center to a.center
            let dp = vec3(a.center[0] - b.center[0], a.center[1] - b.center[1], a.center[2] - b.center[2]);
            for(var k = 0; k < 3; k++)
            {
                //collision math
                let temp = a.linear_velocity.copy();
                a.linear_velocity[k] = b.linear_velocity[k];
                b.linear_velocity[k] = temp[k];

                // make vertical collisions more pronounced
                if(k == 1)
                    if((a.linear_velocity[k] > 0 || b.linear_velocity[k] > 0))
                       if(Math.abs(a.linear_velocity[k]) > Math.abs(b.linear_velocity[k]))
                            b.linear_velocity[k] += 0.75 * (a.linear_velocity[k] - b.linear_velocity[k]);
                        else
                            a.linear_velocity[k] += 0.75 * (b.linear_velocity[k] - a.linear_velocity[k]);
                // move center offset so it doesn't collide again (not perfect)
                a.center[k] += dp[k] * 0.005;
                b.center[k] += -1* dp[k] * 0.005;
                // jump mechanics
                if(k == 1)
                {
                    if(a.center[k] > b.center[k])
                    {
                        this.flying[0] = false;
                        this.double_jumped[0] = false;
                    }
                    else if(a.center[k] < b.center[k])
                    {
                        this.flying[1] = false;
                        this.double_jumped[1] = false;
                    }
                }
            }
            //rotation testing
            // b.angular_velocity = vec3(-1 * dp.z, 0, dp.x).normalize();
            // b.angular_velocity = vec3(0.0001, 0, 0);
            // b.angular_velocity = 0.1;
            // b.spin_axis = vec3(-1 * dp[2], 0, dp[0]).normalized();
            // b.spin_axis = dp.normalized().times(Mat4.translation(b.center.x, b.center.y, b.center.z));
        }
        else
        {
            // rotation testing
            // let d_top = Mat4.rotation(a.angular_velocity * Math.PI / 16, a.spin_axis[0], a.spin_axis[1], a.spin_axis[2]).times(vec4(0, 1, 0, 1))
            // d_top = d_top.to3();
            // a.angular_velocity = 0.1 * d_top.dot(vec3(0, 1, 0));
            // b.angular_velocity = 0.1 * b.spin_axis.dot(vec3(0, 1, 0));
        }
    }

    display(context, program_state) {
        // display(): Draw everything else in the scene besides the moving bodies.
        /*
        if(this.before_game){
            let begin_transform = Mat4.identity();
            this.shapes.cube.draw(context, program_state, begin_transform, this.start_scene);
        }
         */

       // let starter = Mat4.identity();
       // this.shapes.cube.draw(context, program_state, starter, this.material);


        super.display(context, program_state);
        if(this.brandnew){
            program_state.set_camera((Mat4.translation(0,0,-4)));
        }

        let start_box = Mat4.identity();
        if(this.not_started){
            this.shapes.cube.draw(context, program_state, start_box, this.start_scene.start)
        }


        if(this.playgame){
            if(this.not_started){
                program_state.set_camera((Mat4.translation(0,0,-50)));
            }
            this.brandnew = false;
            this.not_started = false;
        }


        if(this.end_game){
            program_state.set_camera((Mat4.translation(0,0,-4)));
            this.shapes.cube.draw(context, program_state, start_box, this.start_scene.end_of_game)
        }





        let model_transform = Mat4.identity();
        const brown = hex_color("#D2B48C");
        const t = this.t = program_state.animation_time / 1000;

        if (!this.set_camera) {
            this.set_camera = true;
             program_state.set_camera(Mat4.inverse(Mat4.translation(0, 0, 50))); 
            // top down pov
            // program_state.set_camera(Mat4.inverse(Mat4.translation(0, 50, 0).times(Mat4.rotation(3 * Math.PI/2, 1, 0, 0))));    // Locate the camera here (inverted matrix).
        }
        
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, 1, 500);
        program_state.lights = [new Light(vec4(0, -5, -10, 1), color(1, 1, 1, 1), 100000)];
    }
}