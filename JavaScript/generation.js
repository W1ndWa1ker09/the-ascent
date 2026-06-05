class Room {
    constructor(id, x, y) {
        this.id = id;
        this.name = `Room ${this.id}`;
        this.description = null;

        this.x = x, this.y = y;
        this.exits = {};

        this.visited = false;
        this.distance = 0.0;

        this.path = false;
        this.locked = false;
        this.breaker = false;

        this.items = [];
    }
}

function generateFloor(width, contain_items = true, density = 0.8, connection = 0.6) {
    if (width < 5) return null;

    height = width;

    let grid = [];
    for (let y = 0; y < height; y++) {
        let row = [];
        for (let x = 0; x < width; x++) {
            row.push(null);
        }
        grid.push(row);
    }
    
    // STEP 1: Create the path
    let room_id = 0;
    let rooms = [];
    function createRoom(x, y) {
        let room = new Room(room_id++, x, y);
        grid[y][x] = room;
        rooms.push(room);
        return room;
    }

    const start = createRoom(0, 0);
    const end = createRoom(width - 1, height - 1);
    let x = 0, y = 0;
    while (x < width - 1 || y < height - 1) {
        let dx = width - 1 - x;
        let dy = height - 1 - y;

        let move;
        if (dx > 0 && dy > 0) {
            let prob_east = dx / (dx + dy);
            move = Math.random() < prob_east ? "east" : "south";
        } else if (dx > 0) move = "east";
        else move = "south";
        

        if (move == "east") {
            x++;
        } else {
            y++;
        }
        if (!grid[y][x]) {
            createRoom(x, y);
            grid[y][x].path = true;
        }

        let current = grid[y][x];
        let prev = grid[move === "east" ? y : y - (move === "south" ? 1 : 0)]
                       [move === "east" ? x - 1 : x];
        connect(prev, current, move);
    }
    grid[0][0].visited = true;

    // STEP 2: Generate the rest of the rooms
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (!grid[y][x] && Math.random() < density) {
                createRoom(x, y);
            }
        }
    }

    // STEP 3: Connect the rest of the rooms
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let room = grid[y][x];
            if (!room) continue;

            if (grid[y][x + 1] && Math.random() < connection) {
                connect(room, grid[y][x + 1], "east");
            }
            if (grid[y + 1] && grid[y + 1][x] && Math.random() < connection) {
                connect(room, grid[y + 1][x], "south");
            }
        }
    }

    // STEP 4: Remove all disconnected rooms
    let connected = bfs(start, null, grid);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let room = grid[y][x];
            if (room && !connected.has(room)) {
                grid[y][x] = null;
                rooms.splice(rooms.indexOf(room), 1);
            }
        }
    }

    rooms.forEach((room) => 
        room.distance = ((end.x-room.x)+(end.y-room.y))/(end.x+end.y)
    );
    
    // STEP 5: Create the breaker room
    let possible = rooms.filter(room => !room.path && room != start && room != end);
    if (possible.length == 0) possible = rooms.filter(room => room != start && room != end);

    const rand = Math.floor(Math.random() * possible.length);
    const breaker = possible.splice(rand, 1)[0];
    breaker.breaker = true;
    
    if (contain_items && possible.length > 0) {
        // STEP 6: Enable no power floor if parameters met
        const ratio = player.floor/15-1 - player.blackouts;
        if (Math.random() < ratio) {
            changePower(false);
            player.blackouts += 1;
        }

        // STEP 7: Create locked rooms and keys
        possible = rooms.filter(room => !room.path && !room.breaker && room != start && room != end);
        if (possible.length > 0) {
            for (let i = 0; i < Math.floor(width/3); i++) {
                const rand = Math.floor(Math.random() * possible.length);
                const room = possible.splice(rand, 1)[0];
                room.locked = true;
            }
    
            possible = rooms.filter(room => !room.locked && !room.breaker && room != start && room != end);
            for (let i = 0; i < Math.floor(width/9); i++) {
                const room = possible[Math.floor(Math.random() * possible.length)];
                const bfs_result = bfs(
                    start, room, 
                    grid, (neighbor) => {return !neighbor.locked}
                );
                
                if (bfs_result) addItem(room.items, items[0]);
                else if (possible.length > 0) {
                    possible.splice(possible.indexOf(room), 1);
                    i--;
                }
            }
        }

        // STEP 8: Add items
        rooms
            .filter(room => room != start && room != end && !room.breaker)
            .forEach((room) => {
                function randPlaceItems(mult) {
                    items.forEach((item) => {
                        if (item.name != "Key") {
                            let rand = Math.random();
                            let i = 0;
                            while (rand < (item.spawn_chance)*(1+player.floor/100)*mult && i < 3) {
                                addItem(room.items, item);
                                rand = Math.random();
                                i++;
                            }
                        }
                    });
                }

                if (!room.locked) randPlaceItems(1);
                else {
                    const stage2 = items.filter((item) => item.stage == 2);
                    let stage2placed = false;
                    let chance = 1/stage2.length;

                    stage2.forEach((item) => {
                        if (!stage2placed && Math.random() < chance) {
                            addItem(room.items, item);
                            stage2placed = true;
                        } else chance += 1/stage2.length;
                    });
                    randPlaceItems(2);
                }
            });
    }
    
    return grid;
}
function connect(room_a, room_b, direction) {
    if (!room_a || !room_b) return;
    if (room_a.exits[direction]) return;

    room_a.exits[direction] = {x: room_b.x, y: room_b.y, id: room_b.id}
    room_b.exits[switchDirection(direction)] = {x: room_a.x, y: room_a.y, id: room_a.id}
}
function switchDirection(direction) {
    switch (direction) {
        case "north": return "south";
        case "south": return "north";
        case "east": return "west";
        case "west": return "east";
    }
}

