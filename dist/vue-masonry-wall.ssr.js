'use strict';Object.defineProperty(exports,'__esModule',{value:true});var maxBy=require('lodash.maxby'),vueObserveVisibility=require('vue-observe-visibility');function _interopDefaultLegacy(e){return e&&typeof e==='object'&&'default'in e?e:{'default':e}}var maxBy__default=/*#__PURE__*/_interopDefaultLegacy(maxBy);function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}

function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}/**
 * @param count number of columns to create
 * @returns {[{i: number, indexes: []},...]}
 */

var _newColumns = function _newColumns(count) {
  var columns = [];

  for (var i = 0; i < count; i++) {
    columns.push({
      i: i,
      indexes: []
    });
  }

  return columns;
};

var script = {
  name: "VueMasonryWall",
  directives: {
    'observe-visibility': vueObserveVisibility.ObserveVisibility
  },
  props: {
    /**
     * Array of items to add into masonry
     */
    items: {
      type: Array,
      required: true
    },

    /**
     * Options to config masonry.
     *
     * {
     *     width: 300,
     *     padding: {
     *         default: 12,
     *         1: 6,
     *         2: 8,
     *     },
     *     throttle: 300
     * }
     */
    options: {
      type: Object,
      required: false
    },

    /**
     * SSR has no clue what is the size of your height of your element or width of the browser.
     * You can however guess based on user-agent: https://github.com/nuxt-community/device-module
     * This param allow you to preload a config for SSR rendering, it will distribute your items into all columns evenly.
     *
     * Once the client is mounted, it will redraw if the config is different from SSR.
     *
     * {
     *     column: 2
     * }
     */
    ssr: {
      type: Object,
      required: false
    }
  },
  data: function data() {
    var count = this.ssr && this.ssr.columns;

    if (count > 0) {
      var columns = _newColumns(count);

      for (var i = 0; i < this.items.length; i++) {
        columns[i % count].indexes.push(i);
      }

      return {
        columns: columns,
        cursor: this.items.length,
        ready: false
      };
    }

    return {
      columns: [],
      cursor: 0,
      ready: false
    };
  },

  /**
   * For detecting browser resize event to redraw the columns.
   */
  mounted: function mounted() {
    var _this = this;

    this.$resize = function () {
      if (_this.columns.length !== _this._columnSize()) {
        _this.redraw();
      }
    };

    this.$resize(); // set opacity to 1 when ssr.columns is recieved and  this.columns.length === this._columnSize() so redraw does not get called for the first time.

    if (!this.ready) this.ready = true;
    window.addEventListener('resize', this.$resize);
  },

  /**
   * Remove resize event listener
   */
  beforeDestroy: function beforeDestroy() {
    window.removeEventListener('resize', this.$resize);
  },
  computed: {
    /**
     * Options with default override if not given
     *
     * @private
     */
    _options: function _options() {
      var options = this.options;
      return {
        width: options && options.width || 300,
        padding: {
          default: options && options.padding && options.padding.default || 12
        },
        throttle: options && options.throttle || 300
      };
    },

    /**
     * Style of wall, column and item for padding
     * @private
     */
    _style: function _style() {
      var padding = this.options && this.options.padding;

      if (padding && typeof padding != 'number') {
        padding = this.options.padding[this.columns.length] || this._options.padding.default;
      }

      return {
        wall: {
          margin: "-".concat(padding, "px")
        },
        lane: {
          paddingLeft: "".concat(padding, "px"),
          paddingRight: "".concat(padding, "px")
        },
        item: {
          paddingTop: "".concat(padding, "px"),
          paddingBottom: "".concat(padding, "px")
        }
      };
    }
  },
  methods: {
    /**
     * Redraw masonry
     */
    redraw: function redraw() {
      var _this$columns;

      this.ready = false;
      this.columns.splice(0);
      this.cursor = 0;

      (_this$columns = this.columns).push.apply(_this$columns, _toConsumableArray(_newColumns(this._columnSize())));

      this.ready = true;

      this._fill();
    },

    /**
     *
     * @returns {number}
     * @private internal component use
     */
    _columnSize: function _columnSize() {
      var length = Math.round(this.$refs.wall.scrollWidth / this._options.width);
      if (length < 1) return 1;
      return length;
    },

    /**
     * Add items into masonry columns, items are added to the shortest column first.
     *
     * @private internal component use
     */
    _fill: function _fill() {
      var _this2 = this;

      if (!this.ready) return;

      if (this.cursor >= this.items.length) {
        // Request for more items
        this.$emit('append');
        return;
      } // Keep filling until no more items


      this.$nextTick(function () {
        var bottom = maxBy__default['default'](_this2.$refs.bottom, function (spacer) {
          return spacer.clientHeight || 0;
        });

        _this2._addItem(bottom.dataset.column);

        _this2._fill();
      });
    },

    /**
     * Items will automatically be taken from items with cursor.
     *
     * @param index of the column to add to
     * @private internal component use
     */
    _addItem: function _addItem(index) {
      var column = this.columns[index];

      if (this.items[this.cursor]) {
        column.indexes.push(this.cursor);
        this.cursor++;
      }
    }
  }
};function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
    if (typeof shadowMode !== 'boolean') {
        createInjectorSSR = createInjector;
        createInjector = shadowMode;
        shadowMode = false;
    }
    // Vue.extend constructor export interop.
    const options = typeof script === 'function' ? script.options : script;
    // render functions
    if (template && template.render) {
        options.render = template.render;
        options.staticRenderFns = template.staticRenderFns;
        options._compiled = true;
        // functional template
        if (isFunctionalTemplate) {
            options.functional = true;
        }
    }
    // scopedId
    if (scopeId) {
        options._scopeId = scopeId;
    }
    let hook;
    if (moduleIdentifier) {
        // server build
        hook = function (context) {
            // 2.3 injection
            context =
                context || // cached call
                    (this.$vnode && this.$vnode.ssrContext) || // stateful
                    (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext); // functional
            // 2.2 with runInNewContext: true
            if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
                context = __VUE_SSR_CONTEXT__;
            }
            // inject component styles
            if (style) {
                style.call(this, createInjectorSSR(context));
            }
            // register component module identifier for async chunk inference
            if (context && context._registeredComponents) {
                context._registeredComponents.add(moduleIdentifier);
            }
        };
        // used by ssr in case component is cached and beforeCreate
        // never gets called
        options._ssrRegister = hook;
    }
    else if (style) {
        hook = shadowMode
            ? function (context) {
                style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot));
            }
            : function (context) {
                style.call(this, createInjector(context));
            };
    }
    if (hook) {
        if (options.functional) {
            // register for functional component in vue file
            const originalRender = options.render;
            options.render = function renderWithStyleInjection(h, context) {
                hook.call(context);
                return originalRender(h, context);
            };
        }
        else {
            // inject component registration as beforeCreate hook
            const existing = options.beforeCreate;
            options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
    }
    return script;
}function createInjectorSSR(context) {
    if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
        context = __VUE_SSR_CONTEXT__;
    }
    if (!context)
        return () => { };
    if (!('styles' in context)) {
        context._styles = context._styles || {};
        Object.defineProperty(context, 'styles', {
            enumerable: true,
            get: () => context._renderStyles(context._styles)
        });
        context._renderStyles = context._renderStyles || renderStyles;
    }
    return (id, style) => addStyle(id, style, context);
}
function addStyle(id, css, context) {
    const group = css.media || 'default' ;
    const style = context._styles[group] || (context._styles[group] = { ids: [], css: '' });
    if (!style.ids.includes(id)) {
        style.media = css.media;
        style.ids.push(id);
        let code = css.source;
        style.css += code + '\n';
    }
}
function renderStyles(styles) {
    let css = '';
    for (const key in styles) {
        const style = styles[key];
        css +=
            '<style data-vue-ssr-id="' +
                Array.from(style.ids).join(' ') +
                '"' +
                (style.media ? ' media="' + style.media + '"' : '') +
                '>' +
                style.css +
                '</style>';
    }
    return css;
}/* script */
var __vue_script__ = script;
/* template */

