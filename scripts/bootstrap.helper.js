
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
              '<li class="active"><a href="#">Home</a></li>' +
              '<li><a href="#about">About</a></li>' +
              '<li><a href="#contact">Contact</a></li>' +
            '</ul>' +
          '</div><!--/.nav-collapse -->' +
        '</div>' +
      '</div>' +
    '</div>';

function bootstrapNav(target, projectName)
{
	var navHtml = bootstrapNavHtml;

	if( projectName !== '' && projectName !== undefined)
		navHtml = navHtml.replace(/Project name/g, projectName);

	$(target).html(navHtml);
}