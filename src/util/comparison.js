function display(query, item, color, include) {
    if (!query.name || !item.name) return true;
    let queryName = color ? query.name.toMotd() : query.name.toString();
    let itemName = color ? item.name.toMotd() : item.name.toString();
    return include ? itemName.includes(queryName) : queryName === itemName;
}

function type(query, item, color, include) {
    if (!query.type || !item.type) return true;
    return include ? item.type.includes(query.type) : query.type === item.type;
}

function lore(query, item, color, include) {
    if (!query.lore || !item.lore) return true;
    let queryLore = query.lore.map(line => color ? line.toMotd() : line.toString()).join("\n");
    let itemLore = item.lore.map(line => color ? line.toMotd() : line.toString()).join("\n");
    return include ? itemLore.includes(queryLore) : queryLore === itemLore;
}

module.exports = { display, type, lore };