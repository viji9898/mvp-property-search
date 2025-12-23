import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Button, Card, Space, Tag, Typography } from "antd";
import { condos } from "../data/condos";

const { Title, Text } = Typography;

export default function CondoPage() {
  const { slug } = useParams();

  const condo = useMemo(() => condos.find((c) => c.slug === slug), [slug]);

  if (!condo) {
    return (
      <div style={{ padding: 24 }}>
        <Title level={4}>Not found</Title>
        <Link to="/colombo-map">Back to map</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <Space>
          <Button>
            <Link to="/colombo-map">← Back to map</Link>
          </Button>
        </Space>

        <Title level={2} style={{ margin: 0 }}>
          {condo.name}
        </Title>
        <Space wrap>
          <Tag>{condo.area}</Tag>
          <Tag>{condo.status}</Tag>
          <Tag>{condo.floors} floors</Tag>
          <Tag>{condo.units} units</Tag>
        </Space>

        <Card title="Gallery">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            {(condo.gallery || []).map((url, idx) => (
              <img
                key={url + idx}
                src={url}
                alt={`${condo.name} ${idx + 1}`}
                style={{
                  width: "100%",
                  height: 180,
                  objectFit: "cover",
                  borderRadius: 12,
                }}
                loading="lazy"
              />
            ))}
          </div>
        </Card>

        <Card title="Overview">
          <Text>{condo.address || "—"}</Text>
        </Card>
      </Space>
    </div>
  );
}
