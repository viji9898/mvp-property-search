import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const DEFAULT_CENTER = [79.8612, 6.9271]; // Colombo [lng, lat]
const DEFAULT_ZOOM = 11.8;
const PHOTO_PIN_ZOOM = 12.8;

function toGeoJSON(items) {
  return {
    type: "FeatureCollection",
    features: items.map((p) => ({
      type: "Feature",
      properties: {
        id: p.id,
        slug: p.slug,
        name: p.name,
        area: p.area || "",
      },
      geometry: {
        type: "Point",
        coordinates: [p.position.lng, p.position.lat],
      },
    })),
  };
}

export default function NewLaunchMap({
  launches,
  height = "calc(100vh - 170px)",
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  onSelect, // (launch) => void
  focusId, // optional: id to flyTo and open
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const photoMarkersCleanupRef = useRef(null);

  // init map once
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center,
      zoom,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;
    const handleResize = () => map.resize();
    window.addEventListener("resize", handleResize);

    map.on("load", () => {
      map.addSource("launches", {
        type: "geojson",
        data: toGeoJSON(launches),
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 55,
      });

      map.addLayer({
        id: "launch-clusters",
        type: "circle",
        source: "launches",
        filter: ["has", "point_count"],
        paint: {
          "circle-radius": ["step", ["get", "point_count"], 18, 10, 22, 30, 28],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
          "circle-color": "#1677ff",
        },
      });

      map.addLayer({
        id: "launch-cluster-count",
        type: "symbol",
        source: "launches",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
        paint: { "text-color": "#ffffff" },
      });

      map.addLayer({
        id: "launch-unclustered",
        type: "circle",
        source: "launches",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 7,
          "circle-color": "#ff4d4f",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.on("click", "launch-clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["launch-clusters"],
        });
        const clusterId = features?.[0]?.properties?.cluster_id;
        if (clusterId == null) return;

        const source = map.getSource("launches");
        source.getClusterExpansionZoom(clusterId, (err, nextZoom) => {
          if (err) return;
          map.easeTo({ center: e.lngLat, zoom: nextZoom });
        });
      });

      map.on("click", "launch-unclustered", (e) => {
        const feature = e.features?.[0];
        const id = feature?.properties?.id;
        const selected = launches.find((x) => x.id === id);
        if (!selected) return;
        onSelect?.(selected);
      });

      map.on(
        "mouseenter",
        "launch-clusters",
        () => (map.getCanvas().style.cursor = "pointer")
      );
      map.on(
        "mouseleave",
        "launch-clusters",
        () => (map.getCanvas().style.cursor = "")
      );
      map.on(
        "mouseenter",
        "launch-unclustered",
        () => (map.getCanvas().style.cursor = "pointer")
      );
      map.on(
        "mouseleave",
        "launch-unclustered",
        () => (map.getCanvas().style.cursor = "")
      );

      syncPhotoMarkers(map, launches, onSelect, photoMarkersCleanupRef);

      map.on("zoomend", () =>
        syncPhotoMarkers(map, launches, onSelect, photoMarkersCleanupRef)
      );
      map.on("moveend", () =>
        syncPhotoMarkers(map, launches, onSelect, photoMarkersCleanupRef)
      );
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      photoMarkersCleanupRef.current?.();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update source + markers when launches change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const update = () => {
      const source = map.getSource("launches");
      if (!source) return;
      source.setData(toGeoJSON(launches));
      syncPhotoMarkers(map, launches, onSelect, photoMarkersCleanupRef);
    };

    if (map.loaded()) update();
    else map.once("load", update);
  }, [launches, onSelect]);

  // focus a specific launch (optional)
  useEffect(() => {
    if (!focusId) return;
    const map = mapRef.current;
    if (!map) return;

    const launch = launches.find((x) => x.id === focusId);
    if (!launch) return;

    const fly = () => {
      map.flyTo({
        center: [launch.position.lng, launch.position.lat],
        zoom: Math.max(map.getZoom(), 14),
        essential: true,
      });
      onSelect?.(launch);
    };

    if (map.loaded()) fly();
    else map.once("load", fly);
  }, [focusId, launches, onSelect]);

  // parent toggles visibility -> must resize
  const resize = () => {
    const map = mapRef.current;
    if (!map) return;
    requestAnimationFrame(() => map.resize());
  };

  return (
    <div 
      ref={containerRef} 
      style={{ 
        height, 
        width: "100%", 
        position: "relative",
        minHeight: "400px"
      }} 
    />
  );
}

function syncPhotoMarkers(map, items, onSelect, cleanupRef) {
  const zoom = map.getZoom();

  cleanupRef.current?.();
  cleanupRef.current = null;

  if (zoom < PHOTO_PIN_ZOOM) return;

  const markers = [];
  for (const p of items) {
    const el = document.createElement("button");
    el.className = "photo-pin";
    el.type = "button";
    el.title = p.name;

    const img = document.createElement("img");
    img.src = p.pinImageUrl || p.coverImageUrl || p.gallery?.[0] || "";
    img.alt = p.name;
    img.loading = "lazy";
    el.appendChild(img);

    el.onclick = () => onSelect?.(p);

    const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([p.position.lng, p.position.lat])
      .addTo(map);

    markers.push(marker);
  }

  cleanupRef.current = () => markers.forEach((m) => m.remove());
}
