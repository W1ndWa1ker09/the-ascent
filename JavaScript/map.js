function drawMap(centered = false, hide_unvisited = true, show_position = true) {
    const canvas = document.querySelector("canvas.map");
    canvas.width = 400;
    canvas.height = 400;

    const ctx = canvas.getContext("2d");

    const h = grid.length, w = grid[0].length;
    const cell_size = centered
        ? Math.min(canvas.width / zoom, canvas.height / zoom)
        : Math.min(canvas.width / w, canvas.height / h);
    const room_size = cell_size * 0.6;
    const connector_size = cell_size * 0.2;
    const center_x = canvas.width / 2;
    const center_y = canvas.height / 2;

    function getCenter(x, y) {
        let cx, cy;
        if (centered) {
            const dx = (x - player.x) * cell_size;
            const dy = (y - player.y) * cell_size;
            cx = center_x + dx;
            cy = center_y + dy;
        } else {
            cx = x * cell_size + cell_size / 2;
            cy = y * cell_size + cell_size / 2;
        }
        return [cx, cy]
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let room = grid[y][x];
            if (!room || (!room.visited && hide_unvisited)) continue;

            const current = show_position && room.x == player.x && room.y == player.y;
            const exit = room.x == grid[0].length-1 && room.y == grid.length-1;
            if (monster.active && room.x == monster.x && room.y == monster.y) ctx.fillStyle = "red";
            else if (current && exit) ctx.fillStyle = "purple";
            else if (current) ctx.fillStyle = "lime";
            else if (exit) ctx.fillStyle = "blue";
            else if (room.breaker) ctx.fillStyle = "orange";
            else ctx.fillStyle = "white";

            const center = getCenter(x, y);
            const cx = center[0], cy = center[1];

            ctx.fillRect(
                cx - room_size / 2,
                cy - room_size / 2,
                room_size,
                room_size
            );

            if (room.items.length > 0) {
                ctx.fillStyle = "orange";
                ctx.beginPath();
                ctx.arc(
                    cx, cy,
                    room_size / 4, 0, Math.PI * 2
                );
                ctx.fill();
            }
        }
    }

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let room = grid[y][x];
            if (!room || (!room.visited && hide_unvisited)) continue;
            
            const center = getCenter(x, y);
            const cx = center[0], cy = center[1];

            for (let dir in room.exits) {
                let exit = room.exits[dir];
                let neighbor = grid[exit.y][exit.x];
                if (!room || (!room.visited && hide_unvisited) || !player.power && !neighbor.visited) continue;
                
                let nx, ny;
                if (centered) {
                    nx = center_x + (exit.x - player.x) * cell_size;
                    ny = center_y + (exit.y - player.y) * cell_size;
                } else {
                    nx = exit.x * cell_size + cell_size / 2;
                    ny = exit.y * cell_size + cell_size / 2;
                }

                let mx = (cx + nx) / 2;
                let my = (cy + ny) / 2;
                
                ctx.fillStyle = (room.locked || neighbor.locked) ? "blue" : "white";
                ctx.fillRect(
                    mx - connector_size / 2,
                    my - connector_size / 2,
                    connector_size,
                    connector_size
                );
            }
        }
    }

    const radius = canvas.width / 35;
    const color = elevator.active ? "lime" : "red";

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(
        canvas.width-radius-5, canvas.height-radius-5,
        radius, 0, Math.PI*2
    );
    ctx.fill();
}
function dropSignContainer(id) {
    const container = document.querySelector(`#${id}.signs_container`);
    container.name = "drop";
    container.style.opacity = 1;
    container.style.pointerEvents = "auto";
    container.querySelectorAll(".sign").forEach((sign) => sign.style.animation = "drop 2s");
}
function raiseSignContainer(id) {
    const container = document.querySelector(`#${id}.signs_container`);
    container.name = "rise";
    const signs = container.querySelectorAll(".sign");
    signs.forEach((sign) => sign.style.animation = "rise 2s");
    setTimeout(() => {
        if (container.name == "rise") {
            container.style.opacity = 0;
            container.style.pointerEvents = "none";
        }
    }, 1900);
}
function dropLocation(name, button, enabled) {
    const container = document.querySelector("#location.signs_container");
    
    const title = container.querySelector("div.sign");
    title.textContent = name;

    const rise_button = container.querySelector("button.sign");
    if (button) {
        rise_button.style.display = "inline";
        rise_button.textContent = button;
        rise_button.id = name;
        if (enabled && rise_button.classList.contains("disabled")) rise_button.classList.remove("disabled");
        else if (!enabled) rise_button.classList.add("disabled");
    } else rise_button.style.display = "none";

    dropSignContainer("location");
}
function dropFloorInfo() {
    dropLocation("Elevator", `Travel up ${elevator.speed} floor${(elevator.speed>1)?"s":""}`, elevator.active);
}
function changePower(value) {
    player.power = value;

    const bg = document.querySelector(".background");
    bg.style.opacity = player.power ? 1 : 0;
    bg.style.animation = player.power ? "flicker 10s infinite" : "none";
}