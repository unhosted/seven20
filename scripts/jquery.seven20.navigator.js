(function ($) {
    $.fn.seven20Navigator = function (options) {
        var defaultOptions =
        {
            'navSelector': $('#nav'),
            'navEntrySelector': 'ul.nav-list li',
            'navHeaderSelector': '.nav-header',
            'navEntryNames': ["collections", "public", "new"],
            'navEntryTemplate': '<li class="nav-header" >##name##</li>',
            'navTabPaneTemplate': '<div class="tab-pane ##class##" id="##tab##"><p>##content##</p></div>',
            'navTemplate': '<div class="slide-right-button"><i class="icon-chevron-left"></i></div><ul class="nav nav-tabs">##tabs##</ul><div class="tab-content">##tabs-content##</div>',
            'navTabHeaderTemplate':'<li class="##class##"><a href="##tab##" data-toggle="tab">##name##</a></li>'
        };
        var o = $.extend(defaultOptions, options);

        return this.each(function () {
            var $t = $(this);

            function populateNav(data, selector, action) {
                // Show loading animation

                $.each(data, function (i, item) {
                    var entryClass = 'nav-entry';
                    if (item.name.toUpperCase() === objectname.toUpperCase())
                        entryClass += ' active';

                    var item_html = "<li><a class='" + entryClass + "' href='/" + action + "/" + item.name + "'><span>" + item.name + "</span></a></li>";
                    $(item_html).insertAfter(selector);
                });
            }

            function init() {

                var navHtml = o.navTemplate;
                var navHeaderHtml = "";
                var navContentHtml = "";
                for (var i in o.navEntryNames) {
                    var css = '';
                    if(i === "0")
                        css = 'active';

                    var navTabHtml = o.navTabHeaderTemplate;
                    navTabHtml = navTabHtml.replace(/##name##/g, o.navEntryNames[i]).replace(/##class##/g, css).replace(/##tab##/g,'#tab' + i);
                    navHeaderHtml += navTabHtml;
                    navContentHtml += o.navTabPaneTemplate.replace(/##class##/g, css).replace(/##tab##/g,'tab' + i).replace(/##content##/g, o.tabContent[i]);
                }
                navHtml = navHtml.replace(/##tabs##/g, navHeaderHtml).replace(/##tabs-content##/g, navContentHtml);
                $(o.navSelector).append(navHtml);
                $(o.navSelector).addClass('tabbable well grid-height');
                $t.find('.slide-right-button').bind('click', function () {
                    $(this).parent().slideLeft();
                });
            }

            init();
        });
    }
})(jQuery);