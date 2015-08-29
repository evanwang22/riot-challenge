// Map of items to categories
var itemCategoryMap = {
  "Abyssal Scepter" : "AP",
  "Archangel's Staff" : "AP",
  "Ardent Censer" : "AP",
  "Athene's Unholy Grail" : "AP",
  "Banner of Command" : "AP",
  "Banshee's Veil" : "Tank",
  "Blade of the Ruined King" : "AD",
  "The Black Cleaver" : "AD",
  "The Bloodthirster" : "AD",
  "Dead Man's Plate" : "Tank",
  "Essence Reaver" : "AD",
  "Face of the Mountain" : "Tank",
  "Frost Queen's Claim" : "AP",
  "Frozen Heart" : "Tank",
  "Frozen Mallet" : "Tank",
  "Guardian Angel" : "Tank",
  "Guinsoo's Rageblade" : "Miscellaneous",
  "Hextech Gunblade" : "Miscellaneous",
  "Iceborn Gauntlet" : "Tank",
  "Infinity Edge" : "AD",
  "Last Whisper" : "AD",
  "Liandry's Torment" : "AP",
  "Lich Bane" : "AP",
  "Locket of the Iron Solari" : "Tank",
  "Luden's Echo" : "AP",
  "Manamune" : "AD",
  "Maw of Malmortius" : "AD",
  "Mejai's Soulstealer" : "AP",
  "Mercurial Scimitar" : "AD",
  "Mikael's Crucible" : "Miscellaneous",
  "Morellonomicon" : "AP",
  "Nashor's Tooth" : "AP",
  "Ohmwrecker" : "Tank",
  "Phantom Dancer" : "AD",
  "Rabadon's Deathcap" : "AP",
  "Randuin's Omen" : "Tank",
  "Ravenous Hydra (Melee Only)" : "AD",
  "Righteous Glory" : "Tank",
  "Rod of Ages" : "AP",
  "Runaan's Hurricane (Ranged Only)" : "AD",
  "Rylai's Crystal Scepter" : "AP",
  "Sightstone" : "Miscellaneous",
  "Spirit Visage" : "Tank",
  "Statikk Shiv" : "AD",
  "Sterak's Gage" : "Tank",
  "Sunfire Cape" : "Tank",
  "Sword of the Occult" : "AD",
  "Talisman of Ascension" : "Miscellaneous",
  "Thornmail" : "Tank",
  "Titanic Hydra" : "Tank",
  "Trinity Force" : "AD",
  "Twin Shadows" : "AP",
  "Void Staff" : "AP",
  "Warmog's Armor" : "Tank",
  "Will of the Ancients" : "AP",
  "Wit's End" : "Miscellaneous",
  "Youmuu's Ghostblade" : "AD",
  "Zeke's Harbinger" : "Miscellaneous",
  "Zeke's Herald" : "Miscellaneous",
  "Zephyr" : "AD",
  "Zhonya's Hourglass" : "AP",
  "Zz'Rot Portal" : "Tank",

  "Boots of Swiftness" : "Miscellaneous",
  "Mercury's Treads" : "Tank",
  "Sorcerer's Shoes" : "AP",
  "Boots of Mobility" : "Miscellaneous",
  "Berserker's Greaves" : "AD",
  "Ionian Boots of Lucidity" : "Miscellaneous",

  "Perfect Hex Core" : "AP",

  "Enchantment: Warrior" : "AD",
  "Enchantment: Magus" : "AP",
  "Enchantment: Runeglaive" : "AP",
  "Enchantment: Juggernaut" : "Tank",
  "Enchantment: Cinderhulk" : "Tank",
  "Enchantment: Devourer" : "Miscellaneous",

  "Other" : "Other"
};

// Map of item names to class names
var classNameMap = {};
Object.keys(itemCategoryMap).forEach(function(item, itemIndex) {
  classNameMap[item] = item.replace(/\s|'|\(|\)|:/g, "");
});

// TODO remove if unneeded
// Available colors
// Pulled from https://www.google.com/design/spec/style/color.html#color-color-palette
// var colorList = [
//   "#3F51B5", // Indigo
//   "#2196F3", // Blue
//   "#00BCD4", // Cyan
//   "#009688", // Teal
//   "#4CAF50", // Green
//   "#8BC34A", // Light Green
//   "#CDDC39", // Lime
//   "#FFEB3B", // Yellow
//   "#FFC107", // Amber
//   "#FF9800", // Orange
//   "#FF5722", // Deep Orange
//   "#F44336", // Red
//   "#E91E63", // Pink
//   "#9C27B0", // Purple
//   "#673AB7" // Deep Purple
// ];

// Map of category to color
var colorMap = {
  "AP" : "#1E88E5",
  "AD" : "#F4511E",
  "Tank" : "#43A047",
  "Miscellaneous" : "#5E35B1",
  "Other" : "#dddddd"

  // TODO clean out unused colors
  // "AP" : "#173C79",
  // "AD" : "#94724D",
  // "Tank" : "#195657",
  // "Miscellaneous" : "#332B50",

  // "Other" : "#444444"
  // "AP" : "#2D4CA0",
  // "AD" : "#EE4B2D",
  // "Tank" : "#21AE51",
  // "Miscellaneous" : "#EEB02D",
  // "Other" : "#444444"


  // "AP" : "#3C6579",
  // "AD" : "#3C6579",
  // "Tank" : "#3C6579",
  // "Miscellaneous" : "#3C6579",
  // "Other" : "#eeeeee"

}

// Order to display categories in
var categoryOrder = ['AP', 'AD', 'Tank', 'Miscellaneous'];
