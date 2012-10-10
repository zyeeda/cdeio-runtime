// Generated by CoffeeScript 1.3.3
(function() {
  var Add, Application, Context, Edit, ID_SUFFIX, attachDomain, autoMount, callHook, callValidator, coala, createConverter, createEntity, createMockRouter, createService, createValidator, defaultHandlers, defaultRouters, entityMetaResovler, extendRouter, getJsonFilter, getService, html, json, log, mergeEntityAndParameter, mountMockRouter, objects, paths, processRepository, processRoot, resolveEntity, type, validator, _ref, _ref1, _ref2,
    __slice = [].slice;

  Context = com.zyeeda.framework.web.SpringAwareJsgiServlet.Context;

  Application = require('stick').Application;

  _ref = require('coala/util'), objects = _ref.objects, type = _ref.type, paths = _ref.paths;

  coala = require('coala/config').coala;

  _ref1 = require('coala/response'), json = _ref1.json, html = _ref1.html;

  createService = require('coala/scaffold/service').createService;

  createConverter = require('coala/scaffold/converter').createConverter;

  createValidator = require('coala/validator').createValidator;

  defaultRouters = require('coala/default-routers');

  _ref2 = com.zyeeda.framework.validator.group, Add = _ref2.Add, Edit = _ref2.Edit;

  validator = new createValidator();

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
    var r, _i, _len, _ref3;
    processRoot(router, repo, prefix);
    _ref3 = repo.getRepositories();
    for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
      r = _ref3[_i];
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
    var batchRemoveUrl, createUrl, entityMeta, excludes, getUrl, handlers, listUrl, name, r, removeUrl, service, updateUrl, _i, _len, _ref3;
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
    _ref3 = options.exclude || [];
    for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
      name = _ref3[_i];
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
    var name, router, _fn, _i, _len, _ref3;
    router = {
      gets: {},
      posts: {},
      puts: {},
      dels: {}
    };
    _ref3 = ['get', 'post', 'put', 'del'];
    _fn = function(name) {
      return router[name] = function(url, fn) {
        return router[name + 's'][url] = fn;
      };
    };
    for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
      name = _ref3[_i];
      _fn(name);
    }
    return router;
  };

  mountMockRouter = function(target, path, router) {
    var name, _i, _len, _ref3, _results;
    _ref3 = ['get', 'post', 'put', 'del'];
    _results = [];
    for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
      name = _ref3[_i];
      _results.push((function(name) {
        var fn, url, _ref4, _results1;
        _ref4 = router[name + 's'];
        _results1 = [];
        for (url in _ref4) {
          fn = _ref4[url];
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
    return options.service || createService(entityMeta.entityClass, entityMeta);
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
      var entity, result;
      result = callHook('before', 'Get', options, entityMeta, request, id);
      if (result !== true) {
        return result;
      }
      entity = service.get(id);
      result = callHook('before', 'Get', options, entityMeta, request, entity);
      if (result !== true) {
        return result;
      }
      return json(entity, getJsonFilter(options, 'get'));
    },
    create: function(options, service, entityMeta, request) {
      var conts, entity, errors, result;
      entity = createEntity(entityMeta.entityClass);
      mergeEntityAndParameter(options, request.params, entityMeta, 'create', entity);
      errors = [];
      result = callValidator('create', request.params['_formName_'], options, request, entity);
      conts = validator.validate(entity, Add);
      if (result.errors) {
        errors = errors.concat(result.errors);
      }
      if (conts.errors) {
        errors = errors.concat(conts.errors);
      }
      if (errors.length > 0) {
        return json({
          errors: errors
        });
      }
      result = callHook('before', 'Create', options, entityMeta, request, entity);
      if (result !== true) {
        return result;
      }
      entity = service.create(entity);
      result = callHook('after', 'Create', options, entityMeta, request, entity);
      if (result !== true) {
        return result;
      }
      return json(entity, getJsonFilter(options, 'create'));
    },
    update: function(options, service, entityMeta, request, id) {
      var conts, entity, errors, result;
      entity = createEntity(entityMeta.entityClass);
      mergeEntityAndParameter(options, request.params, entityMeta, 'create', entity);
      errors = [];
      result = callValidator('update', request.params['_formName_'], options, request, id);
      conts = validator.validate(entity, Edit);
      if (result.errors) {
        errors = errors.concat(result.errors);
      }
      if (conts.errors) {
        errors = errors.concat(conts.errors);
      }
      if (errors.length > 0) {
        return json({
          errors: errors
        });
      }
      result = callHook('before', 'Update', options, entityMeta, request, id);
      if (result !== true) {
        return result;
      }
      entity = service.update(id, mergeEntityAndParameter.bind(this, options, request.params, entityMeta, 'update'));
      result = callHook('after', 'Update', options, entityMeta, request, entity);
      if (result !== true) {
        return result;
      }
      return json(entity, getJsonFilter(options, 'update'));
    },
    remove: function(options, service, entityMeta, request, id) {
      var entity, result;
      result = callValidator('remove', request.params['_formName_'], options, request, id);
      if (result !== true) {
        return json(result);
      }
      result = callHook('before', 'Remove', options, entityMeta, request, id);
      if (result !== true) {
        return result;
      }
      entity = service.remove(id);
      result = callHook('after', 'Remove', options, entityMeta, request, entity);
      if (result !== true) {
        return result;
      }
      return json(entity.id, getJsonFilter(options, 'remove'));
    },
    batchRemove: function(options, service, entityMeta, request) {
      var e, ids, r, result;
      result = callValidator('batchRemove', request.params['_formName_'], options, request, ids);
      if (result !== true) {
        return json(result);
      }
      ids = request.params.ids;
      ids = type(ids) === 'string' ? [ids] : ids;
      result = callHook('before', 'BatchRemove', options, entityMeta, request, ids);
      if (result !== true) {
        return result;
      }
      r = service.remove.apply(service, ids);
      result = callHook('after', 'BatchRemove', options, entityMeta, request, r);
      if (result !== true) {
        return result;
      }
      r = type(r) === 'array' ? (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = r.length; _i < _len; _i++) {
          e = r[_i];
          _results.push(e.id);
        }
        return _results;
      })() : r.id;
      return json(r, getJsonFilter(options, 'batchRemove'));
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

  callHook = function() {
    var action, args, hook, hookType, meta, name, options, request;
    hookType = arguments[0], action = arguments[1], options = arguments[2], meta = arguments[3], request = arguments[4], args = 6 <= arguments.length ? __slice.call(arguments, 5) : [];
    if (!options.hooks) {
      return true;
    }
    name = hookType + action;
    hook = options.hooks[name];
    if (!hook || type(hook) !== 'function') {
      return true;
    }
    args.unshift(request);
    args.unshift(request.params['_formName_']);
    args.unshift(meta);
    return hook.apply(null, args);
  };

  callValidator = function() {
    var action, args, formName, options, request, valid;
    action = arguments[0], formName = arguments[1], options = arguments[2], request = arguments[3], args = 5 <= arguments.length ? __slice.call(arguments, 4) : [];
    if (!options.validators) {
      return true;
    }
    valid = options.validators[action];
    if (!valid || type(valid) !== 'function') {
      return true;
    }
    args.unshift(request);
    args.unshift(formName);
    return valid.apply(null, args);
  };

}).call(this);
