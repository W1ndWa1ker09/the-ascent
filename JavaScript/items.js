class ItemProperties {
    constructor(name, description, effects, duration, spawn_chance, stage) {
        this.name = name;
        this.description = description;
        this.effects = effects.map(
            (effect) => {
                return {target: effect[0], modifier: effect[1], value: effect[2], operation: effect[3]}
            }
        );
        this.duration = duration;
        this.spawn_chance = spawn_chance;
        this.stage = stage;
        this.discovered = false;
    }
}
const items = [
    // Keys
    new ItemProperties(
        "Key", "Appears slightly rusted but still functional.<br><i>Used to unlock locked doors.</i>",
        [], 0, 0, 1
    ),

    // Batteries
    new ItemProperties(
        "Regular Battery", "The light of the flashlight will soothe your fear.<br><i>Mild power for 10 minutes, slowing it's approach.</i>",
        [["monster", "move", 0.85, "*"]], 10, 0.03, 1
    ),
    new ItemProperties(
        "Lithium Battery", "The light of the flashlight will soothe your fear.<br><i>Moderate power for 20 minutes, slowing it's approach.</i>",
        [["monster", "move", 0.65, "*"]], 20, 0.01, 2
    ),
    new ItemProperties(
        "Ion Battery", "The light of the flashlight will soothe your fear.<br><i>Extreme power for 5 minutes, slowing it's approach.</i>",
        [["monster", "move", 0.3, "*"]], 5, 0.005, 3
    ),
    
    // Capsules
    new ItemProperties(
        "Low-Dose Capsule", "The pill will calm your mind.<br><i>Mild sanity recovery and fatigue for 10 minutes.</i>",
        [["player", "deterioration", 0.45, "+"], ["player", "move", 0.9, "*"]], 10, 0.03, 1
    ),
    new ItemProperties(
        "Prescription Capsule", "The pill will calm your mind.<br><i>Moderate sanity recovery and fatigue for 20 minutes.</i>",
        [["player", "deterioration", 0.75, "+"], ["player", "move", 0.7, "*"]], 20, 0.01, 2
    ),
    new ItemProperties(
        "Experimental Capsule", "The pill will calm your mind.<br><i>Extreme sanity recovery and fatigue for 5 minutes.</i>",
        [["player", "deterioration", 3.25, "+"], ["player", "move", 0.5, "*"]], 5, 0.005, 3
    ),

    // Tier 4 Mythics
    new ItemProperties(
        "Reality Anchor", "The talisman helps you realize what is real, and what is fake.<br><i>It dissapears till you're five rooms away.</i>",
        [], 1, 0.00125, 4
    ),
    new ItemProperties(
        "Portrait of the Mind", "The picture in the frame shows what you love most.<br><i>Immediate immense sanity recovery.</i>",
        [["player", "deterioration", 40, "+"]], 1, 0.00125, 4
    ),
];

function addItem(items, properties, count=1) {
    const item = items.find(item => item.properties.name == properties.name);

    let result = true;
    if (item) {
        if (item.count + count > 5) {
            item.count = 5;
            result = false;
        }
        else item.count += count;
    } else items.push({properties: properties, count: count});

    if (items == player.inventory) updateInventory();
    return result;
}
function removeItem(items, properties, count=1) {
    const item = items.find(item => item.properties.name == properties.name);

    if (item) {
        if (item.count - count > 0) item.count -= count;
        else items.splice(items.indexOf(item), 1);

        if (items == player.inventory) updateInventory();
        return item;
    }
    return null;
}

function getLongestDuration(identifier) {
    let longest_duration = 0;
    items
        .filter((prop) => prop.name.includes(identifier))
        .forEach((prop) => {
            if (prop.duration > longest_duration) longest_duration = prop.duration;
        });
    return longest_duration;
}