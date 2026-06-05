function processQueue() {
    if (queue.length == 0) {
        printing = false;
        return;
    }

    printing = true;
    const {text, interval, new_line} = queue.shift();
    
    if (new_line && !screen.innerHTML == "") {addText("<br>");}
    
    if (interval > 0) {printChar(text, 0, interval);}
    else {
        addText(text);
        printing = false;
        processQueue();
    }
    screen.scrollTop = screen.scrollHeight;
}
function printLine(text, interval = null, new_line = true) { 
    if (!interval) interval = getStored("speed");
    queue.push({text, interval, new_line})
    if (!printing) {
        processQueue();
    }
}
function printChar(text, i, interval) {
    if (i < text.length) {
        if (text[i] == "<") {
            const end = text.indexOf(">", i);
            const tag = text.substring(i+1, end);

            if (tag.toLowerCase() == "br") {
                screen.appendChild(document.createElement("br"));

                i = end + 1;
            } else {
                const end_tag = `</${tag}>`;
                const end_i = text.indexOf(end_tag, end);
                
                const elem = document.createElement(tag);
                elem.textContent = text.substring(end + 1, end_i);
                screen.appendChild(elem);

                i = end_i + end_tag.length;
            }
        } else {
            addText(text[i]);
            i++;
        }
        screen.scrollTop = screen.scrollHeight;
        setTimeout(() => {printChar(text, i, interval)}, interval);
    } else {
        printing = false;
        processQueue();
    }
}
function addText(text, elem_id = "", elem_class = "", elem="span") {
    elem = document.createElement(elem);
    elem.id = elem_id;
    elem.className = elem_class;
    elem.innerHTML += text;
    screen.appendChild(elem);
}

async function numberedPrompt(options, prompt = "Select an option to continue.") {
    for (let i = 0; i < options.length; i++) {
        printLine(`(${(i+1)}) ${options[i]}`);
    }
    
    return await getInteger(prompt, 1, options.length);
}
function getInput() {
    return new Promise(resolve => {
        function tryInput() {
            if (!printing) {
                if (!screen.innerHTML == "") addText("<br>");
                addText("> ");

                const input = document.createElement("input");
                input.type = "text";
                input.className = "input";
                input.placeholder = "Enter command here";
                screen.appendChild(input);

                input.addEventListener("keydown", function handler(e) {
                    if (e.key === "Enter") {
                        let value = input.value;
                        if (value.length > 25) value = value.slice(0, 25) + "....";
                        screen.removeChild(input);

                        addText(value, "", "cmd");
                        resolve(value.toLowerCase());
                    }
                });
            } else {
                setTimeout(tryInput, 10);
            }
        }
        tryInput();
    });
}
function parseDirectionInput(input) {
    switch(input) {
        case "n": case "north": case "u": case "up": 
            return "north";
        case "s": case "south": case "d": case "down": 
            return "south";
        case "e": case "east": case "r": case "right": 
            return "east";
        case "w": case "west": case "l": case "left": 
            return "west";
        default: return null;
    }
}

function findItemMatches(items, input, callback, area, verb) {
    if (input[1]) {
        if (items.length > 0) {
            input = input.slice(1).join(" ");

            let matches = [];
            items.forEach((item) => {
                if (item.properties.name.substring(0, input.length).toLowerCase() == input) {
                    matches.push(item);
                }
            });
            
            if (matches.length == 1) callback(matches[0]);
            else if (matches.length > 1) printLine(`Specify more characters than '${input}' for an item.`);
            else printLine(`Your item input '${input}' doesn't match an item in ${area}.`);
        } else printLine(`There are no items in ${area}.`);
    } else printLine(`${verb} what?`);
}
function printItemDescription(properties) {
    printLine(`<b>${properties.name}</b><br>${properties.description}`);
}

function clearConsole() {
    screen.innerHTML = "";
}
function printItems(intro, empty, items, interval) {
    if (items.length > 0) {
        printLine(intro, interval);
        const output = items
            .map(item => `${item.count} ${item.properties.name}${(item.count>1)?"s":""}`)
            .join(", ") + ".";
        printLine(output, interval, false);
    } else printLine(empty, interval);
}
function message(text) {
    const div = document.createElement("div");
    div.className = "message";
    div.textContent = text;

    document.body.appendChild(div);
    setTimeout(() => document.body.removeChild(div), 5000);
}