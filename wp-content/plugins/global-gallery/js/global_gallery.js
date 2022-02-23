(function($) {
	var gg_gallery_w 		= []; // galleries width wrapper
	var gg_img_margin 		= []; // gallery images margin 
	var gg_img_border 		= []; // know border width for each gallery
	
	window.gg_gallery_pag 		= []; // know which page is shown for each gallery
	window.gg_gall_curr_filter	= []; // cache matched image indexes derived from a filter (empty == no filter)
	window.gg_gall_curr_search	= []; // cache matched image indexes derived from a search (empty == no search)
	
	var gg_gall_ajax_filtered 	= []; // know whether a gallery has been filtered via ajax (to recall ajax on a new filter)
	var gg_gall_ajax_cache		= []; // cache any ajax-related result to avoid useless calls
	
	var gg_first_init 		= []; // flag for initial gallery management
	var gg_new_images 		= []; // flag for new images added
	var gg_is_paginating	= []; // flag for pagination animation
	var gg_gall_is_showing 	= []; // showing animation debouncer
	var gg_shown_gall 		= []; // shown gallery flag
	var gg_debounce_resize	= []; // reesize trigger debounce for every gallery 
	
	var coll_ajax_obj 		= []; // where to store ajax objects to abort ajax calls
	var coll_gall_cache		= []; // store ajax-called galleries to avoid double ajax calls
	var coll_scroll_helper	= []; // store collection item clicked to return at proper scroll point
	
	// photostring manag - global vars
	var gg_temp_w 			= [];
	var gg_row_img 			= [];
	var gg_row_img_w 		= []; 
	
	var gg_deeplinked	= false; // flag to know whether to use history.replaceState
	var gg_hashless_url	= false; // page URL without eventual hashes
	var gg_url_hash		= ''; // URL hashtag
	var gg_poppingstate = false; // flag to know whether to ignore deeplink setup on onpop manag
	
	
	// CSS3 loader code
	gg_loader = 
	'<div class="gg_loader">'+
		'<div class="ggl_1"></div><div class="ggl_2"></div><div class="ggl_3"></div><div class="ggl_4"></div>'+
	'</div>';
	

	// initialize the galleries
	gg_galleries_init = function(gid, after_resize) {
		// if need to initialize a specific gallery
		if(typeof(gid) != 'undefined' && gid) {
			if(!$('#'+gid).length) {return false;}
			
			if(typeof(after_resize) == 'undefined') {
				gg_first_init[gid] = 1;
				gg_new_images[gid] = 1;
				gg_is_paginating[gid] = 0;
			}
			
			gg_gallery_process(gid, after_resize);
		}
		
		// execute every gallery in the page
		else {
			$('.gg_gallery_wrap').not(':empty').each(function() {
				var gg_gid = $(this).attr('id');
				gg_galleries_init(gg_gid, after_resize);
			}); 
		}
	};
	
	
	// store galleries info 
	gg_gallery_info = function(gid, after_resize) {
		var coll_sel = ($('#'+gid).hasClass('gg_collection_wrap')) ? '.gg_coll_container' : '';
		gg_gallery_w[gid] = (coll_sel) ? $('#'+gid+' .gg_coll_container').width() : $('#'+gid).width(); 

		if(typeof(after_resize) != 'undefined') {return true;} // only get size if resize event has been triggered
		
		gg_img_border[gid] = parseInt( $('#'+gid+' '+coll_sel+' .gg_img').first().css('border-right-width'));
		gg_img_margin[gid] = parseInt( $('#'+gid+' '+coll_sel+' .gg_img').first().css('margin-right')); 

		// exceptions for isotope elements
		if($('#'+gid).hasClass('gg_masonry_gallery')) {
			gg_img_margin[gid] = parseInt( $('#'+gid+' '+coll_sel+' .gg_img').first().css('padding-right')); 
		}
		else if($('#'+gid).hasClass('gg_collection_wrap')) {
			gg_img_margin[gid] = parseInt( $('#'+gid+' '+coll_sel+' .gg_coll_img_wrap').first().css('padding-right')); 			
		}
	};
	
	
	// process single gallery
	gg_gallery_process = function(gid, after_resize) {	
		if(typeof(gid) == 'undefined') {return false;}	
		
		gg_gallery_info(gid, after_resize);

		
		if( $('#'+gid).hasClass('gg_standard_gallery') ) {
			gg_man_standard_gallery(gid);	
		}
		else if( $('#'+gid).hasClass('gg_columnized_gallery') ) {
			gg_man_colnzd_gallery(gid);
		}
		else if( $('#'+gid).hasClass('gg_masonry_gallery') ) {
			gg_man_masonry_gallery(gid);
		}
		else if( $('#'+gid).hasClass('gg_string_gallery') ) {
			gg_man_string_gallery(gid);	
		}	
		else if( $('#'+gid).hasClass('gg_collection_wrap') ) {
			gg_man_collection(gid);	
		}	
		
		
		// OVERLAY MANAGER ADD-ON //
		if(typeof(ggom_hub) == "function") {
			ggom_hub(gid);
		}
		////////////////////////////
	};
	
	
	// get lazyload parameter and set it as image URL
	var lazy_to_img_url = function(subj_id, is_coll) {
		$subj = (typeof(is_coll) == 'undefined') ? $('#'+subj_id+ ' .gg_main_thumb') : $('#'+subj_id+ ' .gg_coll_outer_container .gg_main_thumb');
		
		$subj.each(function() {
			if($(this).data('gg-lazy-src') != 'undefined') {
				$(this).attr('src', $(this).data('gg-lazy-src'));
				$(this).removeAttr('gg-lazy-src');
			}
		});
	};
	
	
	
	/*** manage standard gallery ***/
	gg_man_standard_gallery = function(gid) {
		if(!$('#'+gid+' .gg_img').length) {return false;}
		lazy_to_img_url(gid);
		
		if(gg_new_images[gid]) {
			$('#'+gid+' .gg_img .gg_main_thumb').lcweb_lazyload({
				allLoaded: function(url_arr, width_arr, height_arr) {
					$('#'+gid+' .gg_loader').fadeOut('fast');
					gg_img_fx_setup(gid, width_arr, height_arr);
					
					$('#'+gid+' .gg_img').each(function(i) {
						$(this).addClass(gid+'-'+i).css('width', (width_arr[0] + gg_img_border[gid] * 2)); // set fixed width to allow CSS fx during filter
						
						var $to_display = $('#'+gid+' .gg_img').not('.gg_shown');
						if(i == 0) {
							gg_gallery_slideDown(gid, $to_display.not('.gg_tags_excluded_img').length);
						}
						
						if(i == ($('#'+gid+' .gg_img').length - 1)) {
							$to_display.gg_display_images(gid);
						}	
					});
					gg_new_images[gid] = 0;
					
					$(window).trigger('gg_loaded_gallery', [gid]);
				}
			});
		}
		
		gg_check_primary_ol(gid);	
	}
	
	
	
	/*** manage columnized gallery ***/
	gg_man_colnzd_gallery = function(gid) {
		
		if(!$('#'+gid+' .gg_img').length) {return false;}
		lazy_to_img_url(gid);
		
		var cols = calc_colnzd_cols(gid);
		$('#'+gid+' .gg_container').css('width', 'calc(100% + '+ gg_img_margin[gid] +'px + '+ cols +'px)');
		$('#'+gid+' .gg_img').css('width', 'calc('+ (100 / cols) +'% - '+ gg_img_margin[gid] +'px - 1px)');	

		gg_check_primary_ol(gid);

		if(gg_new_images[gid]) {
			$('#'+gid+' .gg_img .gg_main_thumb').lcweb_lazyload({
				allLoaded: function(url_arr, width_arr, height_arr) {
					
					$('#'+gid+' .gg_loader').fadeOut('fast');
					gg_img_fx_setup(gid, width_arr, height_arr);
					
					$('#'+gid+' .gg_img').each(function(i) {
						$(this).addClass(gid+'-'+i);
						
						var $to_display = $('#'+gid+' .gg_img').not('.gg_shown');
						if(i == 0) {
							gg_gallery_slideDown(gid, $to_display.not('.gg_tags_excluded_img').length);
						}
						if(i == ($('#'+gid+' .gg_img').length - 1)) {
							$to_display.gg_display_images(gid);
						}	
					});
					gg_new_images[gid] = 0;
					
					$(window).trigger('gg_loaded_gallery', [gid]);
				}
			});
		}
		
		gg_check_primary_ol(gid);	
	};
	
	
	// returns how many columns will gallery needs to show
	var calc_colnzd_cols = function(gid) {
		var tot_w = gg_gallery_w[gid] - gg_img_margin[gid];
		
		// calculate how many columns to show starting from 1
		var cols = 1;
		var col_w = tot_w;
		var max_w = parseInt($('#'+gid).data('col-maxw'));
		
		while(col_w >= max_w) {
			cols++;
			col_w = Math.round(tot_w / cols) - gg_img_margin[gid];	
		}

		return cols;
	};
	
	

	/*** manage masonry gallery ***/
	gg_man_masonry_gallery = function(gid) {
		lazy_to_img_url(gid);
		
		var cols = parseInt($('#'+gid).data('col-num')); 
		var margin = gg_img_margin[gid];
		var col_w = Math.floor((gg_gallery_w[gid] + margin) / cols);
		
		// custom min width?
		var min_w = (typeof($('#'+gid).data('minw')) != 'undefined') ? parseInt($('#'+gid).data('minw')) : gg_masonry_min_w;
		
		// find out right column number
		while(col_w < min_w) {
			if(cols <= 1) {
				cols = 1;
				return false; 
			}
			
			cols--;
			col_w = Math.floor((gg_gallery_w[gid] + margin) / cols);
		}

		$('#'+gid+' .gg_img').each(function(i) {
			var img_class = gid+'-'+i;
			$(this).css('width', col_w).addClass(img_class);
		});	
		
		
		// if is smaller than wrapper - center items
		var diff = gg_gallery_w[gid] + margin - (cols * col_w);
		if(diff > 0) {
			$('#'+gid+' .gg_container').css('left', Math.floor(diff / 2));	
		}

		gg_check_primary_ol(gid);
		
		if(gg_new_images[gid]) {
			$('#'+gid+' .gg_img:not(.gg_tags_excluded_img) .gg_main_thumb').lcweb_lazyload({
				allLoaded: function(url_arr, width_arr, height_arr) {
					$('#'+gid+' .gg_loader').fadeOut('fast');
					gg_img_fx_setup(gid, width_arr, height_arr);
					
					$('#'+gid+' .gg_container').isotope({
						percentPosition	: true,
						isResizeBound	: false,
						resize			: false,
						originLeft		: !gg_rtl,
						masonry			: {
							columnWidth: 1
						},
						containerClass	: 'gg_isotope',	
						itemClass 		: 'gg_isotope-item',
						itemSelector	: '.gg_img:not(.gg_old_page)',
						transitionDuration : 0,
					});
					
					setTimeout(function() { // litle delay to allow masonry placement
						var $to_display = $('#'+gid+' .gg_img').not('.gg_shown');
						
						gg_gallery_slideDown(gid, $to_display.not('.gg_tags_excluded_img').length);
						$to_display.gg_display_images(gid);	
						
						gg_new_images[gid] = 0;
						$(window).trigger('gg_loaded_gallery', [gid]);
					}, 300);
				}
			});
		}
		else {
			setTimeout(function() {
				$('#'+gid+' .gg_container').isotope('layout');
			}, 100);
		}
	}
	
	
	
	/*** manage photostring gallery ***/
	gg_man_string_gallery = function(gid, filter_relayout) {
		lazy_to_img_url(gid);
		
		if(gg_new_images[gid]) {
			$('#'+gid+' .gg_img .gg_main_thumb').lcweb_lazyload({
				allLoaded: function(url_arr, width_arr, height_arr) {
					
					gg_img_fx_setup(gid, width_arr, height_arr);
					layout_photostr_gall(gid, filter_relayout);
					
					$('#'+gid+' .gg_loader').fadeOut('fast');		
						
					var $to_display = $('#'+gid+' .gg_img').not('.gg_shown');
					gg_gallery_slideDown(gid, $to_display.not('.gg_tags_excluded_img').length);
					$to_display.gg_display_images(gid);

					
					gg_new_images[gid] = 0;
					$(window).trigger('gg_loaded_gallery', [gid]);
				}
			});
		}
		else {
			layout_photostr_gall(gid, filter_relayout);
		}
		
		gg_check_primary_ol(gid);
	};
	
	var layout_photostr_gall = function(gid, filter_relayout) {
		
		// is re-layouting because of a filter? match the fakebox
		if(typeof(filter_relayout) != 'undefined') {
			var selector = filter_relayout +' .gg_img .gg_main_thumb';
			gid = filter_relayout.replace('#gg_fakebox_', '');
		} 
		else {
			var selector = '#'+gid+' .gg_img:not(.gg_tags_excluded_img) .gg_main_thumb';	
		}
		
		gg_temp_w[gid] 		= 0;
		gg_row_img[gid] 	= [];
		gg_row_img_w[gid] 	= [];
		
		// sometimes browsers have bad behavior also using perfect width fit
		var container_w = gg_gallery_w[gid] + gg_img_margin[gid];

		$(selector).each(function(i, v) {
			var $img_obj = $(this).parents('.gg_img');
			var img_class = gid+'-'+ $img_obj.data('img-id');
			var w_to_match = 0;

			// reset sizes
			$img_obj.css('width', ($(this).width() - 2)).css('maxWidth', ($(this).width() + gg_img_border[gid]));

		 	$img_obj.addClass(img_class);
			var img_w = ($(this).width() - 2) + gg_img_border[gid] + gg_img_margin[gid]; // subtract 2 pixels to avoid empty bars on sides in rare extensions 
				
			gg_row_img[gid].push('.'+img_class);
			gg_row_img_w[gid].push(img_w);
			
			gg_temp_w[gid] = gg_temp_w[gid] + img_w;
			w_to_match = gg_temp_w[gid];
			
			// if you're lucky and size is perfect
			if(container_w == w_to_match) { 
				gg_row_img[gid] 	= [];
				gg_row_img_w[gid] 	= [];
				gg_temp_w[gid] 		= 0;
			}
			
			// adjust img sizes		
			else if(container_w < w_to_match) {
				var to_shrink = w_to_match - container_w;
				photostr_row_img_shrink(gid, to_shrink, container_w);  
				
				gg_row_img[gid] 	= [];
				gg_row_img_w[gid] 	= [];
				gg_temp_w[gid] 		= 0;
			}
		});
	};
	
	
	var photostr_row_img_shrink = function(gid, to_shrink, container_w) {
		var remaining_shrink = to_shrink;
		var new_row_w = 0;

		// custom min width?
		var min_w = (typeof($('#'+gid).data('minw')) != 'undefined') ? parseInt($('#'+gid).data('minw')) : gg_phosostr_min_w;
		
		// only one image - set to 100% width
		if(gg_row_img[gid].length == 1) {
			$(gg_row_img[gid][0]).css('width', 'calc(100% - '+ (gg_img_margin[gid] + 1) +'px)'); // +1 == security margin added previously
			return true;
		}
		
		// calculate
		var curr_img_w_arr = gg_row_img_w[gid];
		var reached_min = [];
		var extreme_shrink_done = false

		a = 0; // security stop
		while(ps_row_img_w(curr_img_w_arr) > container_w && !extreme_shrink_done && a < 100) {
			a++;

			var to_shrink_per_img = Math.ceil( remaining_shrink / (gg_row_img[gid].length - reached_min.length));
			var new_min_reached = false;
			
			// does this reduce too much an element? recalculate
			$.each(gg_row_img_w[gid], function(i, img_w) {
				if($.inArray(i, reached_min) !== -1) {
					return true;	
				}
				
				var new_w = img_w - to_shrink_per_img;
				if(new_w < min_w) {
					new_w = min_w;
					
					// min is greater than images width?
					var true_img_w = ($(gg_row_img[gid][i]).find('.gg_main_thumb').width() - 2) + gg_img_border[gid]; // subtract 2 pixels to avoid empty bars on sides in rare extensions 
					if(new_w > true_img_w) {
						new_w = true_img_w;
					}
					
					reached_min.push(i);	
					new_min_reached = true;
					
					remaining_shrink = remaining_shrink - (gg_row_img_w[gid][i] - new_w);
				}
			});
			if(new_min_reached) {continue;}


			// calculate new width for every image
			$.each(gg_row_img_w[gid], function(i, img_w) {
				if($.inArray(i, reached_min) !== -1) {
					return true;	
				}
				gg_row_img_w[gid][i] = img_w - to_shrink_per_img;
			});
			
			curr_img_w_arr = gg_row_img_w[gid];
			remaining_shrink = ps_row_img_w(curr_img_w_arr) - container_w;	
				
			
			// if every image reached the minimum - split the remaining between them
			if(reached_min.length >= gg_row_img[gid].length) {
				to_shrink_per_img = Math.ceil( remaining_shrink / gg_row_img[gid].length);
				
				$.each(gg_row_img_w[gid], function(i, img_w) {
					gg_row_img_w[gid][i] = img_w - to_shrink_per_img;	
				});
				
				extreme_shrink_done = true;
			}	
			
			curr_img_w_arr = gg_row_img_w[gid];	
		}

		
		// apply new width
		$.each(gg_row_img[gid], function(i, img_selector) {
			$(img_selector).css('width', gg_row_img_w[gid][i] - gg_img_margin[gid]);	
		});
		
		
		// overall width is smaller than container? enlarge the first useful image
		var diff = container_w - ps_row_img_w(gg_row_img_w[gid]);
		if(diff > 0) {
			
			$.each(gg_row_img[gid], function(i, img_selector) {	
				
				if($.inArray(i, reached_min) === -1 || i == (gg_row_img[gid].length - 1)) { // extrema ratio - last element will be enlarged if everyone already reached the maximum
					
					$(img_selector).css('width', gg_row_img_w[gid][i] - gg_img_margin[gid] + diff);	
					return false;	
				}
			});
		}
	};
	
	// gived an array of selectors - return the overall elements width
	var ps_row_img_w = function(img_w_array) {
		var tot_w = 0;
		$.each(img_w_array, function(i,img_w) {
			tot_w = tot_w + parseFloat(img_w);	
		});
		
		return tot_w;
	};
	
	
	

	/*** manage collection ***/
	gg_man_collection = function(cid) {
		lazy_to_img_url(cid, true);

		var cols = calc_coll_cols(cid);
		$('#'+cid+' .gg_coll_container').css('width', 'calc(100% + '+ gg_img_margin[cid] +'px + '+ cols +'px)');
		$('#'+cid+' .gg_coll_img_wrap').css('width', 'calc('+ (100 / cols) +'% - 1px)');	

		if(gg_rtl) {
			$('#'+cid+' .gg_coll_container').css('left', cols * -1);	
		}

		gg_check_primary_ol(cid);
		
		if(!gg_shown_gall[cid]) {
			$('#'+cid+' .gg_coll_img .gg_main_thumb').lcweb_lazyload({
				allLoaded: function(url_arr, width_arr, height_arr) {
					$('#'+cid+' .gg_loader').fadeOut('fast');
					gg_img_fx_setup(cid, width_arr, height_arr);
					
					
					$('#'+cid+' .gg_coll_img').each(function(i) {
						var img_class = cid+'-'+i;
						$(this).addClass(img_class);
					});
					
					// deeplinked filter?
					var dl_filter = ($('#'+cid+' .gg_cats_selected').length && $('#'+cid+' .gg_cats_selected').attr('rel') != '*') ? $('#'+cid+' .gg_cats_selected').attr('rel') : '';
					
					// init
					$('#'+cid+' .gg_coll_container').isotope({
						layoutMode 		: 'fitRows',
						percentPosition	: true,
						isResizeBound	: false,
						resize			: false,
						originLeft		: !gg_rtl,
						containerClass	: 'gg_isotope',	
						itemClass 		: 'gg_isotope-item',
						itemSelector	: '.gg_coll_img_wrap',
						transitionDuration: '0.6s',
						filter: (dl_filter) ? ':not(.gg_coll_pag_hidden) .ggc_'+ dl_filter : ':not(.gg_coll_pag_hidden)'
					});
					
					// litle delay to allow masonry placement
					setTimeout(function() { 
						var $to_display = $('#'+cid+' .gg_coll_img_wrap').not('.gg_shown');
						
						gg_gallery_slideDown(cid, $to_display.length);
						$to_display.gg_display_images();
							
						gg_new_images[cid] = 0;
						$(window).trigger('gg_loaded_collection', [cid]);
					}, 300);
				}
			});
		}
		else {
			setTimeout(function() {
				$('#'+cid+' .gg_container').isotope('layout');
			}, 300);
		}	
	};
	
	
	// returns how many columns will collection needs to show
	var calc_coll_cols = function(cid) {
		var tot_w = gg_gallery_w[cid] - gg_img_margin[cid];
		
		// calculate how many columns to show starting from 1
		var cols = 1;
		var col_w = tot_w;
		
		while(col_w >= gg_coll_max_w) {
			cols++;
			col_w = Math.round(tot_w / cols) - gg_img_margin[cid];	
		}

		return cols;
	};
	
	
	
	////////////////////////////////////////////////////////////////
	


	// load a collection gallery - click trigger
	$(document).ready(function() {
		$(document).delegate('.gg_coll_img:not(.gg_linked_img)', 'click', function() {
			var cid 		= $(this).parents('.gg_collection_wrap').attr('id');
			var true_cid	= $(this).parents('.gg_collection_wrap').attr('rel');
			
			var gdata	= $(this).data('gall-data');
			var gid 	= $(this).attr('rel');
			
			if(typeof(coll_ajax_obj[cid]) == 'undefined' || !coll_ajax_obj[cid]) {
				
				var dl_text = ($(this).parents('.gg_collection_wrap').find('.gg_img_title_under').length) ? $(this).next().find('.gg_img_title_under').text() : $(this).find('.gg_img_title').text();
				gg_set_deeplink(true_cid, 'gcg_', gid, dl_text);
				
				gg_load_coll_gallery(cid, gdata);
			}
		});
	});
	
	// load collection's gallery 
	gg_load_coll_gallery = function(cid, gdata) {
		var curr_url = $(location).attr('href');
		if(typeof(coll_gall_cache[cid]) == 'undefined') {
			coll_gall_cache[cid] = [];	
		}
		
		// set trigger to return at proper scroll point
		coll_scroll_helper[cid] = $('#'+cid+' .gg_coll_img[data-gall-data="'+gdata+'"]');
		
		// prepare
		if( $('#'+cid+' .gg_coll_gallery_container .gg_gallery_wrap').length) {
			$('#'+cid+' .gg_coll_gallery_container .gg_gallery_wrap').remove();	
			$('#'+cid+' .gg_coll_gallery_container').append('<div class="gg_gallery_wrap">'+ gg_loader +'</div>');
		}
		$('#'+cid+' .gg_coll_gallery_container .gg_gallery_wrap').addClass('gg_coll_ajax_wait');
	
		$('#'+cid+' > table').animate({'left' : '-100%'}, 700, function() {
			$('#'+cid+' .gg_coll_table_first_cell').css('opacity', 0);	
		});
		
		// set absolute position to keep just shown gallery's height
		setTimeout(function() {
			$('#'+cid+' .gg_coll_table_first_cell').css('position', 'absolute');
		}, 710);
		
		// scroll to the top of the collection - if is lower of the gallery top
		var coll_top_pos = $('#'+cid).offset().top;
		if( $(window).scrollTop() > coll_top_pos ) {
			$('html, body').animate({'scrollTop': coll_top_pos - 15}, 600);
		}

		// check in stored cache
		if(typeof(coll_gall_cache[cid][gdata]) != 'undefined') {
			fill_coll_gallery(cid, coll_gall_cache[cid][gdata]);
		}
		else {
			var data = {
				gg_type: 'gg_load_coll_gallery',
				cid: cid,
				gdata: gdata
			};
			coll_ajax_obj[cid] = $.post(curr_url, data, function(response) {
				coll_gall_cache[cid][gdata] = response;
				fill_coll_gallery(cid, response);
				
				// LC lightbox - deeplink
				if(typeof(gg_lcl_allow_deeplink) != 'undefined') {
					gg_lcl_allow_deeplink();
				}
			});	
		}
	}
	
	
	// given gallery data (through ajax or cache) - show it
	var fill_coll_gallery = function(cid, gall_data) {
		$('#'+cid+' .gg_coll_gallery_container .gg_gallery_wrap').remove();
		$('#'+cid+' .gg_coll_gallery_container').removeClass('gg_main_loader').append(gall_data);
		
		if($('#'+cid+' .gg_coll_gall_title').length > 1) {
			$('#'+cid+' .gg_coll_gall_title').first().remove();
		}
		
		gg_coll_gall_title_layout(cid);
		coll_ajax_obj[cid] = null;
		
		var gid = $('#'+cid+' .gg_coll_gallery_container').find('.gg_gallery_wrap').attr('id');
		gg_galleries_init(gid);
	};
	
	
	// collections title - mobile check
	gg_coll_gall_title_layout = function(cid) {
		$('#'+cid+' .gg_coll_gall_title').each(function() {
            var wrap_w = $(this).parents('.gg_coll_table_cell').width();
			var elem_w = $(this).parent().find('.gg_coll_go_back').outerWidth(true) + $(this).outerWidth();
			
			if(elem_w > wrap_w) {$(this).addClass('gg_narrow_coll');}
			else {$(this).removeClass('gg_narrow_coll');}
        });	
	}
	
	
	// back to collection
	$(document).ready(function() {
		$(document).delegate('.gg_coll_go_back', 'click', function() {
			var cid 		= $(this).parents('.gg_collection_wrap').attr('id');
			var true_cid	= $(this).parents('.gg_collection_wrap').attr('rel');
			
			// be sure a gallery has been loaded
			if(!$(this).parents('.gg_coll_table_cell').find('.gg_true_gallery').length) {
				return false;
			}
			
			// if is performing ajax - abort
			if(typeof(coll_ajax_obj[cid]) != 'undefined' && coll_ajax_obj[cid]) {
				coll_ajax_obj[cid].abort();
				coll_ajax_obj[cid] = null;	
			}
			
			// scroll to previously clicked item only if it is out of screen
			var docViewTop = $(window).scrollTop();
			var docViewBottom = docViewTop + $(window).height();
			
			var elemTop = coll_scroll_helper[cid].offset().top;
			var elemBottom = elemTop + coll_scroll_helper[cid].height();
		
			if((elemBottom > docViewBottom) || elemTop < docViewTop) {
				var coll_top_pos = coll_scroll_helper[cid].offset().top - 60;
				$('html, body').animate({'scrollTop': coll_top_pos}, 600);	
			}
			
			// go back
			$('#'+cid+' .gg_coll_table_first_cell').css('opacity', 1).css('position', 'static');		
			$('#'+cid+' > table').animate({'left' : 0}, 700);
			
			setTimeout(function() {
				$('#'+cid +' .gg_coll_gallery_container > *').not('.gg_coll_go_back').remove(); 
				gg_remove_deeplink('gcg_'+true_cid);
			}, 700);
		});
	});
	
	
	
	// manual collections filter - handlers
	$(document).ready(function() {
		$(document).delegate('.gg_filter a', 'click', function(e) {
			e.preventDefault();
			
			var cid = $(this).parents('.gg_filter').attr('id').substr(4);
			var sel = $(this).attr('rel');
			var cont_id = '#' + $(this).parents('.gg_collection_wrap').attr('id');

			$('#ggf_'+cid+' a').removeClass('gg_cats_selected');
			$(this).addClass('gg_cats_selected');	
	
			gg_coll_manual_filter(cid, sel, cont_id);
			
			// if there's a dropdown filter - select option 
			if( $('#ggmf_'+cid).length ) {
				$('#ggmf_'+cid+' option').removeAttr('selected');
				
				if($(this).attr('rel') !== '*') {
					$('#ggmf_'+cid+' option[value='+ $(this).attr('rel') +']').attr('selected', 'selected');
				}
			}
		});
		
		$(document).delegate('.gg_coll_table_cell .gg_mobile_filter_dd', 'change', function(e) {
			var cid = $(this).parents('.gg_mobile_filter').attr('id').substr(5);
			var sel = $(this).val();
			var cont_id = '#' + $(this).parents('.gg_collection_wrap').attr('id');
			
			gg_coll_manual_filter(cid, sel, cont_id);
			
			// select related desktop filter's button
			var btn_to_sel = ($(this).val() == '*') ? '.ggf_all' : '.ggf_id_'+sel
			$('#ggf_'+cid+' a').removeClass('gg_cats_selected');
			$('#ggf_'+cid+' '+btn_to_sel).addClass('gg_cats_selected');
		});
	});
	
	
	
	// manual collections filter - perform
	var gg_coll_manual_filter = function(cid, sel, cont_id) {
		
		if(sel !== '*') {
			var cat_name = $('.ggf_id_'+sel).text();
		}
		
		// set deeplink
		(sel !== '*') ? gg_set_deeplink(cid, 'gcc_', sel, cat_name) : gg_remove_deeplink('gcc_'+cid);

		if(sel !== '*') {
			sel = '.ggc_' + sel;
		}

		// pag btn vis
		(sel == '*') ? $('.cid_'+cid).find('.gg_coll_pag_wrap').fadeIn() : $('.cid_'+cid).find('.gg_coll_pag_wrap').fadeOut();  
		
		sel = (sel == '*') ? ':not(.gg_coll_pag_hidden)' : sel; // up to now filters ignores pagination
		$(cont_id + ' .gg_coll_container').isotope({ filter: sel });
	};
	
	

	
	/////////////////////////////////////////////////
	// show gallery/collection images (selection = attribute to use recursively to filter images to show)
	
	$.fn.gg_display_images = function(gid, selection) {
	
		// no gid == collection | if no selection, check whether to show before filtered 
		if(typeof(gid) != 'undefined' && typeof(gg_gall_curr_filter[gid]) != 'undefined' && gg_gall_curr_filter[gid] && typeof(selection) == 'undefined') {
			
			this.gg_display_images(gid, ':not(.gg_tags_excluded_img)');
			this.gg_display_images(gid, '.gg_tags_excluded_img');
			return true;	
		}
		
		// apply some filter?
		var $subj = (typeof(selection) == 'undefined') ? this : $(this).filter(selection);

		// show		
		$subj.each(function(i, v) {
			var $subj = $(this);
			var delay = (typeof(gg_delayed_fx) != 'undefined' && gg_delayed_fx) ? 170 : 0;

			setTimeout(function() {
				if( navigator.appVersion.indexOf("MSIE 8.") != -1 || navigator.appVersion.indexOf("MSIE 9.") != -1 ) {
					$subj.fadeTo(450, 1);	
				}
				$subj.addClass('gg_shown');
			}, (delay * i));
		});
	};
	
	
	// remove loaders and slide down gallery
	gg_gallery_slideDown = function(gid, img_num, is_collection) {
		if(typeof(gg_gall_is_showing[gid]) != 'undefined' && gg_gall_is_showing[gid]) {
			return false;	
		}

		var fx_time = img_num * 200;
		var $subj = (typeof(is_collection) == 'undefined') ? $('#'+gid+' .gg_container') : $('#'+gid+' .gg_coll_container');

		$subj.animate({"min-height": 80}, 300, 'linear').animate({"max-height": 9999}, 6500, 'linear');		
		gg_gall_is_showing[gid] = setTimeout(function() {
			if( // fix for old safari
				navigator.appVersion.indexOf("Safari") == -1 || 
				(navigator.appVersion.indexOf("Safari") != -1 && navigator.appVersion.indexOf("Version/5.") == -1 && navigator.appVersion.indexOf("Version/4.") == -1)
			) {
				$subj.css('min-height', 'none');
			}
			
			$subj.stop().css('max-height', 'none');
			gg_gall_is_showing[gid] = false;
		}, fx_time);
			
		
		if(gg_new_images[gid]) {
			setTimeout(function() {
				gg_new_images[gid] = 0;
				$('#'+gid+' .gg_paginate > div').fadeTo(150, 1);
			}, 500);	
		}
		
		gg_shown_gall[gid] = true;
	};
	
	


	/////////////////////////////////////
	// get URL query vars and returns them into an associative array
	var get_url_qvars = function() {
		gg_hashless_url = decodeURIComponent(window.location.href);
		
		if(gg_hashless_url.indexOf('#') !== -1) {
			var hash_arr = gg_hashless_url.split('#');
			gg_hashless_url = hash_arr[0];
			gg_url_hash = '#' + hash_arr[1];
		}
		
		// detect
		var qvars = {};
		var raw = gg_hashless_url.slice(gg_hashless_url.indexOf('?') + 1).split('&');
		
		$.each(raw, function(i, v) {
			var arr = v.split('=');
			qvars[arr[0]] = arr[1];
		});	
		
		return qvars;
	};
	
	
	// create slug from a string - for better deeplinked urls
	var string_to_slug = function(str) {
		str = str.toString().replace(/^\s+|\s+$/g, ''); // trim
		str = str.toLowerCase();
		
		// remove accents, swap ñ for n, etc
		var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
		var to   = "aaaaeeeeiiiioooouuuunc------";
		for (var i=0, l=from.length ; i<l ; i++) {
		  str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
		}
		
		str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
		  .replace(/\s+/g, '-') // collapse whitespace and replace by -
		  .replace(/-+/g, '-'); // collapse dashes
		
		return str;
	}
	
	
	// shortcut to know if a deeplinked key is enabled
	var dl_key_enabled = function(key) {
		return ($.inArray(key, gg_deeplinked_elems) === -1) ? false : true;
	};
	
	
	
	/*
	 * Global function to set global gallery deeplinks
	 *
	 * gall_id (int) - true gallery/collection ID
	 * key (string) - the subject - to know if it has to be deeplinked (ggt_, ggs_, ggp_)
	 * val (int) - deeplink value (cat ID - tag ID - etc)
	 * txt (string) - optional value to attach a text to value 
	 */
	gg_set_deeplink = function(gall_id, key, val, txt) {
		if(gg_poppingstate || !dl_key_enabled(key)) {return false;}
		
		// block collection galleries?
		if(!gg_dl_coll_gall && $('.gg_collection_wrap .gid_'+gall_id).length) {
			return false;	
		}
		
		
		var qvars = get_url_qvars(); // get query vars and set clean URL + eventual hash 

		// set the deeplink value
		var subj = key + gall_id;
		
		// setup deeplink part
		var true_val = (typeof(txt) != 'undefined' && txt) ? val +'/'+ string_to_slug(txt) : val;
		var dl_part = subj +'='+ true_val + gg_url_hash;
		
		// if URL doesn't have attributes
		if(gg_hashless_url.indexOf('?') === -1) {
			history.pushState(null, null, gg_hashless_url +'?'+ dl_part);
		}
		else {

			// if new deeplink already exists
			if(typeof(qvars[subj]) != 'undefined' && qvars[subj] == true_val) {
				return true;	
			}
			
			// re-compose URL
			var new_url = gg_hashless_url.slice(0, gg_hashless_url.indexOf('?') + 1);

			// (if found) discard attribute to be set
			var a = 0;
			var has_other_qvars = false;
			var this_attr_exists = false;
			
			$.each(qvars, function(i, v) {
				if(typeof(i) == 'undefined') {return true;}

				// if setting tag or search - reset pagination by skipping it
				if((key == 'tag' || key == 'search') && i == 'ggp_'+gall_id) {
					return true;	
				}
				
				if(a > 0) {new_url += '&';}
				
				if(i != subj) {
					new_url += (v) ? i+'='+v : i; 
					
					has_other_qvars = true;
					a++;	

				}
				else {
					this_attr_exists = true;	
				}
			});
				
			if(has_other_qvars) {new_url += '&';}		
			new_url += dl_part;
			
			if(!gg_basic_deeplink) {
				history.pushState(null, null, new_url);	
			} else {
				history.replaceState(null, null, new_url);		
			}
		}
	};


	// remove deeplink - subj == deeplink key to remove
	gg_remove_deeplink = function(subj) {
		var qvars = get_url_qvars();
		if(typeof(qvars[subj]) == 'undefined') {return false;}
		
		// discard attribute to be removed
		var parts = [];
		$.each(qvars, function(i, v) {
			if(typeof(i) != 'undefined' && i && i != subj) {
				var val = (v) ? i+'='+v : i;
				parts.push(val);	
			}
		});
		
		var qm = (parts.length) ? '?' : '';	
		var new_url = gg_hashless_url.slice(0, gg_hashless_url.indexOf('?')) + qm + parts.join('&') + gg_url_hash;

		history.replaceState(null, null, new_url);	
		
		if(gg_hashless_url.indexOf('ggt_') === -1 && gg_hashless_url.indexOf('ggc_') === -1 && gg_hashless_url.indexOf('ggp_') === -1 && gg_hashless_url.indexOf('ggs_') === -1) {
			gg_deeplinked = false;
		}	
	};
	
	
	// detect URL changes and auto-perform actions
	window.addEventListener('popstate', function(e) {
		var qvars = get_url_qvars();
		gg_poppingstate = true;
		
		var new_situation = {
			'galls' : {},
			'colls'	: {},
		};
		var defaults = {
			'ggt' 	: '',
			'ggs' 	: '',
			'ggp'	: 1,
			'gcc'	: '',	
		};	
		
		// wrap up deeplinked vars
		$.each(qvars, function(subj, val) {
			if(typeof(val) == 'undefined') {return true;}
			
			// does the gallery exist?
			var true_id = parseInt(subj.substr(4), 10);
			if(!$('.gid_'+ true_id).length && !$('.cid_'+ true_id).length) {
				return true;	
			}
			
			// clean texts from deeplinked val
			var raw_val = val.split('/');
			val = raw_val[0]; 
			
			// gallery deeplinks
			if($('.gid_'+ true_id).length) {
				var gid 		= $('.gid_'+true_id).attr('id');
				var $pre_gall	= $('.gg_pre_gallery[data-gid="'+ gid +'"]');
				
				if(typeof(new_situation['galls'][ gid ]) == 'undefined') {
					new_situation['galls'][ gid ] = defaults;
				}
				
				
				// tags
				if(dl_key_enabled('ggt_') && subj.indexOf('ggt_') !== -1 && $pre_gall.find('.gg_tag[data-tag="'+ val +'"]').length) {
					new_situation['galls'][ gid ]['ggt'] = $pre_gall.find('.gg_tag[data-tag="'+ val +'"]').data('images').split(','); 
				}
				
				// search
				if(dl_key_enabled('ggs_') && subj.indexOf('ggs_') !== -1 && $pre_gall.find('.gg_gall_search_form input').length) {
					new_situation['galls'][ gid ]['ggs'] = val;	
				}
				
				// page
				if(dl_key_enabled('ggp_') && subj.indexOf('ggp_') !== -1 && !$('#'+gid+' .gg_infinite_scroll').length) {
					new_situation['galls'][ gid ]['ggp'] = parseInt(val, 10);		
				}
			}
			
			// collection deeplinks
			else {
				if(typeof(new_situation['colls'][ true_id ]) == 'undefined') {
					new_situation['colls'][ true_id ] = defaults;
				}

				// coll categories
				if(dl_key_enabled('gcc_') && subj.indexOf('gcc_') !== -1 && $('.ggf_id_'+val).length) {
					new_situation['colls'][ true_id ]['gcc'] = parseInt(val, 10);		
				}
				
				// seleted coll gallery
				if(dl_key_enabled('gcg_') && subj.indexOf('gcg_') !== -1 && $('.gg_coll_img[rel='+val+']').length) {
					new_situation['colls'][ true_id ]['gcg'] = parseInt(val, 10);		
				}
			}
		});
			
		
		// apply to each targeted gallery
		$('.gg_true_gallery').each(function() {
            var gid 	= $(this).attr('id');
			var has_pag = $(this).find('.gg_paginate').length; 
			var ns 		= new_situation['galls'];
			
			if(typeof( ns[gid] ) == 'undefined') {
				ns[gid] = defaults;
			}
			if(typeof( gg_gallery_pag[gid] ) == 'undefined') {
				gg_gallery_pag[gid] = 1;	
			}
			if(typeof( gg_gall_curr_filter[gid] ) == 'undefined') {
				gg_gall_curr_filter[gid] = '';	
			}
			if(typeof( gg_gall_curr_search[gid] ) == 'undefined') {
				gg_gall_curr_search[gid] = '';	
			}
			
			
			var old_filter = gg_gall_curr_filter[gid],
				old_search = gg_gall_curr_search[gid];
			
			gg_gallery_pag[gid] 		= ns[gid]['ggp'];
			gg_gall_curr_filter[gid] 	= ns[gid]['ggt'];
			gg_gall_curr_search[gid] 	= ns[gid]['ggs'];
			
			
			if(typeof(gg_pag_vars) != 'undefined' && typeof(gg_pag_vars[gid]) != 'undefined') {
				paginate_gall(gid);
			} 
			else {
				if(old_filter != gg_gall_curr_filter[gid]) {
					(!gg_gall_curr_filter[gid]) ? 
						$('.gg_pre_gallery[data-gid="'+ gid +'"] .gg_tag[data-tag="*"]').trigger('click') : 
						$('.gg_pre_gallery[data-gid="'+ gid +'"] .gg_tag[data-tag="'+ gg_gall_curr_filter[gid].join(',') +'"]').trigger('click');
				} 
				else {
					$('.gg_pre_gallery[data-gid="'+ gid +'"] .gg_gall_search_form input').val(gg_gall_curr_search[gid]).trigger('keyup');	
				}
			}
        });	
		

		// apply to each targeted collection
		$('.gg_collection_wrap').each(function() {
			var cid 	= parseInt($(this).attr('rel'), 10);
			var ns 		= new_situation['colls'];
			
			// skip if doesn't have filters
			if(!$('.cid_'+ cid +' .ggf_all').length) {
				return true;
			}

			// category filter
			if(dl_key_enabled('gcc_')) {
				if(typeof(ns[ cid ]) != 'undefined' && typeof(ns[ cid ]['gcc']) != 'undefined') {
					$('.cid_'+ cid +' .ggf_id_'+ ns[ cid ]['gcc'] ).trigger('click');	
				}
				else {
					$('.cid_'+ cid +' .ggf_all').trigger('click');	
				}
			}
			
			// chosen gallery
			if(typeof(ns[ cid ]) != 'undefined' && typeof(ns[ cid ]['gcg']) != 'undefined') {
				$('.cid_'+ cid +' .gg_coll_img[rel='+ ns[ cid ]['gcg'] +']').trigger('click');	
			}
			else {
				$('.cid_'+ cid +' .gg_coll_go_back').trigger('click');	
			}
		});
		
		
		if(gg_hashless_url.indexOf('ggt_') === -1 && gg_hashless_url.indexOf('ggp_') === -1 && gg_hashless_url.indexOf('ggs_') === -1 && gg_hashless_url.indexOf('gcc_') === -1) {
			gg_deeplinked = false;
		}
		
		gg_poppingstate = false;	
	});
	
	
	
	
	//////////////////////////////////////
	// PAGINATION
	
	// gallery pagination
	$(document).ready(function() {
		
		//// standard pagination - next
		$(document).delegate('.gg_true_gallery .gg_next_page', 'click', function() {
			var gid = $(this).parents('.gg_gallery_wrap').attr('id');
			
			if( !$(this).hasClass('gg_pag_disabled') && gg_is_paginating[gid] == 0 ) {
				var curr_page = (typeof(gg_gallery_pag[gid]) == 'undefined') ? 1 : gg_gallery_pag[gid];

				gg_gallery_pag[gid] = curr_page + 1;
				paginate_gall(gid, true);
			}
		});
		// standard pagination - prev
		$(document).delegate('.gg_true_gallery .gg_prev_page', 'click', function() {
			var gid = $(this).parents('.gg_gallery_wrap').attr('id');
			
			if( !$(this).hasClass('gg_pag_disabled') && gg_is_paginating[gid] == 0 ) {
				var curr_page = (typeof(gg_gallery_pag[gid]) == 'undefined') ? 1 : gg_gallery_pag[gid];
				var new_pag = ((curr_page - 1) < 1) ? 1 : (curr_page - 1);

				gg_gallery_pag[gid] = new_pag;
				paginate_gall(gid, true);
			}
		});	
			
		// numbered buttons/dots - handle click
		$(document).delegate('.gg_true_gallery .gg_num_btns_wrap > div, .gg_true_gallery .gg_dots_pag_wrap > div', 'click', function() {
			var gid = $(this).parents('.gg_gallery_wrap').attr('id');
			
			if( !$(this).hasClass('gg_pag_disabled') && gg_is_paginating[gid] == 0 ) {
				gg_gallery_pag[gid] = $(this).attr('rel'); 
				paginate_gall(gid, true);
			}
		});	
		
		// infinite scroll
		$(document).delegate('.gg_true_gallery .gg_infinite_scroll', 'click', function() {
			var gid = $(this).parents('.gg_gallery_wrap').attr('id');
			
			// set the page to show
			var next_pag = (typeof(gg_gallery_pag[gid]) == 'undefined') ? 2 : gg_gallery_pag[gid] + 1;
			gg_gallery_pag[gid] = next_pag; 
			
			paginate_gall(gid, true);
		});
	});
	
	
	
	// perform gallery pagination
	var paginate_gall = function(gid, on_pag_btn_click) {
		var curr_url 	= window.location.href;
		var gall_id		= $('#'+gid).attr('rel');	
			
		if($('#'+gid).hasClass('gg_filtering_imgs') || gg_is_paginating[gid]) {
			console.error('GG - wait till previous tag filter or pagination to end');
			return false;
		}
		gg_is_paginating[gid] = 1;
		
		
		if(typeof(gg_gall_curr_filter[gid]) == 'undefined') {gg_gall_curr_filter[gid] = '';}
		if(typeof(gg_gall_curr_search[gid]) == 'undefined') {gg_gall_curr_search[gid] = '';}
	
		
		// deeplink management
		if(typeof(on_pag_btn_click) != 'undefined') {
			(gg_gallery_pag[gid] > 1) ? gg_set_deeplink(gall_id, 'ggp_', gg_gallery_pag[gid]) : gg_remove_deeplink('ggp_'+gall_id);
		}
	

		// prepare object for ajax call
		var data = {
			gid				: $("#"+gid).attr('rel'),
			gg_type			: 'gg_pagination',
			gg_filtered_imgs: gg_gall_curr_filter[gid],
			gg_search_str	: gg_gall_curr_search[gid],
			gg_ol			: $('#'+gid).data('gg_ol'),
			gg_page			: gg_gallery_pag[gid],
			gg_pag_vars		: gg_pag_vars[gid]
		};
		
		// check in cache
		var cache_id 	= JSON.stringify(data),
			cached_call = (typeof(gg_gall_ajax_cache[gid]) == 'undefined' || typeof(gg_gall_ajax_cache[gid][cache_id]) == 'undefined') ? false : true;
		
		
		// smooth change effect if returning to page 1
		if(gg_gallery_pag[gid] == 1 || !$('#'+gid+' .gg_infinite_scroll').length) {
			var curr_h = $('#'+gid+' .gg_container').height();
			var smooth_timing = Math.round( (curr_h / 30) * 25);
			if(smooth_timing < 220) {smooth_timing = 220;}
	
			if(typeof(gg_gall_is_showing[gid]) != 'undefined') {
				clearTimeout(gg_gall_is_showing[gid]);
				gg_gall_is_showing[gid] = false;
			}
			
			$('#'+gid+' .gg_container').css('max-height', curr_h).stop().animate({"max-height": 150}, smooth_timing);
	
			// hide images
			$('#'+gid+' .gg_img').addClass('gg_old_page');
	
			var is_closing = true
			setTimeout(function() {
				is_closing = false;
				$('#'+gid+' .gg_old_page').remove();
			}, smooth_timing);
			
			// show loader
			setTimeout(function() {	
				$('#'+gid+' .gg_loader').fadeIn('fast');
				$('#'+gid+' .gg_paginate').remove();
			}, 200);
		}
		else {
			$('#'+gid+' .gg_container').css('max-height', $('#'+gid+' .gg_container').height());
		
			// hide nav and append loader
			if( $('#'+gid+' .gg_paginate .gg_loader').length ) {
				$('#'+gid+' .gg_paginate .gg_loader').remove();
			}
			
			$('#'+gid+' .gg_infinite_scroll').fadeTo(200, 0);
			setTimeout(function() {	
				$('#'+gid+' .gg_paginate').prepend(gg_loader);
			}, 200);	
		}

		
		// perform
		if(!cached_call) {
			if(typeof(gg_gall_ajax_cache[gid]) == 'undefined') {
				gg_gall_ajax_cache[gid] = [];	
			}
			
			$.post(window.location.href, data, function(response) {
				gg_gall_ajax_cache[gid][cache_id] = response;
				final_gall_pag_operations(gid, response);
			});
		} 
		else {
			$('#'+gid+' .gg_paginate').fadeOut();
			
			setTimeout(function() {	// wait for previous images to be hidden
				final_gall_pag_operations(gid, gg_gall_ajax_cache[gid][cache_id]);	
			}, 500);	
		}	

		return true;
	};
	
	
	
	// final gallery management after ajax call
	var final_gall_pag_operations = function(gid, response) {
		
		var $foo 	= $('<div>'+ response +'</div>');
		var resp 	= {
			imgs 	: $foo.find('.gg_img'),
			pag		: $foo.find('.gg_paginate')
		}; 

		// replace pag btn
		$('#'+gid).find('.gg_paginate').replaceWith(resp.pag);
		
		// if there was no pagination and now there is
		if(resp.pag.length && !$('#'+gid).find('.gg_paginate').length) {
			$('#'+gid +' .gg_container').after(resp.pag);	
		}
		
		// append and execute images
		if( $('#'+gid).hasClass('gg_string_gallery') ) {
			$('#'+gid+' .gg_container .gg_string_clear_both').remove();
			$('#'+gid+' .gg_container').append(resp.imgs);
			$('#'+gid+' .gg_container').append('<div class="gg_string_clear_both" style="clear: both;"></div>');
		}
		else {
			$('#'+gid+' .gg_container').append(resp.imgs);	
		}
		
		if( $('#'+gid).hasClass('gg_masonry_gallery')) {
			//$('#'+gid+' .gg_container').isotope('destroy');
			$('#'+gid+' .gg_container').isotope('reloadItems');
		}
		
		// no images? add noresult class
		if(!$('#'+gid+' .gg_img').length) {
			$('#'+gid).addClass('gg_noresult');	
			$('#'+gid+' .gg_loader').fadeOut();
		}	

		gg_is_paginating[gid] = 0;
		gg_new_images[gid] = 1;
		gg_gallery_process(gid);
	};
	
	
	//////////////
	
	
	// collection pagination
	$(document).ready(function() {
		
		//// standard pagination - next
		$(document).delegate('.gg_coll_pag_wrap .gg_next_page:not(.gg_pag_disabled)', 'click', function() {
			var $wrap = $(this).parents('.gg_coll_pag_wrap');
			
			var curr_pag 	= parseInt( $wrap.attr('data-pag'), 10),
				new_pag 	= curr_pag + 1;
			
			if(new_pag >= parseInt($wrap.data('totpag'), 10)) {
				$(this).addClass('gg_pag_disabled');	
			}
			$wrap.find('.gg_prev_page').removeClass('gg_pag_disabled');
		
			$wrap.find('.gg_nav_mid span').text(new_pag);
			paginate_coll($wrap, new_pag, false);
		});
		// standard pagination - prev
		$(document).delegate('.gg_coll_pag_wrap .gg_prev_page:not(.gg_pag_disabled)', 'click', function() {
			var $wrap = $(this).parents('.gg_coll_pag_wrap');
			
			var curr_pag 	= parseInt( $wrap.attr('data-pag'), 10),
				new_pag 	= curr_pag - 1;
			
			if(new_pag <= 1) {
				$(this).addClass('gg_pag_disabled');	
			}
			$wrap.find('.gg_next_page').removeClass('gg_pag_disabled');
		
			$wrap.find('.gg_nav_mid span').text(new_pag);
			paginate_coll($wrap, new_pag, false);
		});	
			
		// numbered buttons/dots - handle click
		$(document).delegate('.gg_coll_pag_wrap .gg_num_btns_wrap > div:not(.gg_pag_disabled), .gg_coll_pag_wrap .gg_dots_pag_wrap > div:not(.gg_pag_disabled)', 'click', function() {
			var $wrap = $(this).parents('.gg_coll_pag_wrap');
		
			var curr_pag 	= parseInt( $wrap.attr('data-pag'), 10),
				new_pag 	= parseInt( $(this).attr('rel'), 10);
			
			$wrap.find('.gg_pagenum, .gg_pag_dot').removeClass('gg_pag_disabled'); 
			$(this).addClass('gg_pag_disabled');
			
			paginate_coll($wrap, new_pag, false);
		});	

		// infinite scroll
		$(document).delegate('.gg_coll_pag_wrap .gg_infinite_scroll', 'click', function() {
			var $wrap = $(this).parents('.gg_coll_pag_wrap');
			
			var tot_pags	= parseInt($wrap.data('totpag'), 10),
				curr_pag 	= parseInt( $wrap.attr('data-pag'), 10),
				new_pag 	= curr_pag + 1;
			
			if(new_pag >= tot_pags) {
				$(this).fadeOut(function() {
					$wrap.slideUp();
				});
			}
			
			paginate_coll($wrap, new_pag, true);
		});
	});
	
	
	
	// perform collection pagination
	var paginate_coll = function($pag_wrap, new_pag, inf_scroll) {
		var $coll = $pag_wrap.parents('.gg_collection_wrap');
		
		var tot_pags = parseInt($pag_wrap.data('totpag'), 10),
			per_pag  = parseInt($pag_wrap.data('per-pag'), 10),
			gall_counter = 1,
			pag_counter = 1;
		
		$pag_wrap.attr('data-pag', new_pag);
		$coll.find('.gg_coll_img_wrap').removeClass('gg_coll_pag_hidden');

		$coll.find('.gg_coll_img_wrap').each(function(i, v) {

			if(
				(!inf_scroll && pag_counter != new_pag) ||
				(inf_scroll && pag_counter > new_pag)
			) {
				$(this).addClass('gg_coll_pag_hidden');	
			}
			
			gall_counter++;
			if(gall_counter > per_pag) {
				gall_counter = 1;
				pag_counter++;	  
			}
		});	

		$coll.find('.gg_coll_container').isotope({ filter: ':not(.gg_coll_pag_hidden)' });
	};
	
	
	
	// automatic Infinite scroll
	$(window).scroll(function() {
		var wS = $(this).scrollTop();
		
		$('.gg_auto_inf_scroll').each(function() {
		   var $aif_subj = $(this); 
		   
		   var hT = $aif_subj.offset().top,
			hH = $aif_subj.outerHeight(),
			wH = $(window).height();

			if (wS > (hT+hH-wH)){
				$aif_subj.trigger('click');
			}
		});
	});
	
	
	
	///////////////////////////////////////////////////////
	
	
	
	// GALLERY TAGS FILTER
	$(document).ready(function() {
		
		// tags filter through tag click
		$(document).delegate('.gg_tag:not(.gg_tag_sel)', 'click', function(e) { 
			$(this).trigger('gg-click');
		});
		$(document).delegate('.gg_tag', 'gg-click', function(e) {	// custom action to allow forced selections
			var gid 		= $(this).parents('.gg_tags_wrap').data('gid');
			var true_gid	= $('#'+gid).attr('rel'); 
			var tag 		= $(this).data('tag');
		
			if(tag == '*') {
				var img_indexes = '*';	
			} 
			else {	
				var raw_target_imgs = $(this).data('images').toString();
				var img_indexes = raw_target_imgs.split(',');	
			}

			// perform and manage tag selection
			if(gg_tag_filter(gid, img_indexes, 'tags')) { 
				$(this).parents('.gg_tags_wrap').find('.gg_tag_sel').removeClass('gg_tag_sel');
				$(this).addClass('gg_tag_sel');
				
				(gg_gall_curr_filter[gid] && img_indexes != '*') ? gg_set_deeplink(true_gid, 'ggt_', $('.gg_tag_gid_'+ true_gid +' .gg_tag_sel').attr('data-tag')) : gg_remove_deeplink('ggt_'+true_gid);
			}
			
			// if there's a dropdown filter - select option 
			if( $(this).parents('.gg_tags_wrap').find('.gg_tags_dd').length ) {
				$(this).parents('.gg_tags_wrap').find('.gg_tags_dd option').removeAttr('selected');
				
				if(tag !== '*') {
					$(this).parents('.gg_tags_wrap').find('.gg_tags_dd option[value="'+ tag +'"]').attr('selected', 'selected');
				}
			}
		});
		
		
		// tag filter using mobile dropdown
		$(document).delegate('.gg_tags_dd', 'change', function(e) {
			var $wrap 		= $(this).parents('.gg_tags_wrap');
			var gid 		= $wrap.data('gid');
			var true_gid 	= $('#'+gid).attr('rel');
		

			var raw_target_imgs = $wrap.find('.gg_tag[data-tag="'+ $(this).val() +'"]').data('images'); // match filters to avoid misleading equal arrays
			var img_indexes = (raw_target_imgs == '*') ? raw_target_imgs : raw_target_imgs.split(',');	

			if(gg_tag_filter(gid, img_indexes, 'tags')) { 
				$wrap.find('.gg_tag_sel').removeClass('gg_tag_sel');
				$wrap.find('.gg_tag[data-images="'+ raw_target_imgs +'"]').addClass('gg_tag_sel');	
				
				(gg_gall_curr_filter[gid] && img_indexes != '*') ? gg_set_deeplink(true_gid, 'ggt_', $('.gg_tag_gid_'+ true_gid +' .gg_tag_sel').attr('data-tag')) : gg_remove_deeplink('ggt_'+true_gid);
			}
			else {
				return false;	
			}
		});
	});
	
	
	
	// performs tags filter
	function gg_tag_filter(gid, matched_imgs_index, context) {
		var $gall = $('#'+gid);
		var there_are_pages = $gall.find('.gg_paginate').length;
		
		if(typeof(gg_gall_ajax_filtered[gid]) == 'undefined') {
			gg_gall_ajax_filtered[gid] = false;	
		}
		
		// is filtering? wait
		if($gall.hasClass('gg_filtering_imgs') && gg_is_paginating[gid]) {
			console.error('GG - wait till previous tag filter or pagination to end');
			return false;	
		}
			
		// if tag - store matched indexes
		if(context == 'tags') {
			gg_gall_curr_filter[gid] = (matched_imgs_index == '*') ? '' : matched_imgs_index;	
		} 
		
		// know whether matches images are all in current page
		all_matched_showing = false;
		if(!there_are_pages) {
			var all_matched_showing = true;
			
			if(matched_imgs_index != '*') {
				$.each(matched_imgs_index, function(i, v) {
					
					if(!$('#'+gid+' .gg_img[data-img-id="'+ v +'"]').length) {
						all_matched_showing = false;
						return false;	
					}
				});	
			}
			else {
				if(gg_gall_ajax_filtered[gid]) {
					all_matched_showing = false;
				}	
			}
		}

		// debug
		//console.log([context, gg_gall_curr_search[gid], gg_gall_curr_filter[gid], there_are_pages, all_matched_showing]);

		// all matched image are already showing or filtering an alraedy filtered gallery, use local filter
		if(
			(all_matched_showing && !gg_gall_ajax_filtered[gid] && (typeof(gg_pag_vars) == 'undefined' || typeof(gg_pag_vars[gid]) == 'undefined')) ||
			
			(context == 'tags' && !gg_gall_curr_filter[gid] && gg_gall_curr_search[gid] && !there_are_pages && all_matched_showing) ||
			(context == 'tags' && gg_gall_curr_filter[gid] && gg_gall_curr_search[gid] && !there_are_pages) ||
			
			(context == 'search' && !gg_gall_curr_search[gid] && gg_gall_curr_filter[gid] && !there_are_pages && all_matched_showing) ||
			(context == 'search' && gg_gall_curr_search[gid] && gg_gall_curr_filter[gid] && !there_are_pages) 
		) {
			local_img_filter($gall, matched_imgs_index, context);	
		}
		
		else {
			gg_gallery_pag[gid] = 1;
			gg_gall_ajax_filtered[gid] = true;
			
			gg_remove_deeplink('ggp_'+ $gall.attr('rel') );
			$('#'+gid).removeClass('gg_noresult');
			
			if(paginate_gall(gid) && !gg_gall_curr_filter[gid] && !gg_gall_curr_search[gid]) {
				gg_gall_ajax_filtered[gid] = false;
			}
		}
		
		return true;
	};
	
	
	
	
	// local images filter (tags and search), single-page galleries (animate and eventualy show "no results")
	var local_img_filter = function($gall, matched_imgs_index, context) { 
	
		var gid 			= $gall.attr('id'),
			$container 		= $gall.find('.gg_container'),
			fakebox_id 		= 'gg_fakebox_'+gid,
			string_gall 	= $gall.hasClass('gg_string_gallery'), 
			hidden_class	= (context == 'tags') ? 'gg_tags_excluded_img' : 'gg_search_excluded_img',
			hidden_selector = '.gg_tags_excluded_img, .gg_search_excluded_img',
			matched_count 	= 0;
		
		// masonry gallery - just manage class
		if($gall.hasClass('gg_masonry_gallery')) {
			$gall.addClass('gg_filtering_imgs');
			
			$gall.find('.gg_img').each(function() {	
				var img_id = $(this).data('img-id');
				
				if(matched_imgs_index == '*' || $.inArray( img_id.toString(), matched_imgs_index) !== -1) {
					$(this).removeClass(hidden_class);
					matched_count++;	
				} 
				else {
					$(this).addClass(hidden_class);		
				}
			});
			
			$container.isotope({ filter: ':not('+ hidden_selector +')' });
		}
		
		
		// other layouts
		else {
			$container.css('height', $container.outerHeight());
			
			// create a fake container recreating the new layout
			var fakebox_align = ($gall.hasClass('gg_standard_gallery')) ? 'text-align: center;' : '';
			var fb_w = (string_gall) ? $gall.outerWidth(true) : $container.outerWidth(true);
			$('body').append('<div id="'+ fakebox_id +'" class="gg_filter_fakebox" style="width: '+ fb_w +'px; '+fakebox_align+'"></div>');
			
			
			// photostring - copy the whole gallery into fakebox
			if(string_gall) {
				$('#'+fakebox_id).html( $gall.clone() );
				$('#'+fakebox_id+' .gg_string_gallery').removeAttr('id');
				$('#'+fakebox_id+' .gg_img').removeClass(hidden_class).removeAttr('style');
			}
				
			
			// prepend placeholders to prepare new positions
			$gall.find('.gg_img').each(function() {	
				var $img = $(this);
				var img_id = $img.data('img-id');
				
				if(matched_imgs_index == '*' || $.inArray( img_id.toString(), matched_imgs_index) !== -1) {
					matched_count++;	
					
					if(!string_gall) {
						$('#'+fakebox_id).append('<div style="display: inline-block; width: '+ $img.outerWidth(true) +'px; height: '+ $img.outerHeight(true) +'px;" data-img-id="'+ img_id +'"></div>');	
					}
				}
				
				// for photostring remove discarded images
				else {
					$('#'+fakebox_id).find('[data-img-id="'+ img_id +'"]').remove();
				}
				
				var pos = $img.position();
				$img.css({
					left 		: pos.left +'px',
					top 		: pos.top +'px',
				});
			});
			$gall.find('.gg_img').css('position', 'absolute');
			
			
			// wait a bit to let CSS to propagate
			setTimeout(function() {
				$gall.addClass('gg_filtering_imgs');
				
				// photostring - relayout fakebox gallery to get new positions
				if(matched_count && string_gall) {
					layout_photostr_gall(false, '#'+fakebox_id);
				}
				
			
				// cycle again applying new positions and hiding others
				$gall.find('.gg_img').each(function() {	
					var img_id = $(this).data('img-id');
					
					if(matched_imgs_index == '*' || $.inArray( img_id.toString(), matched_imgs_index) !== -1) {
						
						var newpos = $('#'+fakebox_id +' [data-img-id="'+ img_id +'"]').position();
						$(this).css({
							left 		: newpos.left +'px',
							top 		: newpos.top +'px'

						});
						
						$(this).removeClass(hidden_class);
					} 
					
					else {
						$(this).css({
							left 		: 'auto',
							top 		: 'auto'
						});
						
						$(this).addClass(hidden_class);		
					}
				});
				
				// animate new container's height
				var new_cont_h = ($('#'+fakebox_id +' div').length) ? $('#'+fakebox_id +' div').last().position().top + $('#'+fakebox_id +' div').last().height() : 100;
				$container.css('height', new_cont_h);
				
				// if photostring - animate image to shape them
				if(matched_count && string_gall) {
					layout_photostr_gall(gid);
				}
			}, 50);
		}
			
			
		// no matched?  show "no results in this page"
		if(!matched_count) {
			$gall.addClass('gg_noresult');	
		} else{
			$gall.removeClass('gg_noresult');	
		}	
			
		
		// remove filtering animation class
		setTimeout(function() {
			$gall.removeClass('gg_filtering_imgs');
			
			if(!$gall.hasClass('gg_masonry_gallery')) {
				$container.css('height', 'auto');
				
				$gall.find('.gg_img').not(hidden_selector).css('position', 'static');
				$('#'+fakebox_id).remove();
			}
		}, 500);
	};
	
	
	
	///////////////////////////////////////////////////////
	
	
	
	// GALLERY IMAGES SEARCH
	$(document).delegate('.gg_gall_search_form input', 'keyup', function() {

		if(typeof(gg_search_defer) != 'undefined') {clearTimeout(gg_search_defer);}
		var $this = $(this); 
		
		gg_search_defer = setTimeout(function() { 
			var gid					= $this.parents('.gg_pre_gallery').data('gid'),
				$gall				= $('#'+gid),
				true_gid 			= $('#'+gid).attr('rel'),
				matched_imgs_index	= [],
				val 				= $.trim( $this.val() );
			
			if(val.length < 2) {
				val = '';
				matched_imgs_index = '*';
				$this.parents('.gg_gall_search_form').removeClass('ggs_has_txt');	
			}
			else {
				$this.parents('.gg_gall_search_form').addClass('ggs_has_txt');	
				
				// elaborate search string to match items
				var src_arr = val.toLowerCase().split(' ');

				// cyle and check each searched term 
				$gall.find('.gg_img').each(function() {
					var src_attr = $(this).data('gg-title') +' '+ $(this).data('gg-descr') +' '+ $(this).data('gg-author'),
						src_attr = src_attr.toLowerCase();
					
					var rel = $(this).data('img-id');
					
					$.each(src_arr, function(i, word) {						
						if(word.length < 2) {
							return true;
						}
						
						if( src_attr.indexOf(word) !== -1 ) {
							matched_imgs_index.push(""+rel+""); // must be string
							return false;	
						}
					});
				});
			}

			gg_gall_curr_search[gid] = val;
			gg_tag_filter(gid, matched_imgs_index, 'search', val);
			
			(val) ? gg_set_deeplink(true_gid, 'ggs_', val) : gg_remove_deeplink('ggs_'+true_gid);
		}, 300);
	});


	// reset search
	$(document).delegate('.gg_clear_search', 'click', function() {
		var $wrap = $(this).parents('.gg_gall_search_form');
		var $input = $wrap.find('input'); 

		$input.val('');
		$input.trigger('keyup');
	});
	

	// disable enter key
	jQuery(document).on("keypress", ".gg_gall_search_form input", function(e) { 
		return e.keyCode != 13;
	});
		
	
	
	///////////////////////////////////////////////////////
	
	
	
	//  primary overlay check - if no title hide
	gg_check_primary_ol = function(gid, respect_delay) {		
		$('#'+gid+' .gg_img').each(function(i, e) {
			var $ol_subj = $(this);

			if(!$.trim($ol_subj.find('.gg_img_title').html())) {
				$ol_subj.find('.gg_main_overlay').hide(); 	
			} else {
				$ol_subj.find('.gg_main_overlay').show();	
			}
		});	
	}
	
	
	
	///////////////////////////////////////////////////////
	
	
	
	// images effects
	gg_img_fx_setup = function(gid, width_arr, height_arr) {
		var fx_timing = $('#'+gid).data('ggom_timing'); 
		
		if( typeof($('#'+gid).data('ggom_fx')) != 'undefined' && $('#'+gid).data('ggom_fx').indexOf('grayscale') != -1) {
			
			// create and append grayscale image
			$('#'+gid+' .gg_main_thumb').each(function(i, v) {
				if( $(this).parents('.gg_img').find('.gg_fx_canvas.gg_grayscale_fx ').length == 0 ) {
					var img = new Image();
					img.onload = function(e) {
						Pixastic.process(img, "desaturate", {average : false});
					}
					
					$(img).addClass('gg_photo gg_grayscale_fx gg_fx_canvas');
					$(this).before(img);
					
					if(navigator.appVersion.indexOf("MSIE 9.") != -1 || navigator.appVersion.indexOf("MSIE 10.") != -1) {	
						if($(this).parents('.gg_img').hasClass('gg_car_item')) {
							$(this).parents('.gg_img').find('.gg_fx_canvas').css('width', width_arr[i]);
						}
						else {
							$(this).parents('.gg_img').find('.gg_fx_canvas').css('max-width', width_arr[i]).css('max-height', height_arr[i]);
							
							if( $(this).parents('.gg_gallery_wrap').hasClass('gg_collection_wrap') ) {
								$(this).parents('.gg_img').find('.gg_fx_canvas').css('min-width', width_arr[i]).css('min-height', height_arr[i]);	
							}
						}
					}
					
					img.src = $(this).attr('src');			
				}
			});
			
			// mouse hover opacity
			$('#'+gid).delegate('.gg_img','mouseenter touchstart', function(e) {
				$(this).find('.gg_grayscale_fx').stop().animate({opacity: 0}, fx_timing);
			}).
			delegate('.gg_img','mouseleave touchend', function(e) {
				$(this).find('.gg_grayscale_fx').stop().animate({opacity: 1}, fx_timing);
			});
		}
		
		if( typeof($('#'+gid).data('ggom_fx')) != 'undefined' && $('#'+gid).data('ggom_fx').indexOf('blur') != -1 ) {
			
			// create and append blurred image
			$('#'+gid+' .gg_main_thumb').each(function(i, v) {
				if( $(this).parents('.gg_img').find('.gg_fx_canvas.gg_blur_fx ').length == 0 ) {
					var img = new Image();
					img.onload = function() {
						Pixastic.process(img, "blurfast", {amount:0.15});
					}
	
					$(img).addClass('gg_photo gg_blur_fx gg_fx_canvas').attr('style', 'opacity: 0; filter: alpha(opacity=0);');
					$(this).before(img);

					if(navigator.appVersion.indexOf("MSIE 9.") != -1 || navigator.appVersion.indexOf("MSIE 10.") != -1) {	
						if($(this).parents('.gg_img').hasClass('gg_car_item')) {
							$(this).parents('.gg_img').find('.gg_fx_canvas').css('width', width_arr[i]);
						}
						else {
							$(this).parents('.gg_img').find('.gg_fx_canvas').css('max-width', width_arr[i]).css('max-height', height_arr[i]);
							
							if( $(this).parents('.gg_gallery_wrap').hasClass('gg_collection_wrap') ) {
								$(this).parents('.gg_img').find('.gg_fx_canvas').css('min-width', width_arr[i]).css('min-height', height_arr[i]);	
							}
						}
					}
					
					img.src = $(this).attr('src');
				}
			});
			
			
			// mouse hover opacity
			$('#'+gid).delegate('.gg_img','mouseenter touchstart', function(e) {
				$(this).find('.gg_blur_fx').stop().animate({opacity: 1}, fx_timing);
			}).
			delegate('.gg_img','mouseleave touchend', function(e) {
				$(this).find('.gg_blur_fx').stop().animate({opacity: 0}, fx_timing);
			});	
		}
	}
	
	
	/////////////////////////////////////

	
	// touch devices hover effects
	if( gg_is_touch_device() ) {
		$('.gg_img').bind('touchstart', function() { $(this).addClass('gg_touch_on'); });
		$('.gg_img').bind('touchend', function() { $(this).removeClass('gg_touch_on'); });
	}
	
	// check for touch device
	function gg_is_touch_device() {
		return !!('ontouchstart' in window);
	}
	
	
	
	/////////////////////////////////////
	// image-to-gallery functions
	
	gg_itg_init = function(id) {
		lazy_to_img_url(id);
		
		$('#'+id+' .gg_img .gg_main_thumb').lcweb_lazyload({
			allLoaded: function(url_arr, width_arr, height_arr) {
				
				$('#'+id+' .gg_itg_container').addClass('gg_itg_shown');
			}
		});
	};
	
	
	// launch lightbox
	$(document).delegate('.gg_itg_wrap', 'click', function(e) {
		var id = $(this).attr('id');
		
		// which index?
		if($(e.terget).hasClass('gg_itg_img')) {
			var clicked_index = $(e.target).data('index');	
		}
		else if($(e.target).parents('.gg_itg_img').length) {
			var clicked_index = $(e.target).parents('.gg_itg_img').data('index');	
		}
		else {
			var clicked_index = 0; 	
		}
		
		gg_throw_lb( gg_itg_obj[id], id, clicked_index, true);	
	});
	
	
	
	
	
	/////////////////////////////////////
	// galleria slider functions
	
	// manage the slider initial appearance
	gg_galleria_show = function(sid) {
		setTimeout(function() {
			if( $(sid+' .galleria-stage').length) {
				$(sid).removeClass('gg_show_loader');
				$(sid+' .galleria-container').fadeTo(200, 1);	
			} else {
				gg_galleria_show(sid);	
			}
		}, 50);
	}
	
	
	// manage the slider proportions on resize
	gg_galleria_height = function(sid) {
		if( $(sid).hasClass('gg_galleria_responsive')) {
			return parseFloat( $(sid).data('asp-ratio') );
		} else {
			return $(sid).height();	
		}
	}
	
	
	// Initialize Galleria
	gg_galleria_init = function(sid) {
		// autoplay flag
		var spec_autop = $(sid).data('gg-autoplay');
		var sl_autoplay = ((gg_galleria_autoplay && spec_autop != '0') || (spec_autop == '1')) ? true : false;

		// init
		Galleria.run(sid, {
			theme: 'ggallery', 
			height: gg_galleria_height(sid),
			fullscreenDoubleTap: false,
			wait: true,
			debug: false,
			
			// avoid using ALT for description
			dataConfig: function(img) {
				return {
					title: $(img).attr('alt'),
					description: $(img).data('description')
				};
			},
			
			// customizations
			extend: function() {
				var gg_slider_gall = this;
				$(sid+' .galleria-loader').append(gg_loader);
				
				if(sl_autoplay) {

					setTimeout(function() {
						$(sid+' .galleria-gg-play').addClass('galleria-gg-pause')
						gg_slider_gall.play(gg_galleria_interval);	
					}, 50);
				}
				
				// play-pause
				$(sid+' .galleria-gg-play').click(function() {
					$(this).toggleClass('galleria-gg-pause');
					gg_slider_gall.playToggle(gg_galleria_interval);
				});
				
				// pause slider on lightbox click
				$(sid+' .galleria-gg-lightbox').click(function() {
					// get the slider offset
					$(sid+' .galleria-thumbnails > div').each(function(k, v) {
                       if( $(this).hasClass('active') ) {gg_active_index = k;} 
                    });
					
					$(sid+' .galleria-gg-play').removeClass('galleria-gg-pause');
					gg_slider_gall.pause();
				});

				// thumbs navigator toggle
				$(sid+' .galleria-gg-toggle-thumb').click(function() {
					var $gg_slider_wrap = $(this).parents('.gg_galleria_slider_wrap');
					var thumb_h = $(this).parents('.gg_galleria_slider_wrap').find('.galleria-thumbnails-container').height();
					
					if( $gg_slider_wrap.hasClass('galleria-gg-show-thumbs') || $gg_slider_wrap.hasClass('gg_galleria_slider_show_thumbs') ) {
						$gg_slider_wrap.stop().animate({'padding-bottom' : '15px'}, 400);
						$gg_slider_wrap.find('.galleria-thumbnails-container').stop().animate({'bottom' : '20px', 'opacity' : 0}, 400);
						
						$gg_slider_wrap.removeClass('galleria-gg-show-thumbs');
						if( $gg_slider_wrap.hasClass('gg_galleria_slider_show_thumbs') ) {
							$gg_slider_wrap.removeClass('gg_galleria_slider_show_thumbs')
						}
					} 
					else {
						$gg_slider_wrap.stop().animate({'padding-bottom' : (thumb_h + 2 + 12)}, 400);
						$gg_slider_wrap.find('.galleria-thumbnails-container').stop().animate({'bottom' : '-'+ (thumb_h + 2 + 10) +'px', 'opacity' : 1}, 400);	
						
						$gg_slider_wrap.addClass('galleria-gg-show-thumbs');
					}
				});
				
				// LC lightbox - deeplink
				if(typeof(gg_lcl_allow_deeplink) != 'undefined') {
					gg_lcl_allow_deeplink();
				}
			}
		});
	}
	
	
	/////////////////////////////////////
	// Slick carousel functions
	
	
	// dynamically calculate breakpoints
	gg_car_calc_breakpoints = function(gid, img_max_w, multiscroll, forced_init_cols) {
		var bp = [];
		
		/* OLD forced sizes? try to find a good way to setup breakpoints */
		if(forced_init_cols) {
			var base_treshold = $("#gg_car_"+ gid).width() + 50;
			var base_img_w = Math.round( base_treshold / forced_init_cols ); 
			
			var obj = {
				breakpoint: base_treshold,
				settings: {
					slidesToShow: forced_init_cols,
					slidesToScroll: (multiscroll) ? forced_init_cols : 1
				}
			};
			bp.push( obj );
			
			for(a = forced_init_cols; a >= 1; a--) {
				
				obj = {
					breakpoint: (base_treshold - (base_img_w * (forced_init_cols - a))),
					settings: {
						slidesToShow: a,
						slidesToScroll: (multiscroll) ? a : 1
					}
				};
				bp.push( obj );
			}
		}

		/* new max-width based */
		else {
			for(a=1; a < 100; a++) {
				var overall_w = a * img_max_w; 
				if(overall_w > 2000) {break;}
				
				var obj = {
					breakpoint: overall_w,
					settings: {
						slidesToShow: a,
						slidesToScroll: (multiscroll) ? a : 1
					}
				};
				
				bp.push( obj );
			}
		}
		
		return bp;
	};
	
	
	/* preload visible images */
	gg_carousel_preload = function(gid, autoplay) {
		$('#gg_car_'+gid).prepend(gg_loader);
		
		// apply effects
		if( !$('#gg_car_'+gid+' .gg_grayscale_fx').length && !$('#gg_car_'+gid+' .gg_blur_fx').length ) {
			$('#gg_car_'+gid+' img').lcweb_lazyload({
				allLoaded: function(url_arr, width_arr, height_arr) {
					var true_h =  $('#gg_car_'+gid+' .gg_img_inner').height();
					
					// old IE fix - find true width related to height
					if(navigator.appVersion.indexOf("MSIE 9.") != -1 || navigator.appVersion.indexOf("MSIE 8.") != -1) {
						$.each(width_arr, function(i, v) {
							width_arr[i] = (width_arr[i] * true_h) / height_arr[i];
							height_arr[i] = true_h;
						});	
					}
					
					gg_img_fx_setup('gg_car_'+gid, width_arr, height_arr);
				}
			});
			var wait_for_fx = true;
		}
		else {var wait_for_fx = false;}
		
		var shown_first = (wait_for_fx) ? '' : '.slick-active';
		$('#gg_car_'+gid+' '+ shown_first +' img').lcweb_lazyload({
			allLoaded: function(url_arr, width_arr, height_arr) {
				$('#gg_car_'+gid+' .gg_loader').fadeOut(200, function() {
					$(this).remove();
				});
				$('#gg_car_'+gid).removeClass('gg_car_preload');
				
				if(autoplay) {
					$('#gg_car_'+gid).slick('slickPlay');	
				}
				
				// wait and show
				var delay = (wait_for_fx) ? 1200 : 320;
				setTimeout(function() {
					gg_car_center_images(gid);
					
					$(window).trigger('gg_loaded_carousel', [gid]);
				}, delay);
			}
		});
		
		
		// OVERLAY MANAGER ADD-ON //
		if(typeof(ggom_hub) == "function") {
			ggom_hub(gid);
		}
		////////////////////////////
	};
	
	
	var gg_car_center_images = function(subj_id) {
		var subj_sel = (typeof(subj_id) == 'undefined') ? '' : '#gg_car_'+subj_id;
		
		$(subj_sel + ' .gg_img.gg_car_item').each(function(i,v) {
			var $img = $(this);
			var $elements = $img.find('.gg_main_img_wrap > *');

			var wrap_w = $(this).width();
			var wrap_h = $(this).height(); 
			
			
			$('<img />').bind("load",function(){ 
				var ratio = Math.max(wrap_w / this.width, wrap_h / this.height);
				var new_w = this.width * ratio;
				var new_h = this.height * ratio;
				
				var margin_top = Math.ceil( (wrap_h - new_h) / 2);
				var margin_left = Math.ceil( (wrap_w - new_w) / 2);
				
				if(margin_top > 0) {margin_top = 0;}
				if(margin_left > 0) {margin_left = 0;}
				
				$elements.css('width', new_w).css('height', new_h);
				
				// mark to be shown
				$img.addClass('gg_car_img_ready'); 	
				
			}).attr('src',  $img.find('.gg_main_thumb').attr('src'));

        });
	}
	
	
	$(document).ready(function(e) {
		
		/* pause on hover fix */
        $(document).delegate('.gg_car_pause_on_h', 'mouseenter touchstart', function(e) {			
			$(this).slick('slickPause');
		}).
		delegate('.gg_car_pause_on_h', 'mouseleave touchend', function(e) {
			if($(this).hasClass('gg_car_autoplay')) {
				$(this).slick('slickPlay');
			}
		});	
		
		/* pause on lightbox open */
		$(document).delegate('.gg_carousel_wrap .gg_img:not(.gg_linked_img)', 'click tap', function(e) {			
			var $subj = $(this);
			setTimeout(function() {
				$subj.parents('.gg_carousel_wrap').slick('slickPause');
			}, 150);
		});
		
		// navigating through pages, disable autoplay on mouseleave
		$(document).delegate('.gg_carousel_wrap .slick-arrow, .gg_carousel_wrap .slick-dots li:not(.slick-active)', 'click tap', function(e) {		
			$(this).parents('.gg_carousel_wrap').removeClass('gg_car_autoplay');
		});
		$(document).delegate('.gg_carousel_wrap', 'swipe', function(e){
			$(this).removeClass('gg_car_autoplay');
		});
    });	
	
	

	/////////////////////////////////////
	// debouncers
	
	gg_debouncer = function($,cf,of, interval){
		var debounce = function (func, threshold, execAsap) {
			var timeout;
			
			return function debounced () {
				var obj = this, args = arguments;
				function delayed () {
					if (!execAsap) {func.apply(obj, args);}
					timeout = null;
				}
			
				if (timeout) {clearTimeout(timeout);}
				else if (execAsap) {func.apply(obj, args);}
				
				timeout = setTimeout(delayed, threshold || interval);
			};
		};
		$.fn[cf] = function(fn){ return fn ? this.bind(of, debounce(fn)) : this.trigger(cf); };
	};
	
	
	
	// bind resize to trigger only once event
	gg_debouncer($,'gg_smartresize', 'resize', 49);
	$(window).gg_smartresize(function() {
		
		// resize galleria slider
		$('.gg_galleria_responsive').each(function() {	
			var slider_w = $(this).width();
			var gg_asp_ratio = parseFloat($(this).data('asp-ratio'));
			var new_h = Math.ceil( slider_w * gg_asp_ratio );
			$(this).css('height', new_h);
		});
	});
	
	
	
	// bind scroll to keep "back to gallery" button visible
	gg_debouncer($,'gg_smartscroll', 'scroll', 50);
	$(window).gg_smartscroll(function() {
		gg_keep_back_to_gall_visible();
	});
	
	var gg_keep_back_to_gall_visible = function() {
		if( $('.gg_coll_back_to_new_style').length && typeof(gg_back_to_gall_scroll) != 'undefined' && gg_back_to_gall_scroll) {
			$('.gg_coll_gallery_container .gg_gallery_wrap').each(function(i, v) {
         		var gall_h = $(this).height();
				var $btn = $(this).parents('.gg_coll_gallery_container').find('.gg_coll_go_back');
				
				if(gall_h > $(window).height()) {
					
					var offset = $(this).offset();
					if( $(window).scrollTop() > offset.top && $(window).scrollTop() < (offset.top + gall_h - 60)) {
						var top = Math.round( $(window).scrollTop() - offset.top) + 55;
						if(top < 0) {top = 0;}
						
						$btn.addClass('gg_cgb_sticky').css('top', top);	
					}
					else {$btn.removeClass('gg_cgb_sticky').css('top', 0);}
				}
				else {$btn.removeClass('gg_cgb_sticky').css('top', 0);}
			       
            });
		}
	}
	
	
	
	// persistent check for galleries collections size change 
	$(document).ready(function() {
		setInterval(function() {
			$('.gg_gallery_wrap').each(function() {
				var gid = $(this).attr('id');
				if(typeof(gg_shown_gall[gid]) == 'undefined') {return true;} // only for shown galleries

				var new_w = ($(this).hasClass('gg_collection_wrap')) ? $('#'+gid+' .gg_coll_container').width() : $('#'+gid).width();
				
				if(typeof(gg_gallery_w[gid]) == 'undefined') {

					gg_gallery_w[gid] = new_w;	
					return true;
				}
				
				// trigger only if size is different
				if(gg_gallery_w[gid] != new_w) {
					persistent_resize_debounce(gid);
					gg_gallery_w[gid] = new_w;
				}
			});
		}, 200);
	});
	
	var persistent_resize_debounce = function(gall_id) {
		if(typeof(gg_debounce_resize[gall_id]) != 'undefined') {clearTimeout(gg_debounce_resize[gall_id]);}
		
		gg_debounce_resize[gall_id] = setTimeout(function() {	
			$('#'+gall_id).trigger('gg_resize_gallery', [gall_id]);	
		}, 50);
	}
	
	
	
	// pre-gallery block - mobile layout check on init
	$(document).ready(function() {
		$('.gg_pre_gallery.gg_gall_has_filter.gg_gall_has_search').each(function() {
			var gall_id = $(this).data('gid');
			$('#'+gall_id).trigger('gg_resize_gallery', [gall_id]);
			
			$(this).fadeTo(300, 1);
		});
	});
	
	
	
	// standard GG operations on resize
	$(document).delegate('.gg_gallery_wrap', 'gg_resize_gallery', function(evt, gall_id) {
		
		// top-gallery with search and filters - mobile mode switch
		var gid = $(this).attr('id');
		var pre_gall_selector = '.gg_pre_gallery.gg_gall_has_filter.gg_gall_has_search[data-gid='+ gid +']';
		if($(pre_gall_selector).length) {
			
			($(this).width() >= 850) ? $(pre_gall_selector).removeClass('gg_pg_on_mobile') : $(pre_gall_selector).addClass('gg_pg_on_mobile'); 	
		}
		
		
		// collection galleries title check 	
		if($(this).hasClass('gg_collection_wrap') && $(this).find('.gg_coll_gallery_container .gg_container').length) {
			gg_coll_gall_title_layout(gall_id); 
		} 
		
		
		// whether to trigger only carousel resizing
		if($(this).hasClass('gg_carousel_wrap')) {
			 gg_car_center_images(gall_id); // carousel images sizing	
		}
		else {
			gg_galleries_init(gall_id, true); // rebuilt galleries on resize	
		}
	});
	
	
	
	
	/////////////////////////////////////////////////////
	// full-resolution images preloading after galleries
	
	if(typeof(gg_preload_hires_img) != 'undefined' && gg_preload_hires_img) {
		var $phi_subjs = $('.gg_gallery_wrap, .gg_carousel_wrap');
		var phi_tot_subjs = $phi_subjs.length;
		var phi_loaded = 0;
		
		if(phi_tot_subjs) {
			$(window).on('gg_loaded_gallery gg_loaded_collection gg_loaded_carousel', function() {
				phi_loaded++;
				
				if(phi_loaded == phi_tot_subjs) {
					setTimeout(function() {
						$('.gg_img').not('.gg_coll_img, .gg_linked_img').each(function() {
							$('<img />')[0].src = $(this).data('gg-url');
						});	
					}, 300);
				}
			}); 
		}
	}
	



	
	/////////////////////////////////////
	// Lightbox initialization

	// fix for HTML inside attribute
	gg_lb_html_fix = function(str) {
		var txt = (typeof(str) == 'string') ? str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
		return $.trim(txt);
	};
	
	
	// via image click
	$(document).ready(function() {
		$(document).delegate('.gg_gallery_wrap:not(.gg_static_car) div.gg_img:not(.gg_coll_img, .gg_linked_img, .gg_tags_excluded_img)', 'click', function(e) {	
			e.preventDefault();	
			if( $(e.target).hasClass('.ggom_socials') || $(e.target).parents('.ggom_socials').length) {return false;}
	
			var gall_obj = [];
			
			var $clicked = $(this);
			var rel = $clicked.attr('rel');
			var gid = $clicked.parents('.gg_gallery_wrap').attr('id');
			var clicked_url = $clicked.data('gg-url');
			var clicked_index = 0;
			
			$('#'+gid+' .gg_img:not(.gg_coll_img, .gg_linked_img, .gg_tags_excluded_img)').each(function(i, v) {
				var img_url = $(this).data('gg-url');
				
				if(typeof( gall_obj[img_url] ) == 'undefined') {
					gall_obj[img_url] = {
						"img"		: img_url,
						"title"		: gg_lb_html_fix($(this).data('gg-title')),
						"descr"		: gg_lb_html_fix($(this).data('gg-descr')),
						'author'	: gg_lb_html_fix($(this).data('gg-author'))
					};	
					
					if(img_url == clicked_url) {clicked_index = i;}
				}
			});
			
			gg_throw_lb(gall_obj, rel, clicked_index);
		});
	});
	
	
	// via slider
	gg_slider_lightbox = function(data, clicked_index) {
		var rel = $.now();
		var gall_obj = {};
		
		$.each(data, function(i, v)  {
			gall_obj[v.big] = {
				"img"		: v.big,
				"title"		: gg_lb_html_fix(v.title),
				"descr"		: gg_lb_html_fix(v.description),
				'author'	: '',
			};
		});
		gg_throw_lb(gall_obj, rel, clicked_index);
	};
})(jQuery);