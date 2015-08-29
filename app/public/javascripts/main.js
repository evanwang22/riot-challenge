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

var resetGraph = function() {
  $('.graph-bar').children().remove();
  $('#legend').find('.legend-section').remove();
  legendItems = [];
  lockedBars = [null, null, null, null, null, null];
}

var updateGraph = function() {
  var barElements = $('#graph').find('[id^="bar-"]');
  barElements.empty();
  toggleGraph();
};

/**
 * Toggles graph based on new data
 * @param {object} data - new graph data
 */
var toggleGraph = function() {
  var barData = (patch == '5.11' ? data[0] : data[1]);

  // Reset new items map
  newItems = [];

  // Keep track of total number of data points for each bar
  var totals = [0, 0, 0, 0, 0, 0];

  barData.forEach(function(bar, barIndex) {
    for (var item in bar) {
      // Skip if item category hidden
      // TODO category removal
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
      // if (categoryOrder.indexOf(itemCategoryMap[a]) < categoryOrder.indexOf(itemCategoryMap[b]))
      //   return -1;
      // else if (categoryOrder.indexOf(itemCategoryMap[a]) > categoryOrder.indexOf(itemCategoryMap[b]))
      //   return 1;
      // else
      if (bar[a] < bar[b]) {
        return 1
      } else if (bar[a] > bar[b]) {
        return -1
      } else {
        return 0
      }
    });

    var barElement = $('#graph').find('#bar-' + barIndex);
    var otherPercent = 0;
    // Update/add bar sections
    for (var i = 0; i < keys.length; i++) {
      var item = keys[i];

      var percent = bar[item] / totals[barIndex];

      // Set percent to 0 here to properly hide sections
      // TODO category removal
      if (!categoryMap[itemCategoryMap[item]])
        percent = 0;

      // If less than 3%, group with Other
      if (percent < .03) {
        otherPercent += percent;
        percent = 0;
      }

      // Update section if it already exists
      $barSectionElement = barElement.find('.' + classNameMap[item]);
      if (!$barSectionElement.length && percent)
        $barSectionElement = addItemSection(item, percent, barElement);
      else
        updateItemSection(item, percent, $barSectionElement);

      $barSectionElement.find('.graph-bar-section-inner').css({'border-color': percent ? colorMap[itemCategoryMap[item]] : '#ffffff',
                                                                 'background-color': percent ? colorMap[itemCategoryMap[item]] : '#ffffff'});

      if (percent > 0) {
        // Check for locked bar item
        if (app.state.lockedBars[barIndex] && app.state.lockedBars[barIndex] == item)
          $barSectionElement.find('.graph-bar-section-inner').addClass('permanent');

        if (newItems.indexOf(item) == -1)
          newItems.push(item);
      }
    }

    $otherSectionElement = barElement.find('.Other');
    if ($otherSectionElement.length) {
      $otherSectionElement.parent().prepend($otherSectionElement[0]);
      updateItemSection("Other", otherPercent, $otherSectionElement);
      $otherSectionElement.find('.graph-bar-section-inner').css({'border-color': otherPercent ? colorMap[itemCategoryMap['Other']] : '#ffffff',
                                                                 'background-color': otherPercent ? colorMap[itemCategoryMap['Other']] : '#ffffff'});
    }

    // Otherwise, create new bar and legend sections
    else if (otherPercent) {
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
  var color = colorMap[itemCategoryMap[itemName]];

  // Create outer element
  var $outer = $('<div>', {class: "graph-bar-section " + className});
  $outer.height(0);

  // Create inner element
  var $inner = $('<div>', {class: "graph-bar-section-inner"});
  $inner.css('background-color', color);
  $inner.css('border-color', color);

  var $innerShadow = $('<div>', {class: "graph-bar-section-inner-shadow"});
  $inner.append($innerShadow);

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
 * Updates graph bar section for an item
 *
 * @param {string} itemName - full name of item
 * @param {number} percent - percent of bar height new section should take
 * @param {jQueryObject} element - element to update
 * @returns {jQueryObject} graph bar section
 */
var updateItemSection = function(itemName, percent, elem) {

  if (!elem.height() && !percent)
    return;
  var className = classNameMap[itemName];
  var color = colorMap[itemCategoryMap[itemName]];

  elem.height((percent * 100) + '%');

  elem.find('.graph-bar-section-inner').hover(
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
 * @param {string} className - class name to lock
 * @param {string} color - color of locked items
 */
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
    $('#graph .' + className + ' .graph-bar-section-inner-shadow').addClass('locked');
    $('#legend .' + className).addClass('locked');
    $('#legend .' + className).css({'border-color': color});
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

  $.get('/singleItemData', params)
    .done(function(singleItemData){
      data[0] = singleItemData.singleItemData511;
      data[1] = singleItemData.singleItemData514;
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

    toggleGraph();
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
    data[0] = matchData.matchItemData511;
    data[1] = matchData.matchItemData514;
    updateGraph();
  });
});
