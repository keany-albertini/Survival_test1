extends Node3D

const PlayerScript = preload("res://scripts/player.gd")
var survivor: Survivor
var hud: Label

func _ready():
    _inputs()
    var env = WorldEnvironment.new()
    var sky_env = Environment.new()
    sky_env.background_mode = Environment.BG_SKY
    sky_env.sky = Sky.new()
    sky_env.sky.sky_material = ProceduralSkyMaterial.new()
    sky_env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
    env.environment = sky_env
    add_child(env)
    var sun = DirectionalLight3D.new()
    sun.rotation_degrees = Vector3(-45, -30, 0)
    sun.shadow_enabled = true
    add_child(sun)
    _terrain()
    _nature()
    survivor = PlayerScript.new()
    survivor.position = Vector3(0, 4, 0)
    add_child(survivor)
    var ui = CanvasLayer.new()
    add_child(ui)
    hud = Label.new()
    hud.position = Vector2(18, 18)
    hud.add_theme_font_size_override("font_size", 19)
    ui.add_child(hud)

func _inputs():
    var keys = {"forward": [KEY_W, KEY_Z], "back": [KEY_S], "left": [KEY_A, KEY_Q], "right": [KEY_D], "jump": [KEY_SPACE], "sprint": [KEY_SHIFT], "interact": [KEY_E], "build": [KEY_B]}
    for action in keys:
        InputMap.add_action(action)
        for key in keys[action]:
            var e = InputEventKey.new()
            e.physical_keycode = key
            InputMap.action_add_event(action, e)

func _mat(c):
    var m = StandardMaterial3D.new()
    m.albedo_color = c
    m.roughness = 0.95
    return m

func _terrain():
    var body = StaticBody3D.new()
    add_child(body)
    var ground = MeshInstance3D.new()
    var mesh = BoxMesh.new()
    mesh.size = Vector3(320, 2, 320)
    ground.mesh = mesh
    ground.material_override = _mat(Color(0.24, 0.31, 0.19))
    ground.position.y = -1
    body.add_child(ground)
    var col = CollisionShape3D.new()
    var shape = BoxShape3D.new()
    shape.size = mesh.size
    col.shape = shape
    col.position.y = -1
    body.add_child(col)

func _resource(kind, pos, radius):
    var body = StaticBody3D.new()
    body.position = pos
    body.set_meta("resource", kind)
    body.set_meta("harvests", 0)
    add_child(body)
    var visual = MeshInstance3D.new()
    if kind == "stone":
        var mesh = SphereMesh.new()
        mesh.radius = radius
        mesh.height = radius * 1.6
        visual.mesh = mesh
        visual.material_override = _mat(Color(0.39, 0.40, 0.37))
        visual.position.y = radius * 0.5
    else:
        var trunk = CylinderMesh.new()
        trunk.top_radius = 0.22
        trunk.bottom_radius = 0.38
        trunk.height = 5
        visual.mesh = trunk
        visual.position.y = 2.5
        visual.material_override = _mat(Color(0.28, 0.18, 0.11))
        for i in range(3):
            var leaves = MeshInstance3D.new()
            var cone = CylinderMesh.new()
            cone.top_radius = 0.0
            cone.bottom_radius = 1.9 - i * 0.3
            cone.height = 3.2
            leaves.mesh = cone
            leaves.position.y = 4 + i * 1.25
            leaves.material_override = _mat(Color(0.09, 0.23, 0.13))
            body.add_child(leaves)
    body.add_child(visual)
    var col = CollisionShape3D.new()
    if kind == "stone":
        var shape = SphereShape3D.new()
        shape.radius = radius
        col.shape = shape
        col.position.y = radius * 0.5
    else:
        var shape = CylinderShape3D.new()
        shape.height = 5
        shape.radius = 0.4
        col.shape = shape
        col.position.y = 2.5
    body.add_child(col)

func _nature():
    var random = RandomNumberGenerator.new()
    random.seed = 14102026
    for i in range(110):
        var x = random.randf_range(-140, 140)
        var z = random.randf_range(-140, 140)
        if Vector2(x,z).length() > 12:
            _resource("wood", Vector3(x, 0, z), 1)
    for i in range(80):
        var x = random.randf_range(-140, 140)
        var z = random.randf_range(-140, 140)
        if Vector2(x,z).length() > 10:
            _resource("stone", Vector3(x, 0, z), random.randf_range(0.5, 1.3))

func build_floor(pos):
    var foundation = StaticBody3D.new()
    foundation.position = Vector3(snapped(pos.x, 3), 0.15, snapped(pos.z, 3))
    add_child(foundation)
    var visual = MeshInstance3D.new()
    var mesh = BoxMesh.new()
    mesh.size = Vector3(3, 0.3, 3)
    visual.mesh = mesh
    visual.material_override = _mat(Color(0.38, 0.25, 0.14))
    foundation.add_child(visual)
    var col = CollisionShape3D.new()
    var shape = BoxShape3D.new()
    shape.size = mesh.size
    col.shape = shape
    foundation.add_child(col)

func _process(_delta):
    hud.text = "EVERWILD  |  Prototype 0.1\nVie: %.0f   Faim: %.0f   Soif: %.0f\nBois: %d   Pierre: %d\nZQSD/WASD bouger · Souris regarder · E récolter · B fondation (5 bois) · Maj courir · Espace sauter" % [survivor.hp, survivor.hunger, survivor.thirst, survivor.wood, survivor.stone]
