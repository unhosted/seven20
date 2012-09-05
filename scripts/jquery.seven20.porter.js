(function ($) {
    $.fn.seven20Porter = function (options) {
        var defaultOptions =
        {
            'importerHtml':
                '<div class="btn-group">' +
                '<button class="btn btn-primary io-btn dropdown-toggle" data-toggle="dropdown">Import from file <span class="caret"></span></button>' +
                '<ul class="dropdown-menu">' +
                '<li><a name="importZip">zip</a></li>' +
                '<li><a name="importJSON">json</a></li>' +
                '</ul>' +
                '</div><div></div>' +
                '<div class="btn-group">' +
                '<button class="btn btn-inverse io-btn dropdown-toggle" data-toggle="dropdown">Export to file<span class="caret"></span></button>' +
                '<ul class="dropdown-menu">' +
                '<li><a id="downloadify">zip</a></li>' +
                '</ul>' +
                '</div>' +
                '<div class="modal hide" id="importModal">' +
                '</div>' +
                '<p><p><button class="btn btn-danger io-btn" onclick="deleteAllLocalStorage(); return false;">Clear all local storage</button></p>' +
                '<p><button class="btn btn-info io-btn" onclick="refreshTabs(); return false;">Refresh Folders</button></p></p>',
            'importZipFunction': null,
            'importJSONFunction': null
        };
        var o = $.extend(defaultOptions, options);

        return this.each(function () {
            var t = $(this);

            function init() {
                $(t).html(o.importerHtml);

                if(o.importZipFunction == null) {
                    o.importZipFunction = importFromZip;
                }
                if(o.importJSONFunction == null) {
                    o.importJSONFunction = importFromJSON;
                }

                $(t).find('a[name="importJSON"]').click(o.importJSONFunction);
                $(t).find('a[name="importZip"]').click(o.importZipFunction);
            }

            function getUniqueId(object, lastResort)
            {
                var idNames = ["@id", "id", "_id"];

                for(var i in idNames)
                {
                    if(object[idNames[i]] != undefined)
                    {
                        return object[idNames[i]];
                    }
                }

                return lastResort;
            }

            function importJsonObject(type, path, object) {

                for (var i in object) {
                    var childName = i;
                    var child = object[i];

                    if (child instanceof Object)
                    {
                        var newPath = path + "/" + childName
                        if(child instanceof Array)
                        {
                            for (var j in child) {
                                var id = getUniqueId(child[j], j);
                                importJsonObject('file', newPath + "/" + id, child[j]);
                            }
                            object[i] = "path:" + newPath + "/";
                        }
                        else
                        {
                            importJsonObject("file", newPath + "/" + i, child);
                            object[i] = "path:" + newPath;
                        }
                    }
                }
                remoteStorage.root.setObject(type, path, object);
            }

            function importJsonFile()
            {
                importJsonObject('file', getBaseFolder(), fileToImport);

                $(this).prev().click();
                refreshTabs();
            }

            function displayJsonImport(data)
            {
                $.each(data, function(k, v) {
                    $('#uploadObjects').append(k + "<br>");
                });
            }

            function importFromZip()
            {
                $('#importModal').html(modalHtml.replace("##header##","Import from zip file").replace("##body##", zipImportHtml));
                $('#files').bind('change',handleZipFileSelect);
                $('#importButton').attr('disabled', 'disabled');
                $('#importModal').modal();
            }

            function getBaseFolder()
            {
                var baseFolder = $('#baseFolder').val();

                if(baseFolder.length != 0)
                {
                    if(baseFolder[0] != "/")
                        baseFolder = "/" + baseFolder;
                    if(baseFolder[baseFolder.length - 1] == "/")
                        baseFolder = baseFolder.substr(0, baseFolder.length - 2)
                }
                else
                    baseFolder = "/";

                return baseFolder;
            }

            function importZipFile()
            {
                var baseFolder = getBaseFolder();

                $.each(fileToImport.files, function(k, v) {
                    if(k.charAt(k.length - 1) != '/')
                    {
                        var path = baseFolder + k.split('.')[0];
                        var data = {};
                        if(v.data != "")
                            data = JSON.parse(v.data);
                        var type = data['@type'];
                        remoteStorage.root.setObject(type, path, data);
                    }
                });

                $('#importModal').modal('hide');
                refreshTabs();
            }

            function handleJsonFileSelect(evt, types, cb)
            {
                var types = ['text/plain','application/json'];

                var files = evt.target.files; // FileList object

                // Loop through the FileList and render image files as thumbnails.
                for (var i = 0, f; f = files[i]; i++) {

                    // Only process image files.
                    if (!types.indexOf(f.type.match) == -1)
                    {
                        continue;
                    }

                    var reader = new FileReader();

                    // Closure to capture the file information.
                    reader.onload = (function(theFile) {
                        return function(e) {
                            var s = e.target.result.replace(/(\r\n|\n|\r)/gm,"");
                            fileToImport = JSON.parse(s);
                            displayJsonImport(fileToImport);
                            $('#importButton').bind('click',importJsonFile).removeAttr('disabled');
                        };
                    })(f);

                    //Read in the image file as a data URL.
                    reader.readAsText(f);
                }
            }

            function handleZipFileSelect(evt) {
                var files = evt.target.files; // FileList object

                // Loop through the FileList and render image files as thumbnails.
                for (var i = 0, f; f = files[i]; i++) {

                    // Only process image files.
                    if (!(f.type.match('application/x-zip-compressed') ||
                        f.type.match('application/zip'))) {
                        continue;
                    }

                    var reader = new FileReader();

                    // Closure to capture the file information.
                    reader.onload = (function(theFile) {
                        return function(e) {

                            var zip = new JSZip();
                            var data = e.target.result.split(',')[1];
                            zip.load(data, {base64:true});
                            fileToImport = zip;
                            parseZipFileToString(zip)
                            $("#importButton").bind('click',importZipFile).removeAttr('disabled');
                        };
                    })(f);

                    // Read in the image file as a data URL.
                    reader.readAsDataURL(f);
                }
            }

            function parseZipFileToString(zip)
            {
                $('#uploadObjects').html("<p>folders and files to be uploaded:</p>")
                $.each(zip.files, function(k, v) {

                    $('#uploadObjects').append(k + "<br>");
                });
            }

            function importFromJSON()
            {
                $('#importModal').html(modalHtml.replace("##header##","Import from json string").replace("##body##", jsonImportHtml));
                $('#files').bind('change',handleJsonFileSelect);
                $('#importButton').attr('disabled', 'disabled');
                $('#importModal').modal();
            }

            function exportDataToZip()
            {
                var zip = new JSZip();

                addFilesToFolder(zip, '/');

                return zip;
                var content = zip.generate();
                location.href="data:application/zip;base64,"+content;
            }

            function addFilesToFolder(folder, path)
            {
                var nextFolder;
                var listing = remoteStorage.root.getListing(path);

                for(var i=0; i<listing.length; i++) {
                    if(listing[i].charAt(listing[i].length - 1) == '/')
                    {
                        nextFolder = folder.folder(listing[i].replace(/\//g,""));
                        addFilesToFolder(nextFolder, path + listing[i]);
                    }
                    else
                    {
                        folder.file(listing[i],JSON.stringify(remoteStorage.root.getObject(path + listing[i])));
                    }
                }
            }

            init();
        });
    }
})(jQuery);