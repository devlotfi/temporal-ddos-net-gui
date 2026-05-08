import { Button, Separator } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { Home } from "lucide-react";
import Error404SVG from "./svg/Error404SVG";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 flex-col justify-center items-center px-[1rem]">
      <div className="flex flex-col items-center gap-[1rem]">
        <Error404SVG className="h-[10rem]" />
        <div className="flex text-[13pt] font-medium text-center">404</div>
        <Separator></Separator>

        <Button
          fullWidth
          variant="outline"
          onPress={() =>
            navigate({
              to: "/",
            })
          }
        >
          <Home></Home>
          Acceuil
        </Button>
      </div>
    </div>
  );
}
