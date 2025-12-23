import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import {
  Button,
  Card,
  Checkbox,
  Drawer,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import { Link } from "react-router-dom";
import { condos as allCondos } from "../data/condos";

const { Title, Text } = Typography;

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const COLOMBO_CENTER = [79.8612, 6.9271]; // [lng, lat]
const PHOTO_PIN_ZOOM = 13; // switch to photo markers when zoom >= this

function toGeoJSON(condos) {
  return {
    type: "FeatureCollection",
    features: condos.map((c) => ({
      type: "Feature",
      properties: {
        id: c.id,
        slug: c.slug,
        name: c.name,
        area: c.area,
        status: c.status,
        floors: c.floors,
        units: c.units,
      },
      geometry: {
        type: "Point",
        coordinates: [c.position.lng, c.position.lat],
      },
    })),
  };
}

function uniq(arr) {
  return Array.from(new Set(arr)).sort();
}

export default function MapPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filters
  const areas = useMemo(() => uniq(allCondos.map((c) => c.area)), []);
  const [area, setArea] = useState("All");
  const [status, setStatus] = useState([
    "Completed",
    "Under Construction",
    "Planned",
    "Stalled",
  ]);

  const filteredCondos = useMemo(() => {
    return allCondos.filter((c) => {
      const okArea = area === "All" ? true : c.area === area;
      const okStatus = status.includes(c.status);
      return okArea && okStatus;
    });
  }, [area, status]);

  // Map markers (photo pins) lifecycle
  const photoMarkersCleanupRef = useRef(null);

  // Create map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: COLOMBO_CENTER,
      zoom: 12,
    });

    map.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      "top-right"
    );

    // Configure map interactions
    map.scrollZoom.enable();
    map.doubleClickZoom.enable();
    map.dragRotate?.disable();
    map.pitchWithRotate?.disable();

    mapRef.current = map;

    map.on("load", () => {
      // Add clustered source
      map.addSource("condos", {
        type: "geojson",
        data: toGeoJSON(filteredCondos),
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Cluster circles
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "condos",
        filter: ["has", "point_count"],
        paint: {
          "circle-radius": ["step", ["get", "point_count"], 18, 10, 22, 30, 28],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
          "circle-color": "#1677ff",
        },
      });

      // Cluster count label
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "condos",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      // Unclustered points (simple dot; used when zoomed out)
      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "condos",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 7,
          "circle-color": "#ff4d4f",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Click cluster → zoom in
      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        const clusterId = features?.[0]?.properties?.cluster_id;
        if (clusterId == null) return;

        const source = map.getSource("condos");
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.easeTo({ center: e.lngLat, zoom });
        });
      });

      // Click unclustered point → open drawer
      map.on("click", "unclustered-point", (e) => {
        const feature = e.features?.[0];
        const id = feature?.properties?.id;
        if (!id) return;
        const condo =
          filteredCondos.find((c) => c.id === id) ||
          allCondos.find((c) => c.id === id);
        if (!condo) return;
        setSelected(condo);
        setDrawerOpen(true);
      });

      // Cursor styles
      map.on(
        "mouseenter",
        "clusters",
        () => (map.getCanvas().style.cursor = "pointer")
      );
      map.on(
        "mouseleave",
        "clusters",
        () => (map.getCanvas().style.cursor = "")
      );
      map.on(
        "mouseenter",
        "unclustered-point",
        () => (map.getCanvas().style.cursor = "pointer")
      );
      map.on(
        "mouseleave",
        "unclustered-point",
        () => (map.getCanvas().style.cursor = "")
      );

      // Initial photo markers toggle
      syncPhotoMarkers(
        map,
        filteredCondos,
        setSelected,
        setDrawerOpen,
        photoMarkersCleanupRef
      );

      // Track previous zoom level to avoid unnecessary updates
      let lastZoomLevel = map.getZoom();
      let wasAboveThreshold = lastZoomLevel >= PHOTO_PIN_ZOOM;

      const smartSync = () => {
        const currentZoom = map.getZoom();
        const isAboveThreshold = currentZoom >= PHOTO_PIN_ZOOM;

        // Only update if we crossed the threshold or moved significantly when above threshold
        if (
          wasAboveThreshold !== isAboveThreshold ||
          (isAboveThreshold && Math.abs(currentZoom - lastZoomLevel) > 0.5)
        ) {
          syncPhotoMarkers(
            map,
            filteredCondos,
            setSelected,
            setDrawerOpen,
            photoMarkersCleanupRef
          );
          lastZoomLevel = currentZoom;
          wasAboveThreshold = isAboveThreshold;
        }
      };

      // Only update on movement end to avoid lag during interaction
      map.on("zoomend", smartSync);
      map.on("moveend", smartSync);
    });

    return () => {
      photoMarkersCleanupRef.current?.();
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update map source when filters change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource("condos");
    if (!source) return;

    source.setData(toGeoJSON(filteredCondos));
    syncPhotoMarkers(
      map,
      filteredCondos,
      setSelected,
      setDrawerOpen,
      photoMarkersCleanupRef
    );
  }, [filteredCondos]);

  return (
    <div
      style={{ height: "100vh", display: "grid", gridTemplateRows: "auto 1fr" }}
    >
      <div style={{ padding: 12, borderBottom: "1px solid #f0f0f0" }}>
        <Space wrap align="center">
          <Title level={4} style={{ margin: 0 }}>
            Colombo Condos Map
          </Title>

          <Select
            value={area}
            style={{ width: 220 }}
            onChange={setArea}
            options={[
              { value: "All", label: "All Areas" },
              ...areas.map((a) => ({ value: a, label: a })),
            ]}
          />

          <Checkbox.Group
            value={status}
            options={["Completed", "Under Construction", "Planned", "Stalled"]}
            onChange={(vals) => setStatus(vals)}
          />

          <Text type="secondary">{filteredCondos.length} condos</Text>
        </Space>
      </div>

      <div
        ref={mapContainerRef}
        style={{ position: "relative", height: "100%", minHeight: "400px" }}
      />

      <CondoDrawer
        open={drawerOpen}
        condo={selected}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}

