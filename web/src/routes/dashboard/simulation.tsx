import { createFileRoute, useSearch } from "@tanstack/react-router";
import SectionHeader from "../../components/section-header";
import { useFormik } from "formik";
import { $api } from "../../api/openapi-client";
import LoadingScreen from "../../components/loading-screen";
import * as yup from "yup";
import { isDateBetween } from "../../utils/is-date-between";
import { isBefore } from "../../utils/is-start-before-end";
import {
  Badge,
  Button,
  Card,
  Chip,
  Modal,
  toast,
  useOverlayState,
  type UseOverlayStateReturn,
} from "@heroui/react";
import ValidatedTextField from "../../components/validated-text-field";
import { useState } from "react";
import {
  CircleSlash2,
  InfoIcon,
  RefreshCcw,
  StepForward,
  TriangleAlert,
} from "lucide-react";
import type { paths } from "../../__generated__/schema";
import EmptySVG from "../../components/svg/EmptySVG";

export const Route = createFileRoute("/dashboard/simulation")({
  component: RouteComponent,
});

function TimelineCell({
  point,
  isActive,
  isNext,
}: {
  point: paths["/simulate"]["get"]["responses"]["200"]["content"]["application/json"]["points"][number];
  isActive: boolean;
  isNext: boolean;
}) {
  return (
    <div className="flex flex-col py-[0.5rem] h-[8rem] min-w-[10rem] max-w-[10rem] bg-surface border border-border rounded-xl">
      <div className="flex text-[13pt] justify-center">
        {point.timestamp.split(" ")[1]}
      </div>
      {point.score && isActive ? (
        <div className="flex flex-col flex-1">
          <div className="flex flex-col flex-1 justify-center">
            <div className="flex justify-center text-[10pt] opacity-70">
              Score
            </div>
            <div className="flex justify-center text-[11pt]">
              {point.score.toFixed(5)}
            </div>
          </div>
          {point.score >= 0.5 ? (
            <Chip
              variant="primary"
              color="danger"
              size="lg"
              className="self-center"
            >
              Attaque
            </Chip>
          ) : (
            <Chip variant="primary" size="lg" className="self-center">
              Bénin
            </Chip>
          )}
        </div>
      ) : isNext ? (
        <div className="flex flex-1 flex-col text-accent justify-center items-center gap-[0.5rem] opacity-70">
          <StepForward className="size-[1.5rem]"></StepForward>
          <div className="flex">Suivant</div>
        </div>
      ) : (
        <div className="flex flex-1 justify-center items-center">
          <CircleSlash2 className="size-[2rem] opacity-70"></CircleSlash2>
        </div>
      )}
    </div>
  );
}

