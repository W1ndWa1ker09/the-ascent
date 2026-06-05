function updateSanity(diff) {
    let new_sanity = player.sanity + diff;
    if (new_sanity < 0) player.sanity = 0;
    else if (new_sanity > 100) player.sanity = 100;
    else player.sanity = new_sanity;

    let designation;
    if (player.sanity > 90) designation = "Healthy";
    else if (player.sanity > 70) designation = "Stable";
    else if (player.sanity > 40) designation = "Cautionary";
    else if (player.sanity > 10) designation = "Dangerous";
    else if (player.sanity > 0) designation = "Extreme";
    else designation = "UNBEARABLE";
    
    const span = document.querySelector(".insanity");
    span.textContent = designation;
    span.className = "insanity " + designation;
}
function updateInventory() {
    const span = document.querySelector(".inventory");
    if (player.inventory.length == 0) span.innerHTML = "Empty";
    else {
        function getSortKey(item) {
            const p = item.properties;

            let type_index = "other";
            if (p.name.includes("Key")) return [0, 0, 0];
            else if (p.name.includes("Battery")) type_index = 1;
            else if (p.name.includes("Capsule")) type_index = 2;
            else type_index = 3;
            return [1, -p.stage, type_index, p.name];
        }

        player.inventory.sort((a, b) => {
            const a_key = getSortKey(a);
            const b_key = getSortKey(b);
            for (let i = 0; i < a_key.length; i++) {
                if (a_key[i] < b_key[i]) return -1;
                if (a_key[i] > b_key[i]) return 1;
            }
            return 0;
        });
        span.innerHTML = player.inventory
            .map((item) => `<span class='item index${player.inventory.indexOf(item)}'>${item.count} ${item.properties.name}${(item.count > 1) ? "s" : ""}</span>`)
            .join("<br>");
    }

    document.querySelectorAll(".item").forEach((item) => {
        if (item.classList.contains(`index${selected_item}`)) item.classList.add("selected");
        else item.classList.remove("selected");
    });
}
function resetPlayer() {
    player.x = 0, player.y = 0;
    player.floor = 0;
    player.sanity = 100;
    player.inventory = [];
    player.blackouts = 0;
    player.discovered_floors = 1;
    effects = [];
    updateInventory();
    updateSanity(0);
    updateEffects(false);
}

function addEffect(name, duration) {
    const current_effect = effects.find((effect) => effect.name == name);
    let identifier = name.split(" ");
    identifier = identifier[identifier.length-1];

    if (current_effect) {
        const longest_duration = getLongestDuration(identifier);

        current_effect.duration += duration;
        if (current_effect.duration > longest_duration) current_effect.duration = longest_duration;
    } else effects.push({name: name, duration: duration});
    updateEffects(false);
}
function updateEffects(remove_duration = true) {
    function updateBar(effect, items_id, bar_id, clear = false) {
        const bar_filler = document.querySelector(`.progress_bar_filler#${bar_id}`);
        if (!clear) {
            const longest_duration = getLongestDuration(items_id);
            const stage = items.find((prop) => prop.name == effect.name).stage;
    
            let percent = (effect.duration/longest_duration*100);
            if (percent > 100) percent = 100;
    
            bar_filler.style.width = percent + "%";
            bar_filler.className = "progress_bar_filler stage" + stage;
        } else {
            bar_filler.style.width = "0%";
            bar_filler.className = "progress_bar_filler stage1";
        }
    }

    modifiers = {
        player: {deterioration: player.deterioration, move: player.move},
        monster: {move: monster.move}
    }
    updateBar(null, null, "flashlight", true);
    updateBar(null, null, "medication", true);

    for (let effect of effects) {
        if (effect.duration > 0) {
            const item = items.find((item) => item.name == effect.name);

            if (item.name == "Reality Anchor") monster.active = false;
            else {
                for (prop of item.effects) {
                    if (prop.operation == "+") modifiers[prop.target][prop.modifier] += prop.value;
                    else modifiers[prop.target][prop.modifier] *= prop.value;
                }
            }

            if (remove_duration) effect.duration -= 1;

            if (effect.name.includes("Battery")) updateBar(effect, "Battery", "flashlight");
            if (effect.name.includes("Capsule")) updateBar(effect, "Capsule", "medication");
        } else effects.splice(effects.indexOf(effect), 1);
    }
}

