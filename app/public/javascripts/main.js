var barData = {
  1: {'Item 1' : 0, 'Item 2' : 0, 'Item 3' : 0, 'Other' : 0},
  2: {'Item 1' : 0, 'Item 2' : 0, 'Item 3' : 0, 'Item 4' : 0, 'Other' : 0},
  3: {'Item 2' : 0, 'Item 3' : 0, 'Item 4' : 0, 'Item 5' : 0, 'Other' : 0},
  4: {'Item 3' : 0, 'Item 4' : 0, 'Item 5' : 0, 'Other' : 0},
  5: {'Item 4' : 0, 'Item 5' : 0, 'Item 6' : 0, 'Other' : 0},
  6: {'Item 4' : 0, 'Item 5' : 0, 'Item 6' : 0, 'Item 7' : 0, 'Other' : 0},
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


// TODO replace with an updateData function that takes new data from database
// and formats it before handing off to graph.
var randomizeData = function() {
  for (var barIndex in barData) {
    if (barData.hasOwnProperty(barIndex)) {
      var bar = barData[barIndex];
      for (var item in bar) {
        if (bar.hasOwnProperty(item)) {
          bar[item] = 20 + 40 * Math.random();
        }
      }
    }
  }
  updateGraph();
};

// TODO need to rework this function
// handle 3 cases: inserted sections, updated sections, deleted sections
var updateGraph = function() {
  // Get totals for each position
  var totals = [];
  for (var barIndex in barData) {
    if (barData.hasOwnProperty(barIndex)) {
      var bar = barData[barIndex];
      totals[barIndex] = 0;
      for (var item in bar) {
        if (bar.hasOwnProperty(item)) {
          totals[barIndex] += bar[item];
        }
      }
    }
  }


  var graph = $('#graph');
  var barElem;
  var percent;
  for (var barIndex in barData) {
    if (barData.hasOwnProperty(barIndex)) {
      var bar = barData[barIndex];
      barElem = $('#graph').find('#bar-' + barIndex);
      for (var item in bar) {
        if (bar.hasOwnProperty(item)) {
          percent = bar[item] / totals[barIndex];
          className = item.replace(" ", "-")
          if (barElem.find('.' + className).length)
            barElem.find('.' + className).height((percent * 100) + '%');
          else
            barElem.prepend(createItemSection(className, percent));
        }
      }
    }
  }
};

var createItemSection = function(className, percent) {
  var $outer = $('<div>', {class: "graph-bar-section " + className});
  var $inner = $('<div>', {class: "graph-bar-section-inner"});
  var color;
  if (colorMap[className])
    color = colorMap[className];
  else {
    if (className == "Other")
      color = "#757575" // Grey
    else {
      color = colorList[colorCount];
      colorCount++;
    }
    colorMap[className] = color;
  }

  $outer.height((percent * 100) + '%');
  $outer.append($inner);
  $inner.css('background-color', color);
  return $outer;
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
