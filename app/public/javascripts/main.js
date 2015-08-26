var itemList = [
"Abyssal Scepter",
"Archangel's Staff",
"Ardent Censer",
"Athene's Unholy Grail",
"Banner of Command",
"Banshee's Veil",
"Blade of the Ruined King",
"The Black Cleaver",
"The Bloodthirster",
"Dead Man's Plate",
"Essence Reaver",
"Face of the Mountain",
"Frost Queen's Claim",
"Frozen Heart",
"Frozen Mallet",
"Guardian Angel",
"Guinsoo's Rageblade",
"Hextech Gunblade",
"Iceborn Gauntlet",
"Infinity Edge",
"Last Whisper",
"Liandry's Torment",
"Lich Bane",
"Locket of the Iron Solari",
"Luden's Echo",
"Manamune",
"Maw of Malmortius",
"Mejai's Soulstealer",
"Mercurial Scimitar",
"Mikael's Crucible",
"Morellonomicon",
"Nashor's Tooth",
"Ohmwrecker",
"Phantom Dancer",
"Rabadon's Deathcap",
"Randuin's Omen",
"Ravenous Hydra (Melee Only)",
"Righteous Glory",
"Rod of Ages",
"Runaan's Hurricane (Ranged Only)",
"Rylai's Crystal Scepter",
"Sightstone",
"Spirit Visage",
"Statikk Shiv",
"Sterak's Gage",
"Sunfire Cape",
"Sword of the Occult",
"Talisman of Ascension",
"Thornmail",
"Titanic Hydra",
"Trinity Force",
"Twin Shadows",
"Void Staff",
"Warmog's Armor",
"Will of the Ancients",
"Wit's End",
"Youmuu's Ghostblade",
"Zeke's Harbinger",
"Zeke's Herald",
"Zephyr",
"Zhonya's Hourglass",
"Zz'Rot Portal",

"Boots of Swiftness",
"Mercury's Treads",
"Sorcerer's Shoes",
"Boots of Mobility",
"Berserker's Greaves",
"Ionian Boots of Lucidity",

"Perfect Hex Core",

"Enchantment: Warrior",
"Enchantment: Magus",
"Enchantment: Runeglaive",
"Enchantment: Juggernaut",
"Enchantment: Cinderhulk",
"Enchantment: Devourer"
];

// Available colors
// Pulled from https://www.google.com/design/spec/style/color.html#color-color-palette
var colorList = [
  "#3F51B5", // Indigo
  "#2196F3", // Blue
  "#00BCD4", // Cyan
  "#009688", // Teal
  "#4CAF50", // Green
  "#8BC34A", // Light Green
  "#CDDC39", // Lime
  "#FFEB3B", // Yellow
  "#FFC107", // Amber
  "#FF9800", // Orange
  "#FF5722", // Deep Orange
  "#F44336", // Red
  "#E91E63", // Pink
  "#9C27B0", // Purple
  "#673AB7" // Deep Purple
];
// Number of colors in use
var colorCount = 0;
// Keeps track of item colors
var colorMap = {"Other" : "#757575"};
// Keeps track of current items and corresponding class names
var currentItems = {};
// Keeps track of new items (following a graph update) to compare against old ('current') items
var newItems = {};
// Keeps track of items that are being filtered out
var filteredItems = {};
// Keeps track of patch to show data for
var patch = '5.14';
// Holds the data
var data = [];

/**
 * Updates graph based on new data
 * @param {object} data - new graph data
 */
