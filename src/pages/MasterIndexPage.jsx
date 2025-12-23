import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Checkbox,
} from "antd";
import { condos } from "../data/condos";

const { Title, Text } = Typography;

const uniq = (arr) => Array.from(new Set(arr)).sort();

export default function MasterIndexPage() {
  const areas = useMemo(() => uniq(condos.map((c) => c.area)), []);
  const developers = useMemo(
    () => uniq(condos.map((c) => c.developer).filter(Boolean)),
    []
  );

  const [q, setQ] = useState("");
  const [area, setArea] = useState("All");
  const [developer, setDeveloper] = useState("All");
  const [status, setStatus] = useState([
    "Completed",
    "Under Construction",
    "Planned",
    "Stalled",
  ]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return condos.filter((c) => {
      const matchesQuery =
        !query ||
        c.name?.toLowerCase().includes(query) ||
        c.area?.toLowerCase().includes(query) ||
        c.address?.toLowerCase().includes(query);

      const matchesArea = area === "All" ? true : c.area === area;
      const matchesDev =
        developer === "All" ? true : (c.developer || "") === developer;
      const matchesStatus = status.includes(c.status);

      return matchesQuery && matchesArea && matchesDev && matchesStatus;
    });
  }, [q, area, developer, status]);

  const columns = [
    {
      title: "Condo",
      dataIndex: "name",
      key: "name",
      render: (_, c) => (
        <Space orientation="vertical" size={0}>
          <Link to={`/condominiums/${c.slug}`} style={{ fontWeight: 600 }}>
            {c.name}
          </Link>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {c.address || "—"}
          </Text>
        </Space>
      ),
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
      fixed: "left",
      width: 320,
    },
    {
      title: "Area",
      dataIndex: "area",
      key: "area",
      filters: areas.map((a) => ({ text: a, value: a })),
      onFilter: (value, record) => record.area === value,
      width: 140,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v) => {
        const color =
          v === "Completed"
            ? "green"
            : v === "Under Construction"
            ? "orange"
            : v === "Stalled"
            ? "red"
            : "blue";

        return <Tag color={color}>{v}</Tag>;
      },

      width: 170,
    },
    {
      title: "Floors",
      dataIndex: "floors",
      key: "floors",
      sorter: (a, b) => (a.floors ?? 0) - (b.floors ?? 0),
      width: 100,
    },
    {
      title: "Units",
      dataIndex: "units",
      key: "units",
      sorter: (a, b) => (a.units ?? 0) - (b.units ?? 0),
      width: 100,
    },
    {
      title: "Unit Mix",
      dataIndex: "unitMix",
      key: "unitMix",
      render: (mix = []) => (
        <Space wrap>
          {mix.slice(0, 4).map((m) => (
            <Tag key={m}>{m}</Tag>
          ))}
        </Space>
      ),
      width: 260,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, c) => (
        <Space>
          <Button size="small">
            <Link to={`/colombo-map?focus=${encodeURIComponent(c.id)}`}>
              View on map
            </Link>
          </Button>
          <Button size="small" type="primary">
            <Link to={`/condominiums/${c.slug}`}>Details</Link>
          </Button>
        </Space>
      ),
      width: 200,
      fixed: "right",
    },
  ];

  return (
    <div style={{ padding: 16, width: "100vw", minHeight: "100vh" }}>
      <Space orientation="vertical" style={{ width: "100%" }} size="middle">
        <Space
          align="center"
          style={{ justifyContent: "space-between", width: "100%" }}
        >
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              Master Index
            </Title>
            <Text type="secondary">{filtered.length} condos</Text>
          </Space>
          <Space>
            <Button>
              <Link to="/colombo-map">← Map</Link>
            </Button>
          </Space>
        </Space>

        {/* Filters */}
        <Space wrap style={{ width: "100%" }}>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name / area / address"
            style={{ width: 280 }}
            allowClear
          />

          <Select
            value={area}
            onChange={setArea}
            style={{ width: 200 }}
            options={[
              { value: "All", label: "All Areas" },
              ...areas.map((a) => ({ value: a, label: a })),
            ]}
          />

          <Select
            value={developer}
            onChange={setDeveloper}
            style={{ width: 220 }}
            options={[
              { value: "All", label: "All Developers" },
              ...developers.map((d) => ({ value: d, label: d })),
            ]}
          />

          <Checkbox.Group
            value={status}
            options={["Completed", "Under Construction", "Planned", "Stalled"]}
            onChange={(vals) => setStatus(vals)}
          />

          <Button
            onClick={() => {
              setQ("");
              setArea("All");
              setDeveloper("All");
              setStatus(["Completed", "Under Construction", "Planned"]);
            }}
          >
            Reset
          </Button>
        </Space>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: 1250 }}
          sticky
        />
      </Space>
    </div>
  );
}
