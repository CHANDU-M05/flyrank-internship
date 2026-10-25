function baseUrl() {
  return process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
}

// The one line a customer pastes into their site. Version is embedded so a
// widget config change (bundle_version bump) naturally busts any cached
// script reference once the customer re-copies it — and the /widget.js
// route itself is still cache-friendly per-version.
function buildEmbedSnippet(widgetId) {
  return `<script src="${baseUrl()}/widget.js?id=${widgetId}" async></script>`;
}

module.exports = { buildEmbedSnippet, baseUrl };
