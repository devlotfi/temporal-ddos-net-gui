import { Alert } from "@heroui/react";
import ErrorSVG from "./svg/ErrorSVG";

export default function ErrorScreen() {
  return (
    <div className="flex flex-1 flex-col justify-center items-center">
      <div className="flex flex-col gap-[1rem]">
        <ErrorSVG className="h-[13rem]" />
        <Alert color="danger">Erreur</Alert>
      </div>
    </div>
  );
}