var updateGraph = function() {
  var barData = (patch == '5.11' ? data[0] : data[1]).matchItemData;

  // Reset new items map
  newItems = {};

  // Keep track of total number of data points for each bar
  var totals = [0, 0, 0, 0, 0, 0];

  barData.forEach(function(bar, barIndex) {
    for (var item in bar) {
      totals[barIndex] += bar[item];

      // Process item the first time we see it
      if(!newItems[item]) {
        // Create and save class name
        newItems[item] = item.replace(/\s|'|\(|\)|:/g, "");

        // Assign color if needed
        if (!colorMap[item]) {
          colorCount = (colorCount + 1)%colorList.length;
          colorMap[item] = colorList[colorCount];
        }
      }
    }
  });

  // Create/update/remove graph sections
  // Needed totals to properly size sections
  var graph = $('#graph');
  barData.forEach(function(bar, barIndex) {
    var barElement = $('#graph').find('#bar-' + barIndex);
    var otherCount = 0;
    // Update/add bar sections
    for (var item in bar) {
      var percent = bar[item] / totals[barIndex];

      // If less than 4%, group with Other
      if (percent < .03) {
        otherCount += bar[item];
        percent = 0;
      }

      // Update section if it already exists
      $barSectionElement = barElement.find('.' + newItems[item]);
      if ($barSectionElement.length) {
        $barSectionElement.unbind('webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd')
        $barSectionElement.height((percent * 100) + '%');
      }

      // Otherwise, create new bar and legend sections
      else if (percent > 0) {
        addItemSection(item, newItems[item], percent, barElement);
        if (!$('#legend').find('.' + newItems[item]).length)
          addLegendSection(item, newItems[item], $('#legend'));
      }
    }

    $otherSectionElement = barElement.find('.Other');
    percent = otherCount / totals[barIndex];
    if ($otherSectionElement.length) {
      $otherSectionElement.unbind('webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd')
      $otherSectionElement.parent().prepend($otherSectionElement[0]);
      $otherSectionElement.height((percent * 100) + '%');

    }

    // Otherwise, create new bar and legend sections
    else {
      addItemSection('Other', 'Other', percent, barElement);
      if (!$('#legend').find('.Other').length)
        addLegendSection('Other', 'Other', $('#legend'));
    }

  });

  // Remove bar and legend sections for
  // items that are no longer present (following a graph update)
  for (var item in currentItems) {
    if (!newItems.hasOwnProperty(item)) {
      $('.graph-bar .' + currentItems[item]).bind('webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd', function() {
        $('#legend .' + this.classList[1]).remove();
        $(this).remove();
      }).height(0);
    }
  }

  // Update current items
  currentItems = newItems;
};


/**
 * Creates new graph bar section for an item
 *
 * @param {string} itemName - full name of item
 * @param {string} className - class name for DOM element
 * @param {number} percent - percent of bar height new section should take
 * @param {jQueryObject} parent - element to add new section to
 * @returns {jQueryObject} graph bar section
 */
var addItemSection = function(itemName, className, percent, parent) {
  // Create outer element
  var $outer = $('<div>', {class: "graph-bar-section " + className});
  $outer.height(0);

  // Create inner element
  var $inner = $('<div>', {class: "graph-bar-section-inner"});
  $inner.css('background-color', colorMap[itemName]);

  // Add event handlers
  $inner.hover(function() {
    $('#graph .' + className + ' .graph-bar-section-inner').toggleClass('focus');
    $('.legend-section.' + className).css({'background-color': colorMap[itemName], 'color': getTextColor(colorMap[itemName])});
  }, function() {
    $('#graph .' + className + ' .graph-bar-section-inner').toggleClass('focus');
    $('.legend-section.' + className).css({'background-color': 'none', 'color': getTextColor('#FFFFFF')});
  });
  $inner.click(function() {
    // TODO open popup for locking/unlocking item
  });

  $outer.append($inner);
  parent.prepend($outer);

  // flush the style so it animates properly
  window.getComputedStyle($outer[0]).height;
  $outer.height((percent * 100) + '%');
};


/**
 * Creates new legend section for an item
 *
 * @param {string} itemName - full name of item
 * @param {string} className - class name for DOM element
 * @param {jQueryObject} parent - element to add new section to
 * @returns {jQueryObject} legend section
 */
var addLegendSection = function(itemName, className, parent) {
  // Create section element
  var $section = $('<div>', {class: "legend-section " + className});
  $section.css({'opacity': 0});

  // Add event handlers
  $section.hover(function() {
    $('#graph .' + className + ' .graph-bar-section-inner').toggleClass('focus');
    $(this).css({'background-color': colorMap[itemName], 'color': getTextColor(colorMap[itemName])});
  }, function() {
    $('#graph .' + className + ' .graph-bar-section-inner').toggleClass('focus');
    $(this).css({'background-color': 'none', 'color': getTextColor('#FFFFFF')});
  });
  $section.click(function() {
    // TODO open popup for filtering out item
  });

  // Create swatch element
  var $swatch = $('<div>', {class: "legend-section-swatch"});
  $swatch.css('background-color', colorMap[itemName]);

  // Create image element
  var $image = $('<div>', {class: "legend-section-image"});
  $image.css('background-image', "url('images/items/" + className + ".png')");

  // Create text element
  var $text = $('<div>', {class: "legend-section-text"});
  $text.html(itemName);

  $section.append($swatch).append($image).append($text);
  parent.append($section);

  // Fade in new sections
  window.getComputedStyle($section[0]).opacity;
  $section.css({'opacity': 1});
};

/**
 * Returns text color for given background color
 *
 * @param {string} color - background color
 * @returns {string} text color
 */
var getTextColor = function(color) {
 	var r = parseInt(color.substr(1,2),16);
 	var g = parseInt(color.substr(3,2),16);
 	var b = parseInt(color.substr(5,2),16);
 	var yiq = ((r*299)+(g*587)+(b*114))/1000;
 	return (yiq >= 158) ? 'black' : 'white';
};

$(window).load(function() {

  // TODO put this in separate function
  var height = $('#graph-y-axis').height();
  $('#graph-y-axis .axis-title').width(height);
  $('#graph-y-axis .axis-title').css('top', height);

  // TODO put this is separate function
  $('.data-switch').click(function() {
    var position = $(this).attr('data-position') == 'first' ? 'second' : 'first';
    $(this).attr('data-position', position);
    $(this).find('.data-switch-fill').first().css('left', position == 'first' ? 0 : '50%');

    patch = position == 'first' ? '5.11' : '5.14';

    // TODO replace with updateData/getData
    updateGraph();

  });
  $.get('/data/5.14', function(data2) {
    data[1] = data2;
    updateGraph();
    $.get('/data/5.11', function(data1) {
      data[0] = data1;
    });
  });
});
