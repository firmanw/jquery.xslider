/*
 * jQuery xSlider
 * http://xslider.codapixa.com/
 * Version 1.0-beta1
 *
 * Copyright (c) 2011 Firman Wandayandi
 * Licensed under the Apache License, Version 2.0 http://www.apache.org/licenses/LICENSE-2.0
 */

(function($) {

    $.fn.xslider = function(options) {
        // Check if it is a method call
        if (typeof arguments[0] === 'string') {
            switch (arguments[0]) {
                case 'goto':
                    if (typeof arguments[1] != 'undefined') $(this).data('xslider:instance').to(arguments[1]);
                    break;
                case 'next':
                    $(this).data('xslider:instance').next();
                    break;
                case 'previous':
                    $(this).data('xslider:instance').prev();
                    break;
                case 'play':
                    $(this).data('xslider:instance').play();
                    break;
                case 'stop':
                    $(this).data('xslider:instance').stop();
                    break;
                case 'pause':
                    $(this).data('xslider:instance').pause();
                    break;
                case 'status':
                    return $(this).data('xslider:instance').status();
                    break;
                case 'refresh':
                    $(this).data('xslider:instance').refresh();
                    break;
            }
            return;
        }

        // Creates the xSlider
        return this.each(function() {
            // The xSlider object
            var xslider = {
                settings:   {
                    'children':         null,
                    'width':            null,
                    'height':           null,
                    'effect':           'slide',
                    'speed':            'normal',
                    'order':            'sequence',
                    'timeout':          3000,
                    'easing':           null,
                    'navigation':       null,
                    'prevNext':         true,
                    'wrapperClass':     'xslider',
                    'navigationClass':  'xslider-nav',
                    'autoPlay':         false,
                    'pauseOnHover':     true,
                    'onLoaded':         null,
                    'onBefore':         null,
                    'onComplete':       null
                },

                container:  null,
                timeout:    null,
                current:    0,
                last:       0,
                state:      null,

                // Return the items
                items: function() {
                    var self = this;
                    if (self.settings.children) return $(self.container).children();
                    else return $(self.container).children(self.settings.children);
                },
                
                // Initialization
                init: function(container, options) {
                    var self = this;

                    if (options) $.extend(self.settings, options);

                    // Wrap the container
                    self.container = container;
                    var elements = self.items();
                    
                    // Not items found
                    if (elements.length == 0) return;

                    $(self.container)
                    .wrap($('<div />').addClass(self.settings.wrapperClass))
                    .wrap($('<div />').addClass('xslider-container'));

                    // Set the current and last according to the order settings
                    if (self.settings.order == 'random') {
                        self.last = Math.floor(Math.random() * elements.length);
                        do {
                            self.current = Math.floor(Math.random() * elements.length);
                        } while (self.last == self.current );
                    } else if (self.settings.order == 'random-start') {
                        self.current = Math.floor(Math.random() * elements.length);
                        self.settings.order = 'sequence';
                    } else if (self.settings.order != 'sequence') {
                        alert('xslider:order must either be \'sequence\', \'random\' or \'random-start\'');
                    }

                    // Calls the setup routine
                    self.setup(false);

                    // Setup the slide container
                    $(self.container).css({
                        position: 'relative',
                        width: $(elements[0]).width(),
                        height: $(elements[0]).height(),
                        overflow: 'hidden'
                    });
                    
                    if (self.settings.width != null) $(self.container).css('width', self.settings.width);

                    // Build navigation
                    self.navigation();
                    
                    // Show the first item
                    $(elements[self.current]).fadeIn('normal', function() {
                        // Calls the onLoaded callback function
                        self.onLoaded(self.current, self.last, $(elements[self.current]), $(elements[self.last]), elements);
                    });
                    
                    // Set the state
                    $(self.container).data('xslider:playback', 'standby');

                    // Play the animation if auto play
                    if (self.settings.autoPlay) self.play();
                },

                // Setup the items with proper attributes
                setup: function(refresh) {
                    var self = this;

                    $.each(self.items(), function(i, child) {
                        if (refresh) {
                          if (i != self.current && i != self.last) $(child).css({'position': 'absolute', 'top': 0, 'left': 0, 'display': 'none'});
                        } else {
                          if (i != self.current) $(child).css({'position': 'absolute', 'top': 0, 'left': 0, 'display': 'none'});
                        }

                        if (self.settings.effect == 'fade') $(child).css('z-index', self.items().length - i);
                        else $(child).css('z-index', 0);
                        
                        if (self.settings.autoPlay && self.settings.pauseOnHover) {
                            $(child).unbind('mouseover.xslider').bind('mouseover.xslider', function() {
                                self.stop();
                            }).unbind('mouseout.xslider').bind('mouseout.xslider', function() {
                                self.play();
                            });
                        }
                    });
                },

                // Build the navigation
                navigation: function(refresh) {
                    var self = this;
                    
                    if (self.settings.navigation == null) return;

                    var $wrapper = $(self.container).parents('.' + self.settings.wrapperClass);

                    if (!refresh && self.settings.prevNext) {
                        var $prevnext = $('<div class="xslider-prevnext" />');
                        $('<a href="#xslider-prev" class="prev">Prev</a>').bind('click.xslider', function() { self.prev(); return false; }).appendTo($prevnext);
                        $('<a href="#xslider-next" class="next">Next</a>').bind('click.xslider', function() { self.next(); return false; }).appendTo($prevnext);
                        $prevnext.appendTo($wrapper);
                    }

                    if (typeof(self.settings.navigation) == 'object' && self.settings.navigation.jquery) { // Navigation supplied is jquery dom object
                        $('a', self.settings.navigation).each(function() {
                            $(this).unbind('click.xslider').bind('click.xslider', function() { self.navigate(this); return false;})
                        });

                        for (var i = 0; i < self.items().length; i++) {
                            // Missing navigation
                            if ($('a[href=#xslider-' + i + ']', self.settings.navigation).length == 0) {
                              var $li = $('<li />');

                              $('<a href="#xslider-' + i + '">' + (i + 1) + '</a>')
                              .unbind('click.xslider').bind('click.xslider', function() { self.navigate(this); return false; })
                              .appendTo($li);
                              $li.appendTo($('ul', self.settings.navigation));
                            }
                        }
                    } else if (self.settings.navigation === true) { // Generate the navigation
                        var $nav = $('<nav>').addClass(self.settings.navigationClass).appendTo($wrapper);
                        var $ul = $('<ul />');
                        for (var i = 0; i < self.items().length; i++) {
                            var $li = $('<li />');

                            $('<a href="#xslider-' + i + '">' + (i + 1) + '</a>')
                            .unbind('click.xslider').bind('click.xslider', function() { self.navigate(this); return false; })
                            .appendTo($li);
                            $li.appendTo($ul);
                        }

                        $ul.appendTo($nav);

                        self.settings.navigation = $nav;
                    }

                    if (!refresh) self.setNavigation();
                },

                // Navigate to the proper item according the link
                navigate: function(el) {
                    var match = $(el).attr('href').match(/#xslider-(\d+)/);
                    if (match != null) {
                        // Stop the autoplay
                        this.stop();
                        this.to(match[1]);
                    }
                },

                // Add the current class to current navigation
                setNavigation: function(index) {
                    if (!index) index = this.current;
                    if (typeof(this.settings.navigation) == 'object') {
                        $('a', this.settings.navigation).each(function() {
                            var match = $(this).attr('href').match(/#xslider-(\d+)/);
                            if (match != null && match[1] == index) $(this).addClass('current');
                            else $(this).removeClass('current');
                        });
                    }
                },

                // Play the animation
                animate: function() {
                    var self = this;
                    var elements = self.items();

                    self.onBefore(self.current, self.last, $(elements[self.current]), $(elements[self.last]), elements);

                    $(self.container).animate({'height': $(elements[self.current]).height(), 'width': $(elements[self.current]).width()}, self.settings.speed);

                    if (self.settings.effect == 'slide') { // Slide
                        var width = $(self.container).width()
                        
                        // Initial position
                        $(elements[self.current]).css({'left': width, 'display': '', 'z-index': elements.length});
                        $(elements[self.last]).animate({'left': - width}, self.settings.speed, self.settings.easing, function() {
                          $(this).css({'left': 0, 'z-index': 0, 'display': 'none'});
                        });

                        // Complete position
                        $(elements[self.current]).animate({'left': 0}, self.settings.speed, self.settings.easing, function() {
                            self.onComplete(self.current, self.last, $(elements[self.current]), $(elements[self.last]), elements);
                        });
                    } else if (self.settings.effect == 'roll') { // Roll
                        // Initial position
                        $(elements[self.current]).css({'top': - $(elements[self.last]).outerHeight(), 'display': '', 'z-index': elements.length});
                        $(elements[self.last]).animate({'top': $(elements[self.current]).outerHeight()}, self.settings.speed, self.settings.easing, function() {
                          $(this).css({'left': 0, 'z-index': 0, 'display': 'none'});
                        });

                        // Complete position
                        $(elements[self.current]).animate({'top': 0}, self.settings.speed, self.settings.easing, function() {
                            self.onComplete(self.current, self.last, $(elements[self.current]), $(elements[self.last]), elements);
                        });
                    } else if (self.settings.effect == 'fall') { // Fall
                        // Initial position
                        $(elements[self.last]).css({'z-index': 0});
                        $(elements[self.current]).css({'top': - $(elements[self.current]).outerHeight(), 'display': '', 'z-index': 1});

                        // Hide the last slide
                        $(elements[self.last]).fadeOut(self.settings.speed);

                        // Complete position
                        $(elements[self.current]).animate({'top': 0}, self.settings.speed, self.settings.easing, function() {
                            self.onComplete(self.current, self.last, $(elements[self.current]), $(elements[self.last]), elements);
                        });
                    } else if (self.settings.effect == 'fade') { // Fade
                        $(elements[self.last]).fadeOut(self.settings.speed);
                        $(elements[self.current]).fadeIn(self.settings.speed, function() {
                            removeFilter($(this)[0]);
                            self.onComplete(self.current, self.last, $(elements[self.current]), $(elements[self.last]), elements);
                        });
                    } else
                        alert('xslider:effect must either be \'slide\', \'roll\', \'fall\' or \'fade\'');

                    self.setNavigation();
                },

                // Go to the element
                // The element may an integer of slide item index or a jQuery object
                to: function(element) {
                    var self = this;

                    if (typeof(element) == 'object' && element.jquery) {
                        if (element.length == 0) return false;

                        $.each(self.items(), function(i) {
                            if ($(this)[0] == element[0]) element = i;
                        });
                    }

                    // Currently displaying the item
                    if (self.current == element) return;

                    self.last = self.current;
                    self.current = parseInt(element);
                    self.animate();
                },
                
                // Go to the next item
                next: function() {
                    var self = this;
                    var next = self.current;

                    if (self.settings.order == 'random') {
                        while (next == self.current) next = Math.floor(Math.random() * self.items().length);
                    } else {
                        next++;
                        if (next > this.items().length - 1) next = 0;
                    }

                    this.to(next);
                },
                
                // Go to the previous item
                prev: function() {
                    var self = this;
                    var prev = self.current;

                    if (self.settings.order == 'random') {
                        while (prev == self.current) prev = Math.floor(Math.random() * self.items().length);
                    } else {
                        prev--;
                        if (prev < 0) prev = self.items().length - 1;
                    }

                    this.to(prev);
                },
                
                // Start the playback
                play: function() {
                    var self = this;

                    // Store the playback status
                    $(self.container).data('xslider:playback', 'play');

                    // Set timer for next item
                    timeout = setInterval(function() {
                        // Go to the next item
                        self.next();
                    }, self.settings.timeout);

                    $(self.container).data('xslider:timeout', timeout);
                },

                // Stop the playback
                stop: function() {
                    var self = this;
                    clearInterval($(self.container).data('xslider:timeout'));
                    $(self.container).data('xslider:playback', 'stop');
                },

                // Pause the playback
                pause: function() {
                    var self = this;

                    clearInterval($(self.container).data('xslider:timeout'));
                    $(self.container).data('xslider:playback', 'pause');

                    if (self.settings.autoPlay) self.play();
                },

                // Get the playback status one of 'play', 'pause' or null if never played
                status: function() {
                    var self = this;

                    return {
                        state: $(self.container).data('xslider:playback'),
                        current: self.current,
                        last: self.last
                    };
                },
                
                // Refresh the xSlider
                refresh: function() {
                    var self = this;
                    var elements = self.items();

                    // Rebuilds the children with refresh true
                    self.setup(true);
  
                    // Probably also should refresh the navigation
                    self.navigation(true);
                },

                // Trigger after fully loaded
                onLoaded: function(current, last, currentItem, lastItem, elements) {
                    if (typeof(this.settings.onLoaded) == 'function') this.settings.onLoaded(current, last, currentItem, lastItem, elements);
                },
                
                // Trigger before animation
                onBefore: function(current, last, currentItem, lastItem, elements) {
                    if (typeof(this.settings.onBefore) == 'function') this.settings.onBefore(current, last, currentItem, lastItem, elements);
                },

                // Trigger after animation completed
                onComplete: function(current, last, currentItem, lastItem, elements) {
                    if (typeof(this.settings.onComplete) == 'function') this.settings.onComplete(current, last, currentItem, lastItem, elements);
                }
            };

            // Initialize the xSlider
            xslider.init(this, options);
            
            // Store the xSlider instance
            $(this).data('xslider:instance', xslider);
        });
    };

})(jQuery);

// **** remove Opacity-Filter in ie ****
function removeFilter(element) {
    if(element.style.removeAttribute){
        element.style.removeAttribute('filter');
    }
}
