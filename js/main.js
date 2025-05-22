/** 
 * ===================================================================
 * main js
 *
 * ------------------------------------------------------------------- 
 */ 

(function($) {

	"use strict";

	/*---------------------------------------------------- */
	/* Preloader
	------------------------------------------------------ */ 
   $(window).load(function() {

      // will first fade out the loading animation 
    	$("#loader").fadeOut("slow", function(){

        // will fade out the whole DIV that covers the website.
        $("#preloader").delay(300).fadeOut("slow");

      });       

  	})


  	/*---------------------------------------------------- */
  	/* FitText Settings
  	------------------------------------------------------ */
  	setTimeout(function() {

   	$('#intro h1').fitText(1, { minFontSize: '42px', maxFontSize: '84px' });

  	}, 100);


	/*---------------------------------------------------- */
	/* FitVids
	------------------------------------------------------ */ 
  	$(".fluid-video-wrapper").fitVids();


	/*---------------------------------------------------- */
	/* Owl Carousel
	------------------------------------------------------ */ 
	$("#owl-slider").owlCarousel({
        navigation: false,
        pagination: true,
        itemsCustom : [
	        [0, 1],
	        [700, 2],
	        [960, 3]
	     ],
        navigationText: false
    });


	/*----------------------------------------------------- */
	/* Alert Boxes
  	------------------------------------------------------- */
	$('.alert-box').on('click', '.close', function() {
	  $(this).parent().fadeOut(500);
	});	


	/*----------------------------------------------------- */
	/* Stat Counter
  	------------------------------------------------------- */
   var statSection = $("#stats"),
       stats = $(".stat-count");

   statSection.waypoint({

   	handler: function(direction) {

      	if (direction === "down") {       		

			   stats.each(function () {
				   var $this = $(this);

				   $({ Counter: 0 }).animate({ Counter: $this.text() }, {
				   	duration: 4000,
				   	easing: 'swing',
				   	step: function (curValue) {
				      	$this.text(Math.ceil(curValue));
				    	}
				  	});
				});

       	} 

       	// trigger once only
       	this.destroy();      	

		},
			
		offset: "90%"
	
	});	


	/*---------------------------------------------------- */
	/*	Masonry
	------------------------------------------------------ */
	var containerProjects = $('#folio-wrapper');

	containerProjects.imagesLoaded( function() {

		containerProjects.masonry( {		  
		  	itemSelector: '.folio-item',
		  	resize: true 
		});

	});


	/*----------------------------------------------------*/
	/*	Modal Popup
	------------------------------------------------------*/
   $('.item-wrap a').magnificPopup({

      type:'inline',
      fixedContentPos: false,
      removalDelay: 300,
      showCloseBtn: false,
      mainClass: 'mfp-fade'

   });

   $(document).on('click', '.popup-modal-dismiss', function (e) {
   	e.preventDefault();
   	$.magnificPopup.close();
   });

	
	/*-----------------------------------------------------*/
  	/* Navigation Menu
   ------------------------------------------------------ */  
   var toggleButton = $('.menu-toggle'),
       nav = $('.main-navigation');

   function isMobile() {
       return window.innerWidth <= 768;
   }

   // toggle button
   toggleButton.on('click', function(e) {
        if (!isMobile()) return; // Only toggle on mobile
		e.preventDefault();
		toggleButton.toggleClass('is-clicked');
		nav.slideToggle();
	});

   // nav items
   nav.find('li a').on("click", function() {
        if (!isMobile()) return;
    	// update the toggle button 		
    	toggleButton.toggleClass('is-clicked'); 
    	// fadeout the navigation panel
    	nav.fadeOut();    		
   });

   // Always show nav on desktop
   function handleResize() {
       if (!isMobile()) {
           nav.show();
           toggleButton.removeClass('is-clicked');
       } else {
           nav.hide();
       }
   }
   $(window).on('resize', handleResize);
   $(document).ready(handleResize);


   /*---------------------------------------------------- */
  	/* Highlight the current section in the navigation bar
  	------------------------------------------------------ */
	var sections = $("section"),
	navigation_links = $("#main-nav-wrap li a");	

	sections.waypoint( {

       handler: function(direction) {

		   var active_section;

			active_section = $('section#' + this.element.id);

			if (direction === "up") active_section = active_section.prev();

			var active_link = $('#main-nav-wrap a[href="#' + active_section.attr("id") + '"]');			

         navigation_links.parent().removeClass("current");
			active_link.parent().addClass("current");

		}, 

		offset: '25%'
	});


	/*---------------------------------------------------- */
  	/* Smooth Scrolling
  	------------------------------------------------------ */
  	$('.smoothscroll').on('click', function (e) {
	 	
	 	e.preventDefault();

   	var target = this.hash,
    	$target = $(target);

    	$('html, body').stop().animate({
       	'scrollTop': $target.offset().top
      }, 800, 'swing', function () {
      	window.location.hash = target;
      });

  	});  
  

   /*---------------------------------------------------- */
	/*  Placeholder Plugin Settings
	------------------------------------------------------ */ 
	$('input, textarea, select').placeholder()  


  	/*---------------------------------------------------- */
	/*	contact form
	------------------------------------------------------ */

	/* local validation */
	$('#contactForm').validate({

		/* submit via ajax */
		submitHandler: function(form) {

			var sLoader = $('#submit-loader');

			$.ajax({      	

		      type: "POST",
		      url: "inc/sendEmail.php",
		      data: $(form).serialize(),
		      beforeSend: function() { 

		      	sLoader.fadeIn(); 

		      },
		      success: function(msg) {

	            // Message was sent
	            if (msg == 'OK') {
	            	sLoader.fadeOut(); 
	               $('#message-warning').hide();
	               $('#contactForm').fadeOut();
	               $('#message-success').fadeIn();   
	            }
	            // There was an error
	            else {
	            	sLoader.fadeOut(); 
	               $('#message-warning').html(msg);
		            $('#message-warning').fadeIn();
	            }

		      },
		      error: function() {

		      	sLoader.fadeOut(); 
		      	$('#message-warning').html("Something went wrong. Please try again.");
		         $('#message-warning').fadeIn();

		      }

	      });     		
  		}

	});


 	/*----------------------------------------------------- */
  	/* Back to top
   ------------------------------------------------------- */ 
	var pxShow = 300; // height on which the button will show
	var fadeInTime = 400; // how slow/fast you want the button to show
	var fadeOutTime = 400; // how slow/fast you want the button to hide
	var scrollSpeed = 300; // how slow/fast you want the button to scroll to top. can be a value, 'slow', 'normal' or 'fast'

   // Show or hide the sticky footer button
	jQuery(window).scroll(function() {

		if (!( $("#header-search").hasClass('is-visible'))) {

			if (jQuery(window).scrollTop() >= pxShow) {
				jQuery("#go-top").fadeIn(fadeInTime);
			} else {
				jQuery("#go-top").fadeOut(fadeOutTime);
			}

		}		

	});		

	// --- Animated Carousel Slider Logic ---
	function initAnimatedSlider(sliderSelector, options = {}) {
	    var $slider = $(sliderSelector);
	    var $track = $slider.find('.slider-track');
	    var $slides = $track.find('.slide');
	    var totalSlides = $slides.length;
	    var currentIndex = 0;
	    var autoplay = options.autoplay || false;
	    var autoplayInterval = options.autoplayInterval || 3000;
	    var autoplayTimer = null;
	    var isHovered = false;

	    function getSlideWidth() {
	        return $slides.eq(0).outerWidth(true);
	    }

	    function updateSliderPosition() {
	        var offset = -currentIndex * getSlideWidth();
	        $track.css('transform', 'translateX(' + offset + 'px)');
	    }

	    function goToNext() {
	        if (currentIndex < totalSlides - 1) {
	            currentIndex++;
	        } else {
	            currentIndex = 0;
	        }
	        updateSliderPosition();
	    }

	    function goToPrev() {
	        if (currentIndex > 0) {
	            currentIndex--;
	        } else {
	            currentIndex = totalSlides - 1;
	        }
	        updateSliderPosition();
	    }

	    $slider.find('.slider-prev').off('click').on('click', function() {
	        goToPrev();
	    });

	    $slider.find('.slider-next').off('click').on('click', function() {
	        goToNext();
	    });

	    // Autoplay logic
	    function startAutoplay() {
	        if (autoplay && !autoplayTimer) {
	            autoplayTimer = setInterval(function() {
	                if (!isHovered) {
	                    goToNext();
	                }
	            }, autoplayInterval);
	        }
	    }
	    function stopAutoplay() {
	        if (autoplayTimer) {
	            clearInterval(autoplayTimer);
	            autoplayTimer = null;
	        }
	    }
	    $slider.on('mouseenter', function() {
	        isHovered = true;
	    });
	    $slider.on('mouseleave', function() {
	        isHovered = false;
	    });

	    // Initialize position
	    updateSliderPosition();
	    if (autoplay) {
	        startAutoplay();
	    }
	    // Clean up on window unload
	    $(window).on('unload', function() { stopAutoplay(); });
	}

    // Initialize cert-slider only on desktop
    function checkAndInitCertSlider() {
        if (window.innerWidth > 900) {
            initAnimatedSlider('.cert-slider');
            $('.cert-slider .slider-arrow').show();
        } else {
            $('.cert-slider .slider-track').css('transform', 'translateX(0)');
            $('.cert-slider .slider-arrow').hide();
        }
    }

    // Initialize project-slider (always, with autoplay)
    function initProjectSlider() {
        initAnimatedSlider('.project-slider', { autoplay: true, autoplayInterval: 3000 });
    }

    $(document).ready(function(){
        checkAndInitCertSlider();
        initProjectSlider();
    });

    $(window).on('resize', function(){
        checkAndInitCertSlider();
    });


	// --- Project Grid Horizontal Scroll for Mobile ---

})(jQuery);