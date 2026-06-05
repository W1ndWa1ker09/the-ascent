#include <iostream>
#include <string>
#include <vector>

int main() {
    
    return 0;
}

class Effect() {
public:
    std::string target;
    std::string attribute;
    double value;
    std::string operator;

    Effect(std::string t, std::string a, double v, std::string o, ) {
        target = t;
        attribute = a;
        value = v;
        operator = o;
    }
}
class Item() {
public:
    std::string name;
    std::string description;
    std::vector<Effect> effects;
    int effectDuration;
    double spawnChance;
    int rarity;

    Item(std::string n, std::string d, std::vector<Effect> e, int eD, double sC, int r) {
        name = n;
        description = d;
        effects = e;
        effectDuration = eD;
        spawnChance = sC;
        rarity = r;
    }
}

class Exit() {
public:
    int x, y;
    std::string direction;

    Exit(int posX, int posY, std::string d) {
        x = posX;
        y = posY;
        direction = d;
    }
}
class Room() {
public:
    int x, y;
    std::vector<Exit> exits;
    std::vector<Item> items;

    bool visited = false;
    bool path = false;
    bool locked = false;
    bool breaker = false
}

std::vector<std::vector<Room>> generateGrid(int size, bool items = true, double density = 0.8, double connection = 0.6) {
    std::vector<std::vector<Room>> grid;
    
}