const signs_containers = document.querySelectorAll(".signs_container");
signs_containers.forEach((container) => {
    const is_default = container.classList.contains("default");

    const signs = container.querySelectorAll(".sign");
    var z_index = signs.length+Number(container.style.zIndex);
    signs.forEach((sign) => {
        sign.style.zIndex = z_index;
        z_index--;

        const offset = -(sign.getBoundingClientRect().top + sign.offsetHeight + 20);
        sign.style.setProperty("--offset", `${offset}px`);
        
        if (is_default) sign.style.animation = "drop 2s";
    });
    if (is_default) {
        container.style.opacity = 1;
        container.style.pointerEvents = "auto";
    }

    const buttons = container.querySelectorAll("button.sign");
    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            signs.forEach((sign) => sign.style.animation = "rise 2s");
            setTimeout(() => {
                container.style.opacity = 0;
                container.style.pointerEvents = "none";

                const new_container = document.querySelector(`#${button.id}.signs_container`) ?? container;
                const listener = document.querySelector(`.listeners #${button.id}`);
                if (new_container != container || !listener) {
                    new_container.querySelectorAll(".sign").forEach(
                        (sign) => sign.style.animation = "drop 2s"
                    );
                    new_container.style.opacity = 1;
                    new_container.style.pointerEvents = "auto";
                } else listener.click();
            }, 1900);
        });
    });
});

const toggle_btns = document.querySelectorAll(".toggle");
toggle_btns.forEach((btn) => {
    function getState() {
        return !btn.classList.contains("off");
    }
    function setState(state) {
        if (state) {
            btn.classList.remove("off");
            btn.textContent = "ENABLED";
        }
        else {
            btn.classList.add("off");
            btn.textContent = "DISABLED";
        }
        localStorage.setItem(btn.id, getState().toString());
    }

    let setting = localStorage.getItem(btn.id);
    if (setting != null) {
        setting = (setting == "true") ? true : false;
        setState(setting);
    }
    else localStorage.setItem(btn.id, getState().toString());

    btn.addEventListener("click", () => {setState(!getState())});
});

const text_speed_slider = document.getElementById("text_speed_slider");
const text_speed = document.getElementById("text_speed");

let default_speed = localStorage.getItem("speed") ?? 30;

text_speed_slider.min = 1;
text_speed_slider.max = 10;
text_speed_slider.value = 10-(default_speed/10);
text_speed.textContent = text_speed_slider.value;
text_speed_slider.addEventListener("input", () => {
    text_speed.textContent = text_speed_slider.value;
    default_speed = 100-(text_speed_slider.value*10);
    localStorage.setItem("speed", default_speed);
});