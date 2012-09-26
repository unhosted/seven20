
var bootstrapNavHtml = '<div class="navbar navbar-fixed-top">' +
      '<div class="navbar-inner">' +
        '<div class="container-fluid">' +
          '<a class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse">' +
            '<span class="icon-bar"></span>' +
            '<span class="icon-bar"></span>' +
            '<span class="icon-bar"></span>' +
          '</a>' +
          '<a class="brand" href="#">Project name</a>' +
          '<div id="widget"></div>' +
          '<div class="nav-collapse">' +
            '<ul class="nav">' +
              '##links##' +
            '</ul>' +
          '</div><!--/.nav-collapse -->' +
        '</div>' +
      '</div>' +
    '</div>';

var bootstrapNavLinkHtml = '<li class="##class##"><a href="##url##" name="##name##">##name##</a></li>';

function bootstrapNav(target, projectName, links, clickEvents)
{
	var navHtml = bootstrapNavHtml;
    var navLinks = "";

	if( projectName !== '' && projectName !== undefined)
		navHtml = navHtml.replace(/Project name/g, projectName);

    if(links instanceof Array){
        for(i = 0; i < links.length; i++){
            var css = '';
            var newLink = "";
            if(window.location.pathname.substr(window.location.pathname.lastIndexOf("/") + 1) == links[i].url)
                css = "active";
            newLink = bootstrapNavLinkHtml.replace("##class##", css).replace(/##name##/g, links[i].name);
            if(clickEvents != null && clickEvents[i] != null)
            {
                $(target).delegate('a[name="' + links[i].name + '"]','click', clickEvents[i]);
                newLink = newLink.replace("##url##", "");
            }
            else
                newLink = newLink.replace("##url##", links[i].url);
            navLinks += newLink;
        }
    }

    navHtml = navHtml.replace(/##links##/g,navLinks);
	$(target).html(navHtml);
}