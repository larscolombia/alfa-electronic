import {
  require_dayjs_min
} from "./chunk-GLH46DSG.js";
import {
  FormsModule,
  NG_VALUE_ACCESSOR,
  NgControlStatus,
  NgModel,
  NgSelectOption,
  ReactiveFormsModule,
  SelectControlValueAccessor,
  ɵNgSelectMultipleOption
} from "./chunk-TIXNPMVR.js";
import {
  CommonModule,
  NgClass
} from "./chunk-KB6ULYPZ.js";
import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  Injectable,
  InjectionToken,
  Injector,
  Input,
  NgModule,
  Output,
  Renderer2,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  makeEnvironmentProviders,
  model,
  output,
  setClassMetadata,
  signal,
  viewChild,
  ɵɵProvidersFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵconditionalCreate,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdomElementEnd,
  ɵɵdomElementStart,
  ɵɵdomListener,
  ɵɵdomProperty,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵpureFunction7,
  ɵɵqueryAdvance,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵresolveDocument,
  ɵɵresolveWindow,
  ɵɵrestoreView,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty,
  ɵɵviewQuerySignal
} from "./chunk-XD53XXAP.js";
import "./chunk-JRFR6BLO.js";
import "./chunk-HWYXSU2G.js";
import "./chunk-MARUHEWW.js";
import {
  __commonJS,
  __spreadProps,
  __spreadValues,
  __toESM
} from "./chunk-N6ESDQJH.js";

// node_modules/dayjs/plugin/localeData.js
var require_localeData = __commonJS({
  "node_modules/dayjs/plugin/localeData.js"(exports, module) {
    !(function(n, e) {
      "object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : (n = "undefined" != typeof globalThis ? globalThis : n || self).dayjs_plugin_localeData = e();
    })(exports, (function() {
      "use strict";
      return function(n, e, t) {
        var r = e.prototype, o = function(n2) {
          return n2 && (n2.indexOf ? n2 : n2.s);
        }, u = function(n2, e2, t2, r2, u2) {
          var i2 = n2.name ? n2 : n2.$locale(), a2 = o(i2[e2]), s2 = o(i2[t2]), f = a2 || s2.map((function(n3) {
            return n3.slice(0, r2);
          }));
          if (!u2) return f;
          var d = i2.weekStart;
          return f.map((function(n3, e3) {
            return f[(e3 + (d || 0)) % 7];
          }));
        }, i = function() {
          return t.Ls[t.locale()];
        }, a = function(n2, e2) {
          return n2.formats[e2] || (function(n3) {
            return n3.replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g, (function(n4, e3, t2) {
              return e3 || t2.slice(1);
            }));
          })(n2.formats[e2.toUpperCase()]);
        }, s = function() {
          var n2 = this;
          return { months: function(e2) {
            return e2 ? e2.format("MMMM") : u(n2, "months");
          }, monthsShort: function(e2) {
            return e2 ? e2.format("MMM") : u(n2, "monthsShort", "months", 3);
          }, firstDayOfWeek: function() {
            return n2.$locale().weekStart || 0;
          }, weekdays: function(e2) {
            return e2 ? e2.format("dddd") : u(n2, "weekdays");
          }, weekdaysMin: function(e2) {
            return e2 ? e2.format("dd") : u(n2, "weekdaysMin", "weekdays", 2);
          }, weekdaysShort: function(e2) {
            return e2 ? e2.format("ddd") : u(n2, "weekdaysShort", "weekdays", 3);
          }, longDateFormat: function(e2) {
            return a(n2.$locale(), e2);
          }, meridiem: this.$locale().meridiem, ordinal: this.$locale().ordinal };
        };
        r.localeData = function() {
          return s.bind(this)();
        }, t.localeData = function() {
          var n2 = i();
          return { firstDayOfWeek: function() {
            return n2.weekStart || 0;
          }, weekdays: function() {
            return t.weekdays();
          }, weekdaysShort: function() {
            return t.weekdaysShort();
          }, weekdaysMin: function() {
            return t.weekdaysMin();
          }, months: function() {
            return t.months();
          }, monthsShort: function() {
            return t.monthsShort();
          }, longDateFormat: function(e2) {
            return a(n2, e2);
          }, meridiem: n2.meridiem, ordinal: n2.ordinal };
        }, t.months = function() {
          return u(i(), "months");
        }, t.monthsShort = function() {
          return u(i(), "monthsShort", "months", 3);
        }, t.weekdays = function(n2) {
          return u(i(), "weekdays", null, null, n2);
        }, t.weekdaysShort = function(n2) {
          return u(i(), "weekdaysShort", "weekdays", 3, n2);
        }, t.weekdaysMin = function(n2) {
          return u(i(), "weekdaysMin", "weekdays", 2, n2);
        };
      };
    }));
  }
});

// node_modules/dayjs/plugin/localizedFormat.js
var require_localizedFormat = __commonJS({
  "node_modules/dayjs/plugin/localizedFormat.js"(exports, module) {
    !(function(e, t) {
      "object" == typeof exports && "undefined" != typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define(t) : (e = "undefined" != typeof globalThis ? globalThis : e || self).dayjs_plugin_localizedFormat = t();
    })(exports, (function() {
      "use strict";
      var e = { LTS: "h:mm:ss A", LT: "h:mm A", L: "MM/DD/YYYY", LL: "MMMM D, YYYY", LLL: "MMMM D, YYYY h:mm A", LLLL: "dddd, MMMM D, YYYY h:mm A" };
      return function(t, o, n) {
        var r = o.prototype, i = r.format;
        n.en.formats = e, r.format = function(t2) {
          void 0 === t2 && (t2 = "YYYY-MM-DDTHH:mm:ssZ");
          var o2 = this.$locale().formats, n2 = (function(t3, o3) {
            return t3.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g, (function(t4, n3, r2) {
              var i2 = r2 && r2.toUpperCase();
              return n3 || o3[r2] || e[r2] || o3[i2].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g, (function(e2, t5, o4) {
                return t5 || o4.slice(1);
              }));
            }));
          })(t2, void 0 === o2 ? {} : o2);
          return i.call(this, n2);
        };
      };
    }));
  }
});

// node_modules/dayjs/plugin/isoWeek.js
var require_isoWeek = __commonJS({
  "node_modules/dayjs/plugin/isoWeek.js"(exports, module) {
    !(function(e, t) {
      "object" == typeof exports && "undefined" != typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define(t) : (e = "undefined" != typeof globalThis ? globalThis : e || self).dayjs_plugin_isoWeek = t();
    })(exports, (function() {
      "use strict";
      var e = "day";
      return function(t, i, s) {
        var a = function(t2) {
          return t2.add(4 - t2.isoWeekday(), e);
        }, d = i.prototype;
        d.isoWeekYear = function() {
          return a(this).year();
        }, d.isoWeek = function(t2) {
          if (!this.$utils().u(t2)) return this.add(7 * (t2 - this.isoWeek()), e);
          var i2, d2, n2, o, r = a(this), u = (i2 = this.isoWeekYear(), d2 = this.$u, n2 = (d2 ? s.utc : s)().year(i2).startOf("year"), o = 4 - n2.isoWeekday(), n2.isoWeekday() > 4 && (o += 7), n2.add(o, e));
          return r.diff(u, "week") + 1;
        }, d.isoWeekday = function(e2) {
          return this.$utils().u(e2) ? this.day() || 7 : this.day(this.day() % 7 ? e2 : e2 - 7);
        };
        var n = d.startOf;
        d.startOf = function(e2, t2) {
          var i2 = this.$utils(), s2 = !!i2.u(t2) || t2;
          return "isoweek" === i2.p(e2) ? s2 ? this.date(this.date() - (this.isoWeekday() - 1)).startOf("day") : this.date(this.date() - 1 - (this.isoWeekday() - 1) + 7).endOf("day") : n.bind(this)(e2, t2);
        };
      };
    }));
  }
});

// node_modules/dayjs/plugin/weekOfYear.js
var require_weekOfYear = __commonJS({
  "node_modules/dayjs/plugin/weekOfYear.js"(exports, module) {
    !(function(e, t) {
      "object" == typeof exports && "undefined" != typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define(t) : (e = "undefined" != typeof globalThis ? globalThis : e || self).dayjs_plugin_weekOfYear = t();
    })(exports, (function() {
      "use strict";
      var e = "week", t = "year";
      return function(i, n, r) {
        var f = n.prototype;
        f.week = function(i2) {
          if (void 0 === i2 && (i2 = null), null !== i2) return this.add(7 * (i2 - this.week()), "day");
          var n2 = this.$locale().yearStart || 1;
          if (11 === this.month() && this.date() > 25) {
            var f2 = r(this).startOf(t).add(1, t).date(n2), s = r(this).endOf(e);
            if (f2.isBefore(s)) return 1;
          }
          var a = r(this).startOf(t).date(n2).startOf(e).subtract(1, "millisecond"), o = this.diff(a, e, true);
          return o < 0 ? r(this).startOf("week").week() : Math.ceil(o);
        }, f.weeks = function(e2) {
          return void 0 === e2 && (e2 = null), this.week(e2);
        };
      };
    }));
  }
});

// node_modules/dayjs/plugin/customParseFormat.js
var require_customParseFormat = __commonJS({
  "node_modules/dayjs/plugin/customParseFormat.js"(exports, module) {
    !(function(e, t) {
      "object" == typeof exports && "undefined" != typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define(t) : (e = "undefined" != typeof globalThis ? globalThis : e || self).dayjs_plugin_customParseFormat = t();
    })(exports, (function() {
      "use strict";
      var e = { LTS: "h:mm:ss A", LT: "h:mm A", L: "MM/DD/YYYY", LL: "MMMM D, YYYY", LLL: "MMMM D, YYYY h:mm A", LLLL: "dddd, MMMM D, YYYY h:mm A" }, t = /(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|Q|YYYY|YY?|ww?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g, n = /\d/, r = /\d\d/, i = /\d\d?/, o = /\d*[^-_:/,()\s\d]+/, s = {}, a = function(e2) {
        return (e2 = +e2) + (e2 > 68 ? 1900 : 2e3);
      };
      var f = function(e2) {
        return function(t2) {
          this[e2] = +t2;
        };
      }, h = [/[+-]\d\d:?(\d\d)?|Z/, function(e2) {
        (this.zone || (this.zone = {})).offset = (function(e3) {
          if (!e3) return 0;
          if ("Z" === e3) return 0;
          var t2 = e3.match(/([+-]|\d\d)/g), n2 = 60 * t2[1] + (+t2[2] || 0);
          return 0 === n2 ? 0 : "+" === t2[0] ? -n2 : n2;
        })(e2);
      }], u = function(e2) {
        var t2 = s[e2];
        return t2 && (t2.indexOf ? t2 : t2.s.concat(t2.f));
      }, d = function(e2, t2) {
        var n2, r2 = s.meridiem;
        if (r2) {
          for (var i2 = 1; i2 <= 24; i2 += 1) if (e2.indexOf(r2(i2, 0, t2)) > -1) {
            n2 = i2 > 12;
            break;
          }
        } else n2 = e2 === (t2 ? "pm" : "PM");
        return n2;
      }, c = { A: [o, function(e2) {
        this.afternoon = d(e2, false);
      }], a: [o, function(e2) {
        this.afternoon = d(e2, true);
      }], Q: [n, function(e2) {
        this.month = 3 * (e2 - 1) + 1;
      }], S: [n, function(e2) {
        this.milliseconds = 100 * +e2;
      }], SS: [r, function(e2) {
        this.milliseconds = 10 * +e2;
      }], SSS: [/\d{3}/, function(e2) {
        this.milliseconds = +e2;
      }], s: [i, f("seconds")], ss: [i, f("seconds")], m: [i, f("minutes")], mm: [i, f("minutes")], H: [i, f("hours")], h: [i, f("hours")], HH: [i, f("hours")], hh: [i, f("hours")], D: [i, f("day")], DD: [r, f("day")], Do: [o, function(e2) {
        var t2 = s.ordinal, n2 = e2.match(/\d+/);
        if (this.day = n2[0], t2) for (var r2 = 1; r2 <= 31; r2 += 1) t2(r2).replace(/\[|\]/g, "") === e2 && (this.day = r2);
      }], w: [i, f("week")], ww: [r, f("week")], M: [i, f("month")], MM: [r, f("month")], MMM: [o, function(e2) {
        var t2 = u("months"), n2 = (u("monthsShort") || t2.map((function(e3) {
          return e3.slice(0, 3);
        }))).indexOf(e2) + 1;
        if (n2 < 1) throw new Error();
        this.month = n2 % 12 || n2;
      }], MMMM: [o, function(e2) {
        var t2 = u("months").indexOf(e2) + 1;
        if (t2 < 1) throw new Error();
        this.month = t2 % 12 || t2;
      }], Y: [/[+-]?\d+/, f("year")], YY: [r, function(e2) {
        this.year = a(e2);
      }], YYYY: [/\d{4}/, f("year")], Z: h, ZZ: h };
      function l(n2) {
        var r2, i2;
        r2 = n2, i2 = s && s.formats;
        for (var o2 = (n2 = r2.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g, (function(t2, n3, r3) {
          var o3 = r3 && r3.toUpperCase();
          return n3 || i2[r3] || e[r3] || i2[o3].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g, (function(e2, t3, n4) {
            return t3 || n4.slice(1);
          }));
        }))).match(t), a2 = o2.length, f2 = 0; f2 < a2; f2 += 1) {
          var h2 = o2[f2], u2 = c[h2], d2 = u2 && u2[0], l2 = u2 && u2[1];
          o2[f2] = l2 ? { regex: d2, parser: l2 } : h2.replace(/^\[|\]$/g, "");
        }
        return function(e2) {
          for (var t2 = {}, n3 = 0, r3 = 0; n3 < a2; n3 += 1) {
            var i3 = o2[n3];
            if ("string" == typeof i3) r3 += i3.length;
            else {
              var s2 = i3.regex, f3 = i3.parser, h3 = e2.slice(r3), u3 = s2.exec(h3)[0];
              f3.call(t2, u3), e2 = e2.replace(u3, "");
            }
          }
          return (function(e3) {
            var t3 = e3.afternoon;
            if (void 0 !== t3) {
              var n4 = e3.hours;
              t3 ? n4 < 12 && (e3.hours += 12) : 12 === n4 && (e3.hours = 0), delete e3.afternoon;
            }
          })(t2), t2;
        };
      }
      return function(e2, t2, n2) {
        n2.p.customParseFormat = true, e2 && e2.parseTwoDigitYear && (a = e2.parseTwoDigitYear);
        var r2 = t2.prototype, i2 = r2.parse;
        r2.parse = function(e3) {
          var t3 = e3.date, r3 = e3.utc, o2 = e3.args;
          this.$u = r3;
          var a2 = o2[1];
          if ("string" == typeof a2) {
            var f2 = true === o2[2], h2 = true === o2[3], u2 = f2 || h2, d2 = o2[2];
            h2 && (d2 = o2[2]), s = this.$locale(), !f2 && d2 && (s = n2.Ls[d2]), this.$d = (function(e4, t4, n3, r4) {
              try {
                if (["x", "X"].indexOf(t4) > -1) return new Date(("X" === t4 ? 1e3 : 1) * e4);
                var i3 = l(t4)(e4), o3 = i3.year, s2 = i3.month, a3 = i3.day, f3 = i3.hours, h3 = i3.minutes, u3 = i3.seconds, d3 = i3.milliseconds, c3 = i3.zone, m2 = i3.week, M2 = /* @__PURE__ */ new Date(), Y = a3 || (o3 || s2 ? 1 : M2.getDate()), p = o3 || M2.getFullYear(), v = 0;
                o3 && !s2 || (v = s2 > 0 ? s2 - 1 : M2.getMonth());
                var D, w = f3 || 0, g = h3 || 0, y = u3 || 0, L = d3 || 0;
                return c3 ? new Date(Date.UTC(p, v, Y, w, g, y, L + 60 * c3.offset * 1e3)) : n3 ? new Date(Date.UTC(p, v, Y, w, g, y, L)) : (D = new Date(p, v, Y, w, g, y, L), m2 && (D = r4(D).week(m2).toDate()), D);
              } catch (e5) {
                return /* @__PURE__ */ new Date("");
              }
            })(t3, a2, r3, n2), this.init(), d2 && true !== d2 && (this.$L = this.locale(d2).$L), u2 && t3 != this.format(a2) && (this.$d = /* @__PURE__ */ new Date("")), s = {};
          } else if (a2 instanceof Array) for (var c2 = a2.length, m = 1; m <= c2; m += 1) {
            o2[1] = a2[m - 1];
            var M = n2.apply(this, o2);
            if (M.isValid()) {
              this.$d = M.$d, this.$L = M.$L, this.init();
              break;
            }
            m === c2 && (this.$d = /* @__PURE__ */ new Date(""));
          }
          else i2.call(this, e3);
        };
      };
    }));
  }
});

