remoteStorage.defineModule('root', function(client) {
  return {
    exports: {
      getListing: client.getListing,
      getObject: client.getObject,
      setObject: client.storeObject,
      removeObject: client.remove
    }
  }
});
