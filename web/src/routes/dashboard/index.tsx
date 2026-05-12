import { createFileRoute } from "@tanstack/react-router";
import { $api } from "../../api/openapi-client";
import SectionHeader from "../../components/section-header";
import CardWithTitle from "../../components/card-with-header";
import DataRow from "../../components/data-row";
import LoadingScreen from "../../components/loading-screen";
import { useContext } from "react";
import { ThemeContext } from "../../context/theme-context";
import { ThemeOptions } from "../../types/theme-options";
import { cn } from "@heroui/styles";

export const Route = createFileRoute("/dashboard/")({
  component: RouteComponent,
});

function ConfusionMatrixCell({
  cell,
  tp,
  fp,
  tn,
  fn,
}: {
  cell: "TP" | "FP" | "TN" | "FN";
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}) {
  const { appliedTheme } = useContext(ThemeContext);

  const getValue = () => {
    switch (cell) {
      case "TP":
        return tp;
      case "FP":
        return fp;
      case "TN":
        return tn;
      case "FN":
        return fn;
    }
  };

  const cellOpacity = getValue() / (tp + fp + tn + fn);

  return (
    <div
      className={cn(
        "grid place-items-center h-28 rounded-xl border border-border",
        appliedTheme === ThemeOptions.LIGHT &&
          cellOpacity > 0.6 &&
          "text-accent-foreground",
      )}
      style={{
        background: `color-mix(in srgb, var(--accent), transparent ${100 - cellOpacity * 100}%)`,
      }}
    >
      <div className="text-center">
        <div className="text-xl font-bold">{getValue()}</div>
        <div className="text-xs">{cell}</div>
      </div>
    </div>
  );
}

function RouteComponent() {
  const search = Route.useSearch();

  const { data, isLoading } = $api.useQuery("post", "/predict", {
    params: {
      query: {
        model: search.model,
        day: search.day,
      },
    },
  });

  if (isLoading || !data || !data.confusion_raw)
    return <LoadingScreen></LoadingScreen>;

  return (
    <div className="flex flex-1 flex-col items-center p-[1rem]">
      <div className="flex flex-col w-full max-w-screen-lg pb-[5rem]">
        <SectionHeader icon="chart-column">Statistiques</SectionHeader>

        <div className="flex flex-col lg:flex-row gap-[1rem]">
          <div className="flex flex-1 flex-col gap-[1rem]">
            <CardWithTitle
              title="Metriques de classification"
              icon="settings-2"
            >
              <div className="flex flex-col p-[1rem]">
                <DataRow
                  name="Precision"
                  value={data.classification_metrics.precision?.toFixed(5)}
                ></DataRow>
                <DataRow
                  name="Recall"
                  value={data.classification_metrics.recall?.toFixed(5)}
                ></DataRow>
                <DataRow
                  name="F1-Score"
                  value={data.classification_metrics.f1?.toFixed(5)}
                ></DataRow>
              </div>
            </CardWithTitle>
            <CardWithTitle title="Metriques de detection" icon="settings-2">
              <div className="flex flex-col p-[1rem]">
                <DataRow
                  name="Seg. Recall"
                  value={
                    data.metrics.seg_recall != null
                      ? data.metrics.seg_recall.toFixed(2)
                      : "N/A"
                  }
                ></DataRow>
                <DataRow
                  name="Délai Median"
                  value={
                    data.metrics.median_delay_s != null
                      ? `${data.metrics.median_delay_s.toFixed(1)} s`
                      : "N/A"
                  }
                ></DataRow>
                <DataRow
                  name="Délai P90"
                  value={
                    data.metrics.p90_delay_s != null
                      ? `${data.metrics.p90_delay_s.toFixed(1)} s`
                      : "N/A"
                  }
                ></DataRow>
                <DataRow
                  name="FA/min"
                  value={
                    data.metrics.fa_per_min != null
                      ? data.metrics.fa_per_min.toFixed(5)
                      : "N/A"
                  }
                ></DataRow>
              </div>
            </CardWithTitle>
          </div>
          <div className="flex flex-1 flex-col gap-[1rem]">
            <CardWithTitle title="Matrice de confusion" icon="layout-grid">
              <div className="grid grid-cols-[auto_auto_1fr_1fr] grid-rows-[auto_auto_1fr_1fr] gap-2 pb-[1rem] pr-[1rem]">
                <div></div>
                <div></div>

                <div className="col-span-2 flex h-[2.5rem] gap-[1rem] items-center">
                  <div className="flex flex-1 h-[1px] bg-separator"></div>
                  <div className="flex text-center text-sm font-semibold">
                    Valeurs prédites
                  </div>
                  <div className="flex flex-1 h-[1px] bg-separator"></div>
                </div>

                <div className="row-span-3 w-[2.5rem] flex flex-col gap-[3.5rem] items-center">
                  <div className="flex flex-1 w-[1px] bg-separator"></div>
                  <div className="-rotate-90 text-sm font-semibold whitespace-nowrap">
                    Valeurs réelles
                  </div>
                  <div className="flex flex-1 w-[1px] bg-separator"></div>
                </div>

                <div></div>
                <div className="flex items-center justify-center font-medium">
                  Bénin
                </div>
                <div className="flex items-center justify-center font-medium">
                  Attaque
                </div>

                <div className="w-[2.5rem] flex items-center justify-center">
                  <div className="-rotate-90 text-sm font-semibold whitespace-nowrap">
                    Bénin
                  </div>
                </div>

                <ConfusionMatrixCell
                  cell="TN"
                  tp={data.confusion_raw.TP}
                  fp={data.confusion_raw.FP}
                  tn={data.confusion_raw.TN}
                  fn={data.confusion_raw.FN}
                ></ConfusionMatrixCell>

                <ConfusionMatrixCell
                  cell="FP"
                  tp={data.confusion_raw.TP}
                  fp={data.confusion_raw.FP}
                  tn={data.confusion_raw.TN}
                  fn={data.confusion_raw.FN}
                ></ConfusionMatrixCell>

                <div className="w-[2.5rem] flex items-center justify-center">
                  <div className="-rotate-90 text-sm font-semibold whitespace-nowrap">
                    Attaque
                  </div>
                </div>

                <ConfusionMatrixCell
                  cell="FN"
                  tp={data.confusion_raw.TP}
                  fp={data.confusion_raw.FP}
                  tn={data.confusion_raw.TN}
                  fn={data.confusion_raw.FN}
                ></ConfusionMatrixCell>

                <ConfusionMatrixCell
                  cell="TP"
                  tp={data.confusion_raw.TP}
                  fp={data.confusion_raw.FP}
                  tn={data.confusion_raw.TN}
                  fn={data.confusion_raw.FN}
                ></ConfusionMatrixCell>
              </div>
            </CardWithTitle>
          </div>
        </div>
      </div>
    </div>
  );
}
