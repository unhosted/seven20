(function ($) {
    $.fn.seven20Navigator = function (options) {
        var defaultOptions =
        {
            'navSelector': $('#nav'),
            'navEntrySelector': 'ul.nav-list li',
            'navHeaderSelector': '.nav-header',
			'tabContent': [],
			'navigationFolders':[],
			'folderOnClick': '',
            'navEntryNames': ["folders", "public"],
			'folderTemplate' : '<li><a class="nav-header" onclick="##onClick##"><i class="icon-blank"></i>##name##</a><ul data-path="##fullpath##" class="nav nav-list"></ul></li>',
            'navEntryTemplate': '<li class="nav-header" >##name##</li>',
            'navTabPaneTemplate': '<div class="tab-pane ##class##" id="##tab##"><p>##content##</p></div>',
            'navTemplate': '<div class="slide-right-button"><i class="icon-chevron-left"></i></div><ul class="nav nav-tabs">##tabs##</ul><div class="tab-content">##tabs-content##</div>',
            'navTabHeaderTemplate':'<li class="##class##"><a href="##tab##" data-toggle="tab">##name##</a></li>'
        };
        var o = $.extend(defaultOptions, options);

        return this.each(function () {
            var $t = $(this);

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
				
				$.each(o.navigationFolders, function (i, item) {
					buildFolder('#tab' + i, item, '');
				});
				$("#tab0").delegate('a.nav-header', 'dblclick', function () {
					$(this).next().slideToggle();
				});
                $("#tab1").delegate('a.nav-header', 'dblclick', function () {
                    $(this).next().slideToggle();
                });
				setNavigationIcons();
            }
			
			function buildFolder(target, path, fullPath)
			{
				var child = buildFolderContents(path, fullPath);
				var selector = '[data-path="' + fullPath + path + '"]';
				if($(target).find(selector).length == 0)
					$(target).append(child.element);
				else
					$(target).find(selector).append(child.element).prev('a').data('object-ids', child.objectIds).addClass(child.css);

				return target;
			}

			function buildFolderContents(path, pathRoot) {
				if(path.substr(-1) != '/') {
					return '';
				}

				if(pathRoot === undefined)
					pathRoot = '';

				var fullPath = pathRoot + path;
				var listing = remoteStorage.root.getListing(fullPath);
				var navList = '', prevList='';
				var nav = $('');
				var ret = JSON.parse('{}');

				var objectIds = [];
				for(var i=0; i<listing.length; i++) {
					var css = "";
					navList = '';
					if(listing[i].charAt(listing[i].length - 1) == '/')
					{
						var onClick = '';
						if(o.folderOnClick !== '')
							onClick = o.folderOnClick + "(\'##fullpath##\');";
						navList = $(o.folderTemplate.replace("##onClick##", onClick).replace(/##path##/g,path+listing[i]).replace(/##name##/g,listing[i]).replace(/##fullpath##/g, fullPath + listing[i]));
						nav = nav.add(buildFolder(navList, listing[i], fullPath));
					}
					else
					{
						objectIds.push(listing[i]);
						css = "has-data";
					}
				}
				ret['element'] = nav;
				ret['objectIds'] = objectIds;
				ret['css'] = css;

				return ret;
			}

			function setNavigationIcons()
			{
				$('.nav-header').each(function(i, item){
					if (item.text ==  "MONEY/")
					{
						$(item).find('i').removeClass('icon-blank').addClass('icon-fire');
					}
					if (item.text ==  "PUBLIC/")
					{
						$(item).find('i').removeClass('icon-blank').addClass('icon-globe');
					}
				});
			}

            init();
        });
    }
})(jQuery);