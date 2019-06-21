function initMenu() {
     $('#nav ul').hide();
     $('#nav li a').click(

     function () {
        
         var checkElement = $(this).next();
         if ((checkElement.is('ul')) && (checkElement.is(':visible'))) {
             checkElement.slideToggle('normal');
             //alert('Hello');
         }
         if ((checkElement.is('ul')) && (!checkElement.is(':visible'))) {
             //removeActiveClassFromAll();
             $(this).addClass("active");
             //$('#nav ul:visible').slideToggle('normal');
             checkElement.slideToggle('normal');
             return false;
         }
         
         if($(this).siblings('ul').length==0 && $(this).parent().parent().attr('id')=='nav')
         {
             
            // removeActiveClassFromAll();
             $(this).addClass("active");
             //$('#nav ul:visible').slideToggle('normal');             
             return false;
         }
     });
 }
 $(document).ready(function () {
     initMenu();
     $("ul.menu li").first().find('a').click();

 });
 $('#nav').children('li').each(function () {
     if ($(this).children('ul').css('display') == 'block') {
         $(this).children('ul').slideToggle('normal')
         $(this).children('a').removeClass('active')
     }
})