var sampleData = {
  1: {"Rylai's Crystal Sceptre" : 0, "Athene's Unholy Grail" : 0, "Liandry's Torment" : 0, "Other" : 0},
  2: {"Rylai's Crystal Sceptre" : 0, "Athene's Unholy Grail" : 0, "Liandry's Torment" : 0, "Rabadon's Deathcap" : 0, "Other" : 0},
  3: {"Athene's Unholy Grail" : 0, "Liandry's Torment" : 0, "Rabadon's Deathcap" : 0, "Void Staff" : 0, "Other" : 0},
  4: {"Liandry's Torment" : 0, "Rabadon's Deathcap" : 0, "Void Staff" : 0, "Other" : 0},
  5: {"Rabadon's Deathcap" : 0, "Void Staff" : 0, "Luden's Echo" : 0, "Other" : 0},
  6: {"Rabadon's Deathcap" : 0, "Void Staff" : 0, "Luden's Echo" : 0, "Zhonya's Hourglass" : 0, "Other" : 0},
}

// Available colors
// Pulled from https://www.google.com/design/spec/style/color.html#color-color-palette
var colorList = [
  "#3F51B5", // Indigo
  "#2196F3", // Blue
  // "#03A9F4", // Light Blue - too similar to Blue
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
// Keeps track of current items and corresponding classnames
var currentItems = {};
// Keeps track of new items (following update) to compare against old ('current') items
var newItems = {};
// Keeps track of removed items (following update)
var removedItems = [];
// Keeps track of items that are being filtered out
var filteredItems = {};

// TODO replace with an updateData function that takes new data from database
// and formats it before handing off to graph.
var randomizeData = function() {
  for (var barIndex in sampleData) {
    if (sampleData.hasOwnProperty(barIndex)) {
      var bar = sampleData[barIndex];
      for (var item in bar) {
        if (bar.hasOwnProperty(item)) {
          bar[item] = 20 + 40 * Math.random();
        }
      }
    }
  }
  updateGraph(sampleData);
};

// TODO need to rework this function
// handle 3 cases: inserted sections, updated sections, deleted sections
var updateGraph = function(barData) {
  // Process new data
  newItems = {};
  removedItems = {};
  var totals = [];
  for (var barIndex in barData) {
    var bar = barData[barIndex];
    totals[barIndex] = 0;
    for (var item in bar) {
      // Process item the first time we see it
      if(!newItems[item]) {
        newItems[item] = item.replace(/\s|'/g, "");

        // Add to color map and legend if it's new
        if (!currentItems[item]) {
          // Add item to color map
          var color;
          if (item == "Other")
            color = "#757575" // Grey
          else {
            color = colorList[colorCount];
            colorCount = (colorCount + 1)%colorList.length;
          }
          colorMap[item] = color;

          // Create legend section for it
          var $section = createLegendSection(item, newItems[item]);
          var legend = $('#legend').append($section);

        }

      }
      totals[barIndex] += bar[item];
    }
  }

  for (var item in currentItems) {
    if (!newItems.hasOwnProperty(item)) {
      removedItems.push(item);
    }
  }


  var graph = $('#graph');
  var barElem;
  var percent;
  for (var barIndex in barData) {
    var bar = barData[barIndex];
    barElem = $('#graph').find('#bar-' + barIndex);

    // Update/add bar sections
    for (var item in bar) {
      percent = bar[item] / totals[barIndex];
      if (barElem.find('.' + newItems[item]).length)
        barElem.find('.' + newItems[item]).height((percent * 100) + '%');
      else
        barElem.prepend(createItemSection(item, newItems[item], percent));
    }
  }

  // Remove bar sections and legend sections
  for (var removedItem in removedItems) {
    $('.graph-bar .' + currentItems[removedItem]).height(0);
    $('#legend .' + currentItems[removedItem]).remove();
  }

  currentItems = newItems;
};

var createItemSection = function(itemName, className, percent) {
  var $outer = $('<div>', {class: "graph-bar-section " + className});
  $outer.height((percent * 100) + '%');

  var $inner = $('<div>', {class: "graph-bar-section-inner"});
  $inner.css('background-color', colorMap[itemName]);
  $inner.hover(function() {
    $('#graph .' + className + ' .graph-bar-section-inner').toggleClass('active');
    $('.legend-section.' + className).css({'background-color': colorMap[itemName], 'color': getContrastColor(colorMap[itemName])});
  }, function() {
    $('#graph .' + className + ' .graph-bar-section-inner').toggleClass('active');
    $('.legend-section.' + className).css({'background-color': 'none', 'color': getContrastColor('#FFFFFF')});
  });

  $outer.append($inner);
  return $outer;
};

var createLegendSection = function(itemName, className) {
  var $section = $('<div>', {class: "legend-section " + className});
  $section.hover(function() {
    $('#graph .' + className + ' .graph-bar-section-inner').toggleClass('active');
    $(this).css({'background-color': colorMap[itemName], 'color': getContrastColor(colorMap[itemName])});
  }, function() {
    $('#graph .' + className + ' .graph-bar-section-inner').toggleClass('active');
    $(this).css({'background-color': 'none', 'color': getContrastColor('#FFFFFF')});

  });

  var $swatch = $('<div>', {class: "legend-section-swatch"});
  $swatch.css('background-color', colorMap[itemName]);

  var $image = $('<div>', {class: "legend-section-image"});
  $image.css('background-image', "url('images/items/" + className + ".png')");
  var $text = $('<div>', {class: "legend-section-text"});
  $text.html(itemName);

  $section.append($swatch).append($image).append($text);

  return $section;
};

var getContrastColor = function(color){
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
    randomizeData();
  });

  randomizeData();
});
