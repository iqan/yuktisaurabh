jQuery(document).ready(function($) {

    var rtl, slider_auto;
    
    if( blossom_wedding_data.rtl == '1' ){
        rtl = true;
    }else{
        rtl = false;
    }

    if( blossom_wedding_data.auto == '1' ){
        slider_auto = true;
    }else{
        slider_auto = false;
    }

    $('.main-navigation ul li.menu-item-has-children').find('> a').after('<button class="submenu-toggle"><i class="fas fa-chevron-down"></i></button>');
    $('.site-header .toggle-btn').on( 'click', function(){
        $('.main-navigation').animate({
            width: 'toggle',
        });
    });

    $('.main-navigation .close').on( 'click', function(){
        $('.main-navigation').animate({
            width: 'toggle',
        });
    });

    $('.menu-item-has-children .submenu-toggle').on( 'click', function(){
        $(this).toggleClass('active');
        $(this).siblings('.sub-menu').slideToggle();
    });

    //for accessibility
    $('.main-navigation ul li a').on( 'focus', function() {
        $(this).parents('li').addClass('focused');
    }).on( 'blur', function() {
        $(this).parents('li').removeClass('focused');
    });

    $('.site-banner .owl-carousel').owlCarousel({
        items: 1,
        autoplay: slider_auto,
        loop: true,
        nav: true,
        lazyload: true,
        dots: true,
        autoplaySpeed: 800,
        autoplayTimeout : 4000,
        animateOut: 'fadeOut',
        rtl:rtl,
        responsive : {
            0 : {
                dots: false,
            }, 
            768 : {
                dots: true,
            }
        }
    });

    if($('.owl-carousel .owl-nav').hasClass('disabled')){
        $('.owl-carousel').addClass('control-disabled');
    }else {
        $('.owl-carousel').removeClass('control-disabled');
    }

    //scroll down js
    $('.scroll-down').on( 'click', function(){
        $('html, body').animate({
            scrollTop: $('.scroll-down').parent().next().offset().top
        }, 1000);
    });

    $('section[class*="-section"] .widget .widget-title').append('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 82 12"><defs><style>.a{fill:none;stroke:#e39696;stroke-width:2px;}</style></defs><g transform="translate(-8.2 -9.1)"><path class="a" d="M49.2,15.1,14.929,20m0,0c-.3,0-.6.1-.8.1a5,5,0,1,1,4.925-5" transform="translate(0 0)"/><g transform="translate(49.2 10.1)"><path class="a" d="M49,15.1l34.271-4.9m0,0c.3,0,.6-.1.8-.1a5,5,0,1,1-4.925,5" transform="translate(-49 -10.1)"/></g></g></svg>');

    $('.site-footer .widget .widget-title, .widget-area .widget .widget-title').wrapInner('<span></span>');


    //show/hide back to top
    $(window).on( 'scroll', function(){
        if($(this).scrollTop() > 300) {
            $('#back-to-top').addClass('active');
        } else {
            $('#back-to-top').removeClass('active');
        }
    });

    //scroll to top jquery
    $('#back-to-top').on( 'click', function(){
        $('html,body').animate({
            scrollTop: 0
        }, 600);
    });
    
    //Ajax for Add to Cart
    $('.btn-simple').on( 'click', function() {        
        $(this).addClass('adding-cart');
        var product_id = $(this).attr('id');
        
        $.ajax ({
            url     : blossom_wedding_data.ajax_url,  
            type    : 'POST',
            data    : 'action=blossom_wedding_add_cart_single&product_id=' + product_id,    
            success : function(results){
                $('#'+product_id).replaceWith(results);
            }
        }).done(function(){
            var cart = $('#cart-'+product_id).val();
            $('.cart .number').html(cart);         
        });
    });

});