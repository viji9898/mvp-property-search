import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import {
  Button,
  Card,
  Drawer,
  Input,
  Select,
  Space,
  Tag,
  Typography,
  Segmented,
} from "antd";
import { Link } from "react-router-dom";
import { newLaunches as allLaunches } from "../data/newLaunches";

const { Title, Text } = Typography;

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const COLOMBO_CENTER = [79.8612, 6.9271];
const PHOTO_PIN_ZOOM = 12.8;

const uniq = (arr) => Array.from(new Set(arr)).sort();
const fmtLkr = (n) =>
  typeof n === "number" ? `LKR ${n.toLocaleString("en-US")}` : "—";

function toGeoJSON(items) {
  return {
    type: "FeatureCollection",
    features: items.map((p) => ({
      type: "Feature",
      properties: {
        id: p.id,
        slug: p.slug,
        name: p.name,
        area: p.area,
        developer: p.developer || "",
      },
      geometry: {
        type: "Point",
        coordinates: [p.position.lng, p.position.lat],
      },
    })),
  };
}

function matchesRange(value, min, max) {
  if (typeof value !== "number") return false;
  if (typeof min === "number" && value < min) return false;
  if (typeof max === "number" && value > max) return false;
  return true;
}

export default function NewPropertyLaunchPage() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const photoMarkersCleanupRef = useRef(null);

  const [view, setView] = useState("Grid View"); // "Grid View" | "Map View"
  useEffect(() => {
    if (view !== "Map View") return;

    // Mapbox renders at 0px height if initialized while hidden
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });
  }, [view]);

  //   useEffect(() => {
  //     if (view !== "Map View") return;
  //     const map = mapRef.current;
  //     if (!map) return;

  //     // Let the DOM paint the map container first
  //     requestAnimationFrame(() => {
  //       map.resize();
  //     });
  //   }, [view]);
  // Top search (location-style)
  const [q, setQ] = useState("");
  const [qDraft, setQDraft] = useState("");

  // Filters
  const areas = useMemo(
    () => uniq(allLaunches.map((x) => x.area).filter(Boolean)),
    []
  );
  const types = useMemo(
    () => uniq(allLaunches.map((x) => x.propertyType).filter(Boolean)),
    []
  );
  const tenures = useMemo(
    () => uniq(allLaunches.map((x) => x.tenure).filter(Boolean)),
    []
  );
  const completionYears = useMemo(
    () =>
      uniq(
        allLaunches
          .map((x) => x.completionYear || x.expectedCompletionYear)
          .filter(Boolean)
      ),
    []
  );

  const [area, setArea] = useState("All");
  const [propertyType, setPropertyType] = useState("All");
  const [tenure, setTenure] = useState("All");
  const [completionYear, setCompletionYear] = useState("All");

  const [bedroom, setBedroom] = useState("All"); // "All" | 0 | 1 | 2 | 3 | 4
  const [priceBand, setPriceBand] = useState("All"); // "All" | "lt50" | "50to100" | "gt100"

  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    const priceMinMax = (() => {
      if (priceBand === "lt50") return { min: undefined, max: 50000000 };
      if (priceBand === "50to100") return { min: 50000000, max: 100000000 };
      if (priceBand === "gt100") return { min: 100000000, max: undefined };
      return { min: undefined, max: undefined };
    })();

    return allLaunches.filter((p) => {
      const text = `${p.name || ""} ${p.area || ""} ${
        p.address || ""
      }`.toLowerCase();
      const okQ = !query || text.includes(query);

      const okArea = area === "All" ? true : p.area === area;
      const okType =
        propertyType === "All" ? true : (p.propertyType || "") === propertyType;
      const okTenure = tenure === "All" ? true : (p.tenure || "") === tenure;

      const y = p.completionYear || p.expectedCompletionYear;
      const okYear =
        completionYear === "All" ? true : Number(y) === Number(completionYear);

      const okBedroom =
        bedroom === "All"
          ? true
          : Array.isArray(p.bedrooms)
          ? p.bedrooms.includes(Number(bedroom))
          : false;

      const okPrice =
        priceBand === "All"
          ? true
          : matchesRange(p.priceFromLkr, priceMinMax.min, priceMinMax.max);

      return (
        okQ && okArea && okType && okTenure && okYear && okBedroom && okPrice
      );
    });
  }, [q, area, propertyType, tenure, completionYear, bedroom, priceBand]);

  // init map once (only when map view is active)
  useEffect(() => {
    console.log("Map useEffect triggered");
    console.log("Current view:", view);
    console.log("mapContainerRef.current:", mapContainerRef.current);
    console.log("mapRef.current:", mapRef.current);
    console.log(
      "VITE_MAPBOX_TOKEN:",
      import.meta.env.VITE_MAPBOX_TOKEN ? "Available" : "Missing"
    );

    // Only initialize map when map view is active
    if (view !== "Map View") {
      console.log("Map view not active, skipping initialization");
      return;
    }

    if (!mapContainerRef.current) {
      console.log("No map container element found");
      return;
    }
    if (mapRef.current) {
      console.log("Map already exists");
      return;
    }

    console.log("Creating new map...");
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: COLOMBO_CENTER,
      zoom: 11.8,
    });

    console.log("Map created, adding controls...");
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    map.on("load", () => {
      console.log("Map loaded successfully");
      map.addSource("launches", {
        type: "geojson",
        data: toGeoJSON(filtered),
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
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.easeTo({ center: e.lngLat, zoom });
        });
      });

      map.on("click", "launch-unclustered", (e) => {
        const feature = e.features?.[0];
        const id = feature?.properties?.id;
        const p =
          filtered.find((x) => x.id === id) ||
          allLaunches.find((x) => x.id === id);
        if (!p) return;
        setSelected(p);
        setDrawerOpen(true);
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

      syncPhotoMarkers(
        map,
        filtered,
        setSelected,
        setDrawerOpen,
        photoMarkersCleanupRef
      );
      map.on("zoomend", () =>
        syncPhotoMarkers(
          map,
          filtered,
          setSelected,
          setDrawerOpen,
          photoMarkersCleanupRef
        )
      );
      map.on("moveend", () =>
        syncPhotoMarkers(
          map,
          filtered,
          setSelected,
          setDrawerOpen,
          photoMarkersCleanupRef
        )
      );
    });

    return () => {
      photoMarkersCleanupRef.current?.();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // update map data when filters/search change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const update = () => {
      const source = map.getSource("launches");
      if (!source) return;
      source.setData(toGeoJSON(filtered));
      syncPhotoMarkers(
        map,
        filtered,
        setSelected,
        setDrawerOpen,
        photoMarkersCleanupRef
      );
    };

    if (map.loaded()) update();
    else map.once("load", update);
  }, [filtered]);

  const onSearch = () => setQ(qDraft);

  return (
    <div style={{ width: "100vw", minHeight: "100vh", background: "#fff" }}>
      {/* Top search + chips row */}
      <div style={{ padding: 16, borderBottom: "1px solid #f0f0f0" }}>
        <Space orientation="vertical" size={12} style={{ width: "100%" }}>
          <Space
            align="center"
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <Space>
              <Title level={4} style={{ margin: 0 }}>
                New Property Launch
              </Title>
              <Text type="secondary">{filtered.length} pre-selling</Text>
            </Space>
            <Space>
              <Button>
                <Link to="/colombo-map">Colombo Map</Link>
              </Button>
              <Button>
                <Link to="/master-index">Master Index</Link>
              </Button>
            </Space>
          </Space>

          {/* Search bar */}
          <div className="npl-searchbar">
            <Input
              value={qDraft}
              onChange={(e) => setQDraft(e.target.value)}
              onPressEnter={onSearch}
              placeholder="Search location / area / project name"
              size="large"
              style={{ borderRadius: 999 }}
              allowClear
            />
            <Button
              type="primary"
              size="large"
              onClick={onSearch}
              className="npl-searchbtn"
            >
              Search
            </Button>

            <div style={{ marginLeft: "auto" }}>
              <Segmented
                value={view}
                onChange={setView}
                options={["Grid View", "Map View"]}
              />
            </div>
          </div>

          {/* Filter chips row */}
          <Space wrap>
            <Select
              value={area}
              onChange={setArea}
              options={[
                { value: "All", label: "Area" },
                ...areas.map((a) => ({ value: a, label: a })),
              ]}
              className="npl-chip"
            />
            <Select
              value={propertyType}
              onChange={setPropertyType}
              options={[
                { value: "All", label: "Property Type" },
                ...types.map((t) => ({ value: t, label: t })),
              ]}
              className="npl-chip"
            />
            <Select
              value={priceBand}
              onChange={setPriceBand}
              options={[
                { value: "All", label: "Price" },
                { value: "lt50", label: "< LKR 50M" },
                { value: "50to100", label: "LKR 50M – 100M" },
                { value: "gt100", label: "> LKR 100M" },
              ]}
              className="npl-chip"
            />
            <Select
              value={bedroom}
              onChange={setBedroom}
              options={[
                { value: "All", label: "Bedroom" },
                { value: 0, label: "Studio" },
                { value: 1, label: "1" },
                { value: 2, label: "2" },
                { value: 3, label: "3" },
                { value: 4, label: "4+" },
              ]}
              className="npl-chip"
            />
            <Select
              value={completionYear}
              onChange={setCompletionYear}
              options={[
                { value: "All", label: "Completion Year" },
                ...completionYears.map((y) => ({ value: y, label: String(y) })),
              ]}
              className="npl-chip"
            />
            <Select
              value={tenure}
              onChange={setTenure}
              options={[
                { value: "All", label: "Tenure" },
                ...tenures.map((t) => ({ value: t, label: t })),
              ]}
              className="npl-chip"
            />

            <Button
              onClick={() => {
                setQ("");
                setQDraft("");
                setArea("All");
                setPropertyType("All");
                setPriceBand("All");
                setBedroom("All");
                setCompletionYear("All");
                setTenure("All");
              }}
            >
              Reset
            </Button>
          </Space>
        </Space>
      </div>

      {/* Body */}
      {view === "Map View" ? (
        <div
          style={{
            height: "calc(100vh - 170px)", // subtract header/search area height
            position: "relative",
            background: "#f5f5f5",
          }}
        >
          <div
            ref={mapContainerRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              height: "100%",
            }}
          />
          <LaunchDrawer
            open={drawerOpen}
            launch={selected}
            onClose={() => setDrawerOpen(false)}
          />
        </div>
      ) : (
        <div style={{ padding: 16 }}>
          <Title level={3} style={{ marginTop: 0 }}>
            Ready to Buy Projects
          </Title>

          <div className="npl-grid">
            {filtered.map((p) => (
              <NewLaunchCard
                key={p.id}
                launch={p}
                onClick={() => {
                  setSelected(p);
                  setDrawerOpen(true);
                }}
              />
            ))}
          </div>

          <LaunchDrawer
            open={drawerOpen}
            launch={selected}
            onClose={() => setDrawerOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

function NewLaunchCard({ launch, onClick }) {
  const cover = launch.coverImageUrl || launch.gallery?.[0] || "";

  const year = launch.completionYear || launch.expectedCompletionYear;
  const beds = Array.isArray(launch.bedrooms)
    ? launch.bedrooms.join(", ")
    : "—";

  const priceLabel =
    typeof launch.priceFromLkr === "number" &&
    typeof launch.priceToLkr === "number"
      ? `${fmtLkr(launch.priceFromLkr)} – ${fmtLkr(launch.priceToLkr)}`
      : typeof launch.priceFromLkr === "number"
      ? `${fmtLkr(launch.priceFromLkr)}`
      : "—";

  return (
    <Card
      className="npl-card"
      hoverable
      onClick={onClick}
      styles={{ body: { padding: 14 } }}
    >
      <div className="npl-cover">
        {cover ? (
          <img src={cover} alt={launch.name} loading="lazy" />
        ) : (
          <div className="npl-cover-fallback" />
        )}
      </div>

      <div style={{ marginTop: 10 }}>
        <Text strong style={{ fontSize: 16, display: "block" }}>
          {launch.name}
        </Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {launch.area || "—"}
        </Text>

        <div style={{ marginTop: 10 }}>
          <Text style={{ fontWeight: 700 }}>{priceLabel}</Text>
          {typeof launch.priceFromLkr === "number" ? (
            <Tag style={{ marginLeft: 8, borderRadius: 999 }}>
              Starting From
            </Tag>
          ) : null}
        </div>

        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Beds: {beds}
          </Text>
        </div>

        <div
          style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}
        >
          {launch.tenure ? (
            <Tag className="npl-pill">{launch.tenure}</Tag>
          ) : null}
          {launch.propertyType ? (
            <Tag className="npl-pill">{launch.propertyType}</Tag>
          ) : null}
          {year ? <Tag className="npl-pill">Completion: {year}</Tag> : null}
          <Tag color="blue" className="npl-pill">
            Pre-Selling
          </Tag>
        </div>

        <div style={{ marginTop: 10 }}>
          <Button type="link" style={{ padding: 0 }}>
            <Link to={`/new-property-launch/${launch.slug}`}>
              View details →
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function syncPhotoMarkers(map, items, setSelected, setDrawerOpen, cleanupRef) {
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

    el.onclick = () => {
      setSelected(p);
      setDrawerOpen(true);
    };

    const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([p.position.lng, p.position.lat])
      .addTo(map);

    markers.push(marker);
  }

  cleanupRef.current = () => markers.forEach((m) => m.remove());
}

function LaunchDrawer({ open, launch, onClose }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <Drawer
      title={launch ? launch.name : "New Launch"}
      placement={isMobile ? "bottom" : "right"}
      height={isMobile ? "60%" : undefined}
      size={isMobile ? "100%" : 420}
      open={open}
      onClose={onClose}
    >
      {!launch ? (
        <Text type="secondary">Select a project to preview.</Text>
      ) : (
        <Card bordered>
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <Space wrap>
              <Tag color="blue">Pre-Selling</Tag>
              <Tag>{launch.area}</Tag>
              {launch.completionYear || launch.expectedCompletionYear ? (
                <Tag>
                  Completion:{" "}
                  {launch.completionYear || launch.expectedCompletionYear}
                </Tag>
              ) : null}
            </Space>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <MiniStat label="Floors" value={launch.floors ?? "—"} />
              <MiniStat label="Units" value={launch.units ?? "—"} />
            </div>

            <div
              style={{
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid #f0f0f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  overflowX: "auto",
                  scrollSnapType: "x mandatory",
                }}
              >
                {(launch.gallery || []).slice(0, 6).map((url, idx) => (
                  <img
                    key={url + idx}
                    src={url}
                    alt={`${launch.name} ${idx + 1}`}
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

            <Space direction="vertical" style={{ width: "100%" }}>
              <Button type="primary" block>
                <Link to={`/new-property-launch/${launch.slug}`}>
                  View full launch details
                </Link>
              </Button>

              <Button
                block
                onClick={() =>
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(
                      launch.enquiry?.whatsappPrefill ||
                        `Hi, I’m interested in ${launch.name} (pre-sale).`
                    )}`,
                    "_blank"
                  )
                }
              >
                WhatsApp enquiry
              </Button>
            </Space>
          </Space>
        </Card>
      )}
    </Drawer>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={{ padding: 12, border: "1px solid #f0f0f0", borderRadius: 12 }}>
      <Text type="secondary">{label}</Text>
      <div style={{ fontSize: 18, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