function bfs(start, end, floor = null, restriction = () => {return true}) {
    floor = floor ? floor : grid;
    let queue = [[start]];
    let visited = new Set([start]);

    while (queue.length > 0) {
        const path = queue.shift();
        const current = path[path.length - 1];

        if (end && current.x == end.x && current.y == end.y) return path;

        for (let direction in current.exits) {
            const exit = current.exits[direction];
            const neighbor = floor[exit.y][exit.x];

            if (neighbor && restriction(neighbor) && !visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push([...path, neighbor]);
            }
        }
    }
    if (!end) return visited;
    else return null;
}

function convertSchem(grid) { 
    const height = grid.length;
    const width = grid[0].length;

    if (height < width) {
        for (let i = 0; i < (width-height); i++) {
            let row = [];
            for (let j = 0; j < grid[0].length; j++) row.push(false);
            grid.push(row);
        }
    } else if (width < height) {
        for (let i = 0; i < (height-width); i++) {
            for (let j = 0; j < grid.length; j++) grid[j].push(false);
        }
    }

    let rooms = [];
    let id = 0;
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[0].length; x++) {
            const cell = grid[y][x];
            if (cell) {
                grid[y][x] = new Room(id++, x, y);
                rooms.push(grid[y][x]);
            } else grid[y][x] = null;
        }
    }

    rooms.forEach((room) => {
        if (room.x + 1 < grid[0].length && grid[room.y][room.x+1]) 
            connect(room, grid[room.y][room.x+1], "east");
        if (room.x - 1 >= 0 && grid[room.y][room.x-1]) 
            connect(room, grid[room.y][room.x-1], "west");
        if (room.y + 1 < grid.length && grid[room.y+1][room.x]) 
            connect(room, grid[room.y+1][room.x], "south");
        if (room.y - 1 >= 0 && grid[room.y-1][room.x]) 
            connect(room, grid[room.y-1][room.x], "north");
    });

    return grid;
}
function calcFloorAvgs(start, range, tests, density = 0.8, connection = 0.6) {
    let data = [];
    for (let i = start; i < (start+range); i++) {
        let total_rooms = 0;
        let total_items = 0;
        let total_stages = [0, 0, 0, 0];

        for (let j = 0; j < tests; j++) {
            const floor = generateFloor(i, true, density, connection);
            for (let x = 0; x < floor[0].length; x++) {
                for (let y = 0; y < floor.length; y++) {
                    const room = floor[y][x];
                    if (room) {
                        total_rooms++;
                        if (room.items.length > 0) {
                            room.items.forEach((item) => {
                                total_items++;
                                const stage = item.properties.stage-1;
                                if (Number.isInteger(stage) && stage >= 0 && stage < 4) {
                                    total_stages[stage]++;
                                }
                            });
                        }
                    }
                }
            }
        }

        const avg_rooms = (total_rooms/tests)/(i*i);
        const avg_items = total_items/total_rooms;
        const avg_stages = total_stages.map((stage) => stage/total_rooms);
        data.push({
            avg_rooms: avg_rooms,
            avg_items: avg_items,
            avg_stages: avg_stages
        });
    }
    return data;
}