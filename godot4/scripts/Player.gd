extends CharacterBody2D
class_name SurvivorPlayer

@export var walk_speed := 130.0
@export var run_speed := 205.0
@export var crouch_speed := 65.0
@export var jump_velocity := -325.0
@export var gravity := 850.0

var input_axis := 0.0
var input_run := false
var input_crouch := false
var want_jump := false
var facing := 1
var anim_time := 0.0
var state := "idle"
var sprites: Dictionary = {}
var survival: Survival

func _ready() -> void:
    add_to_group("player")
    var collision := CollisionShape2D.new()
    var box := RectangleShape2D.new()
    box.size = Vector2(19, 43)
    collision.shape = box
    collision.position.y = -21.5
    add_child(collision)
    for animation in ["idle", "walk", "run", "jump", "crouch", "attack"]:
        sprites[animation] = []
        var index := 0
        while true:
            var path := "res://assets/sprites/%s_%02d.png" % [animation, index]
            if not ResourceLoader.exists(path):
                break
            sprites[animation].append(load(path))
            index += 1

func _physics_process(delta: float) -> void:
    if not is_instance_valid(survival) or survival.dead:
        velocity = Vector2.ZERO
        return
    var axis := clampf(input_axis + Input.get_axis("ui_left", "ui_right"), -1.0, 1.0)
    var crouching := input_crouch or Input.is_action_pressed("ui_down")
    var sprinting := input_run and not crouching and absf(axis) > 0.1 and survival.stamina > 1.0
    var speed := crouch_speed if crouching else (run_speed if sprinting else walk_speed)
    velocity.x = axis * speed
    survival.update_stamina(delta, sprinting)
    if not is_on_floor():
        velocity.y += gravity * delta
    elif want_jump and not crouching and survival.spend_stamina(10.0):
        velocity.y = jump_velocity
    want_jump = false
    if absf(axis) > 0.05:
        facing = 1 if axis > 0 else -1
    move_and_slide()
    if not is_on_floor():
        state = "jump"
    elif crouching:
        state = "crouch"
    elif absf(velocity.x) < 4.0:
        state = "idle"
    elif sprinting:
        state = "run"
    else:
        state = "walk"
    anim_time += delta * {"idle": 4.0, "walk": 9.0, "run": 12.0, "jump": 4.0, "crouch": 5.0}.get(state, 5.0)
    queue_redraw()

func _draw() -> void:
    var frames: Array = sprites.get(state, [])
    if frames.is_empty():
        draw_rect(Rect2(-12, -58, 24, 58), Color(0.4, 0.34, 0.26))
        return
    var frame: Texture2D = frames[int(anim_time) % frames.size()]
    var draw_height := 96.0
    var draw_width := draw_height * (float(frame.get_width()) / maxf(1.0, float(frame.get_height())))
    var rect := Rect2(-draw_width * 0.5, -draw_height, draw_width, draw_height)
    if facing < 0:
        rect.position.x += draw_width
        rect.size.x = -draw_width
    draw_texture_rect(frame, rect, false)

func jump() -> void:
    want_jump = true