function updateMonster() { 
    const path = bfs(
        grid[monster.y][monster.x], grid[player.y][player.x],
        null, (neighbor) => {return neighbor.visited}
    );

    if (!monster.active) {
        if (player.floor > 0 && path && path.length >= 7) {
            monster.active = true;
            document.getElementById("entity_appearance").play();
            tip(() => message("DO NOT LET IT CATCH YOU"), "monster");
        }
        return;
    }

    function checkCaught() {
        if (monster.x == player.x && monster.y == player.y) {
            updateSanity(-40);
            monster.active = false;
            document.getElementById("caught_by_entity").play();
            return true;
        };
        return false;
    }

    if (checkCaught()) return;

    let chance = (0.1+(100-player.sanity)*(2/900)+player.floor*(4/1000))*modifiers.monster.move;
    if (player.floor + elevator.speed >= 100) chance = 1;

    if (Math.random() < chance) {
        if (path && path.length > 1) {
            const next = path[1];
            monster.x = next.x;
            monster.y = next.y;
        }
    }

    checkCaught();
    return;
}
function resetMonster() {
    monster.x = 0, monster.y = 0;
    monster.active = false;
}

function initFloor() {
    grid = generateFloor(10);
    elevator.active = false;

    player.x = 0, player.y = 0;
    resetMonster();

    clearConsole();
    drawMap(true);
}
async function gameLoop() {
    dropLocation(`Floor ${(player.floor-100)}`, false, false)
    while (true) {
        tip(() => printLine(
            "This is the <b>console</b>. Type <b>'commands'</b> to see a list of commands. Type <b>'keybinds'</b> to see a list of keybinds. Type <b>'help'</b> to see this message again."),
            "help");

        const action = await performAction();
        if (action == "return") {
            raiseSignContainer("location");
            dropSignContainer("title");
            document.querySelector(".play").style.display = "none";
            saveData();
            document.getElementById("suspense_bgm").pause();
            return;
        } else if (action == "move") await handleTimePass();
    }
}
async function performAction() {
    while (true) {
        updateEffects(false);

        let input = await getInput();
        input = input.split(" ");

        switch (input[0]) {
            case "menu": return "return";

            case "go":
                let move;
                if (input[1]) {
                    move = parseDirectionInput(input[1]);
                    if (!move) {
                        printLine(`'${input[1]}' is not a valid direction.`); 
                        continue;
                    }
                } else {
                    printLine("Go where?"); 
                    continue;
                }
                
                let room = grid[player.y][player.x];
                if (room.exits[move]) {
                    const exit = room.exits[move];
                    room = grid[exit.y][exit.x];

                    if (room.locked) {
                        printLine(`That room is locked.`);
                        continue;
                    } else {
                        if (Math.random() < modifiers.player.move) {
                            player.x = exit.x;
                            player.y = exit.y;
        
                            room = grid[player.y][player.x];
                            room.visited = true;
                    
                            clearConsole();

                            if (getStored("auto_pickup") === true) {
                                const picked_up = [...room.items];
                                room.items = [];
                                picked_up.forEach((item) => {
                                    if (addItem(player.inventory, item.properties, item.count))
                                        printLine(`You automatically pick up ${item.count} ${item.properties.name}${item.count > 1 ? "s" : ""}.`);
                                    else
                                        printLine(`You have no room for ${item.properties.name} and it is lost.`);
                                });
                            }

                            printItems(
                                "This room contains ", "",
                                room.items, 0
                            );
                            drawMap();
                        } else printLine("You were too tired to move and 1 minute went by.");
                        return "move";
                    }
                } else {
                    if (player.power) printLine(`You can't go ${move}.`);
                    else {
                        printLine(`You attempt to go ${move} but fail to find an exit in the dark. 1 minute passes.`);
                        handleTimePass();
                    }
                }
                continue;
            case "unlock":
                if (player.inventory.filter(item => item.properties.name == "Key").length > 0) {
                    let direction;
                    if (input[1]) direction = parseDirectionInput(input[1]);
                    if (!input[1] || !direction) {
                        printLine("Unlock which room?"); 
                        continue;
                    }

                    const exit = grid[player.y][player.x].exits[direction];
                    if (exit) {
                        const room = grid[exit.y][exit.x];
                        if (room.locked) {
                            room.locked = false;
                            removeItem(player.inventory, items[0]);

                            drawMap(true);
                            printLine(`You've unlocked that room.`);
                        } else printLine("That room is already unlocked");
                    } else printLine("There is no room that way.")
                } else printLine("You have no keys.");
                continue;
            case "lockpick":
                let direction;
                if (input[1]) direction = parseDirectionInput(input[1]);
                if (!input[1] || !direction) {
                    printLine("Lockpick which room?"); 
                    continue;
                }

                const exit = grid[player.y][player.x].exits[direction];
                if (exit) {
                    const room = grid[exit.y][exit.x];
                    if (room.locked) {
                        handleTimePass();
                        if (Math.random() < player.sanity/300) {
                            room.locked = false;
                            drawMap(true);
                            printLine("You successfully unlocked that room. 1 minute has gone by.");
                        } else printLine("You failed to unlock the room. 1 minute has gone by.");
                    } else printLine("That room is already unlocked.");
                } else printLine("There is no room that way.");
                continue;

            case "take":
                findItemMatches(grid[player.y][player.x].items, input, 
                    (item) => {                        
                        removeItem(grid[player.y][player.x].items, item.properties);
                        if (addItem(player.inventory, item.properties)) printLine(`You take a ${item.properties.name}.`);
                        else printLine(`You have no room for a ${item.properties.name} and it is lost.`);
                        drawMap(true);
                        
                    }, "this room", "Take"
                );
                continue;
            case "look":
                let combined_array = [...grid[player.y][player.x].items, ...player.inventory]
                combined_array = [...(new Set(combined_array))];
                findItemMatches(combined_array, input, 
                    (item) => {
                        printItemDescription(item.properties);
                        if (!player.discovered.includes("item.properties.name")) {
                            player.discovered.push(item.properties.name);
                        }
                    },
                    "this room your or inventory.", "Look at"
                );
                continue;
            case "use":
                findItemMatches(player.inventory, input,
                    (item) => {
                        if (item.properties.name != "Key") {
                            let identifier = item.properties.name.split(" ");
                            identifier = identifier[identifier.length-1];
                            
                            if (
                                !effects.find((effect) => 
                                    effect.name.includes(identifier) && effect.name != item.properties.name
                                )
                            ) {
                                removeItem(player.inventory, item.properties);
                                printLine(`You use the ${item.properties.name}.`);
                                addEffect(item.properties.name, item.properties.duration);
                                updateInventory();
                            } else printLine("An item of that type is already active.");
                        } else printLine("You can't use this item.")
                    }, "your inventory", "Use"
                );
                continue;
            case "upgrade":
                if (player.x == grid.length-1 && player.y == grid.length-1) {
                    if (player.inventory.filter(item => item.properties.name == "Ion Battery").length > 0) {
                        removeItem(player.inventory, items.find((item) => item.name == "Ion Battery"));
                        elevator.speed += 1;
                        dropFloorInfo();
                        printLine(`The elevator's speed has been upgraded to ${elevator.speed}.`);
                    } else printLine("You have no ion batteries.");
                } else printLine("You aren't at the elevator.");
                continue;

            case "catalogue":
                if (player.discovered.length > 0) {
                    player.discovered.forEach((name) => {
                        items
                            .filter((prop) => prop.name == name)
                            .forEach((prop) => {
                                printItemDescription(prop)
                            });
                    });
                } else printLine("You haven't discovered any items.");
                continue;
            case "items":
                printItems(
                    "This room contains ", "There are no items in this room.", 
                    grid[player.y][player.x].items, getStored("speed")
                );
                continue;
            
            case "help":
                printLine("This is the <b>console</b>. Type <b>'commands'</b> to see a list of commands. Type <b>'keybinds'</b> to see a list of keybinds. Type <b>'help'</b> to see this message again.");
                continue;
            case "commands":
                printLine("List of <b>case-insensitive</b> commands:");
                printLine("<b>'menu'</b> to return to the main menu.");
                printLine("<b>'items'</b> to display all items in the room.");
                printLine("<b>'go'</b> followed by a direction, e.g. <b>'north'/'n'/'up'/'u'</b> to move to an adjacent room.");
                printLine("<b>'unlock'</b>, followed by a direction, e.g. <b>'north'/'n'/'up'/'u'</b> to unlock a room.");
                printLine("<b>'lockpick'</b>, followed by a direction, e.g. <b>'north'/'n'/'up'/'u'</b> to attempt to lockpick a room. The chance of success scales with your sanity.");
                printLine("<b>'look'</b>, followed by an item in the room to look at that item");
                printLine("<b>'take'</b>, followed by an item in the room to pick it up.");
                printLine("<b>'use'</b>, followed by an item in your inventory to use it.");
                printLine("<b>'upgrade'</b>, when at the elevator, to upgrade it with an ion battery.");
                continue;
            case "keybinds":
                printLine("List of keybinds:");
                printLine("<b>'w'/'a'/'s'/'d'</b> to move to an adjacent room.");
                printLine("<b>'e'</b> to pick an item in the room.");
                printLine("<b>ArrowUp/ArrowDown</b> to switch the selected item.");
                printLine("<b>'f'</b> to use the selected item.");
                printLine("<b>'q'</b> to look at the selected item.");
                printLine("<b>hold 'r'</b> and click an <b>arrow key</b> to unlock a room in that direction.");
                printLine("<b>hold 't'</b> and click an <b>arrow key</b> to attempt to lockpick a room in that direction. The chance of success scales with your sanity.");
                printLine("<b>'v'</b>, when at the elevator, to upgrade it with an ion battery.");
                continue;
            
            case "m": case "map":
                drawMap(false, false);
                continue;
            case "z": case "zoom":
                if (input[1]) {
                    const num = Number(input[1]);
                    if (!isNaN(num) && num >= 1 && num <= 10) {
                        zoom = -num + 20;
                        printLine(`The zoom was set to ${num}.`);
                        drawMap(true);
                    } else if (input[1] == "default") {
                        zoom = 10;
                        printLine("The zoom was set to 10.");
                        drawMap(true);
                    } else printLine("That zoom value is invalid.");
                } else printLine(`The zoom value is at ${(-zoom-20)}.`);
                continue;
            default: 
                printLine(`'${input[0]}' is not a valid command.`); 
                continue;
        }
    }
}
async function handleTimePass() {
    tip(() => message("Where am I?"), "where");

    updateSanity(modifiers.player.deterioration);
    updateEffects();
    updateMonster();
    
    drawMap(true);
    
    if (player.sanity <= 0) {
        const death = document.createElement("div");
        death.className = "death";

        document.body.appendChild(death);
        setTimeout(() => {document.body.removeChild(death)}, 4000);

        await new Promise(resolve => {
            setTimeout(() => {
                initFloor();
                resetPlayer();
                dropFloorInfo();
                changePower(true);
                resolve();
            }, 3600);
        });
    } else {
        if (player.x == 0 && player.y == 0) dropLocation(`Floor ${(player.floor-100)}`, false, false);
        else if (player.x == 9 && player.y == 9) {
            dropFloorInfo();
            tip(() => message("No power..."), "breaker");
        }
        else if (grid[player.y][player.x].breaker) dropLocation("Breaker", "Flip", !elevator.active);
        else raiseSignContainer("location");
    }
}

