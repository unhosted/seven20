seven20
=======

a jQuery plugin for a grid that interacts directly with remoteStorage

demo
=======
There is a current version of the app running at http://epiccms.net that uses remoteStorage.js version 0.7 (local only)

installation
=======

add the files to your website


quickstart
=======

This will build a grid and populate it with data from the /public/ folder.
$('#dataGrid').seven20Grid({ dataPath: "/public/" });

The plugin also comes with a left menu called navigator, but populating this is a bit more complicated atm.
$('#dataGrid').seven20Navigator({navSelector:'#sidebar'});
 
 license
===========
Unlicense (will update when the website comes back online)