var __vue_render__ = function __vue_render__() {
  var _vm = this;

  var _h = _vm.$createElement;

  var _c = _vm._self._c || _h;

  return _c('div', {
    ref: "wall",
    staticClass: "masonry-wall",
    class: {
      ready: _vm.ready
    },
    style: _vm._style.wall
  }, _vm._l(_vm.columns, function (lane, index) {
    return _vm._ssrNode("<div class=\"masonry-column\"" + _vm._ssrStyle(null, _vm._style.lane, null) + " data-v-81446dba>", "</div>", [_vm._l(lane.indexes, function (i) {
      return _vm._ssrNode("<div class=\"masonry-item\"" + _vm._ssrStyle(null, _vm._style.item, null) + " data-v-81446dba>", "</div>", [_vm._t("default", function () {
        return [_vm._v(_vm._s(_vm.items[i]))];
      }, {
        "item": _vm.items[i],
        "index": i
      })], 2);
    }), _vm._ssrNode(" "), _c('div', {
      directives: [{
        name: "observe-visibility",
        rawName: "v-observe-visibility",
        value: {
          callback: function callback(v) {
            return v && _vm._fill();
          },
          throttle: _vm._options.throttle
        },
        expression: "{callback: (v) => v && _fill(),throttle:_options.throttle}"
      }],
      ref: "bottom",
      refInFor: true,
      staticClass: "masonry-bottom",
      attrs: {
        "data-column": index
      }
    }, [])], 2);
  }), 0);
};

