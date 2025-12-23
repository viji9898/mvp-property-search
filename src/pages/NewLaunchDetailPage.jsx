import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Button, Card, Space, Tag, Typography } from "antd";
import { newLaunches } from "../data/newLaunches";

const { Title, Text } = Typography;

export default function NewLaunchDetailPage() {
  const { slug } = useParams();
  const launch = useMemo(
    () => newLaunches.find((x) => x.slug === slug),
    [slug]
  );

  if (!launch) {
    return (
      <div style={{ padding: 24 }}>
        <Title level={4}>Not found</Title>
        <Link to="/new-property-launch">Back to New Property Launch</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <Space>
          <Button>
            <Link to="/new-property-launch">← Back</Link>
          </Button>
          <Tag color="blue">Pre-Selling</Tag>
          <Tag>{launch.area}</Tag>
          {launch.expectedCompletionYear ? (
            <Tag>ETA {launch.expectedCompletionYear}</Tag>
          ) : null}
        </Space>

        <Title level={2} style={{ margin: 0 }}>
          {launch.name}
        </Title>
        <Text type="secondary">{launch.address}</Text>

        <Card title="Key stats">
          <Space wrap>
            <Tag>{launch.floors ?? "—"} floors</Tag>
            <Tag>{launch.units ?? "—"} units</Tag>
            {(launch.unitMix || []).map((m) => (
              <Tag key={m}>{m}</Tag>
            ))}
          </Space>
        </Card>

        <Card title="Gallery">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            {(launch.gallery || []).map((url, idx) => (
              <img
                key={url + idx}
                src={url}
                alt={`${launch.name} ${idx + 1}`}
                style={{
                  width: "100%",
                  height: 190,
                  objectFit: "cover",
                  borderRadius: 12,
                }}
                loading="lazy"
              />
            ))}
          </div>
        </Card>

        <Card title="Highlights">
          <Space orientation="vertical">
            {(launch.keyHighlights || []).map((h) => (
              <Text key={h}>• {h}</Text>
            ))}
          </Space>
        </Card>

        <Card title="Links">
          <Space wrap>
            {launch.websiteUrl ? (
              <Button onClick={() => window.open(launch.websiteUrl, "_blank")}>
                Website
              </Button>
            ) : null}
            {launch.brochureUrl ? (
              <Button onClick={() => window.open(launch.brochureUrl, "_blank")}>
                Brochure
              </Button>
            ) : null}
            <Button
              type="primary"
              onClick={() =>
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(
                    launch.enquiry?.whatsappPrefill ||
                      `Hi, I’m interested in ${launch.name}.`
                  )}`,
                  "_blank"
                )
              }
            >
              WhatsApp enquiry
            </Button>
          </Space>
        </Card>
      </Space>
    </div>
  );
}