function createListener(callback, id) {
    const listener = document.createElement("button");
    listener.id = id;
    listener.addEventListener("click", () => callback());
    document.querySelector(".listeners").appendChild(listener);
}
function getStored(item) {
    const stored = localStorage.getItem(item);
    return stored ? JSON.parse(stored) : null;
}
function saveData() {
    localStorage.setItem("save_data", JSON.stringify({
        player: player,
        effects: effects,
        modifiers: modifiers,

        monster: monster,

        grid: grid,
        elevator: elevator,

        tips: tips
    }));
}
function loadData() {
    function isDictionary(variable) {
        return typeof variable == 'object' && variable != null && !Array.isArray(variable);
    }

    const data = getStored("save_data");
    if (data) {
        for (let key in data) {
            if (window.hasOwnProperty(key)) {
                if (isDictionary(window[key])) {
                    for (let var_key in data[key]) {
                        window[key][var_key] = data[key][var_key];
                    }
                } else {
                    window[key] = data[key];
                }
            }
        }
        document.querySelector("#continue").classList.remove("disabled");
    }
}

function tip(callback, id) {
    if (!tips.includes(id)) {
        callback();
        tips.push(id);
    }
}
function wait(ms) {
    return new Promise(resolve => {
        setTimeout(() => {resolve()}, ms);
    });
}
function range(length) {
    let array = [];
    for (let i = 0; i < length; i++) array.push(i);
    return array;
}

