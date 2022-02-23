(function(){
	var $ = jQuery;
	
	if(typeof(tinymce) == 'undefined') {
		return false;	
	}

	// creates plugin
	tinymce.PluginManager.add('ggallery', function( editor, url ) {

        // Add a button that opens a window
        editor.addButton('gg_btn', {
            text		: false,
			title		: 'Global Gallery',
            icon		: 'gg_btn',  // css class  mce-i-gg_btn
            onclick		: function() {

				$gg_scw_editor_wrap = $(this).parents('.wp-editor-wrap');
			
				$.magnificPopup.open({
					items : {
						src: '#ggallery_sc_wizard > *',
						type: 'inline'
					},
					mainClass	: 'gg_sc_wizard_lb',
					closeOnContentClick	: false,
					closeOnBgClick		: false, 
					preloader	: false,
					callbacks	: {
					  beforeOpen: function() {
						if($(window).width() < 800) {
						  this.st.focus = false;
						}
					  },
					  open : function() {
						  
						gg_live_chosen();	
						gg_live_checks(); 
	
						
						// tabify through select
						var lb_class = ".gg_sc_wizard_lb"
						
						$(lb_class+' .lcwp_scw_choser option').each(function() {
							var val = $(this).attr('value');
							
							if(!$(this).is(':selected')) {
								$(lb_class +' '+ val).hide();	
							} else {
								$(lb_class +' '+ val).show();		
							}
						});
						
						// on select change
						$(lb_class).delegate('.lcwp_scw_choser', 'change', function(e) {
							e.preventDefault();
							
							$(lb_class+' .lcwp_scw_choser option').each(function() {
								var val = $(this).attr('value');
							
								if(!$(this).is(':selected')) {
									$(lb_class +' '+ val).hide();	
								} else {
									$(lb_class +' '+ val).show();		
								}
							});
						});
					  }
					}
				});
				$(document).delegate('.mfp-wrap.gg_sc_wizard_lb', 'click', function(e) {
					if($(e.target).hasClass('mfp-container')) {
						$.magnificPopup.close();
					}
				});
            }

        });
	});		
		
		



	////////////////////////////////////////////////////////
	///// shortcode insertion
	
	var base = '.gg_sc_wizard_lb ';
	
	
	// gallery
	$(document).delegate('#gg_insert_gallery', "click", function () {
		var gid = $(base +'#gg_gall_choose').val();
		var sc = '[g-gallery gid="'+gid+'"';
		
		if( $(base +'#gg_random').is(':checked') ) {
			sc = sc + ' random="1"';
		}

		if( $(base +'#gg_watermark').is(':checked') ) {
			sc = sc + ' watermark="1"';
		}
		
		if( $(base +'#gg_tag_filter').is(':checked') ) {
			sc = sc + ' filters="1"';
		}
		
		if( $(base +'#gg_gall_filter').is(':checked') ) {
			sc = sc + ' search="1"';
		}
		
		if( $(base +'#gg_gall_pagination').val() ) {
			sc = sc + ' pagination="'+ $('#gg_gall_pagination').val() +'"';
		}
		
		// overlay add-on
		if( $(base +'#gg_sc_gall [name=gg_custom_overlay]').length && $(base +'#gg_sc_gall [name=gg_custom_overlay]').val() ) {
			sc = sc + ' overlay="'+ $(base +'#gg_sc_gall [name=gg_custom_overlay]').val() +'"';	
		}
		
		sc = sc + ']';
		gg_sc_add_to_editor(sc);
	});
	
	
	
	// image-to-gallery
	$(document).delegate('#gg_insert_itg', "click", function () {
		var cid = $(base +' [name=gg_itg_gall]').val();
		var sc = '[g-itg gid="'+cid+'"';
		
		// box width
		sc = sc + ' width="'+ parseInt($(base +' [name=gg_itg_w]').val()) + $(base +' [name=gg_itg_w_type]').val() +'"';
		
		// image's height
		sc = sc + ' img_h="'+ parseInt($(base +' [name=gg_itg_h]').val()) + $(base +' [name=gg_itg_h_type]').val() +'"';
		
		// layout
		if( $(base +' [name=gg_itg_layout]').val() ) {
			sc = sc + ' layout="'+ $(base +' [name=gg_itg_layout]').val() +'"';
		}
		
		// images shown
		sc = sc + ' img_num="'+ parseInt($(base +' [name=gg_itg_img_num]').val()) +'"';
		
		// custom font size
		var cfs = parseFloat( $(base +' [name=gg_itg_font_size]').val()  );
		if(cfs > 3) {cfs = 3}
		if(cfs) {
			sc = sc + ' font_size="'+ cfs +'"';	
		}
		
		// randomize
		if( $(base +' [name=gg_itg_random]').is(':checked') ) {
			sc = sc + ' random="1"';
		}
		
		// watermark
		if( $(base +' [name=gg_itg_watermark]').is(':checked') ) {
			sc = sc + ' watermark="1"';
		}
		
		// custom text within shortcode - otherwise close it
		if( $.trim( $(base +' [name=gg_itg_cust_txt]').val() )) {
			sc = sc + ']'+ $.trim( $(base +' [name=gg_itg_cust_txt]').val().replace(/(?:\r\n|\r|\n)/g, '<br />') ) +'[/g-itg]';
		}
		else {
			sc = sc + '][/g-itg]';	
		}
		
		gg_sc_add_to_editor(sc);
	});
	
	
	
	// collection
	$(document).delegate('#gg_insert_collection', "click", function () {
		var cid = $(base +'#gg_collection_choose').val();
		var sc = '[g-collection cid="'+cid+'"';
		
		// filters
		if( $(base +'#gg_coll_filter').is(':checked') ) {
			sc = sc + ' filter="1"';
		}

		// randomize
		if( $(base +'#gg_coll_random').is(':checked') ) {
			sc = sc + ' random="1"';
		}
		
		// page sys
		if( $(base +'#gg_coll_pagination').val() ) {
			sc = sc + ' pag_sys="'+ $(base +'#gg_coll_pagination').val() +'"';
		}
		
		//  gall per page
		if( $(base +'#gg_coll_pagination').val() && parseInt($(base +'#gg_coll_per_page').val(), 10) ) {
			sc = sc + ' per_page="'+ parseInt($(base +'#gg_coll_per_page').val(), 10) +'"';
		}
		
		// overlay add-on
		if( $(base +'#gg_sc_coll [name=gg_custom_overlay]').length  && $(base +'#gg_sc_coll [name=gg_custom_overlay]').val() ) {
			sc = sc + ' overlay="'+ $(base +'#gg_sc_coll [name=gg_custom_overlay]').val() +'"';	
		}

		sc = sc + ']';
		gg_sc_add_to_editor(sc);
	});
	
	
	
	// slider
	$(document).delegate('#gg_insert_slider', "click", function () {
		var gid = $(base +'#gg_slider_gallery').val();
		var sc = '[g-slider gid="'+gid+'"';
		
		var sl_w = parseInt($(base +'#gg_slider_w').val());
		var sl_w_t = $(base +'#gg_slider_w_type').val();
		sl_w = (isNaN(sl_w) || sl_w == 0) ? 100 + sl_w_t : sl_w + sl_w_t;
		sc = sc + ' width="'+sl_w+'"';
		
		var sl_h = parseInt($(base +'#gg_slider_h').val());
		var sl_h_t = $(base +'#gg_slider_h_type').val();
		sl_h = (isNaN(sl_h) || sl_h == 0) ? 55 + sl_h_t : sl_h + sl_h_t;
		sc = sc + ' height="'+sl_h+'"';
		
		if( $(base +'#gg_slider_random').is(':checked') ) {
			sc = sc + ' random="1"';	
		}
		
		if( $(base +'#gg_slider_watermark').is(':checked') ) {
			sc = sc + ' watermark="1"';
		}
		
		if( $(base +'#gg_slider_autop').val() != 'auto' ) {
			sc = sc + ' autoplay="'+ $(base +'#gg_slider_autop').val() +'"';
		}
		
		sc = sc + ']';
		gg_sc_add_to_editor(sc);
	});
	
	
	
	// carousel
	$(document).delegate('#gg_insert_carousel', "click", function () {
		var gid = $(base +'#gg_car_gallery').val();
		var sc = '[g-carousel gid="'+gid+'"';
		
		sc = sc + ' img_max_w="'+ parseInt($(base +'#gg_car_max_w').val()) +'"';	
		
		sc = sc + ' height="'+ parseInt($(base +'#gg_car_h').val()) +'"';	
		
		sc = sc + ' h_type="'+ $(base +'#gg_car_h_type').val() +'"';	
		
				
		if( parseInt($(base +'#gg_car_rows').val()) > 1 ) {
			sc = sc + ' rows="'+ $(base +'#gg_car_rows').val() +'"';	
		}
		
		if( $(base +'#gg_car_multiscroll').is(':checked') ) {
			sc = sc + ' multiscroll="1"';	
		}
		
		if( $(base +'#gg_car_center_mode').is(':checked') ) {
			sc = sc + ' center="1"';	
		}
		
		if( $(base +'#gg_car_nocrop').is(':checked') ) {
			sc = sc + ' nocrop="1"';	
		}
		if( $(base +'#gg_car_static').is(':checked') ) {
			sc = sc + ' static="1"';	
		}
		
		if( $(base +'#gg_car_random').is(':checked') ) {
			sc = sc + ' random="1"';	
		}
		
		if( $(base +'#gg_car_watermark').is(':checked') ) {
			sc = sc + ' watermark="1"';
		}
		
		if( $(base +'#gg_car_autop').val() != 'auto' ) {
			sc = sc + ' autoplay="'+ $(base +'#gg_car_autop').val() +'"';
		}
		
		// overlay add-on
		if( $(base +'#gg_sc_carousel [name=gg_custom_overlay]').length && $(base +'#gg_sc_carousel [name=gg_custom_overlay]').val() ) {
			sc = sc + ' overlay="'+ $(base +'#gg_sc_carousel [name=gg_custom_overlay]').val() +'"';	
		}
		
		sc = sc + ']';
		gg_sc_add_to_editor(sc);
	});
	
	
	
	// add the shortcode in the editor
	gg_sc_add_to_editor = function(sc) {
		if(typeof(gg_inserting_sc) != 'undefined') {clearTimeout(gg_inserting_sc);}
		var textarea_cursor_pos = 9999;
		
		gg_inserting_sc = setTimeout(function() {
			if( $('#wp-content-editor-container > textarea').is(':visible') ) {
				var content = $('#wp-content-editor-container > textarea').val()
				var newContent = content.substr(0, textarea_cursor_pos) + sc + content.substr(textarea_cursor_pos);
				
				$('#wp-content-editor-container > textarea').val(newContent);				
				textarea_cursor_pos = 9999;
			}
			else {
				tinyMCE.activeEditor.execCommand('mceInsertContent', 0, sc);
			}
			
			// closes magpopup
			$.magnificPopup.close();
		}, 100);
	};

})(jQuery);
