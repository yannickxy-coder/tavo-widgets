/* iOS Corners (Radius/Border aus Webflow-Styles)
   Quelle (Webflow, Stand 2026-09-19): Reservieren Widget · Embed .ios-corners-js */

document.addEventListener("DOMContentLoaded", () => {
  if (!window.CornerKit) return;

  const ck = new CornerKit();
  const active = new WeakSet();
  const selector = "[data-ios-corners]";

  const num = (v, fallback, min, max) => {
    v = parseFloat(v);
    return Number.isFinite(v)
      ? Math.min(max, Math.max(min, v))
      : fallback;
  };

  const px = value => {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  };

  const apply = el => {
    if (!(el instanceof HTMLElement)) return;

    const style = getComputedStyle(el);

    const radius = px(style.borderTopLeftRadius);
    const borderWidth = px(style.borderTopWidth);
    const borderColor = style.borderTopColor;
    const borderStyle = style.borderTopStyle;

    const smoothing = num(
      el.dataset.iosSmoothing,
      0.6,
      0,
      1
    );

    const config = {
      radius,
      smoothing
    };

    if (
      borderWidth > 0 &&
      borderStyle !== "none" &&
      borderStyle !== "hidden"
    ) {
      config.border = {
        width: borderWidth,
        color: borderColor,
        style: borderStyle
      };
    }

    if (active.has(el)) {
      ck.update(el, config);
    } else {
      ck.apply(el, config);
      active.add(el);
    }
  };

  const scan = root => {
    if (root.matches?.(selector)) apply(root);
    root.querySelectorAll?.(selector).forEach(apply);
  };

  scan(document);

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (
        mutation.type === "attributes" &&
        mutation.target.matches?.(selector)
      ) {
        apply(mutation.target);
      }

      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) scan(node);
      });
    });
  });

  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [
      "class",
      "style",
      "data-ios-corners",
      "data-ios-smoothing"
    ]
  });

  window.addEventListener("resize", () => {
    document.querySelectorAll(selector).forEach(apply);
  });
});
