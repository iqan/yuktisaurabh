/*global jQuery, Galleria */

/**
 * Galleria LCweb Theme for Global Gallery - 2013-04-17
 * update: 2017-08-19
 * (c) Montanari Luca aka LCweb
 */
 
(function($) {

/*global jQuery, Galleria */

Galleria.addTheme({
    name: 'ggallery',
    author: 'Montanari Luca',
	version: '1.5.7',
    defaults: {
		//initialTransition: 'fade', 
        transition: gg_galleria_fx,
    	transitionSpeed: gg_galleria_fx_time,
		imageCrop:	gg_galleria_img_crop,
        thumbCrop:  true,
		queue:		false,
		showCounter:false,
		pauseOnInteraction: true,
		
        // set this to false if you want to show the caption by default
        _toggleInfo: gg_galleria_toggle_info
    },
    init: function(options) {

        Galleria.requires(1.5, 'LCweb theme requires Galleria 1.5 or later');

        // add some elements
        this.addElement('gg-play','gg-toggle-thumb', 'gg-lightbox','gg-info-link');
        this.append({
            'info' : ['gg-play','gg-toggle-thumb', 'gg-lightbox', 'gg-info-link', 'info-text']
        });

        // cache some stuff
        var slider_obj = this,
			info_btn = this.$('gg-info-link'),
			info = this.$('info-text'),
			play_btn = this.$('gg-play'),
			lightbox_btn = this.$('gg-lightbox'),
            touch = Galleria.TOUCH,
            click = touch ? 'touchstart' : 'click';

        // some stuff for non-touch browsers
        if (! touch ) {
            this.addIdleState( this.get('image-nav-left'), { left:-50 });
            this.addIdleState( this.get('image-nav-right'), { right:-50 });
        }

        // toggle info
		info_btn.bind( click, function() {
			info.stop().fadeToggle(150);
		});
		
		// launch lightbox
		setTimeout(function() { // delay to avoid strange autoclick
			lightbox_btn.bind("click tap", function(e) {
				
				if(typeof(gg_active_index) != 'undefined') {
					gg_slider_lightbox(slider_obj._data, gg_active_index);
				} 
				else {
					gg_slider_lightbox(slider_obj._data, 0);	
				}
			});
		}, 50);	
		

        // bind some stuff
        this.bind('thumbnail', function(e) {

            if (! touch ) {
                // fade thumbnails
                $(e.thumbTarget).css('opacity', 0.6).parent().hover(function() {
                    $(this).not('.active').children().stop().fadeTo(100, 1);
                }, function() {
                    $(this).not('.active').children().stop().fadeTo(400, 0.6);
                });

                if ( e.index === this.getIndex() ) {
                    $(e.thumbTarget).css('opacity',1);
                }
            } else {
                $(e.thumbTarget).css('opacity', this.getIndex() ? 1 : 0.6);
            }
        });

        this.bind('loadstart', function(e) {
            if (!e.cached) {
                this.$('loader').show().fadeTo(200, 1);
            }
			
			if(this.hasInfo()) {
				this.$('info').removeClass('has_no_data');
			} else {
				this.$('info').addClass('has_no_data');
			}	
			
            $(e.thumbTarget).css('opacity',1).parent().siblings().children().css('opacity', 0.6);
        });

        this.bind('loadfinish', function(e) {
			this.$('loader').fadeOut(200);
			
			// security check for the play-pause button
			if(!this._playing && play_btn.hasClass('galleria-gg-pause')) {
				play_btn.removeClass('galleria-gg-pause');
			}
			
			// avoid double titles due to empty descriptions
			if( $.trim( this.$('info').find('.galleria-info-description').html()) == '&nbsp;' ) {
				this.$('info').find('.galleria-info-description').css('height', 0).css('margin', 0);	
			} else {
				this.$('info').find('.galleria-info-description').removeAttr('style');
			}
			
			if ( options._toggleInfo === false && info.is(':hidden') && !info.hasClass('already_shown') ) {
				info.fadeIn(300).addClass('already_shown');
			}
        });
		
		
    }
});

}(jQuery));