function AlertsModal({
  alerts,
  state,
}: {
  alerts: string[];
  state: UseOverlayStateReturn;
}) {
  return (
    <Modal.Backdrop
      variant="blur"
      isOpen={state.isOpen}
      onOpenChange={state.setOpen}
    >
      <Modal.Container placement="center">
        <Modal.Dialog className="sm:max-w-[360px]">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className="bg-danger-soft text-danger-soft-foreground">
              <TriangleAlert className="size-5" />
            </Modal.Icon>
            <Modal.Heading>Alertes</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            {alerts.length ? (
              <div className="flex flex-col gap-[1rem]">
                {alerts.map((alert) => (
                  <div className="flex p-[0.5rem] pl-[1rem] bg-danger justify-between items-center text-danger-foreground rounded-xl">
                    <div className="flex">{alert}</div>
                    <TriangleAlert className="size-[1.8rem]"></TriangleAlert>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-[1rem] py-[2rem]">
                <EmptySVG className="h-[8rem]"></EmptySVG>
                <div className="flex text-[15pt]">Pas d'alertes</div>
              </div>
            )}
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function SimulationTimeline({
  simulation,
}: {
  simulation: paths["/simulate"]["get"]["responses"]["200"]["content"]["application/json"];
}) {
  const search = useSearch({ from: "/dashboard" });
  const alertK = search.model === "01-12-cic2019" ? 3 : 2;
  const [currentAlertK, setCurrentAlertK] = useState<number>(alertK);
  const [cooldown, setCooldown] = useState<number>(0);
  const [index, setIndex] = useState<number>(30);
  const [alerts, setAlerts] = useState<string[]>([]);
  const alertsModalState = useOverlayState();

  return (
    <>
      <AlertsModal alerts={alerts} state={alertsModalState}></AlertsModal>

      <div className="flex flex-1 flex-col">
        <div className="flex mb-[1rem] justify-between w-full max-w-screen-md self-center">
          <Badge.Anchor>
            <Button
              onPress={() => alertsModalState.open()}
              variant="outline"
              className="bg-surface"
            >
              Alertes <TriangleAlert></TriangleAlert>
            </Button>
            <Badge color={alerts.length ? "danger" : "default"}>
              {alerts.length}
            </Badge>
          </Badge.Anchor>

          <div className="flex items-center gap-[0.5rem]">
            <Chip size="lg" className="bg-surface border border-border">
              K = {alertK}
            </Chip>
            <Chip size="lg" className="bg-surface border border-border">
              Cooldown = {cooldown}s
            </Chip>
          </div>

          <Button
            onPress={() => {
              const nextPoint = simulation.points[index - 1];
              if (nextPoint.score && nextPoint.score >= 0.5 && cooldown < 1) {
                if (currentAlertK - 1 < 1) {
                  setAlerts([...alerts, nextPoint.timestamp]);
                  setCurrentAlertK(alertK);
                  setCooldown(30);
                } else {
                  setCurrentAlertK(currentAlertK - 1);
                }
              } else {
                if (cooldown >= 1) {
                  setCooldown(cooldown - 1);
                }
                setCurrentAlertK(alertK);
              }
              setIndex(index + 1);
            }}
          >
            Suivant <StepForward></StepForward>
          </Button>
        </div>
        <div className="flex relative justify-end max-w-[calc(100dvw-2rem)] h-[10rem] items-center overflow-x-hidden">
          <div
            className="flex absolute h-full w-full z-10 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--background), transparent 20%)",
            }}
          ></div>

          <div className="flex absolute right-[10.4rem] flex-col h-[9.3rem] min-w-[11.3rem] max-w-[12rem] border-[3px] border-accent rounded-3xl z-10"></div>

          <div
            className="flex gap-[1rem] duration-300 transition-[margin]"
            style={{
              marginRight: `-${(simulation.points.length - 1 - index) * (10 + 1)}rem`,
            }}
          >
            {simulation.points.map((point, i) => (
              <TimelineCell
                key={`${point.timestamp}-i`}
                point={point}
                isActive={
                  point !== undefined &&
                  point.timestamp !== undefined &&
                  simulation.points[index - 1] !== undefined &&
                  simulation.points[index - 1].timestamp !== undefined &&
                  isBefore(
                    point.timestamp,
                    simulation.points[index - 1].timestamp,
                  ) &&
                  i >= 29
                }
                isNext={
                  point !== undefined &&
                  point.timestamp !== undefined &&
                  simulation.points[index] !== undefined &&
                  simulation.points[index].timestamp !== undefined &&
                  point.timestamp === simulation.points[index].timestamp
                }
              ></TimelineCell>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Simulation({
  start_ts,
  end_ts,
}: {
  start_ts: string;
  end_ts: string;
}) {
  const search = useSearch({ from: "/dashboard" });

  const formik = useFormik({
    initialValues: {
      start_ts: start_ts || "",
      end_ts: end_ts || "",
    },
    validationSchema: yup.object({
      start_ts: yup
        .string()
        .required("Start date is required")
        .test(
          "start-range",
          "Start date must be between allowed range",
          (value) => {
            if (!value) return false;

            return isDateBetween(value, start_ts, end_ts);
          },
        ),

      end_ts: yup
        .string()
        .required("End date is required")
        .test(
          "end-range",
          "End date must be between allowed range",
          (value) => {
            if (!value) return false;

            return isDateBetween(value, start_ts, end_ts);
          },
        )
        .test(
          "start-before-end",
          "End date must be after start date",
          function (endValue) {
            const { start_ts } = this.parent;

            if (!start_ts || !endValue) {
              return false;
            }

            return isBefore(start_ts, endValue);
          },
        ),
    }),
    onSubmit(values) {
      console.log(values);
      simulationMutation.mutate({
        params: {
          query: {
            model: search.model,
            day: search.day,
            start_ts: values.start_ts,
            end_ts: values.end_ts,
          },
        },
      });
    },
  });

  const simulationMutation = $api.useMutation("get", "/simulate", {
    onError() {
      toast("Erreur", {
        indicator: <InfoIcon />,
        variant: "danger",
      });
    },
  });

  return (
    <div className="flex flex-col flex-1 gap-[1rem]">
      <Card className="max-w-screen-md w-full self-center">
        <Card.Content>
          <form
            onSubmit={formik.handleSubmit}
            className="flex flex-col gap-[1rem]"
          >
            <div className="flex gap-[1rem]">
              <ValidatedTextField
                formik={formik}
                name="start_ts"
                textFieldProps={{ isRequired: true }}
                labelProps={{ children: "Debut" }}
                inputProps={{ placeholder: "Seconde de debut" }}
              ></ValidatedTextField>
              <ValidatedTextField
                formik={formik}
                name="end_ts"
                textFieldProps={{ isRequired: true }}
                labelProps={{ children: "Fin" }}
                inputProps={{ placeholder: "Seconde de fin" }}
              ></ValidatedTextField>
            </div>

            <Button
              fullWidth
              type="submit"
              isPending={simulationMutation.isPending}
            >
              Charger <RefreshCcw></RefreshCcw>
            </Button>
          </form>
        </Card.Content>
      </Card>

      {simulationMutation.data ? (
        <SimulationTimeline
          simulation={simulationMutation.data}
        ></SimulationTimeline>
      ) : (
        <div className="flex flex-col items-center p-[2rem] gap-[1rem]">
          <RefreshCcw className="size-[3rem] text-accent"></RefreshCcw>
          <div className="flex">Veillez charger les donnés en premier</div>
        </div>
      )}
    </div>
  );
}

function RouteComponent() {
  const search = useSearch({ from: "/dashboard" });

  const boundsQuery = $api.useQuery("get", "/timeline_bounds", {
    params: {
      query: {
        day: search.day,
      },
    },
  });

  return (
    <div className="flex flex-1 flex-col items-center px-[1rem]">
      <div className="flex flex-1 flex-col w-full pb-[1rem]">
        <div className="flex w-full self-center max-w-screen-md">
          <SectionHeader icon="play" className="py-[2rem]">
            Simulation
          </SectionHeader>
        </div>

        {boundsQuery.isLoading || !boundsQuery.data ? (
          <LoadingScreen></LoadingScreen>
        ) : (
          <Simulation
            start_ts={boundsQuery.data.first_timestamp}
            end_ts={boundsQuery.data.last_timestamp}
          ></Simulation>
        )}
      </div>
    </div>
  );
}
