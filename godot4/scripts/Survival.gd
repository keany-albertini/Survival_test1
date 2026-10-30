extends Node
class_name Survival

signal changed(health: float, hunger: float, energy: float, stamina: float)
signal died

@export var hunger_loss_per_second := 0.12
@export var energy_loss_per_second := 0.04
@export var starvation_damage_per_second := 1.6
@export var sprint_stamina_per_second := 17.0
@export var stamina_regeneration_per_second := 12.0

var health := 100.0
var hunger := 100.0
var energy := 100.0
var stamina := 100.0
var dead := false

func _process(delta: float) -> void:
    if dead:
        return
    hunger = maxf(0.0, hunger - hunger_loss_per_second * delta)
    energy = maxf(0.0, energy - energy_loss_per_second * delta)
    if hunger <= 0.0:
        health = maxf(0.0, health - starvation_damage_per_second * delta)
    if energy <= 0.0:
        health = maxf(0.0, health - 0.45 * delta)
    changed.emit(health, hunger, energy, stamina)
    if health <= 0.0:
        dead = true
        died.emit()

func spend_stamina(amount: float) -> bool:
    if dead or stamina < amount:
        return false
    stamina -= amount
    return true

func update_stamina(delta: float, sprinting: bool) -> void:
    if sprinting and stamina > 0.0:
        stamina = maxf(0.0, stamina - sprint_stamina_per_second * delta)
    else:
        stamina = minf(100.0, stamina + stamina_regeneration_per_second * delta)

func eat(amount: float = 22.0) -> void:
    hunger = minf(100.0, hunger + amount)

func hurt(damage: float) -> void:
    if dead:
        return
    health = maxf(0.0, health - damage)