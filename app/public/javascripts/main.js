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
var colorMap = {};
// Keeps track of current items and corresponding class names
var currentItems = {};
// Keeps track of new items (following a graph update) to compare against old ('current') items
var newItems = {};
// Keeps track of items that are being filtered out
var filteredItems = {};
// Keeps track of patch to show data for
var patch = '5.14';

/*
TODO replace with an updateData/getData function that takes new data from database
and formats it before handing off to graph.
make sure it clears filteredItems
*/
var randomizeData = function() {
  for (var barIndex in sampleData) {
    if (sampleData.hasOwnProperty(barIndex)) {
      var bar = sampleData[barIndex];
      for (var item in bar) {
        if (bar.hasOwnProperty(item)) {
          if (Math.random() > .8)
            bar[item] = 0;
          else
            bar[item] = 20 + 40 * Math.random();
        }
      }
    }
  }
  updateGraph(sampleData);
};

/**
 * Updates graph based on new data
 * @param {object} barData - new graph data
 */
var updateGraph = function(barData) {
  // Process new data
  newItems = {};
  removedItems = {};

  // Keep track of total number of data points for each bar
  var totals = [];

  // Loop through each bar in barData object

  barData.forEach(function(bar, barIndex) {
    totals[barIndex] = 0;

    // Loop through each item in bar
    for (var item in bar) {
      totals[barIndex] += bar[item];

      // Process item the first time we see it
      if(!newItems[item]) {
        // Map item to its class name (to be used by associated DOM elements)
        newItems[item] = item.replace(/\s|'|\(|\)|:/g, "");

        // Check to see if item was in old graph
        // Assign color and create new legend section if not
        if (!currentItems[item]) {
          var color;
          if (item == "Other")
            color = "#757575" // Grey
          else {
            color = colorList[colorCount];
            colorCount = (colorCount + 1)%colorList.length;
          }

          // Save color for this item in map
          colorMap[item] = color;

          // Create and add section to legend
          var $section = createLegendSection(item, newItems[item]);
          var legend = $('#legend').append($section);
        }
      }
    }
  });

  // Create/update/remove graph sections
  // Needed totals to properly size sections
  var graph = $('#graph');
  barData.forEach(function(bar, barIndex) {
    var barElement = $('#graph').find('#bar-' + barIndex);

    // Update/add bar sections
    for (var item in bar) {
      var percent = bar[item] / totals[barIndex];

      // Update section if it already exists
      if (barElement.find('.' + newItems[item]).length)
        barElement.find('.' + newItems[item]).height((percent * 100) + '%');
      // Create new section otherwise
      else
        barElement.prepend(createItemSection(item, newItems[item], percent));
    }
  });

  // Remove bar and legend sections for
  // items that are no longer present (following a graph update)
  for (var item in currentItems) {
    if (!newItems.hasOwnProperty(item)) {
      $('.graph-bar .' + currentItems[removedItem]).height(0);
      $('#legend .' + currentItems[removedItem]).remove();
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
 * @returns {jQueryObject} graph bar section
 */
var createItemSection = function(itemName, className, percent) {
  // Create outer element
  var $outer = $('<div>', {class: "graph-bar-section " + className});
  $outer.height((percent * 100) + '%');

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
  return $outer;
};


/**
 * Creates new legend section for an item
 *
 * @param {string} itemName - full name of item
 * @param {string} className - class name for DOM element
 * @returns {jQueryObject} legend section
 */
var createLegendSection = function(itemName, className) {
  // Create section element
  var $section = $('<div>', {class: "legend-section " + className});

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
  return $section;
};

/**
 * Returns text color for given background color
 *
 * @param {string} color - background color
 * @returns {string} text color
 */
var getTextColor = function(color){
  return (parseInt(color.replace('#',''), 16) > 0xffffff/2) ? 'black':'white';
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
    randomizeData();

  });
  $.get('/data', function(data) {
    updateGraph(data.matchItemData);
  });
});
