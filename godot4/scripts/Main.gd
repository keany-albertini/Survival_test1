extends Node2D

var terrain: TerrainWorld
var player: SurvivorPlayer
var survival: Survival
var hud: Label
var inventory := {"terre": 8, "pierre": 0, "bois": 5, "nourriture": 3}
var axis := 0.0
var hold_run := false
var hold_crouch := false
var touch_origin := Vector2.ZERO
var touch_id := -1
var status := "Explore et survis"

func _ready() -> void:
    terrain = TerrainWorld.new()
    add_child(terrain)
    survival = Survival.new()
    add_child(survival)
    player = SurvivorPlayer.new()
    player.position = Vector2(6 * 32, 8 * 32)
    player.survival = survival
    add_child(player)
    var camera := Camera2D.new()
    camera.position = Vector2(0, -110)
    camera.zoom = Vector2(1.45, 1.45)
    camera.position_smoothing_enabled = true
    camera.position_smoothing_speed = 4.0
    camera.limit_left = 0
    camera.limit_right = 180 * 32
    camera.limit_bottom = 28 * 32
    player.add_child(camera)
    camera.make_current()
    var gui := CanvasLayer.new()
    add_child(gui)
    var panel := PanelContainer.new()
    panel.position = Vector2(12, 12)
    gui.add_child(panel)
    hud = Label.new()
    hud.add_theme_font_size_override("font_size", 18)
    panel.add_child(hud)
    var controls := HBoxContainer.new()
    controls.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_RIGHT)
    controls.position = Vector2(815, 600)
    gui.add_child(controls)
    for action in ["SAUT", "COURIR", "MINER", "POSER", "MANGER"]:
        var button := Button.new()
        button.text = action
        button.custom_minimum_size = Vector2(86, 75)
        controls.add_child(button)
        if action == "COURIR":
            button.button_down.connect(func(): hold_run = true)
            button.button_up.connect(func(): hold_run = false)
        else:
            button.pressed.connect(_on_action.bind(action))
    survival.died.connect(func(): status = "Mort définitive : partie terminée")

func _process(_delta: float) -> void:
    player.input_axis = axis
    player.input_run = hold_run or Input.is_key_pressed(KEY_SHIFT)
    player.input_crouch = hold_crouch
    hud.text = "%s\nVie %d  Faim %d  Energie %d  Endurance %d\nTerre %d · Pierre %d · Bois %d · Rations %d\n%s" % [player.name, int(survival.health), int(survival.hunger), int(survival.energy), int(survival.stamina), inventory["terre"], inventory["pierre"], inventory["bois"], inventory["nourriture"], status]

func _on_action(action: String) -> void:
    if survival.dead:
        return
    if action == "SAUT":
        player.jump()
    elif action == "MANGER":
        if inventory["nourriture"] > 0:
            inventory["nourriture"] -= 1
            survival.eat()
            status = "Tu manges une ration"
        else:
            status = "Plus de nourriture"
    else:
        var tx := floori((player.position.x + player.facing * 40.0) / terrain.CELL)
        var ty := floori((player.position.y + 6.0) / terrain.CELL)
        if action == "MINER":
            var mined := false
            for offset in range(4):
                var candidate := ty + offset
                if tx >= 0 and tx < terrain.COLUMNS and candidate >= 0 and candidate < terrain.ROWS and terrain.cells[candidate][tx] != terrain.AIR:
                    var kind: int = terrain.cells[candidate][tx]
                    if terrain.modify_cell(tx, candidate, false):
                        inventory["pierre" if kind == terrain.STONE else "terre"] += 1
                        mined = true
                    break
            status = "Bloc extrait" if mined else "Aucun bloc à portée"
        elif action == "POSER":
            if inventory["terre"] > 0 and terrain.modify_cell(tx, ty, true, terrain.DIRT):
                inventory["terre"] -= 1
                status = "Terre placée"
            else:
                status = "Emplacement bloqué ou terre insuffisante"

func _unhandled_input(event: InputEvent) -> void:
    if event is InputEventKey and event.pressed and not event.echo:
        if event.keycode == KEY_SPACE:
            player.jump()
        elif event.keycode == KEY_E:
            _on_action("MINER")
        elif event.keycode == KEY_F:
            _on_action("POSER")
        elif event.keycode == KEY_R:
            _on_action("MANGER")
    if event is InputEventScreenTouch:
        if event.pressed and event.position.x < 450 and touch_id == -1:
            touch_id = event.index
            touch_origin = event.position
        elif not event.pressed and event.index == touch_id:
            touch_id = -1
            axis = 0.0
            hold_crouch = false
    elif event is InputEventScreenDrag and event.index == touch_id:
        var diff := event.position - touch_origin
        axis = clampf(diff.x / 65.0, -1.0, 1.0)
        hold_crouch = diff.y > 43.0
        if diff.y < -48.0:
            player.jump()

func _draw() -> void:
    draw_rect(Rect2(-200, -600, 6400, 1450), Color("273c45"))
    for layer in range(3):
        var col := [Color("3a5555"), Color("385449"), Color("263d37")][layer]
        for i in range(90):
            var x := float(i * (93 + layer * 27))
            var y := float(350 + layer * 80)
            draw_circle(Vector2(x, y), float(90 - layer * 11), col)