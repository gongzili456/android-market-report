(function($, win, doc, undefined) {
  $('.app-content').css('minHeight', $(window).height());
  var $headerNavs = $('.menu li a');
  $headerNavs.each(function() {
    var url = win.location.href;
    var link = $(this).attr('href');
    if (url.indexOf(link) != -1) {
      $(this).addClass('cur');
    }
  });
})(jQuery, window, document);
