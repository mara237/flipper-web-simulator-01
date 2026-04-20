/**
 * Debug Collector (agent-friendly)
 *
 * Captures:
 * 1) Console logs
 * 2) Network requests (fetch + XHR)
 * 3) User interactions (semantic uiEvents: click/type/submit/nav/scroll/etc.)
 *
 * Data is periodically sent to /logs
 */
(function () {
  "use strict";

  // Prevent double initialization
  if (window.__DEBUG_COLLECTOR__) return;

  // ==========================================================================
  // Configuration
  // ==========================================================================
  const CONFIG = {
    reportEndpoint: "/logs",
    bufferSize: {
      console: 500,
      network: 200,
      ui: 500,
    },
    reportInterval: 2000,
    sensitiveFields: [
      "password",
      "token",
      "secret",
      "key",
      "authorization",
      "cookie",
      "session",
    ],
    maxBodyLength: 10240,
    uiInputMaxLen: 200,
    uiTextMaxLen: 80,
    scrollThrottleMs: 500,
  };

  // ==========================================================================
  // Storage
  // ==========================================================================
  const store = {
    consoleLogs: [],
    networkRequests: [],
    uiEvents: [],
    lastReportTime: Date.now(),
    lastScrollTime: 0,
  };

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  function sanitizeValue(value, depth) {
    if (depth === void 0) depth = 0;
    if (depth > 5) return "[Max Depth]";
    if (value === null) return null;
    if (value === undefined) return undefined;

    if (typeof value === "string") {
      return value.length > 1000 ? value.slice(0, 1000) + "...[truncated]" : value;
    }

    if (typeof value !== "object") return value;

    if (Array.isArray(value)) {
      return value.slice(0, 100).map(function (v) {
        return sanitizeValue(v, depth + 1);
      });
    }

    var sanitized = {};
    for (var k in value) {
      if (Object.prototype.hasOwnProperty.call(value, k)) {
        var isSensitive = CONFIG.sensitiveFields.some(function (f) {
          return k.toLowerCase().indexOf(f) !== -1;
        });
        sanitized[k] = isSensitive ? "[REDACTED]" : sanitizeValue(value[k], depth + 1);
      }
    }
    return sanitized;
  }

  function formatArg(arg) {
    try {
      if (arg instanceof Error) {
        return { type: "Error", message: arg.message, stack: arg.stack };
      }
      if (typeof arg === "object") return sanitizeValue(arg);
      return String(arg);
    } catch (e) {
      return "[Unserializable]";
    }
  }

  function formatArgs(args) {
    var result = [];
    for (var i = 0; i < args.length; i++) result.push(formatArg(args[i]));
    return result;
  }

  function pruneBuffer(buffer, maxSize) {
    if (buffer.length > maxSize) buffer.splice(0, buffer.length - maxSize);
  }

  function tryParseJson(str) {
    if (typeof str !== "string") return str;
    try {
      return JSON.parse(str);
    } catch (e) {
      return str;
    }
  }

  // ==========================================================================
  // UI Event Logging
  // ==========================================================================

  function shouldIgnoreTarget(target) {
    try {
      if (!target || !(target instanceof Element)) return false;
      return !!target.closest(".no-record");
    } catch (e) {
      return false;
    }
  }

  function compactText(s, maxLen) {
    try {
      var t = (s || "").trim().replace(/\s+/g, " ");
      return t.length > maxLen ? t.slice(0, maxLen) + "…" : t;
    } catch (e) {
      return "";
    }
  }

  function elText(el) {
    try {
      var t = el.innerText || el.textContent || "";
      return compactText(t, CONFIG.uiTextMaxLen);
    } catch (e) {
      return "";
    }
  }

  function describeElement(el) {
    if (!el || !(el instanceof Element)) return null;

    var getAttr = function (name) {
      return el.getAttribute(name);
    };

    var tag = el.tagName ? el.tagName.toLowerCase() : null;
    var id = el.id || null;
    var name = getAttr("name") || null;
    var role = getAttr("role") || null;
    var ariaLabel = getAttr("aria-label") || null;

    var dataLoc = getAttr("data-loc") || null;
    var testId =
      getAttr("data-testid") ||
      getAttr("data-test-id") ||
      getAttr("data-test") ||
      null;

    var type = tag === "input" ? (getAttr("type") || "text") : null;
    var href = tag === "a" ? getAttr("href") || null : null;

    var selectorHint = testId
      ? '[data-testid="' + testId + '"]'
      : dataLoc
      ? '[data-loc="' + dataLoc + '"]'
      : id
      ? "#" + id
      : tag || "unknown";

    return {
      tag,
      id,
      name,
      type,
      role,
      ariaLabel,
      testId,
      dataLoc,
      href,
      text: elText(el),
      selectorHint,
    };
  }

  function isSensitiveField(el) {
    if (!el || !(el instanceof Element)) return false;
    var tag = el.tagName ? el.tagName.toLowerCase() : "";
    if (tag !== "input" && tag !== "textarea") return false;

    var type = (el.getAttribute("type") || "").toLowerCase();
    if (type === "password") return true;

    var name = (el.getAttribute("name") || "").toLowerCase();
    var id = (el.id || "").toLowerCase();

    return CONFIG.sensitiveFields.some(function (f) {
      return name.indexOf(f) !== -1 || id.indexOf(f) !== -1;
    });
  }

  function getInputValueSafe(el) {
    if (!el || !(el instanceof Element)) return null;
    var tag = el.tagName ? el.tagName.toLowerCase() : "";
    if (tag !== "input" && tag !== "textarea" && tag !== "select") return null;

    var v = "";
    try {
      v = el.value != null ? String(el.value) : "";
    } catch (e) {
      v = "";
    }

    if (isSensitiveField(el)) return { masked: true, length: v.length };

    return v.length > CONFIG.uiInputMaxLen
      ? v.slice(0, CONFIG.uiInputMaxLen) + "…"
      : v;
  }

  function logUiEvent(kind, payload) {
    store.uiEvents.push({
      timestamp: Date.now(),
      kind,
      url: location.href,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      payload: sanitizeValue(payload),
    });

    pruneBuffer(store.uiEvents, CONFIG.bufferSize.ui);
  }

  function installUiEventListeners() {
    document.addEventListener(
      "click",
      function (e) {
        var t = e.target;
        if (shouldIgnoreTarget(t)) return;
        logUiEvent("click", {
          target: describeElement(t),
          x: e.clientX,
          y: e.clientY,
        });
      },
      true
    );

    document.addEventListener(
      "change",
      function (e) {
        var t = e.target;
        if (shouldIgnoreTarget(t)) return;
        logUiEvent("change", {
          target: describeElement(t),
          value: getInputValueSafe(t),
        });
      },
      true
    );

    document.addEventListener(
      "focusin",
      function (e) {
        var t = e.target;
        if (shouldIgnoreTarget(t)) return;
        logUiEvent("focusin", { target: describeElement(t) });
      },
      true
    );

    document.addEventListener(
      "focusout",
      function (e) {
        var t = e.target;
        if (shouldIgnoreTarget(t)) return;
        logUiEvent("focusout", {
          target: describeElement(t),
          value: getInputValueSafe(t),
        });
      },
      true
    );

    document.addEventListener(
      "keydown",
      function (e) {
        if (e.key !== "Enter" && e.key !== "Escape") return;
        var t = e.target;
        if (shouldIgnoreTarget(t)) return;
        logUiEvent("keydown", { key: e.key, target: describeElement(t) });
      },
      true
    );

    document.addEventListener(
      "submit",
      function (e) {
        var t = e.target;
        if (shouldIgnoreTarget(t)) return;
        logUiEvent("submit", { target: describeElement(t) });
      },
      true
    );

    window.addEventListener(
      "scroll",
      function () {
        var now = Date.now();
        if (now - store.lastScrollTime < CONFIG.scrollThrottleMs) return;
        store.lastScrollTime = now;

        logUiEvent("scroll", {
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          documentHeight: document.documentElement.scrollHeight,
          viewportHeight: window.innerHeight,
        });
      },
      { passive: true }
    );

    function nav(reason) {
      logUiEvent("navigate", { reason });
    }

    history.pushState = (function (orig) {
      return function () {
        orig.apply(this, arguments);
        nav("pushState");
      };
    })(history.pushState);

    history.replaceState = (function (orig) {
      return function () {
        orig.apply(this, arguments);
        nav("replaceState");
      };
    })(history.replaceState);

    window.addEventListener("popstate", function () {
      nav("popstate");
    });

    window.addEventListener("hashchange", function () {
      nav("hashchange");
    });
  }

  // ==========================================================================
  // Console Interception
  // ==========================================================================

  const originalConsole = {
    log: console.log.bind(console),
    debug: console.debug.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };

  ["log", "debug", "info", "warn", "error"].forEach(function (method) {
    console[method] = function () {
      const args = Array.prototype.slice.call(arguments);

      store.consoleLogs.push({
        timestamp: Date.now(),
        level: method.toUpperCase(),
        args: formatArgs(args),
      });

      pruneBuffer(store.consoleLogs, CONFIG.bufferSize.console);
      originalConsole[method].apply(console, args);
    };
  });

  window.addEventListener("error", function (event) {
    store.consoleLogs.push({
      timestamp: Date.now(),
      level: "ERROR",
      args: [
        {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error ? event.error.stack : null,
        },
      ],
    });

    pruneBuffer(store.consoleLogs, CONFIG.bufferSize.console);

    logUiEvent("error", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", function (event) {
    const reason = event.reason;

    store.consoleLogs.push({
      timestamp: Date.now(),
      level: "ERROR",
      args: [
        {
          reason: reason && reason.message ? reason.message : String(reason),
        },
      ],
    });

    pruneBuffer(store.consoleLogs, CONFIG.bufferSize.console);

    logUiEvent("unhandledrejection", {
      reason: reason && reason.message ? reason.message : String(reason),
    });
  });

  // ==========================================================================
  // Fetch Interception
  // ==========================================================================

  const originalFetch = window.fetch.bind(window);

  window.fetch = function (input, init) {
    init = init || {};
    const startTime = Date.now();

    const url =
      typeof input === "string"
        ? input
        : (input && (input.url || input.href)) || "";

    const method =
      init.method || (input && input.method) || "GET";

    if (url.indexOf("/logs") === 0) {
      return originalFetch(input, init);
    }

    const entry = {
      timestamp: startTime,
      type: "fetch",
      method: method.toUpperCase(),
      url,
      request: {
        body: init.body ? sanitizeValue(tryParseJson(init.body)) : null,
      },
      response: null,
      duration: null,
      error: null,
    };

    return originalFetch(input, init)
      .then(function (response) {
        entry.duration = Date.now() - startTime;

        entry.response = {
          status: response.status,
          statusText: response.statusText,
        };

        store.networkRequests.push(entry);
        pruneBuffer(store.networkRequests, CONFIG.bufferSize.network);

        return response;
      })
      .catch(function (error) {
        entry.duration = Date.now() - startTime;
        entry.error = { message: error.message };

        store.networkRequests.push(entry);
        pruneBuffer(store.networkRequests, CONFIG.bufferSize.network);

        logUiEvent("network_error", {
          kind: "fetch",
          method: entry.method,
          url: entry.url,
          message: error.message,
        });

        throw error;
      });
  };

  // ==========================================================================
  // XHR Interception
  // ==========================================================================

  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this._debugData = {
      method: (method || "GET").toUpperCase(),
      url,
      startTime: null,
    };
    return originalXHROpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
    const xhr = this;

    if (xhr._debugData && xhr._debugData.url.indexOf("/logs") !== 0) {
      xhr._debugData.startTime = Date.now();
      xhr._debugData.requestBody = body ? sanitizeValue(tryParseJson(body)) : null;

      xhr.addEventListener("load", function () {
        store.networkRequests.push({
          timestamp: xhr._debugData.startTime,
          type: "xhr",
          method: xhr._debugData.method,
          url: xhr._debugData.url,
          response: {
            status: xhr.status,
            statusText: xhr.statusText,
          },
          duration: Date.now() - xhr._debugData.startTime,
        });

        pruneBuffer(store.networkRequests, CONFIG.bufferSize.network);
      });
    }

    return originalXHRSend.apply(this, arguments);
  };

  // ==========================================================================
  // Reporting
  // ==========================================================================

  function reportLogs() {
    const payload = {
      timestamp: Date.now(),
      consoleLogs: store.consoleLogs.splice(0),
      networkRequests: store.networkRequests.splice(0),
      uiEvents: store.uiEvents.splice(0),
    };

    if (
      !payload.consoleLogs.length &&
      !payload.networkRequests.length &&
      !payload.uiEvents.length
    ) {
      return Promise.resolve();
    }

    return originalFetch(CONFIG.reportEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(function () {
      store.consoleLogs.unshift(...payload.consoleLogs);
      store.networkRequests.unshift(...payload.networkRequests);
      store.uiEvents.unshift(...payload.uiEvents);
    });
  }

  setInterval(reportLogs, CONFIG.reportInterval);

  window.addEventListener("beforeunload", function () {
    const payload = {
      timestamp: Date.now(),
      consoleLogs: store.consoleLogs,
      networkRequests: store.networkRequests,
      uiEvents: store.uiEvents,
    };

    if (navigator.sendBeacon) {
      navigator.sendBeacon(CONFIG.reportEndpoint, JSON.stringify(payload));
    }
  });

  // ==========================================================================
  // Init
  // ==========================================================================

  installUiEventListeners();

  window.__DEBUG_COLLECTOR__ = {
    store,
    forceReport: reportLogs,
  };
})();