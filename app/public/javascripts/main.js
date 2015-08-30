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
// Holds the bar data from previous graph
var oldBarData = [];
// Holds the bar data totals from previous graph
var oldBarDataTotals = [0, 0, 0, 0, 0, 0];
// Keeps track of locked item
var lockedItem;

var app = {
  state: {
    champion: null,
    lockedBars: [null, null, null, null, null, null]
  }
};

// Keeps track of item types to show
var categoryMap = {'AP' : true,
                   'AD' : false,
                   'Tank' : false,
                   'Miscellaneous' : false};
// Timer for tooltip delays
var tooltipTimer;
// Tracking variable for tooltip delay
var hover = false;

var ADD = 1;
var UPDATE = 2;
var REMOVE = 3;


var resetGraph = function() {
  $('.graph-bar').children().remove();
  $('#legend').find('.legend-section').remove();
  legendItems = [];
//  app.state.lockedBars = [null, null, null, null, null, null];
}

// var updateGraph = function() {
//   var barElements = $('#graph').find('[id^="bar-"]');
//   barElements.empty();
//   toggleGraph();
// };

/**
 * Updates graph based on new data
 * @param {object} data - new graph data
 */
var updateGraph = function() {
  var newBarData = (patch == '5.11' ? data[0] : data[1]);
  var barSectionMapList = [{}, {}, {}, {}, {}, {}];
  var barDataTotals = [0, 0, 0, 0, 0, 0];
  var legendSectionList = [];

  // 1. Loop through all items
  // 2. Skip ignored items
  // 3. Track what to do with each item in each bar
  // 4. Gather new bar data totals
  Object.keys(itemMap).forEach(function(item, itemIndex) {
    // If no champion, skip any non-AP items
    if (!app.state.champion && itemMap[item] != 'AP')
      return;

    newBarData.forEach(function(newBar, newBarIndex) {
      if (newBar.hasOwnProperty(item) && newBar[item]) {
        barSectionMapList[newBarIndex][item] = 1;
        barDataTotals[newBarIndex] += newBar[item];
      }
    });

    oldBarData.forEach(function(oldBar, oldBarIndex) {
      if (oldBar.hasOwnProperty(item) && oldBar[item] / oldBarDataTotals[oldBarIndex] > .03 ) {
        barSectionMapList[oldBarIndex][item] = barSectionMapList[oldBarIndex][item] ? 2 : 3;
      }
    });
  });

  // Create, update, and remove graph sections
  var graph = $('#graph');
  barSectionMapList.forEach(function(barSectionMap, barIndex) {
    var barData = newBarData[barIndex];
    var barElement = graph.find('#bar-' + barIndex);

    var itemKeys = Object.keys(barSectionMap);
    itemKeys.sort(function(a, b) {
      return barData[a] < barData[b] ? 1 : (barData[a] > barData[b] ? -1 : 0);
    });

    var otherPercent = 0;
    itemKeys.forEach(function(item, itemIndex) {
      var itemAction = barSectionMap[item];
      var itemPercent;
      switch (itemAction) {
        case ADD:
          itemPercent = barData[item] / barDataTotals[barIndex];
          if (itemPercent > .03) {
            addItemSection(barElement, item, itemPercent);
            if (legendSectionList.indexOf(item) == -1)
              legendSectionList.push(item);
          }
          else
            otherPercent += itemPercent;
          break;
        case UPDATE:
          itemPercent = barData[item] / barDataTotals[barIndex];
          if (itemPercent > .03) {
            var element = updateItemSection(barElement, item, itemPercent);
            if (app.state.lockedBars[barIndex] && app.state.lockedBars[barIndex] == item)
              element.find('.graph-bar-section-inner').addClass('permanent');
            if (legendSectionList.indexOf(item) == -1)
              legendSectionList.push(item);
          }
          else {
            otherPercent += itemPercent;
            removeItemSection(barElement, item);
          }
          break;
        case REMOVE:
          removeItemSection(barElement, item);
          break;
        default:
          break;
      }
    });
    updateOtherSection(barElement, otherPercent);
  });

  $('#legend').find('.legend-section').remove();
  legendSectionList.push('Other');
  legendSectionList.sort(function(a, b) {
    if (a == 'Other') return -1;
    if (b == 'Other') return 1;
    else {
      return a < b ? -1 : (a > b ? 1 : 0);
    }
  });
  legendSectionList.forEach(function(legendSection, index) {
    addLegendSection(legendSection);
  });

  oldBarData = newBarData;
  oldBarDataTotals = barDataTotals;
};


/**
 * Creates new graph bar section for an item
 *
 * @param {jQueryObject} barElement - bar element to add new section to
 * @param {string} itemName - full name of item
 * @param {number} percent - percent of bar height new section should take
 * @returns {jQueryObject} graph bar section
 */
