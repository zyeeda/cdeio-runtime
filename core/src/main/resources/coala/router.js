// Generated by CoffeeScript 1.3.3
(function() {
  var Application, Context, ID_SUFFIX, attachDomain, autoMount, coala, createConverter, createEntity, createMockRouter, createService, defaultHandlers, defaultRouters, entityMetaResovler, extendRouter, getJsonFilter, getService, html, json, log, mergeEntityAndParameter, mountMockRouter, objects, paths, processRepository, processRoot, resolveEntity, type, _ref, _ref1;

  Context = com.zyeeda.framework.web.SpringAwareJsgiServlet.Context;

  Application = require('stick').Application;

  _ref = require('coala/util'), objects = _ref.objects, type = _ref.type, paths = _ref.paths;

  coala = require('coala/config').coala;

  _ref1 = require('coala/response'), json = _ref1.json, html = _ref1.html;

  createService = require('coala/scaffold/service').createService;

  createConverter = require('coala/scaffold/converter').createConverter;

  defaultRouters = require('coala/default-routers');

  log = require('ringo/logging').getLogger(module.id);

  entityMetaResovler = Context.getInstance(module).getBeanByClass(com.zyeeda.framework.web.scaffold.EntityMetaResolver);

  processRoot = function(router, repo, prefix) {
    var module, r, routers, routersRepo, url, _i, _len;
    routersRepo = repo.getChildRepository(coala.routerFoldername);
    print(router, routersRepo, routersRepo.exists(), 'routers');
    if (!routersRepo.exists()) {
      return;
    }
    routers = routersRepo.getResources(false);
    for (_i = 0, _len = routers.length; _i < _len; _i++) {
      r = routers[_i];
      try {
        module = r.getModuleName();
        url = prefix + r.getBaseName();
        log.debug("mount " + module + " to " + url);
        router.mount(url, module);
      } catch (e) {
        log.warn("can't mount " + (r.getModuleName()) + ", it is not export and router");
      }
    }
    return true;
  };

  processRepository = function(router, repo, prefix) {
    var r, _i, _len, _ref2;
    processRoot(router, repo, prefix);
    _ref2 = repo.getRepositories();
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      r = _ref2[_i];
      processRepository(router, r, prefix + r.getName() + '/');
    }
    return true;
  };

  exports.createApplication = function(module, mountDefaultRouters) {
    var root, router;
    if (mountDefaultRouters == null) {
      mountDefaultRouters = true;
    }
    router = new Application();
    router.configure('mount');
    if (module) {
      root = module.getRepository('./');
      processRepository(router, root, '/');
    }
    if (mountDefaultRouters) {
      defaultRouters.mountTo(router);
    }
    return router;
  };

  exports.createRouter = function() {
    var router;
    router = new Application();
    router.configure('params', 'route');
    extendRouter(router);
    return router;
  };

  autoMount = function(router) {
    var repo, repos, resource, _i, _len, _results;
    repos = this.getRepository('./').getRepositories();
    _results = [];
    for (_i = 0, _len = repos.length; _i < _len; _i++) {
      repo = repos[_i];
      resource = repo.getResource('module.js');
      try {
        if (resource.exists()) {
          _results.push(router.mount("/" + (repo.getName()), resource.getModuleName()));
        } else {
          _results.push(void 0);
        }
      } catch (e) {
        _results.push(log.warn("can't mount " + (resource.getModuleName()) + ", it is not export an router"));
      }
    }
    return _results;
  };

  extendRouter = function(router) {
    router.attachDomain = attachDomain.bind(router, router);
    router.resolveEntity = resolveEntity.bind(router);
  };

  resolveEntity = function(entity, params, converters) {
    var entityMeta;
    entityMeta = entityMetaResovler.resolveEntity(entity.getClass());
    return mergeEntityAndParameter({
      converters: converters
    }, params, entityMeta, 'resolve', entity);
  };

  ID_SUFFIX = '/:id';

  attachDomain = function(router, path, clazz, options) {
    var batchRemoveUrl, createUrl, entityMeta, excludes, getUrl, handlers, listUrl, name, r, removeUrl, service, updateUrl, _i, _len, _ref2;
    if (options == null) {
      options = {};
    }
    entityMeta = entityMetaResovler.resolveEntity(clazz);
    if (entityMeta.path === null) {
      entityMeta.path = path;
    }
    path = entityMeta.path;
    listUrl = path;
    removeUrl = updateUrl = getUrl = path + ID_SUFFIX;
    createUrl = path;
    batchRemoveUrl = path + '/delete';
    excludes = {};
    _ref2 = options.exclude || [];
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      name = _ref2[_i];
      excludes[name] = true;
    }
    service = getService(options, entityMeta);
    handlers = objects.extend({}, defaultHandlers, options.handlers || {});
    if (!excludes.list) {
      router.get(listUrl, handlers.list.bind(handlers, options, service, entityMeta));
    }
    if (!excludes.get) {
      router.get(getUrl, handlers.get.bind(handlers, options, service, entityMeta));
    }
    if (!excludes.create) {
      router.post(createUrl, handlers.create.bind(handlers, options, service, entityMeta));
    }
    if (!excludes.update) {
      router.put(updateUrl, handlers.update.bind(handlers, options, service, entityMeta));
    }
    if (!excludes.remove) {
      router.del(removeUrl, handlers.remove.bind(handlers, options, service, entityMeta));
    }
    if (!excludes.batchRemove) {
      router.post(batchRemoveUrl, handlers.batchRemove.bind(handlers, options, service, entityMeta));
    }
    if (type(options.doWithRouter) === 'function') {
      r = createMockRouter();
      options.doWithRouter(r);
      mountMockRouter(router, path, r);
    }
    return router;
  };

  createMockRouter = function() {
    var name, router, _fn, _i, _len, _ref2;
    router = {
      gets: {},
      posts: {},
      puts: {},
      dels: {}
    };
    _ref2 = ['get', 'post', 'put', 'del'];
    _fn = function(name) {
      return router[name] = function(url, fn) {
        return router[name + 's'][url] = fn;
      };
    };
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      name = _ref2[_i];
      _fn(name);
    }
    return router;
  };

  mountMockRouter = function(target, path, router) {
    var name, _i, _len, _ref2, _results;
    _ref2 = ['get', 'post', 'put', 'del'];
    _results = [];
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      name = _ref2[_i];
      _results.push((function(name) {
        var fn, url, _ref3, _results1;
        _ref3 = router[name + 's'];
        _results1 = [];
        for (url in _ref3) {
          fn = _ref3[url];
          _results1.push(target[name].call(target, paths.join(path, url), fn));
        }
        return _results1;
      })(name));
    }
    return _results;
  };

  createEntity = function(clazz) {
    var c;
    c = clazz.getConstructor();
    return c.newInstance();
  };

  getService = function(options, entityMeta) {
    return options.service || createService(entityMeta.entityClass);
  };

  getJsonFilter = function(options, type) {
    if (!options.filters) {
      return {};
    }
    return options.filters[type] || options.filters.defaults || {};
  };

  defaultHandlers = {
    list: function(options, service, entityMeta, request) {
      var configs, count, entity, o, orders, pageSize, result;
      result = {};
      entity = createEntity(entityMeta.entityClass);
      mergeEntityAndParameter(options, request.params, entityMeta, 'list', entity);
      configs = coala.extractPaginationInfo(request.params);
      orders = coala.extractOrderInfo(request.params);
      if (configs != null) {
        configs.fetchCount = true;
        pageSize = configs.maxResults;
        count = service.list(entity, configs);
        result.recordCount = count;
        result.pageCount = Math.ceil(count / pageSize);
        delete configs.fetchCount;
      }
      if ((orders != null ? orders.length : void 0) !== 0) {
        configs = configs || {};
        configs.orderBy = orders;
      }
      result.results = service.list(entity, configs);
      o = coala.generateListResult(result.results, configs.currentPage, configs.maxResults, result.recordCount, result.pageCount);
      return json(o, getJsonFilter(options, 'list'));
    },
    get: function(options, service, entityMeta, request, id) {
      return json(service.get(id), getJsonFilter(options, 'get'));
    },
    create: function(options, service, entityMeta, request) {
      var entity;
      entity = createEntity(entityMeta.entityClass);
      mergeEntityAndParameter(options, request.params, entityMeta, 'create', entity);
      return json(service.create(entity), getJsonFilter(options, 'create'));
    },
    update: function(options, service, entityMeta, request, id) {
      var entity;
      entity = service.update(id, mergeEntityAndParameter.bind(this, options, request.params, entityMeta, 'update'));
      return json(entity, getJsonFilter(options, 'update'));
    },
    remove: function(options, service, entityMeta, request, id) {
      return json(service.remove(id), getJsonFilter(options, 'remove'));
    },
    batchRemove: function(options, service, entityMeta, request) {
      var ids, result;
      ids = request.params.ids;
      ids = type(ids) === 'string' ? [ids] : ids;
      result = service.remove.apply(service, ids);
      return json(result, getJsonFilter(options, 'batchRemove'));
    }
  };

  mergeEntityAndParameter = function(options, params, entityMeta, type, entity) {
    var converter, key, value;
    converter = createConverter(options.converters);
    for (key in params) {
      value = params[key];
      if (!entityMeta.hasField(key)) {
        continue;
      }
      entity[key] = converter.convert(value, entityMeta.getField(key));
    }
    if (typeof options.afterMerge === "function") {
      options.afterMerge(entity, type);
    }
    return entity;
  };

}).call(this);
