import { createFileRoute } from "@tanstack/react-router";
import SectionHeader from "../../components/section-header";
import { cn, Pagination, Table } from "@heroui/react";
import { $api } from "../../api/openapi-client";
import LoadingScreen from "../../components/loading-screen";
import { useMemo, useState } from "react";
import type { paths } from "../../__generated__/schema";

export const Route = createFileRoute("/dashboard/alerts")({
  component: RouteComponent,
});

const ROWS_PER_PAGE = 20;
const columns = [
  { id: "timestamp", name: "Timestamp" },
  { id: "score", name: "Score" },
  { id: "segment", name: "Segment" },
  { id: "status", name: "Status" },
];

function TableDisplay({
  alerts,
}: {
  alerts: paths["/alerts"]["get"]["responses"]["200"]["content"]["application/json"]["alerts"];
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(alerts.length / ROWS_PER_PAGE);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return alerts.slice(start, start + ROWS_PER_PAGE);
  }, [alerts, page]);
  const start = (page - 1) * ROWS_PER_PAGE + 1;
  const end = Math.min(page * ROWS_PER_PAGE, alerts.length);

  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content
          aria-label="Table with pagination"
          className="min-w-[600px]"
        >
          <Table.Header columns={columns}>
            {(column) => (
              <Table.Column isRowHeader={column.id === "name"}>
                {column.name}
              </Table.Column>
            )}
          </Table.Header>
          <Table.Body items={paginatedItems}>
            {(alert) => (
              <Table.Row>
                <Table.Cell>
                  {new Date(alert.timestamp).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </Table.Cell>
                <Table.Cell>{alert.score.toFixed(5)}</Table.Cell>
                <Table.Cell>{alert.segment}</Table.Cell>
                <Table.Cell
                  className={cn(
                    alert.status === "true positive" ||
                      alert.status === "true negative"
                      ? "text-success"
                      : alert.status === "false positive" ||
                          alert.status === "fasle negative"
                        ? "text-danger"
                        : "",
                  )}
                >
                  {alert.status}
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
      <Table.Footer>
        <Pagination size="sm">
          <Pagination.Summary>
            {start} to {end} of {alerts.length} results
          </Pagination.Summary>
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous
                isDisabled={page === 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
              >
                <Pagination.PreviousIcon />
                Prev
              </Pagination.Previous>
            </Pagination.Item>
            {pages.map((p) => (
              <Pagination.Item key={p}>
                <Pagination.Link
                  isActive={p === page}
                  onPress={() => setPage(p)}
                >
                  {p}
                </Pagination.Link>
              </Pagination.Item>
            ))}
            <Pagination.Item>
              <Pagination.Next
                isDisabled={page === totalPages}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      </Table.Footer>
    </Table>
  );
}

function RouteComponent() {
  const search = Route.useSearch();

  const { data, isLoading } = $api.useQuery("get", "/alerts", {
    params: {
      query: {
        model: search.model,
        day: search.day,
      },
    },
  });

  if (isLoading || !data) return <LoadingScreen></LoadingScreen>;

  return (
    <div className="flex flex-1 flex-col items-center p-[1rem]">
      <div className="flex flex-col w-full max-w-screen-lg pb-[5rem]">
        <SectionHeader icon="siren">Alertes</SectionHeader>

        <TableDisplay
          alerts={data.alerts.map((alert, index) => ({ ...alert, id: index }))}
        ></TableDisplay>
      </div>
    </div>
  );
}