var addItemSection = function(barElement, itemName, percent) {
  var className = classNameMap[itemName];
  var color = colorMap[itemMap[itemName]];

  // Create outer element
  var $outer = $('<div>', {class: "graph-bar-section " + className});
  $outer.height(0);

  // Create inner element
  var $inner = $('<div>', {class: "graph-bar-section-inner"});
  $inner.css('background-color', color);
  $inner.css('border-color', color);


  var $innerShadow = $('<div>', {class: "graph-bar-section-inner-shadow"});
  $inner.append($innerShadow);

  if (lockedItem == itemName) {
    $inner.addClass('locked');
    $innerShadow.addClass('locked');
  }

  // Add event handlers
  $inner.hover(
    function() {
      hover = true;
      focusItem(className, color);
      createTooltip($(this), itemName, percent);
    },
    function() {
      hover = false;
      unfocusItem(className);
      removeTooltip($(this));
    }
  );
  $inner.click(function() {
    lockItem($(this), itemName, color);
  });

  $outer.append($inner);
  barElement.find('.Other').after($outer);

  // flush the style so it animates properly
  window.getComputedStyle($outer[0]).height;
  $outer.height((percent * 100) + '%');
  return $outer;
};

/**
 * Updates graph bar section for an item
 *
 * @param {jQueryObject} barElement - bar element to update section for
 * @param {string} itemName - full name of item
 * @param {number} percent - percent of bar height new section should take
 * @returns {jQueryObject} graph bar section
 */
var updateItemSection = function(barElement, itemName, percent) {
  var className = classNameMap[itemName];
  var color = colorMap[itemMap[itemName]];

  var $element = barElement.find('.' + className);
  $element.height((percent * 100) + '%');
  $element.find('.graph-bar-section-inner').hover(
    function() {
      hover = true;
      focusItem(className, color);
      createTooltip($(this), itemName, percent);
    },
    function() {
      hover = false;
      unfocusItem(className);
      removeTooltip($(this));
    }
  );

  return $element;
};

/**
 * Removes graph bar section for an item
 *
 * @param {jQueryObject} barElement - bar element to update section for
 * @param {string} itemName - full name of item
 * @returns {jQueryObject} graph bar section
 */
var removeItemSection = function(barElement, itemName) {
  var className = classNameMap[itemName];

  var $element = barElement.find('.' + className);
  $element.one('webkitTransitionEnd otransitionend msTransitionEnd transitionend',
     function() {
       $(this).remove();
     });
  $element.css({'height': 0, 'opacity': .5});

};


/**
 * Updates other bar section
 *
 * @param {jQueryObject} barElement - bar element to update section for
 * @param {number} percent - percent of bar height new section should take
 * @returns {jQueryObject} graph bar section
 */
