// Creates the non-WebGL OpenStreetMap page hosted by the Expo WebView.
export const LEAFLET_VERSION = "1.9.4";
export const LEAFLET_BASE_URL = `https://cdn.jsdelivr.net/npm/leaflet@${LEAFLET_VERSION}/dist`;
export const OPENSTREETMAP_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const MAP_ATTRIBUTION = "\u00a9 OpenStreetMap contributors";

export function buildMapHtml(options: { baseUrl?: string } = {}): string {
  const baseUrl = options.baseUrl ?? LEAFLET_BASE_URL;
  const tileUrl = JSON.stringify(OPENSTREETMAP_TILE_URL);
  const attribution = JSON.stringify(MAP_ATTRIBUTION);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
<title>TrafficSense OpenStreetMap</title>
<link rel="stylesheet" href="${baseUrl}/leaflet.css" />
<style>
  html, body, #map { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #F2F3F0; }
  .leaflet-container { font: 12px Inter, system-ui, sans-serif; background: #F2F3F0; }
  body.dark, body.dark #map, body.dark .leaflet-container { background: #121618; }
  body.dark .leaflet-tile-pane { filter: invert(92%) hue-rotate(180deg) brightness(95%) contrast(90%) saturate(75%); }
  .leaflet-control-attribution { display: none !important; }
  .leaflet-control-zoom { display: none !important; }
  .leaflet-accident-pin { background: transparent !important; border: none !important; }
  #status { position: absolute; z-index: 1000; top: 12px; left: 12px; padding: 6px 10px; border-radius: 10px;
    background: rgba(255,255,255,.94); color: #4B555E; font: 600 12px Inter, system-ui, sans-serif; }
  body.dark #status { background: rgba(19,24,26,.94); color: #A9B4B8; }
</style>
</head>
<body>
<div id="map" role="region" aria-label="Interactive OpenStreetMap traffic map"></div>
<div id="status" role="status" aria-live="polite">Loading map…</div>
<script src="${baseUrl}/leaflet.js"></script>
<script>
  (function () {
    function post(type, data) {
      var bridge = window.ReactNativeWebView;
      if (bridge && bridge.postMessage) bridge.postMessage(JSON.stringify(Object.assign({ type: type }, data || {})));
    }
    var tileUrl = ${tileUrl};
    var attribution = ${attribution};
    var status = document.getElementById("status");
    if (!window.L) { post("failed", { reason: "leaflet-library" }); return; }

    var map = L.map("map", { zoomControl: false, attributionControl: false, preferCanvas: true }).setView([12.87, 74.84], 13);
    var segments = L.layerGroup().addTo(map);
    var routes = L.layerGroup().addTo(map);
    var incidents = L.layerGroup().addTo(map);
    var you = L.layerGroup().addTo(map);
    var lastData = null;
    var loadedTile = false;
    var tileErrors = 0;
    var isDark = false;

    var tileLayer = L.tileLayer(tileUrl, { maxZoom: 19, attribution: attribution }).addTo(map);
    tileLayer.on("tileload", function () { loadedTile = true; status.style.display = "none"; });
    tileLayer.on("tileerror", function () {
      tileErrors += 1;
      if (!loadedTile && tileErrors >= 2) status.textContent = "Waiting for OpenStreetMap tiles…";
    });

    function featureCollection(features) { return { type: "FeatureCollection", features: features || [] }; }
    function fitData(data) {
      var coordinates = [];
      [data.segments, data.routes].forEach(function (collection) {
        ((collection && collection.features) || []).forEach(function (feature) {
          (feature.geometry.coordinates || []).forEach(function (point) { coordinates.push([point[1], point[0]]); });
        });
      });
      ((data.incidents && data.incidents.features) || []).forEach(function (feature) {
        var point = feature.geometry.coordinates; coordinates.push([point[1], point[0]]);
      });
      if (data.you && data.you.coordinates) coordinates.push([data.you.coordinates[1], data.you.coordinates[0]]);
      if (coordinates.length) map.fitBounds(coordinates, { padding: [36, 36], maxZoom: 15, animate: false });
    }
    function onFeature(layer, feature, eventName) {
      layer.on("click", function (event) {
        if (event && event.originalEvent) L.DomEvent.stopPropagation(event.originalEvent);
        if (feature.properties && feature.properties.id) post(eventName, { id: feature.properties.id });
      });
    }

    function pinColor(category, dark) {
      var cat = (category || "").toLowerCase();
      if (cat.indexOf("accident") !== -1 || cat.indexOf("closed") !== -1 || cat.indexOf("closure") !== -1) {
        return dark ? "#F7897D" : "#CC3B2E";
      }
      if (cat.indexOf("flood") !== -1 || cat.indexOf("water") !== -1 || cat.indexOf("traffic") !== -1) {
        return dark ? "#F2AA55" : "#D27A12";
      }
      return dark ? "#A9B4B8" : "#4B555E";
    }

    function pinGlyph(category, strokeColor) {
      var cat = (category || "").toLowerCase();
      if (cat.indexOf("flood") !== -1 || cat.indexOf("water") !== -1) {
        return '<path d="M0-27s4.5 4.5 4.5 7.5a4.5 4.5 0 0 1-9 0c0-3 4.5-7.5 4.5-7.5z" fill="' + strokeColor + '"/>';
      }
      if (cat.indexOf("closed") !== -1 || cat.indexOf("closure") !== -1) {
        return '<path d="M-4.5-20h9" stroke="' + strokeColor + '" stroke-width="2.2" stroke-linecap="round"/>';
      }
      if (cat.indexOf("repair") !== -1 || cat.indexOf("work") !== -1) {
        return '<path d="M-2-25h4l3 9h-10z" fill="none" stroke="' + strokeColor + '" stroke-width="1.8" stroke-linejoin="round"/>';
      }
      if (cat.indexOf("traffic") !== -1) {
        return '<rect x="-5" y="-23" width="10" height="6" rx="1.5" fill="none" stroke="' + strokeColor + '" stroke-width="1.8"/>';
      }
      return '<path d="M0-24v5M0-16.5v.5" stroke="' + strokeColor + '" stroke-width="2.2" stroke-linecap="round"/>';
    }

    function setTheme(dark) {
      isDark = !!dark;
      if (isDark) document.body.classList.add("dark");
      else document.body.classList.remove("dark");
    }

    function setData(data) {
      lastData = data;
      if (typeof data.dark === "boolean") setTheme(data.dark);
      segments.clearLayers(); routes.clearLayers(); incidents.clearLayers(); you.clearLayers();
      var casingColor = isDark ? "#0B0F10" : "#FFFFFF";
      var accentColor = isDark ? "#56C7B3" : "#0B6B5F";
      var altColor = isDark ? "#4E595F" : "#A3ACB3";

      L.geoJSON(featureCollection(data.segments && data.segments.features), {
        style: function (feature) { return { color: feature.properties.colour || (isDark ? "#F2AA55" : "#D27A12"), weight: 5, opacity: 0.92 }; }
      }).addTo(segments);

      L.geoJSON(featureCollection(data.routes && data.routes.features), {
        style: function (feature) {
          var sel = feature.properties.selected;
          return { color: casingColor, weight: sel ? 12 : 9, opacity: 0.95 };
        }
      }).addTo(routes);

      L.geoJSON(featureCollection(data.routes && data.routes.features), {
        style: function (feature) {
          var sel = feature.properties.selected;
          return { color: sel ? accentColor : altColor, weight: sel ? 7 : 5, opacity: 0.96 };
        },
        onEachFeature: function (feature, layer) { onFeature(layer, feature, "select-route"); }
      }).addTo(routes);

      L.geoJSON(featureCollection(data.incidents && data.incidents.features), {
        pointToLayer: function (feature, latlng) {
          var selected = !!feature.properties.selected;
          var cleared = !!feature.properties.cleared;
          if (cleared) {
            return L.circleMarker(latlng, {
              radius: selected ? 7 : 5,
              color: casingColor,
              weight: 2,
              fillColor: isDark ? "#8A969C" : "#6B747C",
              fillOpacity: 0.9,
            });
          }
          var onRoute = !!feature.properties.onRoute;
          var category = feature.properties.category || "";
          var fill = pinColor(category, isDark);
          var scale = selected ? 1.3 : 1;
          var w = Math.round(28 * scale);
          var h = Math.round(38 * scale);
          var svg = '<svg width="' + w + '" height="' + h + '" viewBox="-14 -36 28 38" style="overflow:visible">'
            + (selected ? '<ellipse cy="1" rx="6" ry="2" fill="#000000" opacity="0.22"/>' : '')
            + '<path d="M0 0C-3-5-12-11-12-20A12 12 0 1 1 12-20C12-11 3-5 0 0Z" fill="' + fill + '" stroke="' + casingColor + '" stroke-width="2"/>'
            + pinGlyph(category, casingColor)
            + '</svg>';

          var icon = L.divIcon({
            className: "leaflet-accident-pin",
            html: svg,
            iconSize: [w, h],
            iconAnchor: [w / 2, h - 2]
          });
          return L.marker(latlng, { icon: icon, zIndexOffset: selected ? 1000 : (onRoute ? 800 : 500) });
        },
        onEachFeature: function (feature, layer) { onFeature(layer, feature, "select-incident"); }
      }).addTo(incidents);

      if (data.you) {
        L.geoJSON({ type: "Feature", properties: {}, geometry: data.you }, {
          pointToLayer: function (_f, latlng) {
            return L.circleMarker(latlng, { radius: 9, color: casingColor, weight: 3.5, fillColor: accentColor, fillOpacity: 1 });
          }
        }).addTo(you);
      }
      if (data.fit) fitData(data);
    }

    function centerOn(coordinates) {
      if (coordinates && coordinates.length === 2) map.setView([coordinates[1], coordinates[0]], Math.max(map.getZoom(), 14), { animate: true });
    }
    var layerMode = "street";
    function setLayerMode(mode) {
      layerMode = mode === "clean" ? "clean" : "street";
      tileLayer.setUrl(
        layerMode === "clean"
          ? "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
          : tileUrl
      );
    }
    window.trafficMap = {
      setData: setData,
      setTheme: setTheme,
      setLayerMode: setLayerMode,
      centerOn: centerOn,
      fit: function () { if (lastData) fitData(lastData); }
    };
    post("ready");
  })();
</script>
</body>
</html>`;
}