var __vue_staticRenderFns__ = [];
/* style */

var __vue_inject_styles__ = function __vue_inject_styles__(inject) {
  if (!inject) return;
  inject("data-v-81446dba_0", {
    source: ".masonry-wall[data-v-81446dba]{display:flex}.masonry-wall[data-v-81446dba]:not(.ready){opacity:0}.masonry-column[data-v-81446dba]{flex-grow:1;flex-basis:0;display:flex;flex-direction:column}.masonry-bottom[data-v-81446dba]{flex-grow:1;margin-top:-300px;padding-top:300px;min-height:100px;z-index:-1}",
    map: undefined,
    media: undefined
  });
};
/* scoped */


var __vue_scope_id__ = "data-v-81446dba";
/* module identifier */

var __vue_module_identifier__ = "data-v-81446dba";
/* functional template */

var __vue_is_functional_template__ = false;
/* style inject shadow dom */

var __vue_component__ = /*#__PURE__*/normalizeComponent({
  render: __vue_render__,
  staticRenderFns: __vue_staticRenderFns__
}, __vue_inject_styles__, __vue_script__, __vue_scope_id__, __vue_is_functional_template__, __vue_module_identifier__, false, undefined, createInjectorSSR, undefined);// Import vue component

var install = function installVueMasonryWall(Vue) {
  if (install.installed) return;
  install.installed = true;
  Vue.component('VueMasonryWall', __vue_component__);
}; // Create module definition for Vue.use()


var plugin = {
  install: install
}; // To auto-install on non-es builds, when vue is found
// eslint-disable-next-line no-redeclare

/* global window, global */

{
  var GlobalVue = null;

  if (typeof window !== "undefined") {
    GlobalVue = window.Vue;
  } else if (typeof global !== "undefined") {
    GlobalVue = global.Vue;
  }

  if (GlobalVue) {
    GlobalVue.use(plugin);
  }
} // Inject install function into component - allows component
// to be registered via Vue.use() as well as Vue.component()


__vue_component__.install = install; // Export component by default
// also be used as directives, etc. - eg. import { RollupDemoDirective } from 'rollup-demo';
// export const RollupDemoDirective = component;
exports['default']=__vue_component__;