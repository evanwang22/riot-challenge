// Number of colors in use
var colorCount = 0;
// Keeps track of item colors
//var colorMap = {"Other" : "#757575"};
// Keeps track of current items shown in the legend
var legendItems = [];

// Keeps track of locked item
var lockedItem;

var app = {
  state: {
    patch: '5.14',
    data: [],
    winRate: [],
    dataTotals: [0, 0, 0, 0, 0, 0],
    barSectionMaps: [{}, {}, {}, {}, {}, {}],
    champion: null,
    lockedBars: [null, null, null, null, null, null],
    legendSections: []
  },
  prevState: {
    patch: '5.14',
    data: [[], []],
    dataTotals: [0, 0, 0, 0, 0, 0],
    barSectionMaps: [{}, {}, {}, {}, {}, {}],
    champion: null,
    lockedBars: [null, null, null, null, null, null],
    legendSections: []
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

/**
 * Updates graph based on new data
 * @param {object} data - new graph data
 */
var updateGraph = function() {
  var newBarData = (app.state.patch == '5.11' ? app.state.data[0] : app.state.data[1]);
  var oldBarData = (app.prevState.patch == '5.11' ? app.prevState.data[0] : app.prevState.data[1]);

  app.state.dataTotals = [0, 0, 0, 0, 0, 0];
  app.state.barSectionMaps = [{}, {}, {}, {}, {}, {}];
  app.state.legendSections = [];

  // 1. Loop through all items
  // 2. Skip ignored items
  // 3. Track what to do with each item in each bar
  // 4. Gather new bar data totals
  Object.keys(itemMap).forEach(function(item, itemIndex) {

    // If no champion, skip any non-AP items
    if (app.state.champion || itemMap[item] == 'AP') {
      newBarData.forEach(function(newBar, newBarIndex) {
        if (newBar[item]) {
          app.state.barSectionMaps[newBarIndex][item] = 1;
          app.state.dataTotals[newBarIndex] += newBar[item];
        }
      });
    }

    if (app.prevState.champion || itemMap[item] == 'AP') {
      oldBarData.forEach(function(oldBar, oldBarIndex) {
        if (oldBar.hasOwnProperty(item) && oldBar[item] / app.prevState.dataTotals[oldBarIndex] > .03 ) {
          app.state.barSectionMaps[oldBarIndex][item] = app.state.barSectionMaps[oldBarIndex][item] ? 2 : 3;
        }
      });
    }
  });

  // Create, update, and remove graph sections
  var graph = $('#graph');
  app.state.barSectionMaps.forEach(function(barSectionMap, barIndex) {
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
          itemPercent = barData[item] / app.state.dataTotals[barIndex];
          if (itemPercent > .03) {
            addItemSection(barElement, item, itemPercent);
            if (app.state.legendSections.indexOf(item) == -1)
              app.state.legendSections.push(item);
          }
          else
            otherPercent += itemPercent;
          break;
        case UPDATE:
          itemPercent = barData[item] / app.state.dataTotals[barIndex];
          if (itemPercent > .03) {
            var element = updateItemSection(barElement, item, itemPercent);
            if (app.state.lockedBars[barIndex] && app.state.lockedBars[barIndex] == item)
              element.find('.graph-bar-section-inner').addClass('permanent');
            if (app.state.legendSections.indexOf(item) == -1)
              app.state.legendSections.push(item);
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
  app.state.legendSections.push('Other');
  app.state.legendSections.sort(function(a, b) {
    if (a == 'Other') return -1;
    if (b == 'Other') return 1;
    else {
      return a < b ? -1 : (a > b ? 1 : 0);
    }
  });
  app.state.legendSections.forEach(function(legendSection, index) {
    addLegendSection(legendSection);
  });

  updateAnalysis();

  app.prevState = JSON.parse(JSON.stringify(app.state));
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
  var color;
  if (itemMap[itemName] === 'AP'){
    color = apItemColorMap[itemName];
  } else {
    color = colorMap[itemMap[itemName]];
  }

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

  var color;
  if (itemMap[itemName] === 'AP'){
    color = apItemColorMap[itemName];
  } else {
    color = colorMap[itemMap[itemName]];
  }

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

  var color;
  if (itemMap[itemName] === 'AP'){
    color = apItemColorMap[itemName];
  } else {
    color = colorMap[itemMap[itemName]];
  }

  // Add event handlers
  $section.hover(
    function() {focusItem(className, color)},
    function() {unfocusItem(className, color)}
  );
  $section.click(function() {
    lockItem($(this).find('.legend-section-text'), itemName, color);
  });

  // Create swatch element
  var $swatch = $('<div>', {class: "legend-section-swatch"});
  $swatch.css('background-color', color);

  // Create image element
  var $image = $('<div>', {class: "legend-section-image"});
  $image.css('background-image', "url('images/items/" + className + ".png')");

  // Create text element
  var $text = $('<div>', {class: "legend-section-text " + className});
  if (itemName == 'Other')
    $text.html('Other (< 3% Popularity)');
  else
    $text.html(itemName);

  if (lockedItem == itemName) {
    $text.addClass('locked');
    $text.css({'border-color': color});
  }

  $section.append($swatch).append($image).append($text);
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
  if (itemName == 'Other')
    return;

  $('#bar-' + index).find('.permanent').removeClass('permanent');
  app.state.lockedBars[index] = app.state.lockedBars[index] == itemName ? null : itemName;

  if (app.state.lockedBars[index])
    $tooltipLock.removeClass('fa-lock').addClass('fa-unlock-alt');
  else
    $tooltipLock.removeClass('fa-unlock-alt').addClass('fa-lock');

  app.getNewData();
};

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

  var tooltipIcon = elem.hasClass('permanent') ? "fa-unlock-alt" : "fa-lock";
  if (itemName == 'Other')
    tooltipIcon = 'fa-ban';
  var $tooltipLock = $('<div>', {class: "tooltip-lock fa " + tooltipIcon});

  var index = elem.parents('.graph-bar').attr('id').slice(-1);
  $tooltip.click(function(event) { event.stopPropagation(); lockBar(index, itemName, $tooltipLock);});

  $tooltip.append($tooltipImage);
  $tooltip.append($tooltipText);
  $tooltip.append($tooltipLock);

  if (tooltipTimer) {
    clearTimeout(tooltipTimer);
    tooltipTimer = null;
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

/**
 * Initializes selectize which calls updateGraph on change
 *
 * @param {string} selector - selector for element to initialize selectize with
 */
var initChampionSelectize = function(selector) {
  $select = $(selector).selectize({
    placeholder: 'Choose a champion...',
    plugins: {
      'remove_button': { label: 'Remove champion' }
    }
  });
  var selectize = $select[0].selectize;

  selectize.on('change', function(value){
    app.state.champion = value;
    app.state.lockedBars = [null, null, null, null, null, null];
    app.getNewData();
  });
};

var updateAnalysis = function(){
  updateWinRate();

  for (var i = 0; i < 6; i++) {
    var listOfAllItems = _.union(_.keys(app.state.data[0][i]), _.keys(app.state.data[1][i]));

    if (!app.state.champion) {
      listOfAllItems = listOfAllItems.filter(function(item){
        return itemMap[item] === 'AP';
      });
    }

    var totals = app.state.data.map(function(patch){
      var total = 0;
      listOfAllItems.forEach(function(item){
        total += patch[i][item] || 0;
      });

      return total;
    });

    var allItemDiffs = listOfAllItems.map(function(item){
      var count511 = app.state.data[0][i][item] || 0;
      var percent511 = count511/totals[0];

      var count514 = app.state.data[1][i][item] || 0;
      var percent514 = count514/totals[1];

      var diff = percent514 - percent511;

      return [item, diff];
    });

    var top5Diffs = _.takeRight(_.sortBy(allItemDiffs, function(itemDiff) {
      return Math.abs(itemDiff[1]);
    }), 5);

    new EJS({ url: 'templates/diff_bar.ejs' }).update(
      'diff-'+i, { items: top5Diffs.reverse() }
    );
  }
};

EJS.Helpers.prototype.greaterThanZero = function(number) {
  return number > 0;
};

var updateWinRate = function(){
  var anyItemLocked = app.state.lockedBars.some(function(item){
    return !!item;
  });

  var text;
  if (anyItemLocked) {
    text = 'Win rate: ' +
      (parseFloat(app.state.winRate[0]) * 100).toFixed(2) + '% (5.11) ' +
      'and ' +
      (parseFloat(app.state.winRate[1]) * 100).toFixed(2) + '% (5.14) ' +
      'of summoners won when they built ';

    var mapSlotsToOrdinals = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];

    lockedItems = [];
    app.state.lockedBars.forEach(function(item, index){
      if (item) {
        lockedItems.push(item + ' ' + mapSlotsToOrdinals[index]);
      }
    });
    text += arrayToSentence(lockedItems);
  } else {
    text = 'Lock an item to see win rates (Hint: Click the tooltip that appears when you hover over the graph).';
  }
  $('#win-rate-text').text(text);
};

var arrayToSentence = function(arr){
  if (arr.length > 1) {
    var last = arr.pop();
    return arr.join(', ') + ' and ' + last + '.';
  } else {
    return arr[0] + '.';
  }
};

app.getNewData = function(){
  var params = {};

  params.lockedBars = app.state.lockedBars.map(function(item, index){
    if (item) {
      return {
        slot: index,
        item: item
      };
    }
  }).filter(Boolean);

  if (app.state.champion) {
    params.champion = app.state.champion;
  }

  var ajaxPromise;
  if (params.lockedBars.length === 0 && !params.champion) {
    ajaxPromise = $.get('/data');
  } else {
    ajaxPromise = $.get('/singleItemData', params);
  }

  ajaxPromise.done(function(itemData){
    app.state.data[0] = itemData.itemData511;
    app.state.data[1] = itemData.itemData514;
    app.state.winRate[0] = itemData.winRate511;
    app.state.winRate[1] = itemData.winRate514;
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

    app.state.patch = position == 'first' ? '5.11' : '5.14';

    updateGraph();
  });

  var showAnalysis = false;
  $('.btn').click(function(){
    if (!showAnalysis) {
      $(this).text('Hide Analysis');
      $('#analysis').slideDown();
    } else {
      $(this).text('Show Analysis');
      $('#analysis').slideUp();
    }
    showAnalysis = !showAnalysis;
  });

  // Populate dropdown options
  championList.forEach(function(champion, index) {
    $option = $('<option>', {value: champion}).html(champion);
    $('#champion-select').append($option);
  });

  initChampionSelectize('#champion-select');

  app.getNewData();
});
