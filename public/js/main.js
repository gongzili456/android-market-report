(function($, win, doc, undefined) {
  $('.app-content').css('minHeight', $(window).height());
  var $headerNavs = $('ul.nav li');
  $headerNavs.each(function() {
    var url = win.location.href;
    url = url.substring(url.lastIndexOf('/'));
    var link = $(this).find('a').attr('href');
    if (url ===link) {
      $(this).addClass('active');
    }
  });
})(jQuery, window, document);