function syncPhotoMarkers(map, condos, setSelected, setDrawerOpen, cleanupRef) {
  const zoom = map.getZoom();

  // remove existing photo markers
  cleanupRef.current?.();
  cleanupRef.current = null;

  // Only show photo markers when zoomed in enough
  if (zoom < PHOTO_PIN_ZOOM) return;

  const markers = [];

  for (const c of condos) {
    const el = document.createElement("button");
    el.className = "photo-pin";
    el.type = "button";
    el.title = c.name;
    el.textContent = c.name;

    el.onclick = () => {
      setSelected(c);
      setDrawerOpen(true);
    };

    const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([c.position.lng, c.position.lat])
      .addTo(map);

    markers.push(marker);
  }

  cleanupRef.current = () => markers.forEach((m) => m.remove());
}

function CondoDrawer({ open, condo, onClose }) {
  return (
    <Drawer
      title={condo ? condo.name : "Condo"}
      placement="right"
      size={420}
      open={open}
      onClose={onClose}
    >
      {!condo ? (
        <Text type="secondary">Select a condo pin to preview details.</Text>
      ) : (
        <Card bordered>
          <Space orientation="vertical" style={{ width: "100%" }} size="middle">
            <Space wrap>
              <Tag>{condo.area}</Tag>
              <Tag
                color={
                  condo.status === "Completed"
                    ? "green"
                    : condo.status === "Under Construction"
                    ? "orange"
                    : "blue"
                }
              >
                {condo.status}
              </Tag>
            </Space>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <Stat label="Floors" value={condo.floors ?? "—"} />
              <Stat label="Units" value={condo.units ?? "—"} />
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 6,
              }}
            >
              {(condo.amenities || []).slice(0, 6).map((a) => (
                <Tag key={a}>{a}</Tag>
              ))}
            </div>

            <div
              style={{
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid #f0f0f0",
              }}
            >
              {/* lightweight “carousel” without extra deps */}
              <div
                style={{
                  display: "flex",
                  overflowX: "auto",
                  scrollSnapType: "x mandatory",
                }}
              >
                {(condo.gallery || []).slice(0, 6).map((url, idx) => (
                  <img
                    key={url + idx}
                    src={url}
                    alt={`${condo.name} ${idx + 1}`}
                    style={{
                      width: "100%",
                      height: 220,
                      objectFit: "cover",
                      flex: "0 0 100%",
                      scrollSnapAlign: "start",
                    }}
                    loading="lazy"
                  />
                ))}
              </div>
            </div>

            <Space style={{ width: "100%" }} orientation="vertical">
              <Button type="primary" block>
                <Link to={`/condominiums/${condo.slug}`}>
                  View full details
                </Link>
              </Button>
              <Button
                block
                onClick={() =>
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(
                      `Hi, I’d like info on ${condo.name} (${condo.area}).`
                    )}`,
                    "_blank"
                  )
                }
              >
                WhatsApp specialist
              </Button>
            </Space>
          </Space>
        </Card>
      )}
    </Drawer>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ padding: 12, border: "1px solid #f0f0f0", borderRadius: 12 }}>
      <Text type="secondary">{label}</Text>
      <div style={{ fontSize: 18, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