var updateOtherSection = function(barElement, percent) {
  var $element = barElement.find('.Other');
  var color = colorMap[itemMap['Other']];
  if (percent) {
    $element.css({'height': (percent * 100) + '%', 'opacity': 1});
    $element.find('.graph-bar-section-inner').hover(
      function() {
        hover = true;
        focusItem('Other', color);
        createTooltip($(this), 'Other', percent);
      },
      function() {
        hover = false;
        unfocusItem('Other');
        removeTooltip($(this));
      }
    ).click(function() {
      lockItem($(this), 'Other', color);
    });
  }
  else {
    $element.css({'height': 0, 'opacity': 0});
    $element.off('hover');
  }

  return $element;
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

  var color = colorMap[itemMap[itemName]];
  // Add event handlers
  $section.hover(
    function() {focusItem(className, color)},
    function() {unfocusItem(className, color)}
  );
  $section.click(function() {
    lockItem($(this).find('.legend-section-text'), itemName, color);
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

  if (lockedItem == itemName) {
    $text.addClass('locked');
    $text.css({'border-color': color});
  }

  $section.append($image).append($text);
  $('#legend').append($section);

  // Fade in new sections
  window.getComputedStyle($section[0]).opacity;
  $section.css({'opacity': 1});
  return $section;
};

/**
 * Sets the focus on bar and legend sections with the given class name
 *
 * @param {string} className - class name to focus
 * @param {string} color - color of focused items
 */
var focusItem = function(className, color) {
  $('#graph .' + className + ' .graph-bar-section-inner').addClass('focused');
  $('#graph .' + className + ' .graph-bar-section-inner-shadow').addClass('focused');

  var legendSectionText = $('.legend-section-text.' + className);
  legendSectionText.addClass('focused').css({'background-color': color, 'color': getTextColor(color)});

  if (!legendSectionText.hasClass('locked'))
    legendSectionText.css({'border-color': color});
};

/**
 * Unsets the focus on bar and legend sections with the given class name
 *
 * @param {string} className - class name to unfocus
 */
var unfocusItem = function(className) {
  $('#graph .' + className + ' .focused').removeClass('focused');

  var legendSectionText = $('.legend-section-text.' + className);
  legendSectionText.removeClass('focused').css({'background-color': 'none', 'color': getTextColor('#ffffff')});

  if (!legendSectionText.hasClass('locked'))
    legendSectionText.css({'border-color': '#ffffff'});
};

/**
 * Toggles the lock on bar and legend sections with the given class name
 *
 * @param {jQueryObject} elem - element triggering the lock
 * @param {string} itemName - item to lock
 * @param {string} color - color of locked items
 */
var lockItem = function(elem, itemName, color) {
  var className = classNameMap[itemName];
  var locked = elem.hasClass('locked');

  $('#graph .locked').removeClass('locked');
  $('#legend .locked').each(function() {
    if (!$(this).hasClass('focused'))
      $(this).css({'border-color': '#ffffff'});
  });
  $('#legend .locked').removeClass('locked');
  lockedItem = null;


  if (!locked) {
    $('#graph .' + className + ' .graph-bar-section-inner').addClass('locked');
    $('#graph .' + className + ' .graph-bar-section-inner-shadow').addClass('locked');
    $('#legend .' + className).addClass('locked');
    $('#legend .' + className).css({'border-color': color});
    lockedItem = itemName;
  }
};

/**
 * Toggles locking a single item into a bar slot
 *
 * @param {number} index - bar index to lock
 * @param {string} itemName - name of item to lock into slot
 */
var lockBar = function(index, itemName, $tooltipLock) {
  $('#bar-' + index).find('.permanent').removeClass('permanent');
  app.state.lockedBars[index] = app.state.lockedBars[index] == itemName ? null : itemName;

  if (app.state.lockedBars[index])
    $tooltipLock.removeClass('fa-lock').addClass('fa-unlock-alt');
  else
    $tooltipLock.removeClass('fa-unlock-alt').addClass('fa-lock');

  app.getNewData();
};

// /**
//  * Toggles visibility for a given item category
//  *
//  * @param {jQueryObject} elem - element triggering the toggle
//  * @param {string} category - item category
//  */
// var toggleCategory = function(elem, category) {
//   elem.toggleClass('visible');
//
//   categoryMap[category] = !categoryMap[category];
//   updateGraph();
// };

/**
 * Creates tooltip on given element
 *
 * @param {jQueryObject} elem - element
 * @param {string} itemName - full name of item
 * @param {number} percent - percent of bar height item accounts for
 */
var createTooltip = function(elem, itemName, percent) {
  var $tooltip = $('<div>', {class: "tooltip"});

  var $tooltipImage = $('<div>', {class: "tooltip-image"});
  $tooltipImage.css({'background-image' : "url('images/items/" + classNameMap[itemName] + ".png')"});

  var $tooltipText = $('<div>', {class: "tooltip-text"});
  $tooltipText.html((percent * 100).toFixed(1) + "%");

  var $tooltipLock = $('<div>',
    {class: "tooltip-lock fa " + (elem.hasClass('permanent') ? "fa-unlock-alt" : "fa-lock")});

  var index = elem.parents('.graph-bar').attr('id').slice(-1);
  $tooltip.click(function(event) { event.stopPropagation(); lockBar(index, itemName, $tooltipLock);});

  $tooltip.append($tooltipImage);
  $tooltip.append($tooltipText);
  $tooltip.append($tooltipLock);

  if (tooltipTimer) {
    clearTimeout(tooltipTimer);
    tooltipTimer = null
  }
  tooltipTimer = setTimeout(function() {
    if (hover) {
      $tooltip.hide();
      elem.append($tooltip);
      $tooltip.slideDown(200);
    }
  }, 500);
};

/**
 * Removes tooltip on given element
 *
 * @param {jQueryObject} elem - element
 */
var removeTooltip = function(elem) {
  elem.find('.tooltip').slideUp(100, function() {$(this).remove();});
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

app.getNewData = function(){
  var params = {};

  params.lockedBars = app.state.lockedBars.map(function(item, index){
    if (item) {
      return {
        slot: index,
        item: item
      }
    }
  }).filter(Boolean);

  var ajaxPromise;
  if (params.lockedBars.length === 0) {
    ajaxPromise = $.get('/data');
  } else {
    ajaxPromise = $.get('/singleItemData', params);
  }

  ajaxPromise.done(function(itemData){
    data[0] = itemData.itemData511;
    data[1] = itemData.itemData514;
    updateGraph();
  });
}

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

    updateGraph();
  });

  // $('#ap-selector-section').click(function() {toggleCategory($(this), 'AP')});
  // $('#ad-selector-section').click(function() {toggleCategory($(this), 'AD')});
  // $('#tank-selector-section').click(function() {toggleCategory($(this), 'Tank')});
  // $('#misc-selector-section').click(function() {toggleCategory($(this), 'Miscellaneous')});

  // Populate dropdown options
  championList.forEach(function(champion, index) {
    $option = $('<option>', {value: champion}).html(champion);
    $('#champion-select').append($option);
  });

  $('#champion-select').selectize({placeholder: 'Choose a champion...'});

  $.get('/data', function(matchData) {
    data[0] = matchData.itemData511;
    data[1] = matchData.itemData514;
    updateGraph();
  });
});
