function display(query_item, match_item, color, include) {
    let query_item_name = color ? query_item.name.toMotd() : query_item.name.toString();
    let match_item_name = color ? match_item.name.toMotd() : match_item.name.toString();
    return include ? match_item_name.includes(query_item_name) : query_item_name === match_item_name;
}

function type(query_item, match_item, _, include) {
    return include ? match_item.type.includes(query_item.type) : query_item.type === match_item.type;
}

function lore(query_item, match_item, color, include) {
    let query_item_lore = query_item.lore.map(line => color ? line.toMotd() : line.toString()).join("\n");
    let match_item_lore = match_item.lore.map(line => color ? line.toMotd() : line.toString()).join("\n");
    return include ? match_item_lore.includes(query_item_lore) : query_item_lore === match_item_lore;
}

module.exports = { display, type, lore };