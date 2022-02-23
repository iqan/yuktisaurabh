/////////////////////////////////////
// Image preloader v1.1.2 - 07-09-2017

(function($) {
	if(typeof($.fn.lcweb_lazyload) == 'function') {return true;}
	
	/* global cache var	- multidimensional array
	 * img_url {
	 *    w: width,
	 *    h: height	 
	 * }
	 */
	lc_lzl_cache = {};


	$.fn.lcweb_lazyload = function(lzl_callbacks) {
		lzl_callbacks = $.extend({
			allLoaded: function() {}
		}, lzl_callbacks);


		var $lzl_img_obj = $(this),
			lzl_temp_cache = { // temporary cache to use on callback
				url : [],
				w : [],
				h : []
			};
			
		// if everything is loaded - throw callback
		var check_progress = function() {
			if($lzl_img_obj.length == lzl_temp_cache.w.length) {
				lzl_callbacks.allLoaded.call(this, lzl_temp_cache.url, lzl_temp_cache.w, lzl_temp_cache.h);
			}
		};

		// preload
		var lzl_load = function() {
			$lzl_img_obj.each(function(i, v) {
				var src = $.trim($(this).prop('src'));

				if(!src) {
					console.log('Empty img url - ' + (i+1) );
				}
				else {
					lzl_temp_cache.url.push(src);
					
					// check in cache
					if(lc_lzl_cache.hasOwnProperty(src)) {
						lzl_temp_cache.w.push(lc_lzl_cache[src].w);
						lzl_temp_cache.h.push(lc_lzl_cache[src].h);
						
						check_progress();	
					}
					else {	
						$('<img />').bind("load.lcweb_lazyload", function() {
							lc_lzl_cache[src] = {
								w : this.width,
								h : this.height	
							};
							
							lzl_temp_cache.w.push(this.width);
							lzl_temp_cache.h.push(this.height);
								
							check_progress();
						}).attr('src', src);
					}	
				}
			});
		};

		return lzl_load();
	};
})(jQuery);