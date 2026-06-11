import { createFileRoute, useNavigate } from "@tanstack/react-router";
import IndexNavbar from "../components/index-navbar";
import {
  Card,
  Button,
  Select,
  Label,
  ListBox,
  useOverlayState,
  toast,
} from "@heroui/react";
import { SectionTitle } from "../components/section-title";
import * as yup from "yup";
import { useFormik } from "formik";
import { Constants } from "../constants";
import ProcessingModal from "../components/processing-modal";
import { $api } from "../api/openapi-client";
import { Check, InfoIcon } from "lucide-react";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  const { mutate, isPending } = $api.useMutation("post", "/precompute", {
    onError() {
      toast("Erreur", {
        indicator: <InfoIcon />,
        variant: "danger",
      });
      processingModalState.close();
    },
    onSuccess() {
      toast("Success", {
        indicator: <Check />,
        variant: "success",
      });
      processingModalState.close();
      navigate({
        to: "/dashboard/timeline",
        search: {
          model: formik.values.model,
          day: formik.values.day,
        },
      });
    },
  });

  const formik = useFormik({
    initialValues: {
      model: "",
      day: "",
    },
    validationSchema: yup.object({
      model: yup.string().oneOf(Constants.MODEL_OPTIONS).required(),
      day: yup.string().oneOf(Constants.DAY_OPTIONS).required(),
    }),
    onSubmit(values) {
      processingModalState.open();
      mutate({
        params: {
          query: {
            model: values.model,
            day: values.day,
          },
        },
      });
    },
  });

  const processingModalState = useOverlayState();

  return (
    <>
      <ProcessingModal state={processingModalState}></ProcessingModal>

      <div className="flex flex-1 flex-col">
        <IndexNavbar></IndexNavbar>
        <div className="flex flex-1 justify-center items-center px-[1rem]">
          <Card className="w-full max-w-[28rem] md:p-[2rem]">
            <SectionTitle icon="trending-up-down">Prediction</SectionTitle>
            <form
              onSubmit={formik.handleSubmit}
              className="flex flex-col gap-[1rem]"
            >
              <Select
                value={formik.values.model}
                onChange={(value) => formik.setFieldValue("model", value)}
              >
                <Label>Modéle</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {Constants.MODEL_OPTIONS.map((model) => (
                      <ListBox.Item key={model} id={model} textValue={model}>
                        {model}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              <Select
                value={formik.values.day}
                onChange={(value) => formik.setFieldValue("day", value)}
              >
                <Label>Jour de validation</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {Constants.DAY_OPTIONS.map((day) => (
                      <ListBox.Item key={day} id={day} textValue={day}>
                        {day}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              <Button
                fullWidth
                type="submit"
                isPending={isPending}
                className="mt-[1rem]"
              >
                Prediction
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
