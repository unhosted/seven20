var seven20NavLinks = JSON.parse('[{"url":"about.htm", "name":"Home"},{"url":"index.html", "name":"Manage"}, {"url":"dashboard.htm","name":"Dashboard"}]');

var modalHtml = '<div class="modal-header">' +
    '<button type="button" class="close" data-dismiss="modal">×</button>' +
    '<h3>##header##</h3>' +
    '</div>' +
    '<div class="modal-body">##body##</div>' +
    '<div class="modal-footer">' +
    '<a href="#" class="btn" data-dismiss="modal">Close</a>' +
    '<a href="#" class="btn btn-primary" id="importButton">Import</a>' +
    '</div>';
var zipImportHtml = '<input type="file" id="files" name="files[]"><div id="uploadObjects"></div>';
var jsonImportHtml = '';
var zipFileToImport;

function getData(request, callback, data, host, port)
{
    makeAjax(request, callback, "GET", data, host, port);
}

function setData(request, callback, data, host, port)
{
    makeAjax(request, callback, "PUT", data, host, port);
}

function deleteData(request, callback, data, host, port)
{
    makeAjax(request, callback, "DELETE", data, host, port);
}

function makeAjax(request, callback, type, data, host, port)
{
    if (type === '' || type === undefined)
        type = "GET";
    if (port === '' || port === undefined)
        port = 8080;
    if (host === '' || host === undefined)
    {
        if( window.location.host === '')
                host = "http://localhost";
        else
            host = 'http://' + window.location.host;
    }

    $.ajax({
        url:host + ':' + port + request,
        type: type,
        data: data,
        //dataType:'json',
        //contentType: 'Content-Type: application/json',
        success:function(data){callback(data);},
        error:function(xhr, textStatus, errorThrown)
        { callback('ajax request failure:' + textStatus + '\nxhr:' +  xhr + '\nerror:' + errorThrown);}
    });
}

function showMessage(msg, title, type) {
    if(type === undefined)
        type = 'success';
    if (msg === '') {
        $(o.messageSelector).hide();
    } else {
        $.pnotify({
            title: title,
            text: msg,
            type: type,
            icon: false
        });
    }
}

function deleteAllLocalStorage()
{
    localStorage.clear();
    refreshTabs();
}

function showGridData(path)
{
    var target = '[data-path="' + path + '"]';
    if($(target).prev('a').data() !== null)
    {
        $('#dataGrid').seven20Grid.clear();
        $('#dataGrid').seven20Grid.setDataPath(path);
        $($(target).prev('a').data().objectIds).each(function(i, item){
            var id = path + item;
            $('#dataGrid').seven20Grid.insert(remoteStorage.root.getObject(id), id);
        });
    }
}

function importFromZip()
{
    $('#importModal').html(modalHtml.replace("##header##","Import from zip file").replace("##body##", zipImportHtml));
    $('#files').bind('change',handleFileSelect);
    $('#importButton').bind('click',importZipFile);
    $('#importModal').modal();
}

function importZipFile()
{
    $.each(zipFileToImport.files, function(k, v) {
        if(k.charAt(k.length - 1) != '/')
        {
            var path = "/" + k.split('.')[0];
            var data = {};
            if(v.data != "")
                data = JSON.parse(v.data);
            var type = data['@type'];
            remoteStorage.root.setObject(type, path, data);
        }
    });

    //window.location = "index.html";
    $(this).prev().click();
    refreshTabs();
}

function refreshTabs()
{
    $('#dataGrid').seven20Navigator.refreshTabs();
    loadDownloadifyButton();
}

function loadDownloadifyButton()
{
    Downloadify.create('downloadify',{
        data: function(){
            return exportData().generate();
        },
        dataType: 'base64',
        filename: function(){
            return "remoteStorage-" + new Date().toISOString().slice(0, 10) + ".zip";
        },
        onComplete: function(){
            alert('Your File Has Been Saved!');
        },
        onCancel: function(){
            alert('You have cancelled the saving of this file.');
        },
        onError: function(){
            alert('You must put something in the File Contents or there will be nothing to save!');
        },
        transparent: false,
        swf: 'media/downloadify.swf',
        downloadImage: 'img/download.png',
        width: 100,
        height: 30,
        append: false
    });
}

function handleFileSelect(evt) {
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
                parseZipFileToString(zip);
                zipFileToImport = zip;
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
    $('#importModal').modal();
}

function exportData()
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
            folder.file(listing[i] + ".json",JSON.stringify(remoteStorage.root.getObject(path + listing[i])));
        }
    }
}

(function ($) {
    $.fn.slideRight = function (options)
    {
        var target = this;
        var left = 0;
        var opac = 1;
        var currClass = 'icon-chevron-left';
        var newClass = 'icon-chevron-right';

        if (target.css('opacity') !== '0.25') {
            left = target.width();
            opac = 0.25;
            var temp = currClass;
            currClass = newClass;
            newClass = temp;
        }
        $(target).find('i').removeClass(currClass).addClass(newClass);

        target.css({
            left: left
        }).animate({
                opacity: opac,
                right: -(target.width())
            }, 200, function() {});
    };

    $.fn.slideLeft = function (options)
    {
        var target = this;
        var right = 0;
        var opac = 1;
        var currClass = 'icon-chevron-right';
        var newClass = 'icon-chevron-left';
        var expandMiddle = "-=" + target.width();
        var expandRight = "-=" + target.width() - 100;

        if (target.css('opacity') !== '0.25') {
            right= target.width();
            opac = 0.25;
            var temp = currClass;
            currClass = newClass;
            newClass = temp;
            expandMiddle = "+=" + target.width();
            expandRight = "+=" + target.width() - 100;
        }
        $(target).find('i').removeClass(currClass).addClass(newClass);

        target.css({
            right: target.width()
        }).animate({
                opacity: opac,
                right: right
            }, 200, function() {});
        $(target).next().animate({left: -right, width: expandMiddle}, 200, function() {});
        $(target).next().next().animate({left: -right}, 200, function() {});
    };

    $.fn.fadeAndRemove = function (options)
    {
        $(this).fadeOut(500, function() { $(this).remove(); });
    };

    $.fn.serializeFormJSON = function()
    {
        var o = {};
        var a = this.serializeArray();
        $.each(a, function() {
            if (o[this.name]) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };
})(jQuery);