// node_modules/ngx-daterangepicker-bootstrap/fesm2022/ngx-daterangepicker-bootstrap.mjs
var import_dayjs = __toESM(require_dayjs_min(), 1);
var import_localeData = __toESM(require_localeData(), 1);
var import_localizedFormat = __toESM(require_localizedFormat(), 1);
var import_isoWeek = __toESM(require_isoWeek(), 1);
var import_weekOfYear = __toESM(require_weekOfYear(), 1);
var import_customParseFormat = __toESM(require_customParseFormat(), 1);
var _c0 = (a0) => ({
  "active": a0
});
function RangesComponent_Conditional_0_For_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "li")(1, "button", 1);
    ɵɵlistener("click", function RangesComponent_Conditional_0_For_3_Template_button_click_1_listener($event) {
      const range_r2 = ɵɵrestoreView(_r1).$implicit;
      const ctx_r2 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r2.clickRange($event, range_r2));
    });
    ɵɵtext(2);
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    const range_r2 = ctx.$implicit;
    const ctx_r2 = ɵɵnextContext(2);
    ɵɵadvance();
    ɵɵproperty("disabled", ctx_r2.disableRange(range_r2))("ngClass", ɵɵpureFunction1(3, _c0, range_r2 === ctx_r2.chosenRange()));
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", range_r2, " ");
  }
}
function RangesComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 0)(1, "ul");
    ɵɵrepeaterCreate(2, RangesComponent_Conditional_0_For_3_Template, 3, 5, "li", null, ɵɵrepeaterTrackByIndex);
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = ɵɵnextContext();
    ɵɵadvance(2);
    ɵɵrepeater(ctx_r2.rangesArray());
  }
}
var _c1 = (a0, a1) => ({
  right: a0,
  left: a1
});
function CalendarComponent_Conditional_0_Conditional_1_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "th");
  }
}
function CalendarComponent_Conditional_0_Conditional_1_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "th", 11);
    ɵɵlistener("click", function CalendarComponent_Conditional_0_Conditional_1_Conditional_4_Template_th_click_0_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r1.clickPrev($event, ctx_r1.sideEnum.left));
    });
    ɵɵelementEnd();
  }
}
function CalendarComponent_Conditional_0_Conditional_1_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "th");
  }
}
function CalendarComponent_Conditional_0_Conditional_1_Conditional_7_For_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "option", 14);
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const m_r4 = ctx.$implicit;
    const ctx_r1 = ɵɵnextContext(4);
    ɵɵproperty("selected", ctx_r1.calendarVariables().left.dropdowns.currentMonth == m_r4)("value", m_r4)("disabled", ctx_r1.calendarVariables().left.dropdowns.inMinYear && m_r4 < ctx_r1.calendarVariables().left.minDate.month() || ctx_r1.calendarVariables().left.dropdowns.inMaxYear && m_r4 > ctx_r1.calendarVariables().left.maxDate.month());
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", ctx_r1.locale().monthNames[m_r4], " ");
  }
}
function CalendarComponent_Conditional_0_Conditional_1_Conditional_7_For_9_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "option", 16);
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const y_r5 = ctx.$implicit;
    const ctx_r1 = ɵɵnextContext(4);
    ɵɵproperty("selected", y_r5 === ctx_r1.calendarVariables().left.dropdowns.currentYear);
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", y_r5, " ");
  }
}
function CalendarComponent_Conditional_0_Conditional_1_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "div", 12);
    ɵɵtext(1);
    ɵɵelementStart(2, "select", 13);
    ɵɵlistener("change", function CalendarComponent_Conditional_0_Conditional_1_Conditional_7_Template_select_change_2_listener($event) {
      ɵɵrestoreView(_r3);
      const ctx_r1 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r1.monthChanged($event, ctx_r1.sideEnum.left));
    });
    ɵɵrepeaterCreate(3, CalendarComponent_Conditional_0_Conditional_1_Conditional_7_For_4_Template, 2, 4, "option", 14, ɵɵrepeaterTrackByIndex);
    ɵɵelementEnd()();
    ɵɵelementStart(5, "div", 12);
    ɵɵtext(6);
    ɵɵelementStart(7, "select", 15);
    ɵɵlistener("change", function CalendarComponent_Conditional_0_Conditional_1_Conditional_7_Template_select_change_7_listener($event) {
      ɵɵrestoreView(_r3);
      const ctx_r1 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r1.yearChanged($event, ctx_r1.sideEnum.left));
    });
    ɵɵrepeaterCreate(8, CalendarComponent_Conditional_0_Conditional_1_Conditional_7_For_9_Template, 2, 2, "option", 16, ɵɵrepeaterTrackByIndex);
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    let tmp_3_0;
    let tmp_5_0;
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", ctx_r1.locale().monthNames[(tmp_3_0 = ctx_r1.calendarVariables().left.calendar) == null ? null : tmp_3_0[1][1].month()], " ");
    ɵɵadvance(2);
    ɵɵrepeater(ctx_r1.calendarVariables().left.dropdowns.monthArrays);
    ɵɵadvance(3);
    ɵɵtextInterpolate1(" ", (tmp_5_0 = ctx_r1.calendarVariables().left.calendar) == null ? null : tmp_5_0[1][1].format(" YYYY"), " ");
    ɵɵadvance(2);
    ɵɵrepeater(ctx_r1.calendarVariables().left.dropdowns.yearArrays);
  }
}
function CalendarComponent_Conditional_0_Conditional_1_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtext(0);
  }
  if (rf & 2) {
    let tmp_3_0;
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵtextInterpolate2(" ", ctx_r1.locale().monthNames[(tmp_3_0 = ctx_r1.calendarVariables().left.calendar) == null ? null : tmp_3_0[1][1].month()], " ", (tmp_3_0 = ctx_r1.calendarVariables().left.calendar) == null ? null : tmp_3_0[1][1].format(" YYYY"), " ");
  }
}
function CalendarComponent_Conditional_0_Conditional_1_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "th", 17);
    ɵɵlistener("click", function CalendarComponent_Conditional_0_Conditional_1_Conditional_9_Template_th_click_0_listener($event) {
      ɵɵrestoreView(_r6);
      const ctx_r1 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r1.clickNext($event, ctx_r1.sideEnum.left));
    });
    ɵɵelementEnd();
  }
}
function CalendarComponent_Conditional_0_Conditional_1_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "th");
  }
}
function CalendarComponent_Conditional_0_Conditional_1_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "th", 8)(1, "span");
    ɵɵtext(2);
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵadvance(2);
    ɵɵtextInterpolate(ctx_r1.locale().weekLabel);
  }
}
function CalendarComponent_Conditional_0_Conditional_1_For_14_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "th")(1, "span");
    ɵɵtext(2);
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    const dayofweek_r7 = ctx.$implicit;
    ɵɵadvance(2);
    ɵɵtextInterpolate(dayofweek_r7);
  }
}
function CalendarComponent_Conditional_0_Conditional_1_For_17_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "td", 8)(1, "span");
    ɵɵtext(2);
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    let tmp_13_0;
    const row_r8 = ɵɵnextContext().$implicit;
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵadvance(2);
    ɵɵtextInterpolate((tmp_13_0 = ctx_r1.calendarVariables().left.calendar) == null ? null : tmp_13_0[row_r8][0].week());
  }
}
function CalendarComponent_Conditional_0_Conditional_1_For_17_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "td", 8)(1, "span");
    ɵɵtext(2);
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    let tmp_13_0;
    const row_r8 = ɵɵnextContext().$implicit;
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵadvance(2);
    ɵɵtextInterpolate((tmp_13_0 = ctx_r1.calendarVariables().left.calendar) == null ? null : tmp_13_0[row_r8][0].isoWeek());
  }
}
function CalendarComponent_Conditional_0_Conditional_1_For_17_For_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "td", 18);
    ɵɵlistener("click", function CalendarComponent_Conditional_0_Conditional_1_For_17_For_4_Template_td_click_0_listener($event) {
      const col_r10 = ɵɵrestoreView(_r9).$implicit;
      const row_r8 = ɵɵnextContext().$implicit;
      const ctx_r1 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r1.clickDate($event, ctx_r1.sideEnum.left, row_r8, col_r10));
    })("mouseenter", function CalendarComponent_Conditional_0_Conditional_1_For_17_For_4_Template_td_mouseenter_0_listener($event) {
      const col_r10 = ɵɵrestoreView(_r9).$implicit;
      const row_r8 = ɵɵnextContext().$implicit;
      const ctx_r1 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r1.hoverDate($event, ctx_r1.sideEnum.left, row_r8, col_r10));
    });
    ɵɵelementStart(1, "span");
    ɵɵtext(2);
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    let tmp_23_0;
    const col_r10 = ctx.$implicit;
    const row_r8 = ɵɵnextContext().$implicit;
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵclassMap(ctx_r1.calendarVariables().left.classes[row_r8][col_r10]);
    ɵɵadvance(2);
    ɵɵtextInterpolate((tmp_23_0 = ctx_r1.calendarVariables().left.calendar) == null ? null : tmp_23_0[row_r8][col_r10].date());
  }
}
function CalendarComponent_Conditional_0_Conditional_1_For_17_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "tr");
    ɵɵconditionalCreate(1, CalendarComponent_Conditional_0_Conditional_1_For_17_Conditional_1_Template, 3, 1, "td", 8);
    ɵɵconditionalCreate(2, CalendarComponent_Conditional_0_Conditional_1_For_17_Conditional_2_Template, 3, 1, "td", 8);
    ɵɵrepeaterCreate(3, CalendarComponent_Conditional_0_Conditional_1_For_17_For_4_Template, 3, 3, "td", 10, ɵɵrepeaterTrackByIndex);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const row_r8 = ctx.$implicit;
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵclassMap(ctx_r1.calendarVariables().left.classes[row_r8].classList);
    ɵɵadvance();
    ɵɵconditional(ctx_r1.showWeekNumbers() ? 1 : -1);
    ɵɵadvance();
    ɵɵconditional(ctx_r1.showISOWeekNumbers() ? 2 : -1);
    ɵɵadvance();
    ɵɵrepeater(ctx_r1.calendarVariables().left.calCols);
  }
}
function CalendarComponent_Conditional_0_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "table", 2)(1, "thead")(2, "tr");
    ɵɵconditionalCreate(3, CalendarComponent_Conditional_0_Conditional_1_Conditional_3_Template, 1, 0, "th");
    ɵɵconditionalCreate(4, CalendarComponent_Conditional_0_Conditional_1_Conditional_4_Template, 1, 0, "th", 4);
    ɵɵconditionalCreate(5, CalendarComponent_Conditional_0_Conditional_1_Conditional_5_Template, 1, 0, "th");
    ɵɵelementStart(6, "th", 5);
    ɵɵconditionalCreate(7, CalendarComponent_Conditional_0_Conditional_1_Conditional_7_Template, 10, 2);
    ɵɵconditionalCreate(8, CalendarComponent_Conditional_0_Conditional_1_Conditional_8_Template, 1, 2);
    ɵɵelementEnd();
    ɵɵconditionalCreate(9, CalendarComponent_Conditional_0_Conditional_1_Conditional_9_Template, 1, 0, "th", 6);
    ɵɵconditionalCreate(10, CalendarComponent_Conditional_0_Conditional_1_Conditional_10_Template, 1, 0, "th");
    ɵɵelementEnd();
    ɵɵelementStart(11, "tr", 7);
    ɵɵconditionalCreate(12, CalendarComponent_Conditional_0_Conditional_1_Conditional_12_Template, 3, 1, "th", 8);
    ɵɵrepeaterCreate(13, CalendarComponent_Conditional_0_Conditional_1_For_14_Template, 3, 1, "th", null, ɵɵrepeaterTrackByIndex);
    ɵɵelementEnd()();
    ɵɵelementStart(15, "tbody", 9);
    ɵɵrepeaterCreate(16, CalendarComponent_Conditional_0_Conditional_1_For_17_Template, 5, 4, "tr", 10, ɵɵrepeaterTrackByIndex);
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵadvance(3);
    ɵɵconditional(ctx_r1.showWeekNumbers() || ctx_r1.showISOWeekNumbers() ? 3 : -1);
    ɵɵadvance();
    ɵɵconditional(!ctx_r1.calendarVariables().left.minDate || ctx_r1.calendarVariables().left.minDate.isBefore(ctx_r1.calendarVariables().left.calendar.firstDay) && (!ctx_r1.linkedCalendars() || true) ? 4 : -1);
    ɵɵadvance();
    ɵɵconditional(!(!ctx_r1.calendarVariables().left.minDate || ctx_r1.calendarVariables().left.minDate.isBefore(ctx_r1.calendarVariables().left.calendar.firstDay) && (!ctx_r1.linkedCalendars() || true)) ? 5 : -1);
    ɵɵadvance(2);
    ɵɵconditional(ctx_r1.showDropdowns() && ctx_r1.calendarVariables().left.dropdowns ? 7 : -1);
    ɵɵadvance();
    ɵɵconditional(!ctx_r1.showDropdowns() || !ctx_r1.calendarVariables().left.dropdowns ? 8 : -1);
    ɵɵadvance();
    ɵɵconditional((!ctx_r1.calendarVariables().left.maxDate || ctx_r1.calendarVariables().left.maxDate.isAfter(ctx_r1.calendarVariables().left.calendar.lastDay)) && (!ctx_r1.linkedCalendars() || ctx_r1.singleDatePicker()) ? 9 : -1);
    ɵɵadvance();
    ɵɵconditional(!((!ctx_r1.calendarVariables().left.maxDate || ctx_r1.calendarVariables().left.maxDate.isAfter(ctx_r1.calendarVariables().left.calendar.lastDay)) && (!ctx_r1.linkedCalendars() || ctx_r1.singleDatePicker())) ? 10 : -1);
    ɵɵadvance(2);
    ɵɵconditional(ctx_r1.showWeekNumbers() || ctx_r1.showISOWeekNumbers() ? 12 : -1);
    ɵɵadvance();
    ɵɵrepeater(ctx_r1.locale().daysOfWeek);
    ɵɵadvance(3);
    ɵɵrepeater(ctx_r1.calendarVariables().left.calRows);
  }
}
function CalendarComponent_Conditional_0_Conditional_2_For_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "option", 21);
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const i_r12 = ctx.$implicit;
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵproperty("value", i_r12)("disabled", ctx_r1.timepickerVariables().left.disabledHours.indexOf(i_r12) > -1);
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", i_r12, " ");
  }
}
function CalendarComponent_Conditional_0_Conditional_2_For_9_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "option", 21);
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const i_r13 = ctx.$implicit;
    const $index_r14 = ctx.$index;
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵproperty("value", i_r13)("disabled", ctx_r1.timepickerVariables().left.disabledMinutes.indexOf(i_r13) > -1);
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", ctx_r1.timepickerVariables().left.minutesLabel[$index_r14], " ");
  }
}
function CalendarComponent_Conditional_0_Conditional_2_Conditional_12_For_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "option", 21);
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const i_r16 = ctx.$implicit;
    const $index_r17 = ctx.$index;
    const ctx_r1 = ɵɵnextContext(4);
    ɵɵproperty("value", i_r16)("disabled", ctx_r1.timepickerVariables().left.disabledSeconds.indexOf(i_r16) > -1);
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", ctx_r1.timepickerVariables().left.secondsLabel[$index_r17], " ");
  }
}
function CalendarComponent_Conditional_0_Conditional_2_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r15 = ɵɵgetCurrentView();
    ɵɵtext(0, " : ");
    ɵɵelementStart(1, "div", 19)(2, "select", 25);
    ɵɵtwoWayListener("ngModelChange", function CalendarComponent_Conditional_0_Conditional_2_Conditional_12_Template_select_ngModelChange_2_listener($event) {
      ɵɵrestoreView(_r15);
      const ctx_r1 = ɵɵnextContext(3);
      ɵɵtwoWayBindingSet(ctx_r1.timepickerVariables().left.selectedSecond, $event) || (ctx_r1.timepickerVariables().left.selectedSecond = $event);
      return ɵɵresetView($event);
    });
    ɵɵlistener("ngModelChange", function CalendarComponent_Conditional_0_Conditional_2_Conditional_12_Template_select_ngModelChange_2_listener($event) {
      ɵɵrestoreView(_r15);
      const ctx_r1 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r1.timeChanged($event, ctx_r1.sideEnum.left));
    });
    ɵɵrepeaterCreate(3, CalendarComponent_Conditional_0_Conditional_2_Conditional_12_For_4_Template, 2, 3, "option", 21, ɵɵrepeaterTrackByIndex);
    ɵɵelementEnd();
    ɵɵelement(5, "span", 23)(6, "span", 24);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵadvance(2);
    ɵɵproperty("disabled", !ctx_r1.startDate());
    ɵɵtwoWayProperty("ngModel", ctx_r1.timepickerVariables().left.selectedSecond);
    ɵɵadvance();
    ɵɵrepeater(ctx_r1.timepickerVariables().left.seconds);
  }
}
function CalendarComponent_Conditional_0_Conditional_2_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r18 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "div", 19)(1, "select", 26);
    ɵɵtwoWayListener("ngModelChange", function CalendarComponent_Conditional_0_Conditional_2_Conditional_13_Template_select_ngModelChange_1_listener($event) {
      ɵɵrestoreView(_r18);
      const ctx_r1 = ɵɵnextContext(3);
      ɵɵtwoWayBindingSet(ctx_r1.timepickerVariables().left.ampmModel, $event) || (ctx_r1.timepickerVariables().left.ampmModel = $event);
      return ɵɵresetView($event);
    });
    ɵɵlistener("ngModelChange", function CalendarComponent_Conditional_0_Conditional_2_Conditional_13_Template_select_ngModelChange_1_listener($event) {
      ɵɵrestoreView(_r18);
      const ctx_r1 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r1.timeChanged($event, ctx_r1.sideEnum.left));
    });
    ɵɵelementStart(2, "option", 27);
    ɵɵtext(3, "AM");
    ɵɵelementEnd();
    ɵɵelementStart(4, "option", 28);
    ɵɵtext(5, "PM");
    ɵɵelementEnd()();
    ɵɵelement(6, "span", 23)(7, "span", 24);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵadvance();
    ɵɵtwoWayProperty("ngModel", ctx_r1.timepickerVariables().left.ampmModel);
    ɵɵadvance();
    ɵɵproperty("disabled", ctx_r1.timepickerVariables().left.amDisabled);
    ɵɵadvance(2);
    ɵɵproperty("disabled", ctx_r1.timepickerVariables().left.pmDisabled);
  }
}
function CalendarComponent_Conditional_0_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "div", 3)(1, "div", 19)(2, "select", 20);
    ɵɵtwoWayListener("ngModelChange", function CalendarComponent_Conditional_0_Conditional_2_Template_select_ngModelChange_2_listener($event) {
      ɵɵrestoreView(_r11);
      const ctx_r1 = ɵɵnextContext(2);
      ɵɵtwoWayBindingSet(ctx_r1.timepickerVariables().left.selectedHour, $event) || (ctx_r1.timepickerVariables().left.selectedHour = $event);
      return ɵɵresetView($event);
    });
    ɵɵlistener("ngModelChange", function CalendarComponent_Conditional_0_Conditional_2_Template_select_ngModelChange_2_listener($event) {
      ɵɵrestoreView(_r11);
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.timeChanged($event, ctx_r1.sideEnum.left));
    });
    ɵɵrepeaterCreate(3, CalendarComponent_Conditional_0_Conditional_2_For_4_Template, 2, 3, "option", 21, ɵɵrepeaterTrackByIndex);
    ɵɵelementEnd()();
    ɵɵtext(5, " : ");
    ɵɵelementStart(6, "div", 19)(7, "select", 22);
    ɵɵtwoWayListener("ngModelChange", function CalendarComponent_Conditional_0_Conditional_2_Template_select_ngModelChange_7_listener($event) {
      ɵɵrestoreView(_r11);
      const ctx_r1 = ɵɵnextContext(2);
      ɵɵtwoWayBindingSet(ctx_r1.timepickerVariables().left.selectedMinute, $event) || (ctx_r1.timepickerVariables().left.selectedMinute = $event);
      return ɵɵresetView($event);
    });
    ɵɵlistener("ngModelChange", function CalendarComponent_Conditional_0_Conditional_2_Template_select_ngModelChange_7_listener($event) {
      ɵɵrestoreView(_r11);
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.timeChanged($event, ctx_r1.sideEnum.left));
    });
    ɵɵrepeaterCreate(8, CalendarComponent_Conditional_0_Conditional_2_For_9_Template, 2, 3, "option", 21, ɵɵrepeaterTrackByIndex);
    ɵɵelementEnd();
    ɵɵelement(10, "span", 23)(11, "span", 24);
    ɵɵelementEnd();
    ɵɵconditionalCreate(12, CalendarComponent_Conditional_0_Conditional_2_Conditional_12_Template, 7, 2);
    ɵɵconditionalCreate(13, CalendarComponent_Conditional_0_Conditional_2_Conditional_13_Template, 8, 3, "div", 19);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵadvance(2);
    ɵɵproperty("disabled", !ctx_r1.startDate());
    ɵɵtwoWayProperty("ngModel", ctx_r1.timepickerVariables().left.selectedHour);
    ɵɵadvance();
    ɵɵrepeater(ctx_r1.timepickerVariables().left.hours);
    ɵɵadvance(4);
    ɵɵproperty("disabled", !ctx_r1.startDate());
    ɵɵtwoWayProperty("ngModel", ctx_r1.timepickerVariables().left.selectedMinute);
    ɵɵadvance();
    ɵɵrepeater(ctx_r1.timepickerVariables().left.minutes);
    ɵɵadvance(4);
    ɵɵconditional(ctx_r1.timePickerSeconds() ? 12 : -1);
    ɵɵadvance();
    ɵɵconditional(!ctx_r1.timePicker24Hour() ? 13 : -1);
  }
}
function CalendarComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 0);
    ɵɵconditionalCreate(1, CalendarComponent_Conditional_0_Conditional_1_Template, 18, 8, "table", 2);
    ɵɵconditionalCreate(2, CalendarComponent_Conditional_0_Conditional_2_Template, 14, 6, "div", 3);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵproperty("ngClass", ɵɵpureFunction2(3, _c1, ctx_r1.singleDatePicker(), !ctx_r1.singleDatePicker()));
    ɵɵadvance();
    ɵɵconditional(ctx_r1.calendarVariables() ? 1 : -1);
    ɵɵadvance();
    ɵɵconditional(ctx_r1.timePicker() ? 2 : -1);
  }
}
function CalendarComponent_Conditional_1_Conditional_1_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "th");
  }
}
function CalendarComponent_Conditional_1_Conditional_1_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r19 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "th", 11);
    ɵɵlistener("click", function CalendarComponent_Conditional_1_Conditional_1_Conditional_4_Template_th_click_0_listener($event) {
      ɵɵrestoreView(_r19);
      const ctx_r1 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r1.clickPrev($event, ctx_r1.sideEnum.right));
    });
    ɵɵelementEnd();
  }
}
function CalendarComponent_Conditional_1_Conditional_1_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "th");
  }
}
function CalendarComponent_Conditional_1_Conditional_1_Conditional_7_For_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "option", 14);
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const m_r21 = ctx.$implicit;
    const ctx_r1 = ɵɵnextContext(4);
    ɵɵproperty("selected", ctx_r1.calendarVariables().right.dropdowns.currentMonth == m_r21)("value", m_r21)("disabled", ctx_r1.calendarVariables().right.dropdowns.inMinYear && ctx_r1.calendarVariables().right.minDate && m_r21 < ctx_r1.calendarVariables().right.minDate.month() || ctx_r1.calendarVariables().right.dropdowns.inMaxYear && ctx_r1.calendarVariables().right.maxDate && m_r21 > ctx_r1.calendarVariables().right.maxDate.month());
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", ctx_r1.locale().monthNames[m_r21], " ");
  }
}
function CalendarComponent_Conditional_1_Conditional_1_Conditional_7_For_9_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "option", 16);
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const y_r22 = ctx.$implicit;
    const ctx_r1 = ɵɵnextContext(4);
    ɵɵproperty("selected", y_r22 === ctx_r1.calendarVariables().right.dropdowns.currentYear);
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", y_r22, " ");
  }
}
function CalendarComponent_Conditional_1_Conditional_1_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r20 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "div", 12);
    ɵɵtext(1);
    ɵɵelementStart(2, "select", 13);
    ɵɵlistener("change", function CalendarComponent_Conditional_1_Conditional_1_Conditional_7_Template_select_change_2_listener($event) {
      ɵɵrestoreView(_r20);
      const ctx_r1 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r1.monthChanged($event, ctx_r1.sideEnum.right));
    });
    ɵɵrepeaterCreate(3, CalendarComponent_Conditional_1_Conditional_1_Conditional_7_For_4_Template, 2, 4, "option", 14, ɵɵrepeaterTrackByIndex);
    ɵɵelementEnd()();
    ɵɵelementStart(5, "div", 12);
    ɵɵtext(6);
    ɵɵelementStart(7, "select", 15);
    ɵɵlistener("change", function CalendarComponent_Conditional_1_Conditional_1_Conditional_7_Template_select_change_7_listener($event) {
      ɵɵrestoreView(_r20);
      const ctx_r1 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r1.yearChanged($event, ctx_r1.sideEnum.right));
    });
    ɵɵrepeaterCreate(8, CalendarComponent_Conditional_1_Conditional_1_Conditional_7_For_9_Template, 2, 2, "option", 16, ɵɵrepeaterTrackByIndex);
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    let tmp_3_0;
    let tmp_5_0;
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", ctx_r1.locale().monthNames[(tmp_3_0 = ctx_r1.calendarVariables().right.calendar) == null ? null : tmp_3_0[1][1].month()], " ");
    ɵɵadvance(2);
    ɵɵrepeater(ctx_r1.calendarVariables().right.dropdowns.monthArrays);
    ɵɵadvance(3);
    ɵɵtextInterpolate1(" ", (tmp_5_0 = ctx_r1.calendarVariables().right.calendar) == null ? null : tmp_5_0[1][1].format(" YYYY"), " ");
    ɵɵadvance(2);
    ɵɵrepeater(ctx_r1.calendarVariables().right.dropdowns.yearArrays);
  }
}
function CalendarComponent_Conditional_1_Conditional_1_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtext(0);
  }
  if (rf & 2) {
    let tmp_3_0;
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵtextInterpolate2(" ", ctx_r1.locale().monthNames[(tmp_3_0 = ctx_r1.calendarVariables().right.calendar) == null ? null : tmp_3_0[1][1].month()], " ", (tmp_3_0 = ctx_r1.calendarVariables().right.calendar) == null ? null : tmp_3_0[1][1].format(" YYYY"), " ");
  }
}
function CalendarComponent_Conditional_1_Conditional_1_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r23 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "th", 17);
    ɵɵlistener("click", function CalendarComponent_Conditional_1_Conditional_1_Conditional_9_Template_th_click_0_listener($event) {
      ɵɵrestoreView(_r23);
      const ctx_r1 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r1.clickNext($event, ctx_r1.sideEnum.right));
    });
    ɵɵelementEnd();
  }
}
function CalendarComponent_Conditional_1_Conditional_1_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "th");
  }
}
function CalendarComponent_Conditional_1_Conditional_1_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "th", 8)(1, "span");
    ɵɵtext(2);
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵadvance(2);
    ɵɵtextInterpolate(ctx_r1.locale().weekLabel);
  }
}
function CalendarComponent_Conditional_1_Conditional_1_For_14_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "th")(1, "span");
    ɵɵtext(2);
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    const dayofweek_r24 = ctx.$implicit;
    ɵɵadvance(2);
    ɵɵtextInterpolate(dayofweek_r24);
  }
}
function CalendarComponent_Conditional_1_Conditional_1_For_17_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "td", 8)(1, "span");
    ɵɵtext(2);
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    let tmp_13_0;
    const row_r25 = ɵɵnextContext().$implicit;
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵadvance(2);
    ɵɵtextInterpolate((tmp_13_0 = ctx_r1.calendarVariables().right.calendar) == null ? null : tmp_13_0[row_r25][0].week());
  }
}
function CalendarComponent_Conditional_1_Conditional_1_For_17_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "td", 8)(1, "span");
    ɵɵtext(2);
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    let tmp_13_0;
    const row_r25 = ɵɵnextContext().$implicit;
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵadvance(2);
    ɵɵtextInterpolate((tmp_13_0 = ctx_r1.calendarVariables().right.calendar) == null ? null : tmp_13_0[row_r25][0].isoWeek());
  }
}
function CalendarComponent_Conditional_1_Conditional_1_For_17_For_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r26 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "td", 18);
    ɵɵlistener("click", function CalendarComponent_Conditional_1_Conditional_1_For_17_For_4_Template_td_click_0_listener($event) {
      const col_r27 = ɵɵrestoreView(_r26).$implicit;
      const row_r25 = ɵɵnextContext().$implicit;
      const ctx_r1 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r1.clickDate($event, ctx_r1.sideEnum.right, row_r25, col_r27));
    })("mouseenter", function CalendarComponent_Conditional_1_Conditional_1_For_17_For_4_Template_td_mouseenter_0_listener($event) {
      const col_r27 = ɵɵrestoreView(_r26).$implicit;
      const row_r25 = ɵɵnextContext().$implicit;
      const ctx_r1 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r1.hoverDate($event, ctx_r1.sideEnum.right, row_r25, col_r27));
    });
    ɵɵelementStart(1, "span");
    ɵɵtext(2);
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    let tmp_23_0;
    const col_r27 = ctx.$implicit;
    const row_r25 = ɵɵnextContext().$implicit;
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵclassMap(ctx_r1.calendarVariables().right.classes[row_r25][col_r27]);
    ɵɵadvance(2);
    ɵɵtextInterpolate((tmp_23_0 = ctx_r1.calendarVariables().right.calendar) == null ? null : tmp_23_0[row_r25][col_r27].date());
  }
}
function CalendarComponent_Conditional_1_Conditional_1_For_17_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "tr");
    ɵɵconditionalCreate(1, CalendarComponent_Conditional_1_Conditional_1_For_17_Conditional_1_Template, 3, 1, "td", 8);
    ɵɵconditionalCreate(2, CalendarComponent_Conditional_1_Conditional_1_For_17_Conditional_2_Template, 3, 1, "td", 8);
    ɵɵrepeaterCreate(3, CalendarComponent_Conditional_1_Conditional_1_For_17_For_4_Template, 3, 3, "td", 10, ɵɵrepeaterTrackByIndex);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const row_r25 = ctx.$implicit;
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵclassMap(ctx_r1.calendarVariables().right.classes[row_r25].classList);
    ɵɵadvance();
    ɵɵconditional(ctx_r1.showWeekNumbers() ? 1 : -1);
    ɵɵadvance();
    ɵɵconditional(ctx_r1.showISOWeekNumbers() ? 2 : -1);
    ɵɵadvance();
    ɵɵrepeater(ctx_r1.calendarVariables().right.calCols);
  }
}
function CalendarComponent_Conditional_1_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "table", 2)(1, "thead")(2, "tr");
    ɵɵconditionalCreate(3, CalendarComponent_Conditional_1_Conditional_1_Conditional_3_Template, 1, 0, "th");
    ɵɵconditionalCreate(4, CalendarComponent_Conditional_1_Conditional_1_Conditional_4_Template, 1, 0, "th", 4);
    ɵɵconditionalCreate(5, CalendarComponent_Conditional_1_Conditional_1_Conditional_5_Template, 1, 0, "th");
    ɵɵelementStart(6, "th", 29);
    ɵɵconditionalCreate(7, CalendarComponent_Conditional_1_Conditional_1_Conditional_7_Template, 10, 2);
    ɵɵconditionalCreate(8, CalendarComponent_Conditional_1_Conditional_1_Conditional_8_Template, 1, 2);
    ɵɵelementEnd();
    ɵɵconditionalCreate(9, CalendarComponent_Conditional_1_Conditional_1_Conditional_9_Template, 1, 0, "th", 6);
    ɵɵconditionalCreate(10, CalendarComponent_Conditional_1_Conditional_1_Conditional_10_Template, 1, 0, "th");
    ɵɵelementEnd();
    ɵɵelementStart(11, "tr", 7);
    ɵɵconditionalCreate(12, CalendarComponent_Conditional_1_Conditional_1_Conditional_12_Template, 3, 1, "th", 8);
    ɵɵrepeaterCreate(13, CalendarComponent_Conditional_1_Conditional_1_For_14_Template, 3, 1, "th", null, ɵɵrepeaterTrackByIndex);
    ɵɵelementEnd()();
    ɵɵelementStart(15, "tbody");
    ɵɵrepeaterCreate(16, CalendarComponent_Conditional_1_Conditional_1_For_17_Template, 5, 4, "tr", 10, ɵɵrepeaterTrackByIndex);
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵadvance(3);
    ɵɵconditional(ctx_r1.showWeekNumbers() || ctx_r1.showISOWeekNumbers() ? 3 : -1);
    ɵɵadvance();
    ɵɵconditional((!ctx_r1.calendarVariables().right.minDate || ctx_r1.calendarVariables().right.minDate.isBefore(ctx_r1.calendarVariables().right.calendar.firstDay)) && !ctx_r1.linkedCalendars() ? 4 : -1);
    ɵɵadvance();
    ɵɵconditional(!((!ctx_r1.calendarVariables().right.minDate || ctx_r1.calendarVariables().right.minDate.isBefore(ctx_r1.calendarVariables().right.calendar.firstDay)) && !ctx_r1.linkedCalendars()) ? 5 : -1);
    ɵɵadvance(2);
    ɵɵconditional(ctx_r1.showDropdowns() && ctx_r1.calendarVariables().right.dropdowns ? 7 : -1);
    ɵɵadvance();
    ɵɵconditional(!ctx_r1.showDropdowns() || !ctx_r1.calendarVariables().right.dropdowns ? 8 : -1);
    ɵɵadvance();
    ɵɵconditional(!ctx_r1.calendarVariables().right.maxDate || ctx_r1.calendarVariables().right.maxDate.isAfter(ctx_r1.calendarVariables().right.calendar.lastDay) && (!ctx_r1.linkedCalendars() || ctx_r1.singleDatePicker() || true) ? 9 : -1);
    ɵɵadvance();
    ɵɵconditional(!(!ctx_r1.calendarVariables().right.maxDate || ctx_r1.calendarVariables().right.maxDate.isAfter(ctx_r1.calendarVariables().right.calendar.lastDay) && (!ctx_r1.linkedCalendars() || ctx_r1.singleDatePicker() || true)) ? 10 : -1);
    ɵɵadvance(2);
    ɵɵconditional(ctx_r1.showWeekNumbers() || ctx_r1.showISOWeekNumbers() ? 12 : -1);
    ɵɵadvance();
    ɵɵrepeater(ctx_r1.locale().daysOfWeek);
    ɵɵadvance(3);
    ɵɵrepeater(ctx_r1.calendarVariables().right.calRows);
  }
}
function CalendarComponent_Conditional_1_Conditional_2_For_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "option", 21);
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const i_r29 = ctx.$implicit;
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵproperty("value", i_r29)("disabled", ctx_r1.timepickerVariables().right.disabledHours.indexOf(i_r29) > -1);
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", i_r29, " ");
  }
}
function CalendarComponent_Conditional_1_Conditional_2_For_11_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "option", 21);
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const i_r30 = ctx.$implicit;
    const $index_r31 = ctx.$index;
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵproperty("value", i_r30)("disabled", ctx_r1.timepickerVariables().right.disabledMinutes.indexOf(i_r30) > -1);
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", ctx_r1.timepickerVariables().right.minutesLabel[$index_r31], " ");
  }
}
function CalendarComponent_Conditional_1_Conditional_2_Conditional_14_For_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "option", 21);
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const i_r33 = ctx.$implicit;
    const $index_r34 = ctx.$index;
    const ctx_r1 = ɵɵnextContext(4);
    ɵɵproperty("value", i_r33)("disabled", ctx_r1.timepickerVariables().right.disabledSeconds.indexOf(i_r33) > -1);
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", ctx_r1.timepickerVariables().right.secondsLabel[$index_r34], " ");
  }
}
function CalendarComponent_Conditional_1_Conditional_2_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    const _r32 = ɵɵgetCurrentView();
    ɵɵtext(0, " : ");
    ɵɵelementStart(1, "div", 19)(2, "select", 25);
    ɵɵtwoWayListener("ngModelChange", function CalendarComponent_Conditional_1_Conditional_2_Conditional_14_Template_select_ngModelChange_2_listener($event) {
      ɵɵrestoreView(_r32);
      const ctx_r1 = ɵɵnextContext(3);
      ɵɵtwoWayBindingSet(ctx_r1.timepickerVariables().right.selectedSecond, $event) || (ctx_r1.timepickerVariables().right.selectedSecond = $event);
      return ɵɵresetView($event);
    });
    ɵɵlistener("ngModelChange", function CalendarComponent_Conditional_1_Conditional_2_Conditional_14_Template_select_ngModelChange_2_listener($event) {
      ɵɵrestoreView(_r32);
      const ctx_r1 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r1.timeChanged($event, ctx_r1.sideEnum.right));
    });
    ɵɵrepeaterCreate(3, CalendarComponent_Conditional_1_Conditional_2_Conditional_14_For_4_Template, 2, 3, "option", 21, ɵɵrepeaterTrackByIndex);
    ɵɵelementEnd();
    ɵɵelement(5, "span", 23)(6, "span", 24);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵadvance(2);
    ɵɵproperty("disabled", !ctx_r1.startDate());
    ɵɵtwoWayProperty("ngModel", ctx_r1.timepickerVariables().right.selectedSecond);
    ɵɵadvance();
    ɵɵrepeater(ctx_r1.timepickerVariables().right.seconds);
  }
}
function CalendarComponent_Conditional_1_Conditional_2_Conditional_15_Template(rf, ctx) {
  if (rf & 1) {
    const _r35 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "div", 19)(1, "select", 26);
    ɵɵtwoWayListener("ngModelChange", function CalendarComponent_Conditional_1_Conditional_2_Conditional_15_Template_select_ngModelChange_1_listener($event) {
      ɵɵrestoreView(_r35);
      const ctx_r1 = ɵɵnextContext(3);
      ɵɵtwoWayBindingSet(ctx_r1.timepickerVariables().right.ampmModel, $event) || (ctx_r1.timepickerVariables().right.ampmModel = $event);
      return ɵɵresetView($event);
    });
    ɵɵlistener("ngModelChange", function CalendarComponent_Conditional_1_Conditional_2_Conditional_15_Template_select_ngModelChange_1_listener($event) {
      ɵɵrestoreView(_r35);
      const ctx_r1 = ɵɵnextContext(3);
      return ɵɵresetView(ctx_r1.timeChanged($event, ctx_r1.sideEnum.right));
    });
    ɵɵelementStart(2, "option", 27);
    ɵɵtext(3, "AM");
    ɵɵelementEnd();
    ɵɵelementStart(4, "option", 28);
    ɵɵtext(5, "PM");
    ɵɵelementEnd()();
    ɵɵelement(6, "span", 23)(7, "span", 24);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵadvance();
    ɵɵtwoWayProperty("ngModel", ctx_r1.timepickerVariables().right.ampmModel);
    ɵɵadvance();
    ɵɵproperty("disabled", ctx_r1.timepickerVariables().right.amDisabled);
    ɵɵadvance(2);
    ɵɵproperty("disabled", ctx_r1.timepickerVariables().right.pmDisabled);
  }
}
function CalendarComponent_Conditional_1_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r28 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "div", 3)(1, "div", 19)(2, "select", 20);
    ɵɵtwoWayListener("ngModelChange", function CalendarComponent_Conditional_1_Conditional_2_Template_select_ngModelChange_2_listener($event) {
      ɵɵrestoreView(_r28);
      const ctx_r1 = ɵɵnextContext(2);
      ɵɵtwoWayBindingSet(ctx_r1.timepickerVariables().right.selectedHour, $event) || (ctx_r1.timepickerVariables().right.selectedHour = $event);
      return ɵɵresetView($event);
    });
    ɵɵlistener("ngModelChange", function CalendarComponent_Conditional_1_Conditional_2_Template_select_ngModelChange_2_listener($event) {
      ɵɵrestoreView(_r28);
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.timeChanged($event, ctx_r1.sideEnum.right));
    });
    ɵɵrepeaterCreate(3, CalendarComponent_Conditional_1_Conditional_2_For_4_Template, 2, 3, "option", 21, ɵɵrepeaterTrackByIndex);
    ɵɵelementEnd();
    ɵɵelement(5, "span", 23)(6, "span", 24);
    ɵɵelementEnd();
    ɵɵtext(7, " : ");
    ɵɵelementStart(8, "div", 19)(9, "select", 22);
    ɵɵtwoWayListener("ngModelChange", function CalendarComponent_Conditional_1_Conditional_2_Template_select_ngModelChange_9_listener($event) {
      ɵɵrestoreView(_r28);
      const ctx_r1 = ɵɵnextContext(2);
      ɵɵtwoWayBindingSet(ctx_r1.timepickerVariables().right.selectedMinute, $event) || (ctx_r1.timepickerVariables().right.selectedMinute = $event);
      return ɵɵresetView($event);
    });
    ɵɵlistener("ngModelChange", function CalendarComponent_Conditional_1_Conditional_2_Template_select_ngModelChange_9_listener($event) {
      ɵɵrestoreView(_r28);
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.timeChanged($event, ctx_r1.sideEnum.right));
    });
    ɵɵrepeaterCreate(10, CalendarComponent_Conditional_1_Conditional_2_For_11_Template, 2, 3, "option", 21, ɵɵrepeaterTrackByIndex);
    ɵɵelementEnd();
    ɵɵelement(12, "span", 23)(13, "span", 24);
    ɵɵelementEnd();
    ɵɵconditionalCreate(14, CalendarComponent_Conditional_1_Conditional_2_Conditional_14_Template, 7, 2);
    ɵɵconditionalCreate(15, CalendarComponent_Conditional_1_Conditional_2_Conditional_15_Template, 8, 3, "div", 19);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵadvance(2);
    ɵɵproperty("disabled", !ctx_r1.startDate());
    ɵɵtwoWayProperty("ngModel", ctx_r1.timepickerVariables().right.selectedHour);
    ɵɵadvance();
    ɵɵrepeater(ctx_r1.timepickerVariables().right.hours);
    ɵɵadvance(6);
    ɵɵproperty("disabled", !ctx_r1.startDate());
    ɵɵtwoWayProperty("ngModel", ctx_r1.timepickerVariables().right.selectedMinute);
    ɵɵadvance();
    ɵɵrepeater(ctx_r1.timepickerVariables().right.minutes);
    ɵɵadvance(4);
    ɵɵconditional(ctx_r1.timePickerSeconds() ? 14 : -1);
    ɵɵadvance();
    ɵɵconditional(!ctx_r1.timePicker24Hour() ? 15 : -1);
  }
}
function CalendarComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 1);
    ɵɵconditionalCreate(1, CalendarComponent_Conditional_1_Conditional_1_Template, 18, 8, "table", 2);
    ɵɵconditionalCreate(2, CalendarComponent_Conditional_1_Conditional_2_Template, 16, 6, "div", 3);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵconditional(ctx_r1.calendarVariables() ? 1 : -1);
    ɵɵadvance();
    ɵɵconditional(ctx_r1.timePicker() ? 2 : -1);
  }
}
function ActionsComponent_Conditional_0_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = ɵɵgetCurrentView();
    ɵɵdomElementStart(0, "button", 5);
    ɵɵdomListener("click", function ActionsComponent_Conditional_0_Conditional_5_Template_button_click_0_listener($event) {
      ɵɵrestoreView(_r3);
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.clickCancel($event));
    });
    ɵɵtext(1);
    ɵɵdomElementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", ctx_r1.locale().cancelLabel, " ");
  }
}
function ActionsComponent_Conditional_0_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = ɵɵgetCurrentView();
    ɵɵdomElementStart(0, "button", 6);
    ɵɵdomListener("click", function ActionsComponent_Conditional_0_Conditional_6_Template_button_click_0_listener($event) {
      ɵɵrestoreView(_r4);
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.clickClear($event));
    });
    ɵɵtext(1);
    ɵɵdomElementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵdomProperty("title", ctx_r1.locale().clearLabel);
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", ctx_r1.locale().clearLabel, " ");
  }
}
function ActionsComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵdomElementStart(0, "div", 0)(1, "span", 1);
    ɵɵtext(2);
    ɵɵdomElementEnd();
    ɵɵdomElementStart(3, "button", 2);
    ɵɵdomListener("click", function ActionsComponent_Conditional_0_Template_button_click_3_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.clickApply($event));
    });
    ɵɵtext(4);
    ɵɵdomElementEnd();
    ɵɵconditionalCreate(5, ActionsComponent_Conditional_0_Conditional_5_Template, 2, 1, "button", 3);
    ɵɵconditionalCreate(6, ActionsComponent_Conditional_0_Conditional_6_Template, 2, 2, "button", 4);
    ɵɵdomElementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵadvance(2);
    ɵɵtextInterpolate(ctx_r1.chosenLabel());
    ɵɵadvance();
    ɵɵdomProperty("disabled", ctx_r1.applyBtnDisabled());
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", ctx_r1.locale().applyLabel, " ");
    ɵɵadvance();
    ɵɵconditional(ctx_r1.showCancel() ? 5 : -1);
    ɵɵadvance();
    ɵɵconditional(ctx_r1.showClearButton() ? 6 : -1);
  }
}
var _c2 = ["pickerContainer"];
var _c3 = (a0, a1, a2, a3, a4, a5, a6) => ({
  "show-ranges": a0,
  "shown": a1,
  "hidden": a2,
  "double": a3,
  "inline": a4,
  "ltr": a5,
  "rtl": a6
});
import_dayjs.default.extend(import_localeData.default);
var LOCALE_CONFIG = new InjectionToken("daterangepicker.config");
var DefaultLocaleConfig = {
  direction: "ltr",
  separator: " - ",
  weekLabel: "W",
  applyLabel: "Apply",
  cancelLabel: "Cancel",
  clearLabel: "Clear",
  customRangeLabel: "Custom range",
  daysOfWeek: import_dayjs.default.weekdaysMin(),
  monthNames: import_dayjs.default.monthsShort(),
  firstDay: import_dayjs.default.localeData().firstDayOfWeek()
};
var NgxDaterangepickerLocaleService = class _NgxDaterangepickerLocaleService {
  _config = inject(LOCALE_CONFIG);
  get config() {
    if (!this._config) {
      return DefaultLocaleConfig;
    }
    return __spreadValues(__spreadValues({}, DefaultLocaleConfig), this._config);
  }
  static ɵfac = function NgxDaterangepickerLocaleService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NgxDaterangepickerLocaleService)();
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _NgxDaterangepickerLocaleService,
    factory: _NgxDaterangepickerLocaleService.ɵfac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgxDaterangepickerLocaleService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();