let screen = document.querySelector(".console");
let queue = [];
let printing = false;
let selected_item = 0;

let zoom = 10;

var grid = [];
var elevator = {active: false, speed: 1};

var player = {x: 0, y: 0, floor: 0, discovered_floors: 1, blackouts: 0, power: false, inventory: [], discovered: [], sanity: 100, deterioration: -0.25, move: 1};
var monster = {x: 0, y: 0, active: false, move: 1};

var effects = [];
var modifiers = {
    player: {deterioration: player.deterioration, move: player.move},
    monster: {move: monster.move}
}

var tips = [];

let last_key = 0;
let r_held = false;
let t_held = false;
document.addEventListener("keydown", async (e) => {
    const now = Date.now();
    if (e.repeat && now-last_key < 100) return;

    const input = document.querySelector(".input");
    const event = new KeyboardEvent("keydown", {key: "Enter"});

    if (input && document.activeElement != input) {
        function action(prompt) {
            input.value = prompt;
            input.dispatchEvent(event);
        }
        function changeSelected(direction) {
            const diff = direction ? 1 : -1;
            if (selected_item + diff < 0) selected_item = player.inventory.length-1;
            else if (selected_item + diff >= player.inventory.length) selected_item = 0;
            else selected_item += diff;
            updateInventory();
        }
        if (e.key == "r") r_held = true;
        else if (e.key == "t") t_held = true;
        else if (e.key == "w") action("go up");
        else if (e.key == "s") action("go down");
        else if (e.key == "d") action("go right");
        else if (e.key == "a") action("go left");
        else if (e.key == "v") action("upgrade");
        else if (e.key == "ArrowUp") {
            if (r_held) action("unlock up");
            else if (t_held) action("lockpick up");
            else changeSelected(false);
        } else if (e.key == "ArrowDown") {
            if (r_held) action("unlock down");
            else if (t_held) action("lockpick down");
            else changeSelected(true);
        } else if (e.key == "ArrowRight") {
            if (r_held) action("unlock right");
            else if (t_held) action("lockpick right");
        } else if (e.key == "ArrowLeft") {
            if (r_held) action("unlock left");
            else if (t_held) action("lockpick left");
        }
        else if (e.key == "f") {
            if (player.inventory.length > 0) {
                input.value = "use "+player.inventory[selected_item].properties.name;
                input.dispatchEvent(event);

                await wait(100);
                if (selected_item >= player.inventory.length && player.inventory.length > 0) changeSelected(false);
            }
        } else if (e.key == "e") {
            const room = grid[player.y][player.x];
            if (room.items.length > 0) {
                input.value = "take "+room.items[0].properties.name;

                input.dispatchEvent(event);
            }
        } else if (e.key == "q") {
            if (player.inventory.length > 0) {
                input.value = "look "+player.inventory[selected_item].properties.name;
                if (selected_item > 0) selected_item -= 1;

                input.dispatchEvent(event);
            }
        }
    }

    last_key = now;
});
document.addEventListener("keyup", (e) => {
    if (e.key == "r") r_held = false;
    else if (e.key == "t") t_held = false;
});

