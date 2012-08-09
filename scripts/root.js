remoteStorage.defineModule('public', function(client) {
    function getPublicItems()
    {
        return client.getObject("publishedItems");
    }

    return {
        exports: {
            getPublicItems: getPublicItems,
            getObject: client.getObject
        }
    }
});

remoteStorage.defineModule('root', function(myPrivateBaseClient, myPublicBaseClient) {
    function addToPublicItems(path)
    {
        var data = myPublicBaseClient.getObject("publishedItems");
        if(path[0] == "/")
            path = path.substr(1);

        if(data)
        {
            if($.inArray(path, data) != true)
            {
                data.unshift(path);
            }
        }
        else
        {
            data = [];
            data.push(path);
        }
        myPublicBaseClient.storeObject('array', "publishedItems", data);
    }

    function removeFromPublicItems(path)
    {
        var data = myPublicBaseClient.getObject("publishedItems");
        if(path[0] == "/")
            path = path.substr(1);
        if(data)
        {
            if($.inArray(path, data) != true)
            {
                data.pop(path);
            }
        }
        else
        {
            data = [];
        }
        myPublicBaseClient.storeObject('array', "publishedItems", data);
    }

    function publishObject(path)
    {
        if(pathIsPublic(path))
            return 'Object has already been made public';

        var data = myPrivateBaseClient.getObject(path);
        var publicPath = "/public" + path;
        addToPublicItems(path);
        myPrivateBaseClient.remove(path);
        myPublicBaseClient.storeObject(data['@type'], path, data);

        return "Object " + path + " has been published to " + publicPath;
    }

    function archiveObject(path)
    {
        if(!pathIsPublic(path))
            return 'Object has already been made private';

        var data = myPublicBaseClient.getObject(path);
        var privatePath = path.substring(7, path.length);
        removeFromPublicItems(path);
        myPublicBaseClient.remove(path);
        myPrivateBaseClient.storeObject(data['@type'], path, data);

        return "Object " + path + " has been archived to " + privatePath;
    }

    function pathIsPublic(path)
    {
        if(path.substring(0, 8) == "/public/")
            return true;
        return false;
    }

    function getClient(path)
    {
        if(!pathIsPublic(path))
            return myPrivateBaseClient;
        return myPublicBaseClient;
    }

    function getObject(path, cb, contex)
    {
       var client = getClient(path);
        client.getObject(path, cb, contex);
    }

    function setObject(type, path, obj)
    {
        var client = getClient(path);
        client.setObject(type, path, obj);
    }

    function removeObject(path)
    {
        var client = getClient(path);
        client.remove(path);
    }

    function getListing(path, cb, context)
    {
        var client = getClient(path);
        return client.getListing(path, cb, context);
    }

    return {
        exports: {
            getListing: getListing,
            getObject: getObject,
            setObject: setObject,
            removeObject: removeObject,
            archiveObject: archiveObject,
            publishObject: publishObject
        }
    }
});


