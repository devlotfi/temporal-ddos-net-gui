/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { $api } from "../../api/openapi-client";
import LoadingScreen from "../../components/loading-screen";
import SectionHeader from "../../components/section-header";
import PlotImport from "react-plotly.js";
import { Card } from "@heroui/react";
import { useContext } from "react";
import { ThemeContext } from "../../context/theme-context";
import { ThemeOptions } from "../../types/theme-options";
const Plot =
  (PlotImport as typeof PlotImport & { default?: typeof PlotImport }).default ??
  PlotImport;

export const Route = createFileRoute("/dashboard/timeline")({
  component: RouteComponent,
});

const getManualPixels = () => {
  // Get the root font size (usually 16px)
  const rootFontSize = parseFloat(
    getComputedStyle(document.documentElement).fontSize,
  );

  // Get the dynamic viewport height
  // Note: window.innerHeight can be inconsistent with dvh on mobile
  // Using a temp element (Method 1) is still safer for 'dvh'
  const dvh100 = window.innerHeight;

  return dvh100 - 17 * rootFontSize;
};

function RouteComponent() {
  const search = Route.useSearch();
  const { appliedTheme } = useContext(ThemeContext);

  const { data, isLoading } = $api.useQuery("get", "/timeline", {
    params: {
      query: {
        model: search.model,
        day: search.day,
      },
    },
  });

  if (isLoading || !data) return <LoadingScreen></LoadingScreen>;

  const renderTimelinePlot = () => {
    if (!data) return null;
    const { timestamps, scores, smoothed_scores, segments, alerts } = data;

    const traces: any[] = [
      {
        x: timestamps,
        y: scores,
        type: "scatter",
        mode: "lines",
        name: "Score calibré",
        line: { color: "#1f77b4" },
        opacity: 0.7,
      },
      {
        x: timestamps,
        y: smoothed_scores,
        type: "scatter",
        mode: "lines",
        name: "Score lissé",
        line: { color: "#d98924" },
        opacity: 0.7,
      },
      {
        x: alerts.map((a) => a.timestamp),
        y: alerts.map((a) => a.score),
        type: "scatter",
        mode: "markers",
        name: "Alertes",
        marker: { color: "red", size: 8, symbol: "x" },
      },
    ];

    // Ajouter les segments d’attaque comme formes rectangulaires
    segments.forEach((seg) => {
      traces.push({
        x: [seg.start, seg.end, seg.end, seg.start],
        y: [0, 0, 1, 1],
        type: "scatter",
        fill: "toself",
        mode: "lines",
        fillcolor: "rgba(255,127,14,0.2)",
        line: { width: 0 },
        name: seg.name,
        hoverinfo: "name",
      });
    });

    const layout: any = {
      title: `Timeline - model ${search.model} on ${search.day}`,
      paper_bgcolor: appliedTheme === ThemeOptions.DARK ? "#2b3747" : "#ffffff",
      plot_bgcolor: appliedTheme === ThemeOptions.DARK ? "#2b3747" : "#ffffff",
      font: {
        color: appliedTheme === ThemeOptions.DARK ? "#b7bdc9" : "#536077",
      },
      margin: {
        l: 40, // left
        r: 10, // right
        t: 20, // top
        b: 40, // bottom
        pad: 0, // internal padding
      },
      xaxis: {
        title: "Time",
        gridcolor:
          appliedTheme === ThemeOptions.DARK ? "#b7bdc950" : "#53607750",
        zerolinecolor:
          appliedTheme === ThemeOptions.DARK ? "#b7bdc9" : "#536077",
        linecolor: appliedTheme === ThemeOptions.DARK ? "#b7bdc9" : "#536077",
        tickcolor: appliedTheme === ThemeOptions.DARK ? "#b7bdc9" : "#536077",
      },
      yaxis: {
        title: "Score",
        range: [0, 10],
        gridcolor:
          appliedTheme === ThemeOptions.DARK ? "#b7bdc950" : "#53607750",
        zerolinecolor:
          appliedTheme === ThemeOptions.DARK ? "#b7bdc9" : "#536077",
        linecolor: appliedTheme === ThemeOptions.DARK ? "#b7bdc9" : "#536077",
        tickcolor: appliedTheme === ThemeOptions.DARK ? "#b7bdc9" : "#536077",
      },
      showlegend: true,
      height: getManualPixels(),
      shapes: [
        {
          type: "line",
          xref: "paper", // span full width of plot
          x0: 0,
          x1: 1,
          yref: "y",
          y0: 0.5,
          y1: 0.5,
          opacity: 0.5,
          line: {
            color: "red",
            width: 2,
            dash: "dash",
          },
        },
      ],
    };

    return <Plot data={traces} layout={layout} style={{}} />;
  };

  return (
    <div className="flex flex-1 flex-col items-center px-[1rem]">
      <div className="flex flex-1 flex-col w-full pb-[1rem]">
        <SectionHeader icon="calendar-range" className="pl-[2rem] py-[1rem]">
          Timeline
        </SectionHeader>

        <Card className="flex flex-1">
          <Card.Content>{renderTimelinePlot()}</Card.Content>
        </Card>
      </div>
    </div>
  );
}
