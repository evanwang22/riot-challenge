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

var colorMap = {
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

  "AP" : "#1E88E5",
  "AD" : "#F4511E",
  "Tank" : "#43A047",
  "Miscellaneous" : "#5E35B1",
  "Other" : "#dddddd"

  // "AP" : "#3C6579",
  // "AD" : "#3C6579",
  // "Tank" : "#3C6579",
  // "Miscellaneous" : "#3C6579",
  // "Other" : "#eeeeee"

}

// Create map of item name to class name
var classNameMap = {};
Object.keys(itemCategoryMap).forEach(function(item, itemIndex) {
  classNameMap[item] = item.replace(/\s|'|\(|\)|:/g, "");
});

// Number of colors in use
var colorCount = 0;
// Keeps track of item colors
//var colorMap = {"Other" : "#757575"};
// Keeps track of current items shown in the legend
var legendItems = [];
// Keeps track of new items (following a graph update) to compare against old ('current') items
var newItems;
// Keeps track of patch to show data for
var patch = '5.14';
// Holds the data
var data = [];
// Keeps track of item types to show
var categoryMap = {'AP' : true,
                   'AD' : false,
                   'Tank' : false,
                   'Miscellaneous' : false};
var categoryOrder = ['AP', 'AD', 'Tank', 'Miscellaneous'];

/**
 * Updates graph based on new data
 * @param {object} data - new graph data
 */
var updateGraph = function() {
  var barData = (patch == '5.11' ? data[1] : data[0]);

  // Reset new items map
  newItems = [];

  // Keep track of total number of data points for each bar
  var totals = [0, 0, 0, 0, 0, 0];

  barData.forEach(function(bar, barIndex) {
    for (var item in bar) {
      // Skip if item category hidden
      if (!categoryMap[itemCategoryMap[item]])
        continue;

      totals[barIndex] += bar[item];
    }
  });

  // Create/update/remove graph sections
  // Needed totals to properly size sections
  var graph = $('#graph');
  barData.forEach(function(bar, barIndex) {

    // Sort keys (items) by category and size.
    var keys = Object.keys(bar);
    keys.sort(function(a, b) {
      if (categoryOrder.indexOf(itemCategoryMap[a]) < categoryOrder.indexOf(itemCategoryMap[b]))
        return -1;
      else if (categoryOrder.indexOf(itemCategoryMap[a]) > categoryOrder.indexOf(itemCategoryMap[b]))
        return 1;
      else
        return bar[a] < bar[b] ? 1 : (bar[a] > bar[b] ? -1 : 0);
    });



    var barElement = $('#graph').find('#bar-' + barIndex);
    var otherPercent = 0;
    // Update/add bar sections
    for (var i = 0; i < keys.length; i++) {
      var item = keys[i];

      var percent = bar[item] / totals[barIndex];

      // Set percent to 0 here to properly hide sections
      if (!categoryMap[itemCategoryMap[item]])
        percent = 0;

      // If less than 4%, group with Other
      if (percent < .03) {
        otherPercent += percent;
        percent = 0;
      }

      // Update section if it already exists
      $barSectionElement = barElement.find('.' + classNameMap[item]);
      if (!$barSectionElement.length)
        $barSectionElement = addItemSection(item, percent, barElement);
      else
        $barSectionElement.height((percent * 100) + '%');

      $barSectionElement.find('.graph-bar-section-inner').css({'border-color': percent ? colorMap[itemCategoryMap[item]] : '#ffffff',
                                                                 'background-color': percent ? colorMap[itemCategoryMap[item]] : '#ffffff'});

      if (percent > 0) {
        if (newItems.indexOf(item) == -1)
          newItems.push(item);
      }
    }

    $otherSectionElement = barElement.find('.Other');
    if ($otherSectionElement.length) {
      $otherSectionElement.parent().prepend($otherSectionElement[0]);
      $otherSectionElement.height((otherPercent * 100) + '%');
    }

    // Otherwise, create new bar and legend sections
    else {
      addItemSection('Other', otherPercent, barElement);
      if (!$('#legend').find('.Other').length)
        addLegendSection('Other', $('#legend'));
    }

  });




  // Remove bar and legend sections for
  // items that are no longer present (following a graph update)
  for (var i = 0; i < legendItems.length; i++) {
    var item = legendItems[i];
    if (newItems.indexOf(item) == -1) {
      $('#legend .' + classNameMap[item]).parent().remove();
      legendItems.splice(i, 1);
      i--;
    }
  }

  newItems.sort();
  newItems.forEach(function(item, index) {
    if (legendItems.indexOf(item) == -1)  {
      addLegendSection(item, $('#legend'));
      legendItems.push(item);
    }
  });
};


/**
 * Creates new graph bar section for an item
 *
 * @param {string} itemName - full name of item
 * @param {number} percent - percent of bar height new section should take
 * @param {jQueryObject} parent - element to add new section to
 * @returns {jQueryObject} graph bar section
 */
var addItemSection = function(itemName, percent, parent) {
  var className = classNameMap[itemName];

  // Create outer element
  var $outer = $('<div>', {class: "graph-bar-section " + className});
  $outer.height(0);

  // Create inner element
  var $inner = $('<div>', {class: "graph-bar-section-inner"});
  $inner.css('background-color', colorMap[itemCategoryMap[itemName]]);
  $inner.css('border-color', colorMap[itemCategoryMap[itemName]]);


  var color = colorMap[itemCategoryMap[itemName]];
  // Add event handlers
  $inner.hover(
    function() {focusItem(className, color)},
    function() {unfocusItem(className, color)}
  );
  $inner.click(function() {
    lockItem($(this), className, color);
  });

  $outer.append($inner);
  parent.prepend($outer);

  // flush the style so it animates properly
  window.getComputedStyle($outer[0]).height;
  $outer.height((percent * 100) + '%');
  return $outer;
};


/**
 * Creates new legend section for an item
 *
 * @param {string} itemName - full name of item
 * @param {jQueryObject} parent - element to add new section to
 * @returns {jQueryObject} legend section
 */
var addLegendSection = function(itemName, parent) {
  var className = classNameMap[itemName];

  // Create section element
  var $section = $('<div>', {class: "legend-section"});
  $section.css({'opacity': 0});


  var color = colorMap[itemCategoryMap[itemName]];
  // Add event handlers
  $section.hover(
    function() {focusItem(className, color)},
    function() {unfocusItem(className, color)}
  );
  $section.click(function() {
    lockItem($(this).find('.legend-section-text'), className, color);
  });

  // Create swatch element
  // var $swatch = $('<div>', {class: "legend-section-swatch"});
  // $swatch.css('background-color', colorMap[itemCategoryMap[itemName]]);

  // Create image element
  var $image = $('<div>', {class: "legend-section-image"});
  $image.css('background-image', "url('images/items/" + className + ".png')");

  // Create text element
  var $text = $('<div>', {class: "legend-section-text " + className});
  $text.html(itemName);

  $section.append($image).append($text);
  parent.append($section);

  // Fade in new sections
  window.getComputedStyle($section[0]).opacity;
  $section.css({'opacity': 1});
};

var focusItem = function(className, color) {
  $('#graph .' + className + ' .graph-bar-section-inner').addClass('focused');

  var legendSectionText = $('.legend-section-text.' + className);
  legendSectionText.addClass('focused').css({'background-color': color, 'color': getTextColor(color)});

  if (!legendSectionText.hasClass('locked'))
    legendSectionText.css({'border-color': color});
};

var unfocusItem = function(className, color) {
  $('#graph .' + className + ' .graph-bar-section-inner').removeClass('focused');

  var legendSectionText = $('.legend-section-text.' + className);
  legendSectionText.removeClass('focused').css({'background-color': 'none', 'color': getTextColor('#ffffff')});

  if (!legendSectionText.hasClass('locked'))
    legendSectionText.css({'border-color': '#ffffff'});
};

var lockItem = function(elem, className, color) {
  var locked = elem.hasClass('locked');

  $('#graph .locked').removeClass('locked');
  $('#legend .locked').each(function() {
    if (!$(this).hasClass('focused'))
      $(this).css({'border-color': '#ffffff'});
  });
  $('#legend .locked').removeClass('locked');


  if (!locked) {
    $('#graph .' + className + ' .graph-bar-section-inner').addClass('locked');
    $('#legend .' + className).addClass('locked');
    $('#legend .' + className).css({'border-color': color});
  }
};

var toggleCategory = function(element, category) {
  element.toggleClass('visible');

  categoryMap[category] = !categoryMap[category];
  updateGraph();
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

  $('#ap-selector-section').click(function() {toggleCategory($(this), 'AP')});
  $('#ad-selector-section').click(function() {toggleCategory($(this), 'AD')});
  $('#tank-selector-section').click(function() {toggleCategory($(this), 'Tank')});
  $('#misc-selector-section').click(function() {toggleCategory($(this), 'Miscellaneous')});

  $.get('/data', function(matchData) {
    data[1] = matchData.matchItemData511;
    data[0] = matchData.matchItemData514;
    updateGraph();
  });
});
