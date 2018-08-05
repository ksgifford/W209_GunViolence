$(function() {
  
   $(document).on('scroll resize', function() {
      
     var docST = $(document).scrollTop(),
         docWidth = $(document).width(),
         docHeight = $(document).height(),
         wndHeight = $(window).height(),
         value = docST / (docHeight - wndHeight) * docWidth;
     
     $('div#scroll-bar').width( value + 'px' );
     
   });
  
});