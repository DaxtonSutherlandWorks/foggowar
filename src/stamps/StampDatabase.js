import Castle from "../stamps/castleStamp.svg";
import Fence from "../stamps/fenceStamp.svg";
import Gate from "../stamps/gateStamp.svg";
import Grass from "../stamps/grassStamp.svg";
import Rubble from "../stamps/rubbleStamp.svg";
import Tent from "../stamps/tentStamp.svg";
import Tree from "../stamps/treeStamp.svg";
import Water from "../stamps/waterStamp.svg";

export const StampDatabase = {
    
    tree: {
        id: "tree",
        name: "Tree",
        category: "Demo",
        image: Tree,
        width: 70,
        height: 70
    },

    castle: {
        id: "castle",
        name: "Castle",
        category: "Demo",
        image: Castle,
        width: 70,
        height: 70
    },

    fence: {
        id: "fence",
        name: "Fence",
        category: "Demo",
        image: Fence,
        width: 70,
        height: 70
    },

    gate: {
        id: "gate",
        name: "Gate",
        category: "Demo",
        image: Gate,
        width: 70,
        height: 70
    },

    rubble: {
        id: "rubble",
        name: "Rubble",
        category: "Demo",
        image: Rubble,
        width: 70,
        height: 70
    },

    tent: {
        id: "tent",
        name: "Tent",
        category: "Demo",
        image: Tent,
        width: 70,
        height: 70
    },

    grass: {
        id: "grass",
        name: "Grass",
        category: "Demo",
        image: Grass,
        width: 70,
        height: 70
    },

    water: {
        id: "water",
        name: "Water",
        category: "Demo",
        image: Water,
        width: 70,
        height: 70
    }

}

export function getStamp(id) 
{
    return StampDatabase[id];
}

export function getAllStamps() 
{
    return Object.values(StampDatabase);
}

export function getCategory(category)
{
    return Object.values(StampDatabase).filter(stamp => stamp.category === category);
}