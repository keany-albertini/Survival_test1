extends Node2D
class_name TerrainWorld

const CELL := 32
const COLUMNS := 180
const ROWS := 28
const AIR := 0
const GRASS := 1
const DIRT := 2
const STONE := 3
const WOOD := 4

var cells: Array[PackedInt32Array] = []
var textures: Dictionary = {}
var collider_container: StaticBody2D

func _ready() -> void:
    for type in [GRASS, DIRT, STONE, WOOD]:
        var name := {GRASS:"grass",DIRT:"dirt",STONE:"stone",WOOD:"wood"}[type]
        var path := "res://assets/tilesets/%s.png" % name
        if ResourceLoader.exists(path):
            textures[type] = load(path)
    collider_container = StaticBody2D.new()
    add_child(collider_container)
    for y in ROWS:
        var row := PackedInt32Array()
        row.resize(COLUMNS)
        cells.append(row)
    for x in COLUMNS:
        var surface := clampi(15 + roundi(sin(x * 0.10) * 1.5 + sin(x * 0.027) * 2.0), 10, 19)
        for y in range(surface, ROWS):
            cells[y][x] = GRASS if y == surface else (DIRT if y < surface + 3 else STONE)
    rebuild_colliders()

func rebuild_colliders() -> void:
    for node in collider_container.get_children():
        node.queue_free()
    for x in COLUMNS:
        var y := 0
        while y < ROWS:
            if cells[y][x] == AIR:
                y += 1
                continue
            var start := y
            while y < ROWS and cells[y][x] != AIR:
                y += 1
            var collision := CollisionShape2D.new()
            var box := RectangleShape2D.new()
            box.size = Vector2(CELL, (y - start) * CELL)
            collision.shape = box
            collision.position = Vector2((x + 0.5) * CELL, (start + y) * CELL * 0.5)
            collider_container.add_child(collision)

func modify_cell(tx: int, ty: int, place: bool, kind: int = DIRT) -> bool:
    if tx < 0 or tx >= COLUMNS or ty < 0 or ty >= ROWS:
        return false
    if place and cells[ty][tx] != AIR:
        return false
    if not place and cells[ty][tx] == AIR:
        return false
    cells[ty][tx] = kind if place else AIR
    rebuild_colliders()
    queue_redraw()
    return true

func _draw() -> void:
    for y in ROWS:
        for x in COLUMNS:
            var tile: int = cells[y][x]
            if tile == AIR:
                continue
            var texture: Texture2D = textures.get(tile)
            if texture:
                draw_texture_rect(texture, Rect2(x * CELL, y * CELL, CELL, CELL), false)
            else:
                draw_rect(Rect2(x * CELL, y * CELL, CELL, CELL), {GRASS:Color("#526c49"),DIRT:Color("#795e45"),STONE:Color("#666b69"),WOOD:Color("#876849")}[tile])