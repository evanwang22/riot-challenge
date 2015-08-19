var barData = {
  1: {'Item 1' : 0, 'Item 2' : 0, 'Item 3' : 0, 'Other' : 0},
  2: {'Item 1' : 0, 'Item 2' : 0, 'Item 3' : 0, 'Item 4' : 0, 'Other' : 0},
  3: {'Item 2' : 0, 'Item 3' : 0, 'Item 4' : 0, 'Item 5' : 0, 'Other' : 0},
  4: {'Item 3' : 0, 'Item 4' : 0, 'Item 5' : 0, 'Other' : 0},
  5: {'Item 4' : 0, 'Item 5' : 0, 'Item 6' : 0, 'Other' : 0},
  6: {'Item 4' : 0, 'Item 5' : 0, 'Item 6' : 0, 'Item 7' : 0, 'Other' : 0},
}

// Available colors
var colorList = [];
// Number of colors in use
var colorCount = 0;
// Keeps track of item colors
var colorMap = {};

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

var updateGraph = function() {
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
            barElem.prepend(itemSectionHtml(className, percent));
        }
      }
    }
  }

  var height = $('#graph-y-axis').height();
  $('#graph-y-axis .axis-title').width(height);
  $('#graph-y-axis .axis-title').css('top', height);
};

var itemSectionHtml = function(item, percent) {
  var $outer = $('<div>', {class: "graph-bar-section " + item});
  var $inner = $('<div>', {class: "graph-bar-section-inner"});
  var color;
  if (colorMap[item])
    color = colorMap[item];
  else {
    color = Math.floor(Math.random()*16777215).toString(16);
    while (color.length < 6) {
      color = "0" + color;
    }
    color = '#' + color;
    colorMap[item] = color;
  }

  $outer.height((percent * 100) + '%');
  $outer.append($inner);
  $inner.css('background-color', color);
  return $outer;
};

$(window).load(function() {
  randomizeData();
});
