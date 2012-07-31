(function() {
  var exports={}, deps={};
  function define(name, relDeps, code){
    exports[name]=code;
    var dir = name.substring(0,name.lastIndexOf('/')+1);
    deps[name]=[];
    for(var i=0;i<relDeps.length;i++) {
      if(relDeps[i].substring(0,2)=='./') {//TODO: proper path parsing here
        relDeps[i]=relDeps[i].substring(2);
      }
      if(relDeps[i].substring(0,3)=='../') {//TODO: proper path parsing here
        relDeps[i]=relDeps[i].substring(3);
        var dirParts = dir.split('/');
        dirParts.pop();
        dirParts.pop();
        dir = dirParts.join('/');
        if(dir.length) {
          dir += '/';
        }
      }
      deps[name].push(dir+relDeps[i]);
    }
  }
  function _loadModule(name) {
    if(name=='require') {//not including that one, out!
      return function(){};
    }
    var modNames = deps[name];
    var mods={};
    console.log('loading module '+name);
    console.log('typeof dependencies: '+typeof(modNames));
    for(var i=0;i<modNames.length;i++) {
      mods[modNames[i]]=_loadModule(modNames[i]);
    }
    var modList=[];
    for(var i=0;i<modNames.length;i++) {
      modList.push(mods[modNames[i]]);
    }
    return exports[name].apply({}, modList);
  }

define('lib/platform',[], function() {
  function ajaxBrowser(params) {
    var timedOut = false;
    var timer;
    if(params.timeout) {
      timer = window.setTimeout(function() {
        timedOut = true;
        params.error('timeout');
      }, params.timeout);
    }
    var xhr = new XMLHttpRequest();
    if(!params.method) {
      params.method='GET';
    }
    xhr.open(params.method, params.url, true);
    if(params.headers) {
      for(var header in params.headers) {
        xhr.setRequestHeader(header, params.headers[header]);
      }
    }
    xhr.onreadystatechange = function() {
      if((xhr.readyState==4) && (!timedOut)) {
        if(timer) {
          window.clearTimeout(timer);
        }
        if(xhr.status==200 || xhr.status==201 || xhr.status==204 || xhr.status==207) {
          params.success(xhr.responseText, xhr.getAllResponseHeaders());
        } else {
          params.error(xhr.status);
        }
      }
    }
    if(typeof(params.data) === 'string') {
      xhr.send(params.data);
    } else {
      xhr.send();
    }
  }
  function ajaxExplorer(params) {
    //this won't work, because we have no way of sending the Authorization header. It might work for GET to the 'public' category, though.
    var xdr=new XDomainRequest();
    xdr.timeout=params.timeout || 3000;//is this milliseconds? documentation doesn't say
    xdr.open(params.method, params.url);
    xdr.onload=function() {
      if(xdr.status==200 || xdr.status==201 || xdr.status==204) {
        params.success(xhr.responseText);
      } else {
        params.error(xhr.status);
      }
    };
    xdr.onerror = function() {
      err('unknown error');//See http://msdn.microsoft.com/en-us/library/ms536930%28v=vs.85%29.aspx
    };
    xdr.ontimeout = function() {
      err(timeout);
    };
    if(params.data) {
      xdr.send(params.data);
    } else {
      xdr.send();
    }
  }
  function ajaxNode(params) {
    var http=require('http'),
      https=require('https'),
      url=require('url');
    if(!params.method) {
      params.method='GET';
    }
    if(!params.data) {
      params.data = null;
    }
    var urlObj = url.parse(params.url);
    var options = {
      method: params.method,
      host: urlObj.hostname,
      path: urlObj.path,
      port: (urlObj.port?port:(urlObj.protocol=='https:'?443:80)),
      headers: params.headers
    };
    var timer, timedOut;
    var lib = (urlObj.protocol=='https:'?https:http);
    var request = lib.request(options, function(response) {
      var str='';
      response.setEncoding('utf8');
      response.on('data', function(chunk) {
        str+=chunk;
      });
      response.on('end', function() {
        if(timer) {
          clearTimeout(timer);
        }
        if(!timedOut) {
          if(response.statusCode==200 || response.statusCode==201 || response.statusCode==204) {
            params.success(str);
          } else {
            params.error(response.statusCode);
          }
        }
      });
    });
    request.on('error', function(e) {
      params.error(e.message);
    });
    if(params.timeout) {
      timer = setTimeout(function() {
        params.error('timeout');
        timedOut=true;
      }, params.timeout);
    }
    if(params.data) {
      request.end(params.data);
    } else {
      request.end();
    }
  }
  function parseXmlBrowser(str, cb) {
    var tree=(new DOMParser()).parseFromString(str, 'text/xml')
    //var nodes=tree.getElementsByTagName('Link');
    var nodes=tree.documentElement.childNodes;
    var obj={
      Link: []
    };
    for(var i=0; i<nodes.length; i++) {
      var link={};
      if(nodes[i].attributes) {
        for(var j=0; j<nodes[i].attributes.length;j++) {
          link[nodes[i].attributes[j].name]=nodes[i].attributes[j].value;
        }
      }
      if(link['rel']) {
        obj.Link.push({
          '@': link
        });
      }
    }
    cb(null, obj);   
  }
  function parseXmlNode(str, cb) {
    var xml2js=require('xml2js');
    new xml2js.Parser().parseString(str, cb);
  }

  function harvestTokenNode() {
  }
  function harvestTokenBrowser() {
    if(location.hash.length) {
      var pairs = location.hash.substring(1).split('&');
      for(var i=0; i<pairs.length; i++) {
        if(pairs[i].substring(0, 'access_token='.length) == 'access_token=') {
          return pairs[i].substring('access_token='.length);
        }
      }
    }
  }
  function setElementHtmlNode(eltName, html) {
  }
  function setElementHtmlBrowser(eltName, html) {
    document.getElementById(eltName).innerHTML = html;
  }
  function getElementValueNode(eltName) {
  }
  function getElementValueBrowser(eltName) {
    return document.getElementById(eltName).value;
  }
  function eltOnNode(eltName, eventType, cb) {
  }
  function eltOnBrowser(eltName, eventType, cb) {
    if(eventType == 'click') {
      document.getElementById(eltName).onclick = cb;
    } else if(eventType == 'hover') {
      document.getElementById(eltName).onmouseover = cb;
    } else if(eventType == 'type') {
      document.getElementById(eltName).onkeyup = cb;
    }
  }
  function getLocationBrowser() {
    //TODO: deal with http://user:a#aa@host.com/ although i doubt someone would actually use that even once between now and the end of the internet
    return window.location.href.split('#')[0];
  }
  function getLocationNode() {
  }
  function setLocationBrowser(location) {
    window.location = location;
  }
  function setLocationNode() {
  }
  function alertBrowser(str) {
    alert(str);
  }
  function alertNode(str) {
    console.log(str);
  }
  if(typeof(window) === 'undefined') {
    return {
      ajax: ajaxNode,
      parseXml: parseXmlNode,
      harvestToken: harvestTokenNode,
      setElementHTML: setElementHtmlNode,
      getElementValue: getElementValueNode,
      eltOn: eltOnNode,
      getLocation: getLocationNode,
      setLocation: setLocationNode,
      alert: alertNode
    }
  } else {
    if(window.XDomainRequest) {
      return {
        ajax: ajaxExplorer,
        parseXml: parseXmlBrowser,
        harvestToken: harvestTokenBrowser,
        setElementHTML: setElementHtmlBrowser,
        getElementValue: getElementValueBrowser,
        eltOn: eltOnBrowser,
        getLocation: getLocationBrowser,
        setLocation: setLocationBrowser,
        alert: alertBrowser
      };
    } else {
      return {
        ajax: ajaxBrowser,
        parseXml: parseXmlBrowser,
        harvestToken: harvestTokenBrowser,
        setElementHTML: setElementHtmlBrowser,
        getElementValue: getElementValueBrowser,
        eltOn: eltOnBrowser,
        getLocation: getLocationBrowser,
        setLocation: setLocationBrowser,
        alert: alertBrowser
      };
    }
  }
});

define('lib/webfinger',
  ['./platform'],
  function (platform) {

      ///////////////
     // Webfinger //
    ///////////////

    function userAddress2hostMetas(userAddress, cb) {
      var parts = userAddress.toLowerCase().split('@');
      if(parts.length < 2) {
        cb('That is not a user address. There is no @-sign in it');
      } else if(parts.length > 2) {
        cb('That is not a user address. There is more than one @-sign in it');
      } else {
        if(!(/^[\.0-9a-z\-\_]+$/.test(parts[0]))) {
          cb('That is not a user address. There are non-dotalphanumeric symbols before the @-sign: "'+parts[0]+'"');
        } else if(!(/^[\.0-9a-z\-]+$/.test(parts[1]))) {
          cb('That is not a user address. There are non-dotalphanumeric symbols after the @-sign: "'+parts[1]+'"');
        } else {
          var query = '?resource=acct:'+encodeURIComponent(userAddress);
          cb(null, [
            'https://'+parts[1]+'/.well-known/host-meta.json'+query,
            'https://'+parts[1]+'/.well-known/host-meta'+query,
            'http://'+parts[1]+'/.well-known/host-meta.json'+query,
            'http://'+parts[1]+'/.well-known/host-meta'+query
            ]);
        }
      }
    }
    function fetchXrd(addresses, timeout, cb) {
      var firstAddress = addresses.shift();
      if(firstAddress) {
        platform.ajax({
          url: firstAddress,
          success: function(data) {
            parseAsJrd(data, function(err, obj){
              if(err) {
                parseAsXrd(data, function(err, obj){
                  if(err) {
                    fetchXrd(addresses, timeout, cb);
                  } else {
                    cb(null, obj);
                  }
                });
              } else {
                cb(null, obj);
              }
            });
          },
          error: function(data) {
            fetchXrd(addresses, timeout, cb);
          },
          timeout: timeout
        });
      } else {
        cb('could not fetch xrd');
      }
    }
    function parseAsXrd(str, cb) {
      platform.parseXml(str, function(err, obj) {
        if(err) {
          cb(err);
        } else {
          if(obj && obj.Link) {
            var links = {};
            if(obj.Link && obj.Link['@']) {//obj.Link is one element
              if(obj.Link['@'].rel) {
                links[obj.Link['@'].rel]=obj.Link['@'];
              }
            } else {//obj.Link is an array
              for(var i=0; i<obj.Link.length; i++) {
                if(obj.Link[i]['@'] && obj.Link[i]['@'].rel) {
                  links[obj.Link[i]['@'].rel]=obj.Link[i]['@'];
                }
              }
            }
            cb(null, links);
          } else {
            cb('found valid xml but with no Link elements in there');
          }
        }
      });
    }
    function parseAsJrd(str, cb) {
      var obj;
      try {
        obj = JSON.parse(str);
      } catch(e) {
        cb('not valid JSON');
        return;
      }
      var links = {};
      for(var i=0; i<obj.links.length; i++) {
        //just take the first one of each rel:
        if(obj.links[i].rel) {
          links[obj.links[i].rel]=obj.links[i];
        }
      }
      cb(null, links);
    }
    function parseRemoteStorageLink(obj, cb) {
      //FROM:
      //{
      //  api: 'WebDAV',
      //  template: 'http://host/foo/{category}/bar',
      //  auth: 'http://host/auth'
      //}
      //TO:
      //{
      //  type: 'https://www.w3.org/community/unhosted/wiki/remotestorage-2011.10#webdav',
      //  href: 'http://host/foo/',
      //  legacySuffix: '/bar'
      //  properties: {
      //    'access-methods': ['http://oauth.net/core/1.0/parameters/auth-header'],
      //    'auth-methods': ['http://oauth.net/discovery/1.0/consumer-identity/static'],
      //    'auth-endpoint': 'http://host/auth'
      //  }
      //}
      if(obj && obj['auth'] && obj['api'] && obj['template']) {
        var storageInfo = {};
        if(obj['api'] == 'simple') {
          storageInfo['type'] = 'https://www.w3.org/community/unhosted/wiki/remotestorage-2011.10#simple';
        } else if(obj['api'] == 'WebDAV') {
          storageInfo['type'] = 'https://www.w3.org/community/unhosted/wiki/remotestorage-2011.10#webdav';
        } else if(obj['api'] == 'CouchDB') {
          storageInfo['type'] = 'https://www.w3.org/community/unhosted/wiki/remotestorage-2011.10#couchdb';
        } else {
          cb('api not recognized');
          return;
        }

        var templateParts = obj['template'].split('{category}');
        if(templateParts[0].substring(templateParts[0].length-1)=='/') {
          storageInfo['href'] = templateParts[0].substring(0, templateParts[0].length-1);
        } else {
          storageInfo['href'] = templateParts[0];
        }
        storageInfo.properties = {
          "access-methods": ["http://oauth.net/core/1.0/parameters/auth-header"],
          "auth-methods": ["http://oauth.net/discovery/1.0/consumer-identity/static"],
          "auth-endpoint": obj['auth']
        };
        if(templateParts.length == 2 && templateParts[1] != '/') {
          storageInfo.properties['legacySuffix'] = templateParts[1];
        }
        cb(null, storageInfo);
      } else if(obj
          && obj['href']
          && obj['type']
          && obj['properties']
          && obj['properties']['auth-endpoint']
          ) {
        cb(null, obj);
      } else {
        cb('could not extract storageInfo from lrdd');
      }
    }
    function getStorageInfo(userAddress, options, cb) {
      userAddress2hostMetas(userAddress, function(err1, hostMetaAddresses) {
        if(err1) {
          cb(err1);
        } else {
          fetchXrd(hostMetaAddresses, options.timeout, function(err2, hostMetaLinks) {
            if(err2) {
              cb('could not fetch host-meta for '+userAddress);
            } else {
              if(hostMetaLinks['remoteStorage']) {
                parseRemoteStorageLink(hostMetaLinks['remoteStorage'], cb);
              } else if(hostMetaLinks['remotestorage']) {
                parseRemoteStorageLink(hostMetaLinks['remoteStorage'], cb);
              } else if(hostMetaLinks['lrdd'] && hostMetaLinks['lrdd'].template) {
                var parts = hostMetaLinks['lrdd'].template.split('{uri}');
                var lrddAddresses=[parts.join('acct:'+userAddress), parts.join(userAddress)];
                 fetchXrd(lrddAddresses, options.timeout, function(err4, lrddLinks) {
                  if(err4) {
                    cb('could not fetch lrdd for '+userAddress);
                  } else if(lrddLinks['remoteStorage']) {
                    parseRemoteStorageLink(lrddLinks['remoteStorage'], cb);
                  } else if(lrddLinks['remotestorage']) {
                    parseRemoteStorageLink(lrddLinks['remotestorage'], cb);
                  } else {
                    cb('could not extract storageInfo from lrdd');
                  }
                }); 
              } else {
                cb('could not extract lrdd template from host-meta');
              }
            }
          });
        }
      });
    }
    return {
      getStorageInfo: getStorageInfo
    }
});

define('lib/hardcoded',
  ['./platform'],
  function (platform) {
    var guesses={
      //'dropbox.com': {
      //  api: 'Dropbox',
      //  authPrefix: 'http://proxy.unhosted.org/OAuth.html?userAddress=',
      //  authSuffix: '',
      //  templatePrefix: 'http://proxy.unhosted.org/Dropbox/',
      //  templateSuffix: '/{category}/'
      //},
      //'gmail.com': {
      //  api: 'GoogleDocs',
      //  authPrefix: 'http://proxy.unhosted.org/OAuth.html?userAddress=',
      //  authSuffix: '',
      //  templatePrefix: 'http://proxy.unhosted.org/GoogleDocs/',
      //  templateSuffix: '/{category}/'
      //},
      'iriscouch.com': {
        type: 'https://www.w3.org/community/unhosted/wiki/remotestorage-2011.10#couchdb',
        authPrefix: 'http://proxy.unhosted.org/OAuth.html?userAddress=',
        hrefPrefix: 'http://proxy.unhosted.org/CouchDb',
        pathFormat: 'host/user'
      }
    };
    (function() {
      var surfnetSaml= {
        type: 'https://www.w3.org/community/unhosted/wiki/remotestorage-2011.10#simple',
        authPrefix: 'https://storage.surfnetlabs.nl/saml/oauth/authorize?user_address=',
        hrefPrefix: 'https://storage.surfnetlabs.nl/saml',
        pathFormat: 'user@host'
      };
      var surfnetBrowserId= {
        type: 'https://www.w3.org/community/unhosted/wiki/remotestorage-2011.10#simple',
        authPrefix: 'https://storage.surfnetlabs.nl/browserid/oauth/authorize?user_address=',
        hrefPrefix: 'https://storage.surfnetlabs.nl/browserid',
        pathFormat: 'user@host'
      };
      var dutchUniversitiesNoSaml= ['leidenuniv.nl', 'leiden.edu', 'uva.nl', 'vu.nl', 'eur.nl', 'maastrichtuniversity.nl',
        'ru.nl', 'rug.nl', 'uu.nl', 'tudelft.nl', 'utwente.nl', 'tue.nl', 'tilburguniversity.edu', 'uvt.nl', 'wur.nl',
        'wageningenuniversity.nl', 'ou.nl', 'lumc.nl', 'amc.nl',
        'ahk.nl', 'cah.nl', 'driestar.nl', 'che.nl', 'chn.nl', 'hen.nl', 'huygens.nl', 'diedenoort.nl', 'efa.nl', 'dehaagsehogeschool.nl',
        'hasdenbosch.nl', 'inholland.nl', 'hsbrabant.nl', 'dehorst.nl', 'kempel.nl', 'domstad.nl', 'hsdrenthe.nl', 'edith.nl', 'hsleiden.nl',
        'interport.nl', 'schumann.nl', 'hsbos.nl', 'hva.nl', 'han.nl', 'hvu.nl', 'hesasd.nl', 'hes-rdam.nl', 'hku.nl', 'hmtr.nl',
        'hzeeland.nl', 'hotelschool.nl', 'ichtus-rdam.nl', 'larenstein.nl', 'iselinge.nl', 'koncon.nl', 'kabk.nl', 'lhump.nl', 'msm.nl', 'hsmarnix.nl',
        'nhtv.nl', 'nth.nl', 'nhl.nl', 'sandberg.nl', 'hsij.nl', 'stoas.nl', 'thrijswijk.nl', 'tio.nl', 'vhall.nl', 'chw.nl', 'hogeschoolrotterdam.nl'];
      var dutchUniversitiesSaml= ['surfnet.nl', 'fontys.nl'];
      for(var i=0;i<dutchUniversitiesSaml.length;i++) {
        guesses[dutchUniversitiesSaml[i]]=surfnetSaml;
      }
      for(var i=0;i<dutchUniversitiesNoSaml.length;i++) {
        guesses[dutchUniversitiesNoSaml[i]]=surfnetBrowserId;
      }
    })();

    function testIrisCouch(userAddress, options, cb) {
      platform.ajax({
        url: 'http://proxy.unhosted.org/irisCouchCheck?q=acct:'+userAddress,
        //url: 'http://proxy.unhosted.org/lookup?q=acct:'+userAddress,
        success: function(data) {
          var obj;
          try {
            obj=JSON.parse(data);
          } catch(e) {
          }
          if(!obj) {
            cb('err: unparsable response from IrisCouch check');
          } else {
            cb(null, obj);
          }
        },
        error: function(err) {
          cb('err: during IrisCouch test:'+err);
        },
        timeout: options.timeout,
        //data: userName
      });
    }
    function mapToIrisCouch(userAddress) {
      var parts=userAddress.split('@');
      if(['libredocs', 'mail', 'browserid', 'me'].indexOf(parts[0]) == -1) {
        return parts[0]+'@iriscouch.com';
      } else {
        return parts[2].substring(0, parts[2].indexOf('.'))+'@iriscouch.com';
      }
    }
    function guessStorageInfo(userAddress, options, cb) {
      var parts=userAddress.split('@');
      if(parts.length < 2) {
        cb('That is not a user address. There is no @-sign in it');
      } else if(parts.length > 2) {
        cb('That is not a user address. There is more than one @-sign in it');
      } else {
        if(!(/^[\.0-9A-Za-z]+$/.test(parts[0]))) {
          cb('That is not a user address. There are non-dotalphanumeric symbols before the @-sign: "'+parts[0]+'"');
        } else if(!(/^[\.0-9A-Za-z\-]+$/.test(parts[1]))) {
          cb('That is not a user address. There are non-dotalphanumeric symbols after the @-sign: "'+parts[1]+'"');
        } else {
          while(parts[1].indexOf('.') != -1) {
            if(guesses[parts[1]]) {
              blueprint=guesses[parts[1]];
              cb(null, {
                rel: 'https://www.w3.org/community/unhosted/wiki/personal-data-service-00',
                type: blueprint.type,
                href: blueprint.hrefPrefix+'/'+(blueprint.pathFormat=='user@host'?userAddress:parts[1]+'/'+parts[0]),
                properties: {
                  'access-methods': ['http://oauth.net/core/1.0/parameters/auth-header'],
                  'auth-methods': ['http://oauth.net/discovery/1.0/consumer-identity/static'],
                  'auth-endpoint': blueprint.authPrefix+userAddress
                }
              });
              return;
            }
            parts[1]=parts[1].substring(parts[1].indexOf('.')+1);
          }
          if(new Date() < new Date('9/9/2012')) {//temporary measure to help our 160 fakefinger users migrate learn to use their @iriscouch.com user addresses
            //testIrisCouch(mapToIrisCouch(userAddress), cb);
            testIrisCouch(userAddress, options, cb);
          } else {
            cb('err: not a guessable domain, and fakefinger-migration has ended');
          }
        }
      }
    }
    return {
      guessStorageInfo: guessStorageInfo
    }
});

define('lib/couch',
  ['./platform'],
  function (platform) {
    var shadowCouchRev = null;
    function getShadowCouchRev(url) {
      if(!shadowCouchRev) {
        try {
          shadowCouchRev = JSON.parse(localStorage.getItem('_shadowCouchRev'));
        } catch(e) {
        }
        if(!shadowCouchRev) {
          shadowCouchRev = {};
        }
      }
      return shadowCouchRev[url];
    }
    function setShadowCouchRev(url, rev) {
      if(!shadowCouchRev) {
        try {
          shadowCouchRev=JSON.parse(localStorage.getItem('_shadowCouchRev'));
        } catch(e) {
        }
      }
      if(!shadowCouchRev) {
        shadowCouchRev = {};
      }
      shadowCouchRev[url] = rev;
      localStorage.setItem('_shadowCouchRev', JSON.stringify(shadowCouchRev));
    }
    function doCall(method, url, value, token, cb) {
      var platformObj = {
        url: url,
        method: method,
        error: function(err) {
          if(err == 404) {
            cb(null, undefined);
          } else {
            cb(err, null);
          }
        },
        success: function(data) {
          cb(null, data);
        },
        timeout: 3000
      };
      if(token) {
        platformObj.headers = {Authorization: 'Bearer '+token};
      }
      platformObj.fields = {withCredentials: 'true'};
      if(method!='GET') {
        platformObj.data = value;
      }
      platform.ajax(platformObj);
    }
    function get(url, token, cb) {
      doCall('GET', url, null, token, function(err, data) {
        if(err) {
          cb(err, data);
        } else {
          var obj;
          try {
            obj = JSON.parse(data);
          } catch(e) {
          }
          if(obj && obj._rev) {
            setShadowCouchRev(url, obj._rev);
            cb(null, obj.value);
          } else if(typeof(data) == 'undefined') {
            cb(null, undefined);
          } else {
            cb('unparsable data from couch');
          }
        }
      });
    }
    function put(url, value, mimeType, token, cb) {
      var revision = getShadowCouchRev(url);
      var obj = {
        value: value
      };
      if(revision) {
        obj._rev = revision;
      }
      doCall('PUT', url, JSON.stringify(obj), token, function(err, data) {
        if(err) {
          if(err == 409) {//conflict; fetch, update and retry
            doCall('GET', url, null, token, function(err2, data2) {
              if(err2) {
                cb('after 409, got a '+err2);
              } else {
                var rightRev;
                try {
                  rightRev=JSON.parse(data2)._rev;
                } catch(e) {
                }
                if(rightRev) {
                  obj = {
                    value: value,
                    _rev: rightRev
                  };
                  setShadowCouchRev(url, rightRev);
                    doCall('PUT', url, JSON.stringify(obj), token, function(err3, data3) {
                    if(err3) {
                      cb('after 409, second attempt got '+err3);
                    } else {
                      cb(null);
                    }
                  });
                } else {
                  cb('after 409, got unparseable JSON');
                }
              }
            });
          } else {
            cb(err);
          }
        } else {
          var obj;
          try {
            obj = JSON.parse(data);
          } catch(e) {
          }
          if(obj && obj.rev) {
            setShadowCouchRev(url, obj.rev);
          }
          cb(null);
        }
      });
    }
    function delete_(url, token, cb) {
      var revision = getShadowCouchRev(url);
      doCall('DELETE', url+(revision?'?rev='+revision:''), null, token, function(err, data) {
        if(err == 409) {
          doCall('GET', url, null, token, function(err2, data2) {
            if(err2) {
              cb('after 409, got a '+err2);
            } else {
              var rightRev;
              try {
                rightRev = JSON.parse(data2)._rev;
              } catch(e) {
              }
              if(rightRev) {
                setShadowCouchRev(url, rightRev);
                doCall('DELETE', url + '?rev=' + rightRev, null, token, function(err3, data3) {
                  if(err3) {
                    cb('after 409, second attempt got '+err3);
                  } else {
                    setShadowCouchRev(url, undefined);
                    cb(null);
                  }
                });
              } else {
                cb('after 409, got unparseable JSON');
              }
            }
          });
        } else {
          if(!err) {
            setShadowCouchRev(url, undefined);
          }
          cb(err);
        }
      });
    }
    function set(url, valueStr, cb) {
      if(typeof(valueStr) == 'undefined') {
        return delete_(url, cb);
      } else {
        return put(url, valueStr, cb);
      }
    }
    return {
      get: get,
      set: set
    };
});

define('lib/dav',
  ['./platform'],
  function (platform) {
    function doCall(method, url, value, token, cb, deadLine) {
      var platformObj = {
        url: url,
        method: method,
        error: function(err) {
          cb(err);
        },
        success: function(data) {
          cb(null, data);
        },
        timeout: 3000
      }

      platformObj.headers = {
        'Authorization': 'Bearer ' + decodeURIComponent(token),
        'Content-Type':  'text/plain;charset=UTF-8'
      };

      platformObj.fields = {withCredentials: 'true'};
      if(method != 'GET') {
        platformObj.data =value;
      }

      platform.ajax(platformObj);
    }

    function get(url, token, cb) {
      if(url.substr(-1) == '/') {
        doCall('PROPFIND', url, null, token, function(err, data) {
          if(err == null) {
            //<d:multistatus xmlns:d="DAV:" xmlns:s="http://sabredav.org/ns">
            //  <d:response>
            //    <d:href>/apps/remoteStorage/WebDAV.php/admin/remoteStorage/test/foo/bar/</d:href>
            //    <d:propstat>
            //      <d:prop>
            //        <d:getlastmodified xmlns:b="urn:uuid:c2f41010-65b3-11d1-a29f-00aa00c14882/" b:dt="dateTime.rfc1123">
            //          Tue, 05 Jun 2012 15:48:54 GMT
            //        </d:getlastmodified>
            //        <d:resourcetype>
            //          <d:collection/>
            //        </d:resourcetype>
            //        <d:quota-used-bytes>4105</d:quota-used-bytes>
            //        <d:quota-available-bytes>8516481024</d:quota-available-bytes>
            //      </d:prop>
            //      <d:status>HTTP/1.1 200 OK</d:status>
            //    </d:propstat>
            //  </d:response>
            //  <d:response>
            //    <d:href>/apps/remoteStorage/WebDAV.php/admin/remoteStorage/test/foo/bar/baz</d:href>
            //    <d:propstat>
            //      <d:prop>
            //        <d:getlastmodified xmlns:b="urn:uuid:c2f41010-65b3-11d1-a29f-00aa00c14882/" b:dt="dateTime.rfc1123">
            //          Tue, 05 Jun 2012 16:05:56 GMT
            //        </d:getlastmodified>
            //        <d:getcontentlength>2</d:getcontentlength>
            //        <d:resourcetype/>
            //        <d:getcontenttype>text/plain</d:getcontenttype>
            //      </d:prop>
            //      <d:status>HTTP/1.1 200 OK</d:status>
            //    </d:propstat>
            //  </d:response>
            //</d:multistatus>

            platform.parseXml(data, function(obj) {
              cb(null, obj);
            });
          } else {
            cb(err);
          }
        });
      } else {
        doCall('GET', url, null, token, function(err, data) {
          if(err == 404) {
            cb(null, undefined);
          } else {
            cb(err, data);
          }
        });
      }
    }

    function put(url, value, mimeType, token, cb) {
      doPut(url, value, token, 0, cb);
    }
    function doPut(url, value, token, mkcolLevel, cb) {
      if(mkcolLevel==0) {
        doCall('PUT', url, value, token, function(err, data) {
          if(err == 404) {
            doPut(url, value, token, 1, cb);
          } else {
            cb(err, data);
          }
        });
      } else {
        var urlParts = url.split('/');
        if(urlParts.length<mkcolLevel+3) {
          cb('put failed, looks like server is not compliant (reached root in MKCOL chain)');
        } else {
          doCall('MKCOL', urlParts.slice(0, urlParts.length - mkcolLevel).join('/'), null, token, function(err) {
            if(err==404 || err==409) {
              doPut(url, value, token, mkcolLevel+1, cb);
            } else if(err) {
              cb(err);
            } else {
              doPut(url, value, token, mkcolLevel-1, cb);
            }
          });
        }
      }
    }

    function set(url, valueStr, token, cb) {
      if(typeof(valueStr) == 'undefined') {
        doCall('DELETE', url, null, token, cb);
      } else {
        put(url, valueStr, token, cb);
      }
    }

    return {
      get:    get,
      set:    set
    }
});

define('lib/getputdelete',
  ['./platform'],
  function (platform) {
    function doCall(method, url, value, mimeType, token, cb, deadLine) {
      var platformObj = {
        url: url,
        method: method,
        error: function(err) {
          cb(err);
        },
        success: function(data, headers) {
          cb(null, new Date(headers['Last-Modified']).getTime(), headers['Content-Type']);
        },
        timeout: 3000
      }

      platformObj.headers = {
        'Authorization': 'Bearer ' + token
      }
      if(mimeType) {
        platformObj.headers['Content-Type'] = mimeType;
      }

      platformObj.fields = {withCredentials: 'true'};
      if(method != 'GET') {
        platformObj.data =value;
      }

      platform.ajax(platformObj);
    }

    function get(url, token, cb) {
      doCall('GET', url, null, null, token, function(err, data) {
        if(err == 404) {
          cb(null, undefined);
        } else {
          if(url.substr(-1)=='/') {
            try {
              data = JSON.parse(data);
            } catch (e) {
              cb('unparseable directory index');
              return;
            }
          }
          cb(err, data);
        }
      });
    }

    function put(url, value, mimeType, token, cb) {
      doCall('PUT', url, value, mimeType, token, function(err, data) {
        if(err == 404) {
          doPut(url, value, token, 1, cb);
        } else {
          cb(err, data);
        }
      });
    }

    function set(url, valueStr, mimeType, token, cb) {
      if(typeof(valueStr) == 'undefined') {
        doCall('DELETE', url, null, null, token, cb);
      } else {
        put(url, valueStr, mimeType, token, cb);
      }
    }

    return {
      get:    get,
      set:    set
    }
});

define('lib/wireClient',['./couch', './dav', './getputdelete'], function (couch, dav, getputdelete) {
  var prefix = 'remote_storage_wire_',
    stateHandler = function(){},
    errorHandler = function(){};
  function set(key, value) {
    localStorage.setItem(prefix+key, JSON.stringify(value));
  }
  function remove(key) {
    localStorage.removeItem(prefix+key);
  }
  function get(key) {
    var valStr = localStorage.getItem(prefix+key);
    if(typeof(valStr) == 'string') {
      try {
        return JSON.parse(valStr);
      } catch(e) {
        localStorage.removeItem(prefix+key);
      }
    }
    return null;
  }
  function disconnectRemote() {
    remove('storageType');
    remove('storageHref');
    remove('bearerToken');
  }
  function getState() {
    if(get('storageType') && get('storageHref')) {
      if(get('bearerToken')) {
        return 'connected';
      } else {
        return 'authing';
      }
    } else {
      return 'anonymous';
    }
  }
  function on(eventType, cb) {
    if(eventType == 'state') {
      stateHandler = cb;
    } else if(eventType == 'error') {
      errorHandler = cb;
    }
  }

  function getDriver(type, cb) {
    if(type === 'https://www.w3.org/community/rww/wiki/read-write-web-00#couchdb'
      || type === 'https://www.w3.org/community/unhosted/wiki/remotestorage-2011.10#couchdb') {
      cb(couch);
    } else if(type === 'https://www.w3.org/community/rww/wiki/read-write-web-00#webdav'
      || type === 'https://www.w3.org/community/unhosted/wiki/remotestorage-2011.10#webdav') {
      cb(dav);
    } else {
      cb(getputdelete);
    }
  }
  function resolveKey(storageType, storageHref, basePath, relPath) {
    //var nodirs=true;
    var nodirs=false;
    var itemPathParts = ((basePath.length?(basePath + '/'):'') + relPath).split('/');
    var item = itemPathParts.splice(2).join(nodirs ? '_' : '/');
    return storageHref + '/' + itemPathParts[1]
      //+ (storageInfo.properties.legacySuffix ? storageInfo.properties.legacySuffix : '')
      + '/' + (item[2] == '_' ? 'u' : '') + item;
  }
  function setChain(driver, hashMap, mimeType, token, cb, timestamp) {
    var i;
    for(i in hashMap) {
      break;
    }
    if(i) {
      var thisOne = hashMap[i];
      delete hashMap[i];
      driver.set(i, thisOne, mimeType, token, function(err, timestamp) {
        if(err) {
          cb(err);
        } else {
          setChain(driver, hashMap, mimeType, token, cb, timestamp);
        }
      });
    } else {
      cb(null, timestamp);
    }
  }
  return {
    get: function (path, cb) {
      var storageType = get('storageType'),
        storageHref = get('storageHref'),
        token = get('bearerToken');
      if(typeof(path) != 'string') {
        cb('argument "path" should be a string');
      } else {
        getDriver(storageType, function (d) {
          d.get(resolveKey(storageType, storageHref, '', path), token, cb);
        });
      }
    },
    set: function (path, valueStr, mimeType, parentChain, cb) {
      var storageType = get('storageType'),
        storageHref = get('storageHref'),
        token = get('bearerToken');
      if(typeof(path) != 'string') {
        cb('argument "path" should be a string');
      } else if(typeof(valueStr) != 'string') {
        cb('argument "valueStr" should be a string');
      } else {
        getDriver(storageType, function (d) {
          d.set(resolveKey(storageType, storageHref, '', path), valueStr, mimeType, token, function(err, timestamp) {
            if(d.requiresParentChaining && !err) {
              var resolvedParentChain = {};
              for(var i in parentChain) {
                resolvedParentChain[resolveKey(storageType, storageHref, '', i)] = parentChain[i];
              }
              setChain(d, resolvedParentChain, 'application/json', token, cb);
            } else {
              cb(err, timestamp);
            }
          });
        });
      }
    },
    setStorageInfo   : function(type, href) { set('storageType', type); set('storageHref', href); },
    setBearerToken   : function(bearerToken) { set('bearerToken', bearerToken); },
    disconnectRemote : disconnectRemote,
    on               : on,
    getState         : getState
  };
});

define('lib/store',[], function () {
  var onChange,
    prefixNodes = 'remote_storage_nodes:';
  window.addEventListener('storage', function(e) {
    if(e.key.substring(0, prefixNodes.length == prefixNodes)) {
      e.path = e.key.substring(prefixNodes.length);
      if(onChange && !isDir(e.path)) {
        e.origin='device';
        onChange(e);
      }
    }
  });
  function getNode(path) {
    var valueStr = localStorage.getItem(prefixNodes+path);
    var value;
    if(valueStr) {
      try {
        value = JSON.parse(valueStr);
      } catch(e) {
      }
    }
    if(!value) {
      value = {//this is what an empty node looks like
        startAccess: null,
        startForce: null,
        lastModified: 0,
        outgoingChange: false,
        keep: true,
        data: (isDir(path)?{}:undefined),
        added: {},
        removed: {},
        changed: {},
      };
    }
    return value;
  }
  function isDir(path) {
    if(typeof(path) != 'string') {
      doSomething();
    }
    return path.substr(-1) == '/';
  }
  function getContainingDir(path) {
    // '' 'a' 'a/' 'a/b' 'a/b/' 'a/b/c' 'a/b/c/'
    var parts = path.split('/');
    // [''] ['a'] ['a', ''] ['a', 'b'] ['a', 'b', ''] ['a', 'b', 'c'] ['a', 'b', 'c', ''] 
    if(!parts[parts.length-1].length) {//last part is empty, so string was empty or had a trailing slash
      parts.pop();
    }
    // [] ['a'] ['a'] ['a', 'b'] ['a', 'b'] ['a', 'b', 'c'] ['a', 'b', 'c']
    if(parts.length) {//remove the filename or dirname
      parts.pop();
      // - [] [] ['a'] ['a'] ['a', 'b'] ['a', 'b']
      return parts.join('/')+(parts.length?'/':'');
      // - '' '' 'a/' 'a/' 'a/b/' 'a/b/'
    }
    return undefined;
    // undefined - - - - - -
  }
  function getFileName(path) {
    var parts = path.split('/');
    if(isDir(path)) {
      return parts[parts.length-2]+'/';
    } else {
      return parts[parts.length-1];
    }
  }
  function getCurrTimestamp() {
    return new Date().getTime();
  }
  function updateNode(path, node, changeType) {
    //there are three types of local changes: added, removed, changed.
    //when a PUT or DELETE is successful and we get a Last-Modified header back the parents should already be updated right to the root
    //
    localStorage.setItem(prefixNodes+path, JSON.stringify(node));
    var containingDir = getContainingDir(path);
    if(containingDir) {
      var parentNode=getNode(containingDir);
      if(changeType=='set') { 
        if(parentNode.data[getFileName(path)]) {
          parentNode.changed[getFileName(path)] = new Date().getTime();
        } else {
          parentNode.added[getFileName(path)] = new Date().getTime();
        }
        updateNode(containingDir, parentNode, 'set');
      } else if(changeType=='remove') {
        parentNode.removed[getFileName(path)] = new Date().getTime();
        updateNode(containingDir, parentNode, 'set');
      } else if(changeType=='accept') {
        if(parentNode.data[getFileName(path)] != node.lastModified) {
          parentNode.data[getFileName(path)] = node.lastModified;
          if(parentNode.lastModified < node.lastModified) {
            parentNode.lastModified = node.lastModified;
          }
          updateNode(containingDir, parentNode, 'accept');
        }
      } else if(changeType=='gone') {
        delete parentNode.data[getFileName(path)];
        if(parentNode.lastModified < node.lastModified) {
          parentNode.lastModified = node.lastModified;
        }
        updateNode(containingDir, parentNode, 'accept');
      } else if(changeType=='clear') {
        parentNode.data[getFileName(path)] = node.lastModified;
        delete parentNode.added[getFileName(path)];
        delete parentNode.removed[getFileName(path)];
        delete parentNode.changed[getFileName(path)];
        if(parentNode.lastModified < node.lastModified) {
          parentNode.lastModified = node.lastModified;
        }
        updateNode(containingDir, parentNode, 'accept');
      }
    }
  }
  function forget(path) {
    localStorage.removeItem(prefixNodes+path);

  }
  function forgetAll() {
    for(var i=0; i<localStorage.length; i++) {
      if(localStorage.key(i).substr(0, prefixNodes.length) == prefixNodes) {
        localStorage.removeItem(localStorage.key(i));
      }
    }
  }
  function on(eventName, cb) {
    if(eventName == 'change') {
      onChange = cb;
    } else {
      throw("Unknown event: " + eventName);
    }
  }
  function connect(path, connectVal) {
    var node = getNode(path);
    node.startForcing=(connectVal!=false);
    updateNode(path, node, 'meta');
  }
  function getState(path) {
    return 'disconnected';
  }
  function setNodeData(path, data, outgoing, lastModified, mimeType) {
    var node = getNode(path);
    node.data = data;
    if(lastModified) {
      node.lastModified = lastModified;
    }
    if(mimeType) {
      node.mimeType = mimeType;
    }
    if(outgoing) {
      node.outgoingChange = new Date().getTime();
      updateNode(path, node, (typeof(data)=='undefined'?'remove':'set'));
    } else {
      if(isDir(path)) {
        for(var i in data) {
          delete node.added(i);
        }
        for(var i in node.removed) {
          if(!data[i]) {
            delete node.removed(i);
          }
        }
        updateNode(path, node, 'accept');
      } else {
        if(node.outgoingChange) {
          if(data != node.data && node.outgoingChange > lastModified) {
            //reject the update, outgoing changes will change it
          } else {
            node.data = data;
            node.outgoingChange = false;
            node.lastModified = lastModified;
            updateNode(path, node, 'clear');
          }
        } else {
          updateNode(path, node, (typeof(data)=='undefined'?'gone':'accept'));
        }
      }
    }
  }
  function clearOutgoingChange(path, lastModified) {
    var node = getNode(path);
    node.lastModified = lastModified;
    node.outgoingChange = false;
    updateNode(path, node, 'clear');
  }
  function setNodeAccess(path, claim) {
    var node = getNode(path);
    if((claim != node.startAccess) && (claim == 'rw' || node.startAccess == null)) {
      node.startAccess = claim;
      updateNode(path, node);
    }
  }
  function setNodeForce(path, force) {
    var node = getNode(path);
    node.startForce = force;
    updateNode(path, node);
  }
  return {
    on            : on,//error,change(origin=tab,device,cloud)
   
    getNode       : getNode,
    setNodeData   : setNodeData,
    setNodeAccess : setNodeAccess,
    setNodeForce  : setNodeForce,
    clearOutgoingChange:clearOutgoingChange,
    forget        : forget,
    forgetAll     : forgetAll
  };
});

// access: null
// lastModified: 0
// keep: true
// data
//   tasks/: 999999
//   public/: 999999
// data
//   

//start: store has a tree with three types of node: dir, object, media.
//object and media nodes have fields:
//lastModified, type (media/object), mimeType/objectType, data, access, outgoingChange (client-side timestamp or false), sync
//dir nodes have fields:
//lastModified, type (dir), data (hash filename -> remote timestamp), added/changed/removed, access, startSync, stopSync

define('lib/sync',['./wireClient', './store'], function(wireClient, store) {
  var prefix = '_remoteStorage_', busy=false;
   
  function getState(path) {
    if(busy) {
      return 'busy';
    } else {
      return 'connected';
    }
  }
  function getParentChain(path) {//this is for legacy support
    var pathParts = path.split('/');
    var parentChain={};
    for(var i = 2; i<pathParts.length; i++) {
      var thisPath = pathParts.slice(0, i).join('/');
      parentChain[thisPath] = store.getNode(thisPath).data;
    }
    return parentChain;
  }
  function handleChild(path, lastModified, force, access, startOne, finishOne) {
    console.log('handleChild '+path);
    var node = store.getNode(path);//will return a fake dir with empty data list for item
    if(node.outgoingChange) {
      //TODO: deal with media; they don't need stringifying, but have a mime type that needs setting in a header
      startOne();
      var parentChain = getParentChain(path);
      wireClient.set(path, JSON.stringify(node.data), node.mimeType, parentChain, function(err, timestamp) {
        if(!err) {
          store.clearOutgoingChange(path, timestamp);
        }
        finishOne();
      });
    } else if(node.lastModified<lastModified) {
      if(node.startAccess !== null) { access = node.startAccess; }
      if(node.startForce !== null) { force = node.startForce; }
      if((force || node.keep) && access) {
        startOne();
        wireClient.get(path, function (err, data, timestamp, mimeType) {
          if(data) {
            store.setNodeData(path, data, false, timestamp, mimeType);
          }
          finishOne(err);
          startOne();
          pullMap(path, store.getNode(path).data, force, access, finishOne);
          startOne();
          pullMap(path, store.getNode(path).added, force, access, finishOne);
        });
      } else {
        //store.forget(path);
        startOne();
        pullMap(path, node.data, force, access, finishOne);
        startOne();
        pullMap(path, node.added, force, access, finishOne);
      }
    }// else everything up to date
  }
  function pullMap(basePath, map, force, access, cb) {
    console.log('pullMap '+basePath);
    var outstanding=0, errors=false;
    function startOne() {
      outstanding++;
    }
    function finishOne(err) {
      if(err) {
        errors = true;
      }
      outstanding--;
      if(outstanding==0) {
        cb(errors);
      }
    }
    startOne();
    for(var path in map) {
      handleChild(basePath+path, map[path], force, access, startOne, finishOne);
    }
    finishOne();
  }
  function syncNow(path, cb) {
    busy=true;
    var map={};
    map[path]= Infinity;
    pullMap('', map, false, false, function() {
      busy=false;
      cb();
    });
  }
  return {
    syncNow: syncNow,
    getState : getState
  };
});

define('lib/widget',['./webfinger', './hardcoded', './wireClient', './sync', './store', './platform'], function (webfinger, hardcoded, wireClient, sync, store, platform) {
  var remoteStorageIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANoAAACACAYAAABtCHdKAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAACAASURBVHic7Z132OZE1f8/w25YdnFh6U0QEBWXKshPYFdB0KWEpbyuCC+CoIjiCy9VEETFFylKky5iY4WlidSAIE1hAUF67yBVOixtiTzz++MkPHnmmZlMcud+2uZ7XbnuZHIymeSek3PmzDlnlNaaEYc4mhvYA9gROAb4PUnaM6htajFHQ404RoujqcDRwArAm8B8wO3AniTpDYPZtBZzLkYOo8XRROBY4EuF0heAxQvH5wL7k6T/GsimtWgx/BktjhYAfgJ8FxhtnH0cWN4oexc4EjiKJH2n+w1s0WI4M1ocjQJ2QZhsIQfVfcBKjnNPAweSpGd3oXUtWvTB8GS0ONoAMXJMLKH8J/DZEpqbgL1I0tubaFqLFjYML0aLo+WBXwCbF0p9D/B34Aue86pQx3TgRyTpCx21sUULC4YHo8XReOAHwO7AGOOs7wGuADbynFfG8SzgCOB4kvT9qs1s0cKFuQa7AV7EkSKOdkDGWvsiTKYrbO94zmEpGw8cCtyVTRO0aNEIhi6jxdE6wEzgNGBRqjFMCKP5tuWAPxFHl2fTBi1adIShx2hxtBRxdDpwLbAG9RilU0bLty8CtxJHxxFHC3b5yVuMYAydMVocjQX2QlTEcfQde7n2fWUAJwH/Yyk3x2a2MmXsvwr8DPg1Sfofx/1atLBiaEi0OJoG3AX8GBiLXyW0lbtoO5VoxboXQKYUbiWONmzw6VvMATA9KQYWcbQ64pc4if6dm8B9X9k7lnLloA2lWRFIiKNLEXeux0rqatFikCRaHC1CHJ0M3Egvk2H81pU8xe3dDq510eS/mwF3EEeHE0fzdfhGWoxwDCyjxVFEHO0J3At8k17J0QRTdUN1LLtPhIwr7yWOdiKOhoYq3mLIYeA6RhxtAtyBTAjPT/WOTkV6G6PVqSNkWxQ4BbiROJpU/yW1GKnovtUxjlYEjgK+jFsNM8vM82aZuY+jfEfgD4Vjm7XRLLftV/lVwHnAASTp0477tZjD0D1Gi6MJwI+Q8JVRWamPucp+zX3bsVm+LXBWth/CZOZxVQYr7r+LGHqObsNxWjSvOsbRKOLoO8D9wG70ZbI6KloonXkNiOpIB3V0QjcPcBAyftsm5NW1GLloVqLF0frIXNPKlI+zcPxWURnLGr8R4ljsQ6jamO9XkWrF/TYcZw5GM4wWR8sBPwe2IsyYYdsP+TX3bcdFfAEJlXGhW2qjb386cFAbjjNnoTNGi6OPIOEre9Lfsx7PMQFlxV9Xme24iP8H3OI572K0UIYL3TeP3wIOA45rw3HmDNRjtDhSwNeBw5HkN2VjFkr2fWV4ymzHOXqANZEpBRe6qTaGHD8O7EuSXuxpY4sRgOqMFkdrA78E1qLcMOA7tu2H/Pr2i3gfSWNwt+P8QKiNtmNb2dXA3iTpvY62thjmCGe0OFoKmWz+76ykihRrcrxm7tuOAd5GPgb3O56oU0brlNnM8h7gVODHJOmrjja3GKYoZ7Q4mgfYBziA3vCVMtO2We47JqAMT5ntGOANZIz2kOPJqo7POmW2UIZ7DTgYOKUNxxk58M+jSfjKA0gc1jgLhck8rvIQyVYm1UIYvLi9D6QBdKHtqFqP7x3ZrsuxIHA8kk7hy7QYEbBLtDhaDTgOWK9QWqWThjBI2b7v19y3Hb8ArA082f8Bu6o2diLNzHKAS5Dx26OW52gxTNBXokn4yq+QXPU2JrPB9XX2lYXsd7qlmepV5Zqy+4e2O/S92N6pWT4VuI84+kUbjjN8IYwm4St7AY8A38GtUvo6oI3GVRba4etcm2/5/JSpPobUad4fB71rP5Sxyt'
      +'5ljrmB7wMPE0ffasNxhh/mysJX7kFcp+a30IR0hipf7xAJESJpfHVphMFAGC6UOets5jPY2lX2nlw0JhYDfoOkU5jsuL7FEMRo4BxkeaMqKGO+MsazHfv2bb/mvnn8n8Kvq1NXgSrUU9x3HdvaVxx7udpkjh9tWAQJ/1nhw4uU2gIZV9swG3gJMWxdBlystf7AenOl7gy4v4nJWuu3lFJ7IIGwOTbVWrumV2z33gw4sVC0u9b6Egvd/MBXgQ2BjwPzAs8CtwHTtdYPGPQ7AP8X2g4PDkX4xefWZ0PPaCRpKMik6ZLApwsEvq+4CR9dHalm28fY9zHa+4VfX6c2mcf166K31VUss7WzeM6EjznvBF5HjDxvGHTzAh9z1AnwSSRtxM7AQ0qpnbXWtvXiVvPU4UIeoTHBaEOMex7Thi2N6+c1CZRSOyHLc5na10Qk5nE/pdT+WuujCufmw/9uQjEfIpyqvqOeXNcfj3wd3kKCNJ8ouTCUAasynU81s9H66stVx9RDX2fDU5/r/fjeS8hH7D5kqam5gfWREJxO8CngKqXUlA7rKcMmFek39p1USu0G/A77ECfHXMCRSqlTK967qzAH1WshDsIXIPkVnyOsI+QIlWpVJFvdzcZoTTCXra228yHvxIWc7nFkvYGZyP/RZNbkMcAflFLdtGROVkqNLycDpdSqwFKe8xMQ1S0UuyilhkxaCVu6udHA3sCjwK6IKrkvohZA9a9xCONRYb/4a+4Xy0xGs6l2OVxqYNPjMl+bi3gBcdh+DYnSXrKE3obrEG8eEKZaDEntUJQySwDfAE7w1LMevWq4C285yiNkBdYLSq6Hcum3J6K65UiR8dwlwAfA54D96btW3k+AKUhqiX866v0O8l5yzMD9Pp6ylM1GtAwftCuvo0ZWyrwQiZ9aB9gB+braPESK15UxoI/pbOfLfs39/NhkNBOuMZWvrMq4zNYuG00ROWNdhCxPNdVDW4ZXtdY3G2XnKqVmICkecmyDn9H+obWeXbMNIAzUBKPtbhwfrrX+SeH470qp+4FLC2VfVkp9Smv9EPBvW6WZAaaI5yzvrUhvpob/wEefo2w+RiPhMDcgEm5F5Csym+5KNdtxVVWvaN7vpC5b3WXPUqYimnRvIQ7bE5FcIzcjhoSQuqrCtL6trpQaZaVsBqXjtEx9XddzfmHENS3Hu0g8Xx9orRPgVqP4k2HN7C5CJz4XQuZvpiNp1VYFzkBEtomqUq2MyXx1+rbQMZrr3r422J4j9D0UaWcDJyMM9mdEDToa+IilvqbwEL3vBkRDWbyL9/uoUmqVEpoNETXThWWM46c8UvbBkmsHBTZG83WQ9ZAvxteQxDtrIeplD+4O56vXdo6SffPXtZnzaFUlle3+traWPZsNHyAfqtWRccReiMGjbPWcjqHFudVMozDBRtsgyqRa2fl+jOahfbzk2kFBHVeeeZAwjpnABJJ0e2QweE12vkpH8XXasrrKmMTHaCHtLJN4daRZD/Jh+hxJuiuiit8K7EHvXNRAwJQG3b53p4xmjote8dC+ZBwvZKUaYHTiMzcRuIo4OgZ4jCT9LyQfvakjF1FHqlVlunyrY973tdHFWKGS5xrgiyTpN4DXiaPfIerixxz03cRixrE5+d00JrmmEZRSKwMfLbneNAg1It0HEiajVe3MAN9CfO82J0lnkqQbIVHY9znoTYR0anPf/K3LaL56bO1w0fme6R/AZiTpNODubKngW4CveNrla29HyKxmxbmtD3BY5BpEbua3oeqk9rBEU17giwOnE0dnEkdLkqRXIOrkrvT1MgnpQGVMFiqNXIxWpR5Xm0Ke5z5gO5I0JklvIo4+gRg7jqP+mKgJZvu2cfyg1vq9Buotg4uh5ghGq7I+WsgXd2NgMnH0M+C3JOn5xNFFyLzNXvRXWVx128qx7GOhz5GP0VzzaCaqzpfl5SYeR9ylLiJJNXE0NzIG24velHy+67uCzEQ+BUkPWMSlFvIiJiilvPNoWuvXA5rQj6Eyr5HhHoWgMq8VH7wT1nXVlnmROY5pxNHeJ'
      +'Ol9wB+Jo3OBnZClbieU1O9jOrAzHsZ+6IS1j4l8TGFe8zySHeycD3N9SMawo5G5nDoeIq57h2CKUio3dc+HeIGYeB84raSe0kSvSqkJWuuycd5SSqlVtdbFrGRlZv3hgLGIo4EPPUVGa3QsAHwGuDKL2D6KJH0X+BVxdCawCzK2K3pnNyHVbIxWJUwm1K2qeO5VZK3s6SSpfPnjaH5kmeDtaEY9N+8fwngfQZyHfThcaz2QK5ZuSt/0f3OE2giddYIQVXIU8D3gWuJoPQCSdBZJejTweWQSvOhl4qs/5J5FGlN19NUB/dvg+/BoxJvjWGASSXpagcm2QOKVbGn5OtEUmkYP0O3EraaPpMlY5vGIzdocymiddpBlgBnE0YnEkcxrJOkrJOkhiNHkHMT65btPVaarYnW01el69veQD8TnSdJfkqRvAxBHHyWO/oh4eixS4d0MFvPNBVyolOoX82VgdsDmwvXG8bpZ0CZKqZWApQvnPkAWAhmOKHs/74V6hnSCYj1bINJt6w/PJunzJOkByMovieV+Icxho6szYe26H0hHOBuZCzuMJBW9XJap2oV8nqwZNPH+r0OcwddBTOvfpb8H+9KIh48P82ut5ynZXOOz2+g7dTAaCc6E/tLsJsrHOkMR7wS8n3mLjNbJn1pFNZoAHEkcnZ2tQiNI0idI0j0QZrzOU0eoVLOlMghhLvNePYhZfiOS9CCStLfjxNEqiPr1Q8RjpltqYp3rX9Va35xtV2utT0VCSc416HbsoF1l0MBfjLJNjN8cl3WxHYOOnNGq/olNdKC1gb8QR7sTR72WpyR9gCTdBTEk3Oa5n49RQlRHsw7bfa4DtiRJ9yFJe/3r4mgccXQQEv6xUoVn7pQBO3rnWuseJK6rp1C8olKqm/6AJgNt7DDrzxGMFoJO/mRXB4uQP/4S4mjNPlck6W0k6deRwDwz70SIZLIZQ0KYFMSN7L9J0l1J0r4pxePoi8hXeifk/XUqrcz2dBVa6+eBZ4ziMheoTnAlvf8FSBDr3khahhzPaq3v6mIbBh0hE9Z1OkHVL/YKwFnE0dnAkSTprA/PJOn1xNENyGTrbohhxSaFMH5DzftFk/79wPEk6Y39qOJoEWRN7k0InxOrOv9VrKObk9nP0NerfYFu3Uhr/bpS6ibEypxjP4OsTJr1GMc+ATEk/SJ9De6EwepAIeE3lxNHfZO0JKnO3Lq2QCIHXqA/I5vHRYlmO188fgJZyGPbfkwWRypbg/pySpLHWNCJit3NDmLGEXY7IavJSGaUfhmjvWgcL+qhNWPrzGsHBb6MxFXQhNTLr18YOJY4Opk46uvNkKQ9JOkFwOaIm9OrRl3FfZvV0aR9HokH+wpJehVJ2vcZ4mgFJG7sJ8gEcKdj07pjsuEOHyO9D1xVcv2/jGPfmHL5kmsHBabq2O2OUKWTrg+sRRwdD5xJkvaqD7Ic7Qzi6ELEaLIdvV/JvG6X6qiQeCYJU0nSYrSxII7GIN4rO+N3Eaqr6uXXhV6jK9Y/pKC1vlsp9Qz2seD1WmtXcp8c/RhNKTVOa/2OhfbTxvGQYLS6KsNAfZnHIvr8DOJoxX5nk/QdkvQ0RKU8A5lMzu+Vq0dFifYmMqG8JUl6joPJ1gLORxitrtN11Wuaph2KuNxRXmptzObpni4UjQF+atIppb6KRK3n6EGiKAYdpq9j0+hE4hWvm4gYS8TzIkn7hnUk6RvA8cTRDMSHcip9Vcd3kZRjf+xjaClC/BP3QZjW5uM4p0qsKUqp/h+kvrhKa122aOJl9A/RyctD8Av6ZuvaWym1FMLA/0HmCL9lXHOO1rrbEm2UUqps7P6h935VZmiSLpR+LiTl3YbE0WEk6cx+FEn6MvBz4uiMQn23AdNIUnf4exxtiuSuNEPmXe0bTAYaaKYM8YecQHmU9lXIeKxo1n9Ca20m03HhN0ieyjzH5VxI+NW2Dvoe4JDAujvBGNzS+sO2VFGNYGhIvSUQ6XUFEhXQf73nJH22sG8ma+mFrMt9IDJ5PthLIQ1lqdYxskUw/k7fSOvgSWqt'
      +'9XtZ3v3z6JtI1YYeYD9zsYvBRD7h2jS6IfVMhpQMtHG0BXFUrYOKf+I3EGfmz9VsSzdoRzpMxqrkDaK1vhLx3fStfvomsJXW+uiKbesqqg72Bwuue8+H+BluQhwd3sdNyoU4WgmRYp/APrk5HMZVtvfxPHBF4fgOz/W3AEWLXXGu6W812pOPzx412vCQQSc+o4Ie4Frj/B2IASzH8+aNtNb3K6VWRD60GyCWzLnpXbbp/AArZhEPl7TZREr1d9Sj9KajizkZfVsoXRXaJuneR1TJi5yPG0c7A99E4uRs60YrRMq7ztWlbZpOAS+SpLao6RZDEFXGJYM5fii7dwqchfjV+XAe8lV1ScgqzzjY72PEjudGIkbjX2WlLkLrrHJvV1qBWxH/yCcBiKP5SNK+K5hKgpy5smmAw4mji5GVR4qTm91iskFlCKXUaGCRzJnYRfMp6rfzaa312456P1KmximlxtHf00MDL2qta8enZXkkeyqqkcXrQ9o+HstiiRZ8UNXq2C2mpEK9Of2LwDEk6V+BnJmmATsSR7ExGb04cBJx9GsgIUnvI452BP4LSRbkW9huoNAoQyqldkHSKawFjFNKvQzcDhyltf6rQX4/9a2uMQWjhlJqGyTGbTVgcaXUS8BdwNla699arl8HhwuWUur5rG0naK3dQwI7zkOyFn899AKl1HeQPrQasIhS6oWs7dO11jMslxyMRCKU4emc0apKlqalVRX6PG/9r0nSdzKL45eR3CS5Q+lY+i7kMBZJL/BDYFvi6HiS9GbgT8TR1Ug6uM3xd/bi+CgU3ZBm3jozCXYCEl50NuJZ8xRi/NkA+ItS6jDgx1kefrJyW73jkKj3HyCJYG24O7vvGCRJ0Tez+x4OPAYsh1h2T1NKbQjs7HCd2pK+c3ELIetTr42kXDgD2EVr/a7v+bO2jEIY+OUy2ox+PsQlb0vg9Gx7CUmPOBU4Uyn1RWA3y+IaDyL5S314ryjRhpK0ymFedxtwGEkqmZviaA2ESSbS1zAyD2LmzZEvRauQkJwTiKNbgONI0oeBg4mjCxBrZNHVqw5zFa+rQt8Ufo4sLvhVrfX5xrljs6/2rxDpdgGA1tpqRSus1nmP1vq6kvvuikiPr2itzfXQTlRKTUeiu/fFvnD7TK21lTGUUlORj+u9yPOVYVUkG/N4pdQSPrU5ww+RDF1rGOnwAKYrpTZCJqUfAI4xzs8KeDe11YU6HalOZ8qvewU4kCT9Fkn6GHG0bJbz/zT6Rjjn9OYaz/PQn2k+B5xJHB1MHC1Kkt6FeBn8HHi7RnvrSrxQ+lJapdRCiCT7qYXJAMhSGlyGdK5GkEnRvYDfW5gsv+9fkaxheyilKi1LpbXOMzx/P3Cp3snI9IUGvMvrZslPd0VS75lMlt//CmS5sv2UUmNtNGUwGa3bDFS1M+Zq4lSSNCGOFiSODgT+RO9ypjbTt4/RiteMQlTGi4mj3YCxJOkMZLGOS7rwPOZ1VehD8G1EZT6lhO5IYE2l1GoV2uDDhohB46gSupMQ48GWNe7xS0RKbRpAOwlZ7ehBPAscZtgKMQoeWUJ3MBIHNzXg/v3gkmjd7jjFa1yd9XbER/EIICWOvo2MF75Gr7XUZJx832S0sQ7aIr3UL0Ger2eZuXYAHnG0tRMJ3S361YBrtdZvltDluViWq1C3D8sDr5QlY9Vav4KErXy86g201q8iHvwfCyCfjDDaTEokGvIObi5bf0Br/RIyuV3rnZWFhA8Ew5nXv4o4j24PPEocbYmoOv9LX1Oq2eGLx6Z4t6mONoZZEFGpLiKONiBJb0Msk0cg6mSd5+lE6lXFsvgX6QNAaz0LGcMuXUYbiKXpn4fEheeRdtaBmYKhH5RSywJLIUx2A/CZEnVvacJX03mOmu8sZIzWhLQKQQ9wJrAxSXohYjU6HzgUsf646gxRHcc66GxMp5Cv1gnE0XRgIkn6B8R1yLcgRJMSr+7H6qNY3JYceI5eT/hOsVRWXwj+TX0Gf5HyZYAnI0OOfyDMFiFTHC4sSfhH9A1qvrOqniFNdCDbdie'
      +'wFUn6U2Bx4ug3iLl1Rcc9yxjGJ9Fw7NvusRZwbmZ4GUOS7o1I2scc96+LJuoAmEW4WrYz8IcG7gnSmcti1nL8h/oLWyxIucl+EnC31nqW1vpRhLF947TR9E/+48J+iLZVGTmjDYTEsuE1ZI7mq8DLxNFhSPzT5w06H1OZ5yFMopl1+O4TIzkof4CYeGNEnbTNB/ngk6pVr7fhEfpGGDuhtZ6ptS5zoB1qWIry1ASTgWKCpZBxWhC01o/UfWdFidYJ0/iklQ09wAxkovRSJLfjNcDW2B1+bffy3ddmdXTRm+Wu5xqDSIFrESPJ7xFr22Ulz9/EByn0+vOA1TPv9hGFbJy1DJ4xqFJqAWS6pxgUPBNYRynVhMZQGzbVsckOYqvvHsS8+yPEVPs3YHf6q3uu67Hsm3RmXaZEs9XrKjcxP3AQcDXwWZL0e4irU5PLH9V9/2choSbTs7mtkYRdkHkxn+P4usj7KjLaDYiXSdkSVl1F6BitCeZ7A9FvpyIp5a5EFixcOPA+IYySb2bewHGeusskm+u6pYETs0xcsxE3sCOQ/CRV0NiHTWv9AeIVsgpwuVKqKWPHoEIp9QlkfHRKZmZ3YTLwjJEn5A7kP2lEfayLTr56oR1CI75vP0OsYmcjFkVbCgNfXo6QQMucpmwezfXrY2wc59YA/owEDx6GuDUdgkjrbqqTVmitH1JKTUGk2z1KqWOBkzrxhB8gzKOUKv5vCyNSaF3kA/0w5e5X+UT1h9Bap0qpW7J6bE7NnWK8Umr9Epp+vo45mvJ5vAcxdjyPpAfbylO/jbFs7QphQJfqSOBvqFQrYmNEqp0BfD/7PYz+CT3roBJzaq2vV0qtjjD8AcD+SqnfAkdrrZ/2Xz1o8LXrGmAzn0OxUmpuxEpsphsHUR+nddY8J1akf6S4iad9niGdfHnfRP7gaUiu+pnAVxz12ur3dXawM0VxKxujhdTjaoetjfkWId7rNyPq20bIV9jldRAi8WpJPa31y1rrXREV91Dkv7g/S3AzFLELvVmttkWcxU9F0iOsh52Bivgsosn0z44mZZ/KfEGbxp1IwijftmYV1TH0Dz8HURNjZNKwuDA81JdmVRAi0bCU+ZisCgOMRyIBdkLGbZMR6ZYvkNEVtdGGzHXpCKXUMcj/8hul1Apa68acihvCBTbv/UxSHQj8WCn1sNb6LMf1k5GJZ9uqNDcilu51CfBhVUo9hli/bbhKa71z4TjVWr9QVmeTlqn7kRCIhYGLgGXpPw5zdS4XTVEtLBujFc+7jCHmPTodr5VJoCWR2LD7kPz90xHGW87zHD7UZk6t9fuI9/ljwClKqRu01mX5CAcdWbsPVkotDhynlPqrI5xmEvCPzCBk1vGGUuq+jCbEWfx07IbCrfEvsOGEyWh1/shZiGpyB+LhvBbuXI2h0qyM2cxfEz6JZt7TJc2KZb7xmg0mzSqIkeQaJJvuRkhYic81rBEV0oTW+tQsvup3SqlltNahHh2Djdz/dUskmaqJScBlSqm1Hdc/RbknPwBaa1u8HEqpVajp1dKpRDsXseR8F1GNypKh2jpLiNGjamq3uoyW/4aokljKyxhiQ2SS/kykw+xN9aWgmsCJiGFqChIRMeShtX5NKfUAsLJ5LnMkXghhxO091bynlIoG4+NSN/DzQWQFl5cRUbxF4VyVL7JPYpTV5RtDlc2jhbTTx2RVnsvcRiFzXRcgWsDONLTiiVJqm0CvkFuRMUuVZYGHAh7A3uZ1kXSDy+AxSCDGkjUGpKUGbBLN90V+Cwnu60GCC+ejvxSrksqtTJrVURuhXKIV7+ljcrOseOxTJ0Ok7zhEHXoJCY9fDAkFGuOoL6TOI4GjkQ+hE1rrWUqpJxFDVRP4D9LuEMxNuAOyidfpvywTCKPdUTJ18UKW7GcSffOfzCa87WOo7pAAVJNof0YSruyEjMVcmaNCOkmZRMJzLmTrZTTJjuVLmOq6t68NtucIfQ8m7aLIFMCmiFta2aJ8PjyDLJgYgkUID20pw5uIw28IFkecyZvEusBNAXQ303+c9gzhoS9'
      +'LIhmRK6OM0RQyI38EsCwyDvsY4Z2oWE9IR62i3vm2ouo4tsO6QhjTVb8LNtqJyNJEESKZngmsqwjXYn99by7Ot+ORJYWbwIuEx5gtgSyN3AiUUvMiyXj6rzveHzfR3xXracLbvjT+iXUnfBPW7yLeDU8hKs6aAfVVlWZmmasOHL+ua4qqo8uyZ7uurMzW/tBnDWWa9RHPktuROckqatajwIYBnuqbIOr/PRXq9mEmML9SalUfkVJqCaSz3tzQfUGSLI0iXKItrpQqeus8Aixf5heajX0Xxr/AhhMuRrsRuA7YBrFM9bmnZ7O20UET0pnL7udqw2jiKDfD2vKFhEipqkxW9ry+d2Lbtsi2v9Cb46MMv0I0jm+6CJRScyHpGs5ucJG+65EOWOa9sSfiXN7k/N06SLbkkFQK/0Q+XEX18UIkfcZeJdfuBzxOTSutyWjPIUy2CuLZEVHta+xjvtDOXZfBXFKt6lxVFUb0fThC3okLxWfYHFgW+WL7PNfRWj+FTLcckc359K1U0rydhfhfWueK6iCbVN4V+JpS6ns2GqXUdsBuwL6Zt0pTCB2fkflK3kVBfcyS8hwH/I9SyrqoYfZM2wOHBqxsakVudXwfYbLxhE3quTqLaXFUlnNmWVnH81kZffNtY5FBesgcWnHf9xsi5cwy2/OVMbWJhZAv978RVd5neNgbGaPeqZQ6H5GG7yAZsr6E/OdfaDq6Wmt9lVLqKOAEpdTWyAe7mKn4S0jex9ObumemIq+DZT1rD24GvmCUHYVYfWcopXZAJN+TSFqISYh718FIsK+JBbM06D68PRphstnIV9NEKEO5aKtORoe4XIVOXo8r/LqYyzzulMlCpbmv/T66xbLfN5H/rR+yr/Y3lFJXIGOx7RDL5h2IC9jJIb55BcxGkt2UQmt9gFLqPCQw76RmPAAABX9JREFUdhpimHkOcc+brLW2Ofz2ZPcIQUrf514RWIBAiZbhJuB7Sqn58rR82QT2nkqpa5C0GlsgUv8RRAL+n9b6akd9H0e0BB+eVnrT0ZsgGWRdEai2tchc5WXnzXJK9n2/5r55vDFJ+gBxNAXJaJyjLqPlvyFMZh6XlZfVZeJ2YA+S9AbH+RZDDHORpJcjY7K9sS/4HfI1Dv2Sm2V4zoVIC99xLtGaGKOFMobtuUPek4vGxL8RT5K1WiYbXhBjSJKmJOmxyIojp+JOv+XrbDYaV1lo561zbb65jCEhdZr3x0Hv2i/72LjOuZjvfWRu7ZMk6W9J0tD0aC2GCPpaHZP0JZL0u4g/2N8KZ0K/wGVf9aqdtZOtjtWx7P6h7Q59L7Z3apZfAqxEku7Xb4HFFsMG9nm0JL2LJF0fGRg+WTjj+wKHMlw3GMx2fc5otsQ8Td7P94xlHx5XO0AMCFNI0s1J0lqTpC2GDvwuWEn6J8SJ8yDsyUJDOo/v2DxXLDN/qzKKaXWsyqi++4cyoOsduT5KIJOn/wus9uFqpi2GPcqdipP0PZL0UMQqeWZWGtJxqjJGGU1IHXUZLeQ+WM6H7IcwmELGxScDnyBJTyBJa02MthiaCPfeT9JnSdLtkQm8WynvSL5j136dzXV9k54hZff1PY+tfeb7uhr4DEm6G0napNdEiyGC6oGfsvbzOsiC4C9Qzlw4zpu0Nqnho+lUooXWU0bre6ay9/E4srjHFJL0XlqMWNSLsE5STZL+EZmZPwKZ2Q+Vbua5JqRaHUYLaYPrOULa63sHbyERESuTpBfTYsSjbioDQZK+RZIeRG/ymarME0JTlxFzRpu3xrV12uXbp7B/OvBpkvRIktTqRtVi5KGZdHNJ+gSwNXG0PhKWnydQqerHWDxXxeHYBpevowkbMxT3zTKbZLOdM/dvAvYiSW/3tKXFCEVnEs1Ekl6HpJvbHXgFf8drQh0LkWhVrI6+9oW01/aszwI7kKTrtUw256JZRgNI0g9I0lOR0PwT6fX8Hki1EfpaHevW0Qnde0hm4JVJ0rMD316LEYrmGS1Hkr5Oku6DpEC4iuakWlkHz8ttqmNTjFxWz3nAKiTpISRp1V'
      +'VBW4xAdH+xuiR9ENiMONoEcYxdoXC205gzH+Yt/JrMbEJV2Hd9GEAWPNiHJLXFXbWYg9E9iWZCwnE+gyzj9AbVpQQV6U1Gq1NH6PYiEsq/bstkLWwYOEaDPBznl4hV8nf0Sq5O1DTXVtcFq8p9UiRodmWS9Pdt+EoLF5TWTa05WANxtDqSWXcS5RHUZdmQzbIXEIY2Vx5pSn28FNifJG1y7eoWIxSDy2g54mgakpx1GewM5UtZ4Cp7E7F82tKQ2ZjNLLON6xSS/31fktSVQ6JFi34YWNXRBQnHWQ1JgfYufrXNVm4rG0dnaqNZ92tIuoe1WiZrURVDQ6IVEUdLIdLta4XSqmpjjjVxJx8tk2r5/gfIelw/bT3rW9TF0GO0HHG0DjJ+W5P6jDYFuNJxLoTRrkHM9ff7G9uihR9DQ3W0IUnzBQm+jZjP61gGF/Kc821PANNI0k1aJmvRBIYuo0EejjMdWXzuKPqG44Rsi3jOYSmbheSlX40kDVnruEWLIAxtRsuRpLNI0h8CqyNZoUIZbeFAOpAsviuTpEe14Sstmkb3XbCaRJI+DkwjjjZAwnEm4p4Xg15G86ENX2nRdQwPiWYiSa9BjCR7IFmj6qiOz9CGr7QYIAxPRoM8HOcUJB3eSYgZPoTR3gMOoQ1faTGAGLrm/aqIo4mI3+GXCqW3I1mXc5yLuE01tQBfixZBGDmMliOOpiLzbysA/0Lcum4H9mwXhmgxWBh5jAYQR3Mj47ftgBOA1rO+xaDi/wO7COZkDAUh8gAAAABJRU5ErkJggg==',
    remoteStorageCube = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAR2SURBVFiFtddfqGVVHQfwz2/vfZ28c2WgP6hMoYkUV4qIYnSKmaQYwaaJ3oLeUnpJmDCmUhCaIhhKGelhelCqN9+ECKdAxR6kgnJASBN9KTGwP2oKTtyZs8/+9bDXPufcfe51xju6YLHX2fu3ft/v+q7fWb/fisy0o3brez6qmt4Luvo7frvx/E7cxNsmcCj2WGnuEb6JaXlbSz8zaX/ksXzj3SHwg6j8aeU28jjeh8TZ8nU3Aq8Sx+2b/ML3s3vnCHxp5YB0Hz6OTkgpMax2jxBSoMJfhGMemTx5aQQOxzWsnCC/gm6hZ+mvFMv36xUYCJQev2Jyt9P54tsj8OVYNW2+izuxIkzlAoGUQuLlMuNqKcQCgVBJNSa4X93+xK/zfxcmcLj5GtUJ8ipMC/i0gA/PQYF/lFkfHClQFxJ1IVET/6S72+n2oa0JHL7s0+RPsR9tAZuOxuNtGKS9xpL8A7BmNP4j8S2nzz+lGJaWDxB7RyCbV54DkZiSrbAhbJBt/25LtUbEY2+P1bdmQY1V8mr8DruET5Z9n4NHTOmmZK9A2ihzp3RdL3tVy+z16OeG0ElncI48yGzeogIzQgexByelp2fMZ+CDAtFK56XzxFwBXSE6C9incbL4PDha9BKBPrjCddJRVT5DHsMLczkLUGhFbPR9iJNYjJUXyGOqfEY6KlxnHrybVjwm0JVDJmV8FZ8TeZysZdyBK9FKXb/6mdTZ+4uXRXcKUxnHpavKdqV58G5JYJFdLvT3yuok3ROiuY3JZ3Rxu7CH7lxvHlPpNVX+nJU/yMk9VJ8nm5GvMc42W6Bwnhl2KRyQ7cOyaqy1R0ScEvFq6aestUdk1cj2YeEA3RwwtwbfSoHtxxmJXeS3nV25RR0/9KnJL8GZyz7i7MoD5MfQ9LZ5YZ+WY+AiW16vc8if/av8PkRevxNPiwTiLceRISPIM3iUOGxa/wfUbiTvxy3ETb3tRfi0HAMx+xgLY1XIeAUPYoO4S+YNqupyVXW5zBuIu/pvHuxtq5j5DLHkfxsFxoaBlN1vVKbEN2TQ5wdYLc8++YibhZvJx3VZizgy8rVEYhwDfUKZFxd/Jf8m4gsydtENJ17TZ8lcLbOGrFfJrKmOiDxHPk58GJ8oPqu3UmDOLr2B5/AhYt08K9Z9AMdAsCeQml6BnKdiriC+iP/iKWkdH7gQgSRfQoi4SWoLcMqsRaUcZiX1xu4yrZmpp6p721lavlLYK/PfeIm4djsCE7xZDNqSVocV9evNJCKIjq6TuTbbAlWvQGZfiCwWJqkqqb7pMUwG0IV/QXwdz1ouKjZXOP021EQjqt2i2k00/Tv1Evj8OfRnC1aPeokl2e/LrM/aYUk2Pgc43T6knqzjBCZytqqhpGpK0DXCmrC26d1Qgs3BJzihnqyPwbdWYJMaFyzLnyuW6yMFLrEsH7ftLyZ/LxbX7vRisrwFW7VHJk/a1+4njuL1udx5Rd9nW/A6cdS+dv/FgHPpl9PhorH67l9Ox62/nv8YdPX3dno9/z+G+TGrzjgPKwAAAABJRU5ErkJggg==',
   widgetCss =
      //make the things as a whole wide by default, or just the cube in 'connected', 'busy' and 'offline' states:
      '#remotestorage-state { position:fixed; top:15px; right:15px; height:32px; width:275px; font:normal 16px/100% sans-serif; z-index:99999; background:rgba(0,0,0,.3); padding:5px; border-radius:7px; box-shadow:0 1px rgba(255,255,255,.05), inset 0 1px rgba(0,0,0,.05); transition:width 500ms, background 500ms; }\n' 
      +'#remotestorage-state.connected, #remotestorage-state.busy, #remotestorage-state.offline { width:32px; background:none; box-shadow:none; }\n' 
      //style for both buttons:
      +'.remotestorage-button { margin:0; padding:.3em; font-size:14px; height:26px !important; background:#ddd; color:#333; border:1px solid #ccc; border-radius:3px; box-shadow:0 1px 1px #fff inset; }\n' 
      //style for the register button:
      +'#remotestorage-register-button { position:absolute; left:25px; top:8px; max-height:16px; text-decoration:none; font-weight:normal; }\n' 
      //style for the connect button:
      +'#remotestorage-connect-button { position:absolute; right:8px; top:8px; padding:0 0 0 17px; width:90px; cursor:pointer; text-align:left; border-radius:0 3px 3px 0; font-weight:normal; }\n' 
      +'#remotestorage-connect-button:hover, #remotestorage-connect-button:focus, .remotestorage-button:hover, .remotestorage-button:focus { background:#eee; color:#000; text-decoration:none; }\n' 
      //style for the useraddress text input:
      +'#remotestorage-useraddress { position:absolute; left:25px; top:8px; margin:0; padding:0 17px 0 3px; height:25px; width:142px; background:#eee; color:#333; border:0; border-radius:3px 0 0 3px; box-shadow:0 1px #fff, inset 0 1px #999; font-weight:normal; font-size:14px;}\n'
      +'#remotestorage-useraddress:hover, #remotestorage-useraddress:focus { background:#fff; color:#000; }\n' 
      //style for the cube:
      +'#remotestorage-cube { position:absolute; right:84px; -webkit-transition:right 500ms; -moz-transition:right 500ms; transition:right 500ms; z-index:99997; }\n' 
      //style for the questionmark and infotexts:
      +'#remotestorage-questionmark { position:absolute; left:0; padding:9px 8px; color:#fff; text-decoration:none; z-index:99999; font-weight:normal; }\n' 
      +'.infotext { position:absolute; left:0; top:0; width:255px; height:32px; padding:6px 5px 4px 25px; font-size:10px; background:black; color:white; border-radius:7px; opacity:.85; text-decoration:none; white-space:nowrap; z-index:99998; }\n' 
      +'#remotestorage-questiomark:hover { color:#fff; }\n' 
      +'#remotestorage-questionmark:hover+#remotestorage-infotext { display:inline; }\n' 
      //make cube spin in busy and connecting states: 
      +'#remotestorage-state.busy #remotestorage-cube, #remotestorage-state.connecting #remotestorage-cube {' 
      +'   -webkit-animation-name:remotestorage-loading; -webkit-animation-duration:2s; -webkit-animation-iteration-count:infinite; -webkit-animation-timing-function:linear;\n' 
      +'   -moz-animation-name:remotestorage-loading; -moz-animation-duration:2s; -moz-animation-iteration-count:infinite; -moz-animation-timing-function:linear;\n' 
      +'   -o-animation-name:remotestorage-loading; -o-animation-duration:2s; -o-animation-iteration-count:infinite; -o-animation-timing-function:linear;\n' 
      +'   -ms-animation-name:remotestorage-loading; -ms-animation-duration:2s; -ms-animation-iteration-count:infinite; -ms-animation-timing-function:linear; }\n' 
      
      +'   @-webkit-keyframes remotestorage-loading { from{-webkit-transform:rotate(0deg)} to{-webkit-transform:rotate(360deg)} }\n' 
      +'   @-moz-keyframes remotestorage-loading { from{-moz-transform:rotate(0deg)} to{-moz-transform:rotate(360deg)} }\n' 
      +'   @-o-keyframes remotestorage-loading { from{-o-transform:rotate(0deg)} to{-o-transform:rotate(360deg)} }\n' 
      +'   @-ms-keyframes remotestorage-loading { from{-ms-transform:rotate(0deg)} to{ -ms-transform:rotate(360deg)} }\n' 
      //hide all elements by default:
      +'#remotestorage-connect-button, #remotestorage-questionmark, #remotestorage-register-button, #remotestorage-cube, #remotestorage-useraddress, #remotestorage-infotext, #remotestorage-devsonly, #remotestorage-disconnect { display:none }\n' 
      //in anonymous, registering, interrupted and failed state, display register-button, connect-button, cube, questionmark:
      +'#remotestorage-state.anonymous #remotestorage-cube, #remotestorage-state.anonymous #remotestorage-connect-button, #remotestorage-state.anonymous #remotestorage-register-button, #remotestorage-state.anonymous #remotestorage-questionmark { display: block }\n'
      +'#remotestorage-state.registering #remotestorage-cube, #remotestorage-state.registering #remotestorage-connect-button, #remotestorage-state.registering #remotestorage-register-button, #remotestorage-state.registering #remotestorage-questionmark { display: block }\n'
      +'#remotestorage-state.interrupted #remotestorage-cube, #remotestorage-state.interrupted #remotestorage-connect-button, #remotestorage-state.interrupted #remotestorage-register-button, #remotestorage-state.interrupted #remotestorage-questionmark { display: block }\n'
      +'#remotestorage-state.failed #remotestorage-cube, #remotestorage-state.failed #remotestorage-connect-button, #remotestorage-state.failed #remotestorage-register-button, #remotestorage-state.failed #remotestorage-questionmark { display: block }\n'
      //in typing state, display useraddress, connect-button, cube, questionmark:
      +'#remotestorage-state.typing #remotestorage-cube, #remotestorage-state.typing #remotestorage-connect-button, #remotestorage-state.typing #remotestorage-useraddress, #remotestorage-state.typing #remotestorage-questionmark { display: block }\n'
      //display the cube when in connected, busy or offline state:
      +'#remotestorage-state.connected #remotestorage-cube, #remotestorage-state.busy #remotestorage-cube, #remotestorage-state.offline #remotestorage-cube { right:0; opacity:.5; cursor:pointer; display: block }\n'
      //display the devsonly text when in devsonly state:
      +'#remotestorage-state.devsonly #remotestorage-devsonly { display: block }\n'
      //style for disconnect hover only while hovering of widget:
      +'#remotestorage-disconnect { position:absolute; right:6px; top:9px; padding:5px 28px 2px 6px; height:17px; white-space:nowrap; font-size:10px; background:#000; color:#fff; border-radius:5px; opacity:.5; text-decoration:none; z-index:99996; }\n' 
      +'#remotestorage-disconnect strong { font-weight:bold; }\n' 
      +'#remotestorage-state.connected #remotestorage-cube:hover, #remotestorage-state.busy #remotestorage-cube:hover, #remotestorage-state.offline #remotestorage-cube:hover { opacity:1; }\n' 
      +'#remotestorage-state.connected #remotestorage-disconnect:hover, #remotestorage-state.busy #remotestorage-disconnect:hover, #remotestorage-state.offline #remotestorage-disconnect:hover { display:inline; }\n' 
      +'#remotestorage-state.connected #remotestorage-cube:hover+#remotestorage-disconnect, #remotestorage-state.busy #remotestorage-cube:hover+#remotestorage-disconnect, #remotestorage-state.offline #remotestorage-cube:hover+#remotestorage-disconnect { display:inline; }\n',
    locale='en',
    connectElement,
    widgetState,
    userAddress,
    scopesObj = {};
  function translate(text) {
    return text;
  }
  function isRegistering() {
    return localStorage.getItem('remote_storage_registering');
  }
  function setRegistering(value) {
    if(value===false) {
      localStorage.removeItem('remote_storage_registering');
    } else {
      localStorage.setItem('remote_storage_registering', 'true');
    }
  }
  function calcWidgetStateOnLoad() {
    if(isRegistering()) {
      return 'registering';
    } else {
      var wireClientState = wireClient.getState();
      if(wireClientState == 'authing') {
        if(platform.harvestToken()) {
          wireClientState = 'connected';
        } else {
          return 'interrupted';
        }
      }
      if(wireClientState == 'connected') {
        return sync.getState();//'busy', 'connected' or 'offline'
      }
      return wireClientState;//'connecting' or 'anonymous'
    }
  }
  function setWidgetStateOnLoad() {
    setWidgetState(calcWidgetStateOnLoad());
  }
  function setWidgetState(state) {
    widgetState = state;
    displayWidgetState(state, userAddress);
  }
  function displayWidgetState(state, userAddress) {
    if(!localStorage.michiel) {
      state='devsonly';
    }
    var userAddress = localStorage['remotestorage_widget_useraddress'];
    var html = 
      '<style>'+widgetCss+'</style>'
      +'<div id="remotestorage-state" class="'+state+'">'
      +'  <input id="remotestorage-connect-button" class="remotestorage-button" type="submit" value="'+translate('connect')+'">'//connect button
      +'  <span id="remotestorage-register-button" class="remotestorage-button">'+translate('get remoteStorage')+'</span>'//register
      +'  <img id="remotestorage-cube" src="'+remoteStorageCube+'">'//cube
      +'  <span id="remotestorage-disconnect">Disconnect <strong>'+userAddress+'</strong></span>'//disconnect hover; should be immediately preceded by cube because of https://developer.mozilla.org/en/CSS/Adjacent_sibling_selectors:
      +'  <a id="remotestorage-questionmark" href="http://unhosted.org/#remotestorage" target="_blank">?</a>'//question mark
      +'  <span class="infotext" id="remotestorage-infotext">This app allows you to use your own data storage!<br>Click for more info on the Unhosted movement.</span>'//info text
      //+'  <input id="remotestorage-useraddress" type="text" placeholder="you@remotestorage" autofocus >'//text input
      +'  <input id="remotestorage-useraddress" type="text" value="michiel@mich.rs" placeholder="you@remotestorage" autofocus >'//text input
      +'  <a class="infotext" href="http://unhosted.org" target="_blank" id="remotestorage-devsonly">Local use only, no async sync yet. But modules work!<br>Click for more info on the Unhosted movement.</a>'
      +'</div>';
    platform.setElementHTML(connectElement, html);
    platform.eltOn('remotestorage-register-button', 'click', handleRegisterButtonClick);
    platform.eltOn('remotestorage-connect-button', 'click', handleConnectButtonClick);
    platform.eltOn('remotestorage-disconnect', 'click', handleDisconnectClick);
    platform.eltOn('remotestorage-cube', 'click', handleCubeClick);
    platform.eltOn('remotestorage-useraddress', 'type', handleWidgetTypeUserAddress);
  }
  function handleRegisterButtonClick() {
    setRegistering();
    var win = window.open('http://unhosted.org/en/a/register.html', 'Get your remote storage',
      'resizable,toolbar=yes,location=yes,scrollbars=yes,menubar=yes,'
      +'width=820,height=800,top=0,left=0');
    //var timer = setInterval(function() { 
    //  if(win.closed) {
    //    clearInterval(timer);
    //    setRegistering(false);
    //  }
    //}, 250);
    setWidgetState('registering');
  }
  function redirectUriToClientId(loc) {
    //TODO: add some serious unit testing to this function
    if(loc.substring(0, 'http://'.length) == 'http://') {
      loc = loc.substring('http://'.length);
    } else if(loc.substring(0, 'https://'.length) == 'https://') {
      loc = loc.substring('https://'.length);
    } else {
      return loc;//for all other schemes
    }
    var hostParts = loc.split('/')[0].split('@');
    if(hostParts.length > 2) {
      return loc;//don't know how to simplify URLs with more than 1 @ before the third slash
    }
    if(hostParts.length == 2) {
      hostParts.shift();
    }
    return hostParts[0].split(':')[0];
  }
  function dance(endpoint, oldScopes) {
    var endPointParts = endpoint.split('?');
    var queryParams = [];
    if(endPointParts.length == 2) {
      queryParams=endPointParts[1].split('&');
    } else if(endPointParts.length>2) {
      errorHandler('more than one questionmark in auth-endpoint - ignoring');
    }
    var loc = platform.getLocation();
    var scopesArr = [];
    for(var i in scopesObj) {
      if(oldScopes) {
        if(i.substring(0, '/public/'.length) != '/public/') {
          scopesArr.push(i.substring(1, i.length-1));
        }
      } else {
        scopesArr.push(i+':'+scopesObj[i]);
      }
    }
    queryParams.push('response_type=token');
    queryParams.push('scope='+encodeURIComponent(scopesArr.join(' ')));
    queryParams.push('redirect_uri='+encodeURIComponent(loc));
    queryParams.push('client_id='+encodeURIComponent(redirectUriToClientId(loc)));
    
    platform.setLocation(endPointParts[0]+'?'+queryParams.join('&'));
  }

  function discoverStorageInfo(userAddress, cb) {
    webfinger.getStorageInfo(userAddress, {timeout: 3000}, function(err, data) {
      if(err) {
        hardcoded.guessStorageInfo(userAddress, {timeout: 3000}, function(err2, data2) {
          if(err2) {
            cb(err2);
          } else {
            if(data2.type && data2.href && data.properties && data.properties['auth-endpoint']) {
              wireClient.setStorageInfo(data2.type, data2.href);
              cb(null, data2.properties['auth-endpoint']);
            } else {
              cb('cannot make sense of storageInfo from webfinger');
            }
          }
        });
      } else {
        if(data.type && data.href && data.properties && data.properties['auth-endpoint']) {
          wireClient.setStorageInfo(data.type, data.href);
          cb(null, data.properties['auth-endpoint']);
        } else {
          cb('cannot make sense of storageInfo from hardcoded');
        }
      }
    });
  }
  function handleConnectButtonClick() {
    if(widgetState == 'typing') {
      userAddress = platform.getElementValue('remotestorage-useraddress');
      localStorage['remote_storage_widget_useraddress']=userAddress;
      setWidgetState('connecting');
      discoverStorageInfo(userAddress, function(err, auth) {
        if(err) {
          setWidgetState('failed');
        } else {
          dance(auth, false);
        }
      });
    } else {
      setWidgetState('typing');
    }
  }
  function handleDisconnectClick() {
    if(widgetState == 'connected') {
      wireClient.disconnectRemote();
      store.forgetAll();
      setWidgetState('anonymous');
    } else {
      alert('you cannot disconnect now, please wait until the cloud is up to date...');
    }
  }
  function handleCubeClick() {
    setWidgetState('busy');
    sync.syncNow('/', function(success) {
      setWidgetState((success?'connected':'offline'));
    });
    //if(widgetState == 'connected') {
    //  handleDisconnectClick();
    //}
  }
  function handleWidgetTypeUserAddress() {
    setRegistering(false);
    console.log('handleWidgetTypeUserAddress');
  }
  function handleWidgetHover() {
    console.log('handleWidgetHover');
  }
  function display(setConnectElement, setLocale) {
    var tokenHarvested = platform.harvestToken();
    if(tokenHarvested) {
      wireClient.setBearerToken(tokenHarvested);
    }
    connectElement = setConnectElement;
    locale = setLocale;
    wireClient.on('error', function(err) {
      platform.alert(translate(err));
    });
    wireClient.on('state', setWidgetState);
    setWidgetStateOnLoad();
  }
  function addScope(module, mode) {
    if(!scopesObj[module] || mode == 'rw') {
      scopesObj[module] = mode;
    }
  }
  
  return {
    display : display,
    addScope: addScope
  };
});

/* -*- js-indent-level:2 -*- */

define('lib/baseClient',['./sync', './store'], function (sync, store) {
  var moduleChangeHandlers = {};

  function bindContext(callback, context) {
    if(context) {
      return function() { return callback.apply(context, arguments); };
    } else {
      return callback;
    }
  }

  function extractModuleName(path) {
    if (path && typeof(path) == 'string') {
      var parts = path.split('/');
      if(parts.length > 3 && parts[1] == 'public') {
        return parts[2];
      } else if(parts.length > 2){
        return parts[1];
      }
    }
  }

  function fireChange(moduleName, eventObj) {
    if(moduleName && moduleChangeHandlers[moduleName]) {
      for(var i=0; i<moduleChangeHandlers[moduleName].length; i++) {
        moduleChangeHandlers[moduleName][i](eventObj);
      }
    }
  }
  function fireError(str) {
    console.log(str);
  }
  store.on('change', function(e) {
    var moduleName = extractModuleName(eventObj.path);
    fireChange(moduleName, e);//tab-, device- and cloud-based changes all get fired from the store.
  });
  

  function set(path, absPath, valueStr) {
    if(isDir(absPath)) {
      fireError('attempt to set a value to a directory '+absPath);
      return;
    }
    var  node = store.getNode(absPath);
    var changeEvent = {
      origin: 'window',
      oldValue: node.data,
      newValue: valueStr,
      path: path
    };
    var ret = store.setNodeData(absPath, valueStr, true);
    var moduleName = extractModuleName(absPath);
    fireChange(moduleName, changeEvent);
    return ret; 
  }

  function claimAccess(path, claim) {
    store.setNodeAccess(path, claim);
  }

  function isDir(path) {
    if(typeof(path) != 'string') {
      doSomething();
    }
    return (path.substr(-1)=='/');
  }

  return {
    claimAccess: claimAccess,
    getInstance: function(moduleName, isPublic) {
      function makePath(path) {
        if(moduleName == 'root') {
          return path;
        }
        return (isPublic?'/public/':'/')+moduleName+'/'+path;
      }

      return {

        // helpers for implementations
        h: {
          bindContext: bindContext
        },

        on: function(eventType, cb, context) {//'error' or 'change'. Change events have a path and origin (tab, device, cloud) field
          if(eventType=='change') {
            if(moduleName) {
              if(!moduleChangeHandlers[moduleName]) {
                moduleChangeHandlers[moduleName]=[];
              }
              moduleChangeHandlers[moduleName].push(bindContext(cb, context));
            }
          }
        },

        getObject: function(path, cb, context) {
          var absPath = makePath(path);
          if(cb) {
            sync.fetchNow(absPath, function(err) {
              var node = store.getNode(absPath);
              bindContext(cb, context)(node.data);
            });
          } else {
            var node = store.getNode(absPath);
            return node.data;
          }
        },

        getListing: function(path, cb, context) {
          var absPath = makePath(path);
          if(cb) {
            sync.fetchNow(absPath, function(err) {
              var node = store.getNode(absPath);
              var arr = [];
              for(var i in node.children) {
                if(!node.removed[i]) {
                  arr.push(i);
                }
              }
              for(var i in node.added) {
                arr.push(i);
              }
              //no need to look at node.changed, that doesn't change the listing
              bindContext(cb, context)(arr);
            });
          } else {
            var node = store.getNode(absPath);
            var arr = [];
            for(var i in node.children) {
              if(!node.removed[i]) {
                arr.push(i);
              }
            }
            for(var i in node.added) {
              arr.push(i);
            }
            return arr;
          }
        },

        getMedia: function(path, cb, context) {
          var absPath = makePath(path);
          if(cb) {
            sync.fetchNow(absPath, function(err) {
              var node = store.getNode(absPath);
              bindContext(cb, context)({
                mimeType: node.mimeType,
                data: node.data
              });
            });
          } else {
            var node = store.getNode(absPath);
            return {
              mimeType: node.mimeType,
              data: node.data
            };
          }
        },

        remove: function(path) {
          return set(path, makePath(path));
        },
        
        storeObject: function(type, path, obj) {
          obj['@type'] = 'https://remotestoragejs.com/spec/modules/'+moduleName+'/'+type;
          //checkFields(obj);
          return set(path, makePath(path), obj, 'application/json');
        },

        storeMedia: function(mimeType, path, data) {
          return set(path, makePath(path), data, mimeType);
        },

        getCurrentWebRoot: function() {
          return 'https://example.com/this/is/an/example/'+(isPublic?'public/':'')+moduleName+'/';
        },

        sync: function(path, switchVal) {
          var absPath = makePath(path);
          store.setNodeForce(absPath, (switchVal != false));
        },

        getState: function(path) {
        }
      };
    }
  };
});

define('remoteStorage',[
  'require',
  './lib/widget',
  './lib/baseClient',
  './lib/store',
  './lib/sync',
  './lib/wireClient'
], function(require, widget, baseClient, store, sync, wireClient) {

  var loadedModules = {}, modules = {};

  var remoteStorage =  {

    /**
     ** PUBLIC METHODS
     **/

    defineModule: function(moduleName, builder) {
      console.log('DEFINE MODULE', moduleName);
      modules[moduleName] = builder(
        // private client:
        baseClient.getInstance(moduleName, false),
        // public client:
        baseClient.getInstance(moduleName, true)
      );
    },

    getModuleList: function() {
      return Object.keys(modules);
    },

    getLoadedModuleList: function() {
      return Object.keys(loadedModules);
    },

    getModuleInfo: function(moduleName) {
      return modules[moduleName];
    },

    // Load module with given name, accessible with given mode.
    // Return the module's version.
    loadModule: function(moduleName, mode) {
      if(moduleName in loadedModules) {
        return;
      }
      var module = modules[moduleName];

      if(! mode) {
        mode = 'r';
      }

      if(! module) {
        throw "Module not defined: " + moduleName;
      }

      this[moduleName] = module.exports;
      if(moduleName == 'root') {
        moduleName = '';
        widget.addScope('', mode);
        baseClient.claimAccess('/', mode);
      } else {
        widget.addScope(moduleName+'/', mode);
        baseClient.claimAccess('/'+moduleName+'/', mode);
        widget.addScope('public/'+moduleName+'/', mode);
        baseClient.claimAccess('/public/'+moduleName+'/', mode);
      }

      loadedModules[moduleName] = true;
    },

    setBearerToken: function(bearerToken, claimedScopes) {
      wireClient.setBearerToken(bearerToken);
      baseClient.claimScopes(claimedScopes);
    },

    /**
     ** DELEGATED METHODS
     **/

    disconnectRemote : wireClient.disconnectRemote,
    flushLocal       : store.forgetAll,
    syncNow          : sync.syncNow,
    displayWidget    : widget.display,
    setStorageInfo   : wireClient.setStorageInfo

  };


  return remoteStorage;
});

  remoteStorage = _loadModule('remoteStorage');
})();
