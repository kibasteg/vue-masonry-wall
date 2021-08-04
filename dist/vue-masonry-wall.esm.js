import maxBy from 'lodash.maxby';
import { ObserveVisibility } from 'vue-observe-visibility';

//
/**
 * @param count number of columns to create
 * @returns {[{i: number, indexes: []},...]}
 */

const _newColumns = count => {
  const columns = [];

  for (let i = 0; i < count; i++) {
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
    'observe-visibility': ObserveVisibility
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

  data() {
    const count = this.ssr && this.ssr.columns;

    if (count > 0) {
      const columns = _newColumns(count);

      for (let i = 0; i < this.items.length; i++) {
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
  mounted() {
    this.$resize = () => {
      if (this.columns.length !== this._columnSize()) {
        this.redraw();
      }
    };

    this.$resize(); // set opacity to 1 when ssr.columns is recieved and  this.columns.length === this._columnSize() so redraw does not get called for the first time.

    if (!this.ready) this.ready = true;
    window.addEventListener('resize', this.$resize);
  },

  /**
   * Remove resize event listener
   */
  beforeDestroy() {
    window.removeEventListener('resize', this.$resize);
  },

  computed: {
    /**
     * Options with default override if not given
     *
     * @private
     */
    _options() {
      const options = this.options;
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
    _style() {
      let padding = this.options && this.options.padding;

      if (padding && typeof padding != 'number') {
        padding = this.options.padding[this.columns.length] || this._options.padding.default;
      }

      return {
        wall: {
          margin: `-${padding}px`
        },
        lane: {
          paddingLeft: `${padding}px`,
          paddingRight: `${padding}px`
        },
        item: {
          paddingTop: `${padding}px`,
          paddingBottom: `${padding}px`
        }
      };
    }

  },
  methods: {
    /**
     * Redraw masonry
     */
    redraw() {
      this.ready = false;
      this.columns.splice(0);
      this.cursor = 0;
      this.columns.push(..._newColumns(this._columnSize()));
      this.ready = true;

      this._fill();
    },

    /**
     *
     * @returns {number}
     * @private internal component use
     */
    _columnSize() {
      const length = Math.round(this.$refs.wall.scrollWidth / this._options.width);
      if (length < 1) return 1;
      return length;
    },

    /**
     * Add items into masonry columns, items are added to the shortest column first.
     *
     * @private internal component use
     */
    _fill() {
      if (!this.ready) return;

      if (this.cursor >= this.items.length) {
        // Request for more items
        this.$emit('append');
        return;
      } // Keep filling until no more items


      this.$nextTick(() => {
        const bottom = maxBy(this.$refs.bottom, spacer => spacer.clientHeight || 0);

        this._addItem(bottom.dataset.column);

        this._fill();
      });
    },

    /**
     * Items will automatically be taken from items with cursor.
     *
     * @param index of the column to add to
     * @private internal component use
     */
    _addItem(index) {
      const column = this.columns[index];

      if (this.items[this.cursor]) {
        column.indexes.push(this.cursor);
        this.cursor++;
      }
    }

  }
};

function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
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
}

const isOldIE = typeof navigator !== 'undefined' &&
    /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());
function createInjector(context) {
    return (id, style) => addStyle(id, style);
}
let HEAD;
const styles = {};
function addStyle(id, css) {
    const group = isOldIE ? css.media || 'default' : id;
    const style = styles[group] || (styles[group] = { ids: new Set(), styles: [] });
    if (!style.ids.has(id)) {
        style.ids.add(id);
        let code = css.source;
        if (css.map) {
            // https://developer.chrome.com/devtools/docs/javascript-debugging
            // this makes source maps inside style tags work properly in Chrome
            code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
            // http://stackoverflow.com/a/26603875
            code +=
                '\n/*# sourceMappingURL=data:application/json;base64,' +
                    btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
                    ' */';
        }
        if (!style.element) {
            style.element = document.createElement('style');
            style.element.type = 'text/css';
            if (css.media)
                style.element.setAttribute('media', css.media);
            if (HEAD === undefined) {
                HEAD = document.head || document.getElementsByTagName('head')[0];
            }
            HEAD.appendChild(style.element);
        }
        if ('styleSheet' in style.element) {
            style.styles.push(code);
            style.element.styleSheet.cssText = style.styles
                .filter(Boolean)
                .join('\n');
        }
        else {
            const index = style.ids.size - 1;
            const textNode = document.createTextNode(code);
            const nodes = style.element.childNodes;
            if (nodes[index])
                style.element.removeChild(nodes[index]);
            if (nodes.length)
                style.element.insertBefore(textNode, nodes[index]);
            else
                style.element.appendChild(textNode);
        }
    }
}

/* script */
const __vue_script__ = script;
/* template */

var __vue_render__ = function () {
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
    return _c('div', {
      key: index,
      staticClass: "masonry-column",
      style: _vm._style.lane
    }, [_vm._l(lane.indexes, function (i) {
      return _c('div', {
        key: i,
        ref: "item_" + i,
        refInFor: true,
        staticClass: "masonry-item",
        style: _vm._style.item
      }, [_vm._t("default", function () {
        return [_vm._v(_vm._s(_vm.items[i]))];
      }, {
        "item": _vm.items[i],
        "index": i
      })], 2);
    }), _vm._v(" "), _c('div', {
      directives: [{
        name: "observe-visibility",
        rawName: "v-observe-visibility",
        value: {
          callback: function (v) {
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
    })], 2);
  }), 0);
};

var __vue_staticRenderFns__ = [];
/* style */

const __vue_inject_styles__ = function (inject) {
  if (!inject) return;
  inject("data-v-81446dba_0", {
    source: ".masonry-wall[data-v-81446dba]{display:flex}.masonry-wall[data-v-81446dba]:not(.ready){opacity:0}.masonry-column[data-v-81446dba]{flex-grow:1;flex-basis:0;display:flex;flex-direction:column}.masonry-bottom[data-v-81446dba]{flex-grow:1;margin-top:-300px;padding-top:300px;min-height:100px;z-index:-1}",
    map: undefined,
    media: undefined
  });
};
/* scoped */


const __vue_scope_id__ = "data-v-81446dba";
/* module identifier */

const __vue_module_identifier__ = undefined;
/* functional template */

const __vue_is_functional_template__ = false;
/* style inject SSR */

/* style inject shadow dom */

const __vue_component__ = /*#__PURE__*/normalizeComponent({
  render: __vue_render__,
  staticRenderFns: __vue_staticRenderFns__
}, __vue_inject_styles__, __vue_script__, __vue_scope_id__, __vue_is_functional_template__, __vue_module_identifier__, false, createInjector, undefined, undefined);

// Import vue component

const install = function installVueMasonryWall(Vue) {
  if (install.installed) return;
  install.installed = true;
  Vue.component('VueMasonryWall', __vue_component__);
}; // Create module definition for Vue.use()
// to be registered via Vue.use() as well as Vue.component()


__vue_component__.install = install; // Export component by default
// also be used as directives, etc. - eg. import { RollupDemoDirective } from 'rollup-demo';
// export const RollupDemoDirective = component;

export { __vue_component__ as default };