var RangesComponent = class _RangesComponent {
  rangesArray = input(...ngDevMode ? [void 0, {
    debugName: "rangesArray"
  }] : []);
  chosenRange = input(...ngDevMode ? [void 0, {
    debugName: "chosenRange"
  }] : []);
  locale = input(...ngDevMode ? [void 0, {
    debugName: "locale"
  }] : []);
  ranges = input(...ngDevMode ? [void 0, {
    debugName: "ranges"
  }] : []);
  minDate = input(...ngDevMode ? [void 0, {
    debugName: "minDate"
  }] : []);
  maxDate = input(...ngDevMode ? [void 0, {
    debugName: "maxDate"
  }] : []);
  rangeEvent = output();
  clickRange($event, label) {
    this.rangeEvent.emit({
      $event,
      label
    });
  }
  /**
   * Find out if the selected range should be disabled if it doesn't
   * fit into minDate and maxDate limitations.
   */
  disableRange(range) {
    if (range === this.locale().customRangeLabel) {
      return false;
    }
    const rangeMarkers = this.ranges()[range];
    const areBothBefore = rangeMarkers.every((date) => {
      if (!this.minDate()) {
        return false;
      }
      return date.isBefore(this.minDate());
    });
    const areBothAfter = rangeMarkers.every((date) => {
      if (!this.maxDate()) {
        return false;
      }
      return date.isAfter(this.maxDate());
    });
    return areBothBefore || areBothAfter;
  }
  static ɵfac = function RangesComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _RangesComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _RangesComponent,
    selectors: [["ranges"]],
    inputs: {
      rangesArray: [1, "rangesArray"],
      chosenRange: [1, "chosenRange"],
      locale: [1, "locale"],
      ranges: [1, "ranges"],
      minDate: [1, "minDate"],
      maxDate: [1, "maxDate"]
    },
    outputs: {
      rangeEvent: "rangeEvent"
    },
    decls: 1,
    vars: 1,
    consts: [[1, "ranges"], ["type", "button", 3, "click", "disabled", "ngClass"]],
    template: function RangesComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵconditionalCreate(0, RangesComponent_Conditional_0_Template, 4, 0, "div", 0);
      }
      if (rf & 2) {
        let tmp_0_0;
        ɵɵconditional(((tmp_0_0 = ctx.rangesArray()) == null ? null : tmp_0_0.length) ? 0 : -1);
      }
    },
    dependencies: [NgClass],
    styles: [".show-ranges[_ngcontent-%COMP%]   .drp-calendar.left[_ngcontent-%COMP%]{border-left:1px solid #ddd}.ranges[_ngcontent-%COMP%]{float:none;text-align:left;margin:0}.ranges[_ngcontent-%COMP%]   ul[_ngcontent-%COMP%]{list-style:none;margin:0 auto;padding:0;width:100%}.ranges[_ngcontent-%COMP%]   ul[_ngcontent-%COMP%]   li[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]{padding:8px 12px;width:100%;background:none;border:none;border-radius:.375rem;text-align:left;cursor:pointer}.ranges[_ngcontent-%COMP%]   ul[_ngcontent-%COMP%]   li[_ngcontent-%COMP%]   button.active[_ngcontent-%COMP%]{background-color:#08c;color:#fff}.ranges[_ngcontent-%COMP%]   ul[_ngcontent-%COMP%]   li[_ngcontent-%COMP%]   button[disabled][_ngcontent-%COMP%]{opacity:.3}.ranges[_ngcontent-%COMP%]   ul[_ngcontent-%COMP%]   li[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:active{background:transparent}.ranges[_ngcontent-%COMP%]   ul[_ngcontent-%COMP%]   li[_ngcontent-%COMP%]:hover{background-color:#eee;border-radius:.375rem}.show-calendar[_ngcontent-%COMP%]   .ranges[_ngcontent-%COMP%]{margin-top:8px}[hidden][_ngcontent-%COMP%]{display:none}"],
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RangesComponent, [{
    type: Component,
    args: [{
      selector: "ranges",
      imports: [NgClass],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `@if (rangesArray()?.length) {\r
  <div class='ranges'>\r
    <ul>\r
      @for (range of rangesArray(); track $index) {\r
        <li>\r
          <button type='button'\r
                  (click)='clickRange($event, range)'\r
                  [disabled]='disableRange(range)'\r
                  [ngClass]="{'active': range === chosenRange()}">\r
            {{ range }}\r
          </button>\r
        </li>\r
      }\r
    </ul>\r
  </div>\r
}\r
`,
      styles: [".show-ranges .drp-calendar.left{border-left:1px solid #ddd}.ranges{float:none;text-align:left;margin:0}.ranges ul{list-style:none;margin:0 auto;padding:0;width:100%}.ranges ul li button{padding:8px 12px;width:100%;background:none;border:none;border-radius:.375rem;text-align:left;cursor:pointer}.ranges ul li button.active{background-color:#08c;color:#fff}.ranges ul li button[disabled]{opacity:.3}.ranges ul li button:active{background:transparent}.ranges ul li:hover{background-color:#eee;border-radius:.375rem}.show-calendar .ranges{margin-top:8px}[hidden]{display:none}\n"]
    }]
  }], null, {
    rangesArray: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "rangesArray",
        required: false
      }]
    }],
    chosenRange: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "chosenRange",
        required: false
      }]
    }],
    locale: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "locale",
        required: false
      }]
    }],
    ranges: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "ranges",
        required: false
      }]
    }],
    minDate: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "minDate",
        required: false
      }]
    }],
    maxDate: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "maxDate",
        required: false
      }]
    }],
    rangeEvent: [{
      type: Output,
      args: ["rangeEvent"]
    }]
  });
})();
var SideEnum;
(function(SideEnum2) {
  SideEnum2["left"] = "left";
  SideEnum2["right"] = "right";
})(SideEnum || (SideEnum = {}));
var CalendarComponent = class _CalendarComponent {
  sideEnum = SideEnum;
  showCalInRanges = input(...ngDevMode ? [void 0, {
    debugName: "showCalInRanges"
  }] : []);
  singleDatePicker = input(...ngDevMode ? [void 0, {
    debugName: "singleDatePicker"
  }] : []);
  calendarVariables = input(...ngDevMode ? [void 0, {
    debugName: "calendarVariables"
  }] : []);
  showWeekNumbers = input(...ngDevMode ? [void 0, {
    debugName: "showWeekNumbers"
  }] : []);
  showISOWeekNumbers = input(...ngDevMode ? [void 0, {
    debugName: "showISOWeekNumbers"
  }] : []);
  linkedCalendars = input(...ngDevMode ? [void 0, {
    debugName: "linkedCalendars"
  }] : []);
  showDropdowns = input(...ngDevMode ? [void 0, {
    debugName: "showDropdowns"
  }] : []);
  locale = input(...ngDevMode ? [void 0, {
    debugName: "locale"
  }] : []);
  timePicker = input(...ngDevMode ? [void 0, {
    debugName: "timePicker"
  }] : []);
  startDate = input(...ngDevMode ? [void 0, {
    debugName: "startDate"
  }] : []);
  timepickerVariables = input(...ngDevMode ? [void 0, {
    debugName: "timepickerVariables"
  }] : []);
  timePickerSeconds = input(...ngDevMode ? [void 0, {
    debugName: "timePickerSeconds"
  }] : []);
  timePicker24Hour = input(...ngDevMode ? [void 0, {
    debugName: "timePicker24Hour"
  }] : []);
  prevEvent = output();
  nextEvent = output();
  monthChangedEvent = output();
  yearChangedEvent = output();
  dateEvent = output();
  hoverDateEvent = output();
  timeChangedEvent = output();
  clickPrev($event, side) {
    this.prevEvent.emit({
      $event,
      side
    });
  }
  clickNext($event, side) {
    this.nextEvent.emit({
      $event,
      side
    });
  }
  monthChanged($event, side) {
    this.monthChangedEvent.emit({
      $event,
      side
    });
  }
  yearChanged($event, side) {
    this.yearChangedEvent.emit({
      $event,
      side
    });
  }
  clickDate($event, side, row, col) {
    this.dateEvent.emit({
      $event,
      side,
      row,
      col
    });
  }
  hoverDate($event, side, row, col) {
    this.hoverDateEvent.emit({
      $event,
      side,
      row,
      col
    });
  }
  timeChanged($event, side) {
    this.timeChangedEvent.emit({
      $event,
      side
    });
  }
  static ɵfac = function CalendarComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CalendarComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _CalendarComponent,
    selectors: [["calendar"]],
    inputs: {
      showCalInRanges: [1, "showCalInRanges"],
      singleDatePicker: [1, "singleDatePicker"],
      calendarVariables: [1, "calendarVariables"],
      showWeekNumbers: [1, "showWeekNumbers"],
      showISOWeekNumbers: [1, "showISOWeekNumbers"],
      linkedCalendars: [1, "linkedCalendars"],
      showDropdowns: [1, "showDropdowns"],
      locale: [1, "locale"],
      timePicker: [1, "timePicker"],
      startDate: [1, "startDate"],
      timepickerVariables: [1, "timepickerVariables"],
      timePickerSeconds: [1, "timePickerSeconds"],
      timePicker24Hour: [1, "timePicker24Hour"]
    },
    outputs: {
      prevEvent: "prevEvent",
      nextEvent: "nextEvent",
      monthChangedEvent: "monthChangedEvent",
      yearChangedEvent: "yearChangedEvent",
      dateEvent: "dateEvent",
      hoverDateEvent: "hoverDateEvent",
      timeChangedEvent: "timeChangedEvent"
    },
    decls: 2,
    vars: 2,
    consts: [[1, "calendar", 3, "ngClass"], [1, "calendar", "right"], [1, "table-condensed", "calendar-table"], [1, "calendar-time"], [1, "prev", "available"], ["colspan", "5", 1, "month", "drp-animate"], [1, "next", "available"], [1, "week-days"], [1, "week"], [1, "drp-animate"], [3, "class"], [1, "prev", "available", 3, "click"], [1, "dropdowns"], [1, "monthselect", 3, "change"], [3, "selected", "value", "disabled"], [1, "yearselect", 3, "change"], [3, "selected"], [1, "next", "available", 3, "click"], [3, "click", "mouseenter"], [1, "select"], [1, "select-item", "hourselect", 3, "ngModelChange", "disabled", "ngModel"], [3, "value", "disabled"], [1, "select-item", "minuteselect", 3, "ngModelChange", "disabled", "ngModel"], [1, "select-highlight"], [1, "select-bar"], [1, "select-item", "secondselect", 3, "ngModelChange", "disabled", "ngModel"], [1, "select-item", "ampmselect", 3, "ngModelChange", "ngModel"], ["value", "AM", 3, "disabled"], ["value", "PM", 3, "disabled"], ["colspan", "5", 1, "month"]],
    template: function CalendarComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵconditionalCreate(0, CalendarComponent_Conditional_0_Template, 3, 6, "div", 0);
        ɵɵconditionalCreate(1, CalendarComponent_Conditional_1_Template, 3, 2, "div", 1);
      }
      if (rf & 2) {
        ɵɵconditional(ctx.showCalInRanges() ? 0 : -1);
        ɵɵadvance();
        ɵɵconditional(ctx.showCalInRanges() && !ctx.singleDatePicker() ? 1 : -1);
      }
    },
    dependencies: [NgClass, FormsModule, NgSelectOption, ɵNgSelectMultipleOption, SelectControlValueAccessor, NgControlStatus, NgModel],
    styles: ['.calendar[_ngcontent-%COMP%]{max-width:270px;margin:4px}.calendar.single[_ngcontent-%COMP%]   .calendar-table[_ngcontent-%COMP%]{border:none}.calendar[_ngcontent-%COMP%]   th[_ngcontent-%COMP%], .calendar[_ngcontent-%COMP%]   td[_ngcontent-%COMP%]{padding:0;white-space:nowrap;text-align:center;min-width:32px}.calendar[_ngcontent-%COMP%]   th[_ngcontent-%COMP%]   span[_ngcontent-%COMP%], .calendar[_ngcontent-%COMP%]   td[_ngcontent-%COMP%]   span[_ngcontent-%COMP%]{pointer-events:none}.calendar-table[_ngcontent-%COMP%]{border:1px solid #fff;padding:4px;border-radius:50%;background-color:#fff}table[_ngcontent-%COMP%]{width:100%;margin:0;border-collapse:separate;border-spacing:1px}th[_ngcontent-%COMP%]{color:#000}td[_ngcontent-%COMP%], th[_ngcontent-%COMP%]{text-align:center;border-radius:50%;white-space:nowrap;cursor:pointer;height:2em;width:2em}td.available.prev[_ngcontent-%COMP%], th.available.prev[_ngcontent-%COMP%]{display:block;background-image:url(data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgMy43IDYiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDMuNyA2IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxnPg0KCTxwYXRoIGQ9Ik0zLjcsMC43TDEuNCwzbDIuMywyLjNMMyw2TDAsM2wzLTNMMy43LDAuN3oiLz4NCjwvZz4NCjwvc3ZnPg0K);background-repeat:no-repeat;background-size:.5em;background-position:center;transition:background-color .2s ease;border-radius:50%}td.available.prev[_ngcontent-%COMP%]:hover, th.available.prev[_ngcontent-%COMP%]:hover{margin:0}td.available.next[_ngcontent-%COMP%], th.available.next[_ngcontent-%COMP%]{transform:rotate(180deg);display:block;background-image:url(data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgMy43IDYiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDMuNyA2IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxnPg0KCTxwYXRoIGQ9Ik0zLjcsMC43TDEuNCwzbDIuMywyLjNMMyw2TDAsM2wzLTNMMy43LDAuN3oiLz4NCjwvZz4NCjwvc3ZnPg0K);background-repeat:no-repeat;background-size:.5em;background-position:center;transition:background-color .2s ease;border-radius:50%}td.available.next[_ngcontent-%COMP%]:hover, th.available.next[_ngcontent-%COMP%]:hover{margin:0;transform:rotate(180deg)}td.available[_ngcontent-%COMP%]:hover, th.available[_ngcontent-%COMP%]:hover{background-color:#eee;border-color:transparent;color:inherit;background-repeat:no-repeat;background-size:.5em;background-position:center;margin:.25em 0;border-radius:50%;transform:scale(1);transition:all .45s cubic-bezier(.23,1,.32,1) 0ms}td.week[_ngcontent-%COMP%], th.week[_ngcontent-%COMP%]{color:#ccc}td[_ngcontent-%COMP%]{margin:.25em 0;border-radius:50%;transform:scale(1);transition:all .45s cubic-bezier(.23,1,.32,1) 0ms}td.off[_ngcontent-%COMP%], td.off.in-range[_ngcontent-%COMP%], td.off.start-date[_ngcontent-%COMP%], td.off.end-date[_ngcontent-%COMP%]{background-color:#fff;border-color:transparent;color:#999}td.in-range[_ngcontent-%COMP%]{background-color:#ebf4f8;border-color:transparent;color:#000;border-radius:0}td.start-date[_ngcontent-%COMP%]{border-radius:50% 0 0 50%}td.end-date[_ngcontent-%COMP%]{border-radius:0 50% 50% 0}td.start-date.end-date[_ngcontent-%COMP%]{border-radius:50%}td.active[_ngcontent-%COMP%]{transition:background .3s ease-out}td.active[_ngcontent-%COMP%], td.active[_ngcontent-%COMP%]:hover{background-color:#08c;border-color:transparent;color:#fff}th.month[_ngcontent-%COMP%]{width:auto}td.disabled[_ngcontent-%COMP%], option.disabled[_ngcontent-%COMP%]{color:#999;cursor:not-allowed;text-decoration:line-through}.dropdowns[_ngcontent-%COMP%]{background-repeat:no-repeat;background-size:10px;background-position-y:center;background-position-x:right;width:50px;background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjE2cHgiIGhlaWdodD0iMTZweCIgdmlld0JveD0iMCAwIDI1NSAyNTUiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDI1NSAyNTU7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPGc+Cgk8ZyBpZD0iYXJyb3ctZHJvcC1kb3duIj4KCQk8cG9seWdvbiBwb2ludHM9IjAsNjMuNzUgMTI3LjUsMTkxLjI1IDI1NSw2My43NSAgICIgZmlsbD0iIzk4OGM4YyIvPgoJPC9nPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=)}.dropdowns[_ngcontent-%COMP%]   select[_ngcontent-%COMP%]{display:inline-block;background-color:#ffffffe6;width:100%;padding:5px;border:1px solid #f2f2f2;border-radius:calc(.5rem - 1px);height:3rem}.dropdowns[_ngcontent-%COMP%]   select.monthselect[_ngcontent-%COMP%], .dropdowns[_ngcontent-%COMP%]   select.yearselect[_ngcontent-%COMP%]{font-size:12px;padding:1px;height:auto;margin:0;cursor:default}.dropdowns[_ngcontent-%COMP%]   select.hourselect[_ngcontent-%COMP%], .dropdowns[_ngcontent-%COMP%]   select.minuteselect[_ngcontent-%COMP%], .dropdowns[_ngcontent-%COMP%]   select.secondselect[_ngcontent-%COMP%], .dropdowns[_ngcontent-%COMP%]   select.ampmselect[_ngcontent-%COMP%]{width:50px;margin:0 auto;background:#eee;border:1px solid #eee;padding:2px;outline:0;font-size:12px}.dropdowns[_ngcontent-%COMP%]   select.monthselect[_ngcontent-%COMP%], .dropdowns[_ngcontent-%COMP%]   select.yearselect[_ngcontent-%COMP%]{cursor:pointer;opacity:0;position:absolute;top:0;left:0;margin:0;padding:0}th.month[_ngcontent-%COMP%] > div[_ngcontent-%COMP%]{position:relative;display:inline-block}.calendar-time[_ngcontent-%COMP%]{text-align:center;margin:4px auto 0;line-height:30px;position:relative}.calendar-time[_ngcontent-%COMP%]   .select[_ngcontent-%COMP%]{display:inline;border:1px solid #eee;border-radius:calc(.5rem - 1px);background:#eee;padding:3px}.calendar-time[_ngcontent-%COMP%]   .select[_ngcontent-%COMP%]   .select-item[_ngcontent-%COMP%]{display:inline-block;width:auto;position:relative;font-family:inherit;background-color:transparent;padding:0 10px 0 0;border-radius:calc(.5rem - 1px);border:none}.calendar-time[_ngcontent-%COMP%]   .select[_ngcontent-%COMP%]   .select-item[_ngcontent-%COMP%]:after{position:absolute;top:18px;right:10px;width:0;height:0;padding:0;content:"";border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid rgba(0,0,0,.12);pointer-events:none}.calendar-time[_ngcontent-%COMP%]   .select[_ngcontent-%COMP%]   .select-item[_ngcontent-%COMP%]:focus{outline:none}.calendar-time[_ngcontent-%COMP%]   .select[_ngcontent-%COMP%]   .select-item[_ngcontent-%COMP%]   .select-label[_ngcontent-%COMP%]{color:#00000042;font-size:16px;font-weight:400;position:absolute;pointer-events:none;left:0;top:10px;transition:.2s ease all}.calendar-time[_ngcontent-%COMP%]   select.disabled[_ngcontent-%COMP%]{color:#ccc;cursor:not-allowed}'],
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CalendarComponent, [{
    type: Component,
    args: [{
      selector: "calendar",
      imports: [NgClass, FormsModule],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `@if (showCalInRanges()) {\r
  <div class='calendar' [ngClass]='{right: singleDatePicker(), left: !singleDatePicker()}'>\r
    @if (calendarVariables()) {\r
      <table class='table-condensed calendar-table'>\r
        <thead>\r
        <tr>\r
          @if (showWeekNumbers() || showISOWeekNumbers()) {\r
            <th></th>\r
          }\r
          @if (!calendarVariables().left.minDate || calendarVariables().left.minDate.isBefore(calendarVariables().left.calendar.firstDay) && (!linkedCalendars() || true)) {\r
            <th (click)='clickPrev($event, sideEnum.left)' class='prev available'></th>\r
          }\r
          @if (!(!calendarVariables().left.minDate || calendarVariables().left.minDate.isBefore(calendarVariables().left.calendar.firstDay) && (!linkedCalendars() || true))) {\r
            <th></th>\r
          }\r
          <th colspan='5' class='month drp-animate'>\r
            @if (showDropdowns() && calendarVariables().left.dropdowns) {\r
              <div class='dropdowns'>\r
                {{ locale().monthNames[calendarVariables().left.calendar?.[1][1].month()] }}\r
                <select class='monthselect' (change)='monthChanged($event, sideEnum.left)'>\r
                  @for (m of calendarVariables().left.dropdowns.monthArrays; track $index) {\r
                    <option [selected]='calendarVariables().left.dropdowns.currentMonth == m' [value]='m'\r
                            [disabled]='(calendarVariables().left.dropdowns.inMinYear && m < calendarVariables().left.minDate.month())\r
                              || (calendarVariables().left.dropdowns.inMaxYear && m > calendarVariables().left.maxDate.month())'>\r
                      {{ locale().monthNames[m] }}\r
                    </option>\r
                  }\r
                </select>\r
              </div>\r
              <div class='dropdowns'>\r
                {{ calendarVariables().left.calendar?.[1][1].format(" YYYY") }}\r
                <select class='yearselect' (change)='yearChanged($event, sideEnum.left)'>\r
                  @for (y of calendarVariables().left.dropdowns.yearArrays; track $index) {\r
                    <option [selected]='y === calendarVariables().left.dropdowns.currentYear'>\r
                      {{ y }}\r
                    </option>\r
                  }\r
                </select>\r
              </div>\r
            }\r
            @if (!showDropdowns() || !calendarVariables().left.dropdowns) {\r
              {{ locale().monthNames[calendarVariables().left.calendar?.[1][1].month()] }}  {{ calendarVariables().left.calendar?.[1][1].format(" YYYY") }}\r
            }\r
          </th>\r
          @if ((!calendarVariables().left.maxDate || calendarVariables().left.maxDate.isAfter(calendarVariables().left.calendar.lastDay)) && (!linkedCalendars() || singleDatePicker())) {\r
            <th class='next available' (click)='clickNext($event, sideEnum.left)'></th>\r
          }\r
          @if (!((!calendarVariables().left.maxDate || calendarVariables().left.maxDate.isAfter(calendarVariables().left.calendar.lastDay)) && (!linkedCalendars() || singleDatePicker()))) {\r
            <th></th>\r
          }\r
        </tr>\r
        <tr class='week-days'>\r
          @if (showWeekNumbers() || showISOWeekNumbers()) {\r
            <th class='week'>\r
              <span>{{ locale().weekLabel }}</span>\r
            </th>\r
          }\r
          @for (dayofweek of locale().daysOfWeek; track $index) {\r
            <th>\r
              <span>{{ dayofweek }}</span>\r
            </th>\r
          }\r
        </tr>\r
        </thead>\r
        <tbody class='drp-animate'>\r
          @for (row of calendarVariables().left.calRows; track $index) {\r
            <tr [class]='calendarVariables().left.classes[row].classList'>\r
              <!-- add week number -->\r
              @if (showWeekNumbers()) {\r
                <td class='week'>\r
                  <span>{{ calendarVariables().left.calendar?.[row][0].week() }}</span>\r
                </td>\r
              }\r
              @if (showISOWeekNumbers()) {\r
                <td class='week'>\r
                  <span>{{ calendarVariables().left.calendar?.[row][0].isoWeek() }}</span>\r
                </td>\r
              }\r
              <!-- cal -->\r
              @for (col of calendarVariables().left.calCols; track $index) {\r
                <td [class]='calendarVariables().left.classes[row][col]'\r
                    (click)='clickDate($event, sideEnum.left, row, col)'\r
                    (mouseenter)='hoverDate($event, sideEnum.left, row, col)'>\r
                  <span>{{ calendarVariables().left.calendar?.[row][col].date() }}</span>\r
                </td>\r
              }\r
            </tr>\r
          }\r
        </tbody>\r
      </table>\r
    }\r
    @if (timePicker()) {\r
      <div class='calendar-time'>\r
        <div class='select'>\r
          <select class='select-item hourselect' [disabled]='!startDate()'\r
                  [(ngModel)]='timepickerVariables().left.selectedHour'\r
                  (ngModelChange)='timeChanged($event, sideEnum.left)'>\r
            @for (i of timepickerVariables().left.hours; track $index) {\r
              <option [value]='i' [disabled]='timepickerVariables().left.disabledHours.indexOf(i) > -1'>\r
                {{ i }}\r
              </option>\r
            }\r
          </select>\r
        </div>\r
        :\r
        <div class='select'>\r
          <select class='select-item minuteselect' [disabled]='!startDate()'\r
                  [(ngModel)]='timepickerVariables().left.selectedMinute'\r
                  (ngModelChange)='timeChanged($event, sideEnum.left)'>\r
            @for (i of timepickerVariables().left.minutes; track $index) {\r
              <option [value]='i' [disabled]='timepickerVariables().left.disabledMinutes.indexOf(i) > -1'>\r
                {{ timepickerVariables().left.minutesLabel[$index] }}\r
              </option>\r
            }\r
          </select>\r
          <span class='select-highlight'></span>\r
          <span class='select-bar'></span>\r
        </div>\r
        @if (timePickerSeconds()) {\r
          :\r
          <div class='select'>\r
            <select class='select-item secondselect' [disabled]='!startDate()'\r
                    [(ngModel)]='timepickerVariables().left.selectedSecond'\r
                    (ngModelChange)='timeChanged($event, sideEnum.left)'>\r
              @for (i of timepickerVariables().left.seconds; track $index) {\r
                <option [value]='i' [disabled]='timepickerVariables().left.disabledSeconds.indexOf(i) > -1'>\r
                  {{ timepickerVariables().left.secondsLabel[$index] }}\r
                </option>\r
              }\r
            </select>\r
            <span class='select-highlight'></span>\r
            <span class='select-bar'></span>\r
          </div>\r
        }\r
        @if (!timePicker24Hour()) {\r
          <div class='select'>\r
            <select class='select-item ampmselect'\r
                    [(ngModel)]='timepickerVariables().left.ampmModel'\r
                    (ngModelChange)='timeChanged($event, sideEnum.left)'>\r
              <option value='AM' [disabled]='timepickerVariables().left.amDisabled'>AM</option>\r
              <option value='PM' [disabled]='timepickerVariables().left.pmDisabled'>PM</option>\r
            </select>\r
            <span class='select-highlight'></span>\r
            <span class='select-bar'></span>\r
          </div>\r
        }\r
      </div>\r
    }\r
  </div>\r
}\r
@if (showCalInRanges() && !singleDatePicker()) {\r
  <div class='calendar right'>\r
    @if (calendarVariables()) {\r
      <table class='table-condensed calendar-table'>\r
        <thead>\r
        <tr>\r
          @if (showWeekNumbers() || showISOWeekNumbers()) {\r
            <th></th>\r
          }\r
          @if ((!calendarVariables().right.minDate || calendarVariables().right.minDate.isBefore(calendarVariables().right.calendar.firstDay)) && (!linkedCalendars())) {\r
            <th (click)='clickPrev($event, sideEnum.right)' class='prev available'></th>\r
          }\r
          @if (!((!calendarVariables().right.minDate || calendarVariables().right.minDate.isBefore(calendarVariables().right.calendar.firstDay)) && (!linkedCalendars()))) {\r
            <th></th>\r
          }\r
          <th colspan='5' class='month'>\r
            @if (showDropdowns() && calendarVariables().right.dropdowns) {\r
              <div class='dropdowns'>\r
                {{ locale().monthNames[calendarVariables().right.calendar?.[1][1].month()] }}\r
                <select class='monthselect' (change)='monthChanged($event, sideEnum.right)'>\r
                  @for (m of calendarVariables().right.dropdowns.monthArrays; track $index) {\r
                    <option [selected]='calendarVariables().right.dropdowns.currentMonth == m' [value]='m'\r
                            [disabled]='(calendarVariables().right.dropdowns.inMinYear && calendarVariables().right.minDate && m < calendarVariables().right.minDate.month())\r
                          || (calendarVariables().right.dropdowns.inMaxYear && calendarVariables().right.maxDate && m > calendarVariables().right.maxDate.month())'>\r
                      {{ locale().monthNames[m] }}\r
                    </option>\r
                  }\r
                </select>\r
              </div>\r
              <div class='dropdowns'>\r
                {{ calendarVariables().right.calendar?.[1][1].format(" YYYY") }}\r
                <select class='yearselect' (change)='yearChanged($event, sideEnum.right)'>\r
                  @for (y of calendarVariables().right.dropdowns.yearArrays; track $index) {\r
                    <option [selected]='y === calendarVariables().right.dropdowns.currentYear'>\r
                      {{ y }}\r
                    </option>\r
                  }\r
                </select>\r
              </div>\r
            }\r
            @if (!showDropdowns() || !calendarVariables().right.dropdowns) {\r
              {{ locale().monthNames[calendarVariables().right.calendar?.[1][1].month()] }}  {{ calendarVariables().right.calendar?.[1][1].format(" YYYY") }}\r
            }\r
          </th>\r
          @if (!calendarVariables().right.maxDate || calendarVariables().right.maxDate.isAfter(calendarVariables().right.calendar.lastDay) && (!linkedCalendars() || singleDatePicker() || true)) {\r
            <th class='next available' (click)='clickNext($event, sideEnum.right)'></th>\r
          }\r
          @if (!(!calendarVariables().right.maxDate || calendarVariables().right.maxDate.isAfter(calendarVariables().right.calendar.lastDay) && (!linkedCalendars() || singleDatePicker() || true))) {\r
            <th></th>\r
          }\r
        </tr>\r
        <tr class='week-days'>\r
          @if (showWeekNumbers() || showISOWeekNumbers()) {\r
            <th class='week'>\r
              <span>{{ locale().weekLabel }}</span>\r
            </th>\r
          }\r
          @for (dayofweek of locale().daysOfWeek; track $index) {\r
            <th>\r
              <span>{{ dayofweek }}</span>\r
            </th>\r
          }\r
        </tr>\r
        </thead>\r
        <tbody>\r
          @for (row of calendarVariables().right.calRows; track $index) {\r
            <tr [class]='calendarVariables().right.classes[row].classList'>\r
              @if (showWeekNumbers()) {\r
                <td class='week'>\r
                  <span>{{ calendarVariables().right.calendar?.[row][0].week() }}</span>\r
                </td>\r
              }\r
              @if (showISOWeekNumbers()) {\r
                <td class='week'>\r
                  <span>{{ calendarVariables().right.calendar?.[row][0].isoWeek() }}</span>\r
                </td>\r
              }\r
              @for (col of calendarVariables().right.calCols; track $index) {\r
                <td [class]='calendarVariables().right.classes[row][col]'\r
                    (click)='clickDate($event, sideEnum.right, row, col)'\r
                    (mouseenter)='hoverDate($event, sideEnum.right, row, col)'>\r
                  <span>{{ calendarVariables().right.calendar?.[row][col].date() }}</span>\r
                </td>\r
              }\r
            </tr>\r
          }\r
        </tbody>\r
      </table>\r
    }\r
    @if (timePicker()) {\r
      <div class='calendar-time'>\r
        <div class='select'>\r
          <select class='select-item hourselect' [disabled]='!startDate()'\r
                  [(ngModel)]='timepickerVariables().right.selectedHour'\r
                  (ngModelChange)='timeChanged($event, sideEnum.right)'>\r
            @for (i of timepickerVariables().right.hours; track $index) {\r
              <option [value]='i' [disabled]='timepickerVariables().right.disabledHours.indexOf(i) > -1'>\r
                {{ i }}\r
              </option>\r
            }\r
          </select>\r
          <span class='select-highlight'></span>\r
          <span class='select-bar'></span>\r
        </div>\r
        :\r
        <div class='select'>\r
          <select class='select-item minuteselect' [disabled]='!startDate()'\r
                  [(ngModel)]='timepickerVariables().right.selectedMinute'\r
                  (ngModelChange)='timeChanged($event, sideEnum.right)'>\r
            @for (i of timepickerVariables().right.minutes; track $index) {\r
              <option [value]='i' [disabled]='timepickerVariables().right.disabledMinutes.indexOf(i) > -1'>\r
                {{ timepickerVariables().right.minutesLabel[$index] }}\r
              </option>\r
            }\r
          </select>\r
          <span class='select-highlight'></span>\r
          <span class='select-bar'></span>\r
        </div>\r
        @if (timePickerSeconds()) {\r
          :\r
          <div class='select'>\r
\r
            <select class='select-item secondselect' [disabled]='!startDate()'\r
                    [(ngModel)]='timepickerVariables().right.selectedSecond'\r
                    (ngModelChange)='timeChanged($event, sideEnum.right)'>\r
              @for (i of timepickerVariables().right.seconds; track $index) {\r
                <option [value]='i' [disabled]='timepickerVariables().right.disabledSeconds.indexOf(i) > -1'>\r
                  {{ timepickerVariables().right.secondsLabel[$index] }}\r
                </option>\r
              }\r
            </select>\r
\r
            <span class='select-highlight'></span>\r
            <span class='select-bar'></span>\r
          </div>\r
        }\r
        @if (!timePicker24Hour()) {\r
          <div class='select'>\r
            <select class='select-item ampmselect'\r
                    [(ngModel)]='timepickerVariables().right.ampmModel'\r
                    (ngModelChange)='timeChanged($event, sideEnum.right)'>\r
              <option value='AM' [disabled]='timepickerVariables().right.amDisabled'>AM</option>\r
              <option value='PM' [disabled]='timepickerVariables().right.pmDisabled'>PM</option>\r
            </select>\r
            <span class='select-highlight'></span>\r
            <span class='select-bar'></span>\r
          </div>\r
        }\r
      </div>\r
    }\r
  </div>\r
}\r
`,
      styles: ['.calendar{max-width:270px;margin:4px}.calendar.single .calendar-table{border:none}.calendar th,.calendar td{padding:0;white-space:nowrap;text-align:center;min-width:32px}.calendar th span,.calendar td span{pointer-events:none}.calendar-table{border:1px solid #fff;padding:4px;border-radius:50%;background-color:#fff}table{width:100%;margin:0;border-collapse:separate;border-spacing:1px}th{color:#000}td,th{text-align:center;border-radius:50%;white-space:nowrap;cursor:pointer;height:2em;width:2em}td.available.prev,th.available.prev{display:block;background-image:url(data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgMy43IDYiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDMuNyA2IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxnPg0KCTxwYXRoIGQ9Ik0zLjcsMC43TDEuNCwzbDIuMywyLjNMMyw2TDAsM2wzLTNMMy43LDAuN3oiLz4NCjwvZz4NCjwvc3ZnPg0K);background-repeat:no-repeat;background-size:.5em;background-position:center;transition:background-color .2s ease;border-radius:50%}td.available.prev:hover,th.available.prev:hover{margin:0}td.available.next,th.available.next{transform:rotate(180deg);display:block;background-image:url(data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgMy43IDYiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDMuNyA2IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxnPg0KCTxwYXRoIGQ9Ik0zLjcsMC43TDEuNCwzbDIuMywyLjNMMyw2TDAsM2wzLTNMMy43LDAuN3oiLz4NCjwvZz4NCjwvc3ZnPg0K);background-repeat:no-repeat;background-size:.5em;background-position:center;transition:background-color .2s ease;border-radius:50%}td.available.next:hover,th.available.next:hover{margin:0;transform:rotate(180deg)}td.available:hover,th.available:hover{background-color:#eee;border-color:transparent;color:inherit;background-repeat:no-repeat;background-size:.5em;background-position:center;margin:.25em 0;border-radius:50%;transform:scale(1);transition:all .45s cubic-bezier(.23,1,.32,1) 0ms}td.week,th.week{color:#ccc}td{margin:.25em 0;border-radius:50%;transform:scale(1);transition:all .45s cubic-bezier(.23,1,.32,1) 0ms}td.off,td.off.in-range,td.off.start-date,td.off.end-date{background-color:#fff;border-color:transparent;color:#999}td.in-range{background-color:#ebf4f8;border-color:transparent;color:#000;border-radius:0}td.start-date{border-radius:50% 0 0 50%}td.end-date{border-radius:0 50% 50% 0}td.start-date.end-date{border-radius:50%}td.active{transition:background .3s ease-out}td.active,td.active:hover{background-color:#08c;border-color:transparent;color:#fff}th.month{width:auto}td.disabled,option.disabled{color:#999;cursor:not-allowed;text-decoration:line-through}.dropdowns{background-repeat:no-repeat;background-size:10px;background-position-y:center;background-position-x:right;width:50px;background-image:url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjE2cHgiIGhlaWdodD0iMTZweCIgdmlld0JveD0iMCAwIDI1NSAyNTUiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDI1NSAyNTU7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPGc+Cgk8ZyBpZD0iYXJyb3ctZHJvcC1kb3duIj4KCQk8cG9seWdvbiBwb2ludHM9IjAsNjMuNzUgMTI3LjUsMTkxLjI1IDI1NSw2My43NSAgICIgZmlsbD0iIzk4OGM4YyIvPgoJPC9nPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=)}.dropdowns select{display:inline-block;background-color:#ffffffe6;width:100%;padding:5px;border:1px solid #f2f2f2;border-radius:calc(.5rem - 1px);height:3rem}.dropdowns select.monthselect,.dropdowns select.yearselect{font-size:12px;padding:1px;height:auto;margin:0;cursor:default}.dropdowns select.hourselect,.dropdowns select.minuteselect,.dropdowns select.secondselect,.dropdowns select.ampmselect{width:50px;margin:0 auto;background:#eee;border:1px solid #eee;padding:2px;outline:0;font-size:12px}.dropdowns select.monthselect,.dropdowns select.yearselect{cursor:pointer;opacity:0;position:absolute;top:0;left:0;margin:0;padding:0}th.month>div{position:relative;display:inline-block}.calendar-time{text-align:center;margin:4px auto 0;line-height:30px;position:relative}.calendar-time .select{display:inline;border:1px solid #eee;border-radius:calc(.5rem - 1px);background:#eee;padding:3px}.calendar-time .select .select-item{display:inline-block;width:auto;position:relative;font-family:inherit;background-color:transparent;padding:0 10px 0 0;border-radius:calc(.5rem - 1px);border:none}.calendar-time .select .select-item:after{position:absolute;top:18px;right:10px;width:0;height:0;padding:0;content:"";border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid rgba(0,0,0,.12);pointer-events:none}.calendar-time .select .select-item:focus{outline:none}.calendar-time .select .select-item .select-label{color:#00000042;font-size:16px;font-weight:400;position:absolute;pointer-events:none;left:0;top:10px;transition:.2s ease all}.calendar-time select.disabled{color:#ccc;cursor:not-allowed}\n']
    }]
  }], null, {
    showCalInRanges: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "showCalInRanges",
        required: false
      }]
    }],
    singleDatePicker: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "singleDatePicker",
        required: false
      }]
    }],
    calendarVariables: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "calendarVariables",
        required: false
      }]
    }],
    showWeekNumbers: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "showWeekNumbers",
        required: false
      }]
    }],
    showISOWeekNumbers: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "showISOWeekNumbers",
        required: false
      }]
    }],
    linkedCalendars: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "linkedCalendars",
        required: false
      }]
    }],
    showDropdowns: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "showDropdowns",
        required: false
      }]
    }],
    locale: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "locale",
        required: false
      }]
    }],
    timePicker: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "timePicker",
        required: false
      }]
    }],
    startDate: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "startDate",
        required: false
      }]
    }],
    timepickerVariables: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "timepickerVariables",
        required: false
      }]
    }],
    timePickerSeconds: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "timePickerSeconds",
        required: false
      }]
    }],
    timePicker24Hour: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "timePicker24Hour",
        required: false
      }]
    }],
    prevEvent: [{
      type: Output,
      args: ["prevEvent"]
    }],
    nextEvent: [{
      type: Output,
      args: ["nextEvent"]
    }],
    monthChangedEvent: [{
      type: Output,
      args: ["monthChangedEvent"]
    }],
    yearChangedEvent: [{
      type: Output,
      args: ["yearChangedEvent"]
    }],
    dateEvent: [{
      type: Output,
      args: ["dateEvent"]
    }],
    hoverDateEvent: [{
      type: Output,
      args: ["hoverDateEvent"]
    }],
    timeChangedEvent: [{
      type: Output,
      args: ["timeChangedEvent"]
    }]
  });
})();
var ActionsComponent = class _ActionsComponent {
  rangesArray = input([], ...ngDevMode ? [{
    debugName: "rangesArray"
  }] : []);
  autoApply = input(...ngDevMode ? [void 0, {
    debugName: "autoApply"
  }] : []);
  showCalInRanges = input(...ngDevMode ? [void 0, {
    debugName: "showCalInRanges"
  }] : []);
  singleDatePicker = input(...ngDevMode ? [void 0, {
    debugName: "singleDatePicker"
  }] : []);
  chosenLabel = input(...ngDevMode ? [void 0, {
    debugName: "chosenLabel"
  }] : []);
  applyBtnDisabled = input(...ngDevMode ? [void 0, {
    debugName: "applyBtnDisabled"
  }] : []);
  locale = input(...ngDevMode ? [void 0, {
    debugName: "locale"
  }] : []);
  showCancel = input(...ngDevMode ? [void 0, {
    debugName: "showCancel"
  }] : []);
  showClearButton = input(...ngDevMode ? [void 0, {
    debugName: "showClearButton"
  }] : []);
  applyEvent = output();
  cancelEvent = output();
  clearEvent = output();
  clickApply($event) {
    this.applyEvent.emit($event);
  }
  clickCancel($event) {
    this.cancelEvent.emit($event);
  }
  clickClear($event) {
    this.clearEvent.emit($event);
  }
  static ɵfac = function ActionsComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ActionsComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _ActionsComponent,
    selectors: [["actions"]],
    inputs: {
      rangesArray: [1, "rangesArray"],
      autoApply: [1, "autoApply"],
      showCalInRanges: [1, "showCalInRanges"],
      singleDatePicker: [1, "singleDatePicker"],
      chosenLabel: [1, "chosenLabel"],
      applyBtnDisabled: [1, "applyBtnDisabled"],
      locale: [1, "locale"],
      showCancel: [1, "showCancel"],
      showClearButton: [1, "showClearButton"]
    },
    outputs: {
      applyEvent: "applyEvent",
      cancelEvent: "cancelEvent",
      clearEvent: "clearEvent"
    },
    decls: 1,
    vars: 1,
    consts: [[1, "card-footer"], [2, "display", "inline-block", "padding", "7px"], ["type", "button", 1, "btn", "btn-primary", "float-end", 3, "click", "disabled"], ["type", "button", 1, "btn", "btn-secondary", "me-2", "float-end"], ["type", "button", 1, "btn", "btn-outline-dark", "me-2", "float-end", 3, "title"], ["type", "button", 1, "btn", "btn-secondary", "me-2", "float-end", 3, "click"], ["type", "button", 1, "btn", "btn-outline-dark", "me-2", "float-end", 3, "click", "title"]],
    template: function ActionsComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵconditionalCreate(0, ActionsComponent_Conditional_0_Template, 7, 5, "div", 0);
      }
      if (rf & 2) {
        ɵɵconditional(!ctx.autoApply() && (!ctx.rangesArray().length || ctx.showCalInRanges() && !ctx.singleDatePicker()) ? 0 : -1);
      }
    },
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ActionsComponent, [{
    type: Component,
    args: [{
      selector: "actions",
      imports: [],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `@if (!autoApply() && (!rangesArray().length || (showCalInRanges() && !singleDatePicker()))) {\r
  <div class="card-footer">\r
    <span style="display: inline-block; padding: 7px;">{{ chosenLabel() }}</span>\r
    <button type='button'\r
            class='btn btn-primary float-end'\r
            (click)='clickApply($event)'\r
            [disabled]='applyBtnDisabled()'>\r
      {{ locale().applyLabel }}\r
    </button>\r
    @if (showCancel()) {\r
      <button type='button'\r
              class='btn btn-secondary me-2 float-end'\r
              (click)='clickCancel($event)'>\r
        {{ locale().cancelLabel }}\r
      </button>\r
    }\r
    @if (showClearButton()) {\r
      <button type='button'\r
              class='btn btn-outline-dark me-2 float-end'\r
              (click)='clickClear($event)'\r
              [title]='locale().clearLabel'>\r
        {{ locale().clearLabel }}\r
      </button>\r
    }\r
  </div>\r
}\r
`
    }]
  }], null, {
    rangesArray: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "rangesArray",
        required: false
      }]
    }],
    autoApply: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "autoApply",
        required: false
      }]
    }],
    showCalInRanges: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "showCalInRanges",
        required: false
      }]
    }],
    singleDatePicker: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "singleDatePicker",
        required: false
      }]
    }],
    chosenLabel: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "chosenLabel",
        required: false
      }]
    }],
    applyBtnDisabled: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "applyBtnDisabled",
        required: false
      }]
    }],
    locale: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "locale",
        required: false
      }]
    }],
    showCancel: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "showCancel",
        required: false
      }]
    }],
    showClearButton: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "showClearButton",
        required: false
      }]
    }],
    applyEvent: [{
      type: Output,
      args: ["applyEvent"]
    }],
    cancelEvent: [{
      type: Output,
      args: ["cancelEvent"]
    }],
    clearEvent: [{
      type: Output,
      args: ["clearEvent"]
    }]
  });
})();
import_dayjs.default.extend(import_localeData.default);
import_dayjs.default.extend(import_localizedFormat.default);
import_dayjs.default.extend(import_isoWeek.default);
import_dayjs.default.extend(import_weekOfYear.default);
import_dayjs.default.extend(import_customParseFormat.default);
var NgxDaterangepickerBootstrapComponent = class _NgxDaterangepickerBootstrapComponent {
  _localeService = inject(NgxDaterangepickerLocaleService);
  $event;
  chosenLabel;
  calendarVariables = {
    left: {},
    right: {}
  };
  timepickerVariables = {
    left: {},
    right: {}
  };
  applyBtnDisabled = signal(false, ...ngDevMode ? [{
    debugName: "applyBtnDisabled"
  }] : []);
  chosenRange;
  rangesArray = [];
  inline = true;
  showCalInRanges = false;
  tooltiptext = [];
  // for storing tooltiptext
  leftCalendar = {};
  rightCalendar = {};
  nowHoveredDate = null;
  pickingDate = false;
  _old = {
    start: null,
    end: null
  };
  _minDate;
  _maxDate;
  // private _locale: LocaleConfig = {};
  _ranges = {};
  startDate = model((0, import_dayjs.default)().startOf("day"), ...ngDevMode ? [{
    debugName: "startDate"
  }] : []);
  endDate = model((0, import_dayjs.default)().endOf("day"), ...ngDevMode ? [{
    debugName: "endDate"
  }] : []);
  dateLimit = input(null, ...ngDevMode ? [{
    debugName: "dateLimit"
  }] : []);
  autoApply = input(false, ...ngDevMode ? [{
    debugName: "autoApply"
  }] : []);
  singleDatePicker = input(false, ...ngDevMode ? [{
    debugName: "singleDatePicker"
  }] : []);
  showDropdowns = input(false, ...ngDevMode ? [{
    debugName: "showDropdowns"
  }] : []);
  showWeekNumbers = input(false, ...ngDevMode ? [{
    debugName: "showWeekNumbers"
  }] : []);
  showISOWeekNumbers = input(false, ...ngDevMode ? [{
    debugName: "showISOWeekNumbers"
  }] : []);
  linkedCalendars = input(false, ...ngDevMode ? [{
    debugName: "linkedCalendars"
  }] : []);
  autoUpdateInput = input(true, ...ngDevMode ? [{
    debugName: "autoUpdateInput"
  }] : []);
  alwaysShowCalendars = input(false, ...ngDevMode ? [{
    debugName: "alwaysShowCalendars"
  }] : []);
  maxSpan = input(false, ...ngDevMode ? [{
    debugName: "maxSpan"
  }] : []);
  lockStartDate = input(false, ...ngDevMode ? [{
    debugName: "lockStartDate"
  }] : []);
  timePicker = input(false, ...ngDevMode ? [{
    debugName: "timePicker"
  }] : []);
  timePicker24Hour = input(false, ...ngDevMode ? [{
    debugName: "timePicker24Hour"
  }] : []);
  timePickerIncrement = input(1, ...ngDevMode ? [{
    debugName: "timePickerIncrement"
  }] : []);
  timePicker24HourInterval = input([0, 23], ...ngDevMode ? [{
    debugName: "timePicker24HourInterval"
  }] : []);
  timePickerSeconds = input(false, ...ngDevMode ? [{
    debugName: "timePickerSeconds"
  }] : []);
  showClearButton = input(false, ...ngDevMode ? [{
    debugName: "showClearButton"
  }] : []);
  firstMonthDayClass = input(null, ...ngDevMode ? [{
    debugName: "firstMonthDayClass"
  }] : []);
  lastMonthDayClass = input(null, ...ngDevMode ? [{
    debugName: "lastMonthDayClass"
  }] : []);
  emptyWeekRowClass = input(null, ...ngDevMode ? [{
    debugName: "emptyWeekRowClass"
  }] : []);
  emptyWeekColumnClass = input(null, ...ngDevMode ? [{
    debugName: "emptyWeekColumnClass"
  }] : []);
  firstDayOfNextMonthClass = input(null, ...ngDevMode ? [{
    debugName: "firstDayOfNextMonthClass"
  }] : []);
  lastDayOfPreviousMonthClass = input(null, ...ngDevMode ? [{
    debugName: "lastDayOfPreviousMonthClass"
  }] : []);
  showCustomRangeLabel = input(...ngDevMode ? [void 0, {
    debugName: "showCustomRangeLabel"
  }] : []);
  showCancel = input(false, ...ngDevMode ? [{
    debugName: "showCancel"
  }] : []);
  keepCalendarOpeningWithRange = input(false, ...ngDevMode ? [{
    debugName: "keepCalendarOpeningWithRange"
  }] : []);
  showRangeLabelOnInput = input(false, ...ngDevMode ? [{
    debugName: "showRangeLabelOnInput"
  }] : []);
  customRangeDirection = input(false, ...ngDevMode ? [{
    debugName: "customRangeDirection"
  }] : []);
  drops = input(...ngDevMode ? [void 0, {
    debugName: "drops"
  }] : []);
  opens = input(...ngDevMode ? [void 0, {
    debugName: "opens"
  }] : []);
  closeOnAutoApply = input(true, ...ngDevMode ? [{
    debugName: "closeOnAutoApply"
  }] : []);
  minDate = input(void 0, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "minDate"
  } : {}), {
    transform: (value) => {
      import_dayjs.default.isDayjs(value) ? this._minDate = value : this._minDate = (0, import_dayjs.default)(value);
      return this._minDate;
    }
  }));
  maxDate = input(void 0, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "maxDate"
  } : {}), {
    transform: (value) => {
      import_dayjs.default.isDayjs(value) ? this._maxDate = value : this._maxDate = (0, import_dayjs.default)(value);
      return this._maxDate;
    }
  }));
  locale = model({}, ...ngDevMode ? [{
    debugName: "locale"
  }] : []);
  _locale = computed(() => this.locale() !== null ? __spreadValues(__spreadValues({}, this._localeService.config), this.locale()) : {}, ...ngDevMode ? [{
    debugName: "_locale"
  }] : []);
  ranges = input({}, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "ranges"
  } : {}), {
    // custom ranges
    transform: (value) => {
      this._ranges = value;
      this.renderRanges();
      return this._ranges;
    }
  }));
  isInvalidDate = input(() => false, ...ngDevMode ? [{
    debugName: "isInvalidDate"
  }] : []);
  isCustomDate = input(() => false, ...ngDevMode ? [{
    debugName: "isCustomDate"
  }] : []);
  isTooltipDate = input(() => null, ...ngDevMode ? [{
    debugName: "isTooltipDate"
  }] : []);
  isShown = signal(false, ...ngDevMode ? [{
    debugName: "isShown"
  }] : []);
  pickerContainer = viewChild("pickerContainer", ...ngDevMode ? [{
    debugName: "pickerContainer"
  }] : []);
  chosenDate = output();
  rangeClicked = output();
  datesUpdated = output();
  startDateChanged = output();
  endDateChanged = output();
  cancelClicked = output();
  clearClicked = output();
  constructor() {
    effect(() => {
      this.updateView();
    });
  }
  ngOnInit() {
    this._buildLocale();
    const daysOfWeek = [...this._locale().daysOfWeek];
    this._locale().firstDay = this._locale().firstDay % 7;
    if (this._locale().firstDay !== 0) {
      let iterator = this._locale().firstDay;
      while (iterator > 0) {
        daysOfWeek.push(daysOfWeek.shift());
        iterator--;
      }
    }
    this._locale().daysOfWeek = daysOfWeek;
    if (this.inline) {
      this.applyBtnDisabled.set(true);
      this._old.start = this.startDate()?.clone();
      this._old.end = this.endDate()?.clone();
    }
    const timePicker = this.timePicker();
    if (this.startDate() && timePicker) {
      this.setStartDate(this.startDate());
      this.renderTimePicker(SideEnum.left);
    }
    if (this.endDate() && timePicker) {
      this.setEndDate(this.endDate());
      this.renderTimePicker(SideEnum.right);
    }
    this.updateMonthsInView();
    this.renderCalendar(SideEnum.left);
    this.renderCalendar(SideEnum.right);
    this.renderRanges();
  }
  renderRanges() {
    this.rangesArray = [];
    let start, end;
    if (typeof this.ranges() === "object") {
      for (const range in this.ranges()) {
        if (this.ranges()[range]) {
          if (typeof this.ranges()[range][0] === "string") {
            start = (0, import_dayjs.default)(this.ranges()[range][0], this._locale().format);
          } else {
            start = (0, import_dayjs.default)(this.ranges()[range][0]);
          }
          if (typeof this.ranges()[range][1] === "string") {
            end = (0, import_dayjs.default)(this.ranges()[range][1], this._locale().format);
          } else {
            end = (0, import_dayjs.default)(this.ranges()[range][1]);
          }
          if (this.minDate() && start.isBefore(this.minDate())) {
            start = this.minDate()?.clone();
          }
          let maxDate = this.maxDate();
          const maxSpan = this.maxSpan();
          if (maxSpan && maxDate && start.clone().add(maxSpan).isAfter(maxDate)) {
            maxDate = start.clone().add(maxSpan);
          }
          if (maxDate && end.isAfter(maxDate)) {
            end = maxDate.clone();
          }
          const timePicker = this.timePicker();
          if (this.minDate() && end.isBefore(this.minDate(), timePicker ? "minute" : "day") || maxDate && start.isAfter(maxDate, timePicker ? "minute" : "day")) {
            continue;
          }
          const elem = document.createElement("textarea");
          elem.innerHTML = range;
          const rangeHtml = elem.value;
          this.ranges()[rangeHtml] = [start, end];
        }
      }
      for (const range in this.ranges()) {
        if (this.ranges()[range]) {
          this.rangesArray.push(range);
        }
      }
      if (this.showCustomRangeLabel()) {
        this.rangesArray.push(this._locale().customRangeLabel);
      }
      this.showCalInRanges = !this.rangesArray.length || this.alwaysShowCalendars();
      if (!this.timePicker()) {
        this.startDate.set(this.startDate()?.startOf("day"));
        this.endDate.set(this.endDate()?.endOf("day"));
      }
    }
  }
  renderTimePicker(side) {
    let selected, minDate;
    const maxDate = this.maxDate();
    if (side === SideEnum.left) {
      selected = this.startDate()?.clone();
      minDate = this.minDate();
    } else if (side === SideEnum.right && this.endDate()) {
      selected = this.endDate()?.clone();
      minDate = this.startDate();
    } else if (side === SideEnum.right && !this.endDate()) {
      selected = this._getDateWithTime(this.startDate(), SideEnum.right);
      if (selected.isBefore(this.startDate())) {
        selected = this.startDate()?.clone();
      }
      minDate = this.startDate();
    }
    const start = this.timePicker24Hour() ? this.timePicker24HourInterval()[0] : 1;
    const end = this.timePicker24Hour() ? this.timePicker24HourInterval()[1] : 12;
    this.timepickerVariables[side] = {
      hours: [],
      minutes: [],
      minutesLabel: [],
      seconds: [],
      secondsLabel: [],
      disabledHours: [],
      disabledMinutes: [],
      disabledSeconds: [],
      selectedHour: 0,
      selectedMinute: 0,
      selectedSecond: 0
    };
    for (let i = start; i <= end; i++) {
      let i_in_24 = i;
      if (!this.timePicker24Hour()) {
        i_in_24 = selected.hour() >= 12 ? i === 12 ? 12 : i + 12 : i === 12 ? 0 : i;
      }
      const time = selected.clone().hour(i_in_24);
      let disabled = false;
      if (minDate && time.minute(59).isBefore(minDate)) {
        disabled = true;
      }
      if (maxDate && time.minute(0).isAfter(maxDate)) {
        disabled = true;
      }
      this.timepickerVariables[side].hours.push(i);
      if (i_in_24 === selected.hour() && !disabled) {
        this.timepickerVariables[side].selectedHour = i;
      } else if (disabled) {
        this.timepickerVariables[side].disabledHours.push(i);
      }
    }
    for (let i = 0; i < 60; i += this.timePickerIncrement()) {
      const padded = i < 10 ? "0" + i : i;
      const time = selected.clone().minute(i);
      let disabled = false;
      if (minDate && time.second(59).isBefore(minDate)) {
        disabled = true;
      }
      if (maxDate && time.second(0).isAfter(maxDate)) {
        disabled = true;
      }
      this.timepickerVariables[side].minutes.push(i);
      this.timepickerVariables[side].minutesLabel.push(padded);
      if (selected.minute() === i && !disabled) {
        this.timepickerVariables[side].selectedMinute = i;
      } else if (disabled) {
        this.timepickerVariables[side].disabledMinutes.push(i);
      }
    }
    if (this.timePickerSeconds()) {
      for (let i = 0; i < 60; i++) {
        const padded = i < 10 ? "0" + i : i;
        const time = selected.clone().second(i);
        let disabled = false;
        if (minDate && time.isBefore(minDate)) {
          disabled = true;
        }
        if (maxDate && time.isAfter(maxDate)) {
          disabled = true;
        }
        this.timepickerVariables[side].seconds.push(i);
        this.timepickerVariables[side].secondsLabel.push(padded);
        if (selected.second() === i && !disabled) {
          this.timepickerVariables[side].selectedSecond = i;
        } else if (disabled) {
          this.timepickerVariables[side].disabledSeconds.push(i);
        }
      }
    }
    if (!this.timePicker24Hour()) {
      if (minDate && selected.clone().hour(12).minute(0).second(0).isBefore(minDate)) {
        this.timepickerVariables[side].amDisabled = true;
      }
      if (maxDate && selected.clone().hour(0).minute(0).second(0).isAfter(maxDate)) {
        this.timepickerVariables[side].pmDisabled = true;
      }
      if (selected.hour() >= 12) {
        this.timepickerVariables[side].ampmModel = "PM";
      } else {
        this.timepickerVariables[side].ampmModel = "AM";
      }
    }
    this.timepickerVariables[side].selected = selected;
  }
  renderCalendar(side) {
    const mainCalendar = side === SideEnum.left ? this.leftCalendar : this.rightCalendar;
    const month = mainCalendar.month.month();
    const year = mainCalendar.month.year();
    const hour = mainCalendar.month.hour();
    const minute = mainCalendar.month.minute();
    const second = mainCalendar.month.second();
    const daysInMonth = (0, import_dayjs.default)(new Date(year, month)).daysInMonth();
    const firstDay = (0, import_dayjs.default)(new Date(year, month, 1));
    const lastDay = (0, import_dayjs.default)(new Date(year, month, daysInMonth));
    const lastMonth = (0, import_dayjs.default)(firstDay).subtract(1, "month").month();
    const lastYear = (0, import_dayjs.default)(firstDay).subtract(1, "month").year();
    const daysInLastMonth = (0, import_dayjs.default)(new Date(lastYear, lastMonth)).daysInMonth();
    const dayOfWeek = firstDay.day();
    const calendar = [];
    calendar.firstDay = firstDay;
    calendar.lastDay = lastDay;
    for (let i = 0; i < 6; i++) calendar[i] = [];
    let startDay = daysInLastMonth - dayOfWeek + this._locale().firstDay + 1;
    if (startDay > daysInLastMonth) startDay -= 7;
    if (dayOfWeek === this._locale().firstDay) startDay = daysInLastMonth - 6;
    let curDate = (0, import_dayjs.default)(new Date(lastYear, lastMonth, startDay, 12, minute, second));
    for (let i = 0, col = 0, row = 0; i < 42; i++, col++, curDate = (0, import_dayjs.default)(curDate).add(24, "hour")) {
      if (i > 0 && col % 7 === 0) {
        col = 0;
        row++;
      }
      calendar[row][col] = curDate.clone().hour(hour).minute(minute).second(second);
      curDate = curDate.hour(12);
      if (this.minDate() && calendar[row][col].format("YYYY-MM-DD") === this.minDate()?.format("YYYY-MM-DD") && calendar[row][col].isBefore(this.minDate()) && side === "left") {
        calendar[row][col] = this.minDate()?.clone();
      }
      if (this.maxDate() && calendar[row][col].format("YYYY-MM-DD") === this.maxDate()?.format("YYYY-MM-DD") && calendar[row][col].isAfter(this.maxDate()) && side === "right") {
        calendar[row][col] = this.maxDate()?.clone();
      }
    }
    if (side === SideEnum.left) {
      this.leftCalendar.calendar = calendar;
    } else {
      this.rightCalendar.calendar = calendar;
    }
    let minDate = side === "left" ? this.minDate() : this.startDate();
    let maxDate = this.maxDate();
    const dateLimit = this.dateLimit();
    if (this.endDate() === null && dateLimit) {
      const maxLimit = this.startDate()?.clone().add(dateLimit, "day").endOf("day");
      if (!maxDate || maxLimit?.isBefore(maxDate)) maxDate = maxLimit;
      if (this.customRangeDirection()) {
        minDate = this.minDate();
        const minLimit = this.startDate()?.clone().subtract(dateLimit, "day").endOf("day");
        if (!minDate || minLimit?.isAfter(minDate)) {
          minDate = minLimit;
        }
      }
    }
    this.calendarVariables[side] = {
      month,
      year,
      hour,
      minute,
      second,
      daysInMonth,
      firstDay,
      lastDay,
      lastMonth,
      lastYear,
      daysInLastMonth,
      dayOfWeek,
      // other vars
      calRows: Array.from(Array(6).keys()),
      calCols: Array.from(Array(7).keys()),
      classes: {},
      minDate,
      maxDate,
      calendar
    };
    if (this.showDropdowns()) {
      const currentMonth = calendar[1][1].month();
      const currentYear = calendar[1][1].year();
      const realCurrentYear = (0, import_dayjs.default)().year();
      const maxYear = maxDate && maxDate.year() || realCurrentYear + 5;
      const minYear = minDate && minDate.year() || realCurrentYear - 50;
      const inMinYear = currentYear === minYear;
      const inMaxYear = currentYear === maxYear;
      const years = [];
      for (let y = minYear; y <= maxYear; y++) years.push(y);
      this.calendarVariables[side].dropdowns = {
        currentMonth,
        currentYear,
        maxYear,
        minYear,
        inMinYear,
        inMaxYear,
        monthArrays: Array.from(Array(12).keys()),
        yearArrays: years
      };
    }
    this._buildCells(calendar, side);
  }
  setStartDate(startDate) {
    if (typeof startDate === "string") this.startDate.set((0, import_dayjs.default)(startDate, this._locale().format));
    if (typeof startDate === "object") {
      this.pickingDate = true;
      this.startDate.set((0, import_dayjs.default)(startDate));
    }
    const timePicker = this.timePicker();
    if (!timePicker) {
      this.pickingDate = true;
      this.startDate.set(this.startDate()?.startOf("day"));
    }
    const timePickerIncrement = this.timePickerIncrement();
    if (timePicker && timePickerIncrement) {
      this.startDate.set(this.startDate()?.minute(Math.round(this.startDate().minute() / timePickerIncrement) * timePickerIncrement));
    }
    if (this.minDate() && this.startDate()?.isBefore(this.minDate())) {
      this.startDate.set(this.minDate()?.clone());
      if (timePicker && timePickerIncrement) {
        this.startDate.set(this.startDate()?.minute(Math.round(this.startDate().minute() / timePickerIncrement) * timePickerIncrement));
      }
    }
    if (this.maxDate() && this.startDate()?.isAfter(this.maxDate())) {
      this.startDate.set(this.maxDate()?.clone());
      if (timePicker && timePickerIncrement) {
        this.startDate.set(this.startDate()?.minute(Math.floor(this.startDate().minute() / timePickerIncrement) * timePickerIncrement));
      }
    }
    if (!this.isShown()) {
      this.updateElement();
    }
    this.startDateChanged.emit({
      startDate: this.startDate()
    });
    this.updateMonthsInView();
  }
  setEndDate(endDate) {
    if (typeof endDate === "string") {
      this.endDate.set((0, import_dayjs.default)(endDate, this._locale().format));
    }
    if (typeof endDate === "object") {
      this.pickingDate = false;
      this.endDate.set((0, import_dayjs.default)(endDate));
    }
    const timePicker = this.timePicker();
    if (!timePicker) {
      this.pickingDate = false;
      this.endDate.set(this.endDate()?.add(1, "d").startOf("day").subtract(1, "second"));
    }
    const timePickerIncrement = this.timePickerIncrement();
    if (timePicker && timePickerIncrement) {
      this.endDate()?.minute(Math.round(this.endDate().minute() / timePickerIncrement) * timePickerIncrement);
    }
    if (this.endDate()?.isBefore(this.startDate())) {
      this.endDate.set(this.startDate()?.clone());
    }
    if (this.maxDate() && this.endDate()?.isAfter(this.maxDate())) {
      this.endDate.set(this.maxDate()?.clone());
    }
    const dateLimit = this.dateLimit();
    if (dateLimit && this.startDate()?.clone().add(dateLimit, "day").isBefore(this.endDate())) {
      this.endDate.set(this.startDate().clone().add(dateLimit, "day"));
    }
    if (!this.isShown()) {
    }
    this.endDateChanged.emit({
      endDate: this.endDate()
    });
    this.updateMonthsInView();
  }
  updateView() {
    if (this.timePicker()) {
      this.renderTimePicker(SideEnum.left);
      this.renderTimePicker(SideEnum.right);
    }
    this.updateMonthsInView();
    this.updateCalendars();
  }
  updateMonthsInView() {
    const singleDatePicker = this.singleDatePicker();
    const linkedCalendars = this.linkedCalendars();
    if (this.endDate()) {
      if (!singleDatePicker && this.leftCalendar.month && this.rightCalendar.month && (this.startDate() && this.leftCalendar && this.startDate()?.format("YYYY-MM") === this.leftCalendar.month.format("YYYY-MM") || this.startDate() && this.rightCalendar && this.startDate()?.format("YYYY-MM") === this.rightCalendar.month.format("YYYY-MM")) && (this.endDate()?.format("YYYY-MM") === this.leftCalendar.month.format("YYYY-MM") || this.endDate()?.format("YYYY-MM") === this.rightCalendar.month.format("YYYY-MM"))) {
        return;
      }
      if (this.startDate()) {
        this.leftCalendar.month = this.startDate()?.clone().date(2);
        if (!linkedCalendars && (this.endDate()?.month() !== this.startDate()?.month() || this.endDate()?.year() !== this.startDate()?.year())) {
          this.rightCalendar.month = this.endDate()?.clone().date(2);
        } else {
          this.rightCalendar.month = this.startDate()?.clone().date(2).add(1, "month");
        }
      }
    } else {
      if (this.leftCalendar.month.format("YYYY-MM") !== this.startDate()?.format("YYYY-MM") && this.rightCalendar.month.format("YYYY-MM") !== this.startDate()?.format("YYYY-MM")) {
        this.leftCalendar.month = this.startDate()?.clone().date(2);
        this.rightCalendar.month = this.startDate()?.clone().date(2).add(1, "month");
      }
    }
    if (this.maxDate() && linkedCalendars && !singleDatePicker && this.rightCalendar.month > this.maxDate()) {
      this.rightCalendar.month = this.maxDate()?.clone().date(2);
      this.leftCalendar.month = this.maxDate()?.clone().date(2).subtract(1, "month");
    }
  }
  /**
   *  This is responsible for updating the calendars
   */
  updateCalendars() {
    this.renderCalendar(SideEnum.left);
    this.renderCalendar(SideEnum.right);
    if (this.endDate() === null) {
      return;
    }
    this.calculateChosenLabel();
  }
  updateElement() {
    const format = this._locale().displayFormat ? this._locale().displayFormat : this._locale().format;
    const autoUpdateInput = this.autoUpdateInput();
    if (!this.singleDatePicker() && autoUpdateInput) {
      if (this.startDate() && this.endDate()) {
        if (this.rangesArray.length && this.showRangeLabelOnInput() && this.chosenRange && this._locale().customRangeLabel !== this.chosenRange) {
          this.chosenLabel = this.chosenRange;
        } else {
          this.chosenLabel = this.startDate()?.format(format) + this._locale().separator + this.endDate()?.format(format);
        }
      }
    } else if (autoUpdateInput) {
      this.chosenLabel = this.startDate()?.format(format);
    }
  }
  remove() {
    this.isShown.set(false);
  }
  /**
   * this should calculate the label
   */
  calculateChosenLabel() {
    if (!this._locale() || !this._locale().separator) {
      this._buildLocale();
    }
    let customRange = true;
    let i = 0;
    if (this.rangesArray.length > 0) {
      for (const range in this.ranges()) {
        if (this.ranges()[range]) {
          if (this.timePicker()) {
            const format = this.timePickerSeconds() ? "YYYY-MM-DD HH:mm:ss" : "YYYY-MM-DD HH:mm";
            if (this.startDate()?.format(format) === this.ranges()[range][0].format(format) && this.endDate()?.format(format) === this.ranges()[range][1].format(format)) {
              customRange = false;
              this.chosenRange = this.rangesArray[i];
              break;
            }
          } else {
            if (this.startDate()?.format("YYYY-MM-DD") === this.ranges()[range][0].format("YYYY-MM-DD") && this.endDate()?.format("YYYY-MM-DD") === this.ranges()[range][1].format("YYYY-MM-DD")) {
              customRange = false;
              this.chosenRange = this.rangesArray[i];
              break;
            }
          }
          i++;
        }
      }
      if (customRange) {
        if (this.showCustomRangeLabel()) {
          this.chosenRange = this._locale().customRangeLabel;
        } else {
          this.chosenRange = null;
        }
        this.showCalInRanges = true;
      }
    }
    this.updateElement();
  }
  clickApply(e) {
    if (this.inline) this.applyBtnDisabled.set(true);
    if (!this.singleDatePicker() && this.startDate() && !this.endDate()) {
      this.endDate.set(this._getDateWithTime(this.startDate(), SideEnum.right));
      this.calculateChosenLabel();
    }
    if (this.startDate() && this.endDate()) {
      let date = this.startDate()?.clone();
      while (date?.isBefore(this.endDate())) {
        if (this.isInvalidDate()(date)) {
          this.endDate.set(date.subtract(1, "days"));
          this.calculateChosenLabel();
          break;
        }
        date = date.add(1, "days");
      }
    }
    if (this.chosenLabel) {
      this.chosenDate.emit({
        chosenLabel: this.chosenLabel,
        startDate: this.startDate(),
        endDate: this.endDate()
      });
    }
    this.datesUpdated.emit({
      startDate: this.startDate(),
      endDate: this.endDate(),
      label: this.chosenRange
    });
    if (e || this.closeOnAutoApply() && !e) {
      this.hide();
    }
  }
  clickCancel(e) {
    this.startDate.set(this._old.start);
    this.endDate.set(this._old.end);
    if (this.inline) {
      this.updateView();
    }
    this.cancelClicked.emit();
    this.hide();
    this.clearIncompleteDateSelection();
  }
  /**
   * called when month is changed
   * @param object get month value in $event.target.value / side left or right
   */
  monthChanged(object) {
    const {
      $event,
      side
    } = object;
    const year = this.calendarVariables[side].dropdowns.currentYear;
    const month = parseInt($event.target.value, 10);
    this.monthOrYearChanged(month, year, side);
  }
  /**
   * called when year is changed
   * @param object get year value in $event.target.value / side left or right
   */
  yearChanged(object) {
    const {
      $event,
      side
    } = object;
    const month = this.calendarVariables[side].dropdowns.currentMonth;
    const year = parseInt($event.target.value, 10);
    this.monthOrYearChanged(month, year, side);
  }
  /**
   * called when time is changed
   * @param object time $event / side left or right
   */
  timeChanged(object) {
    const {
      $event,
      side
    } = object;
    let hour = parseInt(this.timepickerVariables[side].selectedHour, 10);
    const minute = parseInt(this.timepickerVariables[side].selectedMinute, 10);
    const second = this.timePickerSeconds() ? parseInt(this.timepickerVariables[side].selectedSecond, 10) : 0;
    if (!this.timePicker24Hour()) {
      const ampm = this.timepickerVariables[side].ampmModel;
      if (ampm === "PM" && hour < 12) {
        hour += 12;
      }
      if (ampm === "AM" && hour === 12) {
        hour = 0;
      }
    }
    if (side === SideEnum.left) {
      let start = this.startDate()?.clone();
      start = start?.hour(hour);
      start = start?.minute(minute);
      start = start?.second(second);
      this.setStartDate(start);
      this.setEndDate(this.endDate()?.clone());
      if (this.singleDatePicker()) {
        this.endDate.set(this.startDate()?.clone());
      } else if (this.endDate() && this.endDate()?.format("YYYY-MM-DD") === start?.format("YYYY-MM-DD") && this.endDate()?.isBefore(start)) {
        this.setEndDate(start?.clone());
      } else if (!this.endDate() && this.timePicker()) {
        const startClone = this._getDateWithTime(start, SideEnum.right);
        if (startClone.isBefore(start)) {
          this.timepickerVariables[SideEnum.right].selectedHour = hour;
          this.timepickerVariables[SideEnum.right].selectedMinute = minute;
          this.timepickerVariables[SideEnum.right].selectedSecond = second;
        }
      }
    } else if (this.endDate()) {
      this.setStartDate(this.startDate()?.clone());
      let end = this.endDate()?.clone();
      end = end?.hour(hour);
      end = end?.minute(minute);
      end = end?.second(second);
      this.setEndDate(end);
    }
    this.updateCalendars();
    this.renderTimePicker(SideEnum.left);
    this.renderTimePicker(SideEnum.right);
    if (this.autoApply()) {
      this.clickApply();
    }
    this.applyBtnDisabled.set(false);
  }
  /**
   *  call when month or year changed
   * @param month month number 0 -11
   * @param year year eg: 1995
   * @param side left or right
   */
  monthOrYearChanged(month, year, side) {
    const isLeft = side === SideEnum.left;
    if (!isLeft) {
      if (year < this.startDate().year() || year === this.startDate().year() && month < this.startDate().month()) {
        month = this.startDate().month();
        year = this.startDate().year();
      }
    }
    if (this.minDate()) {
      if (year < this.minDate().year() || year === this.minDate().year() && month < this.minDate().month()) {
        month = this.minDate().month();
        year = this.minDate().year();
      }
    }
    if (this.maxDate()) {
      if (year > this.maxDate().year() || year === this.maxDate().year() && month > this.maxDate().month()) {
        month = this.maxDate().month();
        year = this.maxDate().year();
      }
    }
    this.calendarVariables[side].dropdowns.currentYear = year;
    this.calendarVariables[side].dropdowns.currentMonth = month;
    if (isLeft) {
      this.leftCalendar.month = this.leftCalendar.month.month(month).year(year);
      if (this.linkedCalendars()) {
        this.rightCalendar.month = this.leftCalendar.month.clone().add(1, "month");
      }
    } else {
      this.rightCalendar.month = this.rightCalendar.month.month(month).year(year);
      if (this.linkedCalendars()) {
        this.leftCalendar.month = this.rightCalendar.month.clone().subtract(1, "month");
      }
    }
    this.updateCalendars();
  }
  /**
   * Click on previous month
   * @param object previous $event / side left or right calendar
   */
  clickPrev(object) {
    const {
      $event,
      side
    } = object;
    if (side === SideEnum.left) {
      this.leftCalendar.month = this.leftCalendar.month.subtract(1, "month");
      if (this.linkedCalendars()) {
        this.rightCalendar.month = this.rightCalendar.month.subtract(1, "month");
      }
    } else {
      this.rightCalendar.month = this.rightCalendar.month.subtract(1, "month");
    }
    this.updateCalendars();
  }
  /**
   * Click on next month
   * @param object next $event / side left or right calendar
   */
  clickNext(object) {
    const {
      $event,
      side
    } = object;
    if (side === SideEnum.left) {
      this.leftCalendar.month = this.leftCalendar.month.add(1, "month");
    } else {
      this.rightCalendar.month = this.rightCalendar.month.add(1, "month");
      if (this.linkedCalendars()) {
        this.leftCalendar.month = this.leftCalendar.month.add(1, "month");
      }
    }
    this.updateCalendars();
  }
  /**
   * When hovering a date
   * @param object get value by $event.target.value / side left or right / row or col position of the current date clicked
   */
  hoverDate(object) {
    const {
      $event,
      side,
      row,
      col
    } = object;
    const leftCalDate = this.calendarVariables.left.calendar[row][col];
    const rightCalDate = this.calendarVariables.right.calendar[row][col];
    if (this.pickingDate) {
      this.nowHoveredDate = side === SideEnum.left ? leftCalDate : rightCalDate;
      this.renderCalendar(SideEnum.left);
      this.renderCalendar(SideEnum.right);
    }
    const tooltip = side === SideEnum.left ? this.tooltiptext[leftCalDate] : this.tooltiptext[rightCalDate];
    if (tooltip.length > 0) {
      $event.target.setAttribute("title", tooltip);
    }
  }
  /**
   * When selecting a date
   * @param object get value by $event.target.value / side left or right / row or col position of the current date clicked
   */
  clickDate(object) {
    const {
      $event,
      side,
      row,
      col
    } = object;
    if ($event.target.tagName === "TD") {
      if (!$event.target.classList.contains("available")) return;
    } else if ($event.target.tagName === "SPAN") {
      if (!$event.target.parentElement.classList.contains("available")) return;
    }
    if (this.rangesArray.length) {
      this.chosenRange = this._locale().customRangeLabel;
    }
    let date = side === SideEnum.left ? this.leftCalendar.calendar[row][col] : this.rightCalendar.calendar[row][col];
    const customRangeDirection = this.customRangeDirection();
    const autoApply = this.autoApply();
    if ((this.endDate() || date.isBefore(this.startDate(), "day") && !customRangeDirection) && !this.lockStartDate()) {
      this.applyBtnDisabled.set(true);
      if (this.timePicker()) {
        date = this._getDateWithTime(date, SideEnum.left);
      }
      this.endDate.set(null);
      this.setStartDate(date.clone());
    } else if (!this.endDate() && date.isBefore(this.startDate()) && !customRangeDirection) {
      this.setEndDate(this.startDate()?.clone());
    } else {
      this.applyBtnDisabled.set(false);
      if (this.timePicker()) {
        date = this._getDateWithTime(date, SideEnum.right);
      }
      if (date.isBefore(this.startDate(), "day") === true && customRangeDirection) {
        this.setEndDate(this.startDate());
        this.setStartDate(date.clone());
      } else {
        this.setEndDate(date.clone());
      }
      if (autoApply) {
        this.calculateChosenLabel();
      }
    }
    if (this.singleDatePicker()) {
      this.applyBtnDisabled.set(false);
      this.setEndDate(this.startDate());
      this.updateElement();
    }
    this.updateView();
    if (autoApply && this.startDate() && this.endDate()) {
      this.clickApply();
    }
    $event.stopPropagation();
  }
  /**
   *  Click on the custom range
   * @param object $event / label
   */
  clickRange(object) {
    const {
      $event,
      label
    } = object;
    this.chosenRange = label;
    if (label === this._locale().customRangeLabel) {
      this.isShown.set(true);
      this.showCalInRanges = true;
      this.applyBtnDisabled.set(true);
    } else {
      const dates = this.ranges()[label];
      this.startDate.set(dates[0].clone());
      this.endDate.set(dates[1].clone());
      if (this.showRangeLabelOnInput() && label !== this._locale().customRangeLabel) {
        this.chosenLabel = label;
      } else {
        this.calculateChosenLabel();
      }
      this.showCalInRanges = !this.rangesArray.length || this.alwaysShowCalendars();
      const timePicker = this.timePicker();
      if (!timePicker) {
        this.startDate.set(this.startDate()?.startOf("day"));
        this.endDate.set(this.endDate()?.endOf("day"));
      }
      const alwaysShowCalendars = this.alwaysShowCalendars();
      if (!alwaysShowCalendars) {
        this.isShown.set(false);
      }
      this.rangeClicked.emit({
        label,
        dates
      });
      if (!this.keepCalendarOpeningWithRange() || this.autoApply()) {
        this.clickApply();
      } else {
        if (!alwaysShowCalendars) {
          return this.clickApply();
        }
        if (this.maxDate() && this.maxDate()?.isSame(dates[0], "month")) {
          this.rightCalendar.month = this.rightCalendar.month.month(dates[0].month());
          this.rightCalendar.month = this.rightCalendar.month.year(dates[0].year());
          this.leftCalendar.month = this.leftCalendar.month.month(dates[0].month() - 1);
          this.leftCalendar.month = this.leftCalendar.month.year(dates[1].year());
        } else {
          this.leftCalendar.month = this.leftCalendar.month.month(dates[0].month());
          this.leftCalendar.month = this.leftCalendar.month.year(dates[0].year());
          const nextMonth = dates[0].clone().add(1, "month");
          this.rightCalendar.month = this.rightCalendar.month.month(nextMonth.month());
          this.rightCalendar.month = this.rightCalendar.month.year(nextMonth.year());
        }
        this.updateCalendars();
        if (timePicker) {
          this.renderTimePicker(SideEnum.left);
          this.renderTimePicker(SideEnum.right);
        }
        this.applyBtnDisabled.set(false);
      }
    }
  }
  show(e) {
    if (this.isShown()) return;
    this._old.start = this.startDate()?.clone();
    this._old.end = this.endDate()?.clone();
    this.isShown.set(true);
    this.applyBtnDisabled.set(true);
    this.updateView();
  }
  hide(e) {
    if (!this.isShown()) return;
    if (!this.endDate()) {
      if (this._old.start) this.startDate.set(this._old.start.clone());
      if (this._old.end) this.endDate.set(this._old.end.clone());
      this.clearIncompleteDateSelection();
    }
    if (!this.startDate()?.isSame(this._old.start) || !this.endDate()?.isSame(this._old.end)) {
    }
    this.updateElement();
    this.isShown.set(false);
    this.applyBtnDisabled.set(true);
  }
  clearIncompleteDateSelection() {
    this.nowHoveredDate = null;
    this.pickingDate = false;
  }
  /**
   * handle click on all element in the component, useful for outside of click
   * @param e event
   */
  handleInternalClick(e) {
    e.stopPropagation();
  }
  /**
   * update the locale options
   * @param locale
   */
  updateLocale(locale) {
    for (const key in locale) {
      if (locale.hasOwnProperty(key)) {
        this._locale()[key] = locale[key];
      }
    }
  }
  /**
   *  clear the daterange picker
   */
  clickClear($event) {
    const start = this.timePicker24HourInterval()[0];
    const end = this.timePicker24HourInterval()[1];
    this.startDate.set(this.timePicker24Hour() && start !== 0 ? (0, import_dayjs.default)().startOf("day").add(start, "hours") : (0, import_dayjs.default)().startOf("day"));
    this.endDate.set(this.timePicker24Hour() && end !== 23 ? (0, import_dayjs.default)().startOf("day").add(end, "hours") : (0, import_dayjs.default)().endOf("day"));
    this.chosenDate.emit({
      chosenLabel: "",
      startDate: null,
      endDate: null
    });
    this.datesUpdated.emit({
      startDate: null,
      endDate: null
    });
    this.clearClicked.emit();
    this.hide();
  }
  /**
   * Find out if the selected range should be disabled if it doesn't
   * fit into minDate and maxDate limitations.
   */
  disableRange(range) {
    if (range === this._locale().customRangeLabel) {
      return false;
    }
    const rangeMarkers = this.ranges()[range];
    const areBothBefore = rangeMarkers.every((date) => {
      if (!this.minDate()) {
        return false;
      }
      return date.isBefore(this.minDate());
    });
    const areBothAfter = rangeMarkers.every((date) => {
      if (!this.maxDate()) {
        return false;
      }
      return date.isAfter(this.maxDate());
    });
    return areBothBefore || areBothAfter;
  }
  /**
   *
   * @param date the date to add time
   * @param side left or right
   */
  _getDateWithTime(date, side) {
    let hour = parseInt(this.timepickerVariables[side].selectedHour, 10);
    if (!this.timePicker24Hour()) {
      const ampm = this.timepickerVariables[side].ampmModel;
      if (ampm === "PM" && hour < 12) hour += 12;
      if (ampm === "AM" && hour === 12) hour = 0;
    }
    const minute = parseInt(this.timepickerVariables[side].selectedMinute, 10);
    const second = this.timePickerSeconds() ? parseInt(this.timepickerVariables[side].selectedSecond, 10) : 0;
    return date.clone().hour(hour).minute(minute).second(second);
  }
  /**
   *  build the locale config
   */
  _buildLocale() {
    if (!this._locale().format) {
      if (this.timePicker()) {
        this._locale().format = import_dayjs.default.localeData().longDateFormat("lll");
      } else {
        this._locale().format = import_dayjs.default.localeData().longDateFormat("L");
      }
    }
  }
  _buildCells(calendar, side) {
    for (let row = 0; row < 6; row++) {
      this.calendarVariables[side].classes[row] = {};
      const rowClasses = [];
      const emptyWeekRowClass = this.emptyWeekRowClass();
      if (emptyWeekRowClass && Array.from(Array(7).keys()).some((i) => calendar[row][i].month() !== this.calendarVariables[side].month)) {
        rowClasses.push(emptyWeekRowClass);
      }
      for (let col = 0; col < 7; col++) {
        const classes = [];
        const emptyWeekColumnClass = this.emptyWeekColumnClass();
        if (emptyWeekColumnClass) {
          if (calendar[row][col].month() !== this.calendarVariables[side].month) {
            classes.push(emptyWeekColumnClass);
          }
        }
        if (calendar[row][col].isSame(/* @__PURE__ */ new Date(), "day")) classes.push("today");
        if (calendar[row][col].isoWeekday() > 5) classes.push("weekend");
        if (calendar[row][col].month() !== calendar[1][1].month()) {
          classes.push("off");
          const lastDayOfPreviousMonthClass = this.lastDayOfPreviousMonthClass();
          if (lastDayOfPreviousMonthClass && (calendar[row][col].month() < calendar[1][1].month() || calendar[1][1].month() === 0) && calendar[row][col].date() === this.calendarVariables[side].daysInLastMonth) {
            classes.push(lastDayOfPreviousMonthClass);
          }
          const firstDayOfNextMonthClass = this.firstDayOfNextMonthClass();
          if (firstDayOfNextMonthClass && (calendar[row][col].month() > calendar[1][1].month() || calendar[row][col].month() === 0) && calendar[row][col].date() === 1) {
            classes.push(firstDayOfNextMonthClass);
          }
        }
        const firstMonthDayClass = this.firstMonthDayClass();
        if (firstMonthDayClass && calendar[row][col].month() === calendar[1][1].month() && calendar[row][col].date() === calendar.firstDay.date()) {
          classes.push(firstMonthDayClass);
        }
        const lastMonthDayClass = this.lastMonthDayClass();
        if (lastMonthDayClass && calendar[row][col].month() === calendar[1][1].month() && calendar[row][col].date() === calendar.lastDay.date()) {
          classes.push(lastMonthDayClass);
        }
        if (this.minDate() && calendar[row][col].isBefore(this.minDate(), "day")) {
          classes.push("off", "disabled");
        }
        if (this.calendarVariables[side].maxDate && calendar[row][col].isAfter(this.calendarVariables[side].maxDate, "day")) {
          classes.push("off", "disabled");
        }
        if (this.isInvalidDate()(calendar[row][col])) {
          classes.push("off", "disabled", "invalid");
        }
        if (this.startDate() && calendar[row][col].format("YYYY-MM-DD") === this.startDate()?.format("YYYY-MM-DD")) {
          classes.push("active", "start-date");
        }
        if (this.endDate() != null && calendar[row][col].format("YYYY-MM-DD") === this.endDate()?.format("YYYY-MM-DD")) {
          classes.push("active", "end-date");
        }
        if ((this.nowHoveredDate != null && this.pickingDate || this.endDate() != null) && calendar[row][col] > this.startDate() && (calendar[row][col] < this.endDate() || calendar[row][col] < this.nowHoveredDate && this.pickingDate) && !classes.find((el) => el === "off")) {
          classes.push("in-range");
        }
        const isCustom = this.isCustomDate()(calendar[row][col]);
        if (isCustom !== false) {
          if (typeof isCustom === "string") {
            classes.push(isCustom);
          } else {
            Array.prototype.push.apply(classes, isCustom);
          }
        }
        const isTooltip = this.isTooltipDate()(calendar[row][col]);
        if (isTooltip) {
          if (typeof isTooltip === "string") {
            this.tooltiptext[calendar[row][col]] = isTooltip;
          } else {
            this.tooltiptext[calendar[row][col]] = "Put the tooltip as the returned value of isTooltipDate";
          }
        } else {
          this.tooltiptext[calendar[row][col]] = "";
        }
        let cname = "", disabled = false;
        for (let i = 0; i < classes.length; i++) {
          cname += classes[i] + " ";
          if (classes[i] === "disabled") {
            disabled = true;
          }
        }
        if (!disabled) {
          cname += "available";
        }
        this.calendarVariables[side].classes[row][col] = cname.replace(/^\s+|\s+$/g, "");
      }
      this.calendarVariables[side].classes[row].classList = rowClasses.join(" ");
    }
  }
  static ɵfac = function NgxDaterangepickerBootstrapComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NgxDaterangepickerBootstrapComponent)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _NgxDaterangepickerBootstrapComponent,
    selectors: [["ngx-daterangepicker-bootstrap"]],
    viewQuery: function NgxDaterangepickerBootstrapComponent_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuerySignal(ctx.pickerContainer, _c2, 5);
      }
      if (rf & 2) {
        ɵɵqueryAdvance();
      }
    },
    hostBindings: function NgxDaterangepickerBootstrapComponent_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("click", function NgxDaterangepickerBootstrapComponent_click_HostBindingHandler($event) {
          return ctx.handleInternalClick($event);
        });
      }
    },
    inputs: {
      startDate: [1, "startDate"],
      endDate: [1, "endDate"],
      dateLimit: [1, "dateLimit"],
      autoApply: [1, "autoApply"],
      singleDatePicker: [1, "singleDatePicker"],
      showDropdowns: [1, "showDropdowns"],
      showWeekNumbers: [1, "showWeekNumbers"],
      showISOWeekNumbers: [1, "showISOWeekNumbers"],
      linkedCalendars: [1, "linkedCalendars"],
      autoUpdateInput: [1, "autoUpdateInput"],
      alwaysShowCalendars: [1, "alwaysShowCalendars"],
      maxSpan: [1, "maxSpan"],
      lockStartDate: [1, "lockStartDate"],
      timePicker: [1, "timePicker"],
      timePicker24Hour: [1, "timePicker24Hour"],
      timePickerIncrement: [1, "timePickerIncrement"],
      timePicker24HourInterval: [1, "timePicker24HourInterval"],
      timePickerSeconds: [1, "timePickerSeconds"],
      showClearButton: [1, "showClearButton"],
      firstMonthDayClass: [1, "firstMonthDayClass"],
      lastMonthDayClass: [1, "lastMonthDayClass"],
      emptyWeekRowClass: [1, "emptyWeekRowClass"],
      emptyWeekColumnClass: [1, "emptyWeekColumnClass"],
      firstDayOfNextMonthClass: [1, "firstDayOfNextMonthClass"],
      lastDayOfPreviousMonthClass: [1, "lastDayOfPreviousMonthClass"],
      showCustomRangeLabel: [1, "showCustomRangeLabel"],
      showCancel: [1, "showCancel"],
      keepCalendarOpeningWithRange: [1, "keepCalendarOpeningWithRange"],
      showRangeLabelOnInput: [1, "showRangeLabelOnInput"],
      customRangeDirection: [1, "customRangeDirection"],
      drops: [1, "drops"],
      opens: [1, "opens"],
      closeOnAutoApply: [1, "closeOnAutoApply"],
      minDate: [1, "minDate"],
      maxDate: [1, "maxDate"],
      locale: [1, "locale"],
      ranges: [1, "ranges"],
      isInvalidDate: [1, "isInvalidDate"],
      isCustomDate: [1, "isCustomDate"],
      isTooltipDate: [1, "isTooltipDate"]
    },
    outputs: {
      startDate: "startDateChange",
      endDate: "endDateChange",
      locale: "localeChange",
      chosenDate: "chosenDate",
      rangeClicked: "rangeClicked",
      datesUpdated: "datesUpdated",
      startDateChanged: "startDateChanged",
      endDateChanged: "endDateChanged",
      cancelClicked: "cancelClicked",
      clearClicked: "clearClicked"
    },
    decls: 6,
    vars: 39,
    consts: [["pickerContainer", ""], [1, "card", "daterangepicker", 3, "ngClass"], [1, "card-body", "p-2"], [3, "rangeEvent", "rangesArray", "chosenRange", "locale", "ranges", "minDate", "maxDate"], [3, "prevEvent", "nextEvent", "monthChangedEvent", "yearChangedEvent", "dateEvent", "hoverDateEvent", "timeChangedEvent", "showCalInRanges", "singleDatePicker", "calendarVariables", "showWeekNumbers", "showISOWeekNumbers", "linkedCalendars", "showDropdowns", "locale", "timePicker", "startDate", "timepickerVariables", "timePickerSeconds", "timePicker24Hour"], [3, "applyEvent", "cancelEvent", "clearEvent", "autoApply", "rangesArray", "showCalInRanges", "singleDatePicker", "chosenLabel", "applyBtnDisabled", "locale", "showCancel", "showClearButton"]],
    template: function NgxDaterangepickerBootstrapComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵelementStart(0, "div", 1, 0)(2, "div", 2)(3, "ranges", 3);
        ɵɵlistener("rangeEvent", function NgxDaterangepickerBootstrapComponent_Template_ranges_rangeEvent_3_listener($event) {
          return ctx.clickRange($event);
        });
        ɵɵelementEnd();
        ɵɵelementStart(4, "calendar", 4);
        ɵɵlistener("prevEvent", function NgxDaterangepickerBootstrapComponent_Template_calendar_prevEvent_4_listener($event) {
          return ctx.clickPrev($event);
        })("nextEvent", function NgxDaterangepickerBootstrapComponent_Template_calendar_nextEvent_4_listener($event) {
          return ctx.clickNext($event);
        })("monthChangedEvent", function NgxDaterangepickerBootstrapComponent_Template_calendar_monthChangedEvent_4_listener($event) {
          return ctx.monthChanged($event);
        })("yearChangedEvent", function NgxDaterangepickerBootstrapComponent_Template_calendar_yearChangedEvent_4_listener($event) {
          return ctx.yearChanged($event);
        })("dateEvent", function NgxDaterangepickerBootstrapComponent_Template_calendar_dateEvent_4_listener($event) {
          return ctx.clickDate($event);
        })("hoverDateEvent", function NgxDaterangepickerBootstrapComponent_Template_calendar_hoverDateEvent_4_listener($event) {
          return ctx.hoverDate($event);
        })("timeChangedEvent", function NgxDaterangepickerBootstrapComponent_Template_calendar_timeChangedEvent_4_listener($event) {
          return ctx.timeChanged($event);
        });
        ɵɵelementEnd()();
        ɵɵelementStart(5, "actions", 5);
        ɵɵlistener("applyEvent", function NgxDaterangepickerBootstrapComponent_Template_actions_applyEvent_5_listener($event) {
          return ctx.clickApply($event);
        })("cancelEvent", function NgxDaterangepickerBootstrapComponent_Template_actions_cancelEvent_5_listener($event) {
          return ctx.clickCancel($event);
        })("clearEvent", function NgxDaterangepickerBootstrapComponent_Template_actions_clearEvent_5_listener($event) {
          return ctx.clickClear($event);
        });
        ɵɵelementEnd()();
      }
      if (rf & 2) {
        ɵɵclassMap(ctx.drops() + " " + ctx.opens());
        ɵɵproperty("ngClass", ɵɵpureFunction7(31, _c3, ctx.rangesArray.length, ctx.isShown() || ctx.inline, !ctx.isShown() && !ctx.inline, !ctx.singleDatePicker() && ctx.showCalInRanges, ctx.inline, ctx._locale().direction === "ltr", ctx._locale().direction === "rtl"));
        ɵɵadvance(3);
        ɵɵproperty("rangesArray", ctx.rangesArray)("chosenRange", ctx.chosenRange)("locale", ctx._locale())("ranges", ctx.ranges())("minDate", ctx.minDate())("maxDate", ctx.maxDate());
        ɵɵadvance();
        ɵɵproperty("showCalInRanges", ctx.showCalInRanges)("singleDatePicker", ctx.singleDatePicker())("calendarVariables", ctx.calendarVariables)("showWeekNumbers", ctx.showWeekNumbers())("showISOWeekNumbers", ctx.showISOWeekNumbers())("linkedCalendars", ctx.linkedCalendars())("showDropdowns", ctx.showDropdowns())("locale", ctx._locale())("timePicker", ctx.timePicker())("startDate", ctx.startDate())("timepickerVariables", ctx.timepickerVariables)("timePickerSeconds", ctx.timePickerSeconds())("timePicker24Hour", ctx.timePicker24Hour());
        ɵɵadvance();
        ɵɵproperty("autoApply", ctx.autoApply())("rangesArray", ctx.rangesArray)("showCalInRanges", ctx.showCalInRanges)("singleDatePicker", ctx.singleDatePicker())("chosenLabel", ctx.chosenLabel)("applyBtnDisabled", ctx.applyBtnDisabled())("locale", ctx._locale())("showCancel", ctx.showCancel())("showClearButton", ctx.showClearButton());
      }
    },
    dependencies: [NgClass, FormsModule, RangesComponent, CalendarComponent, ActionsComponent],
    styles: ['.unwrap.on{display:contents}.unwrap.off{overflow:hidden;height:0;width:0}.daterangepicker{position:absolute;width:auto;z-index:3001;margin-top:6px;margin-bottom:6px;box-shadow:0 2px 4px #00000029,0 2px 8px #0000001f}.daterangepicker:after{top:-6px;border-right:6px solid transparent;border-left:6px solid transparent;border-bottom:6px solid #fff}.daterangepicker.left:before{right:9px}.daterangepicker.left:after{right:10px}.daterangepicker.center:before{left:0;right:0;width:0;margin-left:auto;margin-right:auto}.daterangepicker.center:after{left:0;right:0;width:0;margin-left:auto;margin-right:auto}.daterangepicker.right:before{left:9px}.daterangepicker.right:after{left:10px}.daterangepicker.up{margin-top:-7px}.daterangepicker.up:before{top:initial;bottom:-7px;border-bottom:initial;border-top:7px solid #ccc}.daterangepicker.up:after{top:initial;bottom:-6px;border-bottom:initial;border-top:6px solid #fff}.daterangepicker.single .ranges,.daterangepicker.single .calendar{float:none}.daterangepicker.double{width:auto}.daterangepicker.inline{position:relative;display:inline-grid}.daterangepicker.inline:before{content:none}.daterangepicker.inline:after{content:none}.daterangepicker.shown{transform:scale(1);transform-origin:0 0;-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.daterangepicker.shown .calendar{display:block}.daterangepicker.hidden{transform:scale(0);transform-origin:0 0;cursor:default;-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.daterangepicker.hidden .calendar{display:none}.daterangepicker .label-input{border:1px solid #ccc;border-radius:calc(.5rem - 1px);color:#555;height:30px;line-height:30px;display:block;vertical-align:middle;margin:0 auto 5px;padding:0 0 0 28px;width:100%}.daterangepicker .label-input.active{border:1px solid #08c;border-radius:calc(.5rem - 1px)}.daterangepicker .daterangepicker_input{position:relative;padding:0 30px 0 0}.daterangepicker .daterangepicker_input i,.daterangepicker .daterangepicker_input svg{position:absolute;left:8px;top:8px}.daterangepicker.rtl .label-input{padding-right:28px;padding-left:6px}.daterangepicker.rtl .daterangepicker_input i,.daterangepicker.rtl .daterangepicker_input svg{left:auto;right:8px}.daterangepicker:before,.daterangepicker:after{position:absolute;display:inline-block;border-bottom-color:#0003;content:""}.daterangepicker:before{top:-7px;border-right:7px solid transparent;border-left:7px solid transparent;border-bottom:7px solid #ccc}.daterangepicker:after{top:-6px;border-right:6px solid transparent;border-bottom:6px solid #fff;border-left:6px solid transparent}.daterangepicker.opensright:before{left:9px}.daterangepicker.opensright:after{left:10px}@media(min-width:564px){.daterangepicker{width:auto}.daterangepicker.single .calendar.left{clear:none}.daterangepicker.ltr{direction:ltr;text-align:left}.daterangepicker.ltr .calendar.left{clear:left}.daterangepicker.ltr .calendar.left .calendar-table{border-right:none;border-top-right-radius:0;border-bottom-right-radius:0}.daterangepicker.ltr .calendar.right{margin-left:0}.daterangepicker.ltr .calendar.right .calendar-table{border-left:none;border-top-left-radius:0;border-bottom-left-radius:0}.daterangepicker.ltr .left .daterangepicker_input,.daterangepicker.ltr .right .daterangepicker_input{padding-right:35px}.daterangepicker.ltr .calendar.left .calendar-table{padding-right:12px}.daterangepicker.ltr .ranges,.daterangepicker.ltr .calendar{float:left}.daterangepicker.rtl{direction:rtl;text-align:right}.daterangepicker.rtl .calendar.left{clear:right;margin-left:0}.daterangepicker.rtl .calendar.left .calendar-table{border-left:none;border-top-left-radius:0;border-bottom-left-radius:0}.daterangepicker.rtl .calendar.right{margin-right:0}.daterangepicker.rtl .calendar.right .calendar-table{border-right:none;border-top-right-radius:0;border-bottom-right-radius:0}.daterangepicker.rtl .left .daterangepicker_input,.daterangepicker.rtl .calendar.left .calendar-table{padding-left:12px}.daterangepicker.rtl .ranges,.daterangepicker.rtl .calendar{text-align:right;float:right}}@media(min-width:730px){.daterangepicker .ranges{width:auto}.daterangepicker.ltr .ranges{float:left}.daterangepicker.rtl .ranges{float:right}.daterangepicker .calendar.left{clear:none!important}}\n'],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgxDaterangepickerBootstrapComponent, [{
    type: Component,
    args: [{
      selector: "ngx-daterangepicker-bootstrap",
      imports: [NgClass, FormsModule, RangesComponent, CalendarComponent, ActionsComponent],
      host: {
        "(click)": "handleInternalClick($event)"
      },
      encapsulation: ViewEncapsulation.None,
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<div #pickerContainer\r
     class='card daterangepicker'\r
     [class]="drops() + ' ' + opens()"\r
     [ngClass]="{\r
    'show-ranges': rangesArray.length,\r
    'shown': isShown() || inline,\r
    'hidden': !isShown() && !inline,\r
    'double': !singleDatePicker() && showCalInRanges,\r
    'inline': inline,\r
    'ltr': _locale().direction === 'ltr',\r
    'rtl': this._locale().direction === 'rtl'\r
    }">\r
\r
  <div class="card-body p-2">\r
    <ranges\r
      [rangesArray]="rangesArray"\r
      [chosenRange]="chosenRange"\r
      [locale]="_locale()"\r
      [ranges]="ranges()"\r
      [minDate]="minDate()"\r
      [maxDate]="maxDate()"\r
      (rangeEvent)='clickRange($event)'\r
    />\r
    <calendar\r
      [showCalInRanges]="showCalInRanges"\r
      [singleDatePicker]="singleDatePicker()"\r
      [calendarVariables]="calendarVariables"\r
      [showWeekNumbers]="showWeekNumbers()"\r
      [showISOWeekNumbers]="showISOWeekNumbers()"\r
      [linkedCalendars]="linkedCalendars()"\r
      [showDropdowns]="showDropdowns()"\r
      [locale]="_locale()"\r
      [timePicker]="timePicker()"\r
      [startDate]="startDate()"\r
      [timepickerVariables]="timepickerVariables"\r
      [timePickerSeconds]="timePickerSeconds()"\r
      [timePicker24Hour]="timePicker24Hour()"\r
      (prevEvent)='clickPrev($event)'\r
      (nextEvent)='clickNext($event)'\r
      (monthChangedEvent)='monthChanged($event)'\r
      (yearChangedEvent)='yearChanged($event)'\r
      (dateEvent)='clickDate($event)'\r
      (hoverDateEvent)='hoverDate($event)'\r
      (timeChangedEvent)='timeChanged($event)'\r
    />\r
  </div>\r
  <actions\r
    [autoApply]="autoApply()"\r
    [rangesArray]="rangesArray"\r
    [showCalInRanges]="showCalInRanges"\r
    [singleDatePicker]="singleDatePicker()"\r
    [chosenLabel]="chosenLabel"\r
    [applyBtnDisabled]="applyBtnDisabled()"\r
    [locale]="_locale()"\r
    [showCancel]="showCancel()"\r
    [showClearButton]="showClearButton()"\r
    (applyEvent)='clickApply($event)'\r
    (cancelEvent)='clickCancel($event)'\r
    (clearEvent)='clickClear($event)'\r
  />\r
</div>\r
`,
      styles: ['.unwrap.on{display:contents}.unwrap.off{overflow:hidden;height:0;width:0}.daterangepicker{position:absolute;width:auto;z-index:3001;margin-top:6px;margin-bottom:6px;box-shadow:0 2px 4px #00000029,0 2px 8px #0000001f}.daterangepicker:after{top:-6px;border-right:6px solid transparent;border-left:6px solid transparent;border-bottom:6px solid #fff}.daterangepicker.left:before{right:9px}.daterangepicker.left:after{right:10px}.daterangepicker.center:before{left:0;right:0;width:0;margin-left:auto;margin-right:auto}.daterangepicker.center:after{left:0;right:0;width:0;margin-left:auto;margin-right:auto}.daterangepicker.right:before{left:9px}.daterangepicker.right:after{left:10px}.daterangepicker.up{margin-top:-7px}.daterangepicker.up:before{top:initial;bottom:-7px;border-bottom:initial;border-top:7px solid #ccc}.daterangepicker.up:after{top:initial;bottom:-6px;border-bottom:initial;border-top:6px solid #fff}.daterangepicker.single .ranges,.daterangepicker.single .calendar{float:none}.daterangepicker.double{width:auto}.daterangepicker.inline{position:relative;display:inline-grid}.daterangepicker.inline:before{content:none}.daterangepicker.inline:after{content:none}.daterangepicker.shown{transform:scale(1);transform-origin:0 0;-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.daterangepicker.shown .calendar{display:block}.daterangepicker.hidden{transform:scale(0);transform-origin:0 0;cursor:default;-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.daterangepicker.hidden .calendar{display:none}.daterangepicker .label-input{border:1px solid #ccc;border-radius:calc(.5rem - 1px);color:#555;height:30px;line-height:30px;display:block;vertical-align:middle;margin:0 auto 5px;padding:0 0 0 28px;width:100%}.daterangepicker .label-input.active{border:1px solid #08c;border-radius:calc(.5rem - 1px)}.daterangepicker .daterangepicker_input{position:relative;padding:0 30px 0 0}.daterangepicker .daterangepicker_input i,.daterangepicker .daterangepicker_input svg{position:absolute;left:8px;top:8px}.daterangepicker.rtl .label-input{padding-right:28px;padding-left:6px}.daterangepicker.rtl .daterangepicker_input i,.daterangepicker.rtl .daterangepicker_input svg{left:auto;right:8px}.daterangepicker:before,.daterangepicker:after{position:absolute;display:inline-block;border-bottom-color:#0003;content:""}.daterangepicker:before{top:-7px;border-right:7px solid transparent;border-left:7px solid transparent;border-bottom:7px solid #ccc}.daterangepicker:after{top:-6px;border-right:6px solid transparent;border-bottom:6px solid #fff;border-left:6px solid transparent}.daterangepicker.opensright:before{left:9px}.daterangepicker.opensright:after{left:10px}@media(min-width:564px){.daterangepicker{width:auto}.daterangepicker.single .calendar.left{clear:none}.daterangepicker.ltr{direction:ltr;text-align:left}.daterangepicker.ltr .calendar.left{clear:left}.daterangepicker.ltr .calendar.left .calendar-table{border-right:none;border-top-right-radius:0;border-bottom-right-radius:0}.daterangepicker.ltr .calendar.right{margin-left:0}.daterangepicker.ltr .calendar.right .calendar-table{border-left:none;border-top-left-radius:0;border-bottom-left-radius:0}.daterangepicker.ltr .left .daterangepicker_input,.daterangepicker.ltr .right .daterangepicker_input{padding-right:35px}.daterangepicker.ltr .calendar.left .calendar-table{padding-right:12px}.daterangepicker.ltr .ranges,.daterangepicker.ltr .calendar{float:left}.daterangepicker.rtl{direction:rtl;text-align:right}.daterangepicker.rtl .calendar.left{clear:right;margin-left:0}.daterangepicker.rtl .calendar.left .calendar-table{border-left:none;border-top-left-radius:0;border-bottom-left-radius:0}.daterangepicker.rtl .calendar.right{margin-right:0}.daterangepicker.rtl .calendar.right .calendar-table{border-right:none;border-top-right-radius:0;border-bottom-right-radius:0}.daterangepicker.rtl .left .daterangepicker_input,.daterangepicker.rtl .calendar.left .calendar-table{padding-left:12px}.daterangepicker.rtl .ranges,.daterangepicker.rtl .calendar{text-align:right;float:right}}@media(min-width:730px){.daterangepicker .ranges{width:auto}.daterangepicker.ltr .ranges{float:left}.daterangepicker.rtl .ranges{float:right}.daterangepicker .calendar.left{clear:none!important}}\n']
    }]
  }], () => [], {
    startDate: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "startDate",
        required: false
      }]
    }, {
      type: Output,
      args: ["startDateChange"]
    }],
    endDate: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "endDate",
        required: false
      }]
    }, {
      type: Output,
      args: ["endDateChange"]
    }],
    dateLimit: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "dateLimit",
        required: false
      }]
    }],
    autoApply: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "autoApply",
        required: false
      }]
    }],
    singleDatePicker: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "singleDatePicker",
        required: false
      }]
    }],
    showDropdowns: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "showDropdowns",
        required: false
      }]
    }],
    showWeekNumbers: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "showWeekNumbers",
        required: false
      }]
    }],
    showISOWeekNumbers: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "showISOWeekNumbers",
        required: false
      }]
    }],
    linkedCalendars: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "linkedCalendars",
        required: false
      }]
    }],
    autoUpdateInput: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "autoUpdateInput",
        required: false
      }]
    }],
    alwaysShowCalendars: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "alwaysShowCalendars",
        required: false
      }]
    }],
    maxSpan: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "maxSpan",
        required: false
      }]
    }],
    lockStartDate: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "lockStartDate",
        required: false
      }]
    }],
    timePicker: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "timePicker",
        required: false
      }]
    }],
    timePicker24Hour: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "timePicker24Hour",
        required: false
      }]
    }],
    timePickerIncrement: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "timePickerIncrement",
        required: false
      }]
    }],
    timePicker24HourInterval: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "timePicker24HourInterval",
        required: false
      }]
    }],
    timePickerSeconds: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "timePickerSeconds",
        required: false
      }]
    }],
    showClearButton: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "showClearButton",
        required: false
      }]
    }],
    firstMonthDayClass: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "firstMonthDayClass",
        required: false
      }]
    }],
    lastMonthDayClass: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "lastMonthDayClass",
        required: false
      }]
    }],
    emptyWeekRowClass: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "emptyWeekRowClass",
        required: false
      }]
    }],
    emptyWeekColumnClass: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "emptyWeekColumnClass",
        required: false
      }]
    }],
    firstDayOfNextMonthClass: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "firstDayOfNextMonthClass",
        required: false
      }]
    }],
    lastDayOfPreviousMonthClass: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "lastDayOfPreviousMonthClass",
        required: false
      }]
    }],
    showCustomRangeLabel: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "showCustomRangeLabel",
        required: false
      }]
    }],
    showCancel: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "showCancel",
        required: false
      }]
    }],
    keepCalendarOpeningWithRange: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "keepCalendarOpeningWithRange",
        required: false
      }]
    }],
    showRangeLabelOnInput: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "showRangeLabelOnInput",
        required: false
      }]
    }],
    customRangeDirection: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "customRangeDirection",
        required: false
      }]
    }],
    drops: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "drops",
        required: false
      }]
    }],
    opens: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "opens",
        required: false
      }]
    }],
    closeOnAutoApply: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "closeOnAutoApply",
        required: false
      }]
    }],
    minDate: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "minDate",
        required: false
      }]
    }],
    maxDate: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "maxDate",
        required: false
      }]
    }],
    locale: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "locale",
        required: false
      }]
    }, {
      type: Output,
      args: ["localeChange"]
    }],
    ranges: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "ranges",
        required: false
      }]
    }],
    isInvalidDate: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "isInvalidDate",
        required: false
      }]
    }],
    isCustomDate: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "isCustomDate",
        required: false
      }]
    }],
    isTooltipDate: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "isTooltipDate",
        required: false
      }]
    }],
    pickerContainer: [{
      type: ViewChild,
      args: ["pickerContainer", {
        isSignal: true
      }]
    }],
    chosenDate: [{
      type: Output,
      args: ["chosenDate"]
    }],
    rangeClicked: [{
      type: Output,
      args: ["rangeClicked"]
    }],
    datesUpdated: [{
      type: Output,
      args: ["datesUpdated"]
    }],
    startDateChanged: [{
      type: Output,
      args: ["startDateChanged"]
    }],
    endDateChanged: [{
      type: Output,
      args: ["endDateChanged"]
    }],
    cancelClicked: [{
      type: Output,
      args: ["cancelClicked"]
    }],
    clearClicked: [{
      type: Output,
      args: ["clearClicked"]
    }]
  });
})();
var NgxDaterangepickerBootstrapDirective = class _NgxDaterangepickerBootstrapDirective {
  viewContainerRef = inject(ViewContainerRef);
  injector = inject(Injector);
  applicationRef = inject(ApplicationRef);
  elementRef = inject(ElementRef);
  _renderer = inject(Renderer2);
  _localeService = inject(NgxDaterangepickerLocaleService);
  $event;
  daterangepicker;
  daterangepickerRef;
  daterangepickerElement;
  firstMonthDayClass;
  _onChange = Function.prototype;
  _onTouched = Function.prototype;
  _disabled;
  _value;
  _resizeObserver;
  minDate = input(...ngDevMode ? [void 0, {
    debugName: "minDate"
  }] : []);
  maxDate = input(...ngDevMode ? [void 0, {
    debugName: "maxDate"
  }] : []);
  autoApply = input(false, ...ngDevMode ? [{
    debugName: "autoApply"
  }] : []);
  alwaysShowCalendars = input(false, ...ngDevMode ? [{
    debugName: "alwaysShowCalendars"
  }] : []);
  showCustomRangeLabel = input(...ngDevMode ? [void 0, {
    debugName: "showCustomRangeLabel"
  }] : []);
  linkedCalendars = input(false, ...ngDevMode ? [{
    debugName: "linkedCalendars"
  }] : []);
  dateLimit = input(null, ...ngDevMode ? [{
    debugName: "dateLimit"
  }] : []);
  singleDatePicker = input(false, ...ngDevMode ? [{
    debugName: "singleDatePicker"
  }] : []);
  showWeekNumbers = input(false, ...ngDevMode ? [{
    debugName: "showWeekNumbers"
  }] : []);
  showISOWeekNumbers = input(false, ...ngDevMode ? [{
    debugName: "showISOWeekNumbers"
  }] : []);
  showDropdowns = input(false, ...ngDevMode ? [{
    debugName: "showDropdowns"
  }] : []);
  isInvalidDate = input(...ngDevMode ? [void 0, {
    debugName: "isInvalidDate"
  }] : []);
  isCustomDate = input(...ngDevMode ? [void 0, {
    debugName: "isCustomDate"
  }] : []);
  isTooltipDate = input(...ngDevMode ? [void 0, {
    debugName: "isTooltipDate"
  }] : []);
  showClearButton = input(false, ...ngDevMode ? [{
    debugName: "showClearButton"
  }] : []);
  customRangeDirection = input(false, ...ngDevMode ? [{
    debugName: "customRangeDirection"
  }] : []);
  ranges = input(null, ...ngDevMode ? [{
    debugName: "ranges"
  }] : []);
  opens = model("right", ...ngDevMode ? [{
    debugName: "opens"
  }] : []);
  drops = model("down", ...ngDevMode ? [{
    debugName: "drops"
  }] : []);
  lastMonthDayClass = input(null, ...ngDevMode ? [{
    debugName: "lastMonthDayClass"
  }] : []);
  emptyWeekRowClass = input(null, ...ngDevMode ? [{
    debugName: "emptyWeekRowClass"
  }] : []);
  emptyWeekColumnClass = input(null, ...ngDevMode ? [{
    debugName: "emptyWeekColumnClass"
  }] : []);
  firstDayOfNextMonthClass = input(null, ...ngDevMode ? [{
    debugName: "firstDayOfNextMonthClass"
  }] : []);
  lastDayOfPreviousMonthClass = input(null, ...ngDevMode ? [{
    debugName: "lastDayOfPreviousMonthClass"
  }] : []);
  keepCalendarOpeningWithRange = input(false, ...ngDevMode ? [{
    debugName: "keepCalendarOpeningWithRange"
  }] : []);
  showRangeLabelOnInput = input(false, ...ngDevMode ? [{
    debugName: "showRangeLabelOnInput"
  }] : []);
  showCancel = input(false, ...ngDevMode ? [{
    debugName: "showCancel"
  }] : []);
  lockStartDate = input(false, ...ngDevMode ? [{
    debugName: "lockStartDate"
  }] : []);
  closeOnAutoApply = input(true, ...ngDevMode ? [{
    debugName: "closeOnAutoApply"
  }] : []);
  timePicker = input(false, ...ngDevMode ? [{
    debugName: "timePicker"
  }] : []);
  timePicker24Hour = input(false, ...ngDevMode ? [{
    debugName: "timePicker24Hour"
  }] : []);
  timePickerIncrement = input(1, ...ngDevMode ? [{
    debugName: "timePickerIncrement"
  }] : []);
  timePicker24HourInterval = input([0, 23], ...ngDevMode ? [{
    debugName: "timePicker24HourInterval"
  }] : []);
  timePickerSeconds = input(false, ...ngDevMode ? [{
    debugName: "timePickerSeconds"
  }] : []);
  formlyCustomField = input(false, ...ngDevMode ? [{
    debugName: "formlyCustomField"
  }] : []);
  // if you use ngx-formly and create custom field this library
  startKey = model("startDate", ...ngDevMode ? [{
    debugName: "startKey"
  }] : []);
  endKey = model("endDate", ...ngDevMode ? [{
    debugName: "endKey"
  }] : []);
  locale = model({}, ...ngDevMode ? [{
    debugName: "locale"
  }] : []);
  _startKey = computed(() => this.startKey() !== null ? this.startKey() : "startDate", ...ngDevMode ? [{
    debugName: "_startKey"
  }] : []);
  _endKey = computed(() => this.endKey() !== null ? this.endKey() : "endDate", ...ngDevMode ? [{
    debugName: "_endKey"
  }] : []);
  _locale = computed(() => this.locale() !== null ? __spreadValues(__spreadValues({}, this._localeService.config), this.locale()) : {}, ...ngDevMode ? [{
    debugName: "_locale"
  }] : []);
  change = output();
  rangeClicked = output();
  datesUpdated = output();
  startDateChanged = output();
  endDateChanged = output();
  clearClicked = output();
  get disabled() {
    return this._disabled;
  }
  get value() {
    return this._value || null;
  }
  set value(val) {
    this._value = val;
    this._onChange(val);
  }
  rangeClickedSubs;
  datesUpdatedSubs;
  startDateChangedSubs;
  endDateChangedSubs;
  clearClickedSubs;
  chosenDateSubs;
  constructor() {
    this.viewContainerRef.clear();
    this.daterangepickerRef = this.viewContainerRef.createComponent(NgxDaterangepickerBootstrapComponent, {
      injector: this.injector
    });
    this.daterangepickerElement = this.daterangepickerRef.hostView.rootNodes[0];
    CSS.supports("display", "contents") ? this.daterangepickerElement.classList.add("unwrap", "on") : this.daterangepickerElement.classList.add("unwrap", "off");
    document.body.appendChild(this.daterangepickerElement);
    this.daterangepicker = this.daterangepickerRef.instance;
    this.daterangepicker.inline = false;
    effect(() => {
      this.daterangepicker.updateLocale(this._locale());
    });
  }
  ngOnInit() {
    this.daterangepickerRef?.setInput("autoApply", this.autoApply());
    this.daterangepickerRef?.setInput("alwaysShowCalendars", this.alwaysShowCalendars());
    this.daterangepickerRef?.setInput("showCustomRangeLabel", this.showCustomRangeLabel());
    this.daterangepickerRef?.setInput("linkedCalendars", this.linkedCalendars());
    this.daterangepickerRef?.setInput("dateLimit", this.dateLimit());
    this.daterangepickerRef?.setInput("singleDatePicker", this.singleDatePicker());
    this.daterangepickerRef?.setInput("showWeekNumbers", this.showWeekNumbers());
    this.daterangepickerRef?.setInput("showISOWeekNumbers", this.showISOWeekNumbers());
    this.daterangepickerRef?.setInput("showDropdowns", this.showDropdowns());
    this.daterangepickerRef?.setInput("showClearButton", this.showClearButton());
    this.daterangepickerRef?.setInput("customRangeDirection", this.customRangeDirection());
    this.daterangepickerRef?.setInput("locale", this.locale());
    this.daterangepickerRef?.setInput("ranges", this.ranges());
    this.daterangepickerRef?.setInput("opens", this.opens());
    this.daterangepickerRef?.setInput("drops", this.drops());
    this.daterangepickerRef?.setInput("lastMonthDayClass", this.lastMonthDayClass());
    this.daterangepickerRef?.setInput("emptyWeekRowClass", this.emptyWeekRowClass());
    this.daterangepickerRef?.setInput("emptyWeekColumnClass", this.emptyWeekColumnClass());
    this.daterangepickerRef?.setInput("firstDayOfNextMonthClass", this.firstDayOfNextMonthClass());
    this.daterangepickerRef?.setInput("lastDayOfPreviousMonthClass", this.lastDayOfPreviousMonthClass());
    this.daterangepickerRef?.setInput("keepCalendarOpeningWithRange", this.keepCalendarOpeningWithRange());
    this.daterangepickerRef?.setInput("showRangeLabelOnInput", this.showRangeLabelOnInput());
    this.daterangepickerRef?.setInput("showCancel", this.showCancel());
    this.daterangepickerRef?.setInput("lockStartDate", this.lockStartDate());
    this.daterangepickerRef?.setInput("closeOnAutoApply", this.closeOnAutoApply());
    this.daterangepickerRef?.setInput("timePicker", this.timePicker());
    this.daterangepickerRef?.setInput("timePicker24Hour", this.timePicker24Hour());
    this.daterangepickerRef?.setInput("timePicker24HourInterval", this.timePicker24HourInterval());
    this.daterangepickerRef?.setInput("timePickerIncrement", this.timePickerIncrement());
    this.daterangepickerRef?.setInput("timePickerSeconds", this.timePickerSeconds());
    this.daterangepickerRef?.setInput("firstMonthDayClass", this.firstMonthDayClass);
    if (this.minDate() !== void 0) this.daterangepickerRef?.setInput("minDate", this.minDate());
    if (this.maxDate() !== void 0) this.daterangepickerRef?.setInput("maxDate", this.maxDate());
    if (this.isInvalidDate() !== void 0) this.daterangepickerRef?.setInput("isInvalidDate", this.isInvalidDate());
    if (this.isCustomDate() !== void 0) this.daterangepickerRef?.setInput("isCustomDate", this.isCustomDate());
    if (this.isTooltipDate() !== void 0) this.daterangepickerRef?.setInput("isTooltipDate", this.isTooltipDate());
    this.rangeClickedSubs = this.daterangepicker.rangeClicked.subscribe((range) => this.rangeClicked.emit(range));
    this.datesUpdatedSubs = this.daterangepicker.datesUpdated.subscribe((range) => this.datesUpdated.emit(range));
    this.startDateChangedSubs = this.daterangepicker.startDateChanged.subscribe((itemChanged) => this.startDateChanged.emit(itemChanged));
    this.endDateChangedSubs = this.daterangepicker.endDateChanged.subscribe((itemChanged) => this.endDateChanged.emit(itemChanged));
    this.clearClickedSubs = this.daterangepicker.clearClicked.subscribe(() => this.clearClicked.emit());
    this.chosenDateSubs = this.daterangepicker.chosenDate.subscribe((change) => {
      if (change) {
        const value = {};
        value[this._startKey()] = change.startDate;
        value[this._endKey()] = change.endDate;
        this.value = value;
        this.change.emit(value);
        if (typeof change.chosenLabel === "string") {
          this.elementRef.nativeElement.value = change.chosenLabel;
        }
      }
    });
    this.pickerResizeObserver();
  }
  ngOnDestroy() {
    this._resizeObserver?.unobserve(this.daterangepicker.pickerContainer().nativeElement);
    if (this.daterangepickerElement !== null) document.body.removeChild(this.daterangepickerElement);
    this.applicationRef.detachView(this.daterangepickerRef.hostView);
    this.rangeClickedSubs?.unsubscribe();
    this.datesUpdatedSubs?.unsubscribe();
    this.startDateChangedSubs?.unsubscribe();
    this.endDateChangedSubs?.unsubscribe();
    this.clearClickedSubs?.unsubscribe();
    this.chosenDateSubs?.unsubscribe();
    this.daterangepickerRef?.destroy();
  }
  ngAfterViewInit() {
    if (this.formlyCustomField()) this.writeValue(this._locale());
  }
  ngAfterViewChecked() {
    if (this.daterangepicker.isShown()) this.setPosition();
  }
  onWindowResize(event) {
    if (this.daterangepicker.isShown()) this.setPosition();
  }
  open(event) {
    if (this.disabled) return;
    this.daterangepicker.show(event);
    if (this.daterangepicker.isShown()) this.setPosition();
  }
  hide(event) {
    this.daterangepicker.hide(event);
  }
  onBlur() {
    this._onTouched();
  }
  toggle(event) {
    this.daterangepicker.isShown() ? this.hide(event) : this.open(event);
  }
  clear() {
    this.daterangepicker.clickClear();
  }
  writeValue(value) {
    this.setValue(value);
  }
  registerOnChange(fn) {
    this._onChange = fn;
  }
  registerOnTouched(fn) {
    this._onTouched = fn;
  }
  setDisabledState(state) {
    this._disabled = state;
  }
  setValue(val) {
    if (val) {
      this.value = val;
      if (val[this._startKey()]) {
        this.daterangepicker.setStartDate(val[this._startKey()]);
      }
      if (val[this._endKey()]) {
        this.daterangepicker.setEndDate(val[this._endKey()]);
      }
      this.daterangepicker.calculateChosenLabel();
      if (this.daterangepicker.chosenLabel) {
        this.elementRef.nativeElement.value = this.daterangepicker.chosenLabel;
      }
    } else {
      this.daterangepicker.clickClear();
    }
  }
  pickerResizeObserver() {
    this._resizeObserver = new ResizeObserver(() => {
    });
    this._resizeObserver.observe(this.daterangepicker.pickerContainer().nativeElement);
  }
  /**
   * Set position of the calendar, this works as expected only if you add daterangepickerElement to DOM body
   */
  setPosition() {
    const pickerContainer = this.daterangepicker.pickerContainer().nativeElement;
    const inputOffset = this.getOffset(this.elementRef.nativeElement);
    let containerTop;
    let containerBottom;
    if (this.drops() && this.drops() === "down") {
      containerTop = inputOffset.top + inputOffset.height + "px";
      containerBottom = "auto";
    }
    if (this.drops() && this.drops() === "up") {
      containerTop = "auto";
      containerBottom = window.innerHeight - inputOffset.top + "px";
    }
    let style;
    if (this.opens() === "right") {
      style = {
        top: containerTop,
        right: "auto",
        bottom: containerBottom,
        left: inputOffset.left + "px"
      };
    }
    if (this.opens() === "center") {
      style = {
        top: containerTop,
        right: "auto",
        bottom: containerBottom,
        left: inputOffset.left + (inputOffset.width - pickerContainer.offsetWidth) / 2 + "px"
      };
    }
    if (this.opens() === "left") {
      style = {
        top: containerTop,
        right: window.innerWidth - (inputOffset.left + inputOffset.width) + "px",
        bottom: containerBottom,
        left: "auto"
      };
    }
    if (style) {
      this._renderer.setStyle(pickerContainer, "top", style.top);
      this._renderer.setStyle(pickerContainer, "right", style.right);
      this._renderer.setStyle(pickerContainer, "bottom", style.bottom);
      this._renderer.setStyle(pickerContainer, "left", style.left);
    }
  }
  getOffset(element) {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      height: rect.height,
      width: rect.width
    };
  }
  inputChanged(event) {
    if (event.target.tagName.toLowerCase() !== "input") return;
    if (!event.target.value.length) return;
    const dateString = event.target.value.split(this.daterangepicker.locale.separator);
    let start = null, end = null;
    if (dateString.length === 2) {
      start = (0, import_dayjs.default)(dateString[0], this.daterangepicker.locale.format);
      end = (0, import_dayjs.default)(dateString[1], this.daterangepicker.locale.format);
    }
    if (this.singleDatePicker() || start === null || end === null) {
      start = (0, import_dayjs.default)(event.target.value, this.daterangepicker.locale.format);
      end = start;
    }
    if (!start.isValid() || !end.isValid()) return;
    this.daterangepicker.setStartDate(start);
    this.daterangepicker.setEndDate(end);
    this.daterangepicker.updateView();
  }
  /**
   * For click outside the calendar's container
   * @param event event object
   */
  outsideClick(event) {
    if (!event.target || event.target.classList.contains("ngx-daterangepicker-action")) return;
    if (!this.elementRef.nativeElement.contains(event.target)) this.hide();
  }
  static ɵfac = function NgxDaterangepickerBootstrapDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NgxDaterangepickerBootstrapDirective)();
  };
  static ɵdir = ɵɵdefineDirective({
    type: _NgxDaterangepickerBootstrapDirective,
    selectors: [["input", "ngxDaterangepickerBootstrap", ""]],
    hostVars: 1,
    hostBindings: function NgxDaterangepickerBootstrapDirective_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("click", function NgxDaterangepickerBootstrapDirective_click_HostBindingHandler() {
          return ctx.open();
        })("blur", function NgxDaterangepickerBootstrapDirective_blur_HostBindingHandler() {
          return ctx.onBlur();
        })("keyup", function NgxDaterangepickerBootstrapDirective_keyup_HostBindingHandler($event) {
          return ctx.inputChanged($event);
        })("keyup.esc", function NgxDaterangepickerBootstrapDirective_keyup_esc_HostBindingHandler() {
          return ctx.hide();
        })("resize", function NgxDaterangepickerBootstrapDirective_resize_HostBindingHandler($event) {
          return ctx.onWindowResize($event);
        }, ɵɵresolveWindow)("click", function NgxDaterangepickerBootstrapDirective_click_HostBindingHandler($event) {
          return ctx.outsideClick($event);
        }, ɵɵresolveDocument);
      }
      if (rf & 2) {
        ɵɵdomProperty("disabled", ctx.disabled);
      }
    },
    inputs: {
      minDate: [1, "minDate"],
      maxDate: [1, "maxDate"],
      autoApply: [1, "autoApply"],
      alwaysShowCalendars: [1, "alwaysShowCalendars"],
      showCustomRangeLabel: [1, "showCustomRangeLabel"],
      linkedCalendars: [1, "linkedCalendars"],
      dateLimit: [1, "dateLimit"],
      singleDatePicker: [1, "singleDatePicker"],
      showWeekNumbers: [1, "showWeekNumbers"],
      showISOWeekNumbers: [1, "showISOWeekNumbers"],
      showDropdowns: [1, "showDropdowns"],
      isInvalidDate: [1, "isInvalidDate"],
      isCustomDate: [1, "isCustomDate"],
      isTooltipDate: [1, "isTooltipDate"],
      showClearButton: [1, "showClearButton"],
      customRangeDirection: [1, "customRangeDirection"],
      ranges: [1, "ranges"],
      opens: [1, "opens"],
      drops: [1, "drops"],
      lastMonthDayClass: [1, "lastMonthDayClass"],
      emptyWeekRowClass: [1, "emptyWeekRowClass"],
      emptyWeekColumnClass: [1, "emptyWeekColumnClass"],
      firstDayOfNextMonthClass: [1, "firstDayOfNextMonthClass"],
      lastDayOfPreviousMonthClass: [1, "lastDayOfPreviousMonthClass"],
      keepCalendarOpeningWithRange: [1, "keepCalendarOpeningWithRange"],
      showRangeLabelOnInput: [1, "showRangeLabelOnInput"],
      showCancel: [1, "showCancel"],
      lockStartDate: [1, "lockStartDate"],
      closeOnAutoApply: [1, "closeOnAutoApply"],
      timePicker: [1, "timePicker"],
      timePicker24Hour: [1, "timePicker24Hour"],
      timePickerIncrement: [1, "timePickerIncrement"],
      timePicker24HourInterval: [1, "timePicker24HourInterval"],
      timePickerSeconds: [1, "timePickerSeconds"],
      formlyCustomField: [1, "formlyCustomField"],
      startKey: [1, "startKey"],
      endKey: [1, "endKey"],
      locale: [1, "locale"]
    },
    outputs: {
      opens: "opensChange",
      drops: "dropsChange",
      startKey: "startKeyChange",
      endKey: "endKeyChange",
      locale: "localeChange",
      change: "change",
      rangeClicked: "rangeClicked",
      datesUpdated: "datesUpdated",
      startDateChanged: "startDateChanged",
      endDateChanged: "endDateChanged",
      clearClicked: "clearClicked"
    },
    features: [ɵɵProvidersFeature([{
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => _NgxDaterangepickerBootstrapDirective),
      multi: true
    }])]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgxDaterangepickerBootstrapDirective, [{
    type: Directive,
    args: [{
      selector: "input[ngxDaterangepickerBootstrap]",
      host: {
        "[disabled]": "disabled",
        "(click)": "open()",
        "(blur)": "onBlur()",
        "(keyup)": "inputChanged($event)",
        "(keyup.esc)": "hide()",
        "(window:resize)": "onWindowResize($event)",
        "(document:click)": "outsideClick($event)"
      },
      providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => NgxDaterangepickerBootstrapDirective),
        multi: true
      }]
    }]
  }], () => [], {
    minDate: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "minDate",
        required: false
      }]
    }],
    maxDate: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "maxDate",
        required: false
      }]
    }],
    autoApply: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "autoApply",
        required: false
      }]
    }],
    alwaysShowCalendars: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "alwaysShowCalendars",
        required: false
      }]
    }],
    showCustomRangeLabel: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "showCustomRangeLabel",
        required: false
      }]
    }],
    linkedCalendars: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "linkedCalendars",
        required: false
      }]
    }],
    dateLimit: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "dateLimit",
        required: false
      }]
    }],
    singleDatePicker: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "singleDatePicker",
        required: false
      }]
    }],
    showWeekNumbers: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "showWeekNumbers",
        required: false
      }]
    }],
    showISOWeekNumbers: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "showISOWeekNumbers",
        required: false
      }]
    }],
    showDropdowns: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "showDropdowns",
        required: false
      }]
    }],
    isInvalidDate: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "isInvalidDate",
        required: false
      }]
    }],
    isCustomDate: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "isCustomDate",
        required: false
      }]
    }],
    isTooltipDate: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "isTooltipDate",
        required: false
      }]
    }],
    showClearButton: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "showClearButton",
        required: false
      }]
    }],
    customRangeDirection: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "customRangeDirection",
        required: false
      }]
    }],
    ranges: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "ranges",
        required: false
      }]
    }],
    opens: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "opens",
        required: false
      }]
    }, {
      type: Output,
      args: ["opensChange"]
    }],
    drops: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "drops",
        required: false
      }]
    }, {
      type: Output,
      args: ["dropsChange"]
    }],
    lastMonthDayClass: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "lastMonthDayClass",
        required: false
      }]
    }],
    emptyWeekRowClass: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "emptyWeekRowClass",
        required: false
      }]
    }],
    emptyWeekColumnClass: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "emptyWeekColumnClass",
        required: false
      }]
    }],
    firstDayOfNextMonthClass: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "firstDayOfNextMonthClass",
        required: false
      }]
    }],
    lastDayOfPreviousMonthClass: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "lastDayOfPreviousMonthClass",
        required: false
      }]
    }],
    keepCalendarOpeningWithRange: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "keepCalendarOpeningWithRange",
        required: false
      }]
    }],
    showRangeLabelOnInput: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "showRangeLabelOnInput",
        required: false
      }]
    }],
    showCancel: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "showCancel",
        required: false
      }]
    }],
    lockStartDate: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "lockStartDate",
        required: false
      }]
    }],
    closeOnAutoApply: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "closeOnAutoApply",
        required: false
      }]
    }],
    timePicker: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "timePicker",
        required: false
      }]
    }],
    timePicker24Hour: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "timePicker24Hour",
        required: false
      }]
    }],
    timePickerIncrement: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "timePickerIncrement",
        required: false
      }]
    }],
    timePicker24HourInterval: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "timePicker24HourInterval",
        required: false
      }]
    }],
    timePickerSeconds: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "timePickerSeconds",
        required: false
      }]
    }],
    formlyCustomField: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "formlyCustomField",
        required: false
      }]
    }],
    startKey: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "startKey",
        required: false
      }]
    }, {
      type: Output,
      args: ["startKeyChange"]
    }],
    endKey: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "endKey",
        required: false
      }]
    }, {
      type: Output,
      args: ["endKeyChange"]
    }],
    locale: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "locale",
        required: false
      }]
    }, {
      type: Output,
      args: ["localeChange"]
    }],
    change: [{
      type: Output,
      args: ["change"]
    }],
    rangeClicked: [{
      type: Output,
      args: ["rangeClicked"]
    }],
    datesUpdated: [{
      type: Output,
      args: ["datesUpdated"]
    }],
    startDateChanged: [{
      type: Output,
      args: ["startDateChanged"]
    }],
    endDateChanged: [{
      type: Output,
      args: ["endDateChanged"]
    }],
    clearClicked: [{
      type: Output,
      args: ["clearClicked"]
    }]
  });
})();
var NgxDaterangepickerBootstrapModule = class _NgxDaterangepickerBootstrapModule {
  static forRoot(config = {}) {
    return {
      ngModule: _NgxDaterangepickerBootstrapModule,
      providers: [{
        provide: LOCALE_CONFIG,
        useValue: config
      }, {
        provide: NgxDaterangepickerLocaleService,
        useClass: NgxDaterangepickerLocaleService,
        deps: [LOCALE_CONFIG]
      }]
    };
  }
  static ɵfac = function NgxDaterangepickerBootstrapModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NgxDaterangepickerBootstrapModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _NgxDaterangepickerBootstrapModule,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxDaterangepickerBootstrapComponent, NgxDaterangepickerBootstrapDirective],
    exports: [NgxDaterangepickerBootstrapComponent, NgxDaterangepickerBootstrapDirective]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxDaterangepickerBootstrapComponent]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgxDaterangepickerBootstrapModule, [{
    type: NgModule,
    args: [{
      declarations: [],
      imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxDaterangepickerBootstrapComponent, NgxDaterangepickerBootstrapDirective],
      exports: [NgxDaterangepickerBootstrapComponent, NgxDaterangepickerBootstrapDirective]
    }]
  }], null, null);
})();
function provideDaterangepickerLocale(config = {}) {
  return makeEnvironmentProviders([{
    provide: LOCALE_CONFIG,
    useValue: config
  }, {
    provide: NgxDaterangepickerLocaleService,
    useClass: NgxDaterangepickerLocaleService,
    deps: [LOCALE_CONFIG]
  }]);
}
export {
  DefaultLocaleConfig,
  LOCALE_CONFIG,
  NgxDaterangepickerBootstrapComponent,
  NgxDaterangepickerBootstrapDirective,
  NgxDaterangepickerBootstrapModule,
  NgxDaterangepickerLocaleService,
  provideDaterangepickerLocale
};
//# sourceMappingURL=ngx-daterangepicker-bootstrap.js.map
