
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

var bootstrapNavLinkHtml = '<li class="##class##"><a href="##url##">##name##</a></li>';

function bootstrapNav(target, projectName, links)
{
	var navHtml = bootstrapNavHtml;
    var navLinks = "";

	if( projectName !== '' && projectName !== undefined)
		navHtml = navHtml.replace(/Project name/g, projectName);

    if(links instanceof Array){
        for(i = 0; i < links.length; i++){
            var css = '';
            if(window.location.pathname.substr(window.location.pathname.lastIndexOf("/") + 1) == links[i].url)
                css = "active";
            navLinks += bootstrapNavLinkHtml.replace("##url##", links[i].url).replace("##class##", css).replace("##name##", links[i].name);
        }
    }

    navHtml = navHtml.replace(/##links##/g,navLinks);

	$(target).html(navHtml);
}