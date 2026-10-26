extends CharacterBody3D
class_name Survivor

const SPEED = 5.0
const SPRINT_SPEED = 8.0
var hp = 100.0
var hunger = 100.0
var thirst = 100.0
var wood = 0
var stone = 0
var camera: Camera3D
var pitch = 0.0

func _ready():
    var shape = CapsuleShape3D.new()
    shape.height = 1.8
    shape.radius = 0.35
    var collision = CollisionShape3D.new()
    collision.shape = shape
    collision.position.y = 0.9
    add_child(collision)
    camera = Camera3D.new()
    camera.position.y = 1.65
    camera.current = true
    add_child(camera)
    Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)

func _unhandled_input(event):
    if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
        rotate_y(-event.relative.x * 0.0025)
        pitch = clamp(pitch - event.relative.y * 0.0025, -1.4, 1.4)
        camera.rotation.x = pitch
    if event.is_action_pressed("ui_cancel"):
        if Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
            Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)
        else:
            Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)
    if event.is_action_pressed("interact"):
        gather()
    if event.is_action_pressed("build") and wood >= 5:
        wood -= 5
        get_parent().build_floor(global_position - global_transform.basis.z * 3.0)

func _physics_process(delta):
    if not is_on_floor():
        velocity.y -= 18.0 * delta
    elif Input.is_action_just_pressed("jump"):
        velocity.y = 5.5
    var axis = Input.get_vector("left", "right", "forward", "back")
    var direction = (transform.basis * Vector3(axis.x, 0, axis.y)).normalized()
    var speed = SPRINT_SPEED if Input.is_action_pressed("sprint") else SPEED
    velocity.x = direction.x * speed
    velocity.z = direction.z * speed
    move_and_slide()
    hunger = max(0.0, hunger - delta * 0.03)
    thirst = max(0.0, thirst - delta * 0.05)
    if hunger <= 0 or thirst <= 0:
        hp = max(0.0, hp - delta)

func gather():
    var query = PhysicsRayQueryParameters3D.create(camera.global_position, camera.global_position - camera.global_transform.basis.z * 4.0)
    query.exclude = [get_rid()]
    var hit = get_world_3d().direct_space_state.intersect_ray(query)
    if hit and hit.collider.has_meta("resource"):
        var resource = hit.collider.get_meta("resource")
        if resource == "wood":
            wood += 1
        elif resource == "stone":
            stone += 1
        if hit.collider.has_meta("harvests"):
            var count = hit.collider.get_meta("harvests") + 1
            hit.collider.set_meta("harvests", count)
            if count >= 8:
                hit.collider.queue_free()
