// custom field type for number + unit dropdown

!function($) {
	var merge_vals = function($subj) {
		var num = parseInt($subj.find('input[type=number]').val());
		if(isNaN(num)) {num = 80;}
		
		var unit = $subj.find('select').val();
		
		$subj.find('input[type=hidden]').val( num + unit );	
	}
	
	// on unit change
	$('.gg_num_unit_wrap select').change(function() {
		var $subj = $(this).parents('.gg_num_unit_wrap');
		merge_vals($subj);
	});
	
	// on unit change
	$(".gg_num_unit_wrap input[type=number]").bind('keyup change click', function (e) {
		var $subj = $(this).parents('.gg_num_unit_wrap');
		merge_vals($subj);
	});
}(window.jQuery);