createListener(() =>  {
    document.querySelector(".play").style.display = "inline";

    initFloor();
    resetPlayer();
    changePower(true);
    elevator.speed = 1;
    tips = [];
    gameLoop();
    document.getElementById("game_start").play();
    document.getElementById("suspense_bgm").play();
    
    localStorage.removeItem("save_data");
    document.querySelector("#continue").classList.remove("disabled");
}, "new_game");
createListener(() => {
    document.querySelector(".play").style.display = "inline";
    
    updateEffects(false);
    updateInventory();
    updateSanity(0);
    changePower(player.power);
    drawMap(true);
    gameLoop();
    document.getElementById("game_start").play();
    document.getElementById("suspense_bgm").play();
}, "continue");
createListener(async () => {
    document.getElementById("elevator_arrived").play();
    await wait(3000);

    player.floor += elevator.speed;
    player.discovered_floors += 1;
    updateSanity(10);
    initFloor();
    dropLocation(`Floor ${(player.floor-100)}`, "Return", false);
    changePower(player.power);
    gameLoop();
}, "Elevator");
createListener(() => {
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[0].length; j++) {
            const room = grid[i][j];
            if (room && room.breaker) room.breaker = false;
        }
    }
    elevator.active = true;
    changePower(true);
    drawMap(true);
}, "Breaker");

window.onbeforeunload = function () {saveData();};
loadData();

console.log("Play.js loaded.");