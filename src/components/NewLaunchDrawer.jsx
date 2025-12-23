import React from "react";
import { Button, Card, Drawer, Space, Tag, Typography } from "antd";
import { Link } from "react-router-dom";

const { Text } = Typography;

export default function NewLaunchDrawer({ open, launch, onClose }) {
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
            </Space>

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

            <Space orientation="vertical" style={{ width: "100%" }}>
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
